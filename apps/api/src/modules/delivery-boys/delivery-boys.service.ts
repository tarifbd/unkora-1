import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryBoyStatus, UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

import { PrismaService } from '../../database/prisma.service';
import { AssignOrderDto } from './dto/assign-order.dto';
import { CreateDeliveryBoyDto } from './dto/create-delivery-boy.dto';
import { UpdateDeliveryBoyDto } from './dto/update-delivery-boy.dto';

@Injectable()
export class DeliveryBoysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDeliveryBoyDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        role: UserRole.DELIVERY_BOY,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });

    const deliveryBoy = await this.prisma.deliveryBoy.create({
      data: {
        userId: user.id,
        phone: dto.phone,
        area: dto.area,
        vehicleType: dto.vehicleType,
        status: DeliveryBoyStatus.ACTIVE,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, status: true, createdAt: true },
        },
      },
    });

    return deliveryBoy;
  }

  async findAll(query: { status?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = query.status ? { status: query.status as DeliveryBoyStatus } : {};

    const [data, total] = await Promise.all([
      this.prisma.deliveryBoy.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, status: true },
          },
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.deliveryBoy.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const deliveryBoy = await this.prisma.deliveryBoy.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, status: true, createdAt: true },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        _count: { select: { orders: true } },
      },
    });

    if (!deliveryBoy) throw new NotFoundException('Delivery boy not found');
    return deliveryBoy;
  }

  async update(id: string, dto: UpdateDeliveryBoyDto) {
    const deliveryBoy = await this.prisma.deliveryBoy.findUnique({ where: { id } });
    if (!deliveryBoy) throw new NotFoundException('Delivery boy not found');

    return this.prisma.deliveryBoy.update({
      where: { id },
      data: {
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.area !== undefined && { area: dto.area }),
        ...(dto.vehicleType !== undefined && { vehicleType: dto.vehicleType }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, status: true },
        },
      },
    });
  }

  async remove(id: string) {
    const deliveryBoy = await this.prisma.deliveryBoy.findUnique({ where: { id } });
    if (!deliveryBoy) throw new NotFoundException('Delivery boy not found');

    return this.prisma.deliveryBoy.update({
      where: { id },
      data: { status: DeliveryBoyStatus.INACTIVE },
    });
  }

  async assignOrder(deliveryBoyId: string, dto: AssignOrderDto) {
    const deliveryBoy = await this.prisma.deliveryBoy.findUnique({ where: { id: deliveryBoyId } });
    if (!deliveryBoy) throw new NotFoundException('Delivery boy not found');
    if (deliveryBoy.status === DeliveryBoyStatus.INACTIVE) {
      throw new BadRequestException('Delivery boy is inactive');
    }

    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.deliveryBoyId) {
      throw new BadRequestException('Order already has a delivery boy assigned');
    }

    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: dto.orderId },
        data: { deliveryBoyId },
      }),
      this.prisma.deliveryBoy.update({
        where: { id: deliveryBoyId },
        data: { status: DeliveryBoyStatus.ON_DELIVERY },
      }),
    ]);

    return updatedOrder;
  }

  async completeDelivery(deliveryBoyId: string, dto: AssignOrderDto) {
    const deliveryBoy = await this.prisma.deliveryBoy.findUnique({ where: { id: deliveryBoyId } });
    if (!deliveryBoy) throw new NotFoundException('Delivery boy not found');

    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.deliveryBoyId !== deliveryBoyId) {
      throw new BadRequestException('This order is not assigned to this delivery boy');
    }

    // Count remaining active orders after this one completes
    const remainingActiveOrders = await this.prisma.order.count({
      where: {
        deliveryBoyId,
        id: { not: dto.orderId },
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
    });

    const newStatus = remainingActiveOrders === 0 ? DeliveryBoyStatus.ACTIVE : DeliveryBoyStatus.ON_DELIVERY;

    await this.prisma.deliveryBoy.update({
      where: { id: deliveryBoyId },
      data: {
        totalDeliveries: { increment: 1 },
        status: newStatus,
      },
    });

    return { message: 'Delivery marked as complete', deliveryBoyId, orderId: dto.orderId };
  }

  async getMyOrders(userId: string) {
    const deliveryBoy = await this.prisma.deliveryBoy.findUnique({ where: { userId } });
    if (!deliveryBoy) throw new NotFoundException('Delivery boy profile not found');

    const orders = await this.prisma.order.findMany({
      where: { deliveryBoyId: deliveryBoy.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        address: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    return { orders, total: orders.length };
  }
}
