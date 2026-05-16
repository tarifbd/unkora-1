import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { FacebookCAPIService } from '../settings/facebook-capi.service';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { CreateGuestOrderDto } from './dto/create-guest-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly facebookCAPIService: FacebookCAPIService,
  ) {}

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

      // Deduct stock and create stock movement records
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE',
            quantity: -item.quantity,
            note: `Order ${newOrder.id}`,
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    // Send order confirmation email (non-blocking)
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (user?.email) {
        await this.emailService.sendOrderConfirmation(user.email, {
          orderNumber: order.orderNumber,
          total: String(order.total),
          items: order.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            price: String(item.unitPrice),
          })),
          shippingAddress: order.shippingAddress as Record<string, string>,
        });
      }
    } catch (err) {
      this.logger.error('Failed to send order confirmation email', err);
    }

    return order;
  }

  async createGuestOrder(dto: CreateGuestOrderDto) {
    // Look up all products
    const productIds = dto.items.map(i => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { images: { where: { isPrimary: true }, take: 1 } },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Validate stock
    for (const orderItem of dto.items) {
      const product = products.find(p => p.id === orderItem.productId);
      if (!product || product.stockQuantity < orderItem.quantity) {
        throw new BadRequestException(`Insufficient stock for "${product?.name ?? orderItem.productId}"`);
      }
    }

    // Find or create a guest user by phone
    let user = await this.prisma.user.findFirst({
      where: { phone: dto.guestPhone },
    });

    if (!user) {
      const crypto = await import('crypto');
      user = await this.prisma.user.create({
        data: {
          email: dto.guestEmail ?? `guest_${dto.guestPhone}@unkora.guest`,
          firstName: dto.guestName.split(' ')[0] ?? dto.guestName,
          lastName: dto.guestName.split(' ').slice(1).join(' ') || 'Guest',
          phone: dto.guestPhone,
          passwordHash: crypto.randomBytes(32).toString('hex'),
          status: 'PENDING_VERIFICATION',
        },
      });
    }

    const subtotal = dto.items.reduce((sum, orderItem) => {
      const product = products.find(p => p.id === orderItem.productId)!;
      return sum + Number(product.salePrice ?? product.basePrice) * orderItem.quantity;
    }, 0);
    const shippingCost = subtotal >= 1000 ? 0 : 80;
    const total = subtotal + shippingCost;

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          userId: user!.id,
          paymentMethod: dto.paymentMethod,
          subtotal,
          shippingCost,
          total,
          notes: dto.notes,
          shippingAddress: { ...dto.shippingAddress },
          items: {
            create: dto.items.map((orderItem) => {
              const product = products.find(p => p.id === orderItem.productId)!;
              const unitPrice = Number(product.salePrice ?? product.basePrice);
              return {
                productId: orderItem.productId,
                quantity: orderItem.quantity,
                unitPrice,
                totalPrice: unitPrice * orderItem.quantity,
                productName: product.name,
                productSku: product.sku,
                productImage: product.images[0]?.url ?? null,
              };
            }),
          },
          timeline: { create: { status: OrderStatus.PENDING } },
        },
        include: { items: true },
      });

      for (const orderItem of dto.items) {
        await tx.product.update({
          where: { id: orderItem.productId },
          data: { stockQuantity: { decrement: orderItem.quantity } },
        });
      }

      return newOrder;
    });

    // Fire Facebook CAPI Purchase event (non-blocking)
    this.facebookCAPIService.sendPurchase({
      email: dto.guestEmail,
      phone: dto.guestPhone,
      firstName: dto.guestName.split(' ')[0],
      lastName: dto.guestName.split(' ').slice(1).join(' ') || undefined,
      orderId: order.orderNumber,
      value: total,
      currency: 'BDT',
      items: dto.items.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        return { id: item.productId, quantity: item.quantity, price: Number(product.salePrice ?? product.basePrice) };
      }),
    }).catch(err => this.logger.error('CAPI purchase failed', err));

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
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: order.id },
        data: { status, deliveredAt: status === OrderStatus.DELIVERED ? new Date() : undefined },
      });
      await tx.orderTimeline.create({ data: { orderId: id, status, note } });
      return result;
    });

    // Send order status update email (non-blocking)
    try {
      const user = await this.prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } });
      if (user?.email) {
        await this.emailService.sendOrderStatusUpdate(user.email, order.orderNumber, status, note);
      }
    } catch (err) {
      this.logger.error('Failed to send order status update email', err);
    }

    return updated;
  }
}
