import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersGuestController } from './orders-guest.controller';
import { OrdersService } from './orders.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [OrdersController, OrdersGuestController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
