import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const db = (prisma: PrismaService) => (prisma as any);

@Injectable()
export class ReturnsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { status?: string; type?: string; page?: number; limit?: number }) {
    const { status, type, page = 1, limit = 20 } = params;
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (type && type !== 'ALL') where.type = type;

    const [data, total] = await Promise.all([
      db(this.prisma).return.findMany({
        where,
        include: {
          order: { select: { id: true, orderNumber: true, status: true, total: true, createdAt: true } },
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db(this.prisma).return.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getStats() {
    const statuses = ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'INSPECTED', 'REFUNDED', 'EXCHANGED', 'CLOSED'];
    const counts = await Promise.all(
      statuses.map(s => db(this.prisma).return.count({ where: { status: s } }))
    );
    const total = await db(this.prisma).return.count();

    const result: Record<string, number> = { total };
    statuses.forEach((s, i) => { result[s.toLowerCase()] = counts[i]; });
    return result;
  }

  async findOne(id: string) {
    const ret = await db(this.prisma).return.findUnique({
      where: { id },
      include: {
        order: { select: { id: true, orderNumber: true, status: true, total: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true, basePrice: true } } } },
      },
    });
    if (!ret) throw new NotFoundException('Return request not found');
    return ret;
  }

  async create(dto: {
    orderId: string;
    userId: string;
    type: string;
    reason: string;
    reasonDetail?: string;
    items: { productId: string; productName: string; sku?: string; quantity: number; unitPrice: number; condition?: string }[];
  }) {
    return db(this.prisma).return.create({
      data: {
        orderId: dto.orderId,
        userId: dto.userId,
        type: dto.type,
        reason: dto.reason,
        reasonDetail: dto.reasonDetail,
        items: {
          create: dto.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            condition: item.condition ?? 'UNKNOWN',
          })),
        },
      },
      include: { items: true },
    });
  }

  async updateStatus(id: string, dto: { status: string; adminNote?: string; refundAmount?: number }, adminId: string) {
    const ret = await db(this.prisma).return.findUnique({ where: { id } });
    if (!ret) throw new NotFoundException('Return request not found');

    const terminalStatuses = ['REJECTED', 'REFUNDED', 'EXCHANGED', 'CLOSED'];
    const isTerminal = terminalStatuses.includes(dto.status);

    return db(this.prisma).return.update({
      where: { id },
      data: {
        status: dto.status,
        adminNote: dto.adminNote,
        refundAmount: dto.refundAmount,
        ...(isTerminal && { resolvedAt: new Date(), resolvedBy: adminId }),
      },
      include: {
        order: { select: { id: true, orderNumber: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: true,
      },
    });
  }
}
