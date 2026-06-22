-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "QuestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add images and helpfulCount to reviews
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "helpfulCount" INTEGER NOT NULL DEFAULT 0;

-- Create product_questions table
CREATE TABLE IF NOT EXISTS "product_questions" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "guestName" TEXT,
    "body" TEXT NOT NULL,
    "status" "QuestionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_questions_pkey" PRIMARY KEY ("id")
);

-- Create product_answers table
CREATE TABLE IF NOT EXISTS "product_answers" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_answers_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_answers" ADD CONSTRAINT "product_answers_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "product_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_answers" ADD CONSTRAINT "product_answers_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS "product_questions_productId_idx" ON "product_questions"("productId");
CREATE INDEX IF NOT EXISTS "product_questions_status_idx" ON "product_questions"("status");
CREATE INDEX IF NOT EXISTS "product_answers_questionId_idx" ON "product_answers"("questionId");
