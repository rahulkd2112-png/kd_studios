const { prisma } = require("../lib/prisma");
const { runtimeState } = require("../lib/runtime-state");
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
const { isDatabaseUnavailableError } = require("../lib/error-detection");

let localDevStore = {
  isActive: () => false,
  matchesAdminCredentials: () => false,
  getAdminUser: () => null,
  issueOtp: () => "000000",
  verifyOtpForAdmin: () => false,
  createSession: () => ({ tokenId: null, expiresAt: null }),
  getSession: () => null,
  revokeSession: () => {}
};

try {
  localDevStore = require("./local-dev-store");
} catch (error) {
  localDevStore = {
    isActive: () => false,
    matchesAdminCredentials: () => false,
    getAdminUser: () => null,
    issueOtp: () => "000000",
    verifyOtpForAdmin: () => false,
    createSession: () => ({ tokenId: null, expiresAt: null }),
    getSession: () => null,
    revokeSession: () => {}
  };
}

const DUMMY_PASSWORD_HASH =
  "$2b$12$wjpNzQ2.rs1.ghqEaBBEl./PPjvMGZ6jVEc23v6Y7HSO4lH7rXE/u";

function markDatabaseOffline(error) {
  runtimeState.databaseReady = false;
  runtimeState.databaseError = error;
}

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

  if (localDevStore.isActive()) {
    if (!localDevStore.matchesAdminCredentials(email, password)) {
      throw new Error("Invalid email or password.");
    }
    return createLocalSessionResponse(localDevStore.getAdminUser());
  }

  try {
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
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      markDatabaseOffline(error);
      throw error;
    }

    throw error;
  }
}

async function requestAdminOtp(payload) {
  const email = sanitizeText(payload.email, 160).toLowerCase();
  const password = String(payload.password || "");

  // The local development fake OTP branch is only for truly offline/no-email
  // development worlds. If SMTP credentials are configured, the service must
  // skip the fake branch and proceed with the real database-backed email route.
  const emailConfigured = Boolean(config.emailUser && config.emailPass);
  if (localDevStore.isActive() && !emailConfigured) {
    if (!localDevStore.matchesAdminCredentials(email, password)) {
      throw new Error("Invalid admin credentials.");
    }
    return {
      message: "Development verification code ready.",
      devOtp: localDevStore.issueOtp(email)
    };
  }

  try {
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
    const resendCooldownMin = Number(process.env.ADMIN_OTP_RESEND_COOLDOWN_MINUTES || 0);
    const cooldownMs = Number.isFinite(resendCooldownMin) ? resendCooldownMin * 60 * 1000 : 0;
    const recentExists = await prisma.adminOtp.findFirst({
      where: {
        userId: user.id,
        createdAt: { gt: new Date(now.getTime() - cooldownMs) },
        consumedAt: null
      },
      orderBy: { createdAt: "desc" }
    });

    if (recentExists && cooldownMs > 0) {
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

    // In development, if email is not set up, return the OTP directly for convenience.
    if (config.nodeEnv === "development" && (!config.emailUser || !config.emailPass)) {
      console.warn("*********************************************************************");
      console.warn("**** ADMIN LOGIN: EMAIL_USER or EMAIL_PASS not set in .env       ****");
      console.warn(`**** Sending OTP via console for convenience: ${code}              ****`);
      console.warn("*********************************************************************");
      return {
        message: "DEV ONLY: OTP sent to console instead of email.",
        skipOtp: false,
        devOtp: code // For frontend testing convenience
      };
    }

    if (!config.emailUser || !config.emailPass) {
      throw new Error("Admin login requires email delivery to be configured. Please set EMAIL_USER and EMAIL_PASS in your environment variables.");
    }

    try {
      await sendEmailOtp({ toEmail: user.email, otp: code });
    } catch (error) {
      console.error("Failed to send admin OTP email:", error);
      // Invalidate the OTP to prevent retries with a failed email
      await prisma.adminOtp.update({
        where: { id: record.id },
        data: { consumedAt: new Date() }
      });
      throw new Error("Failed to send admin verification email. Check email provider credentials.");
    }

    return {
      message: "A one-time admin verification code has been sent to the admin email.",
      skipOtp: false
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      markDatabaseOffline(error);
      throw error;
    }

    throw error;
  }
}

async function verifyAdminOtpAndLogin(payload) {
  const email = sanitizeText(payload.email, 160).toLowerCase();
  const password = String(payload.password || "");
  const otp = sanitizeText(payload.otp, 32);

  const emailConfigured = Boolean(config.emailUser && config.emailPass);
  if (localDevStore.isActive() && !emailConfigured) {
    if (!localDevStore.matchesAdminCredentials(email, password) || !localDevStore.verifyOtpForAdmin(email, otp)) {
      throw new Error("Invalid admin verification code.");
    }
    return createLocalSessionResponse(localDevStore.getAdminUser());
  }

  try {
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
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      markDatabaseOffline(error);
      throw error;
    }

    throw error;
  }
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

function createLocalSessionResponse(user) {
  const { tokenId, expiresAt } = localDevStore.createSession();
  const token = createAuthToken({
    sub: user.id,
    sid: tokenId,
    role: user.role,
    email: user.email
  });

  return { token, user: serializeUser(user), expiresAt };
}

async function authenticateRequest(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return null;
  }

  const decoded = verifyAuthToken(token);
  if (localDevStore.isActive()) {
    const session = localDevStore.getSession(decoded.sid);
    if (!session) return null;
    return {
      token,
      session,
      user: serializeUser(session.user),
      userRecord: session.user
    };
  }
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
  if (localDevStore.isActive()) {
    localDevStore.revokeSession(auth.session.tokenId);
    return;
  }
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
