import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PopupsService {
  constructor(private readonly prisma: PrismaService) {}

  async getActive(page?: string) {
    const now = new Date();
    const popups = await (this.prisma as any).popup.findMany({
      where: {
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: { createdAt: 'desc' },
    });
    if (page) {
      return popups.filter((p: any) => {
        const pages = p.pages as string[];
        return !pages.length || pages.includes(page);
      });
    }
    return popups;
  }

  async recordView(id: string) {
    return (this.prisma as any).popup.update({ where: { id }, data: { views: { increment: 1 } } });
  }

  async recordClick(id: string) {
    return (this.prisma as any).popup.update({ where: { id }, data: { clicks: { increment: 1 } } });
  }

  findAll() {
    return (this.prisma as any).popup.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(dto: any) { return (this.prisma as any).popup.create({ data: dto }); }

  async update(id: string, dto: any) {
    const p = await (this.prisma as any).popup.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Popup not found');
    return (this.prisma as any).popup.update({ where: { id }, data: dto });
  }

  async delete(id: string) { return (this.prisma as any).popup.delete({ where: { id } }); }
}
