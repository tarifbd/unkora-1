import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, status?: string) {
    const where = status ? { status: status as any } : {};
    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { purchaseOrders: true } } },
      }),
      this.prisma.supplier.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const s = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, poNumber: true, status: true, total: true, createdAt: true },
        },
      },
    });
    if (!s) throw new NotFoundException('Supplier not found');
    return s;
  }

  async create(dto: CreateSupplierDto) {
    const exists = await this.prisma.supplier.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (exists) throw new BadRequestException('Supplier code already exists');
    return this.prisma.supplier.create({ data: { ...dto, code: dto.code.toUpperCase() } });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    const poCount = await this.prisma.purchaseOrder.count({ where: { supplierId: id } });
    if (poCount > 0) throw new BadRequestException('Cannot delete supplier with existing purchase orders');
    return this.prisma.supplier.delete({ where: { id } });
  }
}
