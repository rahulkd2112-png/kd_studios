/* Wait for DB-backed app pages before starting the 3D museum. */
(function () {
  "use strict";

  function loadMuseum() {
    if (document.querySelector('script[data-museum-3d="true"]')) return;
    const script = document.createElement("script");
    script.src = "/museum-3d.js";
    script.dataset.museum3d = "true";
    document.body.appendChild(script);
  }

  (window.KD_APP_PAGES_READY || Promise.resolve())
    .catch(() => null)
    .finally(loadMuseum);
})();
