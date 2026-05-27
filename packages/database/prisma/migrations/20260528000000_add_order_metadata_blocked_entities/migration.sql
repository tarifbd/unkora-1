-- Add metadata column to orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Create blocked_entities table
CREATE TABLE IF NOT EXISTS "blocked_entities" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "reason" TEXT,
  "blockedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "blocked_entities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "blocked_entities_type_value_key" ON "blocked_entities"("type", "value");
