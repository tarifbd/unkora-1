import { Module } from '@nestjs/common';

import { DeliveryBoysController } from './delivery-boys.controller';
import { DeliveryBoysService } from './delivery-boys.service';

@Module({
  controllers: [DeliveryBoysController],
  providers: [DeliveryBoysService],
  exports: [DeliveryBoysService],
})
export class DeliveryBoysModule {}
