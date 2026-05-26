import { Injectable, NotFoundException } from '@nestjs/common';
import { CourierProvider } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CourierService {
  constructor(private readonly prisma: PrismaService) {}

  async createShipment(orderId: string, dto: {
    provider: CourierProvider;
    weight?: number;
    codAmount?: number;
    charge?: number;
  }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.courierShipment.create({
      data: {
        orderId,
        provider: dto.provider,
        weight: dto.weight,
        codAmount: dto.codAmount,
        charge: dto.charge,
      },
    });
  }

  async updateShipment(id: string, dto: {
    consignmentId?: string;
    trackingCode?: string;
    status?: string;
    charge?: number;
  }) {
    return this.prisma.courierShipment.update({
      where: { id },
      data: dto as any,
    });
  }

  async findAll(params: { provider?: CourierProvider; status?: string; page?: number }) {
    const page = params.page ?? 1;
    const where: any = {};
    if (params.provider) where.provider = params.provider;
    if (params.status) where.status = params.status;

    const [data, total] = await Promise.all([
      this.prisma.courierShipment.findMany({
        where, skip: (page - 1) * 20, take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
              user: { select: { firstName: true, lastName: true, phone: true } },
              shippingAddress: true,
            },
          },
        },
      }),
      this.prisma.courierShipment.count({ where }),
    ]);
    return { data, meta: { total, page, limit: 20, totalPages: Math.ceil(total / 20) } };
  }

  async findOne(id: string) {
    const s = await this.prisma.courierShipment.findUnique({
      where: { id },
      include: { order: { include: { user: { select: { id: true, firstName: true, lastName: true, phone: true } } } } },
    });
    if (!s) throw new NotFoundException('Shipment not found');
    return s;
  }

  async getStats() {
    const providers = Object.values(CourierProvider);
    const counts = await Promise.all(
      providers.map(p => this.prisma.courierShipment.count({ where: { provider: p } }).then(c => ({ provider: p, count: c }))),
    );
    const statusCounts = await this.prisma.courierShipment.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    return { byProvider: counts, byStatus: statusCounts };
  }

  async getByCodPending() {
    return this.prisma.courierShipment.findMany({
      where: { codAmount: { gt: 0 }, status: { not: 'DELIVERED' } },
      include: { order: { select: { orderNumber: true, total: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
