const EMAIL_REGEX =
  /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return "Email is required";
  }

  const normalized = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalized)) {
    return "Please provide a valid email address";
  }

  return null;
};

const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return "Password is required";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (!PASSWORD_REGEX.test(password)) {
    return "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
  }

  return null;
};

const validateName = (name) => {
  if (!name || typeof name !== "string" || !name.trim()) {
    return "Name is required";
  }

  if (name.trim().length < 2) {
    return "Name must be at least 2 characters long";
  }

  return null;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
};
