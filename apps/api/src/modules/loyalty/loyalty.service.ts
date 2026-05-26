import { Injectable, NotFoundException } from '@nestjs/common';
import { PointTransactionType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { UpdateLoyaltyConfigDto } from './dto/update-loyalty-config.dto';
import type { AdjustPointsDto } from './dto/adjust-points.dto';

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig() {
    let config = await this.prisma.loyaltyConfig.findFirst();
    if (!config) {
      config = await this.prisma.loyaltyConfig.create({ data: {} });
    }
    return config;
  }

  async updateConfig(dto: UpdateLoyaltyConfigDto) {
    let config = await this.prisma.loyaltyConfig.findFirst();
    if (!config) {
      config = await this.prisma.loyaltyConfig.create({ data: {} });
    }
    return this.prisma.loyaltyConfig.update({
      where: { id: config.id },
      data: {
        pointsPerTaka: dto.pointsPerTaka,
        pointValue: dto.pointValue,
        minRedeemPoints: dto.minRedeemPoints,
        maxRedeemPercent: dto.maxRedeemPercent,
        expiryDays: dto.expiryDays,
        isActive: dto.isActive,
      },
    });
  }

  async getTransactions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.pointTransaction.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.pointTransaction.count(),
    ]);
    return { data, total, page, limit };
  }

  async getUserPoints(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, pointBalance: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const transactions = await this.prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { user, transactions };
  }

  async adminAdjust(dto: AdjustPointsDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const newBalance = user.pointBalance + dto.points;
    const [transaction] = await this.prisma.$transaction([
      this.prisma.pointTransaction.create({
        data: {
          userId: dto.userId,
          type: PointTransactionType.ADJUSTED,
          points: dto.points,
          balance: newBalance,
          description: dto.description ?? 'Manual adjustment',
        },
      }),
      this.prisma.user.update({
        where: { id: dto.userId },
        data: { pointBalance: newBalance },
      }),
    ]);
    return transaction;
  }

  async getStats() {
    const [issued, redeemed] = await Promise.all([
      this.prisma.pointTransaction.aggregate({
        where: { type: { in: [PointTransactionType.EARNED, PointTransactionType.BONUS, PointTransactionType.REFERRAL] } },
        _sum: { points: true },
      }),
      this.prisma.pointTransaction.aggregate({
        where: { type: PointTransactionType.REDEEMED },
        _sum: { points: true },
      }),
    ]);
    const totalIssued = issued._sum.points ?? 0;
    const totalRedeemed = Math.abs(redeemed._sum.points ?? 0);
    return {
      totalIssued,
      totalRedeemed,
      outstanding: totalIssued - totalRedeemed,
    };
  }
}
