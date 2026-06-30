/* ============================================================
   KD STUDIOS — Museum UI Module
   ============================================================ */

/* ---- MUSEUM UI FUNCTIONS ---- */

function renderMuseumPedestals() {
  const grid = document.getElementById("pedestalGrid");
  if (!grid) return;

  const museumApps = (window.KD_APP_DATA || {}).museumApps || [];
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

/* ---- EXPORTS ---- */
window.KD_MUSEUM_UI = {
  renderMuseumPedestals,
  openAppOverlay,
  closeAppOverlay,
  setupMuseumOverlay,
  setupDotMenu
};