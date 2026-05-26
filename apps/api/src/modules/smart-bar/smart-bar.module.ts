import { Module } from '@nestjs/common';
import { SmartBarController } from './smart-bar.controller';
import { SmartBarService } from './smart-bar.service';

@Module({
  controllers: [SmartBarController],
  providers: [SmartBarService],
  exports: [SmartBarService],
})
export class SmartBarModule {}
