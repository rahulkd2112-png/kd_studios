/* ============================================================
KD STUDIOS — Dashboard & Admin Core
============================================================ */

var { projects, apiBaseUrl, socketUrl, storageKey } = window.KD_APP_DATA || {};

/* ---- DOM ELEMENTS (Dashboard/Admin) ---- */
const projectGrid = document.getElementById("projectGrid");
const requestForm = document.getElementById("requestForm");
const formMessage = document.getElementById("formMessage");
const accountTitle = document.getElementById("accountTitle");
const accountDescription = document.getElementById("accountDescription");
const myRequests = document.getElementById("myRequests");
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

/* ---- DASHBOARD ROLE-BASED RENDERING ---- */
function renderDashboardState() {
  const publicDashboard = document.getElementById("publicDashboard");
  const userDashboard = document.getElementById("userDashboard");
  const adminDashboard = document.getElementById("adminDashboard");
  
  if (!publicDashboard && !userDashboard && !adminDashboard) {
    return; // Not on dashboard page
  }

  const isLoggedIn = !!window.KD_AUTH_CORE?.state?.auth?.token;
  const user = window.KD_AUTH_CORE?.state?.auth?.user;
  const isAdmin = user?.role === "ADMIN";

  // Hide all first
  [publicDashboard, userDashboard, adminDashboard].forEach(el => {
    if (el) el.classList.add("hidden");
  });

  if (isAdmin) {
    if (adminDashboard) adminDashboard.classList.remove("hidden");
  } else if (isLoggedIn) {
    if (userDashboard) userDashboard.classList.remove("hidden");
  } else {
    if (publicDashboard) publicDashboard.classList.remove("hidden");
  }
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

/* ---- RENDER MY REQUESTS ---- */
function renderMyRequests() {
  if (!myRequests) return;
  myRequests.innerHTML = `
    <div class="loading">Loading your requests...</div>
  `;
  const apiFetch = window.KD_AUTH_CORE?.apiFetch;
  if (!apiFetch) return;
  
  apiFetch("/requests/my")
    .then((result) => {
      const requests = result.requests || [];
      if (!requests.length) {
        myRequests.innerHTML = "<p>No requests yet.</p>";
        return;
      }
      myRequests.innerHTML = requests
        .map(
          (r) => `
        <div class="request-card">
          <h4>${r.projectType}</h4>
          <p>${r.details}</p>
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

/* ---- HANDLE REQUEST SUBMIT ---- */
async function handleRequestSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const projectType = form.projectType.value.trim();
  const budget = form.budget.value.trim();
  const timeline = form.timeline.value.trim();
  const details = form.details.value.trim();
  const setMessage = window.KD_AUTH_CORE?.setMessage;
  const clearMessage = window.KD_AUTH_CORE?.clearMessage;
  const apiFetch = window.KD_AUTH_CORE?.apiFetch;
  
  if (clearMessage) clearMessage(formMessage);

  try {
    await apiFetch("/requests", {
      method: "POST",
      body: JSON.stringify({ projectType, budget, timeline, details })
    });
    if (setMessage) setMessage(formMessage, "Request submitted successfully!", "success");
    form.reset();
    renderMyRequests();
  } catch (err) {
    if (setMessage) setMessage(formMessage, err.message, "error");
  }
}

/* ---- ADMIN PANEL ---- */
async function loadAdminPanel() {
  const state = window.KD_AUTH_CORE?.state;
  if (state?.auth?.user?.role !== "ADMIN" || !adminPanel) return;

  adminPanel.classList.remove("hidden");
  await Promise.all([loadAdminStats(), loadAdminRequests(), loadAdminUsers()]);
}

async function loadAdminStats() {
  if (!adminStats) return;
  const apiFetch = window.KD_AUTH_CORE?.apiFetch;
  if (!apiFetch) return;
  
  try {
    const result = await apiFetch("/admin/dashboard");
    const stats = result.stats || {};
    adminStats.innerHTML = `
      <div class="stat-card"><h3>${stats.userCount || 0}</h3><p>Total Users</p></div>
      <div class="stat-card"><h3>${stats.requestCount || 0}</h3><p>Total Requests</p></div>
      <div class="stat-card"><h3>${stats.blockedUserCount || 0}</h3><p>Blocked Users</p></div>
    `;
  } catch {
    adminStats.innerHTML = "<p>Failed to load stats.</p>";
  }
}

async function loadAdminRequests() {
  if (!adminRequests) return;
  const apiFetch = window.KD_AUTH_CORE?.apiFetch;
  if (!apiFetch) return;
  
  try {
    const result = await apiFetch("/admin/requests");
    const requests = result.requests || [];
    adminRequests.innerHTML = requests
      .map(
        (r) => `
      <div class="admin-request-card">
        <h4>${r.projectType}</h4>
        <p>${r.details}</p>
        <div class="request-meta">
          <span>By: ${r.user?.name || "Unknown"} (${r.user?.email || "No email"})</span>
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
  if (!adminUsers) return;
  const apiFetch = window.KD_AUTH_CORE?.apiFetch;
  if (!apiFetch) return;
  
  try {
    const result = await apiFetch("/admin/users");
    const users = result.users || [];
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
  const apiFetch = window.KD_AUTH_CORE?.apiFetch;
  if (!apiFetch) return;
  
  try {
    await apiFetch(`/admin/users/${userId}/block`, { method: "PATCH" });
    loadAdminUsers();
  } catch (err) {
    alert(err.message);
  }
}

async function unblockUser(userId) {
  const apiFetch = window.KD_AUTH_CORE?.apiFetch;
  if (!apiFetch) return;
  
  try {
    await apiFetch(`/admin/users/${userId}/unblock`, { method: "PATCH" });
    loadAdminUsers();
  } catch (err) {
    alert(err.message);
  }
}

async function removeUser(userId) {
  const apiFetch = window.KD_AUTH_CORE?.apiFetch;
  if (!apiFetch) return;
  
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
  const apiFetch = window.KD_AUTH_CORE?.apiFetch;
  if (!apiFetch) return;

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

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

async function handleAdminSearch(event) {
  const query = event.target.value.toLowerCase();
  const target = event.target.id === "adminRequestSearch" ? adminRequests : adminUsers;
  if (!target) return;

  target.querySelectorAll(".admin-request-card, .admin-user-card").forEach((card) => {
    const text = card.textContent.toLowerCase();
    card.classList.toggle("hidden", !text.includes(query));
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
  const setMessage = window.KD_AUTH_CORE?.setMessage;
  const clearMessage = window.KD_AUTH_CORE?.clearMessage;
  const apiFetch = window.KD_AUTH_CORE?.apiFetch;
  if (!apiFetch) return;
  
  if (clearMessage) clearMessage(adminPasswordMessage);

  try {
    await apiFetch("/admin/change-password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (setMessage) setMessage(adminPasswordMessage, "Password changed successfully!", "success");
    form.reset();
  } catch (err) {
    if (setMessage) setMessage(adminPasswordMessage, err.message, "error");
  }
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
  if (event.target.classList.contains("admin-request-form")) {
    await handleAdminRequestUpdate(event);
  }
});

/* ---- EVENT LISTENERS (Dashboard/Admin) ---- */
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

/* ---- HOME BUTTON ---- */
if (homeButton) {
  homeButton.addEventListener("click", () => {
    window.location.href = "/";
  });
}

/* ---- EXPORTS ---- */
window.KD_DASHBOARD_ADMIN = {
  renderDashboardState,
  renderProjects,
  renderMyRequests,
  handleRequestSubmit,
  loadAdminPanel,
  loadAdminStats,
  loadAdminRequests,
  loadAdminUsers,
  blockUser,
  unblockUser,
  removeUser,
  handleAdminRequestUpdate,
  handleAdminSearch,
  handleAdminRefresh,
  handleAdminPasswordChange
};