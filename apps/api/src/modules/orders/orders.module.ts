import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersGuestController } from './orders-guest.controller';
import { OrdersService } from './orders.service';
import { InvoiceService } from './invoice.service';
import { SettingsModule } from '../settings/settings.module';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [SettingsModule, CouponsModule],
  controllers: [OrdersController, OrdersGuestController],
  providers: [OrdersService, InvoiceService],
  exports: [OrdersService, InvoiceService],
})
export class OrdersModule {}
