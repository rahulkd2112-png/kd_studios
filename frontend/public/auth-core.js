/* ============================================================
KD STUDIOS — Auth Core (Authentication & User Management)
============================================================ */

var { projects, apiBaseUrl, socketUrl, storageKey } = window.KD_APP_DATA || {};

/* ---- DOM ELEMENTS (Auth-related) ---- */
const loginForm = document.getElementById("loginForm");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminOtpForm = document.getElementById("adminOtpForm");
const registerForm = document.getElementById("registerForm");
const registerOtpForm = document.getElementById("registerOtpForm");
const backToRegisterBtn = document.getElementById("backToRegisterBtn");
const passwordResetRequestForm = document.getElementById("passwordResetRequestForm");
const passwordResetConfirmForm = document.getElementById("passwordResetConfirmForm");
const passwordResetBackButton = document.getElementById("passwordResetBackBtn");
const authMessage = document.getElementById("authMessage");
const logoutButton = document.getElementById("logoutButton");
const logoutHeaderButton = document.getElementById("logoutHeaderButton");
const authTabs = document.querySelectorAll("[data-auth-tab]");

/* ---- STATE ---- */
const state = {
  auth: loadAuth(),
  socket: null
};

/* ---- AUTH HELPERS ---- */
const userCache = new Map(); // Cache for user data to avoid redundant /auth/me calls
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function loadAuth() {
  try {
    localStorage.removeItem(storageKey);
    const raw = sessionStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAuth(auth) {
  state.auth = auth;
  if (auth) {
    sessionStorage.setItem(storageKey, JSON.stringify(auth));
    // Cache user data
    if (auth.user) {
      userCache.set(auth.user.id, {
        data: auth.user,
        timestamp: Date.now()
      });
    }
  } else {
    sessionStorage.removeItem(storageKey);
  }
}

function getCachedUser(userId) {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < USER_CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function clearUserCache(userId) {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}

function getAuthHeaders() {
  if (!state.auth?.token) {
    return {};
  }
  return {
    Authorization: `Bearer ${state.auth.token}`
  };
}

async function apiFetch(path, options = {}) {
  const normalizedPath = path.startsWith("/api/")
    ? path
    : `/api${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(`${apiBaseUrl}${normalizedPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "Request failed.");
    error.statusCode = response.status;
    throw error;
  }
  return result;
}

function setMessage(element, text, type = "") {
  if (!element) return;
  element.className = "form-message";
  element.textContent = text;
  if (type) element.classList.add(type);
}

function clearMessage(element) {
  if (!element) return;
  element.className = "form-message";
  element.textContent = "";
}

/* ---- AUTH UI ---- */
function renderAuthState() {
  const isLoggedIn = !!state.auth?.token;
  const user = state.auth?.user;

  const authContainers = document.querySelectorAll(".museum-auth-actions, .header-auth");
  authContainers.forEach((container) => {
    if (isLoggedIn) {
      const isAdmin = user?.role === "ADMIN";
      container.innerHTML = `
        <a class="museum-btn museum-btn-outline" href="./dashboard.html">Dashboard</a>
        ${isAdmin ? '<a class="museum-btn museum-btn-outline" href="./app-manager.html">App Pages</a>' : ""}
        <span class="user-greeting">Hi, ${user?.name || "User"}</span>
        <button id="logoutHeaderButton" class="museum-btn museum-btn-primary" type="button">Logout</button>
      `;
    } else {
      container.innerHTML = `
        <a class="museum-btn museum-btn-outline" href="./login.html">Sign In</a>
        <a class="museum-btn museum-btn-primary" href="./register.html">Sign Up</a>
      `;
    }

    const logoutButtonEl = container.querySelector("#logoutHeaderButton");
    if (logoutButtonEl) {
      logoutButtonEl.addEventListener("click", handleLogout);
    }
  });

  const authSection = document.getElementById("authSection");
  const dashboardSection = document.getElementById("dashboardSection");
  if (authSection && dashboardSection) {
    if (isLoggedIn) {
      authSection.style.display = "none";
      dashboardSection.style.display = "block";
    } else {
      authSection.style.display = "block";
      dashboardSection.style.display = "none";
    }
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const email = form.email.value.trim();
  const password = form.password.value;
  clearMessage(authMessage);

  try {
    const result = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    saveAuth({ token: result.token, user: result.user });
    setMessage(authMessage, "Login successful!", "success");
    // Update shared UI without allowing optional dashboard helpers to block navigation.
    renderAuthState();
    window.KD_APP_CORE?.updateSocketConnection?.();
    window.location.assign("/dashboard.html");
  } catch (err) {
    setMessage(authMessage, err.message, "error");
  }
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const form = event.target;
  const email = form.email.value.trim();
  const password = form.password.value;
  clearMessage(authMessage);

  try {
    const result = await apiFetch("/auth/admin/request-otp", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    adminLoginForm.classList.add("hidden");
    adminOtpForm.classList.remove("hidden");
    adminOtpForm.dataset.email = email;
    adminOtpForm.dataset.password = password;
    setMessage(authMessage, result.message || "OTP sent to your email", "success");

    // If in development, a `devOtp` might be returned.
    if (result.devOtp) {
      const otpInput = adminOtpForm.querySelector('input[name="otp"]');
      if (otpInput) {
        otpInput.value = result.devOtp;
      }
    }
  } catch (err) {
    setMessage(authMessage, err.message, "error");
  }
}

async function handleAdminOtp(event) {
  event.preventDefault();
  const form = event.target;
  const otp = form.otp.value.trim();
  const email = form.dataset.email;
  const password = form.dataset.password;
  clearMessage(authMessage);

  try {
    const result = await apiFetch("/auth/admin/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, password, otp })
    });
    saveAuth({ token: result.token, user: result.user });
    setMessage(authMessage, "Admin login successful!", "success");
    renderAuthState();
    window.KD_APP_CORE?.updateSocketConnection?.();
    window.location.assign("/dashboard.html");
  } catch (err) {
    setMessage(authMessage, err.message, "error");
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  clearMessage(authMessage);

  try {
    const result = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    registerForm.classList.add("hidden");
    registerOtpForm.classList.remove("hidden");
    registerOtpForm.dataset.email = email;
    registerOtpForm.dataset.name = name;
    registerOtpForm.dataset.password = password;
    const otpEmailInput = registerOtpForm.elements.email;
    const otpNameInput = registerOtpForm.elements.name;
    const otpPasswordInput = registerOtpForm.elements.password;
    if (otpEmailInput) otpEmailInput.value = email;
    if (otpNameInput) otpNameInput.value = name;
    if (otpPasswordInput) otpPasswordInput.value = password;
    setMessage(authMessage, result.message || "OTP sent to your email", "success");
  } catch (err) {
    setMessage(authMessage, err.message, "error");
  }
}

async function handleRegisterOtp(event) {
  event.preventDefault();
  const form = event.target;
  const otp = form.otp.value.trim();
  const email = form.dataset.email;
  clearMessage(authMessage);

  try {
    const name = form.name?.value.trim() || form.dataset.name;
    const password = form.password?.value || form.dataset.password;
    const result = await apiFetch("/auth/register/otp/verify", {
      method: "POST",
      body: JSON.stringify({ email, otp, name, password })
    });
    saveAuth({ token: result.token, user: result.user });
    setMessage(authMessage, "Registration successful!", "success");
    renderAuthState();
    window.KD_APP_CORE?.updateSocketConnection?.();
    window.location.assign("/dashboard.html");
  } catch (err) {
    setMessage(authMessage, err.message, "error");
  }
}

async function handlePasswordResetRequest(event) {
  event.preventDefault();
  const form = event.target;
  const email = form.email.value.trim();
  clearMessage(authMessage);

  try {
    await apiFetch("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email })
    });
    passwordResetRequestForm.classList.add("hidden");
    passwordResetConfirmForm.classList.remove("hidden");
    const resetEmailInput = passwordResetConfirmForm.elements.email;
    if (resetEmailInput) resetEmailInput.value = email;
    if (passwordResetBackButton) passwordResetBackButton.classList.remove("hidden");
    setMessage(authMessage, "If the email exists, a reset code has been sent.", "success");
  } catch (err) {
    setMessage(authMessage, err.message, "error");
  }
}

async function handlePasswordResetConfirm(event) {
  event.preventDefault();
  const form = event.target;
  const email = form.email.value.trim();
  const otp = form.otp.value.trim();
  const newPassword = form.newPassword.value;
  clearMessage(authMessage);

  try {
    await apiFetch("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword })
    });
    setMessage(authMessage, "Password reset successful! Redirecting to login...", "success");
    setTimeout(() => (window.location.href = "/login.html"), 2000);
  } catch (err) {
    setMessage(authMessage, err.message, "error");
  }
}

async function handleLogout() {
  try {
    if (state.auth?.token) {
      await apiFetch("/auth/logout", { method: "POST" });
    }
  } catch {
    // Local logout must still work when the network is unavailable.
  } finally {
    saveAuth(null);
    window.KD_APP_CORE?.updateSocketConnection?.();
    window.location.assign("/index.html");
  }
}

/* ---- USER SESSION ---- */
async function refreshCurrentUser() {
  try {
    const result = await apiFetch("/auth/me");
    state.auth.user = result.user;
    saveAuth(state.auth);
    renderAuthState();
    if (window.KD_APP_CORE) {
      window.KD_APP_CORE.renderDashboardState();
      window.KD_APP_CORE.renderMyRequests();
    }
  } catch (error) {
    if (error?.statusCode === 401 || error?.statusCode === 403) {
      handleLogout();
      return;
    }
    renderAuthState();
  }
}

/* ---- AUTH TABS ---- */
function switchAuthTab(tab) {
  authTabs.forEach((t) => t.classList.remove("active"));
  const activeTab = document.querySelector(`[data-auth-tab="${tab}"]`);
  if (activeTab) activeTab.classList.add("active");

  document.querySelectorAll(".auth-tab-panel").forEach((p) => (p.style.display = "none"));
  const panel = document.getElementById(`${tab}Panel`);
  if (panel) panel.style.display = "block";

  if (tab === "admin" && state.auth?.user?.role === "ADMIN") {
    if (window.KD_DASHBOARD_ADMIN) {
      window.KD_DASHBOARD_ADMIN.loadAdminPanel();
    }
  }
}

/* ---- EVENT LISTENERS (Auth) ---- */
if (loginForm) {
  loginForm.addEventListener("submit", handleLogin);
}

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", handleAdminLogin);
}

if (adminOtpForm) {
  adminOtpForm.addEventListener("submit", handleAdminOtp);
}

if (registerForm) {
  registerForm.addEventListener("submit", handleRegister);
}

if (registerOtpForm) {
  registerOtpForm.addEventListener("submit", handleRegisterOtp);
}

if (backToRegisterBtn) {
  backToRegisterBtn.addEventListener("click", () => {
    registerOtpForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    clearMessage(authMessage);
  });
}

if (passwordResetRequestForm) {
  passwordResetRequestForm.addEventListener("submit", handlePasswordResetRequest);
}

if (passwordResetConfirmForm) {
  // Extract token from URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token) {
    passwordResetConfirmForm.dataset.token = token;
  }
  passwordResetConfirmForm.addEventListener("submit", handlePasswordResetConfirm);
}

if (passwordResetBackButton) {
  passwordResetBackButton.addEventListener("click", () => {
    passwordResetConfirmForm.classList.add("hidden");
    passwordResetRequestForm.classList.remove("hidden");
    passwordResetBackButton.classList.add("hidden");
    clearMessage(authMessage);
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", handleLogout);
}

/* ---- AUTH TABS EVENT LISTENERS ---- */
authTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    switchAuthTab(tab.dataset.authTab);
  });
});

/* ---- EXPORTS ---- */
window.KD_AUTH_CORE = {
  apiFetch,
  saveAuth,
  loadAuth,
  state,
  renderAuthState,
  handleLogout,
  refreshCurrentUser,
  switchAuthTab,
  setMessage,
  clearMessage,
  getAuthHeaders
};
