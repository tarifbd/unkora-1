import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const db = (prisma: PrismaService) => (prisma as any);

@Injectable()
export class SegmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  // ─── Computed built-in segments ──────────────────────────────

  async getSegmentOverview() {
    const [vip, highValue, newUsers, inactive, atRisk] = await Promise.all([
      this.countVip(),
      this.countHighValue(),
      this.countNew(),
      this.countInactive(),
      this.countAtRisk(),
    ]);

    const builtIn = [
      { segment: 'vip',        label: 'VIP Customers', count: vip,       description: 'More than 10 orders',           color: 'purple', type: 'COMPUTED' },
      { segment: 'high-value', label: 'High Value',    count: highValue, description: 'Total spend over ৳10,000',      color: 'yellow', type: 'COMPUTED' },
      { segment: 'new',        label: 'New Customers', count: newUsers,  description: 'Registered in the last 30 days', color: 'green',  type: 'COMPUTED' },
      { segment: 'inactive',   label: 'Inactive',      count: inactive,  description: 'Last order over 90 days ago',   color: 'gray',   type: 'COMPUTED' },
      { segment: 'at-risk',    label: 'At Risk',       count: atRisk,    description: '2–5 orders, 60+ days inactive', color: 'red',    type: 'COMPUTED' },
    ];

    // Also fetch saved custom segments
    const saved = await db(this.prisma).customerSegment.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }).catch(() => []);

    return [...builtIn, ...saved.map((s: any) => ({ ...s, segment: `custom:${s.id}` }))];
  }

  // ─── Saved (custom) segment CRUD ─────────────────────────────

  async listSaved() {
    return db(this.prisma).customerSegment.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []);
  }

  async createSegment(dto: { name: string; description?: string; color?: string; rules?: object }) {
    return db(this.prisma).customerSegment.create({ data: dto });
  }

  async updateSegment(id: string, dto: { name?: string; description?: string; color?: string; isActive?: boolean }) {
    const seg = await db(this.prisma).customerSegment.findUnique({ where: { id } }).catch(() => null);
    if (!seg) throw new NotFoundException('Segment not found');
    return db(this.prisma).customerSegment.update({ where: { id }, data: dto });
  }

  async deleteSegment(id: string) {
    return db(this.prisma).customerSegment.delete({ where: { id } }).catch(() => { throw new NotFoundException('Segment not found'); });
  }

  async syncSegmentMembers(segmentId: string, userIds: string[]) {
    // Clear existing members and add new ones
    await db(this.prisma).customerSegmentMember.deleteMany({ where: { segmentId } }).catch(() => null);

    if (userIds.length > 0) {
      await db(this.prisma).customerSegmentMember.createMany({
        data: userIds.map(userId => ({ segmentId, userId })),
        skipDuplicates: true,
      }).catch(() => null);
    }

    await db(this.prisma).customerSegment.update({
      where: { id: segmentId },
      data: { userCount: userIds.length, lastSyncAt: new Date() },
    }).catch(() => null);

    return { synced: userIds.length };
  }

  // ─── Users per segment ────────────────────────────────────────

  async getUsersInSegment(segment: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    if (segment.startsWith('custom:')) {
      const segmentId = segment.replace('custom:', '');
      return this.getCustomSegmentUsers(segmentId, skip, limit);
    }

    switch (segment) {
      case 'vip':        return this.getVipUsers(skip, limit);
      case 'high-value': return this.getHighValueUsers(skip, limit);
      case 'new':        return this.getNewUsers(skip, limit);
      case 'inactive':   return this.getInactiveUsers(skip, limit);
      case 'at-risk':    return this.getAtRiskUsers(skip, limit);
      default:           throw new BadRequestException(`Unknown segment: ${segment}`);
    }
  }

  private async getCustomSegmentUsers(segmentId: string, skip: number, limit: number) {
    const members = await db(this.prisma).customerSegmentMember.findMany({
      where: { segmentId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true } } },
      skip,
      take: limit,
    }).catch(() => []);
    return members.map((m: any) => m.user);
  }

  // ─── Count helpers ────────────────────────────────────────────

  private async countVip(): Promise<number> {
    const r = await this.prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*) as c FROM (
        SELECT u.id FROM users u JOIN orders o ON o."userId" = u.id
        GROUP BY u.id HAVING COUNT(o.id) > 10
      ) sub`;
    return Number(r[0]?.c ?? 0);
  }

  private async countHighValue(): Promise<number> {
    const r = await this.prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*) as c FROM (
        SELECT u.id FROM users u JOIN orders o ON o."userId" = u.id
        GROUP BY u.id HAVING SUM(o.total) > 10000
      ) sub`;
    return Number(r[0]?.c ?? 0);
  }

  private async countNew(): Promise<number> {
    return this.prisma.user.count({ where: { createdAt: { gte: this.daysAgo(30) } } });
  }

  private async countInactive(): Promise<number> {
    const r = await this.prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*) as c FROM (
        SELECT u.id FROM users u JOIN orders o ON o."userId" = u.id
        GROUP BY u.id HAVING MAX(o."createdAt") < NOW() - INTERVAL '90 days'
      ) sub`;
    return Number(r[0]?.c ?? 0);
  }

  private async countAtRisk(): Promise<number> {
    const r = await this.prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*) as c FROM (
        SELECT u.id FROM users u JOIN orders o ON o."userId" = u.id
        GROUP BY u.id
        HAVING COUNT(o.id) BETWEEN 2 AND 5 AND MAX(o."createdAt") < NOW() - INTERVAL '60 days'
      ) sub`;
    return Number(r[0]?.c ?? 0);
  }

  // ─── User list helpers ────────────────────────────────────────

  private row(r: any) {
    return { ...r, orderCount: Number(r.orderCount ?? 0), totalSpent: Number(r.totalSpent ?? 0) };
  }

  private async getVipUsers(skip: number, limit: number) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT u.id, u."firstName", u."lastName", u.email, u.phone,
             COUNT(o.id) as "orderCount", COALESCE(SUM(o.total), 0) as "totalSpent"
      FROM users u JOIN orders o ON o."userId" = u.id
      GROUP BY u.id, u."firstName", u."lastName", u.email, u.phone
      HAVING COUNT(o.id) > 10 ORDER BY COUNT(o.id) DESC
      LIMIT ${limit} OFFSET ${skip}`;
    return rows.map(r => this.row(r));
  }

  private async getHighValueUsers(skip: number, limit: number) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT u.id, u."firstName", u."lastName", u.email, u.phone,
             COUNT(o.id) as "orderCount", COALESCE(SUM(o.total), 0) as "totalSpent"
      FROM users u JOIN orders o ON o."userId" = u.id
      GROUP BY u.id, u."firstName", u."lastName", u.email, u.phone
      HAVING SUM(o.total) > 10000 ORDER BY SUM(o.total) DESC
      LIMIT ${limit} OFFSET ${skip}`;
    return rows.map(r => this.row(r));
  }

  private async getNewUsers(skip: number, limit: number) {
    const users = await this.prisma.user.findMany({
      skip, take: limit,
      where: { createdAt: { gte: this.daysAgo(30) } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true },
    });
    const ids = users.map(u => u.id);
    if (!ids.length) return [];
    const counts = await this.prisma.order.groupBy({
      by: ['userId'], where: { userId: { in: ids } },
      _count: { id: true }, _sum: { total: true },
    });
    const map = new Map(counts.map(c => [c.userId, c]));
    return users.map(u => ({ ...u, orderCount: map.get(u.id)?._count.id ?? 0, totalSpent: Number(map.get(u.id)?._sum.total ?? 0) }));
  }

  private async getInactiveUsers(skip: number, limit: number) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT u.id, u."firstName", u."lastName", u.email, u.phone,
             COUNT(o.id) as "orderCount", COALESCE(SUM(o.total), 0) as "totalSpent",
             MAX(o."createdAt") as "lastOrderAt"
      FROM users u JOIN orders o ON o."userId" = u.id
      GROUP BY u.id, u."firstName", u."lastName", u.email, u.phone
      HAVING MAX(o."createdAt") < NOW() - INTERVAL '90 days'
      ORDER BY MAX(o."createdAt") ASC LIMIT ${limit} OFFSET ${skip}`;
    return rows.map(r => this.row(r));
  }

  private async getAtRiskUsers(skip: number, limit: number) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT u.id, u."firstName", u."lastName", u.email, u.phone,
             COUNT(o.id) as "orderCount", COALESCE(SUM(o.total), 0) as "totalSpent",
             MAX(o."createdAt") as "lastOrderAt"
      FROM users u JOIN orders o ON o."userId" = u.id
      GROUP BY u.id, u."firstName", u."lastName", u.email, u.phone
      HAVING COUNT(o.id) BETWEEN 2 AND 5 AND MAX(o."createdAt") < NOW() - INTERVAL '60 days'
      ORDER BY MAX(o."createdAt") ASC LIMIT ${limit} OFFSET ${skip}`;
    return rows.map(r => this.row(r));
  }
}
