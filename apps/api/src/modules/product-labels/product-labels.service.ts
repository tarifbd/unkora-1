import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductLabelDto } from './dto/create-product-label.dto';
import { UpdateProductLabelDto } from './dto/update-product-label.dto';

@Injectable()
export class ProductLabelsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.productLabel.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async findOne(id: string) {
    const label = await this.prisma.productLabel.findUnique({ where: { id } });
    if (!label) throw new NotFoundException('Product label not found');
    return label;
  }

  create(dto: CreateProductLabelDto) {
    return this.prisma.productLabel.create({ data: dto });
  }

  async update(id: string, dto: UpdateProductLabelDto) {
    await this.findOne(id);
    return this.prisma.productLabel.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.productLabel.delete({ where: { id } });
  }
}
