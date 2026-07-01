/* ============================================================
KD STUDIOS — Core App Logic (Auth, Dashboard, API, UI)
   ============================================================ */

const { projects, apiBaseUrl, socketUrl, storageKey } = window.KD_APP_DATA || {};

/* ---- DOM ELEMENTS ---- */
const projectGrid = document.getElementById("projectGrid");
const requestForm = document.getElementById("requestForm");
const formMessage = document.getElementById("formMessage");
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

const accountTitle = document.getElementById("accountTitle");
const accountDescription = document.getElementById("accountDescription");
const myRequests = document.getElementById("myRequests");
const authTabs = document.querySelectorAll("[data-auth-tab]");
const adminPanel = document.getElementById("adminPanel");
const adminStats = document.getElementById("adminStats");
const adminRequests = document.getElementById("adminRequests");
const adminUsers = document.getElementById("adminUsers");
const adminPasswordForm = document.getElementById("adminPasswordForm");
const adminPasswordMessage = document.getElementById("adminPasswordMessage");
const adminContactInfo = document.getElementById("adminContactInfo");
const adminRequestSearch = document.getElementById("adminRequestSearch");
const adminUserSearch = document.getElementById("adminUserSearch");
const adminRefreshButton = document.getElementById("adminRefreshButton");
const notificationList = document.getElementById("notificationList");
const adminNotificationList = document.getElementById("adminNotificationList");
const auditLogList = document.getElementById("auditLogList");
const socketStatus = document.getElementById("socketStatus");
const featuredApps = document.getElementById("featuredApps");
const homeButton = document.getElementById("dashboardHomeButton");

/* ---- STATE ---- */
const state = {
  auth: loadAuth(),
  socket: null
};

/* ---- AUTH HELPERS ---- */
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
  } else {
    sessionStorage.removeItem(storageKey);
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
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "Request failed.");
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

/* ---- RENDER PROJECTS ---- */
function renderProjects() {
  if (!projectGrid) return;
  projectGrid.innerHTML = projects
    .map(
      (p) => `
    <article class="project-card" data-id="${p.id}">
      <img src="${p.image}" alt="${p.title}" loading="lazy" />
      <div class="project-info">
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <div class="project-tags">
          ${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}
        </div>
        <a href="${p.url}" target="_blank" rel="noopener" class="project-link">View Project</a>
      </div>
    </article>
  `
    )
    .join("");
}

/* ---- REVEAL ANIMATIONS ---- */
function setupRevealAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

/* ---- MOBILE NAV ---- */
function setupMobileNav() {
  const topbar = document.querySelector(".topbar");
  const nav = document.querySelector(".topbar .nav");
  const actions = document.querySelector(".topbar .header-actions");

  if (!topbar || !nav || !actions || topbar.querySelector(".mobile-nav-toggle")) {
    return;
  }

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "btn mobile-nav-toggle";
  toggleButton.setAttribute("aria-expanded", "false");
  toggleButton.setAttribute("aria-label", "Toggle navigation menu");
  toggleButton.innerHTML = "<span></span><span></span><span></span>";

  const panel = document.createElement("div");
  panel.className = "mobile-nav-panel";
  panel.setAttribute("hidden", "");
  panel.appendChild(nav.cloneNode(true));
  panel.appendChild(actions.cloneNode(true));

  const closePanel = () => {
    topbar.classList.remove("mobile-nav-open");
    toggleButton.setAttribute("aria-expanded", "false");
    panel.setAttribute("hidden", "");
  };

  const openPanel = () => {
    topbar.classList.add("mobile-nav-open");
    toggleButton.setAttribute("aria-expanded", "true");
    panel.removeAttribute("hidden");
  };

  toggleButton.addEventListener("click", () => {
    const isOpen = topbar.classList.contains("mobile-nav-open");
    isOpen ? closePanel() : openPanel();
  });

  panel.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("click", closePanel);
  });

  document.addEventListener("click", (e) => {
    if (
      topbar.classList.contains("mobile-nav-open") &&
      !topbar.contains(e.target)
    ) {
      closePanel();
    }
  });

  topbar.appendChild(toggleButton);
  topbar.appendChild(panel);
}

/* ---- AUTH UI ---- */
function renderAuthState() {
  const isLoggedIn = !!state.auth?.token;
  const user = state.auth?.user;

  // Update header auth buttons
  const headerAuth = document.querySelector(".header-auth");
  if (headerAuth) {
    if (isLoggedIn) {
      headerAuth.innerHTML = `
        <span class="user-greeting">Hi, ${user?.name || "User"}</span>
        <button id="logoutHeaderButton" class="btn btn-outline">Logout</button>
      `;
      const btn = document.getElementById("logoutHeaderButton");
      if (btn) btn.addEventListener("click", handleLogout);
    } else {
      headerAuth.innerHTML = `
        <a href="/login.html" class="btn btn-outline">Sign In</a>
        <a href="/register.html" class="btn btn-primary">Sign Up</a>
      `;
    }
  }

  // Update dashboard auth state
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
    setMessage(authMessage, "Login successful! Redirecting...", "success");
    setTimeout(() => window.location.reload(), 1000);
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
    const result = await apiFetch("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (result.requiresOtp) {
      // Show OTP form
      adminLoginForm.style.display = "none";
      adminOtpForm.style.display = "block";
      adminOtpForm.dataset.email = email;
      setMessage(authMessage, "OTP sent to your email", "success");
    } else {
      saveAuth({ token: result.token, user: result.user });
      setMessage(authMessage, "Admin login successful! Redirecting...", "success");
      setTimeout(() => window.location.reload(), 1000);
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
  clearMessage(authMessage);

  try {
    const result = await apiFetch("/auth/admin/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp })
    });
    saveAuth({ token: result.token, user: result.user });
    setMessage(authMessage, "Admin login successful! Redirecting...", "success");
    setTimeout(() => window.location.reload(), 1000);
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
    if (result.requiresOtp) {
      registerForm.style.display = "none";
      registerOtpForm.style.display = "block";
      registerOtpForm.dataset.email = email;
      setMessage(authMessage, "OTP sent to your email", "success");
    } else {
      saveAuth({ token: result.token, user: result.user });
      setMessage(authMessage, "Registration successful! Redirecting...", "success");
      setTimeout(() => window.location.reload(), 1000);
    }
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
    const result = await apiFetch("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp })
    });
    saveAuth({ token: result.token, user: result.user });
    setMessage(authMessage, "Registration successful! Redirecting...", "success");
    setTimeout(() => window.location.reload(), 1000);
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
    await apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });
    setMessage(authMessage, "If the email exists, a reset link has been sent.", "success");
  } catch (err) {
    setMessage(authMessage, err.message, "error");
  }
}

async function handlePasswordResetConfirm(event) {
  event.preventDefault();
  const form = event.target;
  const token = form.dataset.token;
  const password = form.password.value;
  clearMessage(authMessage);

  try {
    await apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password })
    });
    setMessage(authMessage, "Password reset successful! Redirecting to login...", "success");
    setTimeout(() => (window.location.href = "/login.html"), 2000);
  } catch (err) {
    setMessage(authMessage, err.message, "error");
  }
}

function handleLogout() {
  saveAuth(null);
  window.location.reload();
}

/* ---- DASHBOARD ---- */
async function refreshCurrentUser() {
  try {
    const user = await apiFetch("/auth/me");
    state.auth.user = user;
    saveAuth(state.auth);
    renderAuthState();
    renderMyRequests();
  } catch {
    handleLogout();
  }
}

function renderMyRequests() {
  if (!myRequests) return;
  myRequests.innerHTML = `
    <div class="loading">Loading your requests...</div>
  `;
  apiFetch("/requests/my")
    .then((requests) => {
      if (!requests.length) {
        myRequests.innerHTML = "<p>No requests yet.</p>";
        return;
      }
      myRequests.innerHTML = requests
        .map(
          (r) => `
        <div class="request-card">
          <h4>${r.title}</h4>
          <p>${r.description}</p>
          <span class="status status-${r.status}">${r.status}</span>
          <small>${new Date(r.createdAt).toLocaleDateString()}</small>
        </div>
      `
        )
        .join("");
    })
    .catch(() => {
      myRequests.innerHTML = "<p>Failed to load requests.</p>";
    });
}

async function handleRequestSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const title = form.title.value.trim();
  const description = form.description.value.trim();
  const category = form.category.value;
  clearMessage(formMessage);

  try {
    await apiFetch("/requests", {
      method: "POST",
      body: JSON.stringify({ title, description, category })
    });
    setMessage(formMessage, "Request submitted successfully!", "success");
    form.reset();
    renderMyRequests();
  } catch (err) {
    setMessage(formMessage, err.message, "error");
  }
}

/* ---- ADMIN PANEL ---- */
function switchAuthTab(tab) {
  authTabs.forEach((t) => t.classList.remove("active"));
  const activeTab = document.querySelector(`[data-auth-tab="${tab}"]`);
  if (activeTab) activeTab.classList.add("active");

  document.querySelectorAll(".auth-tab-panel").forEach((p) => (p.style.display = "none"));
  const panel = document.getElementById(`${tab}Panel`);
  if (panel) panel.style.display = "block";

  if (tab === "admin" && state.auth?.user?.role === "admin") {
    loadAdminPanel();
  }
}

async function loadAdminPanel() {
  if (state.auth?.user?.role !== "admin") return;

  adminPanel.style.display = "block";
  await Promise.all([loadAdminStats(), loadAdminRequests(), loadAdminUsers()]);
}

async function loadAdminStats() {
  try {
    const stats = await apiFetch("/admin/stats");
    adminStats.innerHTML = `
      <div class="stat-card"><h3>${stats.totalUsers}</h3><p>Total Users</p></div>
      <div class="stat-card"><h3>${stats.totalRequests}</h3><p>Total Requests</p></div>
      <div class="stat-card"><h3>${stats.pendingRequests}</h3><p>Pending Requests</p></div>
    `;
  } catch {
    adminStats.innerHTML = "<p>Failed to load stats.</p>";
  }
}

async function loadAdminRequests() {
  try {
    const requests = await apiFetch("/admin/requests");
    adminRequests.innerHTML = requests
      .map(
        (r) => `
      <div class="admin-request-card">
        <h4>${r.title}</h4>
        <p>${r.description}</p>
        <div class="request-meta">
          <span>By: ${r.userName} (${r.userEmail})</span>
          <span class="status status-${r.status}">${r.status}</span>
          <span>${new Date(r.createdAt).toLocaleDateString()}</span>
        </div>
        <form class="admin-request-form" data-id="${r.id}">
          <select name="status">
            <option value="pending" ${r.status === "pending" ? "selected" : ""}>Pending</option>
            <option value="in_progress" ${r.status === "in_progress" ? "selected" : ""}>In Progress</option>
            <option value="completed" ${r.status === "completed" ? "selected" : ""}>Completed</option>
            <option value="rejected" ${r.status === "rejected" ? "selected" : ""}>Rejected</option>
          </select>
          <button type="submit" class="btn btn-sm">Update</button>
        </form>
      </div>
    `
      )
      .join("");
  } catch {
    adminRequests.innerHTML = "<p>Failed to load requests.</p>";
  }
}

async function loadAdminUsers() {
  try {
    const users = await apiFetch("/admin/users");
    adminUsers.innerHTML = users
      .map(
        (u) => `
      <div class="admin-user-card">
        <h4>${u.name} (${u.email})</h4>
        <div class="user-meta">
          <span>Role: ${u.role}</span>
          <span>Status: ${u.isBlocked ? "Blocked" : "Active"}</span>
          <span>Joined: ${new Date(u.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="user-actions">
          ${u.isBlocked
            ? `<button class="admin-unblock-button btn btn-sm" data-user-id="${u.id}">Unblock</button>`
            : `<button class="admin-block-button btn btn-sm btn-outline" data-user-id="${u.id}">Block</button>`
          }
          <button class="admin-remove-button btn btn-sm btn-danger" data-user-id="${u.id}">Remove</button>
        </div>
      </div>
    `
      )
      .join("");
  } catch {
    adminUsers.innerHTML = "<p>Failed to load users.</p>";
  }
}

async function blockUser(userId) {
  try {
    await apiFetch(`/admin/users/${userId}/block`, { method: "POST" });
    loadAdminUsers();
  } catch (err) {
    alert(err.message);
  }
}

async function unblockUser(userId) {
  try {
    await apiFetch(`/admin/users/${userId}/unblock`, { method: "POST" });
    loadAdminUsers();
  } catch (err) {
    alert(err.message);
  }
}

async function removeUser(userId) {
  if (!confirm("Are you sure you want to remove this user?")) return;
  try {
    await apiFetch(`/admin/users/${userId}`, { method: "DELETE" });
    loadAdminUsers();
  } catch (err) {
    alert(err.message);
  }
}

async function handleAdminRequestUpdate(event) {
  event.preventDefault();
  const form = event.target;
  const requestId = form.dataset.id;
  const status = form.status.value;

  try {
    await apiFetch(`/admin/requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    loadAdminRequests();
  } catch (err) {
    alert(err.message);
  }
}

async function handleAdminSearch(event) {
  const query = event.target.value.toLowerCase();
  const target = event.target.id === "adminRequestSearch" ? adminRequests : adminUsers;
  if (!target) return;

  target.querySelectorAll(".admin-request-card, .admin-user-card").forEach((card) => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(query) ? "" : "none";
  });
}

async function handleAdminRefresh() {
  await Promise.all([loadAdminStats(), loadAdminRequests(), loadAdminUsers()]);
}

async function handleAdminPasswordChange(event) {
  event.preventDefault();
  const form = event.target;
  const currentPassword = form.currentPassword.value;
  const newPassword = form.newPassword.value;
  clearMessage(adminPasswordMessage);

  try {
    await apiFetch("/admin/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword })
    });
    setMessage(adminPasswordMessage, "Password changed successfully!", "success");
    form.reset();
  } catch (err) {
    setMessage(adminPasswordMessage, err.message, "error");
  }
}

/* ---- SOCKET ---- */
function connectSocket() {
  async function connect() {
    state.socket = new WebSocket(socketUrl);

    state.socket.onopen = () => {
      if (socketStatus) {
        socketStatus.textContent = "Connected";
        socketStatus.className = "socket-status connected";
      }
      // Authenticate socket
      if (state.auth?.token) {
        state.socket.send(JSON.stringify({ type: "auth", token: state.auth.token }));
      }
    };

    state.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSocketMessage(data);
      } catch {
        // Ignore parse errors
      }
    };

    state.socket.onclose = () => {
      if (socketStatus) {
        socketStatus.textContent = "Disconnected";
        socketStatus.className = "socket-status disconnected";
      }
      // Reconnect after 5 seconds
      setTimeout(connect, 5000);
    };

    state.socket.onerror = () => {
      if (socketStatus) {
        socketStatus.textContent = "Error";
        socketStatus.className = "socket-status error";
      }
    };
  }

  connect();
}

function handleSocketMessage(data) {
  switch (data.type) {
    case "notification":
      addNotification(data.notification);
      break;
    case "request_update":
      renderMyRequests();
      if (adminPanel.style.display !== "none") loadAdminRequests();
      break;
    case "admin_notification":
      addAdminNotification(data.notification);
      break;
    case "audit_log":
      addAuditLog(data.log);
      break;
  }
}

function addNotification(notification) {
  if (!notificationList) return;
  const item = document.createElement("div");
  item.className = "notification-item";
  item.innerHTML = `
    <strong>${notification.title}</strong>
    <p>${notification.message}</p>
    <small>${new Date(notification.createdAt).toLocaleString()}</small>
  `;
  notificationList.prepend(item);
}

function addAdminNotification(notification) {
  if (!adminNotificationList) return;
  const item = document.createElement("div");
  item.className = "notification-item";
  item.innerHTML = `
    <strong>${notification.title}</strong>
    <p>${notification.message}</p>
    <small>${new Date(notification.createdAt).toLocaleString()}</small>
  `;
  adminNotificationList.prepend(item);
}

function addAuditLog(log) {
  if (!auditLogList) return;
  const item = document.createElement("div");
  item.className = "audit-log-item";
  item.innerHTML = `
    <span>${log.action}</span>
    <span>${log.details}</span>
    <small>${new Date(log.createdAt).toLocaleString()}</small>
  `;
  auditLogList.prepend(item);
}

/* ---- FEATURED APPS ---- */
function renderFeaturedApps() {
  if (!featuredApps) return;
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  featuredApps.innerHTML = featured
    .map(
      (p) => `
    <article class="project-card">
      <img src="${p.image}" alt="${p.title}" loading="lazy" />
      <div class="project-info">
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <a href="${p.url}" target="_blank" rel="noopener" class="project-link">View Project</a>
      </div>
    </article>
  `
    )
    .join("");
}

/* ---- EVENT LISTENERS ---- */
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
    registerOtpForm.style.display = "none";
    registerForm.style.display = "block";
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
    window.location.href = "/login.html";
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", handleLogout);
}

if (requestForm) {
  requestForm.addEventListener("submit", handleRequestSubmit);
}

if (adminPasswordForm) {
  adminPasswordForm.addEventListener("submit", handleAdminPasswordChange);
}

if (adminRequestSearch) {
  adminRequestSearch.addEventListener(
    "input",
    debounce(handleAdminSearch, 300)
  );
}

if (adminUserSearch) {
  adminUserSearch.addEventListener(
    "input",
    debounce(handleAdminSearch, 300)
  );
}

if (adminRefreshButton) {
  adminRefreshButton.addEventListener(
    "click",
    handleAdminRefresh
  );
}

/* ---- DELEGATED EVENTS ---- */

document.addEventListener("click", async (event) => {

  const blockButton = event.target.closest(".admin-block-button");

  if (blockButton) {
    await blockUser(blockButton.dataset.userId);
    return;
  }

  const unblockButton = event.target.closest(".admin-unblock-button");

  if (unblockButton) {
    await unblockUser(unblockButton.dataset.userId);
    return;
  }

  const removeButton = event.target.closest(".admin-remove-button");

  if (removeButton) {
    await removeUser(removeButton.dataset.userId);
    return;
  }

});

document.addEventListener("submit", async (event) => {

  if (
    event.target.classList.contains(
      "admin-request-form"
    )
  ) {
    await handleAdminRequestUpdate(event);
  }

});

/* ---- AUTH TABS ---- */

authTabs.forEach(tab => {

  tab.addEventListener("click", () => {

    switchAuthTab(tab.dataset.authTab);

  });

});

/* ---- HOME BUTTON ---- */

if (homeButton) {

  homeButton.addEventListener("click", () => {

    window.location.href = "/";

  });

}

/* ---- UTILITIES ---- */
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/* ---- INITIALIZE ---- */

async function init() {

  renderProjects();

  setupRevealAnimations();

  setupMobileNav();

  // Initialize museum UI (dot menu, overlay)
  if (window.KD_MUSEUM_UI) {
    window.KD_MUSEUM_UI.setupDotMenu();
    window.KD_MUSEUM_UI.setupMuseumOverlay();
  }

  renderAuthState();

  renderFeaturedApps();

  if (state.auth?.token) {

    await refreshCurrentUser();

    connectSocket();

  }

}

document.addEventListener(
  "DOMContentLoaded",
  init
);

/* ---- EXPORTS ---- */
window.KD_APP_CORE = {
  apiFetch,
  saveAuth,
  loadAuth,
  state,
  init,
  renderProjects,
  renderMyRequests,
  renderAuthState,
  handleLogout,
  connectSocket
};