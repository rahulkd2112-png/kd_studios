/* KD Studios app-page data bridge: API first, static fallback */
(function () {
  "use strict";

  const fallbackApps = window.__KD_MUSEUM_APPS__ || [];
  const config = window.KD_APP_DATA || {};
  const apiBaseUrl = (config.apiBaseUrl || "http://localhost:4000").replace(/\/$/, "");

  function toMuseumApp(app) {
    return {
      id: app.slug || app.id,
      slug: app.slug,
      title: app.title,
      icon: app.iconUrl,
      description: app.shortDescription || app.description,
      tags: app.tags || [],
      playStoreUrl: app.playStoreUrl || app.websiteUrl || "#",
      landingUrl: app.url || `/apps/${app.slug}`,
      category: app.category,
      accentColor: app.accentColor,
      raw: app
    };
  }

  function publishApps(apps) {
    const normalized = apps.map(toMuseumApp);
    window.__KD_PUBLIC_APPS__ = apps;
    window.__KD_MUSEUM_APPS__ = normalized;
    if (window.KD_APP_DATA) {
      window.KD_APP_DATA.museumApps = normalized;
    }
    window.dispatchEvent(new CustomEvent("kd:apps-loaded", { detail: { apps, normalized } }));
    renderAppCards(normalized);
    return normalized;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderCard(app) {
    const tags = (app.tags || []).slice(0, 3).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
    const href = app.landingUrl || app.playStoreUrl || `/apps/${app.slug || app.id}`;
    return `
      <article class="project-card">
        <img src="${escapeHtml(app.icon)}" alt="${escapeHtml(app.title)}" loading="lazy" />
        <div class="project-info">
          <h3>${escapeHtml(app.title)}</h3>
          <p>${escapeHtml(app.description)}</p>
          <div class="project-tags">${tags}</div>
          <a href="${escapeHtml(href)}" class="project-link">View App Page</a>
        </div>
      </article>
    `;
  }

  function renderAppCards(apps) {
    const projectGrid = document.getElementById("projectGrid");
    const featuredApps = document.getElementById("featuredApps");
    if (projectGrid) {
      projectGrid.innerHTML = apps.map(renderCard).join("");
    }
    if (featuredApps) {
      featuredApps.innerHTML = apps.slice(0, 3).map(renderCard).join("");
    }
  }

  window.KD_APP_PAGES_READY = fetch(`${apiBaseUrl}/api/apps`, {
    headers: { "Content-Type": "application/json" }
  })
    .then((response) => {
      if (!response.ok) throw new Error("Unable to load app pages.");
      return response.json();
    })
    .then((result) => publishApps(result.apps || []))
    .catch(() => {
      window.__KD_PUBLIC_APPS__ = fallbackApps.map((app) => ({
        slug: app.id,
        title: app.title,
        category: app.category,
        tagline: app.description,
        shortDescription: app.description,
        description: app.description,
        iconUrl: app.icon,
        heroImageUrl: app.icon,
        tags: app.tags || [],
        features: app.tags || [],
        highlights: app.tags || [],
        playStoreUrl: app.playStoreUrl,
        accentColor: "#b8864e",
        url: `/apps/${app.id}`
      }));
      window.dispatchEvent(new CustomEvent("kd:apps-loaded", { detail: { apps: window.__KD_PUBLIC_APPS__, normalized: fallbackApps } }));
      renderAppCards(fallbackApps);
      return fallbackApps;
    });
})();
