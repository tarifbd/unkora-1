import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { PrismaService } from '../../database/prisma.service';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

const ROOTS_CACHE_KEY = 'categories:roots';
const ALL_CACHE_KEY   = 'categories:all';
const CACHE_TTL       = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findAll(includeInactive = false) {
    if (!includeInactive) {
      const cached = await this.cacheManager.get(ALL_CACHE_KEY);
      if (cached) return cached;
    }
    const result = await this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { parent: true, children: { where: { isActive: true } }, _count: { select: { products: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    if (!includeInactive) await this.cacheManager.set(ALL_CACHE_KEY, result, CACHE_TTL);
    return result;
  }

  async findRoots() {
    const cached = await this.cacheManager.get(ROOTS_CACHE_KEY);
    if (cached) return cached;
    const result = await this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    await this.cacheManager.set(ROOTS_CACHE_KEY, result, CACHE_TTL);
    return result;
  }

  private async invalidateCache() {
    await Promise.all([
      this.cacheManager.del(ROOTS_CACHE_KEY),
      this.cacheManager.del(ALL_CACHE_KEY),
    ]);
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: { where: { isActive: true } },
        parent: true,
        _count: { select: { products: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already exists');

    if (dto.parentId) {
      await this.findById(dto.parentId);
    }

    const result = await this.prisma.category.create({ data: dto });
    await this.invalidateCache();
    return result;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);

    if (dto.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) throw new ConflictException('Slug already exists');
    }

    const result = await this.prisma.category.update({ where: { id }, data: dto });
    await this.invalidateCache();
    return result;
  }

  async remove(id: string) {
    await this.findById(id);
    const productCount = await this.prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) throw new ConflictException(`Cannot delete — ${productCount} products use this category`);
    const result = await this.prisma.category.delete({ where: { id } });
    await this.invalidateCache();
    return result;
  }
}
