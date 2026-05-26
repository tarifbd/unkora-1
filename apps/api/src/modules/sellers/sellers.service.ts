import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SellerStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { status?: SellerStatus; page?: number; limit?: number; search?: string }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { shopName: { contains: params.search, mode: 'insensitive' } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.seller.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          _count: { select: { withdrawals: true } },
        },
      }),
      this.prisma.seller.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        withdrawals: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!seller) throw new NotFoundException('Seller not found');
    return seller;
  }

  async updateStatus(id: string, status: SellerStatus, note?: string) {
    await this.findOne(id);
    return this.prisma.seller.update({ where: { id }, data: { status } });
  }

  async update(id: string, dto: Partial<{
    shopName: string; description: string; logoUrl: string;
    commissionRate: number; isVerified: boolean;
  }>) {
    await this.findOne(id);
    return this.prisma.seller.update({ where: { id }, data: dto as any });
  }

  async getStats() {
    const [total, active, pending, suspended] = await Promise.all([
      this.prisma.seller.count(),
      this.prisma.seller.count({ where: { status: SellerStatus.ACTIVE } }),
      this.prisma.seller.count({ where: { status: SellerStatus.PENDING } }),
      this.prisma.seller.count({ where: { status: SellerStatus.SUSPENDED } }),
    ]);
    const revenue = await this.prisma.seller.aggregate({ _sum: { totalSales: true } });
    return { total, active, pending, suspended, totalRevenue: Number(revenue._sum.totalSales ?? 0) };
  }

  async getWithdrawals(params: { sellerId?: string; status?: string; page?: number }) {
    const page = params.page ?? 1;
    const where: any = {};
    if (params.sellerId) where.sellerId = params.sellerId;
    if (params.status) where.status = params.status;
    const [data, total] = await Promise.all([
      this.prisma.sellerWithdrawal.findMany({
        where, skip: (page - 1) * 20, take: 20,
        orderBy: { createdAt: 'desc' },
        include: { seller: { select: { shopName: true } } },
      }),
      this.prisma.sellerWithdrawal.count({ where }),
    ]);
    return { data, meta: { total, page, limit: 20, totalPages: Math.ceil(total / 20) } };
  }

  async processWithdrawal(id: string, status: string) {
    return this.prisma.sellerWithdrawal.update({
      where: { id },
      data: { status, processedAt: status === 'APPROVED' ? new Date() : null },
    });
  }
}
