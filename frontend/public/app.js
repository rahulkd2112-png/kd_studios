/* ============================================================
   KD STUDIOS — Main Entry Point
   Loads all modules in correct order:
   1. app-data.js    → Data & Config (projects, museumApps, API config)
   2. app-museum.js  → Museum UI (pedestals, overlays, dot menu)
   3. app-core.js    → Core Logic (auth, dashboard, API, socket)
   ============================================================ */

// Module loading order is handled by script tags in HTML
// This file serves as the main entry point and exports the unified API

// Re-export all modules for global access
window.KD_STUDIOS = {
  // Data & Config
  ...window.KD_APP_DATA,
  
  // Museum UI
  ...window.KD_MUSEUM_UI,
  
  // Core App Logic
  ...window.KD_APP_CORE,
  
  // Version info
  version: "2.0.0",
  modules: ["app-data", "app-museum", "app-core"]
};

console.log("[KD Studios] App modules loaded:", window.KD_STUDIOS.modules.join(", "));