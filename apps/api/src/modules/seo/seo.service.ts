import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UpsertSeoMetadataDto } from './dto/upsert-seo-metadata.dto';
import { CreateRedirectDto } from './dto/create-redirect.dto';
import { UpdateSitemapEntryDto } from './dto/update-sitemap-entry.dto';
import { UpdateSeoSettingsDto } from './dto/update-seo-settings.dto';

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────────

  async getDashboard() {
    const [
      totalMetadata,
      missingMetaTitleCount,
      missingMetaDescriptionCount,
      poorSeoScoreCount,
      sitemapUrlCount,
      activeRedirectCount,
      recentAudits,
      totalProducts,
      totalCategories,
    ] = await Promise.all([
      this.prisma.seoMetadata.count(),
      this.prisma.seoMetadata.count({ where: { seoTitle: null } }),
      this.prisma.seoMetadata.count({ where: { metaDescription: null } }),
      this.prisma.seoMetadata.count({ where: { seoScore: { lt: 40 } } }),
      this.prisma.seoSitemapEntry.count({ where: { includeInSitemap: true } }),
      this.prisma.seoRedirect.count({ where: { isActive: true } }),
      this.prisma.seoAudit.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          entityType: true,
          entityId: true,
          score: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.category.count(),
    ]);

    const totalIndexablePages = totalProducts + totalCategories;

    // Detect duplicate titles
    const titleGroups = await this.prisma.seoMetadata.groupBy({
      by: ['seoTitle'],
      where: { seoTitle: { not: null } },
      having: { seoTitle: { _count: { gt: 1 } } },
      _count: { seoTitle: true },
    });
    const duplicateTitleCount = titleGroups.length;

    return {
      totalIndexablePages,
      totalSeoMetadataRecords: totalMetadata,
      missingMetaTitleCount,
      missingMetaDescriptionCount,
      duplicateTitleCount,
      poorSeoScoreCount,
      sitemapUrlCount,
      activeRedirectCount,
      recentAudits,
      summary: {
        totalProducts,
        totalCategories,
      },
    };
  }

  // ─── Metadata CRUD ────────────────────────────────────────────────────────────

  async listMetadata(params: {
    entityType?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (params.entityType) where.entityType = params.entityType;

    const [data, total] = await Promise.all([
      this.prisma.seoMetadata.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.seoMetadata.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private toSeoMetadataData(dto: UpsertSeoMetadataDto): Record<string, unknown> {
    const { secondaryKeywordsJson, schemaJson, hreflangJson, ...rest } = dto;
    return {
      ...rest,
      ...(secondaryKeywordsJson !== undefined && {
        secondaryKeywordsJson: secondaryKeywordsJson as Prisma.InputJsonValue,
      }),
      ...(schemaJson !== undefined && { schemaJson: schemaJson as Prisma.InputJsonValue }),
      ...(hreflangJson !== undefined && { hreflangJson: hreflangJson as Prisma.InputJsonValue }),
    };
  }

  async createMetadata(entityType: string, entityId: string, dto: UpsertSeoMetadataDto) {
    return this.prisma.seoMetadata.create({
      data: {
        entityType: entityType as any,
        entityId,
        ...this.toSeoMetadataData(dto),
      } as any,
    });
  }

  async getMetadata(id: string) {
    const record = await this.prisma.seoMetadata.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('SEO metadata not found');
    return record;
  }

  async updateMetadata(id: string, dto: UpsertSeoMetadataDto) {
    await this.getMetadata(id);
    return this.prisma.seoMetadata.update({ where: { id }, data: this.toSeoMetadataData(dto) as any });
  }

  async deleteMetadata(id: string) {
    await this.getMetadata(id);
    return this.prisma.seoMetadata.delete({ where: { id } });
  }

  async getEntitySeo(entityType: string, entityId: string) {
    return this.prisma.seoMetadata.upsert({
      where: { entityType_entityId: { entityType: entityType as any, entityId } },
      create: { entityType: entityType as any, entityId },
      update: {},
    });
  }

  async upsertEntitySeo(entityType: string, entityId: string, dto: UpsertSeoMetadataDto) {
    const data = this.toSeoMetadataData(dto);
    return this.prisma.seoMetadata.upsert({
      where: { entityType_entityId: { entityType: entityType as any, entityId } },
      create: { entityType: entityType as any, entityId, ...data } as any,
      update: data as any,
    });
  }

  // ─── Product SEO ──────────────────────────────────────────────────────────────

  async getProductsSeo(params: { page?: number; limit?: number; missingMeta?: boolean }) {
    const { page = 1, limit = 20, missingMeta } = params;
    const where: any = { deletedAt: null };
    if (missingMeta) {
      where.OR = [{ metaTitle: null }, { metaDesc: null }];
    }

    const [products, total] = await Promise.all([
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

    const productIds = products.map((p) => p.id);
    const seoMetadataList = await this.prisma.seoMetadata.findMany({
      where: { entityType: 'PRODUCT', entityId: { in: productIds } },
    });
    const seoMap = Object.fromEntries(seoMetadataList.map((s) => [s.entityId, s]));

    const enriched = products.map((p) => ({
      ...p,
      hasMetaTitle: Boolean(p.metaTitle),
      hasMetaDesc: Boolean(p.metaDesc),
      keywordCount: p.metaKeywords ? p.metaKeywords.split(',').filter(Boolean).length : 0,
      seoMetadata: seoMap[p.id] ?? null,
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

  async getProductSeo(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const seoMetadata = await this.getEntitySeo('PRODUCT', productId);
    const imageAlts = await this.prisma.seoImageAlt.findMany({
      where: { entityType: 'PRODUCT', entityId: productId },
    });

    return { ...product, seoMetadata, imageAlts };
  }

  async updateProductSeo(productId: string, dto: UpsertSeoMetadataDto & { metaTitle?: string; metaDesc?: string; metaKeywords?: string }) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');

    const updates: Record<string, unknown> = {};
    if (dto.metaTitle !== undefined) updates.metaTitle = dto.metaTitle;
    if (dto.metaDesc !== undefined) updates.metaDesc = dto.metaDesc;
    if (dto.metaKeywords !== undefined) updates.metaKeywords = dto.metaKeywords;

    if (Object.keys(updates).length > 0) {
      await this.prisma.product.update({ where: { id: productId }, data: updates });
    }

    const { metaTitle: _mt, metaDesc: _md, metaKeywords: _mk, ...seoDto } = dto;
    return this.upsertEntitySeo('PRODUCT', productId, seoDto);
  }

  async generateProductSchema(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: (product as any).description ?? '',
      sku: product.sku,
      category: (product as any).category?.name ?? '',
      offers: {
        '@type': 'Offer',
        priceCurrency: 'BDT',
        price: (product as any).price ?? 0,
        availability: 'https://schema.org/InStock',
        url: `https://unkora.com/products/${product.slug}`,
      },
    };
  }

  // ─── Category SEO ─────────────────────────────────────────────────────────────

  async getCategoriesSeo(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          description: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.category.count(),
    ]);

    const categoryIds = categories.map((c) => c.id);
    const seoMetadataList = await this.prisma.seoMetadata.findMany({
      where: { entityType: 'CATEGORY', entityId: { in: categoryIds } },
    });
    const seoMap = Object.fromEntries(seoMetadataList.map((s) => [s.entityId, s]));

    return {
      data: categories.map((c) => ({ ...c, seoMetadata: seoMap[c.id] ?? null })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCategorySeo(categoryId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    const seoMetadata = await this.getEntitySeo('CATEGORY', categoryId);
    return { ...category, seoMetadata };
  }

  async updateCategorySeo(categoryId: string, dto: UpsertSeoMetadataDto) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Category not found');
    return this.upsertEntitySeo('CATEGORY', categoryId, dto);
  }

  // ─── SEO Audit ────────────────────────────────────────────────────────────────

  async auditEntity(entityType: string, entityId: string, url?: string) {
    const seoMeta = await this.prisma.seoMetadata.findUnique({
      where: { entityType_entityId: { entityType: entityType as any, entityId } },
    });

    let entityDescription = '';
    let hasImages = false;

    if (entityType === 'PRODUCT') {
      const product = await this.prisma.product.findFirst({
        where: { id: entityId, deletedAt: null },
        select: { metaTitle: true, metaDesc: true, metaKeywords: true, name: true },
      });
      if (!product) throw new NotFoundException('Product not found');
      entityDescription = (product as any).description ?? '';
      hasImages = true; // assume product has images
    } else if (entityType === 'CATEGORY') {
      const category = await this.prisma.category.findUnique({
        where: { id: entityId },
        select: { description: true, name: true },
      });
      if (!category) throw new NotFoundException('Category not found');
      entityDescription = category.description ?? '';
    }

    // Internal links
    const internalLinkCount = await this.prisma.seoInternalLink.count({
      where: { sourceEntityId: entityId, isActive: true },
    });

    // Image alts
    const imageAltCount = await this.prisma.seoImageAlt.count({
      where: { entityId },
    });

    // Scoring algorithm
    let score = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];

    const title = seoMeta?.seoTitle;
    const desc = seoMeta?.metaDescription;
    const focusKw = seoMeta?.focusKeyword;
    const slug = seoMeta?.slug;

    // SEO Title (+10 if exists, +8 if 30-60 chars)
    if (title) {
      score += 10;
      if (title.length >= 30 && title.length <= 60) {
        score += 8;
      } else {
        issues.push(`SEO title length is ${title.length} chars (ideal: 30-60)`);
        suggestions.push('Adjust your SEO title to be between 30 and 60 characters');
      }
    } else {
      issues.push('SEO title is missing');
      suggestions.push('Add a descriptive SEO title between 30-60 characters');
    }

    // Meta Description (+10 if exists, +8 if 120-160 chars)
    if (desc) {
      score += 10;
      if (desc.length >= 120 && desc.length <= 160) {
        score += 8;
      } else {
        issues.push(`Meta description length is ${desc.length} chars (ideal: 120-160)`);
        suggestions.push('Adjust your meta description to be between 120 and 160 characters');
      }
    } else {
      issues.push('Meta description is missing');
      suggestions.push('Add a compelling meta description between 120-160 characters');
    }

    // Focus Keyword (+8 if exists)
    if (focusKw) {
      score += 8;
      // Focus keyword in title (+8)
      if (title && title.toLowerCase().includes(focusKw.toLowerCase())) {
        score += 8;
      } else {
        issues.push('Focus keyword not found in SEO title');
        suggestions.push(`Include "${focusKw}" in your SEO title`);
      }
      // Focus keyword in meta desc (+8)
      if (desc && desc.toLowerCase().includes(focusKw.toLowerCase())) {
        score += 8;
      } else {
        issues.push('Focus keyword not found in meta description');
        suggestions.push(`Include "${focusKw}" in your meta description`);
      }
    } else {
      issues.push('No focus keyword set');
      suggestions.push('Set a primary focus keyword for this page');
    }

    // Slug quality (+6)
    if (slug) {
      const isCleanSlug = /^[a-z0-9-]+$/.test(slug);
      if (isCleanSlug) {
        score += 6;
      } else {
        issues.push('Slug contains uppercase letters or special characters');
        suggestions.push('Use lowercase letters and hyphens only in the URL slug');
      }
    } else {
      issues.push('No URL slug defined');
      suggestions.push('Add a clean, lowercase URL slug');
    }

    // Image alt text (+6)
    if (imageAltCount > 0 || hasImages) {
      if (imageAltCount > 0) {
        score += 6;
      } else {
        issues.push('Images are missing alt text');
        suggestions.push('Add descriptive alt text to all product images');
      }
    }

    // Open Graph (+6)
    if (seoMeta?.ogTitle && seoMeta?.ogDescription && seoMeta?.ogImage) {
      score += 6;
    } else {
      issues.push('Open Graph data is incomplete (ogTitle, ogDescription, ogImage needed)');
      suggestions.push('Add Open Graph metadata for better social media sharing');
    }

    // Schema markup (+8)
    if (seoMeta?.schemaJson) {
      score += 8;
    } else {
      issues.push('No structured data / schema markup defined');
      suggestions.push('Add JSON-LD schema markup for rich search results');
    }

    // Robots index (+6)
    if (seoMeta?.robotsIndex !== false) {
      score += 6;
    } else {
      issues.push('Page is set to noindex — it will not appear in search results');
      suggestions.push('Enable indexing unless you have a specific reason to noindex');
    }

    // Internal links (+4)
    if (internalLinkCount > 0) {
      score += 4;
    } else {
      issues.push('No internal links configured for this page');
      suggestions.push('Add internal links to improve site structure and crawlability');
    }

    // Content length (+4)
    if (entityDescription && entityDescription.length > 100) {
      score += 4;
    } else {
      issues.push('Page content/description is too short (under 100 chars)');
      suggestions.push('Add detailed content of at least 300 words for better SEO');
    }

    // Cap at 100
    score = Math.min(100, score);

    const auditStatus: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' =
      score >= 70 ? 'GOOD' : score >= 40 ? 'NEEDS_IMPROVEMENT' : 'POOR';

    // Save audit record
    const audit = await this.prisma.seoAudit.create({
      data: {
        entityType: entityType as any,
        entityId,
        url,
        score,
        status: auditStatus as any,
        issuesJson: issues,
        suggestionsJson: suggestions,
      },
    });

    // Update seo score on metadata
    if (seoMeta) {
      await this.prisma.seoMetadata.update({
        where: { id: seoMeta.id },
        data: { seoScore: score, lastAuditedAt: new Date() },
      });
    }

    return {
      id: audit.id,
      score,
      status: auditStatus,
      issues,
      suggestions,
      entityType,
      entityId,
      url,
    };
  }

  // ─── Redirects ────────────────────────────────────────────────────────────────

  async listRedirects(params: { page?: number; limit?: number; isActive?: boolean }) {
    const { page = 1, limit = 50 } = params;
    const where: Record<string, unknown> = {};
    if (params.isActive !== undefined) where.isActive = params.isActive;

    const [data, total] = await Promise.all([
      this.prisma.seoRedirect.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.seoRedirect.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createRedirect(dto: CreateRedirectDto) {
    if (dto.sourcePath === dto.targetPath) {
      throw new BadRequestException('Source path and target path cannot be the same');
    }

    // Check for redirect loop
    const existing = await this.prisma.seoRedirect.findUnique({
      where: { sourcePath: dto.targetPath },
    });
    if (existing && existing.targetPath === dto.sourcePath) {
      throw new BadRequestException('This would create a redirect loop');
    }

    return this.prisma.seoRedirect.create({
      data: {
        sourcePath: dto.sourcePath,
        targetPath: dto.targetPath,
        statusCode: (dto.statusCode ?? 'R301') as any,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async getRedirect(id: string) {
    const redirect = await this.prisma.seoRedirect.findUnique({ where: { id } });
    if (!redirect) throw new NotFoundException('Redirect not found');
    return redirect;
  }

  async updateRedirect(id: string, dto: Partial<CreateRedirectDto>) {
    await this.getRedirect(id);
    if (dto.sourcePath && dto.targetPath && dto.sourcePath === dto.targetPath) {
      throw new BadRequestException('Source path and target path cannot be the same');
    }
    return this.prisma.seoRedirect.update({
      where: { id },
      data: {
        ...(dto.sourcePath !== undefined && { sourcePath: dto.sourcePath }),
        ...(dto.targetPath !== undefined && { targetPath: dto.targetPath }),
        ...(dto.statusCode !== undefined && { statusCode: dto.statusCode as any }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteRedirect(id: string) {
    await this.getRedirect(id);
    return this.prisma.seoRedirect.delete({ where: { id } });
  }

  // ─── Sitemap ──────────────────────────────────────────────────────────────────

  async getSitemap() {
    return this.prisma.seoSitemapEntry.findMany({
      orderBy: { priority: 'desc' },
    });
  }

  async regenerateSitemap() {
    const [products, categories] = await Promise.all([
      this.prisma.product.findMany({
        where: { deletedAt: null, isActive: true },
        select: { id: true, slug: true, updatedAt: true },
      }),
      this.prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, updatedAt: true },
      }),
    ]);

    const baseUrl = this.config.get<string>('SITE_URL') ?? 'https://unkora.com';
    const upsertOps: Promise<unknown>[] = [];

    for (const product of products) {
      const url = `${baseUrl}/products/${product.slug}`;
      upsertOps.push(
        this.prisma.seoSitemapEntry.upsert({
          where: { url },
          create: {
            url,
            entityType: 'PRODUCT',
            entityId: product.id,
            priority: 0.8,
            changeFrequency: 'weekly',
            lastModified: product.updatedAt,
          },
          update: { lastModified: product.updatedAt },
        }),
      );
    }

    for (const category of categories) {
      const url = `${baseUrl}/categories/${category.slug}`;
      upsertOps.push(
        this.prisma.seoSitemapEntry.upsert({
          where: { url },
          create: {
            url,
            entityType: 'CATEGORY',
            entityId: category.id,
            priority: 0.6,
            changeFrequency: 'weekly',
            lastModified: category.updatedAt,
          },
          update: { lastModified: category.updatedAt },
        }),
      );
    }

    // Static pages
    const staticPages = ['', '/about', '/contact', '/blog', '/brands', '/deals'];
    for (const path of staticPages) {
      const url = `${baseUrl}${path}`;
      upsertOps.push(
        this.prisma.seoSitemapEntry.upsert({
          where: { url },
          create: {
            url,
            entityType: 'PAGE',
            priority: path === '' ? 1.0 : 0.5,
            changeFrequency: 'daily',
          },
          update: {},
        }),
      );
    }

    await Promise.all(upsertOps);

    const count = await this.prisma.seoSitemapEntry.count({ where: { includeInSitemap: true } });
    return { count, message: `Sitemap regenerated with ${count} URLs` };
  }

  async updateSitemapEntry(id: string, dto: UpdateSitemapEntryDto) {
    const entry = await this.prisma.seoSitemapEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Sitemap entry not found');
    return this.prisma.seoSitemapEntry.update({ where: { id }, data: dto });
  }

  async generateSitemapXml(): Promise<string> {
    const entries = await this.prisma.seoSitemapEntry.findMany({
      where: { includeInSitemap: true },
      orderBy: { priority: 'desc' },
    });

    const urlEntries = entries
      .map((e) => {
        const lastmod = e.lastModified
          ? `<lastmod>${e.lastModified.toISOString().split('T')[0]}</lastmod>`
          : '';
        return `  <url>
    <loc>${e.url}</loc>
    ${lastmod}
    <changefreq>${e.changeFrequency}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
  }

  // ─── Robots ───────────────────────────────────────────────────────────────────

  async getRobots(): Promise<string> {
    const settings = await this.getSettings();
    return (
      settings.robotsTxt ??
      `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /account/

Sitemap: ${this.config.get<string>('SITE_URL') ?? 'https://unkora.com'}/sitemap.xml`
    );
  }

  async updateRobots(robotsTxt: string) {
    // Validate no dangerous patterns
    const dangerousPatterns = ['<script', 'javascript:', 'data:'];
    for (const pattern of dangerousPatterns) {
      if (robotsTxt.toLowerCase().includes(pattern)) {
        throw new BadRequestException(`robots.txt contains potentially dangerous content: ${pattern}`);
      }
    }

    return this.prisma.seoSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', robotsTxt },
      update: { robotsTxt },
    });
  }

  // ─── Image Alts ───────────────────────────────────────────────────────────────

  async listImageAlts(params: { entityType?: string; entityId?: string; page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = params;
    const where: Record<string, unknown> = {};
    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;

    const [data, total] = await Promise.all([
      this.prisma.seoImageAlt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.seoImageAlt.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createImageAlt(dto: {
    entityType: string;
    entityId: string;
    imageUrl: string;
    altText: string;
    titleText?: string;
  }) {
    return this.prisma.seoImageAlt.create({
      data: {
        entityType: dto.entityType as any,
        entityId: dto.entityId,
        imageUrl: dto.imageUrl,
        altText: dto.altText,
        titleText: dto.titleText,
      },
    });
  }

  async updateImageAlt(id: string, dto: { altText?: string; titleText?: string }) {
    const record = await this.prisma.seoImageAlt.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Image alt record not found');
    return this.prisma.seoImageAlt.update({ where: { id }, data: dto });
  }

  // ─── Settings ─────────────────────────────────────────────────────────────────

  async getSettings() {
    return this.prisma.seoSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton' },
      update: {},
    });
  }

  async updateSettings(dto: UpdateSeoSettingsDto) {
    return this.prisma.seoSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...dto },
      update: { ...dto },
    });
  }

  // ─── Audits ───────────────────────────────────────────────────────────────────

  async listAudits(params: { entityType?: string; page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = params;
    const where: Record<string, unknown> = {};
    if (params.entityType) where.entityType = params.entityType;

    const [data, total] = await Promise.all([
      this.prisma.seoAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.seoAudit.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getAudit(id: string) {
    const audit = await this.prisma.seoAudit.findUnique({ where: { id } });
    if (!audit) throw new NotFoundException('Audit not found');
    return audit;
  }

  async bulkAudit(entityType: string) {
    let entities: Array<{ id: string }> = [];

    if (entityType === 'PRODUCT') {
      entities = await this.prisma.product.findMany({
        where: { deletedAt: null },
        select: { id: true },
        take: 100,
      });
    } else if (entityType === 'CATEGORY') {
      entities = await this.prisma.category.findMany({
        select: { id: true },
        take: 100,
      });
    }

    const results: Array<{ entityId: string; score: number; status: string }> = [];
    for (const entity of entities) {
      try {
        const result = await this.auditEntity(entityType, entity.id);
        results.push({ entityId: entity.id, score: result.score, status: result.status });
      } catch (e) {
        this.logger.warn(`Audit failed for ${entityType} ${entity.id}: ${(e as Error).message}`);
        results.push({ entityId: entity.id, score: 0, status: 'ERROR' });
      }
    }

    return {
      total: results.length,
      audited: results.filter((r) => r.status !== 'ERROR').length,
      failed: results.filter((r) => r.status === 'ERROR').length,
      results,
    };
  }

  // ─── Legacy compatibility ─────────────────────────────────────────────────────

  async getProducts(params: { page?: number; limit?: number; missingMeta?: boolean }) {
    return this.getProductsSeo(params);
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
      this.prisma.product.count({ where: { deletedAt: null, metaTitle: { not: null } } }),
      this.prisma.product.count({ where: { deletedAt: null, metaDesc: { not: null } } }),
      this.prisma.product.count({ where: { deletedAt: null, metaKeywords: { not: null } } }),
      this.prisma.category.count(),
      this.prisma.category.count({ where: { description: { not: null } } }),
    ]);

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
      metaTitlePct: totalProducts > 0 ? Math.round((productsWithMetaTitle / totalProducts) * 100) : 0,
      metaDescPct: totalProducts > 0 ? Math.round((productsWithMetaDesc / totalProducts) * 100) : 0,
      keywordsPct: totalProducts > 0 ? Math.round((productsWithKeywords / totalProducts) * 100) : 0,
    };
  }

  async updateProduct(
    id: string,
    dto: { metaTitle?: string; metaDesc?: string; metaKeywords?: string },
  ) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.metaTitle !== undefined && { metaTitle: dto.metaTitle }),
        ...(dto.metaDesc !== undefined && { metaDesc: dto.metaDesc }),
        ...(dto.metaKeywords !== undefined && { metaKeywords: dto.metaKeywords }),
      },
      select: { id: true, name: true, slug: true, metaTitle: true, metaDesc: true, metaKeywords: true },
    });
  }

  async getSitemapInfo() {
    const [totalProducts, activeProducts, totalCategories, activeCategories] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.product.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.category.count(),
      this.prisma.category.count({ where: { isActive: true } }),
    ]);

    return {
      products: { total: totalProducts, active: activeProducts, inactive: totalProducts - activeProducts },
      categories: { total: totalCategories, active: activeCategories, inactive: totalCategories - activeCategories },
      estimatedUrls: activeProducts + activeCategories + 10,
    };
  }
}
