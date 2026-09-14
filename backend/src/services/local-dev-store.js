const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const config = require("../config");
const { runtimeState } = require("../lib/runtime-state");

const storePath = path.join(config.rootDir, "backend", "data", "local-app-pages.json");
const sessions = new Map();
const otpByEmail = new Map();

function isActive() {
  const emailConfigured = Boolean(config.emailUser && config.emailPass);
  return config.nodeEnv !== "production" && !runtimeState.databaseReady && !emailConfigured;
}

function now() {
  return new Date().toISOString();
}

function defaultApps() {
  const createdAt = now();
  return [
    ["local-foodscanai", "foodscan-ai", "FoodScan AI", "AI Food Scanner App", "Scan meals and ingredients with a confident AI food understanding workflow.", "/logo/foodscanai.png", "#8b5cf6", 10],
    ["local-interviewerlyai", "interviewerly-ai", "Interviewerly AI", "AI Interview App", "Practice interviews, sharpen answers, and prepare with guided coaching.", "/logo/interviewerlyai.png", "#0891b2", 20],
    ["local-imagelyresizer", "imagely-resizer", "ImageLy Resizer", "AI Image Resizer App", "Resize images quickly and prepare visual assets for modern creative workflows.", "/logo/imagelyresizer.png", "#16a34a", 30],
    ["local-doclypdfreadereditorscanner", "docly-pdf-reader-editor-scanner", "Docly PDF Reader Editor Scanner", "PDF Scanner & Editor App", "Read, scan, edit, and organize documents from one clean mobile workflow.", "/logo/doclypdfreadereditorscanner.png", "#f97316", 40],
    ["local-scanpro", "scanpro", "ScanPro", "Document Scanner App", "Capture cleaner documents and export useful scans in seconds.", "/logo/ScanPro.png", "#0f766e", 50],
    ["local-stacktower", "stack-tower", "Stack Tower", "Arcade Game", "A precise one-tap stacking game built for quick replay sessions.", "/logo/Stack%20Tower.png", "#dc2626", 60]
  ].map(([id, slug, title, category, tagline, iconUrl, accentColor, sortOrder]) => ({
    id,
    slug,
    title,
    category,
    tagline,
    shortDescription: tagline,
    description: `${title} is a KD Studios product page managed from the local development workspace.`,
    iconUrl,
    heroImageUrl: iconUrl,
    galleryJson: "[]",
    tagsJson: JSON.stringify([category, "KD Studios"]),
    featuresJson: JSON.stringify(["Professional product page", "Editable from Admin Workspace"]),
    highlightsJson: JSON.stringify(["Locally managed", "Ready to publish"]),
    playStoreUrl: null,
    websiteUrl: null,
    accentColor,
    status: "PUBLISHED",
    featured: true,
    sortOrder,
    createdAt,
    updatedAt: createdAt
  }));
}

function readApps() {
  try {
    if (fs.existsSync(storePath)) {
      const data = JSON.parse(fs.readFileSync(storePath, "utf8"));
      if (Array.isArray(data)) return data;
    }
  } catch {
    // A malformed development store is replaced with safe starter content.
  }
  const apps = defaultApps();
  writeApps(apps);
  return apps;
}

function writeApps(apps) {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(apps, null, 2), "utf8");
}

function getAdminUser() {
  return {
    id: "local-admin",
    name: config.admin.name,
    email: config.admin.email,
    phone: config.admin.phone || null,
    role: "ADMIN",
    isBlocked: false,
    blockedReason: null,
    createdAt: new Date(0).toISOString()
  };
}

function matchesAdminCredentials(email, password) {
  return String(email || "").trim().toLowerCase() === config.admin.email &&
    String(password || "") === String(config.admin.password || "");
}

function issueOtp(email) {
  const code = "000000";
  otpByEmail.set(String(email).toLowerCase(), { code, expiresAt: Date.now() + 10 * 60 * 1000 });
  return code;
}

function verifyOtpForAdmin(email, otp) {
  const key = String(email || "").toLowerCase();
  const record = otpByEmail.get(key);
  if (!record || record.expiresAt < Date.now() || String(otp || "") !== record.code) return false;
  otpByEmail.delete(key);
  return true;
}

function createSession() {
  const tokenId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  sessions.set(tokenId, { tokenId, user: getAdminUser(), expiresAt, revokedAt: null });
  return { tokenId, expiresAt };
}

function getSession(tokenId) {
  const session = sessions.get(tokenId);
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  return session;
}

function revokeSession(tokenId) {
  const session = sessions.get(tokenId);
  if (session) session.revokedAt = new Date();
}

function ensureApps() {
  return readApps();
}

function listApps(publishedOnly = false) {
  return readApps()
    .filter((app) => !publishedOnly || app.status === "PUBLISHED")
    .sort((a, b) => a.sortOrder - b.sortOrder || String(b.createdAt).localeCompare(String(a.createdAt)));
}

function findAppBySlug(slug) {
  return readApps().find((app) => app.slug === slug && app.status === "PUBLISHED") || null;
}

function findAppById(id) {
  return readApps().find((app) => app.id === id) || null;
}

function createApp(data) {
  const apps = readApps();
  const timestamp = now();
  const record = { id: crypto.randomUUID(), ...data, createdAt: timestamp, updatedAt: timestamp };
  apps.push(record);
  writeApps(apps);
  return record;
}

function updateApp(id, data) {
  const apps = readApps();
  const index = apps.findIndex((app) => app.id === id);
  if (index < 0) throw new Error("App landing page not found.");
  apps[index] = { ...apps[index], ...data, id, updatedAt: now() };
  writeApps(apps);
  return apps[index];
}

function deleteApp(id) {
  const apps = readApps();
  const index = apps.findIndex((app) => app.id === id);
  if (index < 0) throw new Error("App landing page not found.");
  const [record] = apps.splice(index, 1);
  writeApps(apps);
  return record;
}

module.exports = {
  isActive,
  getAdminUser,
  matchesAdminCredentials,
  issueOtp,
  verifyOtpForAdmin,
  createSession,
  getSession,
  revokeSession,
  ensureApps,
  listApps,
  findAppBySlug,
  findAppById,
  createApp,
  updateApp,
  deleteApp
};
