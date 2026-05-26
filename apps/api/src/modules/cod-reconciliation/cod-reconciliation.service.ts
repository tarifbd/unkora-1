import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CodReconciliationService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { provider?: string; page?: number; limit?: number }) {
    const { provider, page = 1, limit = 20 } = params;

    const where: any = {
      status: 'DELIVERED',
      codAmount: { gt: 0 },
    };
    if (provider) where.provider = provider;

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
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { deliveredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.courierShipment.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async getStats() {
    const allDelivered = await this.prisma.courierShipment.findMany({
      where: {
        status: 'DELIVERED',
        codAmount: { gt: 0 },
      },
      select: { codAmount: true },
    });

    const totalCod = allDelivered.reduce(
      (sum, s) => sum + Number(s.codAmount ?? 0),
      0,
    );

    return {
      totalCodCollected: totalCod,
      totalShipments: allDelivered.length,
      pending: totalCod,
      reconciled: 0,
    };
  }

  async getSummaryByProvider() {
    const groups = await this.prisma.courierShipment.groupBy({
      by: ['provider'],
      where: {
        status: 'DELIVERED',
        codAmount: { gt: 0 },
      },
      _sum: { codAmount: true },
      _count: { id: true },
    });

    return groups.map((g) => ({
      provider: g.provider,
      count: g._count.id,
      totalCod: Number(g._sum.codAmount ?? 0),
    }));
  }
}
