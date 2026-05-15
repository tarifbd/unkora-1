import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Prisma } from '@prisma/client';
import type { Cache } from 'cache-manager';

import { PrismaService } from '../../database/prisma.service';
import type { CreateProductDto } from './dto/create-product.dto';
import type { ProductQueryDto } from './dto/product-query.dto';
import type { UpdateProductDto } from './dto/update-product.dto';

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
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
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
          bookDetail: { select: { author: true, language: true, genres: true } },
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
      include: { images: true, category: true, variants: true, bookDetail: true },
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

    const skuExists = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (skuExists) throw new ConflictException('SKU already exists');

    const { bookDetail, ...productData } = dto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        basePrice: productData.basePrice,
        salePrice: productData.salePrice ?? null,
        bookDetail: bookDetail ? { create: bookDetail } : undefined,
      },
      include: { bookDetail: true, category: true },
    });

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

    const { bookDetail, ...productData } = dto;

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
}
