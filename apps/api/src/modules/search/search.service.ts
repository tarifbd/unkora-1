import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../database/prisma.service';

interface TypesenseDocument {
  id: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  salePrice?: number;
  category: string;
  categorySlug: string;
  imageUrl?: string;
  isBook: boolean;
  author?: string;
  publisher?: string;
  language?: string;
  genres?: string[];
  tags: string[];
  inStock: boolean;
  isFeatured: boolean;
  createdAt: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: any = null;
  private readonly collectionName = 'products';

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      const Typesense = await import('typesense' as string).catch(() => null);
      if (!Typesense) return;

      this.client = new Typesense.Client({
        nodes: [{ host: this.config.get('TYPESENSE_HOST') ?? 'localhost', port: parseInt(this.config.get('TYPESENSE_PORT') ?? '8108', 10), protocol: this.config.get('TYPESENSE_PROTOCOL') ?? 'http' }],
        apiKey: this.config.get('TYPESENSE_API_KEY') ?? 'dev-key',
        connectionTimeoutSeconds: 5,
      });

      await this.ensureCollection();
      this.logger.log('Typesense connected');
    } catch {
      this.logger.warn('Typesense not available — search disabled');
    }
  }

  private async ensureCollection() {
    if (!this.client) return;
    try {
      await this.client.collections(this.collectionName).retrieve();
    } catch {
      await this.client.collections().create({
        name: this.collectionName,
        fields: [
          { name: 'name', type: 'string' },
          { name: 'slug', type: 'string' },
          { name: 'description', type: 'string', optional: true },
          { name: 'basePrice', type: 'float' },
          { name: 'category', type: 'string', facet: true },
          { name: 'categorySlug', type: 'string', facet: true },
          { name: 'isBook', type: 'bool', facet: true },
          { name: 'author', type: 'string', optional: true, facet: true },
          { name: 'language', type: 'string', optional: true, facet: true },
          { name: 'genres', type: 'string[]', optional: true, facet: true },
          { name: 'tags', type: 'string[]', facet: true },
          { name: 'inStock', type: 'bool', facet: true },
          { name: 'isFeatured', type: 'bool', facet: true },
          { name: 'createdAt', type: 'int64' },
        ],
        default_sorting_field: 'createdAt',
      });
    }
  }

  async search(q: string, options: { page?: number; limit?: number; categorySlug?: string; inStock?: boolean } = {}) {
    if (!this.client) return this.fallbackSearch(q, options);

    const { page = 1, limit = 20, categorySlug, inStock } = options;
    const filterBy: string[] = [];
    if (categorySlug) filterBy.push(`categorySlug:=${categorySlug}`);
    if (inStock !== undefined) filterBy.push(`inStock:=${inStock}`);

    try {
      const result = await this.client.collections(this.collectionName).documents().search({
        q,
        query_by: 'name,description,author,publisher,tags',
        filter_by: filterBy.join(' && ') || undefined,
        page,
        per_page: limit,
        sort_by: '_text_match:desc,createdAt:desc',
      });
      return { data: result.hits?.map((h: any) => h.document) ?? [], meta: { total: result.found ?? 0, page, limit } };
    } catch {
      return this.fallbackSearch(q, options);
    }
  }

  private async fallbackSearch(q: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = options;
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { bookDetail: { author: { contains: q, mode: 'insensitive' } } },
            { tags: { has: q } },
          ],
        },
        include: { images: { where: { isPrimary: true }, take: 1 }, category: true, bookDetail: { select: { author: true } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where: { isActive: true, OR: [{ name: { contains: q, mode: 'insensitive' } }] } }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async indexProduct(productId: string) {
    if (!this.client) return;
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, images: { where: { isPrimary: true }, take: 1 }, bookDetail: true },
    });
    if (!product) return;

    const doc: TypesenseDocument = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description ?? undefined,
      basePrice: Number(product.basePrice),
      salePrice: product.salePrice ? Number(product.salePrice) : undefined,
      category: product.category.name,
      categorySlug: product.category.slug,
      imageUrl: product.images[0]?.url,
      isBook: !!product.bookDetail,
      author: product.bookDetail?.author,
      publisher: product.bookDetail?.publisher ?? undefined,
      language: product.bookDetail?.language,
      genres: product.bookDetail?.genres ?? [],
      tags: product.tags,
      inStock: product.stockQuantity > 0,
      isFeatured: product.isFeatured,
      createdAt: product.createdAt.getTime(),
    };

    try {
      await this.client.collections(this.collectionName).documents().upsert(doc);
    } catch (err) {
      this.logger.error('Failed to index product', err);
    }
  }

  async deleteFromIndex(productId: string) {
    if (!this.client) return;
    try {
      await this.client.collections(this.collectionName).documents(productId).delete();
    } catch {}
  }
}
