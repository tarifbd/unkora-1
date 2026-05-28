-- Migration: AI Studio + Advanced SEO v2
-- Created: 2026-05-28

-- ─── AI STUDIO ENUMS ──────────────────────────────────────────────────────────

CREATE TYPE "AiFeatureType" AS ENUM (
  'PRODUCT_CONTENT',
  'PRODUCT_SEO',
  'CATEGORY_SEO',
  'LANDING_PAGE',
  'BLOG_ARTICLE',
  'AD_COPY',
  'EMAIL_COPY',
  'FAQ',
  'IMAGE_ALT_TEXT',
  'META_DESCRIPTION',
  'SCHEMA_MARKUP',
  'AGENT_TASK',
  'CUSTOM_PROMPT'
);

CREATE TYPE "AiGenerationStatus" AS ENUM (
  'SUCCESS',
  'FAILED'
);

CREATE TYPE "AiContentStatus" AS ENUM (
  'DRAFT',
  'APPROVED',
  'APPLIED',
  'ARCHIVED'
);

CREATE TYPE "AiRelatedEntityType" AS ENUM (
  'PRODUCT',
  'CATEGORY',
  'BLOG',
  'LANDING_PAGE',
  'SEO',
  'EMAIL',
  'AD',
  'CUSTOM'
);

CREATE TYPE "AiAgentType" AS ENUM (
  'SEO_AGENT',
  'CONTENT_AGENT',
  'PRODUCT_AGENT',
  'LANDING_PAGE_AGENT',
  'CUSTOMER_SUPPORT_AGENT',
  'INVENTORY_AGENT',
  'MARKETING_AGENT',
  'CUSTOM_AGENT'
);

CREATE TYPE "AiAgentTaskStatus" AS ENUM (
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

-- ─── SEO ENUMS ────────────────────────────────────────────────────────────────

CREATE TYPE "SeoEntityType" AS ENUM (
  'PRODUCT',
  'CATEGORY',
  'BRAND',
  'PAGE',
  'BLOG',
  'LANDING_PAGE',
  'HOME',
  'CUSTOM'
);

CREATE TYPE "SeoAuditStatus" AS ENUM (
  'GOOD',
  'NEEDS_IMPROVEMENT',
  'POOR'
);

CREATE TYPE "SeoRedirectCode" AS ENUM (
  'R301',
  'R302',
  'R307',
  'R308'
);

CREATE TYPE "SeoChangeFrequency" AS ENUM (
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never'
);

-- ─── AI STUDIO TABLES ─────────────────────────────────────────────────────────

CREATE TABLE "ai_settings" (
  "id"                TEXT NOT NULL,
  "provider"          TEXT NOT NULL DEFAULT 'openai',
  "defaultModel"      TEXT,
  "isEnabled"         BOOLEAN NOT NULL DEFAULT true,
  "temperature"       DOUBLE PRECISION NOT NULL DEFAULT 0.7,
  "maxTokens"         INTEGER NOT NULL DEFAULT 1000,
  "systemPrompt"      TEXT,
  "safetyMode"        BOOLEAN NOT NULL DEFAULT true,
  "monthlyTokenLimit" INTEGER,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_generation_logs" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT,
  "provider"      TEXT NOT NULL,
  "model"         TEXT,
  "featureType"   "AiFeatureType" NOT NULL,
  "inputSummary"  TEXT,
  "outputSummary" TEXT,
  "tokenInput"    INTEGER,
  "tokenOutput"   INTEGER,
  "estimatedCost" DOUBLE PRECISION,
  "status"        "AiGenerationStatus" NOT NULL,
  "errorMessage"  TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_generation_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_templates" (
  "id"               TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "featureType"      "AiFeatureType" NOT NULL,
  "promptTemplate"   TEXT NOT NULL,
  "outputSchemaJson" JSONB,
  "isActive"         BOOLEAN NOT NULL DEFAULT true,
  "createdBy"        TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_generated_contents" (
  "id"                TEXT NOT NULL,
  "featureType"       "AiFeatureType" NOT NULL,
  "relatedEntityType" "AiRelatedEntityType",
  "relatedEntityId"   TEXT,
  "title"             TEXT NOT NULL,
  "contentJson"       JSONB NOT NULL,
  "contentText"       TEXT NOT NULL,
  "status"            "AiContentStatus" NOT NULL DEFAULT 'DRAFT',
  "generatedBy"       TEXT,
  "approvedBy"        TEXT,
  "appliedAt"         TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_generated_contents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_agent_integrations" (
  "id"            TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "provider"      TEXT NOT NULL,
  "agentType"     "AiAgentType" NOT NULL,
  "description"   TEXT,
  "endpointUrl"   TEXT,
  "apiKeyEnvName" TEXT,
  "isEnabled"     BOOLEAN NOT NULL DEFAULT false,
  "configJson"    JSONB,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_agent_integrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_agent_tasks" (
  "id"                 TEXT NOT NULL,
  "agentIntegrationId" TEXT,
  "taskType"           TEXT NOT NULL,
  "status"             "AiAgentTaskStatus" NOT NULL DEFAULT 'PENDING',
  "inputJson"          JSONB NOT NULL,
  "outputJson"         JSONB,
  "errorMessage"       TEXT,
  "startedAt"          TIMESTAMP(3),
  "completedAt"        TIMESTAMP(3),
  "createdBy"          TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_agent_tasks_pkey" PRIMARY KEY ("id")
);

-- AI Studio Indexes
CREATE INDEX "ai_generation_logs_featureType_idx" ON "ai_generation_logs"("featureType");
CREATE INDEX "ai_generation_logs_status_idx" ON "ai_generation_logs"("status");
CREATE INDEX "ai_generation_logs_createdAt_idx" ON "ai_generation_logs"("createdAt");
CREATE INDEX "ai_generated_contents_featureType_idx" ON "ai_generated_contents"("featureType");
CREATE INDEX "ai_generated_contents_status_idx" ON "ai_generated_contents"("status");
CREATE INDEX "ai_generated_contents_relatedEntityId_idx" ON "ai_generated_contents"("relatedEntityId");
CREATE INDEX "ai_agent_tasks_status_idx" ON "ai_agent_tasks"("status");
CREATE INDEX "ai_agent_tasks_agentIntegrationId_idx" ON "ai_agent_tasks"("agentIntegrationId");

-- AI Agent Tasks Foreign Key
ALTER TABLE "ai_agent_tasks"
  ADD CONSTRAINT "ai_agent_tasks_agentIntegrationId_fkey"
  FOREIGN KEY ("agentIntegrationId")
  REFERENCES "ai_agent_integrations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── SEO TABLES ───────────────────────────────────────────────────────────────

CREATE TABLE "seo_metadata" (
  "id"                    TEXT NOT NULL,
  "entityType"            "SeoEntityType" NOT NULL,
  "entityId"              TEXT,
  "seoTitle"              TEXT,
  "metaDescription"       TEXT,
  "metaKeywords"          TEXT,
  "slug"                  TEXT,
  "canonicalUrl"          TEXT,
  "robotsIndex"           BOOLEAN NOT NULL DEFAULT true,
  "robotsFollow"          BOOLEAN NOT NULL DEFAULT true,
  "ogTitle"               TEXT,
  "ogDescription"         TEXT,
  "ogImage"               TEXT,
  "twitterTitle"          TEXT,
  "twitterDescription"    TEXT,
  "twitterImage"          TEXT,
  "focusKeyword"          TEXT,
  "secondaryKeywordsJson" JSONB,
  "schemaType"            TEXT,
  "schemaJson"            JSONB,
  "hreflangJson"          JSONB,
  "seoScore"              INTEGER,
  "lastAuditedAt"         TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,
  CONSTRAINT "seo_metadata_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seo_audits" (
  "id"              TEXT NOT NULL,
  "entityType"      "SeoEntityType" NOT NULL,
  "entityId"        TEXT,
  "url"             TEXT,
  "score"           INTEGER NOT NULL,
  "status"          "SeoAuditStatus" NOT NULL,
  "issuesJson"      JSONB NOT NULL,
  "suggestionsJson" JSONB NOT NULL,
  "auditedBy"       TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "seo_audits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seo_redirects" (
  "id"         TEXT NOT NULL,
  "sourcePath" TEXT NOT NULL,
  "targetPath" TEXT NOT NULL,
  "statusCode" "SeoRedirectCode" NOT NULL DEFAULT 'R301',
  "isActive"   BOOLEAN NOT NULL DEFAULT true,
  "hitCount"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "seo_redirects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seo_internal_links" (
  "id"               TEXT NOT NULL,
  "sourceEntityType" "SeoEntityType" NOT NULL,
  "sourceEntityId"   TEXT NOT NULL,
  "targetEntityType" "SeoEntityType" NOT NULL,
  "targetEntityId"   TEXT NOT NULL,
  "anchorText"       TEXT NOT NULL,
  "isActive"         BOOLEAN NOT NULL DEFAULT true,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "seo_internal_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seo_image_alts" (
  "id"         TEXT NOT NULL,
  "entityType" "SeoEntityType" NOT NULL,
  "entityId"   TEXT NOT NULL,
  "imageUrl"   TEXT NOT NULL,
  "altText"    TEXT NOT NULL,
  "titleText"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "seo_image_alts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seo_sitemap_entries" (
  "id"               TEXT NOT NULL,
  "url"              TEXT NOT NULL,
  "entityType"       "SeoEntityType",
  "entityId"         TEXT,
  "priority"         DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "changeFrequency"  "SeoChangeFrequency" NOT NULL DEFAULT 'weekly',
  "includeInSitemap" BOOLEAN NOT NULL DEFAULT true,
  "lastModified"     TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "seo_sitemap_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seo_settings" (
  "id"                     TEXT NOT NULL,
  "siteName"               TEXT NOT NULL DEFAULT 'UNKORA',
  "defaultTitle"           TEXT,
  "titleTemplate"          TEXT NOT NULL DEFAULT '%s | UNKORA',
  "defaultMetaDescription" TEXT,
  "defaultOgImage"         TEXT,
  "robotsTxt"              TEXT,
  "enableAutoSitemap"      BOOLEAN NOT NULL DEFAULT true,
  "enableSchemaMarkup"     BOOLEAN NOT NULL DEFAULT true,
  "enableOpenGraph"        BOOLEAN NOT NULL DEFAULT true,
  "enableTwitterCards"     BOOLEAN NOT NULL DEFAULT true,
  "enableCanonicalUrls"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL,
  CONSTRAINT "seo_settings_pkey" PRIMARY KEY ("id")
);

-- SEO Unique Constraints
CREATE UNIQUE INDEX "seo_metadata_entityType_entityId_key" ON "seo_metadata"("entityType", "entityId");
CREATE UNIQUE INDEX "seo_redirects_sourcePath_key" ON "seo_redirects"("sourcePath");
CREATE UNIQUE INDEX "seo_sitemap_entries_url_key" ON "seo_sitemap_entries"("url");

-- SEO Indexes
CREATE INDEX "seo_metadata_entityType_idx" ON "seo_metadata"("entityType");
CREATE INDEX "seo_metadata_slug_idx" ON "seo_metadata"("slug");
CREATE INDEX "seo_audits_entityType_entityId_idx" ON "seo_audits"("entityType", "entityId");
CREATE INDEX "seo_audits_createdAt_idx" ON "seo_audits"("createdAt");
CREATE INDEX "seo_redirects_sourcePath_idx" ON "seo_redirects"("sourcePath");
CREATE INDEX "seo_redirects_isActive_idx" ON "seo_redirects"("isActive");
CREATE INDEX "seo_internal_links_sourceEntityId_idx" ON "seo_internal_links"("sourceEntityId");
CREATE INDEX "seo_image_alts_entityId_idx" ON "seo_image_alts"("entityId");
CREATE INDEX "seo_sitemap_entries_includeInSitemap_idx" ON "seo_sitemap_entries"("includeInSitemap");
