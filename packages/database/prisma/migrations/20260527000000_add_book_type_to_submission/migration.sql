-- CreateEnum
CREATE TYPE "BookType" AS ENUM ('EBOOK', 'PHYSICAL', 'BOTH');

-- AlterTable
ALTER TABLE "book_submissions"
  ADD COLUMN "bookType"                "BookType" NOT NULL DEFAULT 'PHYSICAL',
  ADD COLUMN "digitalFileUrl"          TEXT,
  ADD COLUMN "sampleUrl"               TEXT,
  ADD COLUMN "authorBio"               TEXT,
  ADD COLUMN "requestedRoyaltyPercent" INTEGER;

-- CreateIndex
CREATE INDEX "book_submissions_bookType_idx" ON "book_submissions"("bookType");
