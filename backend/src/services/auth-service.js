const { prisma } = require("../lib/prisma");
const {
  hashPassword,
  verifyPassword,
  hashOtp,
  verifyOtp,
  generateOtpCode,
  createTokenId,
  createAuthToken,
  verifyAuthToken,
  buildSessionExpiry
} = require("../lib/security");
const { sanitizeText, isValidEmail, validatePassword } = require("../lib/validation");
const { sendEmailOtp } = require("../lib/email");
const config = require("../config");
const DUMMY_PASSWORD_HASH =
  "$2b$12$wjpNzQ2.rs1.ghqEaBBEl./PPjvMGZ6jVEc23v6Y7HSO4lH7rXE/u";

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isBlocked: user.isBlocked,
    blockedReason: user.blockedReason,
    createdAt: user.createdAt
  };
}

async function registerUser(payload) {
  const name = sanitizeText(payload.name, 120);
  const email = sanitizeText(payload.email, 160).toLowerCase();
  const password = String(payload.password || "");
  if (!isValidEmail(email)) {
    throw new Error("A valid email address is required.");
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: sanitizeText(payload.phone, 40) || null,
      passwordHash
    }
  });

  return createSessionResponse(user);
}

async function loginUser(payload) {
  const email = sanitizeText(payload.email, 160).toLowerCase();
  const password = String(payload.password || "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    throw new Error("Invalid email or password.");
  }

  if (user.isBlocked) {
    throw new Error(user.blockedReason || "Your account has been blocked by admin.");
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    throw new Error("Invalid email or password.");
  }

  return createSessionResponse(user);
}

async function requestAdminOtp(payload) {
  const email = sanitizeText(payload.email, 160).toLowerCase();
  const password = String(payload.password || "");
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== "ADMIN") {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    throw new Error("Invalid admin credentials.");
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    throw new Error("Invalid admin password.");
  }

  const now = new Date();
  const code = generateOtpCode();
  const expiresAt = new Date(now.getTime() + config.otpTtlMinutes * 60 * 1000);

  // Resend rate limit: prevent spamming OTP emails.
  // Allow at most 1 fresh admin OTP per user within ADMIN_OTP_RESEND_COOLDOWN_MINUTES.
  const resendCooldownMin = Number(process.env.ADMIN_OTP_RESEND_COOLDOWN_MINUTES || 2);
  const cooldownMs = Number.isFinite(resendCooldownMin) ? resendCooldownMin * 60 * 1000 : 2 * 60 * 1000;
  const recentExists = await prisma.adminOtp.findFirst({
    where: {
      userId: user.id,
      createdAt: { gt: new Date(now.getTime() - cooldownMs) },
      consumedAt: null
    },
    orderBy: { createdAt: "desc" }
  });

  if (recentExists) {
    throw new Error("OTP already sent recently. Please wait and try again.");
  }

  // Invalidate existing unconsumed OTPs and rotate the code.
  await prisma.adminOtp.updateMany({
    where: { userId: user.id, consumedAt: null },
    data: { consumedAt: now }
  });

  const record = await prisma.adminOtp.create({
    data: {
      userId: user.id,
      codeHash: hashOtp(code),
      expiresAt
    }
  });

  try {
    await sendEmailOtp({ toEmail: user.email, otp: code });
  } catch (error) {
    await prisma.adminOtp.update({
      where: { id: record.id },
      data: { consumedAt: new Date() }
    });
    throw error;
  }

  return {
    message: "A one-time admin verification code has been sent to the admin email."
  };
}

async function verifyAdminOtpAndLogin(payload) {
  const email = sanitizeText(payload.email, 160).toLowerCase();
  const password = String(payload.password || "");
  const otp = sanitizeText(payload.otp, 32);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== "ADMIN") {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    throw new Error("Invalid admin credentials.");
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    throw new Error("Invalid admin password.");
  }

  const record = await prisma.adminOtp.findFirst({
    where: { userId: user.id, consumedAt: null },
    orderBy: { createdAt: "desc" }
  });
  if (!record || record.expiresAt < new Date()) {
    throw new Error("Admin verification code expired or unavailable.");
  }
  if (record.attempts >= config.adminOtpMaxAttempts) {
    await prisma.adminOtp.update({
      where: { id: record.id },
      data: { consumedAt: new Date() }
    });
    throw new Error("Admin verification attempt limit reached.");
  }
  if (!verifyOtp(otp, record.codeHash)) {
    await prisma.adminOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } }
    });
    throw new Error("Invalid admin verification code.");
  }

  await prisma.adminOtp.update({
    where: { id: record.id },
    data: { consumedAt: new Date() }
  });
  return createSessionResponse(user);
}

async function createSessionResponse(user) {
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
    token,
    user: serializeUser(user)
  };
}

async function authenticateRequest(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return null;
  }

  const decoded = verifyAuthToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenId: decoded.sid },
    include: { user: true }
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }

  if (session.user.isBlocked) {
    return null;
  }

  return {
    token,
    session,
    user: serializeUser(session.user),
    userRecord: session.user
  };
}

async function logoutUser(auth) {
  await prisma.session.update({
    where: { tokenId: auth.session.tokenId },
    data: {
      revokedAt: new Date()
    }
  });
}

module.exports = {
  registerUser,
  loginUser,
  requestAdminOtp,
  verifyAdminOtpAndLogin,
  authenticateRequest,
  logoutUser,
  serializeUser
};
