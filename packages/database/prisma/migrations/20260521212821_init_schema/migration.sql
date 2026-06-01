-- CreateEnum
CREATE TYPE "BookSubmissionStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "book_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "publisherName" TEXT,
    "isbn" TEXT,
    "language" TEXT NOT NULL DEFAULT 'Bengali',
    "pageCount" INTEGER,
    "edition" TEXT,
    "genres" TEXT[],
    "description" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "suggestedPrice" DECIMAL(10,2) NOT NULL,
    "royaltyPercent" INTEGER NOT NULL DEFAULT 10,
    "status" "BookSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_submissions_productId_key" ON "book_submissions"("productId");

-- CreateIndex
CREATE INDEX "book_submissions_userId_idx" ON "book_submissions"("userId");

-- CreateIndex
CREATE INDEX "book_submissions_status_idx" ON "book_submissions"("status");

-- AddForeignKey
ALTER TABLE "book_submissions" ADD CONSTRAINT "book_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_submissions" ADD CONSTRAINT "book_submissions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
