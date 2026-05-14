import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@unkora/database';

import { PrismaService } from '../../database/prisma.service';
import type { CreateProductDto } from './dto/create-product.dto';
import type { ProductQueryDto } from './dto/product-query.dto';
import type { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const {
      page = 1, limit = 20, categoryId, categorySlug, search,
      minPrice, maxPrice, isFeatured, inStock, sortBy = 'createdAt',
      sortOrder = 'desc', tags,
    } = query;

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

    return {
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
    return this.prisma.product.findMany({
      where: { isActive: true, isFeatured: true, stockQuantity: { gt: 0 } },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { id: true, name: true, slug: true } },
        bookDetail: { select: { author: true } },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Product slug already exists');

    const skuExists = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (skuExists) throw new ConflictException('SKU already exists');

    const { bookDetail, ...productData } = dto;

    return this.prisma.product.create({
      data: {
        ...productData,
        basePrice: productData.basePrice,
        salePrice: productData.salePrice ?? null,
        bookDetail: bookDetail ? { create: bookDetail } : undefined,
      },
      include: { bookDetail: true, category: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);

    if (dto.slug) {
      const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) throw new ConflictException('Slug already exists');
    }

    const { bookDetail, ...productData } = dto;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        bookDetail: bookDetail
          ? { upsert: { create: bookDetail, update: bookDetail } }
          : undefined,
      },
      include: { bookDetail: true, images: true },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
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
