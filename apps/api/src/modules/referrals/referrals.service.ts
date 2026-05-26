import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  async adminFindAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.referral.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          referredUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          referrer: { select: { id: true, firstName: true, lastName: true, email: true } },
          referralCode: { select: { code: true } },
        },
      }),
      this.prisma.referral.count(),
    ]);
    return { data, total, page, limit };
  }

  async adminStats() {
    const [total, paid, unpaid, rewardAgg] = await Promise.all([
      this.prisma.referral.count(),
      this.prisma.referral.count({ where: { isPaid: true } }),
      this.prisma.referral.count({ where: { isPaid: false } }),
      this.prisma.referral.aggregate({ _sum: { rewardAmount: true } }),
    ]);
    return {
      total,
      paid,
      unpaid,
      totalRewards: rewardAgg._sum.rewardAmount ?? 0,
    };
  }

  async markPaid(id: string) {
    const referral = await this.prisma.referral.findUnique({ where: { id } });
    if (!referral) throw new NotFoundException('Referral not found');
    return this.prisma.referral.update({
      where: { id },
      data: { isPaid: true, paidAt: new Date() },
    });
  }

  async getMyReferral(userId: string) {
    let referralCode = await this.prisma.referralCode.findUnique({
      where: { userId },
      include: { referrals: { orderBy: { createdAt: 'desc' } } },
    });

    if (!referralCode) {
      // Auto-generate a code for the user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      if (!user) throw new NotFoundException('User not found');

      const baseCode = `${user.firstName.toUpperCase().slice(0, 4)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      referralCode = await this.prisma.referralCode.create({
        data: { userId, code: baseCode },
        include: { referrals: true },
      });
    }

    return referralCode;
  }
}
