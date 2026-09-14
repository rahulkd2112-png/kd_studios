/* KD Studios App Gallery Lightbox Component */
(function () {
  "use strict";

  class AppGallery {
    constructor(options = {}) {
      this.container = options.container;
      this.images = options.images || [];
      this.currentIndex = 0;
      this.isOpen = false;
      this.touchStartX = 0;
      this.touchEndX = 0;
      this.zoomLevel = 1;
      this.minZoom = 1;
      this.maxZoom = 3;
      
      this.init();
    }

    init() {
      if (!this.container) return;
      this.renderGallery();
      this.bindEvents();
    }

    renderGallery() {
      if (!this.images.length) {
        this.container.innerHTML = '<p class="gallery-empty">No screenshots available</p>';
        return;
      }

      this.container.innerHTML = this.images.map((src, index) => `
        <figure class="app-gallery-item" data-index="${index}" tabindex="0" role="button" aria-label="View screenshot ${index + 1}">
          <img 
            src="${this.escapeHtml(src)}" 
            alt="App screenshot ${index + 1}" 
            loading="lazy"
            decoding="async"
          />
          <figcaption class="gallery-caption">Screenshot ${index + 1}</figcaption>
        </figure>
      `).join('');

      // Add click handlers to gallery items
      this.container.querySelectorAll('.app-gallery-item').forEach(item => {
        item.addEventListener('click', () => this.open(parseInt(item.dataset.index, 10)));
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.open(parseInt(item.dataset.index, 10));
          }
        });
      });
    }

    bindEvents() {
      // Keyboard navigation
      document.addEventListener('keydown', (e) => this.handleKeydown(e));
      
      // Touch swipe
      document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
      document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
      
      // Window resize
      window.addEventListener('resize', () => this.handleResize());
    }

    open(index = 0) {
      if (!this.images.length) return;
      
      this.currentIndex = Math.max(0, Math.min(index, this.images.length - 1));
      this.isOpen = true;
      this.zoomLevel = 1;
      
      this.createLightbox();
      this.showLightbox();
      this.updateLightboxContent();
      this.trapFocus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Analytics event
      this.trackEvent('gallery_open', { index: this.currentIndex, total: this.images.length });
    }

    close() {
      if (!this.isOpen) return;
      
      this.isOpen = false;
      this.hideLightbox();
      document.body.style.overflow = '';
      this.removeFocusTrap();
      
      // Analytics event
      this.trackEvent('gallery_close', { index: this.currentIndex });
    }

    createLightbox() {
      if (document.getElementById('appGalleryLightbox')) return;

      const lightbox = document.createElement('div');
      lightbox.id = 'appGalleryLightbox';
      lightbox.className = 'app-gallery-lightbox';
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-modal', 'true');
      lightbox.setAttribute('aria-label', 'Screenshot gallery');
      
      lightbox.innerHTML = `
        <div class="lightbox-backdrop" aria-hidden="true"></div>
        <button class="lightbox-close" aria-label="Close gallery" type="button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <button class="lightbox-nav lightbox-prev" aria-label="Previous screenshot" type="button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button class="lightbox-nav lightbox-next" aria-label="Next screenshot" type="button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <div class="lightbox-content">
          <figure class="lightbox-figure">
            <img class="lightbox-image" src="" alt="" />
            <figcaption class="lightbox-caption"></figcaption>
          </figure>
          <div class="lightbox-counter" aria-live="polite"></div>
        </div>
        <div class="lightbox-thumbnails" aria-label="Thumbnails"></div>
      `;

      document.body.appendChild(lightbox);
      this.lightbox = lightbox;
      this.bindLightboxEvents();
      this.renderThumbnails();
    }

    bindLightboxEvents() {
      const lb = this.lightbox;
      
      lb.querySelector('.lightbox-close').addEventListener('click', () => this.close());
      lb.querySelector('.lightbox-prev').addEventListener('click', () => this.prev());
      lb.querySelector('.lightbox-next').addEventListener('click', () => this.next());
      lb.querySelector('.lightbox-backdrop').addEventListener('click', () => this.close());
      
      // Image click to zoom
      const img = lb.querySelector('.lightbox-image');
      img.addEventListener('click', (e) => this.toggleZoom(e));
      img.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
      
      // Thumbnail clicks
      lb.querySelector('.lightbox-thumbnails').addEventListener('click', (e) => {
        const thumb = e.target.closest('.lightbox-thumb');
        if (thumb) {
          this.open(parseInt(thumb.dataset.index, 10));
        }
      });
    }

    renderThumbnails() {
      const container = this.lightbox.querySelector('.lightbox-thumbnails');
      container.innerHTML = this.images.map((src, index) => `
        <button 
          class="lightbox-thumb ${index === this.currentIndex ? 'active' : ''}" 
          data-index="${index}"
          aria-label="Go to screenshot ${index + 1}"
          aria-current="${index === this.currentIndex ? 'true' : 'false'}"
          type="button"
        >
          <img src="${this.escapeHtml(src)}" alt="" loading="lazy" decoding="async" />
        </button>
      `).join('');
    }

    showLightbox() {
      requestAnimationFrame(() => {
        this.lightbox.classList.add('open');
      });
    }

    hideLightbox() {
      this.lightbox.classList.remove('open');
      setTimeout(() => {
        if (this.lightbox && this.lightbox.parentNode) {
          this.lightbox.parentNode.removeChild(this.lightbox);
          this.lightbox = null;
        }
      }, 300);
    }

    updateLightboxContent() {
      if (!this.lightbox) return;
      
      const src = this.images[this.currentIndex];
      const img = this.lightbox.querySelector('.lightbox-image');
      const caption = this.lightbox.querySelector('.lightbox-caption');
      const counter = this.lightbox.querySelector('.lightbox-counter');
      
      // Preload next/prev images
      this.preloadAdjacent();
      
      // Update image with fade
      img.style.opacity = '0';
      img.onload = () => {
        img.style.opacity = '1';
      };
      img.src = src;
      img.alt = `Screenshot ${this.currentIndex + 1} of ${this.images.length}`;
      
      caption.textContent = `Screenshot ${this.currentIndex + 1}`;
      counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
      
      // Update thumbnails
      this.lightbox.querySelectorAll('.lightbox-thumb').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === this.currentIndex);
        thumb.setAttribute('aria-current', i === this.currentIndex ? 'true' : 'false');
      });
      
      // Update nav buttons
      this.lightbox.querySelector('.lightbox-prev').disabled = this.currentIndex === 0;
      this.lightbox.querySelector('.lightbox-next').disabled = this.currentIndex === this.images.length - 1;
      
      // Reset zoom
      this.zoomLevel = 1;
      img.style.transform = 'scale(1)';
      img.style.cursor = 'zoom-in';
    }

    preloadAdjacent() {
      const nextIndex = this.currentIndex + 1;
      const prevIndex = this.currentIndex - 1;
      
      if (nextIndex < this.images.length) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = this.images[nextIndex];
        document.head.appendChild(link);
      }
      
      if (prevIndex >= 0) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = this.images[prevIndex];
        document.head.appendChild(link);
      }
    }

    next() {
      if (this.currentIndex < this.images.length - 1) {
        this.currentIndex++;
        this.updateLightboxContent();
        this.trackEvent('gallery_navigate', { direction: 'next', index: this.currentIndex });
      }
    }

    prev() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.updateLightboxContent();
        this.trackEvent('gallery_navigate', { direction: 'prev', index: this.currentIndex });
      }
    }

    toggleZoom(e) {
      if (this.zoomLevel === 1) {
        this.zoomLevel = 2;
        e.target.style.transform = 'scale(2)';
        e.target.style.cursor = 'zoom-out';
        e.target.style.transformOrigin = `${e.offsetX}px ${e.offsetY}px`;
      } else {
        this.zoomLevel = 1;
        e.target.style.transform = 'scale(1)';
        e.target.style.cursor = 'zoom-in';
        e.target.style.transformOrigin = 'center center';
      }
    }

    handleWheel(e) {
      if (!this.isOpen) return;
      
      e.preventDefault();
      
      if (e.ctrlKey || e.metaKey) {
        // Zoom with ctrl+wheel
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));
        const img = this.lightbox.querySelector('.lightbox-image');
        img.style.transform = `scale(${this.zoomLevel})`;
        img.style.cursor = this.zoomLevel > 1 ? 'zoom-out' : 'zoom-in';
      } else {
        // Navigate with wheel
        if (e.deltaY > 0) this.next();
        else this.prev();
      }
    }

    handleKeydown(e) {
      if (!this.isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.prev();
          break;
        case 'ArrowRight':
          this.next();
          break;
        case 'Tab':
          this.handleTabKey(e);
          break;
      }
    }

    handleTabKey(e) {
      const focusableElements = this.lightbox.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }

    handleTouchStart(e) {
      if (!this.isOpen) return;
      this.touchStartX = e.changedTouches[0].screenX;
    }

    handleTouchEnd(e) {
      if (!this.isOpen) return;
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }

    handleSwipe() {
      const swipeThreshold = 50;
      const diff = this.touchStartX - this.touchEndX;
      
      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) this.next();
        else this.prev();
      }
    }

    handleResize() {
      if (!this.isOpen) return;
      // Thumbnails might need reflow on resize
    }

    trapFocus() {
      const focusableElements = this.lightbox.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length) {
        focusableElements[0].focus();
      }
    }

    removeFocusTrap() {
      // Focus returns to the gallery item that opened the lightbox
      const galleryItems = this.container.querySelectorAll('.app-gallery-item');
      if (galleryItems[this.currentIndex]) {
        galleryItems[this.currentIndex].focus();
      }
    }

    trackEvent(eventName, data) {
      if (window.gtag) {
        window.gtag('event', eventName, data);
      }
      // Custom event for internal tracking
      window.dispatchEvent(new CustomEvent('kd:gallery', { 
        detail: { event: eventName, ...data } 
      }));
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Public API
    setImages(images) {
      this.images = images || [];
      this.renderGallery();
    }

    destroy() {
      this.close();
      if (this.container) {
        this.container.innerHTML = '';
      }
    }
  }

  // Export for module usage
  window.AppGallery = AppGallery;

  // Auto-initialize from data attributes
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-gallery-images]').forEach(container => {
      try {
        const images = JSON.parse(container.dataset.galleryImages);
        new AppGallery({ container, images });
      } catch (e) {
        console.warn('Failed to parse gallery images:', e);
      }
    });
  });
})();