/* KD Studios App Manager - Admin CRUD for App Landing Pages */
(function () {
  "use strict";

  const config = window.KD_STUDIOS_CONFIG || {};
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const apiBaseUrl = (config.apiBaseUrl || (isLocalhost ? "http://localhost:4000" : "")).replace(/\/$/, "");
  const storageKey = "kd_studios_auth";

  function authFetch(path, options = {}) {
    const raw = sessionStorage.getItem(storageKey);
    const auth = raw ? JSON.parse(raw) : null;
    return fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        ...(options.headers || {})
      }
    });
  }

  class AppManager {
    constructor() {
      this.apps = [];
      this.filteredApps = [];
      this.currentPage = 1;
      this.pageSize = 10;
      this.searchQuery = "";
      this.statusFilter = "";
      this.editingAppId = null;
      this.deletingAppId = null;

      this.init();
    }

    init() {
      this.bindElements();
      this.bindEvents();
      this.checkAuth();
      this.loadApps();
    }

    bindElements() {
      // Main elements
      this.addAppBtn = document.getElementById("addAppBtn");
      this.searchInput = document.getElementById("searchInput");
      this.statusFilter = document.getElementById("statusFilter");
      this.tableBody = document.getElementById("appsTableBody");
      this.pagination = document.getElementById("pagination");
      this.statTotal = document.getElementById("statTotal");
      this.statPublished = document.getElementById("statPublished");
      this.statDraft = document.getElementById("statDraft");
      this.statFeatured = document.getElementById("statFeatured");

      // Modal elements
      this.appModal = document.getElementById("appModal");
      this.appForm = document.getElementById("appForm");
      this.modalTitle = document.getElementById("modalTitle");
      this.modalClose = document.getElementById("modalClose");
      this.modalCancel = document.getElementById("modalCancel");
      this.modalSubmit = document.getElementById("modalSubmit");
      this.submitText = document.getElementById("submitText");
      this.submitSpinner = document.getElementById("submitSpinner");

      // Delete modal
      this.deleteModal = document.getElementById("deleteModal");
      this.deleteAppName = document.getElementById("deleteAppName");
      this.deleteModalClose = document.getElementById("deleteModalClose");
      this.deleteCancel = document.getElementById("deleteCancel");
      this.deleteConfirm = document.getElementById("deleteConfirm");
      this.deleteSubmitText = document.getElementById("deleteSubmitText");
      this.deleteSpinner = document.getElementById("deleteSpinner");

      // Toast
      this.toastContainer = document.getElementById("toastContainer");

      // Form fields
      this.formFields = {
        id: document.getElementById("appId"),
        title: document.getElementById("appTitle"),
        slug: document.getElementById("appSlug"),
        category: document.getElementById("appCategory"),
        tagline: document.getElementById("appTagline"),
        shortDescription: document.getElementById("appShortDesc"),
        description: document.getElementById("appDescription"),
        iconUrl: document.getElementById("appIconUrl"),
        heroImageUrl: document.getElementById("appHeroImageUrl"),
        playStoreUrl: document.getElementById("appPlayStoreUrl"),
        websiteUrl: document.getElementById("appWebsiteUrl"),
        accentColor: document.getElementById("appAccentColor"),
        sortOrder: document.getElementById("appSortOrder"),
        featured: document.getElementById("appFeatured"),
        status: document.getElementById("appStatus"),
        tags: document.getElementById("appTags"),
        features: document.getElementById("appFeatures"),
        highlights: document.getElementById("appHighlights"),
        gallery: document.getElementById("appGallery"),
      };
    }

    bindEvents() {
      // Add app button
      this.addAppBtn?.addEventListener("click", () => this.openAddModal());

      // Search and filter
      this.searchInput?.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.currentPage = 1;
        this.filterAndRender();
      });

      this.statusFilter?.addEventListener("change", (e) => {
        this.statusFilter = e.target.value;
        this.currentPage = 1;
        this.filterAndRender();
      });

      // Modal events
      this.modalClose?.addEventListener("click", () => this.closeModal());
      this.modalCancel?.addEventListener("click", () => this.closeModal());
      this.appModal?.addEventListener("click", (e) => {
        if (e.target === this.appModal) this.closeModal();
      });

      // Form submit
      this.appForm?.addEventListener("submit", (e) => this.handleFormSubmit(e));

      // Delete modal events
      this.deleteModalClose?.addEventListener("click", () => this.closeDeleteModal());
      this.deleteCancel?.addEventListener("click", () => this.closeDeleteModal());
      this.deleteModal?.addEventListener("click", (e) => {
        if (e.target === this.deleteModal) this.closeDeleteModal();
      });
      this.deleteConfirm?.addEventListener("click", () => this.handleDeleteConfirm());

      // Keyboard shortcuts
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.closeModal();
          this.closeDeleteModal();
        }
      });

      // Auto-generate slug from title
      this.formFields.title?.addEventListener("blur", () => {
        if (!this.formFields.slug.value && this.formFields.title.value) {
          this.formFields.slug.value = this.generateSlug(this.formFields.title.value);
        }
      });
    }

    async checkAuth() {
      try {
        const res = await authFetch("/api/auth/me");
        if (!res.ok) {
          window.location.href = "/admin-login.html";
          return;
        }
        const data = await res.json();
        if (!data.user || data.user.role !== "ADMIN") {
          window.location.href = "/dashboard.html";
          return;
        }
        this.updateUserBadge(data.user);
      } catch {
        window.location.href = "/admin-login.html";
      }
    }

    updateUserBadge(user) {
      const badge = document.getElementById("userBadge");
      if (badge) {
        badge.textContent = user.name || user.email;
      }

      const logoutBtn = document.getElementById("logoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
          await authFetch("/api/auth/logout", { method: "POST" });
          sessionStorage.removeItem(storageKey);
          window.location.href = "/index.html";
        });
      }
    }

    async loadApps() {
      this.showTableLoading(true);
      try {
        const res = await authFetch("/api/admin/apps");
        if (!res.ok) throw new Error("Failed to load apps");
        const data = await res.json();
        this.apps = data.apps || [];
        this.filterAndRender();
        this.updateStats();
      } catch (error) {
        this.showToast("Failed to load apps: " + error.message, "error");
        this.tableBody.innerHTML = '<tr class="error-row"><td colspan="7">Failed to load apps</td></tr>';
      } finally {
        this.showTableLoading(false);
      }
    }

    updateStats() {
      const total = this.apps.length;
      const published = this.apps.filter((a) => a.status === "PUBLISHED").length;
      const draft = this.apps.filter((a) => a.status === "DRAFT").length;
      const featured = this.apps.filter((a) => a.featured).length;

      this.statTotal.textContent = total;
      this.statPublished.textContent = published;
      this.statDraft.textContent = draft;
      this.statFeatured.textContent = featured;
    }

    filterAndRender() {
      this.filteredApps = this.apps.filter((app) => {
        const matchesSearch =
          !this.searchQuery ||
          app.title.toLowerCase().includes(this.searchQuery) ||
          app.slug.toLowerCase().includes(this.searchQuery) ||
          app.category.toLowerCase().includes(this.searchQuery);
        const matchesStatus = !this.statusFilter || app.status === this.statusFilter;
        return matchesSearch && matchesStatus;
      });

      this.renderTable();
      this.renderPagination();
    }

    renderTable() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      const pageApps = this.filteredApps.slice(start, end);

      if (pageApps.length === 0) {
        this.tableBody.innerHTML = '<tr class="empty-row"><td colspan="7">No apps found</td></tr>';
        return;
      }

      this.tableBody.innerHTML = pageApps
        .map((app) => `
        <tr data-id="${app.id}">
          <td>
            <div class="app-cell">
              <img src="${this.escapeHtml(app.iconUrl)}" alt="" class="app-thumb" loading="lazy" />
              <div>
                <strong>${this.escapeHtml(app.title)}</strong>
                <small>${this.escapeHtml(app.slug)}</small>
              </div>
            </div>
          </td>
          <td>${this.escapeHtml(app.category)}</td>
          <td>
            <span class="status-badge ${app.status.toLowerCase()}">${app.status}</span>
          </td>
          <td>
            <span class="featured-badge ${app.featured ? "yes" : "no"}">
              ${app.featured ? "✓ Yes" : "✗ No"}
            </span>
          </td>
          <td>${app.sortOrder}</td>
          <td>${this.formatDate(app.updatedAt)}</td>
          <td>
            <div class="action-buttons">
              <button class="action-btn edit" data-id="${app.id}" aria-label="Edit ${this.escapeHtml(app.title)}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="action-btn delete" data-id="${app.id}" aria-label="Delete ${this.escapeHtml(app.title)}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
              <a href="/apps/${app.slug}" class="action-btn view" target="_blank" aria-label="View ${this.escapeHtml(app.title)}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </a>
            </div>
          </td>
        </tr>
      `)
        .join("");

      // Bind action buttons
      this.tableBody.querySelectorAll(".action-btn.edit").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          this.openEditModal(id);
        });
      });

      this.tableBody.querySelectorAll(".action-btn.delete").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          this.openDeleteModal(id);
        });
      });
    }

    renderPagination() {
      const totalPages = Math.ceil(this.filteredApps.length / this.pageSize);
      if (totalPages <= 1) {
        this.pagination.innerHTML = "";
        return;
      }

      let html = "";
      const maxVisible = 5;
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
      let endPage = Math.min(totalPages, startPage + maxVisible - 1);

      if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }

      if (this.currentPage > 1) {
        html += `<button class="page-btn" data-page="${this.currentPage - 1}" aria-label="Previous">‹</button>`;
      }

      for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === this.currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
      }

      if (this.currentPage < totalPages) {
        html += `<button class="page-btn" data-page="${this.currentPage + 1}" aria-label="Next">›</button>`;
      }

      this.pagination.innerHTML = html;

      this.pagination.querySelectorAll(".page-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          this.currentPage = parseInt(e.currentTarget.dataset.page, 10);
          this.renderTable();
          this.renderPagination();
        });
      });
    }

    openAddModal() {
      this.editingAppId = null;
      this.modalTitle.textContent = "Add New App";
      this.submitText.textContent = "Create App";
      this.resetForm();
      this.showModal(this.appModal);
    }

    openEditModal(id) {
      const app = this.apps.find((a) => a.id === id);
      if (!app) return;

      this.editingAppId = id;
      this.modalTitle.textContent = "Edit App";
      this.submitText.textContent = "Save Changes";
      this.populateForm(app);
      this.showModal(this.appModal);
    }

    closeModal() {
      this.hideModal(this.appModal);
      this.editingAppId = null;
      this.resetForm();
    }

    resetForm() {
      this.appForm.reset();
      this.formFields.id.value = "";
      this.formFields.accentColor.value = "#b8864e";
      this.formFields.sortOrder.value = "0";
      this.formFields.featured.checked = false;
      this.formFields.status.checked = true;
    }

    populateForm(app) {
      this.formFields.id.value = app.id;
      this.formFields.title.value = app.title;
      this.formFields.slug.value = app.slug;
      this.formFields.category.value = app.category;
      this.formFields.tagline.value = app.tagline;
      this.formFields.shortDescription.value = app.shortDescription;
      this.formFields.description.value = app.description;
      this.formFields.iconUrl.value = app.iconUrl;
      this.formFields.heroImageUrl.value = app.heroImageUrl || "";
      this.formFields.playStoreUrl.value = app.playStoreUrl || "";
      this.formFields.websiteUrl.value = app.websiteUrl || "";
      this.formFields.accentColor.value = app.accentColor || "#b8864e";
      this.formFields.sortOrder.value = app.sortOrder || 0;
      this.formFields.featured.checked = app.featured;
      this.formFields.status.checked = app.status === "PUBLISHED";
      this.formFields.tags.value = Array.isArray(app.tags) ? app.tags.join(", ") : "";
      this.formFields.features.value = Array.isArray(app.features) ? app.features.join("\n") : "";
      this.formFields.highlights.value = Array.isArray(app.highlights) ? app.highlights.join("\n") : "";
      this.formFields.gallery.value = Array.isArray(app.gallery) ? app.gallery.join("\n") : "";
    }

    async handleFormSubmit(e) {
      e.preventDefault();

      const formData = new FormData(this.appForm);
      const payload = this.buildPayload(formData);

      this.setSubmitLoading(true);

      try {
        const url = this.editingAppId ? `/api/admin/apps/${this.editingAppId}` : "/api/admin/apps";
        const method = this.editingAppId ? "PATCH" : "POST";

        const res = await authFetch(url, {
          method,
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to save app");
        }

        this.showToast(this.editingAppId ? "App updated successfully" : "App created successfully", "success");
        this.closeModal();
        await this.loadApps();
      } catch (error) {
        this.showToast("Error: " + error.message, "error");
      } finally {
        this.setSubmitLoading(false);
      }
    }

    buildPayload(formData) {
      const parseList = (value) =>
        String(value || "")
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean);

      return {
        title: formData.get("title"),
        slug: formData.get("slug") || undefined,
        category: formData.get("category"),
        tagline: formData.get("tagline"),
        shortDescription: formData.get("shortDescription"),
        description: formData.get("description"),
        iconUrl: formData.get("iconUrl"),
        heroImageUrl: formData.get("heroImageUrl") || null,
        playStoreUrl: formData.get("playStoreUrl") || null,
        websiteUrl: formData.get("websiteUrl") || null,
        accentColor: formData.get("accentColor") || "#b8864e",
        sortOrder: parseInt(formData.get("sortOrder"), 10) || 0,
        featured: formData.get("featured") === "on",
        status: formData.get("status") === "on" ? "PUBLISHED" : "DRAFT",
        tags: parseList(formData.get("tags")),
        features: parseList(formData.get("features")),
        highlights: parseList(formData.get("highlights")),
        gallery: parseList(formData.get("gallery")),
      };
    }

    openDeleteModal(id) {
      const app = this.apps.find((a) => a.id === id);
      if (!app) return;

      this.deletingAppId = id;
      this.deleteAppName.textContent = app.title;
      this.showModal(this.deleteModal);
    }

    closeDeleteModal() {
      this.hideModal(this.deleteModal);
      this.deletingAppId = null;
    }

    async handleDeleteConfirm() {
      if (!this.deletingAppId) return;

      this.setDeleteLoading(true);

      try {
        const res = await authFetch(`/api/admin/apps/${this.deletingAppId}`, { method: "DELETE" });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to delete app");
        }

        this.showToast("App deleted successfully", "success");
        this.closeDeleteModal();
        await this.loadApps();
      } catch (error) {
        this.showToast("Error: " + error.message, "error");
      } finally {
        this.setDeleteLoading(false);
      }
    }

    setSubmitLoading(loading) {
      this.modalSubmit.disabled = loading;
      this.submitText.style.display = loading ? "none" : "inline";
      this.submitSpinner.style.display = loading ? "inline-block" : "none";
    }

    setDeleteLoading(loading) {
      this.deleteConfirm.disabled = loading;
      this.deleteSubmitText.style.display = loading ? "none" : "inline";
      this.deleteSpinner.style.display = loading ? "inline-block" : "none";
    }

    showModal(modal) {
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
      // Focus first input
      setTimeout(() => {
        const firstInput = modal.querySelector("input, textarea, select");
        firstInput?.focus();
      }, 100);
    }

    hideModal(modal) {
      modal.classList.remove("open");
      document.body.style.overflow = "";
    }

    showTableLoading(loading) {
      if (loading) {
        this.tableBody.innerHTML = '<tr class="loading-row"><td colspan="7">Loading apps...</td></tr>';
      }
    }

    showToast(message, type = "info") {
      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      this.toastContainer.appendChild(toast);

      requestAnimationFrame(() => toast.classList.add("show"));

      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 200);
      }, 3000);
    }

    generateSlug(text) {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
    }

    formatDate(dateString) {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Initialize on DOM ready
  document.addEventListener("DOMContentLoaded", () => {
    window.AppManager = new AppManager();
  });

  // Export for module usage
  window.AppManager = AppManager;
})();
