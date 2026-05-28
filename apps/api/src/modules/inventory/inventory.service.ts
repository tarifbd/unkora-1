import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { SetStockDto } from './dto/set-stock.dto';
import { AdjustmentStatus, InventoryMovementType, StockStatus } from '@prisma/client';
import { WarehouseService } from './warehouse.service';

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly warehouseService: WarehouseService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // LEGACY (v1) — kept for backwards compatibility
  // ─────────────────────────────────────────────────────────────

  async adjustStock(dto: AdjustStockDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new BadRequestException('Product not found');

    const newStock = product.stockQuantity + dto.quantity;
    if (newStock < 0) throw new BadRequestException('Insufficient stock');

    const [updated] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { stockQuantity: newStock },
      }),
      this.prisma.stockMovement.create({
        data: {
          productId: dto.productId,
          type: dto.type,
          quantity: dto.quantity,
          note: dto.note,
          createdBy: userId,
        },
      }),
    ]);

    if (newStock <= LOW_STOCK_THRESHOLD && newStock > 0) {
      await this.email.sendLowStockAlert(product.name, newStock).catch(() => {});
    }

    return updated;
  }

  async getLowStockProducts() {
    return this.prisma.product.findMany({
      where: { isActive: true, stockQuantity: { lte: LOW_STOCK_THRESHOLD } },
      select: { id: true, name: true, slug: true, stockQuantity: true, sku: true },
      orderBy: { stockQuantity: 'asc' },
    });
  }

  async getStockHistory(productId: string, page = 1, limit = 20) {
    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.stockMovement.count({ where: { productId } }),
    ]);
    return { data: movements, meta: { total, page, limit } };
  }

  async getInventoryOverview(page = 1, limit = 20, filter?: string) {
    const stockFilter =
      filter === 'out' ? { equals: 0 } :
      filter === 'low' ? { gt: 0, lte: LOW_STOCK_THRESHOLD } :
      filter === 'ok'  ? { gt: LOW_STOCK_THRESHOLD } :
      undefined;

    const where = { isActive: true, ...(stockFilter ? { stockQuantity: stockFilter } : {}) };

    const [products, total, outCount, lowCount] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true, name: true, slug: true, sku: true,
          stockQuantity: true, basePrice: true, salePrice: true,
          category: { select: { name: true } },
          images: { select: { url: true }, take: 1, orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { stockQuantity: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
      this.prisma.product.count({ where: { isActive: true, stockQuantity: { equals: 0 } } }),
      this.prisma.product.count({ where: { isActive: true, stockQuantity: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }),
    ]);
    return { data: products, meta: { total, page, limit, outCount, lowCount } };
  }

  // ─────────────────────────────────────────────────────────────
  // INVENTORY V2
  // ─────────────────────────────────────────────────────────────

  async getDashboard() {
    const [
      totalProducts,
      outOfStockV2,
      lowStockV2,
      pendingAlerts,
      recentMovements,
      pendingPOs,
    ] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({ where: { isActive: true, stockQuantity: 0 } }),
      this.prisma.product.count({ where: { isActive: true, stockQuantity: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }),
      this.prisma.inventoryAlert.count({ where: { isResolved: false } }),
      this.prisma.inventoryMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { product: { select: { name: true, sku: true } }, warehouse: { select: { name: true } } },
      }),
      this.prisma.purchaseOrder.count({ where: { status: { in: ['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED'] } } }),
    ]);

    return {
      totalProducts,
      outOfStock: outOfStockV2,
      lowStock: lowStockV2,
      pendingAlerts,
      pendingPurchaseOrders: pendingPOs,
      recentMovements,
    };
  }

  async getStocksV2(page = 1, limit = 30, warehouseId?: string, status?: string) {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status as StockStatus;

    const [data, total] = await Promise.all([
      this.prisma.inventoryStock.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          product: {
            select: {
              id: true, name: true, sku: true, basePrice: true, salePrice: true,
              images: { select: { url: true }, take: 1 },
              category: { select: { name: true } },
            },
          },
          warehouse: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.inventoryStock.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async getMovements(page = 1, limit = 30, productId?: string, warehouseId?: string, type?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (type) where.type = type as InventoryMovementType;

    const [data, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { name: true, code: true } },
        },
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async createAdjustment(dto: StockAdjustmentDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: dto.productId } });
      if (!product) throw new BadRequestException('Product not found');

      const warehouse = await tx.warehouse.findUnique({ where: { id: dto.warehouseId } });
      if (!warehouse) throw new BadRequestException('Warehouse not found');

      // Upsert inventory stock
      const variantId = dto.variantId ?? null;
      let stock = await tx.inventoryStock.findUnique({
        where: { warehouseId_productId_variantId: { warehouseId: dto.warehouseId, productId: dto.productId, variantId: variantId as string } },
      });

      if (stock) {
        const newQty = Math.max(0, stock.quantityOnHand + dto.quantity);
        const available = newQty - stock.quantityReserved - stock.quantityDamaged;
        stock = await tx.inventoryStock.update({
          where: { id: stock.id },
          data: {
            quantityOnHand: newQty,
            status: this.resolveStatus(available, stock.lowStockThreshold),
          },
        });
      } else {
        if (dto.quantity < 0) throw new BadRequestException('Cannot reduce stock that does not exist');
        stock = await tx.inventoryStock.create({
          data: {
            warehouseId: dto.warehouseId,
            productId: dto.productId,
            variantId: variantId ?? undefined,
            quantityOnHand: dto.quantity,
            status: dto.quantity > 5 ? StockStatus.IN_STOCK : StockStatus.LOW_STOCK,
          },
        });
      }

      // Keep legacy product.stockQuantity in sync
      await tx.product.update({
        where: { id: dto.productId },
        data: { stockQuantity: { increment: dto.quantity } },
      });

      // Append ledger record
      await tx.inventoryMovement.create({
        data: {
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          variantId: dto.variantId ?? undefined,
          type: dto.quantity >= 0 ? InventoryMovementType.ADJUSTMENT_IN : InventoryMovementType.ADJUSTMENT_OUT,
          quantity: dto.quantity,
          note: dto.note,
          createdBy: userId,
        },
      });

      const adj = await tx.stockAdjustment.create({
        data: {
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          variantId: dto.variantId ?? undefined,
          quantity: dto.quantity,
          reason: dto.reason,
          status: AdjustmentStatus.APPROVED,
          note: dto.note,
          approvedBy: userId,
          createdBy: userId,
        },
      });

      // Auto-alert on low/out-of-stock
      const available = stock.quantityOnHand - stock.quantityReserved - stock.quantityDamaged;
      if (available <= 0) {
        await this.upsertAlert(tx, dto.productId, dto.warehouseId, 'OUT_OF_STOCK', 0, available);
      } else if (available <= stock.lowStockThreshold) {
        await this.upsertAlert(tx, dto.productId, dto.warehouseId, 'LOW_STOCK', stock.lowStockThreshold, available);
      }

      return adj;
    });
  }

  async setStock(dto: SetStockDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: dto.productId } });
      if (!product) throw new BadRequestException('Product not found');

      const variantId = dto.variantId ?? null;
      const existing = await tx.inventoryStock.findUnique({
        where: { warehouseId_productId_variantId: { warehouseId: dto.warehouseId, productId: dto.productId, variantId: variantId as string } },
      });

      const diff = existing ? dto.quantity - existing.quantityOnHand : dto.quantity;

      if (existing) {
        await tx.inventoryStock.update({
          where: { id: existing.id },
          data: {
            quantityOnHand: dto.quantity,
            lowStockThreshold: dto.lowStockThreshold ?? existing.lowStockThreshold,
            status: this.resolveStatus(
              dto.quantity - existing.quantityReserved - existing.quantityDamaged,
              dto.lowStockThreshold ?? existing.lowStockThreshold,
            ),
          },
        });
      } else {
        await tx.inventoryStock.create({
          data: {
            warehouseId: dto.warehouseId,
            productId: dto.productId,
            variantId: variantId ?? undefined,
            quantityOnHand: dto.quantity,
            lowStockThreshold: dto.lowStockThreshold ?? 5,
            status: this.resolveStatus(dto.quantity, dto.lowStockThreshold ?? 5),
          },
        });
      }

      // Sync legacy field
      await tx.product.update({ where: { id: dto.productId }, data: { stockQuantity: dto.quantity } });

      if (diff !== 0) {
        await tx.inventoryMovement.create({
          data: {
            warehouseId: dto.warehouseId,
            productId: dto.productId,
            variantId: dto.variantId ?? undefined,
            type: InventoryMovementType.CORRECTION,
            quantity: diff,
            note: dto.note ?? 'Stock set via admin',
            createdBy: userId,
          },
        });
      }

      return { productId: dto.productId, quantity: dto.quantity };
    });
  }

  async getAlerts(page = 1, limit = 20, resolved = false) {
    const where = { isResolved: resolved };
    const [data, total] = await Promise.all([
      this.prisma.inventoryAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { product: { select: { id: true, name: true, sku: true, images: { take: 1, select: { url: true } } } } },
      }),
      this.prisma.inventoryAlert.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async resolveAlert(id: string) {
    return this.prisma.inventoryAlert.update({
      where: { id },
      data: { isResolved: true, resolvedAt: new Date() },
    });
  }

  async getAdjustments(page = 1, limit = 20, productId?: string) {
    const where: any = productId ? { productId } : {};
    const [data, total] = await Promise.all([
      this.prisma.stockAdjustment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { warehouse: { select: { name: true, code: true } } },
      }),
      this.prisma.stockAdjustment.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  // ─── Stock Reservation (used by Orders module) ───────────────

  async reserveStock(orderId: string, items: { productId: string; variantId?: string; quantity: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      const warehouseId = await this.warehouseService.getOrCreateDefault();

      for (const item of items) {
        const variantId = item.variantId ?? null;
        const stock = await tx.inventoryStock.findUnique({
          where: { warehouseId_productId_variantId: { warehouseId, productId: item.productId, variantId: variantId as string } },
        });

        if (!stock) continue; // Legacy products without v2 stock — skip reservation

        const available = stock.quantityOnHand - stock.quantityReserved - stock.quantityDamaged;
        if (available < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
        }

        // Idempotent: skip if already reserved for this order
        const existing = await tx.stockReservation.findUnique({
          where: { stockId_orderId: { stockId: stock.id, orderId } },
        });
        if (existing) continue;

        await tx.stockReservation.create({
          data: { stockId: stock.id, orderId, quantity: item.quantity },
        });
        await tx.inventoryStock.update({
          where: { id: stock.id },
          data: {
            quantityReserved: { increment: item.quantity },
            status: this.resolveStatus(available - item.quantity, stock.lowStockThreshold),
          },
        });
        await tx.inventoryMovement.create({
          data: {
            warehouseId, productId: item.productId, variantId: variantId ?? undefined,
            type: InventoryMovementType.RESERVED,
            quantity: -item.quantity,
            reference: orderId,
          },
        });
      }
    });
  }

  async confirmReservation(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reservations = await tx.stockReservation.findMany({
        where: { orderId, status: 'ACTIVE' },
        include: { stock: true },
      });

      for (const r of reservations) {
        await tx.stockReservation.update({ where: { id: r.id }, data: { status: 'CONFIRMED' } });
        await tx.inventoryStock.update({
          where: { id: r.stockId },
          data: {
            quantityOnHand: { decrement: r.quantity },
            quantityReserved: { decrement: r.quantity },
          },
        });
        await tx.inventoryMovement.create({
          data: {
            warehouseId: r.stock.warehouseId,
            productId: r.stock.productId,
            variantId: r.stock.variantId ?? undefined,
            type: InventoryMovementType.SALE,
            quantity: -r.quantity,
            reference: orderId,
          },
        });
      }
    });
  }

  async releaseReservation(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reservations = await tx.stockReservation.findMany({
        where: { orderId, status: 'ACTIVE' },
        include: { stock: true },
      });

      for (const r of reservations) {
        await tx.stockReservation.update({ where: { id: r.id }, data: { status: 'RELEASED' } });
        await tx.inventoryStock.update({
          where: { id: r.stockId },
          data: { quantityReserved: { decrement: r.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            warehouseId: r.stock.warehouseId,
            productId: r.stock.productId,
            variantId: r.stock.variantId ?? undefined,
            type: InventoryMovementType.RESERVATION_RELEASED,
            quantity: r.quantity,
            reference: orderId,
          },
        });
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private resolveStatus(available: number, threshold: number): StockStatus {
    if (available <= 0) return StockStatus.OUT_OF_STOCK;
    if (available <= threshold) return StockStatus.LOW_STOCK;
    return StockStatus.IN_STOCK;
  }

  private async upsertAlert(tx: any, productId: string, warehouseId: string, type: string, threshold: number, currentQty: number) {
    const existing = await tx.inventoryAlert.findFirst({
      where: { productId, warehouseId, type, isResolved: false },
    });
    if (!existing) {
      await tx.inventoryAlert.create({
        data: { productId, warehouseId, type: type as any, threshold, currentQty },
      });
    } else {
      await tx.inventoryAlert.update({ where: { id: existing.id }, data: { currentQty } });
    }
  }
}
