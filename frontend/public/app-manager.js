/* KD Studios admin app landing page manager */
(function () {
  "use strict";

  const appData = window.KD_APP_DATA || {};
  const apiBaseUrl = (appData.apiBaseUrl || "http://localhost:4000").replace(/\/$/, "");
  const storageKey = appData.storageKey || "kd_studios_auth";

  const state = {
    auth: null,
    apps: [],
    selectedId: null
  };

  const els = {
    list: document.getElementById("adminAppList"),
    form: document.getElementById("appEditorForm"),
    message: document.getElementById("appEditorMessage"),
    newButton: document.getElementById("newAppButton"),
    deleteButton: document.getElementById("deleteAppButton"),
    publicUrl: document.getElementById("publicAppUrl"),
    copyButton: document.getElementById("copyPublicUrlButton"),
    logoutButton: document.getElementById("logoutHeaderButton")
  };

  function loadAuth() {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setMessage(text, type) {
    if (!els.message) return;
    els.message.className = `form-message ${type || ""}`;
    els.message.textContent = text || "";
  }

  async function apiFetch(path, options = {}) {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.auth.token}`,
        ...(options.headers || {})
      }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Request failed.");
    return result;
  }

  function splitLines(value) {
    return Array.isArray(value) ? value.join("\n") : value || "";
  }

  function collectLines(value) {
    return String(value || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function publicUrlFor(app) {
    const slug = app?.slug || els.form?.slug.value || "";
    return slug ? `${window.location.origin}/apps/${slug}` : "";
  }

  function updatePublicUrl(app) {
    const url = publicUrlFor(app);
    if (els.publicUrl) {
      els.publicUrl.href = url || "#";
      els.publicUrl.textContent = url || "Save the page to generate a public URL";
    }
  }

  function resetForm() {
    state.selectedId = null;
    els.form.reset();
    els.form.status.value = "PUBLISHED";
    els.form.featured.checked = true;
    els.form.accentColor.value = "#b8864e";
    els.form.sortOrder.value = "0";
    setMessage("", "");
    updatePublicUrl(null);
    renderList();
  }

  function fillForm(app) {
    state.selectedId = app.id;
    els.form.title.value = app.title || "";
    els.form.slug.value = app.slug || "";
    els.form.category.value = app.category || "";
    els.form.tagline.value = app.tagline || "";
    els.form.shortDescription.value = app.shortDescription || "";
    els.form.description.value = app.description || "";
    els.form.iconUrl.value = app.iconUrl || "";
    els.form.heroImageUrl.value = app.heroImageUrl || "";
    els.form.gallery.value = splitLines(app.gallery);
    els.form.tags.value = splitLines(app.tags);
    els.form.features.value = splitLines(app.features);
    els.form.highlights.value = splitLines(app.highlights);
    els.form.playStoreUrl.value = app.playStoreUrl || "";
    els.form.websiteUrl.value = app.websiteUrl || "";
    els.form.accentColor.value = app.accentColor || "#b8864e";
    els.form.status.value = app.status || "PUBLISHED";
    els.form.featured.checked = !!app.featured;
    els.form.sortOrder.value = String(app.sortOrder || 0);
    setMessage("", "");
    updatePublicUrl(app);
    renderList();
  }

  function renderList() {
    if (!els.list) return;
    if (!state.apps.length) {
      els.list.innerHTML = '<p class="empty-state">No app pages yet.</p>';
      return;
    }

    els.list.innerHTML = "";
    state.apps.forEach((app) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `admin-app-list-item ${app.id === state.selectedId ? "active" : ""}`;
      const img = document.createElement("img");
      img.src = app.iconUrl;
      img.alt = "";
      const text = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = app.title;
      const meta = document.createElement("small");
      meta.textContent = `${app.status} - /apps/${app.slug}`;
      text.append(title, meta);
      button.append(img, text);
      button.addEventListener("click", () => fillForm(app));
      els.list.appendChild(button);
    });
  }

  async function loadApps() {
    const result = await apiFetch("/api/admin/apps");
    state.apps = result.apps || [];
    renderList();
    if (state.selectedId) {
      const selected = state.apps.find((app) => app.id === state.selectedId);
      if (selected) fillForm(selected);
    }
  }

  function getPayload() {
    return {
      title: els.form.title.value.trim(),
      slug: els.form.slug.value.trim() || slugify(els.form.title.value),
      category: els.form.category.value.trim(),
      tagline: els.form.tagline.value.trim(),
      shortDescription: els.form.shortDescription.value.trim(),
      description: els.form.description.value.trim(),
      iconUrl: els.form.iconUrl.value.trim(),
      heroImageUrl: els.form.heroImageUrl.value.trim(),
      gallery: collectLines(els.form.gallery.value),
      tags: collectLines(els.form.tags.value),
      features: collectLines(els.form.features.value),
      highlights: collectLines(els.form.highlights.value),
      playStoreUrl: els.form.playStoreUrl.value.trim(),
      websiteUrl: els.form.websiteUrl.value.trim(),
      accentColor: els.form.accentColor.value.trim(),
      status: els.form.status.value,
      featured: els.form.featured.checked,
      sortOrder: Number(els.form.sortOrder.value || 0)
    };
  }

  async function handleSave(event) {
    event.preventDefault();
    setMessage("Saving app landing page...", "info");
    const payload = getPayload();
    const path = state.selectedId ? `/api/admin/apps/${state.selectedId}` : "/api/admin/apps";
    const method = state.selectedId ? "PATCH" : "POST";

    try {
      const result = await apiFetch(path, {
        method,
        body: JSON.stringify(payload)
      });
      state.selectedId = result.app.id;
      await loadApps();
      fillForm(result.app);
      setMessage("Saved. Public page is ready at its URL.", "success");
    } catch (error) {
      setMessage(error.message, "error");
    }
  }

  async function handleDelete() {
    if (!state.selectedId) {
      setMessage("Select an app page before deleting.", "error");
      return;
    }
    const selected = state.apps.find((app) => app.id === state.selectedId);
    if (!confirm(`Delete ${selected?.title || "this app page"}? This removes its public landing page.`)) return;

    try {
      await apiFetch(`/api/admin/apps/${state.selectedId}`, { method: "DELETE" });
      state.selectedId = null;
      await loadApps();
      resetForm();
      setMessage("App landing page deleted.", "success");
    } catch (error) {
      setMessage(error.message, "error");
    }
  }

  function copyPublicUrl() {
    const url = publicUrlFor(state.apps.find((app) => app.id === state.selectedId));
    if (!url) return;
    navigator.clipboard?.writeText(url);
    setMessage("Public URL copied.", "success");
  }

  async function init() {
    state.auth = loadAuth();
    if (!state.auth?.token || state.auth?.user?.role !== "ADMIN") {
      window.location.href = "/admin-login.html";
      return;
    }

    els.form?.addEventListener("submit", handleSave);
    els.newButton?.addEventListener("click", resetForm);
    els.deleteButton?.addEventListener("click", handleDelete);
    els.copyButton?.addEventListener("click", copyPublicUrl);
    els.form?.title.addEventListener("input", () => {
      if (!state.selectedId && !els.form.slug.value) {
        els.form.slug.value = slugify(els.form.title.value);
        updatePublicUrl(null);
      }
    });
    els.form?.slug.addEventListener("input", () => updatePublicUrl(null));
    els.logoutButton?.addEventListener("click", () => {
      sessionStorage.removeItem(storageKey);
      window.location.href = "/admin-login.html";
    });

    resetForm();
    try {
      await loadApps();
    } catch (error) {
      setMessage(error.message, "error");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
