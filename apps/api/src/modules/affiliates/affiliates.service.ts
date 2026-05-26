import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AffiliatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAffiliates(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      (this.prisma as any).affiliate.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        },
      }),
      (this.prisma as any).affiliate.count(),
    ]);
    return { data, total, page, limit };
  }

  async getStats() {
    const [totalAffiliates, affiliateAggr] = await Promise.all([
      (this.prisma as any).affiliate.count(),
      (this.prisma as any).affiliate.aggregate({
        _sum: { totalClicks: true, totalOrders: true, totalEarned: true },
      }),
    ]);
    return {
      totalAffiliates,
      totalClicks: affiliateAggr._sum.totalClicks ?? 0,
      totalOrders: affiliateAggr._sum.totalOrders ?? 0,
      totalEarnings: affiliateAggr._sum.totalEarned ?? 0,
    };
  }

  async createAffiliate(data: { userId: string; commissionRate?: number; code: string }) {
    return (this.prisma as any).affiliate.create({ data });
  }

  async updateAffiliate(id: string, data: Partial<{ commissionRate: number; status: string }>) {
    const existing = await (this.prisma as any).affiliate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Affiliate not found');
    return (this.prisma as any).affiliate.update({ where: { id }, data });
  }

  async getPayouts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      (this.prisma as any).affiliatePayout.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          affiliate: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
      (this.prisma as any).affiliatePayout.count(),
    ]);
    return { data, total, page, limit };
  }

  async updatePayout(id: string, data: { status: string }) {
    const existing = await (this.prisma as any).affiliatePayout.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Payout not found');
    const updateData: any = { status: data.status };
    if (data.status === 'PROCESSED') {
      updateData.processedAt = new Date();
    }
    return (this.prisma as any).affiliatePayout.update({ where: { id }, data: updateData });
  }
}
