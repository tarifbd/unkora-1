-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED');

-- CreateEnum
CREATE TYPE "RefundReason" AS ENUM ('DEFECTIVE', 'NOT_AS_DESCRIBED', 'WRONG_ITEM', 'DAMAGED_IN_TRANSIT', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliveryBoyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_DELIVERY');

-- CreateEnum
CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterEnum: add DELIVERY_BOY to UserRole
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DELIVERY_BOY';

-- AlterTable: add preorder fields to products
ALTER TABLE "products" ADD COLUMN "isPreorder" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "preorderNote" TEXT;
ALTER TABLE "products" ADD COLUMN "preorderDate" TIMESTAMP(3);

-- AlterTable: add deliveryBoyId to orders
ALTER TABLE "orders" ADD COLUMN "deliveryBoyId" TEXT;

-- CreateTable: delivery_boys
CREATE TABLE "delivery_boys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "area" TEXT,
    "vehicleType" TEXT,
    "status" "DeliveryBoyStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalDeliveries" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_boys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_boys_userId_key" ON "delivery_boys"("userId");

-- CreateTable: flash_deals
CREATE TABLE "flash_deals" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "discount" DECIMAL(5,2) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_deals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "flash_deals_productId_key" ON "flash_deals"("productId");

-- CreateIndex
CREATE INDEX "flash_deals_isActive_endsAt_idx" ON "flash_deals"("isActive", "endsAt");

-- CreateTable: wholesale_prices
CREATE TABLE "wholesale_prices" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "wholesale_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wholesale_prices_productId_minQty_key" ON "wholesale_prices"("productId", "minQty");

-- CreateTable: refunds
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" "RefundReason" NOT NULL,
    "description" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refunds_orderId_idx" ON "refunds"("orderId");

-- CreateIndex
CREATE INDEX "refunds_userId_idx" ON "refunds"("userId");

-- CreateIndex
CREATE INDEX "refunds_status_idx" ON "refunds"("status");

-- CreateTable: blog_posts
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "coverImage" TEXT,
    "authorId" TEXT NOT NULL,
    "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[],
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_idx" ON "blog_posts"("status");

-- CreateIndex on orders for deliveryBoyId
CREATE INDEX "orders_deliveryBoyId_idx" ON "orders"("deliveryBoyId");

-- AddForeignKey: delivery_boys -> users
ALTER TABLE "delivery_boys" ADD CONSTRAINT "delivery_boys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: orders -> delivery_boys
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryBoyId_fkey" FOREIGN KEY ("deliveryBoyId") REFERENCES "delivery_boys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: flash_deals -> products
ALTER TABLE "flash_deals" ADD CONSTRAINT "flash_deals_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wholesale_prices -> products
ALTER TABLE "wholesale_prices" ADD CONSTRAINT "wholesale_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: refunds -> orders
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: refunds -> users
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: blog_posts -> users
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
