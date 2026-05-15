import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

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
    ]);

    return {
      revenue: {
        total: Number(totalRevenue._sum.total ?? 0),
        thisMonth: Number(monthRevenue._sum.total ?? 0),
        today: Number(todayRevenue._sum.total ?? 0),
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
      },
      customers: {
        total: totalCustomers,
        newThisMonth: newCustomersThisMonth,
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
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        address: true,
        _count: { select: { orders: true, reviews: true, wishlists: true } },
      },
    });
  }

  async updateUser(id: string, dto: { role?: string; status?: string }) {
    return this.prisma.user.update({
      where: { id },
      data: dto as any,
      select: { id: true, email: true, role: true, status: true },
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
    const catMap = new Map(products.map(p => [p.id, p.category?.name ?? 'Unknown']));
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
}
