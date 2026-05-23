import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { DeliveryBoysController } from './delivery-boys.controller';
import { DeliveryBoysService } from './delivery-boys.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DeliveryBoysController],
  providers: [DeliveryBoysService],
  exports: [DeliveryBoysService],
})
export class DeliveryBoysModule {}
