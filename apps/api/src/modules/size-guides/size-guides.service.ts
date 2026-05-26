import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSizeGuideDto } from './dto/create-size-guide.dto';
import { UpdateSizeGuideDto } from './dto/update-size-guide.dto';

@Injectable()
export class SizeGuidesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.sizeGuide.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { title: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async findOne(id: string) {
    const guide = await this.prisma.sizeGuide.findUnique({ where: { id } });
    if (!guide) throw new NotFoundException('Size guide not found');
    return guide;
  }

  create(dto: CreateSizeGuideDto) {
    return this.prisma.sizeGuide.create({ data: dto });
  }

  async update(id: string, dto: UpdateSizeGuideDto) {
    await this.findOne(id);
    return this.prisma.sizeGuide.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.sizeGuide.delete({ where: { id } });
  }
}
