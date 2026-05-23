import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { FlashDealsController } from './flash-deals.controller';
import { FlashDealsService } from './flash-deals.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FlashDealsController],
  providers: [FlashDealsService],
  exports: [FlashDealsService],
})
export class FlashDealsModule {}
