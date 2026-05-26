import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CodReconciliationController } from './cod-reconciliation.controller';
import { CodReconciliationService } from './cod-reconciliation.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CodReconciliationController],
  providers: [CodReconciliationService],
  exports: [CodReconciliationService],
})
export class CodReconciliationModule {}
