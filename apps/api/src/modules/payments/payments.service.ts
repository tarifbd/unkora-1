import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AamarPayService } from './aamarpay.service';
import { BkashService } from './bkash.service';
import { NagadService } from './nagad.service';
import { PortWalletService } from './portwallet.service';
import { ShurjoPayService } from './shurjopay.service';
import { SslCommerzService } from './sslcommerz.service';
import { StripeService } from './stripe.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bkash: BkashService,
    private readonly nagad: NagadService,
    private readonly sslCommerz: SslCommerzService,
    private readonly shurjoPay: ShurjoPayService,
    private readonly aamarPay: AamarPayService,
    private readonly portWallet: PortWalletService,
    private readonly stripe: StripeService,
  ) {}

  // ─── helpers ───────────────────────────────────────────────────────────────

  private async findPendingOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('Order already paid');
    return order;
  }

  private getApiBase() {
    return process.env['API_BASE_URL'] ?? 'http://localhost:4000/api/v1';
  }

  private extractCustomerFromOrder(order: {
    shippingAddress: unknown;
    user?: { firstName?: string; lastName?: string; email?: string; phone?: string } | null;
  }) {
    const addr = order.shippingAddress as {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      line1?: string;
      city?: string;
    };
    return {
      name: addr?.name ?? 'Customer',
      email: addr?.email ?? '',
      phone: addr?.phone ?? '',
      address: addr?.address ?? addr?.line1 ?? '',
      city: addr?.city ?? 'Dhaka',
    };
  }

  // ─── bKash ─────────────────────────────────────────────────────────────────

  async initiateBkash(orderId: string, userId: string) {
    const order = await this.findPendingOrder(orderId, userId);

    await this.prisma.payment.upsert({
      where: { orderId },
      create: { orderId, method: PaymentMethod.BKASH, amount: order.total, status: PaymentStatus.PENDING },
      update: { status: PaymentStatus.PENDING },
    });

    const apiBase = this.getApiBase();
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

  // ─── Nagad ─────────────────────────────────────────────────────────────────

  async initiateNagad(orderId: string, userId: string) {
    const order = await this.findPendingOrder(orderId, userId);

    await this.prisma.payment.upsert({
      where: { orderId },
      create: { orderId, method: PaymentMethod.NAGAD, amount: order.total, status: PaymentStatus.PENDING },
      update: { status: PaymentStatus.PENDING },
    });

    const apiBase = this.getApiBase();
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

  // ─── COD ───────────────────────────────────────────────────────────────────

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

  // ─── SSLCommerz ────────────────────────────────────────────────────────────

  async initiateSSLCommerz(orderId: string, userId: string) {
    const order = await this.findPendingOrder(orderId, userId);
    const customer = this.extractCustomerFromOrder(order);

    await this.prisma.payment.upsert({
      where: { orderId },
      // SSLCommerz is a card/aggregator gateway — closest enum is CARD
      create: { orderId, method: PaymentMethod.CARD, amount: order.total, status: PaymentStatus.PENDING },
      update: { status: PaymentStatus.PENDING },
    });

    const apiBase = this.getApiBase();
    const frontendBase = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';

    const { tran_id, redirectUrl } = await this.sslCommerz.initiate(
      orderId,
      Number(order.total),
      order.orderNumber,
      customer,
      {
        successUrl: process.env['SUCCESS_URL'] ?? `${frontendBase}/checkout/success`,
        failUrl: process.env['FAIL_URL'] ?? `${frontendBase}/checkout/fail`,
        cancelUrl: process.env['CANCEL_URL'] ?? `${frontendBase}/checkout/cancel`,
        ipnUrl: process.env['IPN_URL'] ?? `${apiBase}/payments/sslcommerz/ipn`,
      },
    );

    await this.prisma.payment.update({
      where: { orderId },
      data: { transactionId: tran_id },
    });

    return { tran_id, redirectUrl, amount: order.total, currency: 'BDT' };
  }

  async verifySSLCommerz(val_id: string) {
    const result = await this.sslCommerz.verify(val_id);

    if (result.status === 'VALID' || result.status === 'VALIDATED') {
      // tran_id was stored as transactionId
      await this.handleWebhook(result.tran_id, val_id, PaymentStatus.PAID);
    } else {
      await this.handleWebhook(result.tran_id, val_id, PaymentStatus.FAILED);
    }
    return result;
  }

  // ─── ShurjoPay ─────────────────────────────────────────────────────────────

  async initiateShurjoPay(orderId: string, userId: string) {
    const order = await this.findPendingOrder(orderId, userId);
    const customer = this.extractCustomerFromOrder(order);

    await this.prisma.payment.upsert({
      where: { orderId },
      // ShurjoPay is a bank/aggregator gateway — closest enum is BANK_TRANSFER
      create: { orderId, method: PaymentMethod.BANK_TRANSFER, amount: order.total, status: PaymentStatus.PENDING },
      update: { status: PaymentStatus.PENDING },
    });

    const { sp_order_id, checkout_url } = await this.shurjoPay.createPayment(
      orderId,
      Number(order.total),
      order.orderNumber,
      customer,
    );

    await this.prisma.payment.update({
      where: { orderId },
      data: { transactionId: sp_order_id },
    });

    return { sp_order_id, redirectUrl: checkout_url, amount: order.total, currency: 'BDT' };
  }

  async verifyShurjoPay(sp_order_id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: sp_order_id, status: PaymentStatus.PENDING },
    });
    if (!payment) throw new NotFoundException('Payment not found or already processed');

    const result = await this.shurjoPay.verifyPayment(sp_order_id);

    if (result.status === 'Paid' || result.status === 'paid' || result.status === 'Completed') {
      await this.handleWebhook(sp_order_id, result.transaction_id, PaymentStatus.PAID);
    } else {
      await this.handleWebhook(sp_order_id, result.transaction_id, PaymentStatus.FAILED);
    }
    return result;
  }

  // ─── AamarPay ──────────────────────────────────────────────────────────────

  async initiateAamarPay(orderId: string, userId: string) {
    const order = await this.findPendingOrder(orderId, userId);
    const customer = this.extractCustomerFromOrder(order);

    await this.prisma.payment.upsert({
      where: { orderId },
      // AamarPay is a bank/aggregator gateway — closest enum is BANK_TRANSFER
      create: { orderId, method: PaymentMethod.BANK_TRANSFER, amount: order.total, status: PaymentStatus.PENDING },
      update: { status: PaymentStatus.PENDING },
    });

    const frontendBase = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';
    const { tran_id, payment_url } = await this.aamarPay.initiatePayment(
      orderId,
      Number(order.total),
      order.orderNumber,
      customer,
      {
        successUrl: process.env['SUCCESS_URL'] ?? `${frontendBase}/checkout/success`,
        failUrl: process.env['FAIL_URL'] ?? `${frontendBase}/checkout/fail`,
        cancelUrl: process.env['CANCEL_URL'] ?? `${frontendBase}/checkout/cancel`,
      },
    );

    await this.prisma.payment.update({
      where: { orderId },
      data: { transactionId: tran_id },
    });

    return { tran_id, redirectUrl: payment_url, amount: order.total, currency: 'BDT' };
  }

  async verifyAamarPay(request_id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: request_id, status: PaymentStatus.PENDING },
    });
    if (!payment) throw new NotFoundException('Payment not found or already processed');

    const result = await this.aamarPay.verifyPayment(request_id);

    if (result.status === 'Successful' || result.status === 'successful') {
      await this.handleWebhook(request_id, result.tran_id, PaymentStatus.PAID);
    } else {
      await this.handleWebhook(request_id, result.tran_id, PaymentStatus.FAILED);
    }
    return result;
  }

  // ─── PortWallet ────────────────────────────────────────────────────────────

  async initiatePortWallet(orderId: string, userId: string) {
    const order = await this.findPendingOrder(orderId, userId);
    const customer = this.extractCustomerFromOrder(order);

    await this.prisma.payment.upsert({
      where: { orderId },
      // PortWallet supports international cards — use CARD enum
      create: { orderId, method: PaymentMethod.CARD, amount: order.total, status: PaymentStatus.PENDING },
      update: { status: PaymentStatus.PENDING },
    });

    const frontendBase = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';
    const { invoice_hash, redirect_url } = await this.portWallet.createInvoice(
      orderId,
      Number(order.total),
      order.orderNumber,
      customer,
      {
        returnUrl: process.env['SUCCESS_URL'] ?? `${frontendBase}/checkout/success`,
        cancelUrl: process.env['CANCEL_URL'] ?? `${frontendBase}/checkout/cancel`,
      },
    );

    await this.prisma.payment.update({
      where: { orderId },
      data: { transactionId: invoice_hash },
    });

    return { invoice_hash, redirectUrl: redirect_url, amount: order.total, currency: 'BDT' };
  }

  async verifyPortWallet(invoice_hash: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: invoice_hash, status: PaymentStatus.PENDING },
    });
    if (!payment) throw new NotFoundException('Payment not found or already processed');

    const result = await this.portWallet.verifyInvoice(invoice_hash);

    if (result.status === 'ACCEPTED') {
      await this.handleWebhook(invoice_hash, invoice_hash, PaymentStatus.PAID);
    } else {
      await this.handleWebhook(invoice_hash, invoice_hash, PaymentStatus.FAILED);
    }
    return result;
  }

  // ─── Stripe ────────────────────────────────────────────────────────────────

  async initiateStripe(orderId: string, userId: string) {
    const order = await this.findPendingOrder(orderId, userId);
    const customer = this.extractCustomerFromOrder(order);

    await this.prisma.payment.upsert({
      where: { orderId },
      create: { orderId, method: PaymentMethod.CARD, amount: order.total, status: PaymentStatus.PENDING },
      update: { status: PaymentStatus.PENDING },
    });

    const { clientSecret, paymentIntentId } = await this.stripe.createPaymentIntent(
      orderId,
      Number(order.total),
      order.orderNumber,
      customer.email,
    );

    await this.prisma.payment.update({
      where: { orderId },
      data: { transactionId: paymentIntentId },
    });

    return { clientSecret, paymentIntentId, amount: order.total, currency: 'BDT' };
  }

  async verifyStripe(paymentIntentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: paymentIntentId, status: PaymentStatus.PENDING },
    });
    if (!payment) throw new NotFoundException('Payment not found or already processed');

    const result = await this.stripe.verifyPaymentIntent(paymentIntentId);

    if (result.status === 'succeeded') {
      await this.handleWebhook(paymentIntentId, paymentIntentId, PaymentStatus.PAID);
    } else if (result.status === 'canceled') {
      await this.handleWebhook(paymentIntentId, paymentIntentId, PaymentStatus.FAILED);
    }
    return result;
  }

  // ─── Admin list ─────────────────────────────────────────────────────────────

  async findAll(page = 1, limit = 20, status?: string, method?: string) {
    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    if (method) where['method'] = method;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { orderNumber: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Shared webhook handler ─────────────────────────────────────────────────

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
