const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "change-this-secret",
  otpTtlMinutes: Number(process.env.ADMIN_OTP_TTL_MINUTES || 10),
  registrationOtpMaxAttempts: Number(process.env.REGISTRATION_OTP_MAX_ATTEMPTS || 5),
  passwordResetOtpMaxAttempts: Number(process.env.PASSWORD_RESET_OTP_MAX_ATTEMPTS || 5),
  adminOtpMaxAttempts: Number(process.env.ADMIN_OTP_MAX_ATTEMPTS || 5),
  passwordResetOtpTtlMinutes: Number(process.env.PASSWORD_RESET_OTP_TTL_MINUTES || 15),
  emailUser: process.env.EMAIL_USER || "",
  emailPass: String(process.env.EMAIL_PASS || "").replace(/\s+/g, ""),
  emailFrom: process.env.EMAIL_FROM || "",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "*",
  trustProxy: process.env.TRUST_PROXY === "true",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  socketPath: process.env.SOCKET_PATH || "/ws",
  admin: {
    name: process.env.ADMIN_NAME || "KD Studios Admin",
    email: (process.env.ADMIN_EMAIL || "admin@kdstudios.local").toLowerCase(),
    phone: process.env.ADMIN_PHONE || "",
    password: process.env.ADMIN_PASSWORD || ""
  },
  databaseUrl: process.env.DATABASE_URL || "",
  rootDir: path.resolve(__dirname, "..", "..")
};
