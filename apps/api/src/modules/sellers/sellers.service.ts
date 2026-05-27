import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SellerStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { ApplySellerDto } from './dto/apply-seller.dto';
import type { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import type { RequestWithdrawalDto } from './dto/request-withdrawal.dto';

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── ADMIN METHODS ────────────────────────────────────────────

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

  async updateStatus(id: string, status: SellerStatus) {
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

  // ─── SELLER-FACING METHODS ────────────────────────────────────

  /** Apply to become a seller */
  async apply(userId: string, dto: ApplySellerDto) {
    const existing = await this.prisma.seller.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('You already have a seller profile');

    const slugTaken = await this.prisma.seller.findUnique({ where: { shopSlug: dto.shopSlug } });
    if (slugTaken) throw new ConflictException('This shop slug is already taken');

    return this.prisma.seller.create({
      data: {
        userId,
        shopName: dto.shopName,
        shopSlug: dto.shopSlug,
        description: dto.description,
        phone: dto.phone,
        address: dto.address,
        nidNumber: dto.nidNumber,
        bankAccount: dto.bankAccount,
        bankName: dto.bankName,
        status: SellerStatus.PENDING,
      },
    });
  }

  /** Get own seller profile (by userId) */
  async findMe(userId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });
    if (!seller) throw new NotFoundException('Seller profile not found. Please apply first.');
    return seller;
  }

  /** Check if user has a seller profile (no throw) */
  async findMeOptional(userId: string) {
    return this.prisma.seller.findUnique({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  /** Update own shop profile */
  async updateMe(userId: string, dto: UpdateSellerProfileDto) {
    const seller = await this.findMe(userId);
    return this.prisma.seller.update({
      where: { id: seller.id },
      data: dto,
    });
  }

  /** My submitted books (all statuses) */
  async mySubmissions(userId: string, page = 1) {
    const [data, total] = await Promise.all([
      this.prisma.bookSubmission.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true, name: true, slug: true, stockQuantity: true, isActive: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * 20,
        take: 20,
      }),
      this.prisma.bookSubmission.count({ where: { userId } }),
    ]);
    return { data, meta: { total, page, totalPages: Math.ceil(total / 20) } };
  }

  /** Orders for seller's approved products */
  async myOrders(userId: string, page = 1) {
    // Get productIds from approved submissions
    const submissions = await this.prisma.bookSubmission.findMany({
      where: { userId, productId: { not: null } },
      select: { productId: true },
    });
    const productIds = submissions.map(s => s.productId!).filter(Boolean);

    if (productIds.length === 0) {
      return { data: [], meta: { total: 0, page, totalPages: 0 } };
    }

    const [data, total] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: { productId: { in: productIds } },
        include: {
          order: {
            select: {
              id: true, orderNumber: true, status: true, createdAt: true,
              shippingAddress: true,
              user: { select: { firstName: true, lastName: true, phone: true } },
            },
          },
          product: {
            select: {
              id: true, name: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
        orderBy: { order: { createdAt: 'desc' } },
        skip: (page - 1) * 20,
        take: 20,
      }),
      this.prisma.orderItem.count({ where: { productId: { in: productIds } } }),
    ]);

    return { data, meta: { total, page, totalPages: Math.ceil(total / 20) } };
  }

  /** Earnings breakdown */
  async myEarnings(userId: string) {
    const seller = await this.findMe(userId);

    const submissions = await this.prisma.bookSubmission.findMany({
      where: { userId, productId: { not: null } },
      select: { productId: true },
    });
    const productIds = submissions.map(s => s.productId!).filter(Boolean);

    let totalGross = 0;
    let deliveredOrders = 0;
    let pendingOrders = 0;

    if (productIds.length > 0) {
      const [deliveredItems, allItems] = await Promise.all([
        this.prisma.orderItem.findMany({
          where: { productId: { in: productIds }, order: { status: 'DELIVERED' } },
          select: { totalPrice: true },
        }),
        this.prisma.orderItem.count({ where: { productId: { in: productIds } } }),
      ]);

      totalGross = deliveredItems.reduce((sum, i) => sum + Number(i.totalPrice), 0);
      deliveredOrders = deliveredItems.length;
      pendingOrders = allItems - deliveredItems.length;
    }

    const commissionRate = Number(seller.commissionRate);
    const totalEarned = (totalGross * commissionRate) / 100;

    const [approvedWd, pendingWd] = await Promise.all([
      this.prisma.sellerWithdrawal.aggregate({
        where: { sellerId: seller.id, status: 'APPROVED' },
        _sum: { amount: true },
      }),
      this.prisma.sellerWithdrawal.aggregate({
        where: { sellerId: seller.id, status: 'PENDING' },
        _sum: { amount: true },
      }),
    ]);

    const withdrawn = Number(approvedWd._sum.amount ?? 0);
    const pendingWithdrawal = Number(pendingWd._sum.amount ?? 0);
    const available = Math.max(0, totalEarned - withdrawn - pendingWithdrawal);

    return {
      commissionRate,
      totalGross,
      totalEarned,
      withdrawn,
      pendingWithdrawal,
      available,
      deliveredOrders,
      pendingOrders,
      totalProducts: productIds.length,
    };
  }

  /** Own withdrawals */
  async myWithdrawals(userId: string, page = 1) {
    const seller = await this.findMe(userId);
    const [data, total] = await Promise.all([
      this.prisma.sellerWithdrawal.findMany({
        where: { sellerId: seller.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * 20,
        take: 20,
      }),
      this.prisma.sellerWithdrawal.count({ where: { sellerId: seller.id } }),
    ]);
    return { data, meta: { total, page, totalPages: Math.ceil(total / 20) } };
  }

  /** Request a withdrawal */
  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto) {
    const seller = await this.findMe(userId);
    if (seller.status !== SellerStatus.ACTIVE) {
      throw new BadRequestException('Your seller account must be active to request withdrawals');
    }

    const earnings = await this.myEarnings(userId);
    if (dto.amount > earnings.available) {
      throw new BadRequestException(`Insufficient balance. Available: ৳${earnings.available.toFixed(2)}`);
    }

    return this.prisma.sellerWithdrawal.create({
      data: {
        sellerId: seller.id,
        amount: dto.amount,
        method: dto.method,
        note: dto.note,
        status: 'PENDING',
      },
    });
  }
}
