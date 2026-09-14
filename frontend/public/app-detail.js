/* KD Studios App Detail Page - Enhanced Logic */
(function () {
  "use strict";

  class AppDetailPage {
    constructor() {
      this.app = null;
      this.gallery = null;
      this.observer = null;
      this.init();
    }

    init() {
      // Wait for app data to be loaded
      if (window.KD_APP_DETAIL_DATA) {
        this.onAppDataReady(window.KD_APP_DETAIL_DATA);
      } else {
        window.addEventListener('kd:app-loaded', (e) => {
          if (e.detail && e.detail.app) {
            this.onAppDataReady(e.detail.app);
          }
        });
      }

      // Initialize intersection observer for animations
      this.initScrollAnimations();
      
      // Initialize related apps carousel
      this.initRelatedApps();
    }

    onAppDataReady(app) {
      this.app = app;
      this.renderPage();
      this.initializeGallery();
      this.setupCTAButtons();
      this.trackPageView();
    }

    renderPage() {
      if (!this.app) return;

      // Update page title
      document.title = `${this.app.title} | KD Studios`;

      // Update hero section
      this.renderHero();
      
      // Update features section
      this.renderFeatures();
      
      // Update specs section
      this.renderSpecs();
      
      // Update description section
      this.renderDescription();
      
      // Update gallery section
      this.renderGallerySection();
      
      // Update related apps
      this.renderRelatedApps();
      
      // Update footer CTA
      this.renderFooterCTA();
    }

    renderHero() {
      const hero = document.querySelector('.app-landing-hero');
      if (!hero) return;

      const accentColor = this.app.accentColor || '#b8864e';
      hero.style.setProperty('--hero-accent', accentColor);

      // Update hero content
      const badge = hero.querySelector('.app-category-badge');
      if (badge) badge.textContent = this.app.category || 'App';

      const title = hero.querySelector('h1');
      if (title) title.textContent = this.app.title;

      const tagline = hero.querySelector('.app-tagline');
      if (tagline) tagline.textContent = this.app.tagline || this.app.shortDescription || '';

      const description = hero.querySelector('.app-description');
      if (description) description.textContent = this.app.description || '';

      // Update hero image
      const heroImg = hero.querySelector('.app-hero-image img');
      if (heroImg && this.app.heroImageUrl) {
        heroImg.src = this.app.heroImageUrl;
        heroImg.alt = `${this.app.title} hero image`;
      }

      // Update app icon
      const iconImg = hero.querySelector('.app-icon-large img');
      if (iconImg && this.app.iconUrl) {
        iconImg.src = this.app.iconUrl;
        iconImg.alt = `${this.app.title} icon`;
      }

      // Update rating
      this.renderRating(hero);

      // Update CTA buttons
      this.renderHeroCTAs(hero);
    }

    renderRating(container) {
      const ratingContainer = container.querySelector('.app-rating');
      if (!ratingContainer) return;

      if (this.app.rating) {
        const { value, count } = this.app.rating;
        ratingContainer.innerHTML = `
          <div class="rating-stars" aria-label="Rated ${value} out of 5 stars">
            ${this.generateStars(value)}
          </div>
          <span class="rating-value">${value.toFixed(1)}</span>
          <span class="rating-count">(${count.toLocaleString()} reviews)</span>
        `;
      } else {
        ratingContainer.innerHTML = `
          <div class="rating-stars" aria-label="Not rated yet">
            ${this.generateStars(0)}
          </div>
          <span class="rating-value">New</span>
          <span class="rating-count">Be the first to review</span>
        `;
      }
    }

    generateStars(rating) {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

      let stars = '';
      for (let i = 0; i < fullStars; i++) {
        stars += '<svg class="star filled" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
      }
      if (hasHalfStar) {
        stars += '<svg class="star half" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
      }
      for (let i = 0; i < emptyStars; i++) {
        stars += '<svg class="star empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
      }
      return stars;
    }

    renderHeroCTAs(container) {
      const ctaContainer = container.querySelector('.app-hero-ctas');
      if (!ctaContainer) return;

      const playStoreUrl = this.app.playStoreUrl || '#';
      const websiteUrl = this.app.websiteUrl || '#';

      ctaContainer.innerHTML = `
        ${playStoreUrl !== '#' ? `
          <a href="${this.escapeHtml(playStoreUrl)}" class="museum-btn primary app-cta-btn" target="_blank" rel="noopener noreferrer" data-track="cta_play_store">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c1.1 0 2-.9 2-2V7h2v2h2v2h-2v2h2c.55 0 1 .45 1 1v3h-1c-.9 0-1.65.58-1.9 1.39z"/></svg>
            <span>Get on Play Store</span>
          </a>
        ` : ''}
        ${websiteUrl !== '#' && websiteUrl !== playStoreUrl ? `
          <a href="${this.escapeHtml(websiteUrl)}" class="museum-btn secondary app-cta-btn" target="_blank" rel="noopener noreferrer" data-track="cta_website">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            <span>Visit Website</span>
          </a>
        ` : ''}
        <button class="museum-btn ghost app-cta-btn" data-track="cta_share" id="shareBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="19" r="3"></circle><line x1="21" y1="21" x2="15" y2="15"></line></svg>
          <span>Share</span>
        </button>
      `;

      // Bind share button
      const shareBtn = ctaContainer.querySelector('#shareBtn');
      if (shareBtn) {
        shareBtn.addEventListener('click', () => this.showShareModal());
      }
    }

    renderFeatures() {
      const container = document.querySelector('.app-features-grid');
      if (!container) return;

      const features = this.app.features || this.app.highlights || [];
      
      if (!features.length) {
        container.innerHTML = '<p class="no-features">No features listed yet.</p>';
        return;
      }

      container.innerHTML = features.map((feature, index) => `
        <article class="feature-card" style="--delay: ${index * 100}ms">
          <div class="feature-icon">
            ${this.getFeatureIcon(feature)}
          </div>
          <h3 class="feature-title">${this.escapeHtml(feature.title || feature)}</h3>
          <p class="feature-description">${this.escapeHtml(feature.description || '')}</p>
        </article>
      `).join('');
    }

    getFeatureIcon(feature) {
      // Default icons based on feature keywords
      const text = (feature.title || feature).toLowerCase();
      const iconMap = {
        'ai': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path><path d="M12 6v4"></path><path d="M12 14v4"></path><path d="M6 12h4"></path><path d="M14 12h4"></path></svg>',
        'scan': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><line x1="7" y1="12" x2="17" y2="12"></line></svg>',
        'edit': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
        'filter': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>',
        'export': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>',
        'cloud': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>',
        'offline': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>',
        'fast': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 19 22 12 13 5 13 19"></polygon></svg>',
        'secure': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
      };

      for (const [keyword, icon] of Object.entries(iconMap)) {
        if (text.includes(keyword)) return icon;
      }

      // Default icon
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>';
    }

    renderSpecs() {
      const container = document.querySelector('.app-specs-table');
      if (!container) return;

      const specs = [
        { label: 'Version', value: this.app.version || '1.0' },
        { label: 'Size', value: this.app.fileSize || 'Varies with device' },
        { label: 'Android Version', value: this.app.minAndroidVersion || '5.0+' },
        { label: 'Category', value: this.app.category || 'App' },
        { label: 'Updated', value: this.app.updatedAt ? new Date(this.app.updatedAt).toLocaleDateString() : 'Recent' },
        { label: 'Developer', value: 'KD Studios' },
        { label: 'Price', value: 'Free' },
        { label: 'In-App Purchases', value: this.app.hasIAP ? 'Yes' : 'No' }
      ];

      // Add permissions if available
      if (this.app.permissions && this.app.permissions.length) {
        specs.push({ 
          label: 'Permissions', 
          value: this.app.permissions.join(', ') 
        });
      }

      container.innerHTML = `
        <dl class="specs-list">
          ${specs.map(spec => `
            <div class="spec-item">
              <dt class="spec-label">${this.escapeHtml(spec.label)}</dt>
              <dd class="spec-value">${this.escapeHtml(spec.value)}</dd>
            </div>
          `).join('')}
        </dl>
      `;
    }

    renderDescription() {
      const container = document.querySelector('.app-full-description');
      if (!container) return;

      const description = this.app.description || this.app.longDescription || '';
      
      if (!description) {
        container.innerHTML = '<p>No detailed description available.</p>';
        return;
      }

      // Convert markdown-like formatting to HTML
      const formatted = this.formatDescription(description);
      container.innerHTML = formatted;
    }

    formatDescription(text) {
      return text
        .split('\n\n')
        .map(para => {
          // Handle bullet points
          if (para.trim().startsWith('- ') || para.trim().startsWith('• ')) {
            const items = para.split('\n').map(line => 
              line.trim().replace(/^[-•]\s*/, '')
            ).filter(Boolean);
            return `<ul>${items.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>`;
          }
          // Handle headers
          if (para.trim().startsWith('## ')) {
            return `<h3>${this.escapeHtml(para.replace('## ', ''))}</h3>`;
          }
          if (para.trim().startsWith('# ')) {
            return `<h2>${this.escapeHtml(para.replace('# ', ''))}</h2>`;
          }
          return `<p>${this.escapeHtml(para)}</p>`;
        })
        .join('');
    }

    renderGallerySection() {
      const container = document.querySelector('.app-gallery-section');
      if (!container) return;

      const galleryImages = this.app.gallery || this.app.screenshots || [];
      
      if (!galleryImages.length) {
        container.style.display = 'none';
        return;
      }

      container.style.display = 'block';
      
      // Initialize gallery component
      const galleryContainer = container.querySelector('.app-gallery-container');
      if (galleryContainer && window.AppGallery) {
        this.gallery = new window.AppGallery({
          container: galleryContainer,
          images: galleryImages
        });
      }
    }

    renderRelatedApps() {
      const container = document.querySelector('.related-apps-grid');
      if (!container) return;

      // Get related apps from global data or use fallback
      const allApps = window.__KD_MUSEUM_APPS__ || window.__KD_PUBLIC_APPS__ || [];
      const relatedApps = allApps
        .filter(app => app.slug !== this.app.slug)
        .slice(0, 4);

      if (!relatedApps.length) {
        container.closest('.related-apps-section').style.display = 'none';
        return;
      }

      container.innerHTML = relatedApps.map(app => `
        <article class="related-app-card" data-slug="${this.escapeHtml(app.slug)}">
          <a href="/apps/${this.escapeHtml(app.slug)}" class="related-app-link">
            <div class="related-app-icon">
              <img src="${this.escapeHtml(app.icon)}" alt="" loading="lazy" decoding="async" />
            </div>
            <h3 class="related-app-title">${this.escapeHtml(app.title)}</h3>
            <p class="related-app-category">${this.escapeHtml(app.category)}</p>
            <span class="related-app-cta">View →</span>
          </a>
        </article>
      `).join('');

      // Track clicks
      container.querySelectorAll('.related-app-link').forEach(link => {
        link.addEventListener('click', (e) => {
          const card = e.currentTarget.closest('.related-app-card');
          this.trackEvent('related_app_click', { 
            from: this.app.slug, 
            to: card.dataset.slug 
          });
        });
      });
    }

    renderFooterCTA() {
      const container = document.querySelector('.app-footer-cta');
      if (!container) return;

      const playStoreUrl = this.app.playStoreUrl || '#';
      
      container.innerHTML = `
        <div class="footer-cta-content">
          <h2>Ready to try ${this.escapeHtml(this.app.title)}?</h2>
          <p>Join thousands of users who love this app.</p>
          <a href="${this.escapeHtml(playStoreUrl)}" class="museum-btn primary large" target="_blank" rel="noopener noreferrer" data-track="cta_footer_download">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c1.1 0 2-.9 2-2V7h2v2h2v2h-2v2h2c.55 0 1 .45 1 1v3h-1c-.9 0-1.65.58-1.9 1.39z"/></svg>
            Download on Play Store
          </a>
        </div>
      `;
    }

    initializeGallery() {
      // Gallery is initialized in renderGallerySection
    }

    setupCTAButtons() {
      // Track all CTA clicks
      document.querySelectorAll('[data-track]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const trackName = e.currentTarget.dataset.track;
          this.trackEvent(trackName, { app: this.app.slug });
        });
      });
    }

    initScrollAnimations() {
      // Intersection observer for scroll animations
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      // Observe elements after render
      setTimeout(() => {
        document.querySelectorAll('.feature-card, .spec-item, .related-app-card, .app-gallery-item').forEach(el => {
          this.observer.observe(el);
        });
      }, 100);
    }

    initRelatedApps() {
      // Related apps are rendered in renderRelatedApps
    }

    showShareModal() {
      if (!this.app) return;

      const config = {
        title: this.app.title,
        description: this.app.shortDescription || this.app.tagline || '',
        url: window.location.href,
        twitterHandle: '@kdstudios'
      };

      const urls = window.AppSEO?.getShareUrls?.(config) || {};

      // Create share modal
      const modal = document.createElement('div');
      modal.className = 'share-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Share app');
      
      modal.innerHTML = `
        <div class="share-modal-backdrop" aria-hidden="true"></div>
        <div class="share-modal-content">
          <button class="share-modal-close" aria-label="Close share dialog" type="button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <h3>Share ${this.escapeHtml(this.app.title)}</h3>
          <div class="share-options">
            ${urls.twitter ? `<a href="${urls.twitter}" class="share-option twitter" target="_blank" rel="noopener" data-track="share_twitter"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 9.72h-3.308l-7.227-8.26-8.502-9.72h3.308l7.227 8.26-8.502 9.72h3.308l7.227-8.26 8.502-9.72z"/></svg><span>Twitter</span></a>` : ''}
            ${urls.facebook ? `<a href="${urls.facebook}" class="share-option facebook" target="_blank" rel="noopener" data-track="share_facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg><span>Facebook</span></a>` : ''}
            ${urls.linkedin ? `<a href="${urls.linkedin}" class="share-option linkedin" target="_blank" rel="noopener" data-track="share_linkedin"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg><span>LinkedIn</span></a>` : ''}
            ${urls.whatsapp ? `<a href="${urls.whatsapp}" class="share-option whatsapp" target="_blank" rel="noopener" data-track="share_whatsapp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378 9.86 9.86 0 0 1-1.379-5.031 9.87 9.87 0 0 1 5.031-1.378 9.86 9.86 0 0 1 1.379 5.031c0 2.734-1.047 5.198-2.875 6.94"/></svg><span>WhatsApp</span></a>` : ''}
            ${urls.email ? `<a href="${urls.email}" class="share-option email" data-track="share_email"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg><span>Email</span></a>` : ''}
            <button class="share-option copy-link" data-track="share_copy" id="copyLinkBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy Link</span>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      document.body.style.overflow = 'hidden';

      // Animate in
      requestAnimationFrame(() => modal.classList.add('open'));

      // Bind events
      modal.querySelector('.share-modal-close').addEventListener('click', () => this.closeShareModal(modal));
      modal.querySelector('.share-modal-backdrop').addEventListener('click', () => this.closeShareModal(modal));
      modal.querySelector('#copyLinkBtn').addEventListener('click', () => this.copyLink(config.url));

      // Track share opened
      this.trackEvent('share_modal_open', { app: this.app.slug });
    }

    closeShareModal(modal) {
      modal.classList.remove('open');
      setTimeout(() => {
        modal.remove();
        document.body.style.overflow = '';
      }, 200);
    }

    async copyLink(url) {
      try {
        await navigator.clipboard.writeText(url);
        this.showToast('Link copied to clipboard!');
        this.trackEvent('share_copy_success', { app: this.app.slug });
      } catch (e) {
        this.showToast('Failed to copy link');
      }
    }

    showToast(message) {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('show'));
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 200);
      }, 2000);
    }

    trackPageView() {
      this.trackEvent('app_page_view', { 
        app: this.app.slug,
        title: this.app.title,
        category: this.app.category
      });
    }

    trackEvent(eventName, data) {
      if (window.gtag) {
        window.gtag('event', eventName, data);
      }
      window.dispatchEvent(new CustomEvent('kd:analytics', { 
        detail: { event: eventName, ...data } 
      }));
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    window.AppDetailPage = new AppDetailPage();
  });

  // Export for module usage
  window.AppDetailPage = AppDetailPage;
})();