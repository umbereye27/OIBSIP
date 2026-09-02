const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { generateSecureToken, hashToken } = require("../utils/cryptoToken");
const {
  validateEmail,
  validatePassword,
  validateName,
} = require("../utils/validators");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const nameError = validateName(name);
    if (nameError) {
      return res.status(400).json({ success: false, message: nameError });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ success: false, message: emailError });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const verificationToken = generateSecureToken();
    const hashedVerificationToken = hashToken(verificationToken);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "USER",
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    try {
      await sendVerificationEmail(
        user.email,
        user.name,
        verificationToken
      );
    } catch (emailError) {
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        success: false,
        message: "Registration failed. Could not send verification email.",
      });
    }

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      data: {
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toSafeObject(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ success: false, message: emailError });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a verification link has been sent.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    const verificationToken = generateSecureToken();

    user.emailVerificationToken = hashToken(verificationToken);
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(user.email, user.name, verificationToken);

    res.status(200).json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ success: false, message: emailError });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    const resetToken = generateSecureToken();

    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: "Could not send password reset email. Please try again later.",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires +password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token",
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user.toSafeObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getMe,
};
