import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

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

    return {
      period,
      totalRevenue,
      totalOrders,
      daily: rows.map(r => ({
        date:    r.date,
        revenue: parseFloat(r.revenue),
        orders:  parseInt(r.orders, 10),
      })),
    };
  }

  async getTopProducts() {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        p.id, p.name, p."imageUrl",
        COUNT(oi.id)::int as "orderCount",
        SUM(oi.quantity)::int as "unitsSold",
        SUM(oi."unitPrice" * oi.quantity)::float as revenue
      FROM products p
      JOIN order_items oi ON oi."productId" = p.id
      JOIN orders o ON o.id = oi."orderId"
      WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY p.id, p.name, p."imageUrl"
      ORDER BY "unitsSold" DESC
      LIMIT 10
    `;
    return rows;
  }

  async getTopCustomers() {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        u.id, u."firstName", u."lastName", u.email,
        COUNT(o.id)::int as "orderCount",
        SUM(o.total)::float as "totalSpent"
      FROM users u
      JOIN orders o ON o."userId" = u.id
      WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY u.id, u."firstName", u."lastName", u.email
      ORDER BY "totalSpent" DESC
      LIMIT 10
    `;
    return rows;
  }

  async getFunnel() {
    const [totalUsers, totalOrders, deliveredOrders] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'DELIVERED' } }),
    ]);

    return [
      { step: 'Registered Users', count: totalUsers, percent: 100 },
      {
        step: 'Placed Orders',
        count: totalOrders,
        percent: totalUsers > 0 ? Math.round((totalOrders / totalUsers) * 100) : 0,
      },
      {
        step: 'Delivered Orders',
        count: deliveredOrders,
        percent: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
      },
    ];
  }

  async getCohort() {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', u."createdAt"), 'YYYY-MM') as month,
        COUNT(DISTINCT u.id)::int as "usersRegistered",
        COUNT(DISTINCT o.id)::int as "ordersPlaced"
      FROM users u
      LEFT JOIN orders o ON o."userId" = u.id
      WHERE u."createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', u."createdAt")
      ORDER BY month ASC
    `;
    return rows;
  }
}
