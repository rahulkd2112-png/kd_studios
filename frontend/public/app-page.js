/* KD Studios public app landing page - Enhanced with modular architecture */
(function () {
  "use strict";

  const config = window.KD_APP_DATA || {};
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const apiBaseUrl = (config.apiBaseUrl || (isLocalhost ? "http://localhost:4000" : "")).replace(/\/$/, "");
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
    rating: document.getElementById("appRating"),
    heroCTAs: document.getElementById("appHeroCTAs"),
    featuresGrid: document.getElementById("appFeaturesGrid"),
    specsTable: document.getElementById("appSpecsTable"),
    fullDescription: document.getElementById("appFullDescription"),
    galleryContainer: document.getElementById("appGalleryContainer"),
    gallerySection: document.getElementById("appGallerySection"),
    relatedAppsGrid: document.getElementById("relatedAppsGrid"),
    footerCTA: document.getElementById("appFooterCTA"),
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

  function createStar(filled = true, half = false) {
    const star = document.createElement("span");
    star.className = "star" + (filled ? " filled" : " empty") + (half ? " half" : "");
    star.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    return star;
  }

  function setRating(container, app) {
    if (!container) return;
    const rating = app.rating || 4.5;
    const reviewCount = app.reviewCount || 0;
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    
    container.innerHTML = "";
    
    const starsContainer = document.createElement("div");
    starsContainer.className = "rating-stars";
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        starsContainer.appendChild(createStar(true, false));
      } else if (i === fullStars && hasHalf) {
        starsContainer.appendChild(createStar(true, true));
      } else {
        starsContainer.appendChild(createStar(false, false));
      }
    }
    
    const valueEl = document.createElement("span");
    valueEl.className = "rating-value";
    valueEl.textContent = rating.toFixed(1);
    
    const countEl = document.createElement("span");
    countEl.className = "rating-count";
    countEl.textContent = `(${reviewCount.toLocaleString()} reviews)`;
    
    container.appendChild(starsContainer);
    container.appendChild(valueEl);
    container.appendChild(countEl);
  }

  function setHeroCTAs(container, app) {
    if (!container) return;
    container.innerHTML = "";
    
    if (app.playStoreUrl) {
      const btn = document.createElement("a");
      btn.className = "museum-btn museum-btn-primary app-cta-btn large";
      btn.href = app.playStoreUrl;
      btn.target = "_blank";
      btn.rel = "noopener noreferrer";
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.19.26 2.25.68 3.15.65.9 1.77 1.45 3.02 1.56.27.02.54.02.81.02.28 0 .55-.01.82-.02 1.25-.11 2.37-.66 3.02-1.56.42-.9.68-1.96.68-3.15V9.59c-.02-.58-.03-1.16-.03-1.74 0-.57.01-1.14.03-1.71V3.08c-.27.01-.54.01-.81.01-1.25.11-2.37.66-3.02 1.56-.42.9-.68 1.96-.68 3.15v1l2.79-.89c.13.58.21 1.17.21 1.79 0 4.08-3.05 7.44-7 7.93z"/>
        </svg>
        Get on Play Store
      `;
      container.appendChild(btn);
    }
    
    if (app.websiteUrl) {
      const btn = document.createElement("a");
      btn.className = "museum-btn museum-btn-outline app-cta-btn large";
      btn.href = app.websiteUrl;
      btn.target = "_blank";
      btn.rel = "noopener noreferrer";
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        Visit Website
      `;
      container.appendChild(btn);
    }
    
    // Share button
    const shareBtn = document.createElement("button");
    shareBtn.className = "museum-btn museum-btn-outline app-cta-btn large";
    shareBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      Share
    `;
    shareBtn.addEventListener("click", () => {
      if (window.KDAppDetail && window.KDAppDetail.openShareModal) {
        window.KDAppDetail.openShareModal(app);
      }
    });
    container.appendChild(shareBtn);
  }

  function setFeaturesGrid(container, app) {
    if (!container) return;
    const features = app.features || [];
    container.innerHTML = "";
    
    features.forEach((feature, index) => {
      const card = document.createElement("div");
      card.className = "feature-card";
      card.style.setProperty("--delay", `${index * 100}ms`);
      
      // Use feature icon if available, otherwise default
      const iconSvg = feature.icon || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
      
      card.innerHTML = `
        <div class="feature-icon">${iconSvg}</div>
        <h3 class="feature-title">${feature.title || feature}</h3>
        <p class="feature-description">${feature.description || ""}</p>
      `;
      container.appendChild(card);
    });
  }

  function setSpecsTable(container, app) {
    if (!container) return;
    const specs = [
      { label: "Category", value: app.category },
      { label: "Version", value: app.version || "1.0.0" },
      { label: "Last Updated", value: app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : "—" },
      { label: "Size", value: app.size || "—" },
      { label: "Requires", value: app.requires || "Android 5.0+" },
      { label: "Developer", value: "KD Studios" },
      { label: "License", value: app.license || "Free" },
      { label: "Languages", value: app.languages || "English" }
    ].filter(s => s.value && s.value !== "—");
    
    container.innerHTML = "";
    const list = document.createElement("div");
    list.className = "specs-list";
    
    specs.forEach((spec, index) => {
      const item = document.createElement("div");
      item.className = "spec-item";
      item.style.setProperty("--delay", `${index * 50}ms`);
      item.innerHTML = `
        <span class="spec-label">${spec.label}</span>
        <span class="spec-value">${spec.value}</span>
      `;
      list.appendChild(item);
    });
    
    container.appendChild(list);
  }

  function setFullDescription(container, app) {
    if (!container) return;
    const desc = app.fullDescription || app.description || "";
    container.innerHTML = desc.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
  }

  function setGalleryContainer(container, section, app) {
    if (!container || !section) return;
    const images = [app.heroImageUrl, ...(app.gallery || [])].filter(Boolean);
    
    if (!images.length) {
      section.style.display = "none";
      return;
    }
    
    section.style.display = "block";
    container.innerHTML = "";
    
    images.forEach((src, index) => {
      const figure = document.createElement("figure");
      figure.className = "app-gallery-item";
      figure.style.setProperty("--delay", `${index * 100}ms`);
      figure.dataset.index = index;
      
      const img = document.createElement("img");
      img.src = src;
      img.alt = `${app.title} preview ${index + 1}`;
      img.loading = index === 0 ? "eager" : "lazy";
      
      const caption = document.createElement("figcaption");
      caption.className = "gallery-caption";
      caption.textContent = index === 0 ? "Main Preview" : `Screenshot ${index}`;
      
      figure.appendChild(img);
      figure.appendChild(caption);
      container.appendChild(figure);
      
      // Click to open lightbox
      figure.addEventListener("click", () => {
        if (window.KDAppGallery && window.KDAppGallery.openLightbox) {
          window.KDAppGallery.openLightbox(images, index);
        }
      });
    });
  }

  function setRelatedAppsGrid(container, app) {
    if (!container) return;
    const allApps = window.KD_APP_CATALOG || [];
    const related = allApps
      .filter(a => a.slug !== app.slug && (a.category === app.category || a.tags?.some(t => app.tags?.includes(t))))
      .slice(0, 4);
    
    if (!related.length) {
      container.parentElement.style.display = "none";
      return;
    }
    
    container.innerHTML = "";
    
    related.forEach((relatedApp, index) => {
      const card = document.createElement("article");
      card.className = "related-app-card";
      card.style.setProperty("--delay", `${index * 100}ms`);
      
      card.innerHTML = `
        <a class="related-app-link" href="/apps/${relatedApp.slug}.html">
          <div class="related-app-icon">
            <img src="${relatedApp.iconUrl}" alt="${relatedApp.title} icon" loading="lazy">
          </div>
          <h3 class="related-app-title">${relatedApp.title}</h3>
          <p class="related-app-category">${relatedApp.category}</p>
          <span class="related-app-cta">
            View Details
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </span>
        </a>
      `;
      container.appendChild(card);
    });
  }

  function setFooterCTA(container, app) {
    if (!container) return;
    container.innerHTML = `
      <div class="footer-cta-content">
        <h2>Ready to build something amazing?</h2>
        <p>Let's discuss your next project. Our team is ready to bring your ideas to life.</p>
        <a class="museum-btn museum-btn-primary" href="/request.html">Start a Project</a>
      </div>
    `;
  }

  function render(app) {
    state.app = app;
    document.documentElement.style.setProperty("--app-accent", app.accentColor || "#b8864e");
    document.documentElement.style.setProperty("--hero-accent", app.accentColor || "#b8864e");
    
    if (els.pageTitle) els.pageTitle.textContent = `${app.title} | KD Studios`;
    setText(els.title, app.title);
    setText(els.category, app.category);
    setText(els.tagline, app.tagline);
    setText(els.description, app.description);
    
    if (els.icon) {
      els.icon.src = app.iconUrl;
      els.icon.alt = `${app.title} icon`;
    }
    if (els.heroImage) {
      els.heroImage.src = app.heroImageUrl || app.iconUrl;
      els.heroImage.alt = `${app.title} preview`;
    }
    
    setList(els.tags, app.tags, "app-tag", app.category);
    setRating(els.rating, app);
    setHeroCTAs(els.heroCTAs, app);
    setFeaturesGrid(els.featuresGrid, app);
    setSpecsTable(els.specsTable, app);
    setFullDescription(els.fullDescription, app);
    setGalleryContainer(els.galleryContainer, els.gallerySection, app);
    setRelatedAppsGrid(els.relatedAppsGrid, app);
    setFooterCTA(els.footerCTA, app);
    
    // Initialize gallery module with images
    if (window.KDAppGallery && window.KDAppGallery.init) {
      const images = [app.heroImageUrl, ...(app.gallery || [])].filter(Boolean);
      window.KDAppGallery.init(images);
    }
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