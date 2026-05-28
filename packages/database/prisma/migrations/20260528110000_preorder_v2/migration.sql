-- Drop old preorder tables (FK order matters)
DROP TABLE IF EXISTS "preorder_orders";
DROP TABLE IF EXISTS "preorders";

-- CreateEnum
CREATE TYPE "PrepaymentType" AS ENUM ('NONE', 'FIXED_AMOUNT', 'PERCENTAGE', 'FULL_PAYMENT');
CREATE TYPE "PreorderConfigStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PreorderOrderStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'WAITING_FOR_STOCK', 'READY_TO_FULFILL', 'CONVERTED_TO_ORDER', 'CANCELLED', 'REFUNDED', 'COMPLETED');
CREATE TYPE "PreorderPaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED');
CREATE TYPE "PreorderEventType" AS ENUM ('CREATED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'CONFIRMED', 'STOCK_AVAILABLE', 'READY_TO_FULFILL', 'CONVERTED_TO_ORDER', 'CANCELLED', 'REFUNDED', 'CUSTOMER_NOTIFIED', 'ADMIN_NOTE_ADDED', 'STATUS_CHANGED');
CREATE TYPE "PreorderNotifChannel" AS ENUM ('EMAIL', 'SMS', 'IN_APP');
CREATE TYPE "PreorderNotifType" AS ENUM ('PREORDER_CONFIRMED', 'PAYMENT_REMINDER', 'STOCK_AVAILABLE', 'DELIVERY_UPDATE', 'CANCELLATION', 'REFUND', 'ORDER_CONVERTED');
CREATE TYPE "PreorderNotifStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable: preorder_configurations
CREATE TABLE "preorder_configurations" (
    "id"                    TEXT NOT NULL,
    "productId"             TEXT NOT NULL,
    "variantId"             TEXT,
    "isEnabled"             BOOLEAN NOT NULL DEFAULT true,
    "preorderTitle"         TEXT,
    "preorderDescription"   TEXT,
    "expectedReleaseDate"   TIMESTAMP(3),
    "expectedDeliveryStart" TIMESTAMP(3),
    "expectedDeliveryEnd"   TIMESTAMP(3),
    "preorderStartDate"     TIMESTAMP(3),
    "preorderEndDate"       TIMESTAMP(3),
    "stockLimit"            INTEGER,
    "maxQtyPerCustomer"     INTEGER,
    "prepaymentRequired"    BOOLEAN NOT NULL DEFAULT false,
    "prepaymentType"        "PrepaymentType" NOT NULL DEFAULT 'NONE',
    "prepaymentAmount"      DECIMAL(10,2),
    "preorderPrice"         DECIMAL(10,2),
    "allowCancellation"     BOOLEAN NOT NULL DEFAULT true,
    "cancellationDeadline"  TIMESTAMP(3),
    "autoConvertToOrder"    BOOLEAN NOT NULL DEFAULT false,
    "status"                "PreorderConfigStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preorder_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: preorder_orders
CREATE TABLE "preorder_orders" (
    "id"                   TEXT NOT NULL,
    "preorderNumber"       TEXT NOT NULL,
    "customerId"           TEXT,
    "productId"            TEXT NOT NULL,
    "variantId"            TEXT,
    "configId"             TEXT NOT NULL,
    "orderId"              TEXT,
    "quantity"             INTEGER NOT NULL,
    "unitPrice"            DECIMAL(10,2) NOT NULL,
    "totalAmount"          DECIMAL(10,2) NOT NULL,
    "prepaymentAmount"     DECIMAL(10,2) NOT NULL DEFAULT 0,
    "remainingAmount"      DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paymentStatus"        "PreorderPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "preorderStatus"       "PreorderOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "customerName"         TEXT NOT NULL,
    "customerEmail"        TEXT,
    "customerPhone"        TEXT NOT NULL,
    "shippingAddress"      JSONB,
    "note"                 TEXT,
    "expectedDeliveryDate" TIMESTAMP(3),
    "convertedAt"          TIMESTAMP(3),
    "cancelledAt"          TIMESTAMP(3),
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preorder_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable: preorder_events
CREATE TABLE "preorder_events" (
    "id"              TEXT NOT NULL,
    "preorderOrderId" TEXT NOT NULL,
    "eventType"       "PreorderEventType" NOT NULL,
    "message"         TEXT NOT NULL,
    "metadata"        JSONB,
    "createdBy"       TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preorder_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable: preorder_notifications
CREATE TABLE "preorder_notifications" (
    "id"              TEXT NOT NULL,
    "preorderOrderId" TEXT NOT NULL,
    "channel"         "PreorderNotifChannel" NOT NULL,
    "notifType"       "PreorderNotifType" NOT NULL,
    "status"          "PreorderNotifStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt"          TIMESTAMP(3),
    "errorMessage"    TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preorder_notifications_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX "preorder_configurations_productId_key" ON "preorder_configurations"("productId");
CREATE UNIQUE INDEX "preorder_orders_preorderNumber_key" ON "preorder_orders"("preorderNumber");

-- Regular indexes
CREATE INDEX "preorder_configurations_productId_idx" ON "preorder_configurations"("productId");
CREATE INDEX "preorder_configurations_status_idx" ON "preorder_configurations"("status");
CREATE INDEX "preorder_orders_customerId_idx" ON "preorder_orders"("customerId");
CREATE INDEX "preorder_orders_preorderStatus_idx" ON "preorder_orders"("preorderStatus");
CREATE INDEX "preorder_orders_paymentStatus_idx" ON "preorder_orders"("paymentStatus");
CREATE INDEX "preorder_orders_configId_idx" ON "preorder_orders"("configId");
CREATE INDEX "preorder_events_preorderOrderId_idx" ON "preorder_events"("preorderOrderId");
CREATE INDEX "preorder_notifications_preorderOrderId_idx" ON "preorder_notifications"("preorderOrderId");

-- AddForeignKey
ALTER TABLE "preorder_configurations" ADD CONSTRAINT "preorder_configurations_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "preorder_orders" ADD CONSTRAINT "preorder_orders_configId_fkey"
    FOREIGN KEY ("configId") REFERENCES "preorder_configurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "preorder_events" ADD CONSTRAINT "preorder_events_preorderOrderId_fkey"
    FOREIGN KEY ("preorderOrderId") REFERENCES "preorder_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "preorder_notifications" ADD CONSTRAINT "preorder_notifications_preorderOrderId_fkey"
    FOREIGN KEY ("preorderOrderId") REFERENCES "preorder_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
