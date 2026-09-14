/* KD Studios role-aware dashboard */
(function () {
  "use strict";

  const appData = window.KD_APP_DATA || {};
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const apiBaseUrl = (appData.apiBaseUrl || (isLocalhost ? "http://localhost:4000" : "")).replace(/\/$/, "");
  const storageKey = appData.storageKey || "kd_studios_auth";
  const requestStatuses = ["PENDING", "REVIEWING", "QUOTED", "APPROVED", "REJECTED"];

  const state = {
    auth: loadAuth(),
    apps: [],
    adminRequests: [],
    adminUsers: [],
    charts: []
  };

  const els = {
    publicDashboard: document.getElementById("publicDashboard"),
    userDashboard: document.getElementById("userDashboard"),
    adminDashboard: document.getElementById("adminDashboard"),
    publicApps: document.getElementById("dashboardPublicApps"),
    userApps: document.getElementById("dashboardUserApps"),
    myRequests: document.getElementById("dashboardMyRequests"),
    userTitle: document.getElementById("userDashboardTitle"),
    userDescription: document.getElementById("userDashboardDescription"),
    appManagerLink: document.getElementById("adminAppManagerLink"),
    stats: {
      users: document.getElementById("statTotalUsers"),
      requests: document.getElementById("statTotalRequests"),
      pending: document.getElementById("statPendingRequests"),
      blocked: document.getElementById("statBlockedUsers"),
      usersTrend: document.getElementById("statUsersTrend"),
      requestsTrend: document.getElementById("statRequestsTrend"),
      pendingTrend: document.getElementById("statPendingTrend"),
      blockedTrend: document.getElementById("statBlockedTrend")
    },
    requestsBody: document.getElementById("requestsTableBody"),
    usersBody: document.getElementById("usersTableBody"),
    auditBody: document.getElementById("auditTableBody"),
    notifications: document.getElementById("adminNotificationsList"),
    requestSearch: document.getElementById("requestSearch"),
    requestStatusFilter: document.getElementById("requestStatusFilter"),
    userSearch: document.getElementById("userSearch"),
    userRoleFilter: document.getElementById("userRoleFilter"),
    userStatusFilter: document.getElementById("userStatusFilter"),
    refreshRequests: document.getElementById("refreshRequestsBtn"),
    refreshUsers: document.getElementById("refreshUsersBtn")
  };

  function loadAuth() {
    try {
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

  function authHeaders() {
    return state.auth?.token ? { Authorization: `Bearer ${state.auth.token}` } : {};
  }

  async function apiFetch(path, options = {}) {
    const normalizedPath = path.startsWith("/api/") ? path : `/api${path.startsWith("/") ? path : `/${path}`}`;
    const response = await fetch(`${apiBaseUrl}${normalizedPath}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function shortId(value) {
    return String(value || "").slice(0, 8);
  }

  function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function normalizeApp(app) {
    const slug = app.slug || app.id || "";
    return {
      slug,
      title: app.title || "KD Studios App",
      category: app.category || app.type || "App",
      shortDescription: app.shortDescription || app.description || "",
      description: app.description || app.shortDescription || "",
      iconUrl: app.iconUrl || app.icon || app.image || "/logo/kd_logo.png",
      tags: app.tags || [],
      features: app.features || [],
      highlights: app.highlights || [],
      playStoreUrl: app.playStoreUrl || app.url || "",
      websiteUrl: app.websiteUrl || "",
      url: app.url && String(app.url).startsWith("/apps/") ? app.url : `/apps/${slug}`
    };
  }

  function setDashboardState(name) {
    els.publicDashboard?.classList.toggle("hidden", name !== "public");
    els.userDashboard?.classList.toggle("hidden", name !== "user");
    els.adminDashboard?.classList.toggle("hidden", name !== "admin");
    els.appManagerLink?.classList.toggle("hidden", name !== "admin");
  }

  async function loadApps() {
    try {
      const result = await apiFetch("/apps");
      state.apps = (result.apps || []).map(normalizeApp);
    } catch {
      state.apps = (appData.museumApps || []).map(normalizeApp);
    }
    return state.apps;
  }

  function renderAppCards(container, apps) {
    if (!container) return;
    const visibleApps = (apps || []).filter((app) => app.slug || app.url);
    if (!visibleApps.length) {
      container.innerHTML = '<p class="empty-state">No published app pages yet.</p>';
      return;
    }

    container.innerHTML = visibleApps
      .map((app) => {
        const detailUrl = app.url || `/apps/${app.slug}`;
        const chips = [...(app.highlights || []), ...(app.tags || []), app.category]
          .filter(Boolean)
          .slice(0, 4)
          .map((tag) => `<span>${escapeHtml(tag)}</span>`)
          .join("");
        return `
          <article class="dashboard-app-card">
            <a class="dashboard-app-main" href="${escapeHtml(detailUrl)}">
              <img src="${escapeHtml(app.iconUrl)}" alt="${escapeHtml(app.title)} icon" loading="lazy" />
              <div>
                <small>${escapeHtml(app.category)}</small>
                <h3>${escapeHtml(app.title)}</h3>
                <p>${escapeHtml(app.shortDescription || app.description)}</p>
              </div>
            </a>
            <div class="dashboard-app-chips">${chips}</div>
            <div class="dashboard-card-actions">
              <a href="${escapeHtml(detailUrl)}">Open Page</a>
              ${
                app.playStoreUrl
                  ? `<a href="${escapeHtml(app.playStoreUrl)}" target="_blank" rel="noreferrer">Play Store</a>`
                  : ""
              }
              ${
                app.websiteUrl
                  ? `<a href="${escapeHtml(app.websiteUrl)}" target="_blank" rel="noreferrer">Website</a>`
                  : ""
              }
            </div>
          </article>
        `;
      })
      .join("");
  }

  async function showPublicDashboard() {
    setDashboardState("public");
    await loadApps();
    renderAppCards(els.publicApps, state.apps);
  }

  async function showUserDashboard() {
    setDashboardState("user");
    const user = state.auth?.user || {};
    if (els.userTitle) els.userTitle.textContent = `Welcome, ${user.name || "User"}`;
    if (els.userDescription) {
      els.userDescription.textContent = "Only your request history, support links, and public app pages are shown here.";
    }
    await Promise.all([loadApps(), loadMyRequests()]);
    renderAppCards(els.userApps, state.apps);
  }

  async function loadMyRequests() {
    if (!els.myRequests) return;
    els.myRequests.innerHTML = '<p class="empty-state">Loading your requests...</p>';
    try {
      const result = await apiFetch("/requests/my");
      const requests = result.requests || [];
      if (!requests.length) {
        els.myRequests.innerHTML = '<p class="empty-state">No project requests yet.</p>';
        return;
      }
      els.myRequests.innerHTML = requests
        .map(
          (request) => `
            <article class="user-request-card">
              <div>
                <strong>${escapeHtml(request.projectType)}</strong>
                <p>${escapeHtml(request.details)}</p>
              </div>
              <span class="status-badge ${escapeHtml(String(request.status || "").toLowerCase())}">
                ${escapeHtml(request.status)}
              </span>
              <small>${formatDate(request.createdAt)}</small>
            </article>
          `
        )
        .join("");
    } catch (error) {
      els.myRequests.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    }
  }

  async function showAdminDashboard() {
    setDashboardState("admin");
    await loadAdminDashboard();
  }

  function setStat(element, value) {
    if (element) element.textContent = String(value ?? 0);
  }

  async function loadAdminDashboard() {
    try {
      const [dashboard, requestResult, userResult] = await Promise.all([
        apiFetch("/admin/dashboard"),
        apiFetch("/admin/requests"),
        apiFetch("/admin/users")
      ]);
      state.adminRequests = requestResult.requests || dashboard.recentRequests || [];
      state.adminUsers = userResult.users || dashboard.recentUsers || [];

      renderAdminStats(dashboard.stats || {}, state.adminRequests, state.adminUsers);
      renderRequestsTable();
      renderUsersTable();
      renderAuditLogs(dashboard.auditLogs || []);
      renderNotifications(dashboard.recentNotifications || []);
      renderCharts(state.adminRequests, state.adminUsers);
    } catch (error) {
      renderAdminError(error.message);
    }
  }

  function renderAdminStats(stats, requests, users) {
    const pendingCount = requests.filter((request) => ["PENDING", "REVIEWING"].includes(request.status)).length;
    const blockedCount = stats.blockedUserCount ?? users.filter((user) => user.isBlocked).length;
    setStat(els.stats.users, stats.userCount ?? users.length);
    setStat(els.stats.requests, stats.requestCount ?? requests.length);
    setStat(els.stats.pending, pendingCount);
    setStat(els.stats.blocked, blockedCount);
    if (els.stats.usersTrend) els.stats.usersTrend.textContent = `${users.length} listed`;
    if (els.stats.requestsTrend) els.stats.requestsTrend.textContent = `${requests.length} loaded`;
    if (els.stats.pendingTrend) els.stats.pendingTrend.textContent = pendingCount ? "Requires attention" : "All clear";
    if (els.stats.blockedTrend) els.stats.blockedTrend.textContent = `${blockedCount} active blocks`;
  }

  function filteredRequests() {
    const query = String(els.requestSearch?.value || "").toLowerCase();
    const status = els.requestStatusFilter?.value || "";
    return state.adminRequests.filter((request) => {
      const text = `${request.id} ${request.projectType} ${request.details} ${request.user?.name || ""} ${request.user?.email || ""}`.toLowerCase();
      return (!query || text.includes(query)) && (!status || request.status === status);
    });
  }

  function renderRequestsTable() {
    if (!els.requestsBody) return;
    const requests = filteredRequests();
    if (!requests.length) {
      els.requestsBody.innerHTML = '<tr class="loading-row"><td colspan="11">No requests found.</td></tr>';
      return;
    }
    els.requestsBody.innerHTML = requests
      .map(
        (request) => `
          <tr>
            <td>${escapeHtml(shortId(request.id))}</td>
            <td>${escapeHtml(request.projectType)}</td>
            <td>${escapeHtml(request.user?.name || "Unknown")}</td>
            <td>${escapeHtml(request.user?.email || request.user?.phone || "-")}</td>
            <td>${escapeHtml(request.budget || "-")}</td>
            <td>${escapeHtml(request.timeline || "-")}</td>
            <td><span class="status-badge ${escapeHtml(String(request.status || "").toLowerCase())}">${escapeHtml(request.status)}</span></td>
            <td>${escapeHtml(request.quoteAmount || "-")}</td>
            <td>${escapeHtml(request.adminNotes || "-")}</td>
            <td>${formatDate(request.createdAt)}</td>
            <td>
              <button class="action-btn dashboard-request-update" data-request-id="${escapeHtml(request.id)}" type="button" title="Update request">Edit</button>
            </td>
          </tr>
        `
      )
      .join("");
  }

  function filteredUsers() {
    const query = String(els.userSearch?.value || "").toLowerCase();
    const role = els.userRoleFilter?.value || "";
    const status = els.userStatusFilter?.value || "";
    return state.adminUsers.filter((user) => {
      const text = `${user.name} ${user.email} ${user.phone || ""}`.toLowerCase();
      const statusMatch = !status || (status === "blocked" ? user.isBlocked : !user.isBlocked);
      return (!query || text.includes(query)) && (!role || user.role === role) && statusMatch;
    });
  }

  function renderUsersTable() {
    if (!els.usersBody) return;
    const users = filteredUsers();
    if (!users.length) {
      els.usersBody.innerHTML = '<tr class="loading-row"><td colspan="9">No users found.</td></tr>';
      return;
    }
    els.usersBody.innerHTML = users
      .map(
        (user) => `
          <tr>
            <td>${escapeHtml(shortId(user.id))}</td>
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(user.phone || "-")}</td>
            <td><span class="role-badge ${escapeHtml(String(user.role || "").toLowerCase())}">${escapeHtml(user.role)}</span></td>
            <td><span class="status-badge ${user.isBlocked ? "blocked" : "active"}">${user.isBlocked ? "Blocked" : "Active"}</span></td>
            <td>${escapeHtml(user._count?.requests ?? 0)}</td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
              <button class="action-btn dashboard-user-toggle" data-user-id="${escapeHtml(user.id)}" data-blocked="${user.isBlocked ? "1" : "0"}" type="button">
                ${user.isBlocked ? "Unblock" : "Block"}
              </button>
              <button class="action-btn danger dashboard-user-delete" data-user-id="${escapeHtml(user.id)}" type="button">Delete</button>
            </td>
          </tr>
        `
      )
      .join("");
  }

  function renderAuditLogs(logs) {
    if (!els.auditBody) return;
    if (!logs.length) {
      els.auditBody.innerHTML = '<tr class="loading-row"><td colspan="7">No audit logs yet.</td></tr>';
      return;
    }
    els.auditBody.innerHTML = logs
      .map(
        (log) => `
          <tr>
            <td>${escapeHtml(log.action)}</td>
            <td>${escapeHtml(log.entityType || "-")}</td>
            <td>${escapeHtml(log.description || "-")}</td>
            <td>${escapeHtml(log.actor?.email || "-")}</td>
            <td>${escapeHtml(log.targetUser?.email || "-")}</td>
            <td>${escapeHtml(log.ipAddress || "-")}</td>
            <td>${formatDate(log.createdAt)}</td>
          </tr>
        `
      )
      .join("");
  }

  function renderNotifications(notifications) {
    if (!els.notifications) return;
    if (!notifications.length) {
      els.notifications.innerHTML = '<p class="empty-state">No notifications yet.</p>';
      return;
    }
    els.notifications.innerHTML = notifications
      .map(
        (notification) => `
          <article class="notification-item">
            <div class="notification-content">
              <div class="notification-title">${escapeHtml(notification.title || notification.type || "Notification")}</div>
              <div class="notification-message">${escapeHtml(notification.message || "")}</div>
              <div class="notification-time">${formatDate(notification.createdAt)}</div>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderAdminError(message) {
    const safeMessage = escapeHtml(message);
    if (els.requestsBody) els.requestsBody.innerHTML = `<tr class="loading-row"><td colspan="11">${safeMessage}</td></tr>`;
    if (els.usersBody) els.usersBody.innerHTML = `<tr class="loading-row"><td colspan="9">${safeMessage}</td></tr>`;
    if (els.auditBody) els.auditBody.innerHTML = `<tr class="loading-row"><td colspan="7">${safeMessage}</td></tr>`;
  }

  function renderCharts(requests, users) {
    if (!window.Chart) return;
    state.charts.forEach((chart) => chart.destroy());
    state.charts = [];

    const requestCanvas = document.getElementById("requestsChart");
    const usersCanvas = document.getElementById("usersChart");
    const statusCanvas = document.getElementById("statusChart");
    const statusCounts = requestStatuses.map((status) => requests.filter((request) => request.status === status).length);

    if (requestCanvas) {
      state.charts.push(new Chart(requestCanvas, {
        type: "bar",
        data: {
          labels: requestStatuses,
          datasets: [{ label: "Requests", data: statusCounts, backgroundColor: "#b8864e" }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      }));
    }

    if (usersCanvas) {
      const active = users.filter((user) => !user.isBlocked).length;
      const blocked = users.length - active;
      state.charts.push(new Chart(usersCanvas, {
        type: "doughnut",
        data: {
          labels: ["Active", "Blocked"],
          datasets: [{ data: [active, blocked], backgroundColor: ["#16a34a", "#dc2626"] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      }));
    }

    if (statusCanvas) {
      state.charts.push(new Chart(statusCanvas, {
        type: "line",
        data: {
          labels: requests.slice(0, 12).reverse().map((request) => formatDate(request.createdAt)),
          datasets: [{ label: "Recent requests", data: requests.slice(0, 12).map((_, index) => index + 1).reverse(), borderColor: "#3b82f6", tension: 0.3 }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      }));
    }
  }

  async function verifyAuth() {
    if (!state.auth?.token) return null;
    try {
      const result = await apiFetch("/auth/me");
      saveAuth({ token: state.auth.token, user: result.user });
      return result.user;
    } catch (error) {
      if (error?.statusCode === 401 || error?.statusCode === 403) {
        saveAuth(null);
        return null;
      }
      return state.auth?.user || null;
    }
  }

  async function updateRequest(requestId) {
    const current = state.adminRequests.find((request) => request.id === requestId);
    if (!current) return;
    const status = window.prompt(`Status (${requestStatuses.join(", ")})`, current.status || "PENDING");
    if (!status) return;
    const normalizedStatus = status.trim().toUpperCase();
    if (!requestStatuses.includes(normalizedStatus)) {
      window.alert("Invalid status.");
      return;
    }
    const quoteAmount = window.prompt("Quote amount", current.quoteAmount || "") || "";
    const adminNotes = window.prompt("Admin notes / reply", current.adminNotes || "") || "";
    await apiFetch(`/admin/requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: normalizedStatus, quoteAmount, adminNotes })
    });
    await loadAdminDashboard();
  }

  async function toggleUser(userId, blocked) {
    const reason = blocked ? "" : window.prompt("Reason for blocking this user", "Blocked by admin.");
    if (!blocked && reason === null) return;
    await apiFetch(`/admin/users/${userId}/${blocked ? "unblock" : "block"}`, {
      method: "PATCH",
      body: JSON.stringify({ reason })
    });
    await loadAdminDashboard();
  }

  async function deleteUser(userId) {
    if (!window.confirm("Delete this user permanently?")) return;
    await apiFetch(`/admin/users/${userId}`, { method: "DELETE" });
    await loadAdminDashboard();
  }

  function bindEvents() {
    els.requestSearch?.addEventListener("input", renderRequestsTable);
    els.requestStatusFilter?.addEventListener("change", renderRequestsTable);
    els.userSearch?.addEventListener("input", renderUsersTable);
    els.userRoleFilter?.addEventListener("change", renderUsersTable);
    els.userStatusFilter?.addEventListener("change", renderUsersTable);
    els.refreshRequests?.addEventListener("click", loadAdminDashboard);
    els.refreshUsers?.addEventListener("click", loadAdminDashboard);

    document.addEventListener("click", async (event) => {
      const requestButton = event.target.closest(".dashboard-request-update");
      if (requestButton) {
        await updateRequest(requestButton.dataset.requestId);
        return;
      }

      const toggleButton = event.target.closest(".dashboard-user-toggle");
      if (toggleButton) {
        await toggleUser(toggleButton.dataset.userId, toggleButton.dataset.blocked === "1");
        return;
      }

      const deleteButton = event.target.closest(".dashboard-user-delete");
      if (deleteButton) {
        await deleteUser(deleteButton.dataset.userId);
      }
    });
  }

  async function init() {
    bindEvents();
    const user = await verifyAuth();
    if (!user) {
      await showPublicDashboard();
      return;
    }
    if (user.role === "ADMIN") {
      await showAdminDashboard();
      return;
    }
    await showUserDashboard();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
