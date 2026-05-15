import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

@Injectable()
export class ShipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateShipmentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const existing = await this.prisma.shipment.findUnique({ where: { orderId: dto.orderId } });
    if (existing) throw new BadRequestException('Shipment already exists for this order');

    const shipment = await this.prisma.shipment.create({
      data: {
        orderId: dto.orderId,
        courier: dto.courier,
        trackingNumber: dto.trackingNumber,
        trackingUrl: dto.trackingUrl,
        estimatedAt: dto.estimatedAt ? new Date(dto.estimatedAt) : undefined,
        notes: dto.notes,
      },
      include: { order: { select: { id: true, status: true } } },
    });

    // Auto-update order status to SHIPPED
    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: { status: 'SHIPPED' },
    });

    return shipment;
  }

  async update(id: string, dto: UpdateShipmentDto) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');

    const data: Record<string, unknown> = { ...dto };
    if (dto.estimatedAt) data.estimatedAt = new Date(dto.estimatedAt);
    if (dto.status === ShipmentStatus.DELIVERED) {
      data.deliveredAt = new Date();
      // Auto-update order to DELIVERED
      await this.prisma.order.update({ where: { id: shipment.orderId }, data: { status: 'DELIVERED' } });
    }

    return this.prisma.shipment.update({
      where: { id },
      data,
      include: { order: { select: { id: true, status: true } } },
    });
  }

  async findAll(page = 1, limit = 20, status?: ShipmentStatus) {
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true, status: true, total: true,
              user: { select: { firstName: true, lastName: true, email: true } },
              address: { select: { city: true, district: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.shipment.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async findByOrder(orderId: string) {
    return this.prisma.shipment.findUnique({
      where: { orderId },
      include: { order: { select: { id: true, status: true } } },
    });
  }

  async findOne(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true, status: true, total: true,
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            address: true,
            items: { include: { product: { select: { name: true } } } },
          },
        },
      },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  // Customer: get their shipment by orderId
  async getMyShipment(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    return this.prisma.shipment.findUnique({ where: { orderId } });
  }
}
