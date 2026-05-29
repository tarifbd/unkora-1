import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

@Injectable()
export class AttributesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.attribute.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
      include: { values: { orderBy: { value: 'asc' } } },
    });
  }

  async findOne(id: string) {
    const attr = await this.prisma.attribute.findUnique({
      where: { id },
      include: { values: { orderBy: { value: 'asc' } } },
    });
    if (!attr) throw new NotFoundException('Attribute not found');
    return attr;
  }

  async create(dto: CreateAttributeDto) {
    const { values, ...data } = dto;
    return this.prisma.attribute.create({
      data: {
        ...data,
        values: values?.length
          ? { create: values.map(v => ({ value: v })) }
          : undefined,
      },
      include: { values: true },
    });
  }

  async update(id: string, dto: UpdateAttributeDto) {
    await this.findOne(id);
    const { values, ...data } = dto;
    await this.prisma.attribute.update({ where: { id }, data });
    if (values !== undefined) {
      await this.prisma.attributeValue.deleteMany({ where: { attributeId: id } });
      if (values.length) {
        await this.prisma.attributeValue.createMany({
          data: values.map(v => ({ attributeId: id, value: v })),
        });
      }
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.attribute.delete({ where: { id } });
  }

  async addValue(id: string, value: string) {
    await this.findOne(id);
    return this.prisma.attributeValue.create({ data: { attributeId: id, value } });
  }

  async removeValue(valueId: string) {
    return this.prisma.attributeValue.delete({ where: { id: valueId } });
  }
}
