const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const mailTransporter = getTransporter();

  const mailOptions = {
    from: `"Pizza Delivery" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  };

  await mailTransporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  await sendEmail({
    to: email,
    subject: "Verify Your Email - Pizza Delivery",
    html: `
      <h2>Welcome to Pizza Delivery, ${name}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" style="display:inline-block;padding:12px 24px;background:#e63946;color:#fff;text-decoration:none;border-radius:6px;">
        Verify Email
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link expires in 24 hours.</p>
    `,
    text: `Welcome to Pizza Delivery, ${name}! Verify your email: ${verificationUrl}. This link expires in 24 hours.`,
  });
};

const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  await sendEmail({
    to: email,
    subject: "Password Reset - Pizza Delivery",
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#e63946;color:#fff;text-decoration:none;border-radius:6px;">
        Reset Password
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>
    `,
    text: `Hi ${name}, reset your password: ${resetUrl}. This link expires in 1 hour.`,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
