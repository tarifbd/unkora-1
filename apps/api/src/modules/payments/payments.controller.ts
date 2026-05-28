import { Body, Controller, Get, Headers, Param, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createHmac, timingSafeEqual } from 'crypto';
import { PaymentStatus } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':orderId/bkash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate bKash payment' })
  initiateBkash(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.initiateBkash(orderId, userId);
  }

  @Post(':orderId/nagad')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate Nagad payment' })
  initiateNagad(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.initiateNagad(orderId, userId);
  }

  @Post(':orderId/cod')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm Cash on Delivery order' })
  confirmCOD(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.confirmCOD(orderId, userId);
  }

  // bKash redirects user to this URL after payment
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

  // Nagad redirects user to this URL after payment
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
