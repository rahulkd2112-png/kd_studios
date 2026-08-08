const { prisma } = require("../lib/prisma");
const { sanitizeText } = require("../lib/validation");

const DEFAULT_APP_PAGES = [
  {
    slug: "facefix-ai",
    title: "FaceFix AI",
    category: "AI Photo Editing App",
    tagline: "Restore faces, sharpen portraits, and make old photos feel clear again.",
    shortDescription:
      "AI-powered face enhancement for blurry portraits, restored facial details, and cleaner old photos.",
    description:
      "FaceFix AI is built for people who want fast, clean portrait enhancement without complicated editing tools. It focuses on face clarity, old-photo restoration, and everyday image improvement for Android users.",
    iconUrl: "/logo/facefixai.png",
    heroImageUrl: "/logo/facefixai.png",
    tags: ["AI Enhancement", "Photo Editing", "Android"],
    features: [
      "Enhance blurry face details",
      "Improve old and low-quality portraits",
      "Simple Android-first workflow",
      "Clean output for sharing and personal memories"
    ],
    highlights: ["AI face restoration", "Portrait clarity", "Old photo support"],
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.kdstudios.facefixai",
    accentColor: "#3b82f6",
    sortOrder: 10
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
    sortOrder: 20
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
    sortOrder: 30
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
    const existing = await prisma.appLandingPage.findUnique({ where: { slug: candidate } });
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
  const records = await prisma.appLandingPage.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });
  return records.map(serializeAppPage);
}

async function getPublishedAppPage(slug) {
  const record = await prisma.appLandingPage.findFirst({
    where: { slug: makeSlug(slug), status: "PUBLISHED" }
  });
  return record ? serializeAppPage(record) : null;
}

async function listAllAppPages() {
  const records = await prisma.appLandingPage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });
  return records.map(serializeAppPage);
}

async function getAppPageById(id) {
  const record = await prisma.appLandingPage.findUnique({ where: { id } });
  return record ? serializeAppPage(record) : null;
}

async function createAppPage(payload) {
  const data = await buildData(payload);
  const record = await prisma.appLandingPage.create({ data });
  return serializeAppPage(record);
}

async function updateAppPage(id, payload) {
  const data = await buildData(payload, id);
  const record = await prisma.appLandingPage.update({
    where: { id },
    data
  });
  return serializeAppPage(record);
}

async function deleteAppPage(id) {
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
