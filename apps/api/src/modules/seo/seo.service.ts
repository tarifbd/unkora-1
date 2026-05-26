import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SeoService {
  constructor(private prisma: PrismaService) {}

  async getProducts(params: {
    page?: number;
    limit?: number;
    missingMeta?: boolean;
  }) {
    const { page = 1, limit = 20, missingMeta } = params;

    const where: any = { deletedAt: null };
    if (missingMeta) {
      where.OR = [{ metaTitle: null }, { metaDesc: null }];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          isActive: true,
          metaTitle: true,
          metaDesc: true,
          metaKeywords: true,
          category: { select: { id: true, name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const enriched = data.map((p) => ({
      ...p,
      hasMetaTitle: Boolean(p.metaTitle),
      hasMetaDesc: Boolean(p.metaDesc),
      keywordCount: p.metaKeywords
        ? p.metaKeywords.split(',').filter(Boolean).length
        : 0,
    }));

    return {
      data: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async getStats() {
    const [
      totalProducts,
      productsWithMetaTitle,
      productsWithMetaDesc,
      productsWithKeywords,
      totalCategories,
      categoriesWithDesc,
    ] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.product.count({
        where: { deletedAt: null, metaTitle: { not: null } },
      }),
      this.prisma.product.count({
        where: { deletedAt: null, metaDesc: { not: null } },
      }),
      this.prisma.product.count({
        where: { deletedAt: null, metaKeywords: { not: null } },
      }),
      this.prisma.category.count(),
      this.prisma.category.count({
        where: { description: { not: null } },
      }),
    ]);

    const metaTitlePct =
      totalProducts > 0
        ? Math.round((productsWithMetaTitle / totalProducts) * 100)
        : 0;
    const metaDescPct =
      totalProducts > 0
        ? Math.round((productsWithMetaDesc / totalProducts) * 100)
        : 0;
    const keywordsPct =
      totalProducts > 0
        ? Math.round((productsWithKeywords / totalProducts) * 100)
        : 0;

    return {
      totalProducts,
      productsWithMetaTitle,
      productsWithoutMetaTitle: totalProducts - productsWithMetaTitle,
      productsWithMetaDesc,
      productsWithoutMetaDesc: totalProducts - productsWithMetaDesc,
      productsWithKeywords,
      totalCategories,
      categoriesWithDesc,
      categoriesWithoutDesc: totalCategories - categoriesWithDesc,
      metaTitlePct,
      metaDescPct,
      keywordsPct,
    };
  }

  async updateProduct(
    id: string,
    dto: { metaTitle?: string; metaDesc?: string; metaKeywords?: string },
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.metaTitle !== undefined && { metaTitle: dto.metaTitle }),
        ...(dto.metaDesc !== undefined && { metaDesc: dto.metaDesc }),
        ...(dto.metaKeywords !== undefined && { metaKeywords: dto.metaKeywords }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        metaTitle: true,
        metaDesc: true,
        metaKeywords: true,
      },
    });
  }

  async getSitemapInfo() {
    const [totalProducts, activeProducts, totalCategories, activeCategories] =
      await Promise.all([
        this.prisma.product.count({ where: { deletedAt: null } }),
        this.prisma.product.count({ where: { deletedAt: null, isActive: true } }),
        this.prisma.category.count(),
        this.prisma.category.count({ where: { isActive: true } }),
      ]);

    return {
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: totalProducts - activeProducts,
      },
      categories: {
        total: totalCategories,
        active: activeCategories,
        inactive: totalCategories - activeCategories,
      },
      estimatedUrls: activeProducts + activeCategories + 10, // +10 for static pages
    };
  }
}
