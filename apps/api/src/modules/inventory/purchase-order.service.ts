import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto } from './dto/purchase-order.dto';
import { InventoryMovementType, PurchaseOrderStatus, StockStatus } from '@prisma/client';

@Injectable()
export class PurchaseOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, status?: string) {
    const where = status ? { status: status as PurchaseOrderStatus } : {};
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          supplier: { select: { name: true, code: true } },
          warehouse: { select: { name: true, code: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            purchaseOrder: false,
          },
        },
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async create(dto: CreatePurchaseOrderDto, userId: string) {
    const subtotal = dto.items.reduce((s, i) => s + i.unitCost * i.quantityOrdered, 0);
    const poNumber = `PO-${Date.now()}`;

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: dto.supplierId,
        warehouseId: dto.warehouseId,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
        notes: dto.notes,
        subtotal,
        total: subtotal,
        createdBy: userId,
        items: {
          create: dto.items.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            quantityOrdered: i.quantityOrdered,
            quantityReceived: 0,
            unitCost: i.unitCost,
            totalCost: i.unitCost * i.quantityOrdered,
            note: i.note,
          })),
        },
      },
      include: { items: true, supplier: true, warehouse: true },
    });
  }

  async markOrdered(id: string) {
    const po = await this.findOne(id);
    if (po.status !== PurchaseOrderStatus.DRAFT) throw new BadRequestException('PO must be in DRAFT status');
    return this.prisma.purchaseOrder.update({ where: { id }, data: { status: PurchaseOrderStatus.ORDERED } });
  }

  async receive(id: string, dto: ReceivePurchaseOrderDto, userId: string) {
    const po = await this.findOne(id);
    if (po.status === PurchaseOrderStatus.RECEIVED || po.status === PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException('This PO cannot receive more goods');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const recv of dto.items) {
        const item = po.items.find(i => i.id === recv.itemId);
        if (!item) continue;
        if (recv.quantityReceived <= 0) continue;

        const newReceived = item.quantityReceived + recv.quantityReceived;
        if (newReceived > item.quantityOrdered) throw new BadRequestException(`Cannot receive more than ordered for item ${item.id}`);

        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { quantityReceived: newReceived },
        });

        // Upsert inventory stock
        const existing = await tx.inventoryStock.findUnique({
          where: {
            warehouseId_productId_variantId: {
              warehouseId: po.warehouseId,
              productId: item.productId,
              variantId: (item.variantId ?? null) as string,
            },
          },
        });

        if (existing) {
          const newQty = existing.quantityOnHand + recv.quantityReceived;
          const available = newQty - existing.quantityReserved - existing.quantityDamaged;
          await tx.inventoryStock.update({
            where: { id: existing.id },
            data: {
              quantityOnHand: newQty,
              status: this.resolveStatus(available, existing.lowStockThreshold),
            },
          });
        } else {
          await tx.inventoryStock.create({
            data: {
              warehouseId: po.warehouseId,
              productId: item.productId,
              variantId: item.variantId ?? undefined,
              quantityOnHand: recv.quantityReceived,
              status: recv.quantityReceived > 5 ? StockStatus.IN_STOCK : StockStatus.LOW_STOCK,
            },
          });
        }

        // Update product.stockQuantity for legacy compatibility
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: recv.quantityReceived } },
        });

        // Append movement ledger
        await tx.inventoryMovement.create({
          data: {
            warehouseId: po.warehouseId,
            productId: item.productId,
            variantId: item.variantId ?? undefined,
            type: InventoryMovementType.PURCHASE,
            quantity: recv.quantityReceived,
            reference: po.id,
            note: dto.notes,
            createdBy: userId,
          },
        });
      }

      // Recalculate PO status
      const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
      const allReceived = updatedItems.every(i => i.quantityReceived >= i.quantityOrdered);
      const anyReceived = updatedItems.some(i => i.quantityReceived > 0);
      const newStatus = allReceived
        ? PurchaseOrderStatus.RECEIVED
        : anyReceived
        ? PurchaseOrderStatus.PARTIALLY_RECEIVED
        : po.status;

      return tx.purchaseOrder.update({
        where: { id },
        data: { status: newStatus, receivedAt: allReceived ? new Date() : undefined },
        include: { items: true, supplier: true },
      });
    });
  }

  async cancel(id: string) {
    const po = await this.findOne(id);
    if (po.status === PurchaseOrderStatus.RECEIVED) throw new BadRequestException('Cannot cancel a received PO');
    return this.prisma.purchaseOrder.update({ where: { id }, data: { status: PurchaseOrderStatus.CANCELLED } });
  }

  private resolveStatus(available: number, threshold: number): StockStatus {
    if (available <= 0) return StockStatus.OUT_OF_STOCK;
    if (available <= threshold) return StockStatus.LOW_STOCK;
    return StockStatus.IN_STOCK;
  }
}
