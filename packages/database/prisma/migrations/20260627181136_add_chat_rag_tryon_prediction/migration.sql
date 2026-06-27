-- CreateEnum
CREATE TYPE "RagDocumentStatus" AS ENUM ('PENDING', 'INDEXED', 'FAILED');

-- CreateEnum
CREATE TYPE "RagDocumentCategory" AS ENUM ('FAQ', 'POLICY', 'PRODUCT', 'SHIPPING', 'RETURNS', 'GENERAL');

-- CreateEnum
CREATE TYPE "TryOnStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ChatSessionStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "PredictionReportStatus" AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "preorder_events" DROP CONSTRAINT "preorder_events_preorderOrderId_fkey";

-- DropForeignKey
ALTER TABLE "preorder_notifications" DROP CONSTRAINT "preorder_notifications_preorderOrderId_fkey";

-- DropForeignKey
ALTER TABLE "suppliers" DROP CONSTRAINT "suppliers_supplierId_fkey";

-- CreateTable
CREATE TABLE "rag_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "RagDocumentCategory" NOT NULL DEFAULT 'GENERAL',
    "source" TEXT,
    "status" "RagDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_document_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_try_on_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "userImageUrl" TEXT,
    "resultImageUrl" TEXT,
    "status" "TryOnStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "virtual_try_on_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT,
    "userId" TEXT,
    "status" "ChatSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "periodLabel" TEXT,
    "status" "PredictionReportStatus" NOT NULL DEFAULT 'GENERATING',
    "statsSnapshot" JSONB,
    "aiAnalysis" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rag_documents_category_idx" ON "rag_documents"("category");

-- CreateIndex
CREATE INDEX "rag_documents_status_idx" ON "rag_documents"("status");

-- CreateIndex
CREATE INDEX "rag_document_chunks_documentId_idx" ON "rag_document_chunks"("documentId");

-- CreateIndex
CREATE INDEX "virtual_try_on_sessions_userId_idx" ON "virtual_try_on_sessions"("userId");

-- CreateIndex
CREATE INDEX "virtual_try_on_sessions_productId_idx" ON "virtual_try_on_sessions"("productId");

-- CreateIndex
CREATE INDEX "chat_sessions_visitorId_idx" ON "chat_sessions"("visitorId");

-- CreateIndex
CREATE INDEX "chat_sessions_userId_idx" ON "chat_sessions"("userId");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");

-- CreateIndex
CREATE INDEX "prediction_reports_status_idx" ON "prediction_reports"("status");

-- CreateIndex
CREATE INDEX "flash_deals_isActive_startsAt_endsAt_idx" ON "flash_deals"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "inventory_stocks_status_updatedAt_idx" ON "inventory_stocks"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_productId_idx" ON "order_items"("orderId", "productId");

-- CreateIndex
CREATE INDEX "products_isActive_createdAt_idx" ON "products"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_productId_isPublished_idx" ON "reviews"("productId", "isPublished");

-- AddForeignKey
ALTER TABLE "preorder_events" ADD CONSTRAINT "preorder_events_preorderOrderId_fkey" FOREIGN KEY ("preorderOrderId") REFERENCES "preorder_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preorder_notifications" ADD CONSTRAINT "preorder_notifications_preorderOrderId_fkey" FOREIGN KEY ("preorderOrderId") REFERENCES "preorder_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_document_chunks" ADD CONSTRAINT "rag_document_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "rag_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_try_on_sessions" ADD CONSTRAINT "virtual_try_on_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
