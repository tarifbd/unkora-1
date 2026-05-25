import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

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

    // Send low stock alert if below threshold
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
}
