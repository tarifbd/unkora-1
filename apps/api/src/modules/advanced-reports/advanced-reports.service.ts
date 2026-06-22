import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const db = (prisma: PrismaService) => (prisma as any);

/* ── Pivot report types ────────────────────────────────────────── */

export const PIVOT_DIMENSIONS = [
  'date', 'week', 'month', 'hour', 'weekday',
  'division', 'district', 'city',
  'paymentMethod', 'paymentStatus', 'status',
  'category', 'product', 'customerType',
] as const;
export type PivotDimension = (typeof PIVOT_DIMENSIONS)[number];

export const PIVOT_METRICS = [
  'revenue', 'orders', 'unitsSold', 'aov',
  'discount', 'shipping', 'customers', 'newCustomers',
] as const;
export type PivotMetric = (typeof PIVOT_METRICS)[number];

export interface PivotQueryDto {
  from?: string;
  to?: string;
  rows: PivotDimension[];
  col?: PivotDimension;
  metrics: PivotMetric[];
  filters?: {
    status?: string[];
    paymentMethod?: string[];
    division?: string[];
    includeCancelled?: boolean;
  };
}

interface PivotRecord {
  orderId: string;
  userId: string;
  revenue: number;
  units: number;
  discount: number;
  shipping: number;
  isFirstOrder: boolean;
  dims: Record<string, string>;
}

interface PivotBucket {
  revenue: number;
  discount: number;
  shipping: number;
  units: number;
  orderIds: Set<string>;
  userIds: Set<string>;
  newUserIds: Set<string>;
}

// Bangladesh time (UTC+6) for date / hour / weekday breakdowns
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

  /* ── FB Ads Manager-style pivot report ───────────────────────── */

  async getPivot(query: PivotQueryDto) {
    const rows = (query.rows ?? []).slice(0, 3);
    const col = query.col;
    const metrics = (query.metrics ?? []).slice(0, 8);

    if (rows.length === 0) throw new BadRequestException('At least one row dimension is required');
    if (metrics.length === 0) throw new BadRequestException('At least one metric is required');
    for (const d of [...rows, ...(col ? [col] : [])]) {
      if (!PIVOT_DIMENSIONS.includes(d)) throw new BadRequestException(`Unknown dimension: ${d}`);
    }
    for (const m of metrics) {
      if (!PIVOT_METRICS.includes(m)) throw new BadRequestException(`Unknown metric: ${m}`);
    }

    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    to.setHours(23, 59, 59, 999);

    const allDims = [...rows, ...(col ? [col] : [])];
    const needItems = allDims.includes('category') || allDims.includes('product') || metrics.includes('unitsSold');

    const where: any = {
      createdAt: { gte: from, lte: to },
      ...(query.filters?.includeCancelled ? {} : { status: { notIn: ['CANCELLED', 'REFUNDED'] } }),
      ...(query.filters?.status?.length ? { status: { in: query.filters.status } } : {}),
      ...(query.filters?.paymentMethod?.length ? { paymentMethod: { in: query.filters.paymentMethod } } : {}),
    };

    const orders = await this.prisma.order.findMany({
      where,
      take: 50000,
      select: {
        id: true, userId: true, createdAt: true, status: true,
        paymentStatus: true, paymentMethod: true,
        total: true, subtotal: true, discount: true, shippingCost: true,
        shippingAddress: true,
        items: needItems
          ? {
              select: {
                quantity: true, totalPrice: true, productId: true, productName: true,
                product: { select: { category: { select: { id: true, name: true, parent: { select: { name: true } } } } } },
              },
            }
          : false,
      },
    });

    // First-order date per user → "New" vs "Returning" customer + newCustomers metric
    const needsCustomerType = allDims.includes('customerType') || metrics.includes('newCustomers');
    const firstOrderAt = new Map<string, number>();
    if (needsCustomerType && orders.length > 0) {
      const grouped = await this.prisma.order.groupBy({
        by: ['userId'],
        where: { userId: { in: [...new Set(orders.map(o => o.userId))] } },
        _min: { createdAt: true },
      });
      for (const g of grouped) {
        if (g._min.createdAt) firstOrderAt.set(g.userId, g._min.createdAt.getTime());
      }
    }

    const dimValue = (o: (typeof orders)[number], dim: PivotDimension, item?: any): string => {
      const local = new Date(o.createdAt.getTime() + DHAKA_OFFSET_MS);
      const sa = (o.shippingAddress ?? {}) as Record<string, string>;
      switch (dim) {
        case 'date': return local.toISOString().slice(0, 10);
        case 'month': return local.toISOString().slice(0, 7);
        case 'week': {
          // ISO week: YYYY-Www
          const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
          const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
          return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
        }
        case 'hour': return `${String(local.getUTCHours()).padStart(2, '0')}:00`;
        case 'weekday': return WEEKDAYS[local.getUTCDay()] ?? 'Unknown';
        case 'division': return sa.division || 'Unknown';
        case 'district': return sa.district || 'Unknown';
        case 'city': return sa.city || 'Unknown';
        case 'paymentMethod': return o.paymentMethod;
        case 'paymentStatus': return o.paymentStatus;
        case 'status': return o.status;
        case 'customerType': {
          const first = firstOrderAt.get(o.userId);
          return first !== undefined && o.createdAt.getTime() <= first ? 'New' : 'Returning';
        }
        case 'category':
          return item?.product?.category
            ? (item.product.category.parent?.name ?? item.product.category.name)
            : 'Uncategorized';
        case 'product': return item?.productName ?? 'Unknown';
      }
    };

    // Explode to item-level records when product/category breakdown is requested,
    // prorating order-level discount/shipping by each item's share of the subtotal
    const records: PivotRecord[] = [];
    for (const o of orders) {
      const isFirst = needsCustomerType
        ? (firstOrderAt.get(o.userId) ?? 0) >= o.createdAt.getTime()
        : false;
      const base = {
        orderId: o.id, userId: o.userId, isFirstOrder: isFirst,
        discount: Number(o.discount), shipping: Number(o.shippingCost),
      };
      const items: any[] = needItems ? ((o as any).items ?? []) : [];
      if (needItems && items.length > 0) {
        const subtotal = Number(o.subtotal) || items.reduce((s, it) => s + Number(it.totalPrice), 0) || 1;
        for (const it of items) {
          const share = Number(it.totalPrice) / subtotal;
          records.push({
            ...base,
            revenue: Number(it.totalPrice),
            units: it.quantity,
            discount: base.discount * share,
            shipping: base.shipping * share,
            dims: Object.fromEntries(allDims.map(d => [d, dimValue(o, d, it)])),
          });
        }
      } else {
        records.push({
          ...base,
          revenue: Number(o.total),
          units: 0,
          dims: Object.fromEntries(allDims.map(d => [d, dimValue(o, d)])),
        });
      }
    }

    const newBucket = (): PivotBucket => ({
      revenue: 0, discount: 0, shipping: 0, units: 0,
      orderIds: new Set(), userIds: new Set(), newUserIds: new Set(),
    });
    const addTo = (b: PivotBucket, r: PivotRecord) => {
      b.revenue += r.revenue;
      b.discount += r.discount;
      b.shipping += r.shipping;
      b.units += r.units;
      b.orderIds.add(r.orderId);
      b.userIds.add(r.userId);
      if (r.isFirstOrder) b.newUserIds.add(r.userId);
    };
    const finalize = (b: PivotBucket): Record<string, number> => {
      const orderCount = b.orderIds.size;
      const all: Record<PivotMetric, number> = {
        revenue: Math.round(b.revenue * 100) / 100,
        orders: orderCount,
        unitsSold: b.units,
        aov: orderCount > 0 ? Math.round((b.revenue / orderCount) * 100) / 100 : 0,
        discount: Math.round(b.discount * 100) / 100,
        shipping: Math.round(b.shipping * 100) / 100,
        customers: b.userIds.size,
        newCustomers: b.newUserIds.size,
      };
      return Object.fromEntries(metrics.map(m => [m, all[m]]));
    };

    const SEP = '\u0001';
    const rowBuckets = new Map<string, { keys: string[]; total: PivotBucket; cells: Map<string, PivotBucket> }>();
    const colValues = new Set<string>();
    const grandTotal = newBucket();

    for (const r of records) {
      const keys = rows.map(d => r.dims[d] ?? 'Unknown');
      const rowKey = keys.join(SEP);
      let bucket = rowBuckets.get(rowKey);
      if (!bucket) {
        bucket = { keys, total: newBucket(), cells: new Map() };
        rowBuckets.set(rowKey, bucket);
      }
      addTo(bucket.total, r);
      addTo(grandTotal, r);
      if (col) {
        const cv = r.dims[col] ?? 'Unknown';
        colValues.add(cv);
        let cell = bucket.cells.get(cv);
        if (!cell) {
          cell = newBucket();
          bucket.cells.set(cv, cell);
        }
        addTo(cell, r);
      }
    }

    const sortedCols = [...colValues].sort();
    const resultRows = [...rowBuckets.values()]
      .map(b => ({
        keys: Object.fromEntries(rows.map((d, i) => [d, b.keys[i] ?? ''])),
        metrics: finalize(b.total),
        ...(col
          ? { cells: Object.fromEntries(sortedCols.map(cv => [cv, b.cells.has(cv) ? finalize(b.cells.get(cv)!) : null])) }
          : {}),
      }))
      .sort((a, b) => (b.metrics[metrics[0]!] ?? 0) - (a.metrics[metrics[0]!] ?? 0));

    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      rows: resultRows,
      colValues: sortedCols,
      totals: finalize(grandTotal),
      meta: {
        ordersScanned: orders.length,
        dimensions: rows,
        col: col ?? null,
        metrics,
      },
    };
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
