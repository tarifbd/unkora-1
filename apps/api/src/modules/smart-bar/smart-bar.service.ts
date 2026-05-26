import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSmartBarDto } from './dto/create-smart-bar.dto';
import { UpdateSmartBarDto } from './dto/update-smart-bar.dto';

@Injectable()
export class SmartBarService {
  constructor(private readonly prisma: PrismaService) {}

  findByProduct(productId: string) {
    return this.prisma.smartBar.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findActive() {
    const now = new Date();
    return this.prisma.smartBar.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      include: { product: { select: { id: true, name: true, slug: true } } },
    });
  }

  create(productId: string, dto: CreateSmartBarDto) {
    return this.prisma.smartBar.create({ data: { productId, ...dto } });
  }

  async update(id: string, dto: UpdateSmartBarDto) {
    const bar = await this.prisma.smartBar.findUnique({ where: { id } });
    if (!bar) throw new NotFoundException('Smart bar not found');
    return this.prisma.smartBar.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const bar = await this.prisma.smartBar.findUnique({ where: { id } });
    if (!bar) throw new NotFoundException('Smart bar not found');
    return this.prisma.smartBar.delete({ where: { id } });
  }
}
