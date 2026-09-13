/* ============================================================
KD STUDIOS — Core App Logic (UI, WebSocket, Initialization)
============================================================ */

var { projects, apiBaseUrl, socketUrl, storageKey } = window.KD_APP_DATA || {};
const featuredApps = document.getElementById("featuredApps");

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

/* ---- SOCKET (Lazy-loaded) ---- */
let socketConnectPromise = null;

function connectSocket() {
  // Return existing connection promise if already connecting/connected
  if (socketConnectPromise) {
    return socketConnectPromise;
  }

  socketConnectPromise = (async () => {
    // Don't connect if no auth token
    if (!state.auth?.token) {
      socketConnectPromise = null;
      return;
    }

    // Don't connect if already connected
    if (state.socket?.readyState === WebSocket.OPEN) {
      return;
    }

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
        // Reconnect after 5 seconds only if still authenticated
        if (state.auth?.token) {
          setTimeout(connect, 5000);
        }
      };

      state.socket.onerror = () => {
        if (socketStatus) {
          socketStatus.textContent = "Error";
          socketStatus.className = "socket-status error";
        }
      };
    }

    await connect();
  })();

  return socketConnectPromise;
}

// Call this when auth state changes (login/logout)
function updateSocketConnection() {
  state.auth = window.KD_AUTH_CORE?.state?.auth || null;
  if (state.auth?.token && socketUrl) {
    connectSocket();
  } else if (state.socket) {
    state.socket.close();
    state.socket = null;
    socketConnectPromise = null;
  }
}

function handleSocketMessage(data) {
  switch (data.type) {
    case "notification":
      addNotification(data.notification);
      break;
    case "request_update":
      if (window.KD_DASHBOARD_ADMIN) {
        window.KD_DASHBOARD_ADMIN.renderMyRequests();
        if (adminPanel && !adminPanel.classList.contains("hidden")) {
          window.KD_DASHBOARD_ADMIN.loadAdminRequests();
        }
      }
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

/* ---- UTILITIES ---- */
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/* ---- STATE (minimal - for socket) ---- */
const state = {
  auth: window.KD_AUTH_CORE?.state?.auth || null,
  socket: null
};

/* ---- INITIALIZE ---- */
async function init() {
  // Render projects (from dashboard-admin)
  if (window.KD_DASHBOARD_ADMIN) {
    window.KD_DASHBOARD_ADMIN.renderProjects();
  }

  setupRevealAnimations();
  setupMobileNav();

  // Initialize museum UI (dot menu, overlay)
  if (window.KD_MUSEUM_UI) {
    window.KD_MUSEUM_UI.setupDotMenu();
    window.KD_MUSEUM_UI.setupMuseumOverlay();
  }

  // Render auth state (from auth-core)
  if (window.KD_AUTH_CORE) {
    window.KD_AUTH_CORE.renderAuthState();
  }

  // Render dashboard state (from dashboard-admin)
  if (window.KD_DASHBOARD_ADMIN) {
    window.KD_DASHBOARD_ADMIN.renderDashboardState();
  }

  renderFeaturedApps();

  // If authenticated, refresh user and connect socket
  if (window.KD_AUTH_CORE?.state?.auth?.token) {
    await window.KD_AUTH_CORE.refreshCurrentUser();
    connectSocket();
  }
}

document.addEventListener("DOMContentLoaded", init);

/* ---- EXPORTS ---- */
window.KD_APP_CORE = {
  init,
  renderFeaturedApps,
  connectSocket,
  updateSocketConnection,
  setupRevealAnimations,
  setupMobileNav,
  state
};
