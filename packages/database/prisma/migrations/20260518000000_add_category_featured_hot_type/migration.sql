-- AlterTable
ALTER TABLE "categories" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categories" ADD COLUMN "isHot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categories" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'physical';
