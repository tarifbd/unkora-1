import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: InstanceType<typeof Stripe>;

  constructor() {
    this.stripe = new Stripe(
      process.env['STRIPE_SECRET_KEY'] ?? 'sk_test_placeholder',
      { apiVersion: '2026-05-27.dahlia' },
    );
  }

  async createPaymentIntent(
    orderId: string,
    amountBDT: number,
    orderNumber: string,
    customerEmail: string,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    // BDT is not supported by Stripe — convert to USD (approx: 1 USD = 110 BDT)
    const amountUSD = Math.round((amountBDT / 110) * 100); // in cents

    this.logger.log(
      `Stripe createPaymentIntent: orderId=${orderId}, amountBDT=${amountBDT}, amountUSD_cents=${amountUSD}`,
    );

    const pi = await this.stripe.paymentIntents.create({
      amount: amountUSD,
      currency: process.env['STRIPE_CURRENCY'] ?? 'usd',
      receipt_email: customerEmail,
      metadata: { orderId, orderNumber },
    });

    return {
      clientSecret: pi.client_secret!,
      paymentIntentId: pi.id,
    };
  }

  async verifyPaymentIntent(
    paymentIntentId: string,
  ): Promise<{ status: string; amount: number }> {
    const pi = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    this.logger.log(
      `Stripe verifyPaymentIntent: id=${paymentIntentId}, status=${pi.status}`,
    );

    return { status: pi.status, amount: pi.amount };
  }

  verifyWebhookSignature(payload: Buffer, signature: string): unknown {
    const secret = process.env['STRIPE_WEBHOOK_SECRET'] ?? '';
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
