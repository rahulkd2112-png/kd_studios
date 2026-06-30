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
  if (type) element.classList.add(type);
  element.textContent = text;
}

function setHtml(element, html) {
  if (element) element.innerHTML = html;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&")
    .replaceAll("<", "<")
    .replaceAll(">", ">")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---- PROJECT RENDERING ---- */
function renderProjects() {
  if (!featuredApps && !projectGrid) return;

  const featured = projects.filter(
    (project) =>
      project.type === "Photo Editing App" ||
      project.type === "Game App" ||
      project.type === "Scanner App"
  );
  const regular = projects.filter(
    (project) =>
      project.type !== "Photo Editing App" &&
      project.type !== "Game App" &&
      project.type !== "Scanner App"
  );

  if (featuredApps) {
    featuredApps.innerHTML = featured
      .map(
        (project) => `
      <article class="featured-app-card">
        <div class="featured-ribbon ${project.year === "In Testing" ? "testing" : "live"}">
          ${project.year === "In Testing" ? "Testing Build" : "Live on Play Store"}
        </div>
        <div class="app-poster ${project.title === "FaceFix AI" ? "poster-facefix" : project.title === "Stack Tower" ? "poster-stack" : "poster-scanpro"}">
          <img class="app-poster-image" src="${project.image}" alt="${project.title} logo" loading="lazy" />
          <div class="poster-glow"></div>
          ${project.title === "FaceFix AI"
            ? `
                <div class="facefix-orb facefix-orb-one"></div>
                <div class="facefix-orb facefix-orb-two"></div>
                <div class="facefix-frame">
                  <span>AI</span>
                  <strong>Face Restore</strong>
                  <small>Sharper portraits and cleaner old memories</small>
                </div>
              `
            : project.title === "Stack Tower"
              ? `
                <div class="tower-stack">
                  <span class="tower-block tower-block-one"></span>
                  <span class="tower-block tower-block-two"></span>
                  <span class="tower-block tower-block-three"></span>
                  <span class="tower-block tower-block-four"></span>
                </div>
                <div class="stack-score">
                  <span>Arcade Build</span>
                  <strong>Stack Higher</strong>
                  <small>Precision timing and endless replay value</small>
                </div>
              `
              : `
                <div class="scan-grid">
                  <span class="scan-sheet scan-sheet-back"></span>
                  <span class="scan-sheet scan-sheet-mid"></span>
                  <span class="scan-sheet scan-sheet-front"></span>
                  <span class="scan-beam"></span>
                </div>
                <div class="stack-score">
                  <span>Productivity App</span>
                  <strong>Scan Faster</strong>
                  <small>Capture documents, clean pages, and export on the go</small>
                </div>
              `}
        </div>
        <span class="chip">${project.type}</span>
        <div class="meta">
          <span>${project.title}</span>
          <span class="status-pill ${project.year === "In Testing" ? "testing" : "live"}">${project.year}</span>
        </div>
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="tag-row">
          ${project.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
        </div>
        <a class="btn btn-primary" href="${project.url}" target="_blank" rel="noreferrer">View on Play Store</a>
      </article>
    `
      )
      .join("");
  }

  if (projectGrid) {
    projectGrid.innerHTML = regular
      .map(
        (project) => `
      <article class="project-card reveal">
        <div class="meta">
          <span>${project.type}</span>
          <span class="status-pill ${project.year === "In Testing" ? "testing" : "live"}">${project.year}</span>
        </div>
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="tag-row">
          ${project.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
        </div>
        <a class="btn btn-secondary" href="${project.url}">View Details</a>
      </article>
    `
      )
      .join("");
  }
}

function setupRevealAnimations() {
  const revealItems = document.querySelectorAll(".reveal");
  if (!revealItems.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((element) => observer.observe(element));
}

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
    if (topbar.classList.contains("mobile-nav-open")) {
      closePanel();
    } else {
      openPanel();
    }
  });

  panel.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closePanel();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      closePanel();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePanel();
    }
  });

  topbar.appendChild(toggleButton);
  topbar.appendChild(panel);
}

/* ---- AUTH UI ---- */
function switchAuthTab(tabName) {
  if (!authTabs.length) return;

  authTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.authTab === tabName));
  if (loginForm) loginForm.classList.toggle("hidden", tabName !== "login");
  if (registerForm) registerForm.classList.toggle("hidden", tabName !== "register");
  if (passwordResetRequestForm) passwordResetRequestForm.classList.toggle("hidden", tabName !== "reset");
  if (passwordResetConfirmForm) passwordResetConfirmForm.classList.toggle("hidden", tabName !== "reset");
  if (adminOtpForm) adminOtpForm.classList.add("hidden");
}

function renderAuthState() {
  if (!state.auth?.user) {
    if (accountTitle) accountTitle.textContent = "Not logged in";
    if (accountDescription) accountDescription.textContent = "Login or register to submit project requests and track your briefs.";
    if (logoutButton) logoutButton.classList.add("hidden");
    if (adminPanel) adminPanel.classList.add("hidden");
    setHtml(myRequests, '<p class="empty-state">Login to view your submitted requests.</p>');
    setHtml(notificationList, '<p class="empty-state">Login to see your notifications.</p>');
    return;
  }

  const roleLabel = state.auth.user.role === "ADMIN" ? "Admin" : "Client";
  if (accountTitle) accountTitle.textContent = `${state.auth.user.name} (${roleLabel})`;
  if (accountDescription) {
    accountDescription.textContent =
      state.auth.user.role === "ADMIN"
        ? "Owner dashboard unlocked. You can manage users, requests, replies, and security here."
        : "Client dashboard active. You can submit ideas, track quotes, and read admin replies.";
  }
  if (logoutButton) logoutButton.classList.remove("hidden");

  if (logoutHeaderButton) logoutHeaderButton.classList.remove("hidden");

  if (adminPanel) adminPanel.classList.toggle("hidden", state.auth.user.role !== "ADMIN");

  if (document.body?.dataset?.page === "dashboard") {
    if (logoutHeaderButton) logoutHeaderButton.classList.remove("hidden");
    document
      .querySelectorAll('.header-actions .header-btn')
      .forEach((btn) => btn.classList.add("hidden"));
    if (logoutHeaderButton) logoutHeaderButton.classList.remove("hidden");
    if (logoutButton) logoutButton.classList.remove("hidden");
  }
}

/* ---- RENDER HELPERS ---- */
function renderClientRequests(requests) {
  if (!myRequests) return;
  if (!requests.length) {
    myRequests.innerHTML = '<p class="empty-state">No requests submitted yet.</p>';
    return;
  }
  myRequests.innerHTML = requests
    .map(
      (request) => `
        <article class="request-item">
          <strong>${escapeHtml(request.projectType)}</strong>
          <p><span class="status-badge">${escapeHtml(request.status)}</span></p>
          <p>${escapeHtml(request.details)}</p>
          <p>Budget: ${escapeHtml(request.budget || "Not shared")}</p>
          <p>Timeline: ${escapeHtml(request.timeline || "Flexible")}</p>
          ${request.quoteAmount ? `<p>Quote: ${escapeHtml(request.quoteAmount)}</p>` : ""}
          ${request.adminNotes ? `<p>Admin reply: ${escapeHtml(request.adminNotes)}</p>` : ""}
        </article>
      `
    )
    .join("");
}

function renderNotifications(notifications, target) {
  if (!target) return;
  if (!notifications?.length) {
    target.innerHTML = '<p class="empty-state">No notifications available.</p>';
    return;
  }
  target.innerHTML = notifications
    .map(
      (notification) => `
        <article class="notification-item">
          <strong>${escapeHtml(notification.title)}</strong>
          <p>${escapeHtml(notification.message)}</p>
          <p>${new Date(notification.createdAt).toLocaleString()}</p>
        </article>
      `
    )
    .join("");
}

function renderAuditLogs(logs) {
  if (!auditLogList) return;
  if (!logs?.length) {
    auditLogList.innerHTML = '<p class="empty-state">No audit activity yet.</p>';
    return;
  }
  auditLogList.innerHTML = logs
    .map(
      (log) => `
        <article class="notification-item">
          <strong>${escapeHtml(log.action)}</strong>
          <p>${escapeHtml(log.description)}</p>
          <p>${new Date(log.createdAt).toLocaleString()}</p>
        </article>
      `
    )
    .join("");
}

function renderAdminStats(dashboard) {
  if (adminContactInfo) {
    adminContactInfo.textContent = `Verified admin contact: ${dashboard.adminContact.email} | ${dashboard.adminContact.phone}`;
  }
  if (adminStats) {
    adminStats.innerHTML = `
      <article class="admin-stat">
        <strong>Total users</strong>
        <span>${dashboard.stats.userCount}</span>
      </article>
      <article class="admin-stat">
        <strong>Total requests</strong>
        <span>${dashboard.stats.requestCount}</span>
      </article>
      <article class="admin-stat">
        <strong>Blocked users</strong>
        <span>${dashboard.stats.blockedUserCount}</span>
      </article>
    `;
  }
}

function renderAdminRequests(requests) {
  if (!adminRequests) return;
  if (!requests.length) {
    adminRequests.innerHTML = '<p class="empty-state">No client requests available yet.</p>';
    return;
  }
  adminRequests.innerHTML = requests
    .map(
      (request) => `
        <article class="request-item">
          <strong>${escapeHtml(request.projectType)} - ${escapeHtml(request.user?.name || "Unknown user")}</strong>
          <p><span class="status-badge">${escapeHtml(request.status)}</span></p>
          <p>${escapeHtml(request.details)}</p>
          <p>Email: ${escapeHtml(request.user?.email || "Not available")}</p>
          <p>Phone: ${escapeHtml(request.user?.phone || "Not available")}</p>
          <p>Budget: ${escapeHtml(request.budget || "Not shared")}</p>
          <p>Timeline: ${escapeHtml(request.timeline || "Flexible")}</p>
          <form class="admin-request-form" data-request-id="${escapeHtml(request.id)}">
            <input type="text" name="status" placeholder="Status" value="${escapeHtml(request.status || "")}" />
            <input type="text" name="quoteAmount" placeholder="Quote amount" value="${escapeHtml(request.quoteAmount || "")}" />
            <textarea name="adminNotes" rows="3" placeholder="Reply / notes">${escapeHtml(request.adminNotes || "")}</textarea>
            <button class="btn btn-secondary" type="submit">Save Reply</button>
          </form>
        </article>
      `
    )
    .join("");
}

function renderAdminUsers(users) {
  if (!adminUsers) return;
  if (!users.length) {
    adminUsers.innerHTML = '<p class="empty-state">No users found.</p>';
    return;
  }
  adminUsers.innerHTML = users
    .map(
      (user) => `
        <article class="request-item">
          <strong>${escapeHtml(user.name)} (${escapeHtml(user.role)})</strong>
          <p>Email: ${escapeHtml(user.email)}</p>
          <p>Phone: ${escapeHtml(user.phone || "Not shared")}</p>
          <p>Requests: ${user._count?.requests || 0}</p>
          <p>Status: <span class="status-badge">${user.isBlocked ? "BLOCKED" : "ACTIVE"}</span></p>
          ${user.blockedReason ? `<p>Reason: ${escapeHtml(user.blockedReason)}</p>` : ""}
          ${user.role !== "ADMIN"
            ? `
                <div class="hero-actions compact">
                  ${user.isBlocked
                    ? `<button class="btn btn-secondary admin-unblock-button" type="button" data-user-id="${escapeHtml(user.id)}">Unblock</button>`
                    : `<button class="btn btn-secondary admin-block-button" type="button" data-user-id="${escapeHtml(user.id)}">Block</button>`}
                  <button class="btn btn-secondary admin-remove-button" type="button" data-user-id="${escapeHtml(user.id)}">Remove</button>
                </div>
              `
            : ""}
        </article>
      `
    )
    .join("");
}

/* ---- DATA LOADING ---- */
async function loadNotifications() {
  if (!notificationList || !state.auth?.token) {
    renderNotifications([], notificationList);
    return;
  }
  try {
    const result = await apiFetch("/api/notifications", { method: "GET" });
    renderNotifications(result.notifications || [], notificationList);
  } catch {
    renderNotifications([], notificationList);
  }
}

async function loadAdminPanel() {
  if (!adminPanel || state.auth?.user?.role !== "ADMIN") return;
  try {
    const [dashboard, requests, users] = await Promise.all([
      apiFetch("/api/admin/dashboard", { method: "GET" }),
      apiFetch("/api/admin/requests", { method: "GET" }),
      apiFetch("/api/admin/users", { method: "GET" })
    ]);
    renderAdminStats(dashboard);
    renderAdminRequests(requests.requests || []);
    renderAdminUsers(users.users || []);
    renderAuditLogs(dashboard.auditLogs || []);
    renderNotifications(dashboard.recentNotifications || [], adminNotificationList);
  } catch (error) {
    setHtml(adminStats, `<p class="empty-state">${escapeHtml(error.message)}</p>`);
  }
}

function debounce(fn, delay) {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delay);
  };
}

async function handleAdminSearch() {
  const requestQuery = adminRequestSearch?.value?.trim().toLowerCase() || "";
  const userQuery = adminUserSearch?.value?.trim().toLowerCase() || "";

  const [dashboard, requests, users] = await Promise.all([
    apiFetch("/api/admin/dashboard", { method: "GET" }),
    apiFetch("/api/admin/requests", { method: "GET" }),
    apiFetch("/api/admin/users", { method: "GET" })
  ]);

  const filteredRequests = (requests.requests || []).filter((request) => {
    const text = [
      request.projectType,
      request.budget,
      request.timeline,
      request.status,
      request.adminNotes,
      request.user?.name,
      request.user?.email,
      request.user?.phone,
      request.details
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return requestQuery ? text.includes(requestQuery) : true;
  });

  const filteredUsers = (users.users || []).filter((user) => {
    const text = [user.name, user.email, user.phone, user.role, user.blockedReason]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return userQuery ? text.includes(userQuery) : true;
  });

  renderAdminStats(dashboard);
  renderAdminRequests(filteredRequests);
  renderAdminUsers(filteredUsers);
  renderAuditLogs(dashboard.auditLogs || []);
  renderNotifications(dashboard.recentNotifications || [], adminNotificationList);
}

async function handleAdminRefresh(event) {
  event.preventDefault();
  await loadAdminPanel();
}

async function refreshCurrentUser() {
  if (!state.auth?.token) {
    renderAuthState();
    return;
  }
  try {
    const result = await apiFetch("/api/auth/me", { method: "GET" });
    saveAuth({ ...state.auth, user: result.user });
    renderAuthState();
    await loadClientRequests();
    await loadNotifications();
    await loadAdminPanel();
  } catch {
    saveAuth(null);
    renderAuthState();
  }
}

async function loadClientRequests() {
  if (!myRequests || !state.auth?.token || state.auth.user.role === "ADMIN") {
    renderClientRequests([]);
    return;
  }
  try {
    const result = await apiFetch("/api/requests/my", { method: "GET" });
    renderClientRequests(result.requests || []);
  } catch {
    renderClientRequests([]);
  }
}

/* ---- SOCKET ---- */
function connectSocket() {
  if (!socketStatus) return;
  try {
    if (state.socket) state.socket.close();
    const socket = new WebSocket(socketUrl);
    state.socket = socket;

    socket.addEventListener("open", () => {
      socketStatus.textContent = "Socket live";
      socketStatus.classList.add("live");
    });

    socket.addEventListener("close", () => {
      socketStatus.textContent = "Socket offline";
      socketStatus.classList.remove("live");
    });

    socket.addEventListener("message", async () => {
      if (state.auth?.token) {
        await loadNotifications();
        if (state.auth.user.role === "ADMIN") {
          await loadAdminPanel();
        } else {
          await loadClientRequests();
        }
      }
    });
  } catch {
    socketStatus.textContent = "Socket unavailable";
  }
}

function redirectToDashboard() {
  window.location.href = "/dashboard.html";
}

/* ---- EVENT HANDLERS ---- */
async function handleLogin(event) {
  event.preventDefault();
  setMessage(authMessage, "Checking login...");
  const payload = Object.fromEntries(new FormData(loginForm).entries());

  try {
    const normalizedEmail = String(payload.email || "").trim().toLowerCase();
    const result = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    saveAuth({ token: result.token, user: result.user });
    loginForm.reset();
    setMessage(authMessage, "Login successful.", "success");
    renderAuthState();
    await loadClientRequests();
    await loadNotifications();
    redirectToDashboard();
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
}

async function handleAdminCodeLogin(event) {
  event.preventDefault();
  setMessage(authMessage, "Verifying admin access code...");
  const payload = Object.fromEntries(new FormData(adminOtpForm).entries());

  try {
    const result = await apiFetch("/api/auth/admin/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    saveAuth({ token: result.token, user: result.user });
    adminOtpForm.reset();
    if (loginForm) loginForm.reset();
    adminOtpForm.classList.add("hidden");
    setMessage(authMessage, "Admin verification code accepted. Login successful.", "success");
    renderAuthState();
    await loadNotifications();
    await loadAdminPanel();
    redirectToDashboard();
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
}

async function handleAdminLoginRequest(event) {
  event.preventDefault();
  setMessage(authMessage, "Sending admin access code...");
  const payload = Object.fromEntries(new FormData(adminLoginForm).entries());

  try {
    await apiFetch("/api/auth/admin/request-otp", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    adminLoginForm.classList.add("hidden");
    adminOtpForm.classList.remove("hidden");
    setMessage(authMessage, "Access code sent to admin email. Please check your inbox.", "success");
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
}

async function handleRegister(event) {
  event.preventDefault();
  setMessage(authMessage, "Registering...");
  const payload = Object.fromEntries(new FormData(registerForm).entries());

  try {
    const result = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    registerForm.reset();
    registerForm.classList.add("hidden");
    registerOtpForm.classList.remove("hidden");
    setMessage(authMessage, "OTP sent to your email. Please verify.", "success");
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
}

async function handleRegisterOtp(event) {
  event.preventDefault();
  setMessage(authMessage, "Verifying OTP...");
  const payload = Object.fromEntries(new FormData(registerOtpForm).entries());

  try {
    const result = await apiFetch("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    saveAuth({ token: result.token, user: result.user });
    registerOtpForm.reset();
    registerOtpForm.classList.add("hidden");
    setMessage(authMessage, "Registration successful.", "success");
    renderAuthState();
    await loadClientRequests();
    await loadNotifications();
    redirectToDashboard();
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
}

function handleBackToRegister() {
  registerOtpForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
  setMessage(authMessage, "");
}

async function handlePasswordResetRequest(event) {
  event.preventDefault();
  setMessage(authMessage, "Sending reset link...");
  const payload = Object.fromEntries(new FormData(passwordResetRequestForm).entries());

  try {
    await apiFetch("/api/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    passwordResetRequestForm.classList.add("hidden");
    passwordResetConfirmForm.classList.remove("hidden");
    setMessage(authMessage, "Reset link sent. Check your email.", "success");
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
}

async function handlePasswordResetConfirm(event) {
  event.preventDefault();
  setMessage(authMessage, "Resetting password...");
  const payload = Object.fromEntries(new FormData(passwordResetConfirmForm).entries());

  try {
    await apiFetch("/api/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    passwordResetConfirmForm.classList.add("hidden");
    passwordResetRequestForm.classList.remove("hidden");
    setMessage(authMessage, "Password reset successful. You can now login.", "success");
    
    switchAuthTab("login");

  } catch (error) {

    setMessage(authMessage, error.message, "error");

  }

}

/* ---- LOGOUT ---- */

function handleLogout() {
  saveAuth(null);

  renderAuthState();

  renderClientRequests([]);

  renderNotifications([], notificationList);

  if (adminPanel) {
    adminPanel.classList.add("hidden");
  }

  setMessage(authMessage, "");

  if (state.socket) {
    state.socket.close();
    state.socket = null;
  }

  sessionStorage.removeItem(storageKey);

  window.location.href = "/";
}

/* ---- CLIENT PROJECT REQUEST ---- */

async function handleProjectRequest(event) {
  event.preventDefault();

  if (!state.auth?.token) {
    setMessage(
      formMessage,
      "Please login before submitting a project request.",
      "error"
    );
    return;
  }

  const payload = Object.fromEntries(
    new FormData(requestForm).entries()
  );

  try {
    await apiFetch("/api/requests", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    requestForm.reset();

    setMessage(
      formMessage,
      "Project request submitted successfully.",
      "success"
    );

    await loadClientRequests();

    if (state.auth.user.role === "ADMIN") {
      await loadAdminPanel();
    }

  } catch (error) {
    setMessage(formMessage, error.message, "error");
  }
}
/* ---- ADMIN REQUEST UPDATE ---- */

async function handleAdminRequestUpdate(event) {
  event.preventDefault();

  const form = event.target;

  if (!form.classList.contains("admin-request-form")) {
    return;
  }

  const requestId = form.dataset.requestId;

  const payload = {
    status: form.status.value.trim(),
    quoteAmount: form.quoteAmount.value.trim(),
    adminNotes: form.adminNotes.value.trim()
  };

  try {
    await apiFetch(`/api/admin/requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });

    await loadAdminPanel();
    await loadNotifications();

    alert("Request updated successfully.");

  } catch (error) {
    alert(error.message);
  }
}

/* ---- BLOCK USER ---- */

async function blockUser(userId) {

  const reason = prompt("Reason for blocking this user?");

  if (reason === null) return;

  try {

    await apiFetch(`/api/admin/users/${userId}/block`, {

      method: "PATCH",

      body: JSON.stringify({
        reason
      })

    });

    await loadAdminPanel();

  } catch (error) {

    alert(error.message);

  }

}

/* ---- UNBLOCK USER ---- */

async function unblockUser(userId) {

  try {

    await apiFetch(`/api/admin/users/${userId}/unblock`, {

      method: "PATCH"

    });

    await loadAdminPanel();

  } catch (error) {

    alert(error.message);

  }

}

/* ---- REMOVE USER ---- */

async function removeUser(userId) {

  const confirmDelete = confirm(
    "Remove this user permanently?"
  );

  if (!confirmDelete) return;

  try {

    await apiFetch(`/api/admin/users/${userId}`, {

      method: "DELETE"

    });

    await loadAdminPanel();

  } catch (error) {

    alert(error.message);

  }

}

/* ---- ADMIN PASSWORD ---- */

async function handleAdminPassword(event) {

  event.preventDefault();

  const payload = Object.fromEntries(
    new FormData(adminPasswordForm).entries()
  );

  try {

    await apiFetch("/api/admin/change-password", {

      method: "POST",

      body: JSON.stringify(payload)

    });

    adminPasswordForm.reset();

    setMessage(
      adminPasswordMessage,
      "Password updated successfully.",
      "success"
    );

  } catch (error) {

    setMessage(
      adminPasswordMessage,
      error.message,
      "error"
    );

  }

}
/* ---- EVENT BINDINGS ---- */

if (requestForm) {
  requestForm.addEventListener("submit", handleProjectRequest);
}

if (loginForm) {
  loginForm.addEventListener("submit", handleLogin);
}

if (adminLoginForm) {
  adminLoginForm.addEventListener(
    "submit",
    handleAdminLoginRequest
  );
}

if (adminOtpForm) {
  adminOtpForm.addEventListener(
    "submit",
    handleAdminCodeLogin
  );
}

if (registerForm) {
  registerForm.addEventListener(
    "submit",
    handleRegister
  );
}

if (registerOtpForm) {
  registerOtpForm.addEventListener(
    "submit",
    handleRegisterOtp
  );
}

if (passwordResetRequestForm) {
  passwordResetRequestForm.addEventListener(
    "submit",
    handlePasswordResetRequest
  );
}

if (passwordResetConfirmForm) {
  passwordResetConfirmForm.addEventListener(
    "submit",
    handlePasswordResetConfirm
  );
}

if (adminPasswordForm) {
  adminPasswordForm.addEventListener(
    "submit",
    handleAdminPassword
  );
}

if (logoutButton) {
  logoutButton.addEventListener(
    "click",
    handleLogout
  );
}

if (logoutHeaderButton) {
  logoutHeaderButton.addEventListener(
    "click",
    handleLogout
  );
}

if (backToRegisterBtn) {
  backToRegisterBtn.addEventListener(
    "click",
    handleBackToRegister
  );
}

/* ---- SEARCH ---- */

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

/* ---- INITIALIZE ---- */

async function init() {

  renderProjects();

  setupRevealAnimations();

  setupMobileNav();

  renderAuthState();

  if (state.auth?.token) {

    await refreshCurrentUser();

    connectSocket();

  }

}

document.addEventListener(
  "DOMContentLoaded",
  init
);