const { prisma } = require("../lib/prisma");
const { sanitizeText } = require("../lib/validation");

let localDevStore = {
  isActive: () => false,
  ensureApps: () => [],
  listApps: () => [],
  findAppBySlug: () => null,
  findAppById: () => null,
  createApp: () => null,
  updateApp: () => null,
  deleteApp: () => null
};

try {
  localDevStore = require("./local-dev-store");
} catch (error) {
  localDevStore = {
    isActive: () => false,
    ensureApps: () => [],
    listApps: () => [],
    findAppBySlug: () => null,
    findAppById: () => null,
    createApp: () => null,
    updateApp: () => null,
    deleteApp: () => null
  };
}

const DEFAULT_APP_PAGES = [
  {
    slug: "foodscan-ai",
    title: "FoodScan AI",
    category: "AI Food Scanner App",
    tagline: "Scan meals and ingredients with a confident AI food understanding workflow.",
    shortDescription:
      "FoodScan AI scans meals and ingredient details with a guided AI food learning workflow.",
    description:
      "FoodScan AI helps users understand what they eat by identifying food items, ingredients, labels, and meal context with a clean AI-powered scanning experience.",
    iconUrl: "/logo/foodscanai.png",
    heroImageUrl: "/logo/foodscanai.png",
    tags: ["Food Recognition", "Nutrition", "AI Assistant"],
    features: [
      "Scan food and ingredient details",
      "Understand meals with AI guidance",
      "Improve nutrition awareness",
      "Simple food insight workflow"
    ],
    highlights: ["Food scan", "Label awareness", "Smart nutrition"],
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.kdstudios.foodscanai",
    accentColor: "#8b5cf6",
    sortOrder: 10
  },
  {
    slug: "interviewerly-ai",
    title: "Interviewerly AI",
    category: "AI Interview App",
    tagline: "Practice interviews, sharpen answers, and prepare with guided coaching.",
    shortDescription:
      "Interviewerly AI gives users guided mock interview practice and answer feedback.",
    description:
      "Interviewerly AI is a career interview practice assistant that helps candidates rehearse answers, improve conversation clarity, and prepare for real interviews with confidence.",
    iconUrl: "/logo/interviewerlyai.png",
    heroImageUrl: "/logo/interviewerlyai.png",
    tags: ["Interview Practice", "Career Coaching", "AI Assistant"],
    features: [
      "Mock interview workflow",
      "Answer preparation guidance",
      "Confidence-oriented practice",
      "Career-focused feedback"
    ],
    highlights: ["Mock interviews", "AI coaching", "Career prep"],
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.kdstudios.interviewerlyai",
    accentColor: "#0891b2",
    sortOrder: 20
  },
  {
    slug: "imagely-resizer",
    title: "ImageLy Resizer",
    category: "AI Image Resizer App",
    tagline: "Resize images quickly and prepare visual assets for modern creative workflows.",
    shortDescription:
      "ImageLy Resizer helps users resize and optimize images for publishing and sharing.",
    description:
      "ImageLy Resizer is a focused image handling tool for resizing, adapting, and preparing photos or content assets for social media, websites, and creative delivery workflows.",
    iconUrl: "/logo/imagelyresizer.png",
    heroImageUrl: "/logo/imagelyresizer.png",
    tags: ["Image Tools", "Resize", "Creator Workflow"],
    features: [
      "Fast image resizing",
      "Creator-ready asset preparation",
      "Clean export workflow",
      "Simple publishing workflow"
    ],
    highlights: ["Image resizing", "Asset prep", "Creative tools"],
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.kdstudios.imagelyresizer",
    accentColor: "#16a34a",
    sortOrder: 30
  },
  {
    slug: "docly-pdf-reader-editor-scanner",
    title: "Docly PDF Reader Editor Scanner",
    category: "PDF Scanner & Editor App",
    tagline: "Read, scan, edit, and organize documents from one clean mobile workflow.",
    shortDescription:
      "Docly PDF Reader Editor Scanner manages PDF reading, scanning, editing, and organization.",
    description:
      "Docly PDF Reader Editor Scanner gives users a focused workspace for reading PDF files, scanning physical papers, editing content, and keeping documents organized for everyday productivity.",
    iconUrl: "/logo/doclypdfreadereditorscanner.png",
    heroImageUrl: "/logo/doclypdfreadereditorscanner.png",
    tags: ["PDF", "Scanner", "Document Editing"],
    features: [
      "Scan and digitize documents",
      "Read and edit PDF content",
      "Organize document flow",
      "Simple document productivity workflow"
    ],
    highlights: ["PDF scanner", "Reader", "Document editor"],
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.kdstudios.doclypdfreadereditorscanner",
    accentColor: "#f97316",
    sortOrder: 40
  },
  {
    slug: "scanpro",
    title: "ScanPro",
    category: "Document Scanner App",
    tagline: "Capture cleaner documents and export useful scans in seconds.",
    shortDescription:
      "A smart scanning app for quick document captures, cleaner pages, PDF export, and everyday productivity.",
    description:
      "ScanPro helps students, professionals, and small teams digitize documents quickly. The landing page focuses on practical scanning, clean exports, and reliable daily use.",
    iconUrl: "/logo/ScanPro.png",
    heroImageUrl: "/logo/ScanPro.png",
    tags: ["Scanner", "PDF Tools", "Productivity"],
    features: [
      "Fast document capture",
      "Cleaner page processing",
      "PDF-ready workflow",
      "Built for daily study and office use"
    ],
    highlights: ["Document scanning", "PDF export", "Productivity"],
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.kdstudios.scanpro",
    accentColor: "#0f766e",
    sortOrder: 50
  },
  {
    slug: "stack-tower",
    title: "Stack Tower",
    category: "Arcade Game",
    tagline: "A precise one-tap stacking game built for quick replay sessions.",
    shortDescription:
      "Arcade stacking gameplay with simple controls, precise timing, and replay-focused progression.",
    description:
      "Stack Tower is a lightweight arcade experience where players stack moving blocks and chase a higher tower with every run. The page presents gameplay clearly for users who just want to understand and install the game.",
    iconUrl: "/logo/Stack%20Tower.png",
    heroImageUrl: "/logo/Stack%20Tower.png",
    tags: ["Game App", "Arcade", "Android"],
    features: [
      "One-tap stacking gameplay",
      "Increasing timing challenge",
      "Quick sessions for replayability",
      "Clean mobile game presentation"
    ],
    highlights: ["One-tap play", "Arcade challenge", "Replay loop"],
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.kdstudios.stacktower",
    accentColor: "#dc2626",
    sortOrder: 60
  }
];

function parseList(value, maxItems = 8, maxLength = 180) {
  const items = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/\r?\n|,/)
        .map((item) => item.trim());

  return items
    .map((item) => sanitizeText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function parseJsonList(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function makeSlug(value) {
  return sanitizeText(value, 100)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function ensureUniqueSlug(slug, existingId) {
  const base = makeSlug(slug) || "app";
  let candidate = base;
  let index = 2;

  while (true) {
    const existing = localDevStore.isActive()
      ? localDevStore.ensureApps().find((app) => app.slug === candidate)
      : await prisma.appLandingPage.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === existingId) {
      return candidate;
    }
    candidate = `${base}-${index}`;
    index += 1;
  }
}

function serializeAppPage(record) {
  return {
    id: record.id,
    slug: record.slug,
    url: `/apps/${record.slug}`,
    title: record.title,
    category: record.category,
    tagline: record.tagline,
    shortDescription: record.shortDescription,
    description: record.description,
    iconUrl: record.iconUrl,
    heroImageUrl: record.heroImageUrl,
    gallery: parseJsonList(record.galleryJson),
    tags: parseJsonList(record.tagsJson),
    features: parseJsonList(record.featuresJson),
    highlights: parseJsonList(record.highlightsJson),
    playStoreUrl: record.playStoreUrl,
    websiteUrl: record.websiteUrl,
    accentColor: record.accentColor || "#b8864e",
    status: record.status,
    featured: record.featured,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

async function buildData(payload, existingId) {
  const title = sanitizeText(payload.title, 120);
  const slug = await ensureUniqueSlug(payload.slug || title, existingId);
  const category = sanitizeText(payload.category, 100);
  const tagline = sanitizeText(payload.tagline, 180);
  const shortDescription = sanitizeText(payload.shortDescription, 260);
  const description = sanitizeText(payload.description, 1800);
  const iconUrl = sanitizeText(payload.iconUrl, 600);
  const heroImageUrl = sanitizeText(payload.heroImageUrl, 600);
  const playStoreUrl = sanitizeText(payload.playStoreUrl, 800);
  const websiteUrl = sanitizeText(payload.websiteUrl, 800);
  const accentColor = sanitizeText(payload.accentColor, 24) || "#b8864e";
  const status = sanitizeText(payload.status, 20).toUpperCase() === "DRAFT" ? "DRAFT" : "PUBLISHED";
  const sortOrder = Number.isFinite(Number(payload.sortOrder)) ? Number(payload.sortOrder) : 0;

  if (!title || !category || !tagline || !shortDescription || !description || !iconUrl) {
    throw new Error("Title, category, tagline, descriptions, and icon image URL are required.");
  }

  return {
    slug,
    title,
    category,
    tagline,
    shortDescription,
    description,
    iconUrl,
    heroImageUrl: heroImageUrl || null,
    galleryJson: JSON.stringify(parseList(payload.gallery, 8, 600)),
    tagsJson: JSON.stringify(parseList(payload.tags, 8, 80)),
    featuresJson: JSON.stringify(parseList(payload.features, 8, 180)),
    highlightsJson: JSON.stringify(parseList(payload.highlights, 6, 120)),
    playStoreUrl: playStoreUrl || null,
    websiteUrl: websiteUrl || null,
    accentColor,
    status,
    featured: Boolean(payload.featured),
    sortOrder
  };
}

async function ensureDefaultAppPages() {
  if (localDevStore.isActive()) {
    localDevStore.ensureApps();
    return;
  }
  const count = await prisma.appLandingPage.count();
  if (count > 0) return;

  await prisma.appLandingPage.createMany({
    data: DEFAULT_APP_PAGES.map((app) => ({
      slug: app.slug,
      title: app.title,
      category: app.category,
      tagline: app.tagline,
      shortDescription: app.shortDescription,
      description: app.description,
      iconUrl: app.iconUrl,
      heroImageUrl: app.heroImageUrl,
      tagsJson: JSON.stringify(app.tags),
      featuresJson: JSON.stringify(app.features),
      highlightsJson: JSON.stringify(app.highlights),
      galleryJson: JSON.stringify([]),
      playStoreUrl: app.playStoreUrl,
      websiteUrl: null,
      accentColor: app.accentColor,
      status: "PUBLISHED",
      featured: true,
      sortOrder: app.sortOrder
    }))
  });
}

async function listPublishedAppPages() {
  if (localDevStore.isActive()) {
    return localDevStore.listApps(true).map(serializeAppPage);
  }
  const records = await prisma.appLandingPage.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });
  return records.map(serializeAppPage);
}

async function getPublishedAppPage(slug) {
  if (localDevStore.isActive()) {
    const record = localDevStore.findAppBySlug(makeSlug(slug));
    return record ? serializeAppPage(record) : null;
  }
  const record = await prisma.appLandingPage.findFirst({
    where: { slug: makeSlug(slug), status: "PUBLISHED" }
  });
  return record ? serializeAppPage(record) : null;
}

async function listAllAppPages() {
  if (localDevStore.isActive()) {
    return localDevStore.listApps().map(serializeAppPage);
  }
  const records = await prisma.appLandingPage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });
  return records.map(serializeAppPage);
}

async function getAppPageById(id) {
  if (localDevStore.isActive()) {
    const record = localDevStore.findAppById(id);
    return record ? serializeAppPage(record) : null;
  }
  const record = await prisma.appLandingPage.findUnique({ where: { id } });
  return record ? serializeAppPage(record) : null;
}

async function createAppPage(payload) {
  const data = await buildData(payload);
  if (localDevStore.isActive()) {
    return serializeAppPage(localDevStore.createApp(data));
  }
  const record = await prisma.appLandingPage.create({ data });
  return serializeAppPage(record);
}

async function updateAppPage(id, payload) {
  const data = await buildData(payload, id);
  if (localDevStore.isActive()) {
    return serializeAppPage(localDevStore.updateApp(id, data));
  }
  const record = await prisma.appLandingPage.update({
    where: { id },
    data
  });
  return serializeAppPage(record);
}

async function deleteAppPage(id) {
  if (localDevStore.isActive()) {
    return serializeAppPage(localDevStore.deleteApp(id));
  }
  const record = await prisma.appLandingPage.delete({ where: { id } });
  return serializeAppPage(record);
}

module.exports = {
  ensureDefaultAppPages,
  listPublishedAppPages,
  getPublishedAppPage,
  listAllAppPages,
  getAppPageById,
  createAppPage,
  updateAppPage,
  deleteAppPage
};
