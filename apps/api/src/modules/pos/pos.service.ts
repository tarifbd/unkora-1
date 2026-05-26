import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PosService {
  constructor(private readonly prisma: PrismaService) {}

  async openSession(cashierId: string, openingCash = 0) {
    const existing = await this.prisma.posSession.findFirst({
      where: { cashierId, isOpen: true },
    });
    if (existing) throw new BadRequestException('Session already open');
    return this.prisma.posSession.create({
      data: { cashierId, openingCash, isOpen: true },
    });
  }

  async closeSession(sessionId: string, closingCash: number, notes?: string) {
    const session = await this.prisma.posSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (!session.isOpen) throw new BadRequestException('Session already closed');
    return this.prisma.posSession.update({
      where: { id: sessionId },
      data: { isOpen: false, closingCash, closedAt: new Date(), notes },
    });
  }

  async getSessions(params: { cashierId?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = params.cashierId ? { cashierId: params.cashierId } : {};
    const [data, total] = await Promise.all([
      this.prisma.posSession.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { openedAt: 'desc' },
        include: {
          cashier: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.posSession.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createOrder(sessionId: string, dto: {
    customerId?: string;
    paymentMethod: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number; discount?: number }>;
    discount?: number;
    amountPaid: number;
    notes?: string;
  }) {
    const session = await this.prisma.posSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || !session.isOpen) throw new BadRequestException('Invalid or closed session');

    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map(i => i.productId) } },
      select: { id: true, name: true, sku: true, stockQuantity: true },
    });
    const prodMap = new Map(products.map(p => [p.id, p]));

    let subtotal = 0;
    const itemsData = dto.items.map(item => {
      const prod = prodMap.get(item.productId);
      if (!prod) throw new BadRequestException(`Product ${item.productId} not found`);
      const itemDiscount = item.discount ?? 0;
      const totalPrice = (item.unitPrice - itemDiscount) * item.quantity;
      subtotal += totalPrice;
      return {
        productId: item.productId,
        productName: prod.name,
        sku: prod.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: itemDiscount,
        totalPrice,
      };
    });

    const orderDiscount = dto.discount ?? 0;
    const total = subtotal - orderDiscount;
    const change = dto.amountPaid - total;
    const orderNumber = `POS-${Date.now()}`;

    const order = await this.prisma.$transaction(async tx => {
      const o = await tx.posOrder.create({
        data: {
          sessionId,
          customerId: dto.customerId,
          orderNumber,
          paymentMethod: dto.paymentMethod as any,
          subtotal,
          discount: orderDiscount,
          total,
          amountPaid: dto.amountPaid,
          change: Math.max(0, change),
          notes: dto.notes,
          status: 'COMPLETED',
          items: { create: itemsData },
        },
        include: { items: true },
      });

      await tx.posSession.update({
        where: { id: sessionId },
        data: { totalSales: { increment: total }, totalOrders: { increment: 1 } },
      });

      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      return o;
    });

    return order;
  }

  getSessionOrders(sessionId: string) {
    return this.prisma.posOrder.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      include: { items: true, customer: { select: { id: true, firstName: true, lastName: true, phone: true } } },
    });
  }

  getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.prisma.$transaction(async tx => {
      const [todaySales, openSessions, totalOrders] = await Promise.all([
        tx.posOrder.aggregate({
          where: { createdAt: { gte: today }, status: 'COMPLETED' },
          _sum: { total: true },
          _count: { id: true },
        }),
        tx.posSession.count({ where: { isOpen: true } }),
        tx.posOrder.count(),
      ]);
      return {
        todaySales: Number(todaySales._sum.total ?? 0),
        todayOrders: todaySales._count.id,
        openSessions,
        totalOrders,
      };
    });
  }
}
