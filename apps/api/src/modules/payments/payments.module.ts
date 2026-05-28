import { Module } from '@nestjs/common';
import { BkashService } from './bkash.service';
import { NagadService } from './nagad.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, BkashService, NagadService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
