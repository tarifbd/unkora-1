import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { EmailModule } from '../email/email.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { WarehouseService } from './warehouse.service';
import { SupplierService } from './supplier.service';
import { PurchaseOrderService } from './purchase-order.service';

@Module({
  imports: [DatabaseModule, EmailModule],
  controllers: [InventoryController],
  providers: [InventoryService, WarehouseService, SupplierService, PurchaseOrderService],
  exports: [InventoryService, WarehouseService],
})
export class InventoryModule {}
