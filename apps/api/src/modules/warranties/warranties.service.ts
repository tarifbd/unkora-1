import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';

@Injectable()
export class WarrantiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.warranty.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { title: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async findOne(id: string) {
    const w = await this.prisma.warranty.findUnique({ where: { id } });
    if (!w) throw new NotFoundException('Warranty not found');
    return w;
  }

  create(dto: CreateWarrantyDto) {
    return this.prisma.warranty.create({ data: dto });
  }

  async update(id: string, dto: UpdateWarrantyDto) {
    await this.findOne(id);
    return this.prisma.warranty.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.warranty.delete({ where: { id } });
  }
}
