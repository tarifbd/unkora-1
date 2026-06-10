import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import * as argon2 from 'argon2';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalRevenue,
      monthRevenue,
      todayRevenue,
      totalOrders,
      pendingOrders,
      totalProducts,
      lowStockProducts,
      totalCustomers,
      newCustomersThisMonth,
      recentOrders,
      topProducts,
      totalCategories,
      orderStatusCounts,
      paymentMethodCounts,
      abandonedCarts,
    ] = await Promise.all([
      this.prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { total: true } }),
      this.prisma.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: startOfMonth } }, _sum: { total: true } }),
      this.prisma.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: startOfToday } }, _sum: { total: true } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({ where: { isActive: true, stockQuantity: { lte: 5 } } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: startOfMonth } } }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 5,
      }),
      this.prisma.category.count({ where: { isActive: true } }),
      Promise.all(
        ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map(status =>
          this.prisma.order.count({ where: { status: status as any } }).then(count => ({ status, count })),
        ),
      ),
      this.prisma.order.groupBy({
        by: ['paymentMethod'],
        _count: { id: true },
      }),
      this.prisma.cart.count({
        where: {
          userId: { not: null },
          updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          items: { some: {} },
        },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    orderStatusCounts.forEach(({ status, count }) => { byStatus[status] = count; });

    const byPayment: Record<string, number> = {};
    paymentMethodCounts.forEach(r => { byPayment[r.paymentMethod] = r._count.id; });

    return {
      revenue: {
        total: Number(totalRevenue._sum.total ?? 0),
        thisMonth: Number(monthRevenue._sum.total ?? 0),
        today: Number(todayRevenue._sum.total ?? 0),
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        byStatus,
        byPayment,
        abandonedCarts,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
      },
      customers: {
        total: totalCustomers,
        newThisMonth: newCustomersThisMonth,
      },
      categories: {
        total: totalCategories,
      },
      recentOrders,
      topProducts,
    };
  }

  async getRevenueChart(days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: { paymentStatus: 'PAID', createdAt: { gte: from } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const chart: Record<string, number> = {};
    orders.forEach((o) => {
      const key = o.createdAt.toISOString().split('T')[0]!;
      chart[key] = (chart[key] ?? 0) + Number(o.total);
    });

    return Object.entries(chart).map(([date, revenue]) => ({ date, revenue }));
  }

  async getUsers(params: { page?: number; limit?: number; search?: string; role?: string; status?: string }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.role) where.role = params.role;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          phone: true, role: true, status: true, createdAt: true,
          _count: { select: { orders: true, address: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getUserById(id: string) {
    const [user, orders, ltv] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id },
        include: {
          address: true,
          profile: true,
          _count: { select: { orders: true, reviews: true, wishlists: true } },
        },
      }),
      this.prisma.order.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true, orderNumber: true, status: true, paymentStatus: true,
          total: true, createdAt: true, paymentMethod: true,
          items: { select: { productName: true, quantity: true } },
        },
      }),
      this.prisma.order.aggregate({
        where: { userId: id, paymentStatus: 'PAID' },
        _sum: { total: true },
        _count: { id: true },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');

    const { passwordHash: _, ...safeUser } = user;
    return {
      ...safeUser,
      recentOrders: orders,
      lifetimeValue: Number(ltv._sum.total ?? 0),
      paidOrderCount: ltv._count.id,
    };
  }

  async updateUser(id: string, dto: { role?: string; status?: string }) {
    return this.prisma.user.update({
      where: { id },
      data: dto as any,
      select: { id: true, email: true, role: true, status: true },
    });
  }

  async createUser(dto: { email: string; firstName: string; lastName: string; phone?: string; password: string; role?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone ?? null,
        role: (dto.role as any) ?? 'CUSTOMER',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, createdAt: true },
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' },
      select: { id: true },
    });
  }

  async getOrdersByStatus() {
    const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    const counts = await Promise.all(
      statuses.map(status =>
        this.prisma.order.count({ where: { status: status as any } }).then(count => ({ status, count })),
      ),
    );
    return counts;
  }

  async getCategorySales() {
    const result = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 50,
    });

    const productIds = result.map(r => r.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, category: { select: { name: true } } },
    });
    const catMap = new Map<string, string>(products.map(p => [p.id, p.category?.name ?? 'Unknown']));
    const catSales: Record<string, number> = {};
    result.forEach(r => {
      const cat = catMap.get(r.productId) ?? 'Unknown';
      catSales[cat] = (catSales[cat] ?? 0) + Number(r._sum.totalPrice ?? 0);
    });
    return Object.entries(catSales)
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }

  async exportOrdersCsv(startDate?: string, endDate?: string): Promise<string> {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: { select: { email: true, firstName: true, lastName: true, phone: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const rows = [
      ['Order Number', 'Date', 'Customer Name', 'Email', 'Phone', 'Items', 'Subtotal', 'Shipping', 'Discount', 'Total', 'Status', 'Payment Method'].join(','),
      ...orders.map((o: any) => [
        o.orderNumber,
        o.createdAt.toISOString().slice(0, 10),
        `"${o.user.firstName} ${o.user.lastName}"`,
        o.user.email,
        o.user.phone ?? '',
        o.items.length,
        o.subtotal,
        o.shippingCost,
        o.discount,
        o.total,
        o.status,
        o.paymentMethod,
      ].join(',')),
    ];

    return rows.join('\n');
  }

  async exportCustomersCsv(): Promise<string> {
    const users = await this.prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const rows = [
      ['Name', 'Email', 'Phone', 'Status', 'Orders', 'Joined', 'Email Verified'].join(','),
      ...users.map((u: any) => [
        `"${u.firstName} ${u.lastName}"`,
        u.email,
        u.phone ?? '',
        u.status,
        u._count.orders,
        u.createdAt.toISOString().slice(0, 10),
        u.emailVerifiedAt ? 'Yes' : 'No',
      ].join(',')),
    ];

    return rows.join('\n');
  }

  async getTopCustomers() {
    const result = await this.prisma.order.groupBy({
      by: ['userId'],
      where: { paymentStatus: 'PAID' },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    });
    const userIds = result.map(r => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    return result.map(r => ({
      user: userMap.get(r.userId),
      totalSpent: Number(r._sum.total ?? 0),
      orderCount: r._count.id,
    }));
  }

  async resetUserCredentials(id: string, dto: { email?: string; password?: string }) {
    const data: any = {};
    if (dto.email) data.email = dto.email;
    if (dto.password) data.passwordHash = await argon2.hash(dto.password);
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true },
    });
  }
}
