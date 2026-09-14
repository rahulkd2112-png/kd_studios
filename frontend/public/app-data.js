/* ============================================================
   KD STUDIOS — App Data & Configuration
   ============================================================ */

const projectsData = [
  {
    title: "FoodScan AI",
    type: "AI Food Scanner App",
    year: "Live",
    image: "/logo/foodscanai.png",
    description:
      "FoodScan AI helps users scan food items and understand labels, ingredients, and meal quality through a simple AI food inspection workflow.",
    tags: ["Food Recognition", "AI Nutrition", "Smart Scan"],
    url: "https://play.google.com/store/apps/details?id=com.kdstudios.foodscanai"
  },
  {
    title: "Interviewerly AI",
    type: "AI Interview App",
    year: "Live",
    image: "/logo/interviewerlyai.png",
    description:
      "Interviewerly AI prepares candidates with guided interview practice, answer prompts, and actionable feedback for stronger communication performance.",
    tags: ["Interview Practice", "Career Coaching", "AI Assistant"],
    url: "https://play.google.com/store/apps/details?id=com.kdstudios.interviewerlyai"
  },
  {
    title: "ImageLy Resizer",
    type: "AI Image Resizer App",
    year: "Live",
    image: "/logo/imagelyresizer.png",
    description:
      "ImageLy Resizer helps users create cleaner image exports by resizing, adjusting dimensions, and preparing visuals for social and workspace delivery.",
    tags: ["Image Tools", "Resize", "Creative Workflow"],
    url: "https://play.google.com/store/apps/details?id=com.kdstudios.imagelyresizer"
  },
  {
    title: "Docly PDF Reader Editor Scanner",
    type: "PDF Scanner & Editor App",
    year: "Live",
    image: "/logo/doclypdfreadereditorscanner.png",
    description:
      "Docly PDF Reader Editor Scanner gives users a focused mobile workflow for reading, editing, scanning, and organizing PDF documents.",
    tags: ["PDF Scanner", "PDF Reader", "Document Editor"],
    url: "https://play.google.com/store/apps/details?id=com.kdstudios.doclypdfreadereditorscanner"
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
    title: "Stack Tower",
    type: "Game App",
    year: "Live",
    image: "/logo/Stack%20Tower.png",
    description:
      "A fun and addictive arcade game where players stack moving blocks to build the tallest tower possible with precise timing and increasing difficulty.",
    tags: ["One-Tap Gameplay", "Arcade", "In Testing"],
    url: "https://play.google.com/store/apps/details?id=com.kdstudios.stacktower"
  }
];

/* ---- MUSEUM APP DATA ---- */
const museumApps = [
  {
    id: "foodscanai",
    title: "FoodScan AI",
    icon: "./logo/foodscanai.png",
    description:
      "FoodScan AI scans meal and label details with an AI-first food awareness workflow for quick nutrition assistance.",
    tags: ["Food Recognition", "Nutrition", "AI Assistant"],
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.kdstudios.foodscanai",
    category: "AI Food Scanner App"
  },
  {
    id: "interviewerlyai",
    title: "Interviewerly AI",
    icon: "./logo/interviewerlyai.png",
    description:
      "Interviewerly AI helps learners rehearse interview answers, refine their delivery, and improve confidence before the real conversation.",
    tags: ["Interview Practice", "Career", "AI Coaching"],
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.kdstudios.interviewerlyai",
    category: "AI Interview App"
  },
  {
    id: "imagelyresizer",
    title: "ImageLy Resizer",
    icon: "./logo/imagelyresizer.png",
    description:
      "ImageLy Resizer is a creative image optimization app for resizing visuals, improving export workflows, and preparing content for publishing.",
    tags: ["Image Tools", "Resize", "Creator Workflow"],
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.kdstudios.imagelyresizer",
    category: "AI Image Resizer App"
  },
  {
    id: "doclypdfreadereditorscanner",
    title: "Docly PDF Reader Editor Scanner",
    icon: "./logo/doclypdfreadereditorscanner.png",
    description:
      "Docly PDF Reader Editor Scanner helps manage scanned documents with reader, editor, and PDF organization tools built for speed.",
    tags: ["PDF", "Scanner", "Document Editing"],
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.kdstudios.doclypdfreadereditorscanner",
    category: "PDF Scanner & Editor App"
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
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const apiBaseUrlValue = (config.apiBaseUrl || (isLocalhost ? "http://localhost:4000" : "")).replace(/\/$/, "");
const socketUrlValue = apiBaseUrlValue ? apiBaseUrlValue.replace(/^http/, "ws") + "/ws" : "";
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
