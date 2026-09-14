/* KD Studios App SEO & Meta Tag Management */
(function () {
  "use strict";

  class AppSEO {
    constructor() {
      this.defaultConfig = {
        siteName: 'KD Studios',
        siteUrl: 'https://kdstudios.app',
        twitterHandle: '@kdstudios',
        defaultImage: '/logo/kd_logo.png',
        defaultDescription: 'Explore KD Studios apps - AI photo editing, document scanning, and arcade games for Android.'
      };
      
      this.init();
    }

    init() {
      // Listen for app data loaded event
      window.addEventListener('kd:app-loaded', (e) => {
        if (e.detail && e.detail.app) {
          this.updateForApp(e.detail.app);
        }
      });
    }

    updateForApp(app) {
      if (!app) return;

      const config = {
        title: `${app.title} | KD Studios`,
        description: app.shortDescription || app.tagline || this.defaultConfig.defaultDescription,
        url: `${this.defaultConfig.siteUrl}/apps/${app.slug}`,
        image: app.heroImageUrl || app.iconUrl || this.defaultConfig.defaultImage,
        type: 'website',
        appName: app.title,
        category: app.category,
        tags: app.tags || [],
        accentColor: app.accentColor || '#b8864e'
      };

      this.updateMetaTags(config);
      this.updateStructuredData(config, app);
      this.updateOpenGraph(config);
      this.updateTwitterCard(config);
      this.updateThemeColor(config.accentColor);
    }

    updateMetaTags(config) {
      // Basic meta tags
      this.setMeta('title', config.title);
      this.setMeta('description', config.description);
      this.setMeta('keywords', [...config.tags, config.category, 'KD Studios', 'Android apps'].join(', '));
      this.setMeta('author', 'KD Studios');
      this.setMeta('robots', 'index, follow');
      this.setMeta('viewport', 'width=device-width, initial-scale=1.0');
      this.setMeta('theme-color', config.accentColor);
      this.setMeta('color-scheme', 'light');
      
      // Canonical URL
      this.setLink('canonical', config.url);
      
      // Alternate languages (if needed)
      // this.setLink('alternate', config.url, { hreflang: 'en' });
    }

    updateOpenGraph(config) {
      const ogTags = {
        'og:title': config.title,
        'og:description': config.description,
        'og:url': config.url,
        'og:type': config.type,
        'og:image': config.image,
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:alt': `${config.appName} - ${config.category}`,
        'og:site_name': this.defaultConfig.siteName,
        'og:locale': 'en_US'
      };

      Object.entries(ogTags).forEach(([property, content]) => {
        this.setMeta(property, content, 'property');
      });
    }

    updateTwitterCard(config) {
      const twitterTags = {
        'twitter:card': 'summary_large_image',
        'twitter:site': this.defaultConfig.twitterHandle,
        'twitter:creator': this.defaultConfig.twitterHandle,
        'twitter:title': config.title,
        'twitter:description': config.description,
        'twitter:image': config.image,
        'twitter:image:alt': `${config.appName} - ${config.category}`
      };

      Object.entries(twitterTags).forEach(([name, content]) => {
        this.setMeta(name, content, 'name');
      });
    }

    updateStructuredData(config, app) {
      // Remove existing structured data
      const existing = document.querySelector('script[type="application/ld+json"][data-app-seo]');
      if (existing) existing.remove();

      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': app.title,
        'applicationCategory': this.mapCategoryToSchema(app.category),
        'operatingSystem': 'Android',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock',
          'url': app.playStoreUrl || config.url
        },
        'description': app.description,
        'shortDescription': app.shortDescription,
        'image': [app.iconUrl, app.heroImageUrl].filter(Boolean),
        'url': config.url,
        'publisher': {
          '@type': 'Organization',
          'name': 'KD Studios',
          'url': this.defaultConfig.siteUrl,
          'logo': {
            '@type': 'ImageObject',
            'url': `${this.defaultConfig.siteUrl}/logo/kd_logo.png`
          }
        },
        'datePublished': app.createdAt || new Date().toISOString(),
        'dateModified': app.updatedAt || new Date().toISOString(),
        'featureList': app.features || [],
        'screenshot': app.gallery || [],
        'softwareVersion': app.version || '1.0',
        'fileSize': app.fileSize || 'Varies with device',
        'permissions': app.permissions || [],
        'aggregateRating': app.rating ? {
          '@type': 'AggregateRating',
          'ratingValue': app.rating.value,
          'reviewCount': app.rating.count,
          'bestRating': '5',
          'worstRating': '1'
        } : undefined
      };

      // Remove undefined values
      const cleanData = JSON.parse(JSON.stringify(structuredData, (key, value) => 
        value === undefined ? null : value
      ));

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-app-seo', 'true');
      script.textContent = JSON.stringify(cleanData, null, 2);
      document.head.appendChild(script);
    }

    updateThemeColor(color) {
      // Update theme-color meta tag
      this.setMeta('theme-color', color);
      
      // Update CSS custom property for dynamic theming
      document.documentElement.style.setProperty('--app-accent', color);
      
      // Update manifest theme color if PWA
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        // Could fetch and update manifest, but theme-color meta is sufficient
      }
    }

    mapCategoryToSchema(category) {
      const categoryMap = {
        'AI Food Scanner App': 'SoftwareApplication',
        'AI Interview App': 'SoftwareApplication',
        'AI Image Resizer App': 'SoftwareApplication',
        'PDF Scanner & Editor App': 'SoftwareApplication',
        'Document Scanner App': 'BusinessApplication',
        'Arcade Game': 'Game',
        'Productivity': 'BusinessApplication',
        'Utilities': 'UtilityApplication'
      };
      return categoryMap[category] || 'Application';
    }

    setMeta(name, content, attribute = 'name') {
      if (!content) return;
      
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    }

    setLink(rel, href, attributes = {}) {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
      Object.entries(attributes).forEach(([key, value]) => {
        link.setAttribute(key, value);
      });
    }

    // Static method for quick updates
    static updatePageTitle(title) {
      document.title = title;
    }

    static updateDescription(description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', description);
    }

    // Generate social share URLs
    static getShareUrls(config) {
      const encodedUrl = encodeURIComponent(config.url);
      const encodedTitle = encodeURIComponent(config.title);
      const encodedDesc = encodeURIComponent(config.description);
      
      return {
        twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=${config.twitterHandle || 'kdstudios'}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
        email: `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`
      };
    }

    // Preload critical resources
    static preloadResources(app) {
      const resources = [
        app.iconUrl,
        app.heroImageUrl,
        ...(app.gallery || [])
      ].filter(Boolean);

      resources.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
      });
    }
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    window.AppSEO = new AppSEO();
  });

  // Export for module usage
  window.AppSEO = AppSEO;
})();