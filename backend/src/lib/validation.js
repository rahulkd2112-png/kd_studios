function sanitizeText(value, maxLength = 1000) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function requireFields(fields, payload) {
  const missing = fields.filter((field) => !sanitizeText(payload[field]));
  return missing;
}

function isValidEmail(email) {
  const value = sanitizeText(email, 160);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePassword(password) {
  const value = String(password || "");
  if (value.length < 12) {
    return "Password must be at least 12 characters long.";
  }
  if (value.length > 128) {
    return "Password must not exceed 128 characters.";
  }
  return null;
}

module.exports = {
  sanitizeText,
  requireFields,
  isValidEmail,
  validatePassword
};
