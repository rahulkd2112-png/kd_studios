const {
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
} = require("../controllers/auth-controller");

async function handleAuthRoutes(req, res) {
  const { pathname } = new URL(req.url, "http://localhost");

  if (req.method === "POST" && pathname === "/api/auth/register") {
    // Starts OTP registration flow (frontend will show OTP screen)
    await register(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/register/otp/request") {
    await requestRegistrationOtpController(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/register/otp/verify") {
    await verifyRegistrationOtpController(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    await login(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/admin/request-otp") {
    await requestAdminOtpController(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/admin/verify-otp") {
    await verifyAdminOtpController(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/password-reset/request") {
    await requestPasswordResetController(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/password-reset/confirm") {
    await confirmPasswordResetController(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/logout") {
    await logout(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/api/auth/me") {
    await me(req, res);
    return true;
  }

  return false;
}

module.exports = {
  handleAuthRoutes
};
