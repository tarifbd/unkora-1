import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Prisma } from '@prisma/client';
import type { Cache } from 'cache-manager';

import { PrismaService } from '../../database/prisma.service';
import type { CreateProductDto } from './dto/create-product.dto';
import type { ProductQueryDto } from './dto/product-query.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import type { SetWholesaleDto } from './dto/wholesale.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findAll(query: ProductQueryDto) {
    const {
      page = 1, limit = 20, categoryId, categorySlug, search,
      minPrice, maxPrice, isFeatured, inStock, sortBy = 'createdAt',
      sortOrder = 'desc', tags,
    } = query;

    // Cache first-page, default-sort, filter-free requests for 60 seconds
    const isFirstPage = page === 1 && limit === 20 && !search && !categoryId && !categorySlug &&
      minPrice === undefined && maxPrice === undefined && isFeatured === undefined &&
      !inStock && sortBy === 'createdAt' && sortOrder === 'desc' && !tags;
    const cacheKey = 'products:all:p1';
    if (isFirstPage) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (categorySlug) {
      const cat = await this.prisma.category.findUnique({ where: { slug: categorySlug } });
      if (cat) where.categoryId = cat.id;
    } else if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
        { bookDetail: { author: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      } as Prisma.DecimalFilter;
    }

    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (inStock) where.stockQuantity = { gt: 0 };
    if (tags) where.tags = { hasSome: tags.split(',') };

    const validSortFields = ['name', 'basePrice', 'createdAt'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true } },
          bookDetail: { select: { author: true, language: true, genres: true } },
          labels: { include: { label: { select: { id: true, name: true, color: true, bgColor: true } } } },
          _count: { select: { reviews: true } },
        },
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };

    if (isFirstPage) {
      await this.cacheManager.set(cacheKey, result, 60 * 1000);
    }

    return result;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
        sizeGuide: true,
        warranty: true,
        colors: { include: { color: true } },
        labels: { include: { label: true } },
        variants: { where: { isActive: true } },
        bookDetail: true,
        reviews: {
          where: { isPublished: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reviews: true } },
      },
    });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');
    return product;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        category: true,
        variants: true,
        bookDetail: true,
        brand: { select: { id: true, name: true, slug: true } },
        sizeGuide: { select: { id: true, title: true } },
        warranty: { select: { id: true, title: true, duration: true } },
        colors: { include: { color: true } },
        labels: { include: { label: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findFeatured(limit = 8) {
    const cacheKey = 'products:featured';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const products = await this.prisma.product.findMany({
      where: { isActive: true, isFeatured: true, stockQuantity: { gt: 0 } },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { id: true, name: true, slug: true } },
        bookDetail: { select: { author: true } },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    await this.cacheManager.set(cacheKey, products, 300 * 1000);
    return products;
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Product slug already exists');

    const sku = dto.sku || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    // Only check duplicate if sku was provided
    if (dto.sku) {
      const skuExists = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
      if (skuExists) throw new ConflictException('SKU already exists');
    }

    const { bookDetail, imageUrl, colorIds, labelIds, ...productData } = dto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        sku,
        basePrice: productData.basePrice,
        salePrice: productData.salePrice ?? null,
        bookDetail: bookDetail ? { create: bookDetail } : undefined,
        colors: colorIds?.length
          ? { create: colorIds.map(colorId => ({ colorId })) }
          : undefined,
        labels: labelIds?.length
          ? { create: labelIds.map(labelId => ({ labelId })) }
          : undefined,
      },
      include: { bookDetail: true, category: true, images: true },
    });

    if (imageUrl) {
      await this.prisma.productImage.create({
        data: {
          productId: product.id,
          url: imageUrl,
          isPrimary: true,
        },
      });
    }

    await Promise.all([
      this.cacheManager.del('products:featured'),
      this.cacheManager.del('products:all:p1'),
    ]);

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);

    if (dto.slug) {
      const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) throw new ConflictException('Slug already exists');
    }

    const { bookDetail, imageUrl, colorIds, labelIds, ...productData } = dto;

    if (colorIds !== undefined) {
      await this.prisma.productColor.deleteMany({ where: { productId: id } });
      if (colorIds.length) {
        await this.prisma.productColor.createMany({
          data: colorIds.map(colorId => ({ productId: id, colorId })),
        });
      }
    }

    if (labelIds !== undefined) {
      await this.prisma.productLabelProduct.deleteMany({ where: { productId: id } });
      if (labelIds.length) {
        await this.prisma.productLabelProduct.createMany({
          data: labelIds.map(labelId => ({ productId: id, labelId })),
        });
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        bookDetail: bookDetail
          ? { upsert: { create: bookDetail, update: bookDetail } }
          : undefined,
      },
      include: { bookDetail: true, images: true },
    });

    if (imageUrl) {
      // Set all existing images to non-primary, then upsert primary
      await this.prisma.productImage.updateMany({
        where: { productId: id },
        data: { isPrimary: false },
      });
      // Check if image with this URL already exists
      const existingImage = await this.prisma.productImage.findFirst({
        where: { productId: id, url: imageUrl },
      });
      if (existingImage) {
        await this.prisma.productImage.update({
          where: { id: existingImage.id },
          data: { isPrimary: true },
        });
      } else {
        await this.prisma.productImage.create({
          data: { productId: id, url: imageUrl, isPrimary: true },
        });
      }
    }

    await Promise.all([
      this.cacheManager.del('products:featured'),
      this.cacheManager.del('products:all:p1'),
    ]);

    return product;
  }

  async remove(id: string) {
    await this.findById(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await Promise.all([
      this.cacheManager.del('products:featured'),
      this.cacheManager.del('products:all:p1'),
    ]);

    return product;
  }

  async addImage(productId: string, url: string, alt?: string, isPrimary = false) {
    await this.findById(productId);
    if (isPrimary) {
      await this.prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
    }
    return this.prisma.productImage.create({ data: { productId, url, alt, isPrimary } });
  }

  async removeImage(imageId: string) {
    return this.prisma.productImage.delete({ where: { id: imageId } });
  }

  async updateStock(id: string, quantity: number) {
    return this.prisma.product.update({
      where: { id },
      data: { stockQuantity: quantity },
    });
  }

  async exportCsv(): Promise<string> {
    const products = await this.prisma.product.findMany({
      include: { category: true, brand: true, images: { take: 1 } },
      take: 10000,
    });

    const headers = ['ID', 'Name', 'Slug', 'Category', 'Brand', 'Base Price', 'Sale Price', 'Stock', 'Status', 'Created At'];
    const rows = products.map((p: any) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.slug,
      p.category?.name ?? '',
      p.brand?.name ?? '',
      Number(p.basePrice),
      Number(p.salePrice ?? 0),
      p.stockQuantity,
      p.status ?? (p.isActive ? 'ACTIVE' : 'INACTIVE'),
      p.createdAt.toISOString(),
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  async getWholesaleTiers(productId: string) {
    await this.findById(productId);
    return this.prisma.wholesalePrice.findMany({
      where: { productId },
      orderBy: { minQty: 'asc' },
    });
  }

  async setWholesaleTiers(productId: string, dto: SetWholesaleDto) {
    await this.findById(productId);
    return this.prisma.$transaction(async (tx) => {
      await tx.wholesalePrice.deleteMany({ where: { productId } });
      if (dto.tiers.length === 0) return [];
      await tx.wholesalePrice.createMany({
        data: dto.tiers.map((tier) => ({
          productId,
          minQty: tier.minQty,
          price: tier.price,
        })),
      });
      return tx.wholesalePrice.findMany({
        where: { productId },
        orderBy: { minQty: 'asc' },
      });
    });
  }
}
