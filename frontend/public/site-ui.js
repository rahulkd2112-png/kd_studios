/* Shared interface shell for every public page. */
(function () {
  "use strict";

  const storageKey = "kd_studios_auth";
  const page = document.body?.dataset.page || "";

  function getAuth() {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function navLink(href, label, activePages) {
    const active = activePages.includes(page) ? " aria-current=\"page\"" : "";
    return `<a href="${href}"${active}>${label}</a>`;
  }

  function protectRoute() {
    const auth = getAuth();
    const hasSession = Boolean(auth?.token);
    const authPages = ["login", "register", "admin-login"];

    if (hasSession && authPages.includes(page)) {
      window.location.replace("/dashboard.html");
      return true;
    }

    if (page === "app-manager" && (!hasSession || auth?.user?.role !== "ADMIN")) {
      window.location.replace(hasSession ? "/dashboard.html" : "/admin-login.html");
      return true;
    }

    return false;
  }

  function renderHeader() {
    const header = document.querySelector(".museum-navbar");
    if (!header) return;

    const auth = getAuth();
    const user = auth?.user;
    const isAdmin = user?.role === "ADMIN";
    const managerPage = page === "app-manager";
    const authActions = auth?.token
      ? `<span class="user-greeting" title="Signed in as ${escapeHtml(user?.email || "")}">${escapeHtml(user?.name || "Account")}</span>
         <a class="museum-btn museum-btn-outline" href="/dashboard.html">Workspace</a>
         ${isAdmin ? '<a class="museum-btn museum-btn-outline admin-link" href="/app-manager.html">Manage</a>' : ""}
         <button id="${managerPage ? "logoutBtn" : "logoutHeaderButton"}" class="museum-btn museum-btn-primary" type="button">Log out</button>`
      : `<a class="museum-btn museum-btn-outline" href="/login.html">Log in</a>
         <a class="museum-btn museum-btn-primary" href="/request.html">Start a project</a>`;

    header.innerHTML = `
      <a class="museum-brand" href="/index.html" aria-label="KD Studios home">
        <img src="/logo/kd_logo.png" alt="KD Studios" />
        <span><strong>KD Studios</strong><small>Digital product studio</small></span>
      </a>
      <nav class="site-nav" aria-label="Primary navigation">
        ${navLink("/index.html", "Studio", ["home"])}
        ${navLink("/work.html", "Work", ["work", "app"])}
        ${navLink("/services.html", "Services", ["services"])}
        ${navLink("/request.html", "Contact", ["request", "contact-support"])}
      </nav>
      <div class="museum-auth-actions">${authActions}</div>
      <button class="site-menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false"><span></span><span></span></button>
      <div class="site-mobile-menu" hidden>
        <a href="/index.html">Studio</a><a href="/work.html">Work</a><a href="/services.html">Services</a><a href="/request.html">Contact</a>
      </div>`;

    const toggle = header.querySelector(".site-menu-toggle");
    const menu = header.querySelector(".site-mobile-menu");
    toggle?.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });

    const logoutButton = header.querySelector("#logoutHeaderButton");
    logoutButton?.addEventListener("click", async () => {
      const auth = getAuth();
      const config = window.KD_STUDIOS_CONFIG || {};
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const apiBaseUrl = (config.apiBaseUrl || (isLocalhost ? "http://localhost:4000" : "")).replace(/\/$/, "");

      try {
        await fetch(`${apiBaseUrl}/api/auth/logout`, {
          method: "POST",
          headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}
        });
      } catch {
        // A local sign-out is still useful when the API cannot be reached.
      }

      sessionStorage.removeItem(storageKey);
      window.location.assign("/index.html");
    });
  }

  function renderHomeApps() {
    const grid = document.getElementById("studioAppGrid");
    if (!grid) return;
    const apps = window.__KD_PUBLIC_APPS__ || window.__KD_MUSEUM_APPS__ || window.KD_APP_DATA?.museumApps || [];
    const visible = apps.slice(0, 6);
    grid.innerHTML = visible.map((app, index) => {
      const title = escapeHtml(app.title || "KD Studio App");
      const summary = escapeHtml(app.shortDescription || app.description || "A focused digital experience built by KD Studios.");
      const icon = escapeHtml(app.iconUrl || app.icon || app.image || "/logo/kd_logo.png");
      const href = app.slug ? `/apps/${encodeURIComponent(app.slug)}` : (app.landingUrl || app.url || "/work.html");
      const type = escapeHtml(app.category || app.type || "Digital product");
      const playStoreUrl = app.playStoreUrl || app.websiteUrl || app.url || "";
      const storeLink = playStoreUrl ? `<a class="product-card-store" href="${escapeHtml(playStoreUrl)}" target="_blank" rel="noopener noreferrer">Play Store</a>` : "";
      return `<article class="product-card reveal visible" style="--card-index:${index}">
        <div class="product-card-top"><span>${type}</span><span class="product-index">0${index + 1}</span></div>
        <img src="${icon}" alt="${title}" loading="lazy" />
        <div class="product-card-body"><h3>${title}</h3><p>${summary}</p>
          <div class="product-card-links">
            <a href="${href}">Explore product <span aria-hidden="true">&rarr;</span></a>
            ${storeLink}
          </div>
        </div>
      </article>`;
    }).join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  if (protectRoute()) return;
  renderHeader();
  renderHomeApps();
  const appsReady = window.KD_APP_PAGES_READY;
  if (appsReady) {
    appsReady.then(renderHomeApps).catch(renderHomeApps);
  }
  document.documentElement.classList.add("site-ui-ready");
})();
