import { Body, Controller, Headers, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createHmac, timingSafeEqual } from 'crypto';

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

  @Post('webhook')
  @ApiOperation({ summary: 'Payment gateway webhook (internal)' })
  webhook(
    @Body() body: { transactionId: string; gatewayRef: string; status: string },
    @Headers('x-webhook-signature') signature: string,
  ) {
    const secret = process.env['WEBHOOK_SECRET'];
    if (secret) {
      if (!signature) throw new UnauthorizedException('Missing webhook signature');
      const expected = createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');
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
    return this.paymentsService.handleWebhook(body.transactionId, body.gatewayRef, body.status as any);
  }
}
