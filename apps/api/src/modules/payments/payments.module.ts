import { Module } from '@nestjs/common';
import { AamarPayService } from './aamarpay.service';
import { BkashService } from './bkash.service';
import { NagadService } from './nagad.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PortWalletService } from './portwallet.service';
import { ShurjoPayService } from './shurjopay.service';
import { SslCommerzService } from './sslcommerz.service';
import { StripeService } from './stripe.service';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    BkashService,
    NagadService,
    SslCommerzService,
    ShurjoPayService,
    AamarPayService,
    PortWalletService,
    StripeService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
