import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PickupPointsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return (this.prisma as any).pickupPoint.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string) {
    return (this.prisma as any).pickupPoint.findUnique({ where: { id } });
  }

  adminFindAll() {
    return (this.prisma as any).pickupPoint.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  }

  async create(dto: any) {
    return (this.prisma as any).pickupPoint.create({ data: dto });
  }

  async update(id: string, dto: any) {
    const p = await (this.prisma as any).pickupPoint.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Pickup point not found');
    return (this.prisma as any).pickupPoint.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return (this.prisma as any).pickupPoint.delete({ where: { id } });
  }
}
