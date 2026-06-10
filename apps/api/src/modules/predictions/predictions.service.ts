import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiProviderFactory } from '../ai-studio/providers/ai-provider.factory';

interface FestivalEvent {
  name: string;
  nameBn: string;
  date: string; // YYYY-MM-DD — next occurrence
  leadTimeDays: number;
  categories: string[];
}

const EXCLUDED_ORDER_STATUSES = ['CANCELLED', 'REFUNDED'];

@Injectable()
export class PredictionsService {
  private readonly logger = new Logger(PredictionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiFactory: AiProviderFactory,
  ) {}

  // ── Festival / season calendar (Bangladesh commercial events) ──
  private readonly festivalCalendar: FestivalEvent[] = [
    {
      name: 'Monsoon Season',
      nameBn: 'বর্ষাকাল',
      date: '2026-06-15',
      leadTimeDays: 14,
      categories: ['Umbrellas', 'Raincoats', 'Waterproof Bags', 'Footwear'],
    },
    {
      name: 'Durga Puja',
      nameBn: 'দুর্গা পূজা',
      date: '2026-10-17',
      leadTimeDays: 21,
      categories: ['Sarees', 'Ethnic Wear', 'Jewelry', 'Gifts', 'Sweets'],
    },
    {
      name: '11.11 Mega Sale / Black Friday Season',
      nameBn: '১১.১১ মেগা সেল',
      date: '2026-11-11',
      leadTimeDays: 30,
      categories: ['Electronics', 'Fashion', 'Home Appliances', 'Gadgets'],
    },
    {
      name: 'Winter Season',
      nameBn: 'শীতকাল',
      date: '2026-11-15',
      leadTimeDays: 30,
      categories: ['Winter Clothing', 'Jackets', 'Blankets', 'Heaters', 'Skincare'],
    },
    {
      name: 'Victory Day',
      nameBn: 'বিজয় দিবস',
      date: '2026-12-16',
      leadTimeDays: 14,
      categories: ['Flags', 'Red-Green Apparel', 'Books', 'Patriotic Merchandise'],
    },
    {
      name: 'Christmas',
      nameBn: 'বড়দিন',
      date: '2026-12-25',
      leadTimeDays: 21,
      categories: ['Gifts', 'Decorations', 'Cakes & Confectionery', 'Toys'],
    },
    {
      name: 'Back to School',
      nameBn: 'স্কুলে ফেরা',
      date: '2027-01-01',
      leadTimeDays: 21,
      categories: ['Books', 'Stationery', 'School Bags', 'Uniforms', 'Lunch Boxes'],
    },
    {
      name: "Pohela Falgun & Valentine's Day",
      nameBn: 'পহেলা ফাল্গুন ও ভালোবাসা দিবস',
      date: '2027-02-13',
      leadTimeDays: 14,
      categories: ['Flowers', 'Gifts', 'Yellow & Red Apparel', 'Chocolates', 'Jewelry'],
    },
    {
      name: 'Eid-ul-Fitr',
      nameBn: 'ঈদুল ফিতর',
      date: '2027-03-09',
      leadTimeDays: 30,
      categories: ['Panjabi', 'Sarees', 'Kids Fashion', 'Footwear', 'Gifts', 'Home Decor'],
    },
    {
      name: 'Independence Day',
      nameBn: 'স্বাধীনতা দিবস',
      date: '2027-03-26',
      leadTimeDays: 14,
      categories: ['Flags', 'Red-Green Apparel', 'Books', 'Patriotic Merchandise'],
    },
    {
      name: 'Pohela Boishakh',
      nameBn: 'পহেলা বৈশাখ',
      date: '2027-04-14',
      leadTimeDays: 21,
      categories: ['Traditional Wear', 'Red-White Sarees', 'Handicrafts', 'Sweets', 'Home Decor'],
    },
    {
      name: 'Eid-ul-Adha',
      nameBn: 'ঈদুল আজহা',
      date: '2027-05-17',
      leadTimeDays: 30,
      categories: ['Kitchenware', 'Knives & Cutlery', 'Refrigerators', 'Spices', 'Apparel'],
    },
  ];

  // ── A) Upcoming festivals (next 180 days) ──────────────────
  getUpcomingFestivals() {
    const now = new Date();
    return this.festivalCalendar
      .map((f) => {
        const daysUntil = Math.ceil(
          (new Date(`${f.date}T00:00:00`).getTime() - now.getTime()) / 86400000,
        );
        return { ...f, daysUntil, stockUpNow: daysUntil >= 0 && daysUntil <= f.leadTimeDays };
      })
      .filter((f) => f.daysUntil >= 0 && f.daysUntil <= 180)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }

  // ── B) Trending products (30d vs previous 30d velocity) ────
  async getTrendingProducts() {
    try {
      const now = new Date();
      const d30 = new Date(now.getTime() - 30 * 86400000);
      const d60 = new Date(now.getTime() - 60 * 86400000);

      const orderFilter = (gte: Date, lt: Date) => ({
        order: {
          createdAt: { gte, lt },
          status: { notIn: EXCLUDED_ORDER_STATUSES },
        },
      });

      const [recent, previous] = await Promise.all([
        (this.prisma as any).orderItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true },
          where: orderFilter(d30, now),
        }),
        (this.prisma as any).orderItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true },
          where: orderFilter(d60, d30),
        }),
      ]);

      const recentMap = new Map<string, number>(
        recent.map((r: any) => [r.productId, r._sum?.quantity ?? 0]),
      );
      const previousMap = new Map<string, number>(
        previous.map((r: any) => [r.productId, r._sum?.quantity ?? 0]),
      );
      const productIds = [...new Set([...recentMap.keys(), ...previousMap.keys()])];
      if (productIds.length === 0) return [];

      const products = await (this.prisma as any).product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          stockQuantity: true,
          category: { select: { name: true } },
        },
      });
      const productMap = new Map<string, any>(products.map((p: any) => [p.id, p]));

      return productIds
        .map((productId) => {
          const product = productMap.get(productId);
          if (!product) return null;
          const recentQty = recentMap.get(productId) ?? 0;
          const previousQty = previousMap.get(productId) ?? 0;
          const growthPct = ((recentQty - previousQty) / Math.max(previousQty, 1)) * 100;
          const trend = growthPct >= 20 ? 'RISING' : growthPct <= -20 ? 'FALLING' : 'STABLE';
          return {
            productId,
            name: product.name,
            category: product.category?.name ?? 'Uncategorized',
            recentQty,
            previousQty,
            growthPct: Math.round(growthPct * 10) / 10,
            stockQuantity: product.stockQuantity,
            trend,
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b.growthPct - a.growthPct)
        .slice(0, 15);
    } catch (err) {
      this.logger.error(`getTrendingProducts failed: ${(err as Error).message}`);
      return [];
    }
  }

  // ── C) Seasonal analysis (12 months × category) ────────────
  async getSeasonalAnalysis() {
    const empty = { months: [] as string[], categories: [] as { name: string; monthly: number[] }[] };
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      // Build last 12 month buckets (YYYY-MM)
      const months: string[] = [];
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
      const monthIndex = new Map(months.map((m, i) => [m, i]));

      const items = await (this.prisma as any).orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: start },
            status: { notIn: EXCLUDED_ORDER_STATUSES },
          },
        },
        select: {
          quantity: true,
          order: { select: { createdAt: true } },
          product: { select: { category: { select: { name: true } } } },
        },
      });

      const byCategory = new Map<string, { monthly: number[]; total: number }>();
      for (const item of items) {
        const created = new Date(item.order.createdAt);
        const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
        const idx = monthIndex.get(key);
        if (idx === undefined) continue;
        const catName = item.product?.category?.name ?? 'Uncategorized';
        let bucket = byCategory.get(catName);
        if (!bucket) {
          bucket = { monthly: new Array(12).fill(0), total: 0 };
          byCategory.set(catName, bucket);
        }
        bucket.monthly[idx] += item.quantity;
        bucket.total += item.quantity;
      }

      const categories = [...byCategory.entries()]
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 8)
        .map(([name, v]) => ({ name, monthly: v.monthly }));

      return { months, categories };
    } catch (err) {
      this.logger.error(`getSeasonalAnalysis failed: ${(err as Error).message}`);
      return empty;
    }
  }

  // ── Quick stats helper ─────────────────────────────────────
  private async getQuickStats() {
    try {
      const prisma = this.prisma as any;
      const [activeProducts, lowStockCount] = await Promise.all([
        prisma.product.count({ where: { isActive: true, deletedAt: null } }),
        prisma.product.count({
          where: {
            isActive: true,
            deletedAt: null,
            stockQuantity: { lte: prisma.product.fields.lowStockAlert },
          },
        }),
      ]);
      return { activeProducts, lowStockCount };
    } catch (err) {
      this.logger.error(`getQuickStats failed: ${(err as Error).message}`);
      return { activeProducts: 0, lowStockCount: 0 };
    }
  }

  // ── D) Dashboard aggregate ─────────────────────────────────
  async getDashboard() {
    const [festivals, trending, seasonal, stats] = await Promise.all([
      Promise.resolve(this.getUpcomingFestivals()),
      this.getTrendingProducts(),
      this.getSeasonalAnalysis(),
      this.getQuickStats(),
    ]);
    return { festivals, trending, seasonal, stats };
  }

  // ── Best sellers (last 90 days) for the forecast prompt ────
  private async getBestSellers(days = 90, take = 20) {
    try {
      const now = new Date();
      const since = new Date(now.getTime() - days * 86400000);
      const grouped = await (this.prisma as any).orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, totalPrice: true },
        where: {
          order: {
            createdAt: { gte: since },
            status: { notIn: EXCLUDED_ORDER_STATUSES },
          },
        },
        orderBy: { _sum: { quantity: 'desc' } },
        take,
      });
      if (grouped.length === 0) return [];

      const products = await (this.prisma as any).product.findMany({
        where: { id: { in: grouped.map((g: any) => g.productId) } },
        select: {
          id: true,
          name: true,
          stockQuantity: true,
          lowStockAlert: true,
          category: { select: { name: true } },
        },
      });
      const productMap = new Map<string, any>(products.map((p: any) => [p.id, p]));

      return grouped
        .map((g: any) => {
          const p = productMap.get(g.productId);
          if (!p) return null;
          return {
            productId: g.productId,
            name: p.name,
            category: p.category?.name ?? 'Uncategorized',
            unitsSold: g._sum?.quantity ?? 0,
            revenue: Number(g._sum?.totalPrice ?? 0),
            stockQuantity: p.stockQuantity,
            isLowStock: p.stockQuantity <= (p.lowStockAlert ?? 5),
          };
        })
        .filter(Boolean);
    } catch (err) {
      this.logger.error(`getBestSellers failed: ${(err as Error).message}`);
      return [];
    }
  }

  // ── E) AI forecast generation ──────────────────────────────
  async generateForecast() {
    const now = new Date();
    const dateLabel = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const report = await (this.prisma as any).predictionReport.create({
      data: {
        title: `Demand Forecast — ${dateLabel}`,
        periodLabel: 'Next 90 days',
        status: 'GENERATING',
      },
    });

    try {
      const [trending, seasonal, bestSellers] = await Promise.all([
        this.getTrendingProducts(),
        this.getSeasonalAnalysis(),
        this.getBestSellers(90, 20),
      ]);
      const festivals = this.getUpcomingFestivals().filter((f) => f.daysUntil <= 90);
      const lowStockBestSellers = bestSellers.filter((b: any) => b.isLowStock);

      const stats = {
        generatedAt: now.toISOString(),
        upcomingFestivals: festivals,
        trendingProducts: trending,
        seasonalAnalysis: seasonal,
        bestSellersLast90Days: bestSellers,
        lowStockBestSellers,
      };

      const provider = this.aiFactory.getProvider();
      if (!provider.isConfigured()) {
        return await (this.prisma as any).predictionReport.update({
          where: { id: report.id },
          data: {
            status: 'FAILED',
            statsSnapshot: stats,
            errorMessage: 'No AI provider configured. Set an API key in AI Studio settings.',
          },
        });
      }

      const systemPrompt =
        'You are a retail demand-forecasting analyst for UNKORA, an e-commerce store in Bangladesh. ' +
        'Write practical, specific stocking recommendations in English with section headings. ' +
        'Consider festival lead times, seasonal patterns, rising trends, and current stock levels. ' +
        'Format in Markdown.';

      const userPrompt = [
        `Today is ${dateLabel}. Below is our store data as JSON (currency is Bangladeshi Taka, ৳):`,
        '',
        '```json',
        JSON.stringify(stats, null, 2),
        '```',
        '',
        'Based on this data, produce a demand forecast for the next 90 days with these sections:',
        '1. Executive summary',
        '2. Festival preparation plan — specific product categories and quantity guidance per upcoming festival, respecting each lead time',
        '3. Trending products to restock now',
        '4. Products at risk of overstock',
        '5. Watchlist of potential upcoming trends',
      ].join('\n');

      const aiAnalysis = await provider.generateText(userPrompt, {
        systemPrompt,
        temperature: 0.3,
        maxTokens: 1500,
      });

      return await (this.prisma as any).predictionReport.update({
        where: { id: report.id },
        data: {
          status: 'COMPLETED',
          aiAnalysis,
          statsSnapshot: stats,
        },
      });
    } catch (err) {
      this.logger.error(`generateForecast failed: ${(err as Error).message}`);
      return await (this.prisma as any).predictionReport.update({
        where: { id: report.id },
        data: {
          status: 'FAILED',
          errorMessage: (err as Error).message ?? 'Forecast generation failed',
        },
      });
    }
  }

  // ── F) Reports CRUD ────────────────────────────────────────
  async listReports({ page = 1, limit = 20 }: { page?: number; limit?: number }) {
    const [data, total] = await Promise.all([
      (this.prisma as any).predictionReport.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          periodLabel: true,
          status: true,
          aiAnalysis: true,
          errorMessage: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      (this.prisma as any).predictionReport.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getReport(id: string) {
    const report = await (this.prisma as any).predictionReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Prediction report not found');
    return report;
  }

  async deleteReport(id: string) {
    await this.getReport(id);
    await (this.prisma as any).predictionReport.delete({ where: { id } });
    return { deleted: true };
  }
}
