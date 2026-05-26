import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SegmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  async getSegmentOverview() {
    const [vip, highValue, newUsers, inactive, atRisk] = await Promise.all([
      this.countVip(),
      this.countHighValue(),
      this.countNew(),
      this.countInactive(),
      this.countAtRisk(),
    ]);
    return [
      { segment: 'vip', label: 'VIP Customers', count: vip, description: 'Users with more than 10 orders', color: 'purple' },
      { segment: 'high-value', label: 'High Value', count: highValue, description: 'Users with total spend over ৳10,000', color: 'yellow' },
      { segment: 'new', label: 'New Customers', count: newUsers, description: 'Registered in the last 30 days', color: 'green' },
      { segment: 'inactive', label: 'Inactive', count: inactive, description: 'Last order was over 90 days ago', color: 'gray' },
      { segment: 'at-risk', label: 'At Risk', count: atRisk, description: '2–5 orders, no activity for 60+ days', color: 'red' },
    ];
  }

  private async countVip(): Promise<number> {
    const result = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT u.id)::bigint as count
      FROM users u
      JOIN orders o ON o."userId" = u.id
      GROUP BY u.id
      HAVING COUNT(o.id) > 10
    `;
    return result.length > 0 ? Number(result[0].count) : 0;
  }

  private async countHighValue(): Promise<number> {
    const result = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM (
        SELECT u.id
        FROM users u
        JOIN orders o ON o."userId" = u.id
        GROUP BY u.id
        HAVING SUM(o.total) > 10000
      ) sub
    `;
    return result.length > 0 ? Number(result[0].count) : 0;
  }

  private async countNew(): Promise<number> {
    return this.prisma.user.count({
      where: { createdAt: { gte: this.daysAgo(30) } },
    });
  }

  private async countInactive(): Promise<number> {
    const result = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      JOIN orders o ON o."userId" = u.id
      GROUP BY u.id
      HAVING MAX(o."createdAt") < NOW() - INTERVAL '90 days'
    `;
    return result.length > 0 ? Number(result[0].count) : 0;
  }

  private async countAtRisk(): Promise<number> {
    const result = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM (
        SELECT u.id
        FROM users u
        JOIN orders o ON o."userId" = u.id
        GROUP BY u.id
        HAVING COUNT(o.id) BETWEEN 2 AND 5
          AND MAX(o."createdAt") < NOW() - INTERVAL '60 days'
      ) sub
    `;
    return result.length > 0 ? Number(result[0].count) : 0;
  }

  async getUsersInSegment(segment: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    switch (segment) {
      case 'vip':
        return this.getVipUsers(skip, limit);
      case 'high-value':
        return this.getHighValueUsers(skip, limit);
      case 'new':
        return this.getNewUsers(skip, limit);
      case 'inactive':
        return this.getInactiveUsers(skip, limit);
      case 'at-risk':
        return this.getAtRiskUsers(skip, limit);
      default:
        throw new BadRequestException(`Unknown segment: ${segment}`);
    }
  }

  private async getVipUsers(skip: number, limit: number) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT u.id, u."firstName", u."lastName", u.email, u.phone,
             COUNT(o.id) as "orderCount", COALESCE(SUM(o.total), 0) as "totalSpent"
      FROM users u
      JOIN orders o ON o."userId" = u.id
      GROUP BY u.id, u."firstName", u."lastName", u.email, u.phone
      HAVING COUNT(o.id) > 10
      ORDER BY COUNT(o.id) DESC
      LIMIT ${limit} OFFSET ${skip}
    `;
    return rows.map(r => ({ ...r, orderCount: Number(r.orderCount), totalSpent: Number(r.totalSpent) }));
  }

  private async getHighValueUsers(skip: number, limit: number) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT u.id, u."firstName", u."lastName", u.email, u.phone,
             COUNT(o.id) as "orderCount", COALESCE(SUM(o.total), 0) as "totalSpent"
      FROM users u
      JOIN orders o ON o."userId" = u.id
      GROUP BY u.id, u."firstName", u."lastName", u.email, u.phone
      HAVING SUM(o.total) > 10000
      ORDER BY SUM(o.total) DESC
      LIMIT ${limit} OFFSET ${skip}
    `;
    return rows.map(r => ({ ...r, orderCount: Number(r.orderCount), totalSpent: Number(r.totalSpent) }));
  }

  private async getNewUsers(skip: number, limit: number) {
    const users = await this.prisma.user.findMany({
      skip,
      take: limit,
      where: { createdAt: { gte: this.daysAgo(30) } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true },
    });
    const ids = users.map(u => u.id);
    if (ids.length === 0) return [];
    const orderCounts = await this.prisma.order.groupBy({
      by: ['userId'],
      where: { userId: { in: ids } },
      _count: { id: true },
      _sum: { total: true },
    });
    const map = new Map(orderCounts.map(o => [o.userId, o]));
    return users.map(u => ({
      ...u,
      orderCount: map.get(u.id)?._count.id ?? 0,
      totalSpent: Number(map.get(u.id)?._sum.total ?? 0),
    }));
  }

  private async getInactiveUsers(skip: number, limit: number) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT u.id, u."firstName", u."lastName", u.email, u.phone,
             COUNT(o.id) as "orderCount", COALESCE(SUM(o.total), 0) as "totalSpent",
             MAX(o."createdAt") as "lastOrderAt"
      FROM users u
      JOIN orders o ON o."userId" = u.id
      GROUP BY u.id, u."firstName", u."lastName", u.email, u.phone
      HAVING MAX(o."createdAt") < NOW() - INTERVAL '90 days'
      ORDER BY MAX(o."createdAt") ASC
      LIMIT ${limit} OFFSET ${skip}
    `;
    return rows.map(r => ({ ...r, orderCount: Number(r.orderCount), totalSpent: Number(r.totalSpent) }));
  }

  private async getAtRiskUsers(skip: number, limit: number) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT u.id, u."firstName", u."lastName", u.email, u.phone,
             COUNT(o.id) as "orderCount", COALESCE(SUM(o.total), 0) as "totalSpent",
             MAX(o."createdAt") as "lastOrderAt"
      FROM users u
      JOIN orders o ON o."userId" = u.id
      GROUP BY u.id, u."firstName", u."lastName", u.email, u.phone
      HAVING COUNT(o.id) BETWEEN 2 AND 5
        AND MAX(o."createdAt") < NOW() - INTERVAL '60 days'
      ORDER BY MAX(o."createdAt") ASC
      LIMIT ${limit} OFFSET ${skip}
    `;
    return rows.map(r => ({ ...r, orderCount: Number(r.orderCount), totalSpent: Number(r.totalSpent) }));
  }
}
