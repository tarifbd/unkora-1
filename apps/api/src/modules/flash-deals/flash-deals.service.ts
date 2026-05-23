import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { CreateFlashDealDto } from './dto/create-flash-deal.dto';
import type { UpdateFlashDealDto } from './dto/update-flash-deal.dto';

@Injectable()
export class FlashDealsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFlashDealDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const now = new Date();
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    // Check for any overlapping active flash deal for this product
    const existing = await this.prisma.flashDeal.findFirst({
      where: {
        productId: dto.productId,
        isActive: true,
        endsAt: { gt: now },
      },
    });
    if (existing) {
      throw new BadRequestException('An active flash deal already exists for this product');
    }

    return this.prisma.flashDeal.create({
      data: {
        productId: dto.productId,
        discount: dto.discount,
        startsAt,
        endsAt,
        isFeatured: dto.isFeatured ?? false,
        isActive: true,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });
  }

  async findAll(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;

    const [data, total] = await Promise.all([
      this.prisma.flashDeal.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.flashDeal.count(),
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

  async findActive() {
    const now = new Date();
    return this.prisma.flashDeal.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            salePrice: true,
            stockQuantity: true,
            images: { where: { isPrimary: true }, take: 1 },
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async update(id: string, dto: UpdateFlashDealDto) {
    const deal = await this.prisma.flashDeal.findUnique({ where: { id } });
    if (!deal) throw new NotFoundException('Flash deal not found');

    const data: Record<string, unknown> = { ...dto };
    if (dto.startsAt) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt) data.endsAt = new Date(dto.endsAt);

    if (dto.startsAt || dto.endsAt) {
      const startsAt = dto.startsAt ? new Date(dto.startsAt) : deal.startsAt;
      const endsAt = dto.endsAt ? new Date(dto.endsAt) : deal.endsAt;
      if (endsAt <= startsAt) {
        throw new BadRequestException('endsAt must be after startsAt');
      }
    }

    return this.prisma.flashDeal.update({
      where: { id },
      data,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });
  }

  async remove(id: string) {
    const deal = await this.prisma.flashDeal.findUnique({ where: { id } });
    if (!deal) throw new NotFoundException('Flash deal not found');

    await this.prisma.flashDeal.delete({ where: { id } });
    return { message: 'Flash deal deleted successfully' };
  }
}
