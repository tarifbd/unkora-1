import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PreordersService {
  constructor(private readonly prisma: PrismaService) {}

  // Admin: configure preorder for a product
  async configure(productId: string, dto: {
    prepaymentPct?: number;
    finalPaymentDueDate?: string;
    expectedDelivery?: string;
    stockLimit?: number;
    isActive?: boolean;
  }) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await (this.prisma as any).preorder.findUnique({ where: { productId } });
    if (existing) {
      return (this.prisma as any).preorder.update({
        where: { productId },
        data: {
          prepaymentPct: dto.prepaymentPct ?? existing.prepaymentPct,
          finalPaymentDueDate: dto.finalPaymentDueDate ? new Date(dto.finalPaymentDueDate) : existing.finalPaymentDueDate,
          expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : existing.expectedDelivery,
          stockLimit: dto.stockLimit,
          isActive: dto.isActive ?? existing.isActive,
        },
        include: { product: { select: { id: true, name: true, slug: true } } },
      });
    }

    return (this.prisma as any).preorder.create({
      data: {
        productId,
        prepaymentPct: dto.prepaymentPct ?? 30,
        finalPaymentDueDate: dto.finalPaymentDueDate ? new Date(dto.finalPaymentDueDate) : null,
        expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : null,
        stockLimit: dto.stockLimit,
        isActive: dto.isActive ?? true,
      },
      include: { product: { select: { id: true, name: true, slug: true } } },
    });
  }

  async findAll(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      (this.prisma as any).preorder.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: { product: { select: { id: true, name: true, slug: true, basePrice: true } }, _count: { select: { orders: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).preorder.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findByProductId(productId: string) {
    const preorder = await (this.prisma as any).preorder.findUnique({
      where: { productId },
      include: { product: { select: { id: true, name: true, slug: true, images: { take: 1 } } } },
    });
    if (!preorder) throw new NotFoundException('No preorder configured for this product');
    return preorder;
  }

  async placePreorder(userId: string, productId: string, orderId: string) {
    const preorder = await (this.prisma as any).preorder.findUnique({ where: { productId } });
    if (!preorder || !preorder.isActive) throw new BadRequestException('Preorder not available for this product');

    if (preorder.stockLimit) {
      const count = await (this.prisma as any).preorderOrder.count({ where: { preorderId: preorder.id } });
      if (count >= preorder.stockLimit) throw new BadRequestException('Preorder stock limit reached');
    }

    return (this.prisma as any).preorderOrder.create({
      data: { preorderId: preorder.id, orderId, prepaymentPaid: false, finalPaid: false },
    });
  }

  async myPreorders(userId: string) {
    // Get all orders by this user that have preorder records
    const orders = await this.prisma.order.findMany({
      where: { userId },
      select: { id: true },
    });
    const orderIds = orders.map(o => o.id);

    const preorderOrders = await (this.prisma as any).preorderOrder.findMany({
      where: { orderId: { in: orderIds } },
      include: {
        preorder: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, basePrice: true, salePrice: true, images: { take: 1 } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: preorderOrders };
  }

  async markPrepaymentPaid(preorderOrderId: string) {
    return (this.prisma as any).preorderOrder.update({
      where: { id: preorderOrderId },
      data: { prepaymentPaid: true, prepaymentAt: new Date() },
    });
  }

  async markFinalPaid(preorderOrderId: string) {
    return (this.prisma as any).preorderOrder.update({
      where: { id: preorderOrderId },
      data: { finalPaid: true, finalPaymentAt: new Date() },
    });
  }

  async disable(productId: string) {
    return (this.prisma as any).preorder.update({ where: { productId }, data: { isActive: false } });
  }

  async delete(productId: string) {
    return (this.prisma as any).preorder.delete({ where: { productId } });
  }
}
