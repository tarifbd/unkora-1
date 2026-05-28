import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderStatus, PaymentMethod } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrdersCronService {
  private readonly logger = new Logger(OrdersCronService.name);

  constructor(private readonly prisma: PrismaService) {}

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
}
