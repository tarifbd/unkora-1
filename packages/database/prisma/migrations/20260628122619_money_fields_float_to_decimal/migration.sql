/*
  Warnings:

  - You are about to alter the column `amount` on the `affiliate_payouts` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `commissionRate` on the `affiliates` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `totalEarned` on the `affiliates` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `pendingPayout` on the `affiliates` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `estimatedCost` on the `ai_generation_logs` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,6)`.
  - You are about to alter the column `rate` on the `currencies` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,6)`.

*/
-- AlterTable
ALTER TABLE "affiliate_payouts" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "affiliates" ALTER COLUMN "commissionRate" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "totalEarned" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "pendingPayout" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "ai_generation_logs" ALTER COLUMN "estimatedCost" SET DATA TYPE DECIMAL(12,6);

-- AlterTable
ALTER TABLE "currencies" ALTER COLUMN "rate" SET DATA TYPE DECIMAL(18,6);
