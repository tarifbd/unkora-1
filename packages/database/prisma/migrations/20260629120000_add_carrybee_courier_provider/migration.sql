-- AddValue CARRYBEE to CourierProvider enum
-- Safe additive migration; existing rows are unchanged.
ALTER TYPE "CourierProvider" ADD VALUE IF NOT EXISTS 'CARRYBEE';
