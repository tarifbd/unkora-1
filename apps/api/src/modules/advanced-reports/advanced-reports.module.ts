import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdvancedReportsController } from './advanced-reports.controller';
import { AdvancedReportsService } from './advanced-reports.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdvancedReportsController],
  providers: [AdvancedReportsService],
  exports: [AdvancedReportsService],
})
export class AdvancedReportsModule {}
