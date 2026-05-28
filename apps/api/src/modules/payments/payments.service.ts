import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { BkashService } from './bkash.service';
import { NagadService } from './nagad.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bkash: BkashService,
    private readonly nagad: NagadService,
  ) {}

  async initiateBkash(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('Order already paid');

    await this.prisma.payment.upsert({
      where: { orderId },
      create: { orderId, method: PaymentMethod.BKASH, amount: order.total, status: PaymentStatus.PENDING },
      update: { status: PaymentStatus.PENDING },
    });

    const apiBase = process.env['API_BASE_URL'] ?? 'http://localhost:4000/api/v1';
    const callbackUrl = `${apiBase}/payments/bkash/callback`;

    const { paymentID, bkashURL } = await this.bkash.createPayment(
      orderId,
      userId,
      Number(order.total),
      order.orderNumber,
      callbackUrl,
    );

    // Store paymentID in payment record for callback lookup
    await this.prisma.payment.update({
      where: { orderId },
      data: { transactionId: paymentID },
    });

    return { paymentID, redirectUrl: bkashURL, amount: order.total, currency: 'BDT' };
  }

  async executeBkash(paymentID: string) {
    // Verify paymentID belongs to a known pending payment — prevents forged callbacks
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: paymentID, status: PaymentStatus.PENDING },
    });
    if (!payment) throw new NotFoundException('Payment not found or already processed');

    const result = await this.bkash.executePayment(paymentID);

    // Validate returned amount matches the expected order amount (prevents partial-payment attacks)
    if (Number(result.amount) < Number(payment.amount)) {
      throw new BadRequestException('bKash returned amount does not match order total');
    }

    if (result.status === 'Completed') {
      await this.handleWebhook(paymentID, result.trxID, PaymentStatus.PAID);
    } else {
      await this.handleWebhook(paymentID, '', PaymentStatus.FAILED);
    }
    return result;
  }

  async initiateNagad(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('Order already paid');

    await this.prisma.payment.upsert({
      where: { orderId },
      create: { orderId, method: PaymentMethod.NAGAD, amount: order.total, status: PaymentStatus.PENDING },
      update: { status: PaymentStatus.PENDING },
    });

    const apiBase = process.env['API_BASE_URL'] ?? 'http://localhost:4000/api/v1';
    const callbackUrl = `${apiBase}/payments/nagad/callback`;

    const { paymentReferenceId, redirectURL } = await this.nagad.initializePayment(
      orderId,
      userId,
      Number(order.total),
      callbackUrl,
    );

    await this.prisma.payment.update({
      where: { orderId },
      data: { transactionId: paymentReferenceId },
    });

    return { paymentReferenceId, redirectURL, amount: order.total, currency: 'BDT' };
  }

  async verifyNagad(paymentReferenceId: string) {
    // Verify paymentReferenceId belongs to a known pending payment — prevents forged callbacks
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: paymentReferenceId, status: PaymentStatus.PENDING },
    });
    if (!payment) throw new NotFoundException('Payment not found or already processed');

    const result = await this.nagad.verifyPayment(paymentReferenceId);
    if (result.status === 'Success') {
      await this.handleWebhook(paymentReferenceId, result.trxId, PaymentStatus.PAID);
    } else {
      await this.handleWebhook(paymentReferenceId, '', PaymentStatus.FAILED);
    }
    return result;
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
      data: { status: OrderStatus.CONFIRMED },
    });

    return { message: 'COD order confirmed. Payment collected on delivery.' };
  }

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
          data: { paymentStatus: PaymentStatus.PAID, status: OrderStatus.CONFIRMED },
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
