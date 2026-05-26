import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CodReconciliationService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { provider?: string; reconciled?: string; page?: number; limit?: number }) {
    const { provider, reconciled, page = 1, limit = 20 } = params;

    const where: any = {
      status: 'DELIVERED',
      codAmount: { gt: 0 },
    };
    if (provider) where.provider = provider;
    if (reconciled === 'true') where.codReconciled = true;
    if (reconciled === 'false') where.codReconciled = false;

    const [data, total] = await Promise.all([
      this.prisma.courierShipment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              total: true,
              user: { select: { id: true, firstName: true, lastName: true, phone: true } },
            },
          },
        },
        orderBy: { deliveredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.courierShipment.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getStats() {
    const [allCod, reconciledCod] = await Promise.all([
      this.prisma.courierShipment.aggregate({
        where: { status: 'DELIVERED', codAmount: { gt: 0 } },
        _sum: { codAmount: true },
        _count: { id: true },
      }),
      this.prisma.courierShipment.aggregate({
        where: { status: 'DELIVERED', codAmount: { gt: 0 }, codReconciled: true },
        _sum: { codAmount: true },
        _count: { id: true },
      }),
    ]);

    const total = Number(allCod._sum.codAmount ?? 0);
    const reconciled = Number(reconciledCod._sum.codAmount ?? 0);

    return {
      totalCod: total,
      reconciled,
      pending: total - reconciled,
      totalShipments: allCod._count.id,
      reconciledShipments: reconciledCod._count.id,
      pendingShipments: allCod._count.id - reconciledCod._count.id,
    };
  }

  async getSummaryByProvider() {
    const groups = await this.prisma.courierShipment.groupBy({
      by: ['provider'],
      where: { status: 'DELIVERED', codAmount: { gt: 0 } },
      _sum: { codAmount: true },
      _count: { id: true },
    });

    const reconciledGroups = await this.prisma.courierShipment.groupBy({
      by: ['provider'],
      where: { status: 'DELIVERED', codAmount: { gt: 0 }, codReconciled: true },
      _sum: { codAmount: true },
      _count: { id: true },
    });

    const reconciledMap = new Map(reconciledGroups.map(g => [g.provider, g]));

    return groups.map(g => {
      const rec = reconciledMap.get(g.provider);
      const totalCod = Number(g._sum.codAmount ?? 0);
      const reconciledCod = Number(rec?._sum.codAmount ?? 0);
      return {
        provider: g.provider,
        count: g._count.id,
        totalCod,
        reconciledCod,
        pendingCod: totalCod - reconciledCod,
      };
    });
  }

  async reconcile(id: string, dto: { codNotes?: string }, adminId: string) {
    const shipment = await this.prisma.courierShipment.findUnique({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (shipment.codReconciled) return shipment;

    return this.prisma.courierShipment.update({
      where: { id },
      data: {
        codReconciled: true,
        codReceivedAt: new Date(),
        codReceivedBy: adminId,
        codNotes: dto.codNotes,
      },
      include: { order: { select: { orderNumber: true } } },
    });
  }

  async unreconcile(id: string) {
    const shipment = await this.prisma.courierShipment.findUnique({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');

    return this.prisma.courierShipment.update({
      where: { id },
      data: { codReconciled: false, codReceivedAt: null, codReceivedBy: null },
    });
  }
}
