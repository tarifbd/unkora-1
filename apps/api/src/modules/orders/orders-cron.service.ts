import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderStatus, PaymentMethod } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OrdersCronService {
  private readonly logger = new Logger(OrdersCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cancelStaleOrders() {
    const now = new Date();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const cutoff2h = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Cancel PENDING non-COD orders older than 24h (payment never initiated)
    const { count: pendingCount } = await this.prisma.order.updateMany({
      where: {
        status: OrderStatus.PENDING,
        paymentMethod: { not: PaymentMethod.COD },
        createdAt: { lt: cutoff24h },
      },
      data: {
        status: OrderStatus.CANCELLED,
        cancelReason: 'Payment timeout — auto-cancelled after 24 hours',
      },
    });

    // Cancel CONFIRMED orders with PENDING payment older than 2h (payment initiated but not completed)
    const { count: confirmedCount } = await this.prisma.order.updateMany({
      where: {
        status: OrderStatus.CONFIRMED,
        paymentStatus: { not: { in: ['PAID' as any, 'PARTIALLY_REFUNDED' as any] } },
        paymentMethod: { not: PaymentMethod.COD },
        createdAt: { lt: cutoff2h },
      },
      data: {
        status: OrderStatus.CANCELLED,
        cancelReason: 'Payment not completed — auto-cancelled after 2 hours',
      },
    });

    const total = pendingCount + confirmedCount;
    if (total > 0) {
      this.logger.log(`Auto-cancelled ${total} stale orders (${pendingCount} pending + ${confirmedCount} payment-timeout)`);
    }
  }

  @Cron('0 10 * * *') // Run daily at 10 AM
  async sendAbandonedCartEmails() {
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find carts: has items, belongs to a user, idle 24h+, not emailed in last 7 days
    const abandonedCarts = await this.prisma.cart.findMany({
      where: {
        userId: { not: null },
        updatedAt: { lt: cutoff24h },
        items: { some: {} },
        OR: [
          { recoveryEmailSentAt: null },
          { recoveryEmailSentAt: { lt: cutoff7d } },
        ],
      },
      include: {
        user: { select: { id: true, email: true, firstName: true } },
        items: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
                salePrice: true,
                images: { where: { isPrimary: true }, take: 1, select: { url: true } },
              },
            },
          },
        },
      },
      take: 100,
    });

    let sent = 0;
    for (const cart of abandonedCarts) {
      if (!cart.user?.email) continue;

      const cartItems = cart.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: String(item.product.salePrice ?? item.product.price),
        imageUrl: item.product.images[0]?.url,
      }));

      const cartTotal = cart.items.reduce(
        (sum, item) => sum + Number(item.product.salePrice ?? item.product.price) * item.quantity,
        0,
      );

      const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://unkora.shop';

      try {
        await this.emailService.sendAbandonedCartRecovery(cart.user.email, {
          firstName: cart.user.firstName ?? 'there',
          cartItems,
          cartTotal: cartTotal.toFixed(2),
          recoveryUrl: `${siteUrl}/cart`,
        });

        await this.prisma.cart.update({
          where: { id: cart.id },
          data: { recoveryEmailSentAt: new Date() },
        });

        sent++;
      } catch (err) {
        this.logger.error(`Failed cart recovery email for cart ${cart.id}`, err);
      }
    }

    if (sent > 0) {
      this.logger.log(`Sent ${sent} abandoned cart recovery emails`);
    }
  }
}
