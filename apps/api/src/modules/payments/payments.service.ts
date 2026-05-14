import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async initiateBkash(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('Order already paid');

    // Placeholder — wire real bKash Payment Gateway API in V2
    const payment = await this.prisma.payment.upsert({
      where: { orderId },
      create: { orderId, method: PaymentMethod.BKASH, amount: order.total, status: PaymentStatus.PENDING },
      update: { status: PaymentStatus.PENDING },
    });

    return {
      paymentId: payment.id,
      amount: order.total,
      currency: 'BDT',
      message: 'bKash payment gateway — integrate SDK in V2',
    };
  }

  async initiateNagad(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('Order already paid');

    const payment = await this.prisma.payment.upsert({
      where: { orderId },
      create: { orderId, method: PaymentMethod.NAGAD, amount: order.total, status: PaymentStatus.PENDING },
      update: { status: PaymentStatus.PENDING },
    });

    return {
      paymentId: payment.id,
      amount: order.total,
      currency: 'BDT',
      message: 'Nagad payment gateway — integrate SDK in V2',
    };
  }

  async confirmCOD(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentMethod !== PaymentMethod.COD) {
      throw new BadRequestException('Order payment method is not COD');
    }

    await this.prisma.payment.upsert({
      where: { orderId },
      create: { orderId, method: PaymentMethod.COD, amount: order.total, status: PaymentStatus.PENDING },
      update: { status: PaymentStatus.PENDING },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });

    return { message: 'COD order confirmed. Payment collected on delivery.' };
  }

  // Called by payment gateway webhook
  async handleWebhook(transactionId: string, gatewayRef: string, status: PaymentStatus) {
    const payment = await this.prisma.payment.findFirst({ where: { transactionId } });
    if (!payment) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status, gatewayRef, paidAt: status === PaymentStatus.PAID ? new Date() : undefined },
      });

      if (status === PaymentStatus.PAID) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: PaymentStatus.PAID, status: 'CONFIRMED' },
        });
      } else if (status === PaymentStatus.FAILED) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: PaymentStatus.FAILED },
        });
      }
    });
  }
}
