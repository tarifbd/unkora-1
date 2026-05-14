import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@unkora/database';

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
}
