import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LocalizationController } from './localization.controller';
import { LocalizationService } from './localization.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LocalizationController],
  providers: [LocalizationService],
  exports: [LocalizationService],
})
export class LocalizationModule {}
