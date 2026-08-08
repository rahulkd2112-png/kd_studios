-- CreateTable
CREATE TABLE "AppLandingPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "heroImageUrl" TEXT,
    "galleryJson" TEXT,
    "tagsJson" TEXT NOT NULL,
    "featuresJson" TEXT NOT NULL,
    "highlightsJson" TEXT,
    "playStoreUrl" TEXT,
    "websiteUrl" TEXT,
    "accentColor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "featured" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppLandingPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppLandingPage_slug_key" ON "AppLandingPage"("slug");

-- CreateIndex
CREATE INDEX "AppLandingPage_status_sortOrder_idx" ON "AppLandingPage"("status", "sortOrder");
