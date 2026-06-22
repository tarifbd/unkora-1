import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { CreateBundleDto } from './dto/create-bundle.dto';

@Injectable()
export class BundlesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { page?: number; limit?: number; isActive?: boolean }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (params.isActive !== undefined) where.isActive = params.isActive;

    const [data, total] = await Promise.all([
      this.prisma.bundleOffer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, slug: true, salePrice: true, images: { where: { isPrimary: true }, take: 1 } } },
            },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.bundleOffer.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const bundle = await this.prisma.bundleOffer.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, salePrice: true, images: { where: { isPrimary: true }, take: 1 } } },
          },
        },
      },
    });
    if (!bundle) throw new NotFoundException('Bundle offer not found');
    return bundle;
  }

  async findActive() {
    const now = new Date();
    return this.prisma.bundleOffer.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
        ],
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, salePrice: true, images: { where: { isPrimary: true }, take: 1 } } },
          },
        },
      },
    });
  }

  async create(dto: CreateBundleDto) {
    const { items, ...rest } = dto;
    return this.prisma.bundleOffer.create({
      data: {
        ...rest,
        discountValue: rest.discountValue,
        startDate: rest.startDate ? new Date(rest.startDate) : undefined,
        endDate: rest.endDate ? new Date(rest.endDate) : undefined,
        items: items?.length
          ? { create: items.map(i => ({ productId: i.productId, quantity: i.quantity ?? 1 })) }
          : undefined,
      },
      include: { items: { include: { product: { select: { id: true, name: true } } } } },
    });
  }

  async update(id: string, dto: Partial<CreateBundleDto>) {
    await this.findOne(id);
    const { items, ...rest } = dto;

    const data: any = { ...rest };
    if (rest.startDate) data.startDate = new Date(rest.startDate);
    if (rest.endDate) data.endDate = new Date(rest.endDate);
    if (rest.discountValue !== undefined) data.discountValue = rest.discountValue;

    if (items !== undefined) {
      await this.prisma.bundleOfferItem.deleteMany({ where: { bundleOfferId: id } });
      data.items = { create: items.map(i => ({ productId: i.productId, quantity: i.quantity ?? 1 })) };
    }

    return this.prisma.bundleOffer.update({
      where: { id },
      data,
      include: { items: { include: { product: { select: { id: true, name: true } } } } },
    });
  }

  async toggle(id: string) {
    const bundle = await this.findOne(id);
    return this.prisma.bundleOffer.update({ where: { id }, data: { isActive: !bundle.isActive } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.bundleOffer.delete({ where: { id } });
  }
}
