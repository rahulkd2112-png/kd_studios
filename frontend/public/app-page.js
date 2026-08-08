/* KD Studios public app landing page */
(function () {
  "use strict";

  const config = window.KD_APP_DATA || {};
  const apiBaseUrl = (config.apiBaseUrl || "http://localhost:4000").replace(/\/$/, "");
  const state = {
    app: null
  };

  const els = {
    title: document.getElementById("appTitle"),
    category: document.getElementById("appCategory"),
    tagline: document.getElementById("appTagline"),
    description: document.getElementById("appDescription"),
    icon: document.getElementById("appIcon"),
    heroImage: document.getElementById("appHeroImage"),
    tags: document.getElementById("appTags"),
    features: document.getElementById("appFeatures"),
    highlights: document.getElementById("appHighlights"),
    gallery: document.getElementById("appGallery"),
    playStore: document.getElementById("appPlayStore"),
    website: document.getElementById("appWebsite"),
    status: document.getElementById("appStatus"),
    pageTitle: document.querySelector("title")
  };

  function getSlug() {
    const pathMatch = window.location.pathname.match(/\/apps\/([^/?#]+)/);
    if (pathMatch) return decodeURIComponent(pathMatch[1]);
    return new URLSearchParams(window.location.search).get("slug") || "";
  }

  function setText(element, value) {
    if (element) element.textContent = value || "";
  }

  function setList(container, items, className, fallback) {
    if (!container) return;
    const values = (items || []).filter(Boolean);
    if (!values.length && fallback) values.push(fallback);
    container.innerHTML = "";
    values.forEach((item) => {
      const node = document.createElement("span");
      node.className = className;
      node.textContent = item;
      container.appendChild(node);
    });
  }

  function setFeatureList(container, items) {
    if (!container) return;
    container.innerHTML = "";
    (items || []).filter(Boolean).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      container.appendChild(li);
    });
  }

  function setGallery(container, app) {
    if (!container) return;
    const images = [app.heroImageUrl, ...(app.gallery || [])].filter(Boolean);
    container.innerHTML = "";
    images.slice(0, 6).forEach((src, index) => {
      const figure = document.createElement("figure");
      figure.className = "app-gallery-item";
      const img = document.createElement("img");
      img.src = src;
      img.alt = `${app.title} preview ${index + 1}`;
      img.loading = "lazy";
      figure.appendChild(img);
      container.appendChild(figure);
    });
  }

  function setLink(link, href) {
    if (!link) return;
    if (href) {
      link.href = href;
      link.classList.remove("hidden");
    } else {
      link.classList.add("hidden");
    }
  }

  function render(app) {
    state.app = app;
    document.documentElement.style.setProperty("--app-accent", app.accentColor || "#b8864e");
    if (els.pageTitle) els.pageTitle.textContent = `${app.title} | KD Studios`;
    setText(els.title, app.title);
    setText(els.category, app.category);
    setText(els.tagline, app.tagline);
    setText(els.description, app.description);
    setText(els.status, app.shortDescription);
    if (els.icon) {
      els.icon.src = app.iconUrl;
      els.icon.alt = `${app.title} icon`;
    }
    if (els.heroImage) {
      els.heroImage.src = app.heroImageUrl || app.iconUrl;
      els.heroImage.alt = `${app.title} preview`;
    }
    setList(els.tags, app.tags, "app-tag", app.category);
    setList(els.highlights, app.highlights, "app-highlight", app.category);
    setFeatureList(els.features, app.features);
    setGallery(els.gallery, app);
    setLink(els.playStore, app.playStoreUrl);
    setLink(els.website, app.websiteUrl);
  }

  function showError(message) {
    const shell = document.getElementById("appLandingShell");
    if (shell) {
      shell.innerHTML = "";
      const section = document.createElement("section");
      section.className = "museum-section app-error-state";
      const chip = document.createElement("span");
      chip.className = "section-chip";
      chip.textContent = "Unavailable";
      const title = document.createElement("h2");
      title.textContent = "App page is not available";
      const text = document.createElement("p");
      text.textContent = message;
      const link = document.createElement("a");
      link.className = "museum-btn museum-btn-primary";
      link.href = "/index.html";
      link.textContent = "Back to gallery";
      section.append(chip, title, text, link);
      shell.appendChild(section);
    }
  }

  async function init() {
    const slug = getSlug();
    if (!slug) {
      showError("This app page URL is missing a slug.");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/apps/${encodeURIComponent(slug)}`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "App page not found.");
      render(result.app);
    } catch (error) {
      showError(error.message);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
