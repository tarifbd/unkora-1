import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ClassifiedsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { page?: number; limit?: number; category?: string; search?: string; status?: string }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where: any = { status: params.status ?? 'APPROVED' };
    if (params.category) where.category = params.category;
    if (params.search) where.title = { contains: params.search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      (this.prisma as any).classifiedAd.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).classifiedAd.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const ad = await (this.prisma as any).classifiedAd.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Ad not found');
    await (this.prisma as any).classifiedAd.update({ where: { id }, data: { views: { increment: 1 } } });
    return ad;
  }

  async create(userId: string, dto: { title: string; description: string; price?: number; images?: string[]; category: string; location?: string }) {
    return (this.prisma as any).classifiedAd.create({
      data: { userId, ...dto, images: dto.images ?? [], status: 'PENDING', expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });
  }

  async update(id: string, userId: string, dto: any, isAdmin = false) {
    const ad = await (this.prisma as any).classifiedAd.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Ad not found');
    if (!isAdmin && ad.userId !== userId) throw new ForbiddenException();
    return (this.prisma as any).classifiedAd.update({ where: { id }, data: dto });
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const ad = await (this.prisma as any).classifiedAd.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Ad not found');
    if (!isAdmin && ad.userId !== userId) throw new ForbiddenException();
    return (this.prisma as any).classifiedAd.delete({ where: { id } });
  }

  async myAds(userId: string) {
    return (this.prisma as any).classifiedAd.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async adminList(params: { page?: number; limit?: number; status?: string }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where: any = {};
    if (params.status) where.status = params.status;
    const [data, total] = await Promise.all([
      (this.prisma as any).classifiedAd.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' } }),
      (this.prisma as any).classifiedAd.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }
}
