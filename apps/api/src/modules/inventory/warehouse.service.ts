import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.warehouse.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: {
        _count: { select: { stocks: true, purchaseOrders: true } },
      },
    });
  }

  async findOne(id: string) {
    const wh = await this.prisma.warehouse.findUnique({
      where: { id },
      include: { _count: { select: { stocks: true } } },
    });
    if (!wh) throw new NotFoundException('Warehouse not found');
    return wh;
  }

  async create(dto: CreateWarehouseDto) {
    const exists = await this.prisma.warehouse.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (exists) throw new BadRequestException('Warehouse code already exists');

    if (dto.isDefault) await this.prisma.warehouse.updateMany({ data: { isDefault: false } });

    return this.prisma.warehouse.create({ data: { ...dto, code: dto.code.toUpperCase() } });
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    await this.findOne(id);
    if (dto.isDefault) await this.prisma.warehouse.updateMany({ where: { id: { not: id } }, data: { isDefault: false } });
    return this.prisma.warehouse.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const wh = await this.findOne(id);
    if (wh.isDefault) throw new BadRequestException('Cannot delete the default warehouse');
    const stockCount = await this.prisma.inventoryStock.count({ where: { warehouseId: id } });
    if (stockCount > 0) throw new BadRequestException('Cannot delete a warehouse with stock records');
    return this.prisma.warehouse.delete({ where: { id } });
  }

  async getOrCreateDefault(): Promise<string> {
    let wh = await this.prisma.warehouse.findFirst({ where: { isDefault: true } });
    if (!wh) {
      wh = await this.prisma.warehouse.create({
        data: { name: 'Main Warehouse', code: 'MAIN', isDefault: true },
      });
    }
    return wh.id;
  }
}
