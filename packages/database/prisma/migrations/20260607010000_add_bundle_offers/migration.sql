-- Create bundle_offers table
CREATE TABLE IF NOT EXISTS "bundle_offers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minItems" INTEGER NOT NULL DEFAULT 2,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bundle_offers_pkey" PRIMARY KEY ("id")
);

-- Create bundle_offer_items table
CREATE TABLE IF NOT EXISTS "bundle_offer_items" (
    "id" TEXT NOT NULL,
    "bundleOfferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "bundle_offer_items_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "bundle_offer_items" ADD CONSTRAINT "bundle_offer_items_bundleOfferId_fkey"
    FOREIGN KEY ("bundleOfferId") REFERENCES "bundle_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bundle_offer_items" ADD CONSTRAINT "bundle_offer_items_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique & indexes
ALTER TABLE "bundle_offer_items" ADD CONSTRAINT "bundle_offer_items_bundleOfferId_productId_key"
    UNIQUE ("bundleOfferId", "productId");
CREATE INDEX IF NOT EXISTS "bundle_offers_isActive_idx" ON "bundle_offers"("isActive");
CREATE INDEX IF NOT EXISTS "bundle_offer_items_bundleOfferId_idx" ON "bundle_offer_items"("bundleOfferId");
