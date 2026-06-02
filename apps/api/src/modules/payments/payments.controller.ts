import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  RawBodyRequest,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createHmac, timingSafeEqual } from 'crypto';
import { PaymentStatus } from '@prisma/client';
import type { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  // ─── bKash ─────────────────────────────────────────────────────────────────

  @Post(':orderId/bkash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate bKash payment' })
  initiateBkash(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.initiateBkash(orderId, userId);
  }

  @Get('bkash/callback')
  @ApiOperation({ summary: 'bKash payment callback (redirect from bKash)' })
  async bkashCallback(
    @Query('paymentID') paymentID: string,
    @Query('status') status: string,
  ) {
    if (status === 'success' && paymentID) {
      await this.paymentsService.executeBkash(paymentID);
      return { message: 'Payment successful', paymentID, status };
    }
    if (status === 'failure' || status === 'cancel') {
      await this.paymentsService.handleWebhook(paymentID, '', PaymentStatus.FAILED);
    }
    return { message: `Payment ${status}`, paymentID, status };
  }

  // ─── Nagad ─────────────────────────────────────────────────────────────────

  @Post(':orderId/nagad')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate Nagad payment' })
  initiateNagad(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.initiateNagad(orderId, userId);
  }

  @Get('nagad/callback')
  @ApiOperation({ summary: 'Nagad payment callback (redirect from Nagad)' })
  async nagadCallback(
    @Query('payment_ref_id') paymentRefId: string,
    @Query('status') status: string,
  ) {
    if (paymentRefId) {
      await this.paymentsService.verifyNagad(paymentRefId);
    }
    return { message: `Nagad payment ${status ?? 'processed'}`, paymentRefId, status };
  }

  // ─── COD ───────────────────────────────────────────────────────────────────

  @Post(':orderId/cod')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm Cash on Delivery order' })
  confirmCOD(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.confirmCOD(orderId, userId);
  }

  // ─── SSLCommerz ────────────────────────────────────────────────────────────

  @Post(':orderId/sslcommerz')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate SSLCommerz payment (cards + bKash + Nagad aggregator)' })
  initiateSSLCommerz(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.initiateSSLCommerz(orderId, userId);
  }

  /**
   * SSLCommerz IPN (Instant Payment Notification) callback.
   * No auth — SSLCommerz posts here directly after payment.
   * We verify the payment via the validation API before updating order status.
   */
  @Get('sslcommerz/ipn')
  @ApiOperation({ summary: 'SSLCommerz IPN callback (no auth — verified server-side)' })
  async sslCommerzIpn(
    @Query('val_id') val_id: string,
    @Query('status') status: string,
  ) {
    if (val_id && (status === 'VALID' || status === 'VALIDATED')) {
      await this.paymentsService.verifySSLCommerz(val_id);
      return { message: 'Payment verified', val_id, status };
    }
    return { message: `SSLCommerz IPN received: ${status ?? 'unknown'}`, val_id, status };
  }

  // ─── ShurjoPay ─────────────────────────────────────────────────────────────

  @Post(':orderId/shurjopay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate ShurjoPay payment (cards + bKash + Nagad + Rocket + bank)' })
  initiateShurjoPay(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.initiateShurjoPay(orderId, userId);
  }

  @Get('shurjopay/callback')
  @ApiOperation({ summary: 'ShurjoPay payment callback (redirect from ShurjoPay)' })
  async shurjoPayCallback(
    @Query('order_id') sp_order_id: string,
    @Query('status') status: string,
  ) {
    if (sp_order_id) {
      await this.paymentsService.verifyShurjoPay(sp_order_id);
    }
    return { message: `ShurjoPay payment ${status ?? 'processed'}`, sp_order_id, status };
  }

  // ─── AamarPay ──────────────────────────────────────────────────────────────

  @Post(':orderId/aamarpay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate AamarPay payment (cards + bKash + Nagad + Rocket + DBBL)' })
  initiateAamarPay(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.initiateAamarPay(orderId, userId);
  }

  @Get('aamarpay/callback')
  @ApiOperation({ summary: 'AamarPay payment callback (redirect from AamarPay)' })
  async aamarPayCallback(
    @Query('mer_txnid') mer_txnid: string,
    @Query('pay_status') pay_status: string,
  ) {
    if (mer_txnid) {
      await this.paymentsService.verifyAamarPay(mer_txnid);
    }
    return { message: `AamarPay payment ${pay_status ?? 'processed'}`, mer_txnid, pay_status };
  }

  // ─── PortWallet ────────────────────────────────────────────────────────────

  @Post(':orderId/portwallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate PortWallet payment (Visa/MC + bKash + Nexus + internet banking)' })
  initiatePortWallet(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.initiatePortWallet(orderId, userId);
  }

  @Get('portwallet/callback')
  @ApiOperation({ summary: 'PortWallet payment callback (redirect from PortWallet)' })
  async portWalletCallback(
    @Query('invoice') invoice_hash: string,
    @Query('status') status: string,
  ) {
    if (invoice_hash) {
      await this.paymentsService.verifyPortWallet(invoice_hash);
    }
    return { message: `PortWallet payment ${status ?? 'processed'}`, invoice_hash, status };
  }

  // ─── Stripe ────────────────────────────────────────────────────────────────

  @Post(':orderId/stripe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate Stripe PaymentIntent (international cards for NRB customers)' })
  initiateStripe(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.initiateStripe(orderId, userId);
  }

  /**
   * Stripe webhook endpoint.
   * Requires raw body for signature verification — configure NestJS raw body middleware.
   * No auth — Stripe signature is verified via STRIPE_WEBHOOK_SECRET.
   */
  @Post('stripe/webhook')
  @ApiOperation({ summary: 'Stripe webhook (raw body required for signature verification)' })
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new UnauthorizedException('Raw body not available. Ensure rawBody is enabled in NestJS.');
    }

    let event: { type: string; data: { object: { id: string } } };
    try {
      event = this.stripeService.verifyWebhookSignature(rawBody, signature) as typeof event;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
      throw new UnauthorizedException(message);
    }

    if (event.type === 'payment_intent.succeeded') {
      await this.paymentsService.verifyStripe(event.data.object.id);
    } else if (event.type === 'payment_intent.payment_failed') {
      const piId = event.data.object.id;
      await this.paymentsService.handleWebhook(piId, piId, PaymentStatus.FAILED);
    }

    return { received: true };
  }

  // ─── Admin list ─────────────────────────────────────────────────────────────

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all payments (admin)' })
  listAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('method') method?: string,
  ) {
    return this.paymentsService.findAll(+page, +limit, status, method);
  }

  // ─── Internal HMAC webhook ─────────────────────────────────────────────────

  @Post('webhook')
  @ApiOperation({ summary: 'Payment gateway webhook (internal use with HMAC verification)' })
  webhook(
    @Body() body: { transactionId: string; gatewayRef: string; status: string },
    @Headers('x-webhook-signature') signature: string,
  ) {
    const secret = process.env['WEBHOOK_SECRET'];
    if (secret) {
      if (!signature) throw new UnauthorizedException('Missing webhook signature');
      const expected = createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
      try {
        const sigBuf = Buffer.from(signature, 'hex');
        const expBuf = Buffer.from(expected, 'hex');
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          throw new UnauthorizedException('Invalid webhook signature');
        }
      } catch {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }
    return this.paymentsService.handleWebhook(body.transactionId, body.gatewayRef, body.status as PaymentStatus);
  }
}
