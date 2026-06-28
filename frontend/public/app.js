const projects = [
  {
    title: "FaceFix AI",
    type: "Photo Editing App",
    year: "Live",
    image: "/logo/facefixai.png",
    description:
      "An advanced AI-powered photo enhancement app designed to restore facial details, improve blurry portraits, and make old photos clearer, sharper, and more visually appealing.",
    tags: ["AI Face Enhancement", "Photo Upscaling", "Skin Smoothing"],
    url: "https://play.google.com/store/apps/details?id=com.kdstudios.facefixai"
  },
  {
    title: "ScanPro",
    type: "Scanner App",
    year: "Live",
    image: "/logo/ScanPro.png",
    description:
      "A smart document scanning app built for fast captures, cleaner pages, and easy digital sharing for daily work and personal use.",
    tags: ["Document Scanner", "PDF Export", "Productivity"],
    url: "https://play.google.com/store/apps/details?id=com.kdstudios.scanpro"
  },
  {
    title: "Custom Business Website",
    type: "Website",
    year: "Featured",
    description:
      "High-trust business websites designed for premium branding, fast performance, and confident lead generation.",
    tags: ["Business Website", "Lead Generation", "Premium UI"],
    url: "/request.html"
  },
  {
    title: "Stack Tower",
    type: "Game App",
    year: "Live",
    image: "/logo/Stack%20Tower.png",
    description:
      "A fun and addictive arcade game where players stack moving blocks to build the tallest tower possible with precise timing and increasing difficulty.",
    tags: ["One-Tap Gameplay", "Arcade", "In Testing"],
    url: "https://play.google.com/store/apps/details?id=com.kdstudios.stacktower"
  },
  {
    title: "Admin & Client Dashboard Systems",
    type: "Web App",
    year: "Featured",
    description:
      "Professional dashboard systems built for user management, request handling, secure access, notifications, and real workflows.",
    tags: ["Dashboard", "Admin Panel", "Client Workflow"],
    url: "/dashboard.html"
  }
];

/* ============================================================
   KD STUDIOS — Shared App Logic (Auth, Dashboard, Museum UI)
   ============================================================ */

const config = window.KD_STUDIOS_CONFIG || {};
const apiBaseUrl = (config.apiBaseUrl || "http://localhost:4000").replace(/\/$/, "");
const socketUrl = apiBaseUrl.replace(/^http/, "ws") + "/ws";
const storageKey = "kd_studios_auth";

/* ---- MUSEUM APP DATA ---- */
const museumApps = [
  {
    id: "facefix",
    title: "FaceFix AI",
    icon: "./logo/facefixai.png",
    description:
      "AI-powered photo enhancement for clearer portraits, restored facial details, and cleaner old photos.",
    tags: ["AI Enhancement", "Photo Editing", "Android"],
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.kdstudios.facefixai",
    category: "Photo Editing App"
  },
  {
    id: "scanpro",
    title: "ScanPro",
    icon: "./logo/ScanPro.png",
    description:
      "Document scanning for quick captures, cleaner pages, PDF export, and everyday productivity.",
    tags: ["Scanner", "PDF Tools", "Productivity"],
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.kdstudios.scanpro",
    category: "Scanner App"
  },
  {
    id: "stacktower",
    title: "Stack Tower",
    icon: "./logo/Stack%20Tower.png",
    description:
      "Arcade stacking gameplay with simple controls, precise timing, and replay-focused progression.",
    tags: ["Game App", "Arcade", "Android"],
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.kdstudios.stacktower",
    category: "Game App"
  }
];

/* ---- MUSEUM UI FUNCTIONS ---- */

function renderMuseumPedestals() {
  const grid = document.getElementById("pedestalGrid");
  if (!grid) return;

  grid.innerHTML = museumApps
    .map(
      (app) => `
    <div class="museum-pedestal" data-app-id="${app.id}">
      <div class="pedestal-base">
        <div class="pedestal-top">
          <img src="${app.icon}" alt="${app.title}" loading="lazy" />
        </div>
        <div class="pedestal-column"></div>
        <div class="pedestal-bottom"></div>
      </div>
      <div class="pedestal-label">${app.title}</div>
      <div class="pedestal-sub">${app.category}</div>
    </div>
  `
    )
    .join("");

  // Click to open overlay
  grid.querySelectorAll(".museum-pedestal").forEach((el) => {
    el.addEventListener("click", () => {
      const app = museumApps.find((a) => a.id === el.dataset.appId);
      if (app) openAppOverlay(app);
    });
  });
}

function openAppOverlay(app) {
  const overlay = document.getElementById("appOverlay");
  const icon = document.getElementById("overlayIcon");
  const title = document.getElementById("overlayTitle");
  const tags = document.getElementById("overlayTags");
  const desc = document.getElementById("overlayDesc");
  const playBtn = document.getElementById("overlayPlayBtn");
  if (!overlay) return;

  icon.src = app.icon;
  icon.alt = app.title;
  title.textContent = app.title;
  tags.innerHTML = app.tags.map((t) => `<span class="expanded-tag">${t}</span>`).join("");
  desc.textContent = app.description;
  playBtn.href = app.playStoreUrl;
  overlay.classList.add("open");
}

// Bridge for museum-3d.js
window.__KD_OPEN_OVERLAY__ = openAppOverlay;


function closeAppOverlay() {
  const overlay = document.getElementById("appOverlay");
  if (overlay) overlay.classList.remove("open");
}

function setupMuseumOverlay() {
  const overlay = document.getElementById("appOverlay");
  const closeBtn = document.getElementById("overlayCloseBtn");
  if (!overlay) return;

  closeBtn?.addEventListener("click", closeAppOverlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeAppOverlay();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAppOverlay();
  });
}

function setupDotMenu() {
  const btn = document.getElementById("dotMenuBtn");
  const dropdown = document.getElementById("dotDropdown");
  if (!btn || !dropdown) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains("open");
    dropdown.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(!isOpen));
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
      dropdown.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
  });

  dropdown.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      dropdown.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---- END MUSEUM UI ---- */

document.body?.classList.add("js-enabled");

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

const state = {
  auth: loadAuth(),
  socket: null
};


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
  if (!element) {
    return;
  }

  element.className = "form-message";
  if (type) {
    element.classList.add(type);
  }
  element.textContent = text;
}

function setHtml(element, html) {
  if (element) {
    element.innerHTML = html;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderProjects() {
  if (!featuredApps && !projectGrid) {
    return;
  }

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
            <div class="app-poster ${
              project.title === "FaceFix AI"
                ? "poster-facefix"
                : project.title === "Stack Tower"
                  ? "poster-stack"
                  : "poster-scanpro"
            }">
              <img class="app-poster-image" src="${project.image}" alt="${project.title} logo" loading="lazy" />
              <div class="poster-glow"></div>
              ${
                project.title === "FaceFix AI"
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
                  `
              }
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
  if (!revealItems.length) {
    return;
  }

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

function switchAuthTab(tabName) {
  if (!authTabs.length) {
    return;
  }

  authTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.authTab === tabName));
  if (loginForm) {
    loginForm.classList.toggle("hidden", tabName !== "login");
  }
  if (registerForm) {
    registerForm.classList.toggle("hidden", tabName !== "register");
  }
  if (passwordResetRequestForm) {
    passwordResetRequestForm.classList.toggle("hidden", tabName !== "reset");
  }
  if (passwordResetConfirmForm) {
    passwordResetConfirmForm.classList.toggle("hidden", tabName !== "reset");
  }
  if (adminOtpForm) {
    adminOtpForm.classList.add("hidden");
  }
}

function renderAuthState() {
  // Debug (remove after fixing):
  // console.log("renderAuthState", state.auth);
  if (!state.auth?.user) {

    if (accountTitle) {
      accountTitle.textContent = "Not logged in";
    }
    if (accountDescription) {
      accountDescription.textContent =
        "Login or register to submit project requests and track your briefs.";
    }
    if (logoutButton) {
      logoutButton.classList.add("hidden");
    }
    if (adminPanel) {
      adminPanel.classList.add("hidden");
    }
    setHtml(myRequests, '<p class="empty-state">Login to view your submitted requests.</p>');
    setHtml(notificationList, '<p class="empty-state">Login to see your notifications.</p>');
    return;
  }

  const roleLabel = state.auth.user.role === "ADMIN" ? "Admin" : "Client";
  if (accountTitle) {
    accountTitle.textContent = `${state.auth.user.name} (${roleLabel})`;
  }
  if (accountDescription) {
    accountDescription.textContent =
      state.auth.user.role === "ADMIN"
        ? "Owner dashboard unlocked. You can manage users, requests, replies, and security here."
        : "Client dashboard active. You can submit ideas, track quotes, and read admin replies.";
  }
  if (logoutButton) {
    logoutButton.classList.remove("hidden");
  }

  // If logout exists in the header (dashboard), show it.
  if (logoutHeaderButton) {
    logoutHeaderButton.classList.remove("hidden");
  }

  if (adminPanel) {
    adminPanel.classList.toggle("hidden", state.auth.user.role !== "ADMIN");
  }

  // Hide auth CTAs after login (but keep Login/Register on login page)
  if (document.body?.dataset?.page === "dashboard") {
    // Show logout header button first (in case other logic hides it)
    if (logoutHeaderButton) {
      logoutHeaderButton.classList.remove("hidden");
    }

    // Hide Login/Register in header (keep Logout visible)
    document
      .querySelectorAll('.header-actions .header-btn')
      .forEach((btn) => {
        btn.classList.add("hidden");
      });

    if (logoutHeaderButton) {
      logoutHeaderButton.classList.remove("hidden");
    }

    // Also sync the logout button inside the dashboard session panel.
    if (logoutButton) {
      logoutButton.classList.remove("hidden");
    }
  }




}

function renderClientRequests(requests) {
  if (!myRequests) {
    return;
  }

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
  if (!target) {
    return;
  }

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
  if (!auditLogList) {
    return;
  }

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
  if (!adminRequests) {
    return;
  }

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
  if (!adminUsers) {
    return;
  }

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
          ${
            user.role !== "ADMIN"
              ? `
                <div class="hero-actions compact">
                  ${
                    user.isBlocked
                      ? `<button class="btn btn-secondary admin-unblock-button" type="button" data-user-id="${escapeHtml(user.id)}">Unblock</button>`
                      : `<button class="btn btn-secondary admin-block-button" type="button" data-user-id="${escapeHtml(user.id)}">Block</button>`
                  }
                  <button class="btn btn-secondary admin-remove-button" type="button" data-user-id="${escapeHtml(user.id)}">Remove</button>
                </div>
              `
              : ""
          }
        </article>
      `
    )
    .join("");
}

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
  if (!adminPanel || state.auth?.user?.role !== "ADMIN") {
    return;
  }

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

function connectSocket() {
  if (!socketStatus) {
    return;
  }

  try {
    if (state.socket) {
      state.socket.close();
    }

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
    if (loginForm) {
      loginForm.reset();
    }
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

async function handleRegister(event) {
  event.preventDefault();
  setMessage(authMessage, "Sending OTP to your email...");
  const payload = Object.fromEntries(new FormData(registerForm).entries());

  try {
    const result = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    // Move to OTP verify screen
    if (registerOtpForm) {
      registerOtpForm.classList.remove("hidden");
      registerForm.classList.add("hidden");

      registerOtpForm.email.value = payload.email || "";
      registerOtpForm.name.value = payload.name || "";
      registerOtpForm.password.value = payload.password || "";
      registerOtpForm.phone.value = payload.phone || "";
    }

    setMessage(authMessage, "OTP sent. Check your email and verify.", "success");
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
}

async function handleRegisterOtpVerify(event) {
  event.preventDefault();
  if (!registerOtpForm) return;

  setMessage(authMessage, "Verifying OTP and creating account...");
  const payload = Object.fromEntries(new FormData(registerOtpForm).entries());

  try {
    const result = await apiFetch("/api/auth/register/otp/verify", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    saveAuth({ token: result.token, user: result.user });
    registerForm.reset();
    registerOtpForm.reset();

    // Return UI state
    registerOtpForm.classList.add("hidden");
    registerForm.classList.remove("hidden");

    setMessage(authMessage, "Registration successful. You are now logged in.", "success");
    renderAuthState();
    await loadClientRequests();
    await loadNotifications();
    redirectToDashboard();
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
}

function handleBackToRegister() {
  if (!registerOtpForm || !registerForm) return;
  registerOtpForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
  setMessage(authMessage, "Back to registration. Submit to resend OTP.");
}

async function handlePasswordResetRequest(event) {
  event.preventDefault();
  setMessage(authMessage, "Preparing password reset...");
  const payload = Object.fromEntries(new FormData(passwordResetRequestForm).entries());

  try {
    const result = await apiFetch("/api/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (passwordResetConfirmForm) {
      passwordResetConfirmForm.email.value = payload.email || "";
      passwordResetConfirmForm.classList.remove("hidden");
    }
    if (passwordResetRequestForm) {
      passwordResetRequestForm.classList.add("hidden");
    }
    if (passwordResetBackButton) {
      passwordResetBackButton.classList.remove("hidden");
    }

    setMessage(authMessage, `${result.message} Please use the reset code shared for your account to continue.`, "success");
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
}

function handlePasswordResetBack() {
  if (passwordResetRequestForm) {
    passwordResetRequestForm.classList.remove("hidden");
  }
  if (passwordResetConfirmForm) {
    passwordResetConfirmForm.classList.add("hidden");
    passwordResetConfirmForm.reset();
  }
  if (passwordResetBackButton) {
    passwordResetBackButton.classList.add("hidden");
  }
  setMessage(authMessage, "Enter your email to request a reset code.");
}

async function handlePasswordResetConfirm(event) {
  event.preventDefault();
  setMessage(authMessage, "Resetting password...");
  const payload = Object.fromEntries(new FormData(passwordResetConfirmForm).entries());

  try {
    const result = await apiFetch("/api/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    passwordResetConfirmForm.reset();
    setMessage(authMessage, result.message, "success");
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
}

async function handleLogout() {
  if (!state.auth?.token) {
    return;
  }

  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {}

  saveAuth(null);
  renderAuthState();
  renderClientRequests([]);
  renderNotifications([], notificationList);
  setHtml(adminStats, '<p class="empty-state">Login as admin to load dashboard stats.</p>');
  setHtml(adminRequests, '<p class="empty-state">Admin requests will appear here after login.</p>');
  setHtml(adminUsers, '<p class="empty-state">Admin users list will appear here after login.</p>');
  setHtml(adminNotificationList, '<p class="empty-state">Recent admin notifications will appear here.</p>');
  setHtml(auditLogList, '<p class="empty-state">Recent audit logs will appear here.</p>');
  if (adminContactInfo) {
    adminContactInfo.textContent = "Verified administrative contact details will appear here after admin login.";
  }
  setMessage(authMessage, "Logged out successfully.", "success");
}

async function handleAdminPasswordChange(event) {
  event.preventDefault();
  if (state.auth?.user?.role !== "ADMIN") {
    setMessage(adminPasswordMessage, "Only admin can change the admin password.", "error");
    return;
  }

  setMessage(adminPasswordMessage, "Updating admin password...");
  const payload = Object.fromEntries(new FormData(adminPasswordForm).entries());

  try {
    const result = await apiFetch("/api/admin/change-password", {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    adminPasswordForm.reset();
    setMessage(adminPasswordMessage, result.message, "success");
  } catch (error) {
    setMessage(adminPasswordMessage, error.message, "error");
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  if (!state.auth?.token || state.auth.user.role === "ADMIN") {
    setMessage(formMessage, "Please login with a client account first to submit a request.", "error");
    window.location.href = "/login.html";
    return;
  }

  setMessage(formMessage, "Submitting your project request...");
  const payload = Object.fromEntries(new FormData(requestForm).entries());

  try {
    const result = await apiFetch("/api/requests", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    requestForm.reset();
    setMessage(formMessage, result.message, "success");
    await loadClientRequests();
    await loadNotifications();
  } catch (error) {
    setMessage(formMessage, error.message, "error");
  }
}

async function handleAdminActionClick(event) {
  const blockButton = event.target.closest(".admin-block-button");
  const unblockButton = event.target.closest(".admin-unblock-button");
  const removeButton = event.target.closest(".admin-remove-button");

  if (blockButton) {
    const userId = blockButton.dataset.userId;
    const reason = window.prompt("Block reason for this user?", "Blocked by admin.");
    if (!reason) {
      return;
    }
    await apiFetch(`/api/admin/users/${userId}/block`, {
      method: "PATCH",
      body: JSON.stringify({ reason })
    });
    await loadAdminPanel();
    return;
  }

  if (unblockButton) {
    await apiFetch(`/api/admin/users/${unblockButton.dataset.userId}/unblock`, {
      method: "PATCH"
    });
    await loadAdminPanel();
    return;
  }

  if (removeButton) {
    const confirmRemove = window.confirm("Remove this user permanently?");
    if (!confirmRemove) {
      return;
    }
    await apiFetch(`/api/admin/users/${removeButton.dataset.userId}`, {
      method: "DELETE"
    });
    await loadAdminPanel();
  }
}

async function handleAdminRequestSubmit(event) {
  const form = event.target.closest(".admin-request-form");
  if (!form) {
    return;
  }

  event.preventDefault();
  const payload = Object.fromEntries(new FormData(form).entries());
  await apiFetch(`/api/admin/requests/${form.dataset.requestId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

  await loadAdminPanel();
}

function bindEvents() {
  if (requestForm) {
    requestForm.addEventListener("submit", handleSubmit);
  }
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  if (adminOtpForm) {
    adminOtpForm.addEventListener("submit", handleAdminCodeLogin);
  }
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
  if (registerOtpForm) {
    registerOtpForm.addEventListener("submit", handleRegisterOtpVerify);
  }
  if (backToRegisterBtn) {
    backToRegisterBtn.addEventListener("click", handleBackToRegister);
  }
  if (passwordResetRequestForm) {
    passwordResetRequestForm.addEventListener("submit", handlePasswordResetRequest);
  }
  if (passwordResetConfirmForm) {
    passwordResetConfirmForm.addEventListener("submit", handlePasswordResetConfirm);
  }
  if (passwordResetBackButton) {
    passwordResetBackButton.addEventListener("click", handlePasswordResetBack);
  }
  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout);
  }
  if (adminPasswordForm) {
    adminPasswordForm.addEventListener("submit", handleAdminPasswordChange);
  }
  if (adminRequestSearch) {
    adminRequestSearch.addEventListener("input", debounce(handleAdminSearch, 250));
  }
  if (adminUserSearch) {
    adminUserSearch.addEventListener("input", debounce(handleAdminSearch, 250));
  }
  if (adminRefreshButton) {
    adminRefreshButton.addEventListener("click", handleAdminRefresh);
  }
  if (adminPanel) {
    adminPanel.addEventListener("click", (event) => {
      handleAdminActionClick(event).catch((error) => setMessage(authMessage, error.message, "error"));
    });
    adminPanel.addEventListener("submit", (event) => {
      handleAdminRequestSubmit(event).catch((error) => setMessage(authMessage, error.message, "error"));
    });
  }
  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchAuthTab(tab.dataset.authTab));
  });
  if (homeButton) {
    homeButton.addEventListener("click", () => {
      window.location.href = "/index.html";
    });
  }
}

// Prevent this shared app script from affecting standalone auth pages
// where only specific auth forms should be visible.
// NOTE: admin-login.html loads BOTH app.js and admin-login.js.
// To avoid competing handlers, app.js should NOT bind events for admin-login page.
const page = document.body?.dataset?.page;
if (page === "admin-login") {
  // Leave admin-login.js responsible for admin auth.
  // Only ensure correct visibility.
  if (adminLoginForm) adminLoginForm.classList.remove("hidden");
  if (adminOtpForm) adminOtpForm.classList.add("hidden");
} else if (page === "login" || page === "register" || page === "reset-password") {
  const authForms = [
    loginForm,
    adminLoginForm,
    adminOtpForm,
    registerForm,
    registerOtpForm,
    passwordResetRequestForm,
    passwordResetConfirmForm
  ];

  authForms.forEach((form) => {
    if (form) form.classList.add("hidden");
  });

  if (page === "login") {
    loginForm?.classList.remove("hidden");
  } else if (page === "register") {
    registerForm?.classList.remove("hidden");
    registerOtpForm?.classList.add("hidden");
  } else if (page === "reset-password") {
    passwordResetRequestForm?.classList.remove("hidden");
    passwordResetConfirmForm?.classList.add("hidden");
    passwordResetBackButton?.classList.add("hidden");
  }

  bindEvents();
} else if (page === "home") {
  // Museum home page (3D)
  window.__KD_MUSEUM_APPS__ = museumApps;

  // Keep overlay + menu working
  setupMuseumOverlay();
  setupDotMenu();
  setupRevealAnimations();

  // Don’t render the old 2D grid
  const grid = document.getElementById("pedestalGrid");
  if (grid) grid.style.display = "none";

  bindEvents();
} else {
  renderProjects();
  setupRevealAnimations();
  setupMobileNav();
  bindEvents();
}
