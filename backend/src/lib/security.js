const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../config");

const SESSION_TTL_DAYS = 7;

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function createTokenId() {
  return crypto.randomUUID();
}

function hashOtp(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function verifyOtp(code, expectedHash) {
  const actual = Buffer.from(hashOtp(code), "hex");
  const expected = Buffer.from(String(expectedHash || ""), "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function createAuthToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    algorithm: "HS256",
    issuer: "kd-studios-api",
    audience: "kd-studios-web",
    expiresIn: `${SESSION_TTL_DAYS}d`
  });
}

function verifyAuthToken(token) {
  return jwt.verify(token, config.jwtSecret, {
    algorithms: ["HS256"],
    issuer: "kd-studios-api",
    audience: "kd-studios-web"
  });
}

function buildSessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return expiresAt;
}

module.exports = {
  hashPassword,
  verifyPassword,
  createTokenId,
  hashOtp,
  verifyOtp,
  generateOtpCode,
  createAuthToken,
  verifyAuthToken,
  buildSessionExpiry
};
