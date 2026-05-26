import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const db = (prisma: PrismaService) => (prisma as any);

@Injectable()
export class AdvancedReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private periodToDays(period: string): number {
    switch (period) {
      case '7d':  return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y':  return 365;
      default:    return 30;
    }
  }

  async getRevenue(period: string) {
    const days = this.periodToDays(period);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.prisma.$queryRaw<{ date: string; revenue: string; orders: string }[]>`
      SELECT
        DATE_TRUNC('day', "createdAt")::date::text as date,
        COALESCE(SUM(total), 0)::text as revenue,
        COUNT(id)::text as orders
      FROM orders
      WHERE "createdAt" >= ${since}
        AND status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;

    const totalRevenue = rows.reduce((sum, r) => sum + parseFloat(r.revenue), 0);
    const totalOrders  = rows.reduce((sum, r) => sum + parseInt(r.orders, 10), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      period,
      totalRevenue,
      totalOrders,
      avgOrderValue,
      daily: rows.map(r => ({
        date:    r.date,
        revenue: parseFloat(r.revenue),
        orders:  parseInt(r.orders, 10),
      })),
    };
  }

  async getTopProducts() {
    return this.prisma.$queryRaw<any[]>`
      SELECT
        p.id, p.name, p.slug,
        COUNT(oi.id)::int as "orderCount",
        SUM(oi.quantity)::int as "unitsSold",
        SUM(oi."unitPrice" * oi.quantity)::float as revenue
      FROM products p
      JOIN order_items oi ON oi."productId" = p.id
      JOIN orders o ON o.id = oi."orderId"
      WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY p.id, p.name, p.slug
      ORDER BY "unitsSold" DESC
      LIMIT 10
    `;
  }

  async getTopCustomers() {
    return this.prisma.$queryRaw<any[]>`
      SELECT
        u.id, u."firstName", u."lastName", u.email, u.phone,
        COUNT(o.id)::int as "orderCount",
        SUM(o.total)::float as "totalSpent"
      FROM users u
      JOIN orders o ON o."userId" = u.id
      WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY u.id, u."firstName", u."lastName", u.email, u.phone
      ORDER BY "totalSpent" DESC
      LIMIT 10
    `;
  }

  async getFunnel() {
    const [totalUsers, totalOrders, deliveredOrders, paidOrders] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'DELIVERED' } }),
      this.prisma.order.count({ where: { paymentStatus: 'PAID' } }),
    ]);

    return [
      { step: 'Registered Customers', count: totalUsers, percent: 100 },
      { step: 'Placed Orders', count: totalOrders,
        percent: totalUsers > 0 ? Math.round((totalOrders / totalUsers) * 100) : 0 },
      { step: 'Paid Orders', count: paidOrders,
        percent: totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 100) : 0 },
      { step: 'Delivered Orders', count: deliveredOrders,
        percent: paidOrders > 0 ? Math.round((deliveredOrders / paidOrders) * 100) : 0 },
    ];
  }

  async getCohort() {
    return this.prisma.$queryRaw<any[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', u."createdAt"), 'YYYY-MM') as month,
        COUNT(DISTINCT u.id)::int as "usersRegistered",
        COUNT(DISTINCT o.id)::int as "ordersPlaced",
        COALESCE(SUM(o.total), 0)::float as revenue
      FROM users u
      LEFT JOIN orders o ON o."userId" = u.id AND o.status NOT IN ('CANCELLED', 'REFUNDED')
      WHERE u."createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', u."createdAt")
      ORDER BY month ASC
    `;
  }

  async syncDailyMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [orders, newUsers] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        select: { total: true },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    ]);

    const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const orderCount = orders.length;

    const metric = {
      date: today,
      revenue,
      orders: orderCount,
      newUsers,
      avgOrderValue: orderCount > 0 ? revenue / orderCount : 0,
    };

    return db(this.prisma).dailyMetric.upsert({
      where: { date: today },
      create: metric,
      update: metric,
    });
  }

  async getDailyMetrics(period: string) {
    const days = this.periodToDays(period);
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const metrics = await db(this.prisma).dailyMetric.findMany({
      where: { date: { gte: since } },
      orderBy: { date: 'asc' },
    });

    // If no cached metrics, fall back to live query
    if (metrics.length === 0) return this.getRevenue(period);

    const totalRevenue = metrics.reduce((s: number, m: any) => s + Number(m.revenue), 0);
    const totalOrders  = metrics.reduce((s: number, m: any) => s + m.orders, 0);

    return {
      period,
      totalRevenue,
      totalOrders,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      daily: metrics.map((m: any) => ({
        date:     m.date.toISOString().split('T')[0],
        revenue:  Number(m.revenue),
        orders:   m.orders,
        newUsers: m.newUsers,
      })),
    };
  }
}
