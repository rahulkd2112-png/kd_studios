/* ============================================================
   KD STUDIOS — App Data & Configuration
   ============================================================ */

const projectsData = [
  {
    title: "FaceFix AI",
    type: "Photo Editing App",
    year: "Live",
    image: "/logo/facefixai.png",
    description:
      "An advanced AI-powered photo enhancement app designed to restore facial details, improve blurry portraits, and make old photos clearer, sharper, and more visually appealing.",
    tags: ["AI Face Enhancement", "Photo Upscaling", "Skin Smoothing"],
    url: "https://play.google.com/store/apps/details?id=com.kdstudios.facefixai"
  },
  {
    title: "ScanPro",
    type: "Scanner App",
    year: "Live",
    image: "/logo/ScanPro.png",
    description:
      "A smart document scanning app built for fast captures, cleaner pages, and easy digital sharing for daily work and personal use.",
    tags: ["Document Scanner", "PDF Export", "Productivity"],
    url: "https://play.google.com/store/apps/details?id=com.kdstudios.scanpro"
  },
  {
    title: "Custom Business Website",
    type: "Website",
    year: "Featured",
    description:
      "High-trust business websites designed for premium branding, fast performance, and confident lead generation.",
    tags: ["Business Website", "Lead Generation", "Premium UI"],
    url: "/request.html"
  },
  {
    title: "Stack Tower",
    type: "Game App",
    year: "Live",
    image: "/logo/Stack%20Tower.png",
    description:
      "A fun and addictive arcade game where players stack moving blocks to build the tallest tower possible with precise timing and increasing difficulty.",
    tags: ["One-Tap Gameplay", "Arcade", "In Testing"],
    url: "https://play.google.com/store/apps/details?id=com.kdstudios.stacktower"
  },
  {
    title: "Admin & Client Dashboard Systems",
    type: "Web App",
    year: "Featured",
    description:
      "Professional dashboard systems built for user management, request handling, secure access, notifications, and real workflows.",
    tags: ["Dashboard", "Admin Panel", "Client Workflow"],
    url: "/dashboard.html"
  }
];

/* ---- MUSEUM APP DATA ---- */
const museumApps = [
  {
    id: "facefix",
    title: "FaceFix AI",
    icon: "./logo/facefixai.png",
    description:
      "AI-powered photo enhancement for clearer portraits, restored facial details, and cleaner old photos.",
    tags: ["AI Enhancement", "Photo Editing", "Android"],
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.kdstudios.facefixai",
    category: "Photo Editing App"
  },
  {
    id: "scanpro",
    title: "ScanPro",
    icon: "./logo/ScanPro.png",
    description:
      "Document scanning for quick captures, cleaner pages, PDF export, and everyday productivity.",
    tags: ["Scanner", "PDF Tools", "Productivity"],
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.kdstudios.scanpro",
    category: "Scanner App"
  },
  {
    id: "stacktower",
    title: "Stack Tower",
    icon: "./logo/Stack%20Tower.png",
    description:
      "Arcade stacking gameplay with simple controls, precise timing, and replay-focused progression.",
    tags: ["Game App", "Arcade", "Android"],
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.kdstudios.stacktower",
    category: "Game App"
  }
];

/* ---- CONFIG ---- */
const config = window.KD_STUDIOS_CONFIG || {};
const apiBaseUrlValue = (config.apiBaseUrl || "http://localhost:4000").replace(/\/$/, "");
const socketUrlValue = apiBaseUrlValue.replace(/^http/, "ws") + "/ws";
const storageKeyValue = "kd_studios_auth";

/* ---- EXPORTS ---- */
window.KD_APP_DATA = {
  projects: projectsData,
  museumApps,
  config,
  apiBaseUrl: apiBaseUrlValue,
  socketUrl: socketUrlValue,
  storageKey: storageKeyValue
};
