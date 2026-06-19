const { prisma } = require("../lib/prisma");
const config = require("../config");
const { sanitizeText, isValidEmail, validatePassword } = require("../lib/validation");
const { hashOtp, verifyOtp, generateOtpCode, hashPassword } = require("../lib/security");
const { sendEmailOtp } = require("../lib/email");

function normalizeEmail(email) {
  return sanitizeText(email, 160).toLowerCase();
}

async function requestRegistrationOtp(payload) {
  const name = sanitizeText(payload.name, 120);
  const email = normalizeEmail(payload.email);
  const phone = sanitizeText(payload.phone, 40) || null;

  if (!name) throw new Error("Name is required.");
  if (!isValidEmail(email)) throw new Error("A valid email address is required.");

  const password = String(payload.password || "");
  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(passwordError);

  // Don’t reveal whether account exists
  // Allow re-request OTP (but rotate code) to same email
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + config.otpTtlMinutes * 60 * 1000);

  // Ensure config has a safe default
  const maxAttempts =
    typeof config.registrationOtpMaxAttempts === "number" &&
    Number.isFinite(config.registrationOtpMaxAttempts)
      ? config.registrationOtpMaxAttempts
      : 5;

  // Consume any existing unconsumed OTPs (prevents multiple valid codes)
  await prisma.registrationOtp.updateMany({
    where: { email, consumedAt: null },
    data: { consumedAt: new Date() }
  });

  await prisma.registrationOtp.create({
    data: {
      email,
      codeHash: hashOtp(code),
      expiresAt,
      attempts: 0
    }
  });

  // Send through the configured SMTP account without logging the OTP.
  try {
    await sendEmailOtp({ toEmail: email, otp: code });
  } catch (error) {
    await prisma.registrationOtp.updateMany({
      where: { email, consumedAt: null },
      data: { consumedAt: new Date() }
    });
    throw error;
  }

  return {
    message: "OTP sent to your email.",
    email,
    expiresAt
  };
}

async function verifyRegistrationOtpAndRegister(payload) {
  const email = normalizeEmail(payload.email);
  const otp = sanitizeText(payload.otp, 12);

  if (!isValidEmail(email)) throw new Error("A valid email address is required.");
  if (!otp) throw new Error("OTP is required.");

  const name = sanitizeText(payload.name, 120);
  const phone = sanitizeText(payload.phone, 40) || null;
  const password = String(payload.password || "");

  if (!name) throw new Error("Name is required.");
  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(passwordError);

  const record = await prisma.registrationOtp.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" }
  });

  if (!record) {
    throw new Error("OTP expired or unavailable. Please request a new one.");
  }

  if (record.expiresAt < new Date()) {
    throw new Error("OTP expired. Please request a new one.");
  }

  const maxAttempts =
    typeof config.registrationOtpMaxAttempts === "number" &&
    Number.isFinite(config.registrationOtpMaxAttempts)
      ? config.registrationOtpMaxAttempts
      : 5;

  // Attempts control
  if (record.attempts >= maxAttempts) {

    // Consume it to prevent further brute force
    await prisma.registrationOtp.update({
      where: { id: record.id },
      data: { consumedAt: new Date() }
    });
    throw new Error("OTP attempt limit reached. Please request a new OTP.");
  }

  if (!verifyOtp(otp, record.codeHash)) {
    await prisma.registrationOtp.update({
      where: { id: record.id },
      data: { attempts: record.attempts + 1 }
    });

    throw new Error("Invalid OTP.");
  }

  // Mark consumed
  await prisma.registrationOtp.update({
    where: { id: record.id },
    data: { consumedAt: new Date() }
  });

  // Now finalize registration
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("Account already exists. Please login instead.");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash
    }
  });

  const { createTokenId, createAuthToken, buildSessionExpiry } = require("../lib/security");
  const tokenId = createTokenId();
  const expiresAt = buildSessionExpiry();

  await prisma.session.create({
    data: {
      tokenId,
      expiresAt,
      userId: user.id
    }
  });

  const token = createAuthToken({
    sub: user.id,
    sid: tokenId,
    role: user.role,
    email: user.email
  });

  return {
    message: "Registration successful.",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isBlocked: user.isBlocked,
      blockedReason: user.blockedReason,
      createdAt: user.createdAt
    }
  };
}

module.exports = {
  requestRegistrationOtp,
  verifyRegistrationOtpAndRegister
};

