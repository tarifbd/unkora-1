import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@unkora/database';

import { PrismaService } from '../../database/prisma.service';
import type { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private generateOrderNumber(): string {
    const date = new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `UNK-${y}${m}${d}-${rand}`;
  }

  async createFromCart(userId: string, dto: CreateOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } } },
    });

    if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty');

    const address = await this.prisma.address.findUnique({ where: { id: dto.addressId } });
    if (!address || address.userId !== userId) throw new NotFoundException('Address not found');

    // Validate stock
    for (const item of cart.items) {
      if (item.product.stockQuantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for "${item.product.name}"`);
      }
    }

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const shippingCost = subtotal >= 1000 ? 0 : 60; // Free shipping over ৳1000
    const total = subtotal + shippingCost;

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          userId,
          addressId: dto.addressId,
          paymentMethod: dto.paymentMethod,
          subtotal,
          shippingCost,
          total,
          notes: dto.notes,
          shippingAddress: {
            recipientName: address.recipientName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            district: address.district,
            division: address.division,
            postalCode: address.postalCode,
          },
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: Number(item.price) * item.quantity,
              productName: item.product.name,
              productSku: item.product.sku,
              productImage: item.product.images[0]?.url ?? null,
            })),
          },
          timeline: { create: { status: OrderStatus.PENDING } },
        },
        include: { items: true, payment: true },
      });

      // Deduct stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    return order;
  }

  async findByUser(userId: string, page = 1, limit = 10) {
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: { items: { take: 3 }, payment: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string, userId?: string) {
    const where = userId ? { id, userId } : { id };
    const order = await this.prisma.order.findFirst({
      where,
      include: { items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } }, payment: true, timeline: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByOrderNumber(orderNumber: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, userId },
      include: { items: true, payment: true, timeline: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async cancel(id: string, userId: string, reason?: string) {
    const order = await this.findById(id, userId);
    const cancellable: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    if (!cancellable.includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED, cancelReason: reason },
      });
      await tx.orderTimeline.create({ data: { orderId: id, status: OrderStatus.CANCELLED, note: reason } });

      // Restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }

      return updated;
    });
  }

  // Admin methods
  async findAll(page = 1, limit = 20, status?: OrderStatus) {
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } }, items: true, payment: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateStatus(id: string, status: OrderStatus, note?: string) {
    const order = await this.findById(id);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status, deliveredAt: status === OrderStatus.DELIVERED ? new Date() : undefined },
      });
      await tx.orderTimeline.create({ data: { orderId: id, status, note } });
      return updated;
    });
  }
}
