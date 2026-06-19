const { sendJson, parseJsonBody } = require("../lib/http");
const { requireFields } = require("../lib/validation");
const { requireAuth } = require("../middleware/auth");
const {
  loginUser,
  requestAdminOtp,
  verifyAdminOtpAndLogin,
  logoutUser
} = require("../services/auth-service");

const {
  requestRegistrationOtp,
  verifyRegistrationOtpAndRegister
} = require("../services/registration-otp-service");
const { requestPasswordReset, confirmPasswordReset } = require("../services/password-reset-service");
const { logAuditEvent } = require("../services/audit-service");
const config = require("../config");

async function register(req, res) {
  const body = await parseJsonBody(req);
  const missing = requireFields(["name", "email", "password"], body);

  if (missing.length) {
    sendJson(res, 400, { error: `Missing required fields: ${missing.join(", ")}` });
    return;
  }

  try {
    const result = await requestRegistrationOtp(body);
    await logAuditEvent({
      action: "user.registration_otp_requested",
      entityType: "RegistrationOtp",
      entityId: null,
      description: `OTP requested for ${result.email}.`,
      actorId: null,
      ipAddress: req.context.ipAddress
    });

    // Frontend will show OTP screen. No auth token yet.
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

async function requestRegistrationOtpController(req, res) {
  const body = await parseJsonBody(req);
  try {
    const result = await requestRegistrationOtp(body);
    await logAuditEvent({
      action: "user.registration_otp_requested",
      entityType: "RegistrationOtp",
      entityId: null,
      description: `OTP requested for ${result.email}.`,
      actorId: null,
      ipAddress: req.context.ipAddress
    });
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

async function verifyRegistrationOtpController(req, res) {
  const body = await parseJsonBody(req);
  const missing = requireFields(["email", "otp", "name", "password"], body);

  if (missing.length) {
    sendJson(res, 400, { error: `Missing required fields: ${missing.join(", ")}` });
    return;
  }

  try {
    const session = await verifyRegistrationOtpAndRegister(body);
    await logAuditEvent({
      action: "user.registered",
      entityType: "User",
      entityId: session.user.id,
      description: `User ${session.user.email} registered after OTP verification.`,
      actorId: session.user.id,
      ipAddress: req.context.ipAddress
    });

    sendJson(res, 201, session);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

async function login(req, res) {
  const body = await parseJsonBody(req);
  const missing = requireFields(["email", "password"], body);

  if (missing.length) {
    sendJson(res, 400, { error: `Missing required fields: ${missing.join(", ")}` });
    return;
  }



  try {
    const session = await loginUser(body);
    await logAuditEvent({
      action: "user.logged_in",
      entityType: "Session",
      entityId: session.user.id,
      description: `User ${session.user.email} logged in.`,
      actorId: session.user.id,
      ipAddress: req.context.ipAddress
    });

    sendJson(res, 200, {
      message: "Login successful.",
      ...session
    });
  } catch (error) {
    sendJson(res, 401, { error: error.message });
  }
}

async function requestAdminOtpController(req, res) {
  const body = await parseJsonBody(req);
  try {
    const result = await requestAdminOtp(body);
    await logAuditEvent({
      action: "admin.otp_requested",
      entityType: "AdminOtp",
      description: "Admin email verification code requested.",
      ipAddress: req.context.ipAddress
    });

    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

async function verifyAdminOtpController(req, res) {
  const body = await parseJsonBody(req);
  try {
    const session = await verifyAdminOtpAndLogin(body);
    await logAuditEvent({
      action: "admin.logged_in",
      entityType: "Session",
      entityId: session.user.id,
      description: `Admin ${session.user.email} logged in through email verification.`,
      actorId: session.user.id,
      ipAddress: req.context.ipAddress
    });

    sendJson(res, 200, {
      message: "Admin verification code accepted. Login successful.",
      ...session
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

async function logout(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) {
    return;
  }

  await logoutUser(auth);
  await logAuditEvent({
    action: "user.logged_out",
    entityType: "Session",
    entityId: auth.user.id,
    description: `User ${auth.user.email} logged out.`,
    actorId: auth.user.id,
    ipAddress: req.context.ipAddress
  });
  sendJson(res, 200, { message: "Logout successful." });
}

async function me(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) {
    return;
  }

  sendJson(res, 200, { user: auth.user });
}

async function requestPasswordResetController(req, res) {
  const body = await parseJsonBody(req);
  try {
    const result = await requestPasswordReset(body);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

async function confirmPasswordResetController(req, res) {
  const body = await parseJsonBody(req);
  try {
    const result = await confirmPasswordReset(body);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

module.exports = {
  register,
  login,
  requestAdminOtpController,
  verifyAdminOtpController,
  requestRegistrationOtpController,
  verifyRegistrationOtpController,
  logout,
  me,
  requestPasswordResetController,
  confirmPasswordResetController
};
