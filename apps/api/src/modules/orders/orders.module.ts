import { Module } from '@nestjs/common';
import { OrdersCronService } from './orders-cron.service';
import { OrdersController } from './orders.controller';
import { OrdersGuestController } from './orders-guest.controller';
import { OrdersService } from './orders.service';
import { InvoiceService } from './invoice.service';
import { SettingsModule } from '../settings/settings.module';
import { CouponsModule } from '../coupons/coupons.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [SettingsModule, CouponsModule, EmailModule],
  controllers: [OrdersController, OrdersGuestController],
  providers: [OrdersService, InvoiceService, OrdersCronService],
  exports: [OrdersService, InvoiceService],
})
export class OrdersModule {}
