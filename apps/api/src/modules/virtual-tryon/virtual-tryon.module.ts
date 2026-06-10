import { Module } from '@nestjs/common';
import { VirtualTryOnController } from './virtual-tryon.controller';
import { VirtualTryOnService } from './virtual-tryon.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [VirtualTryOnController],
  providers: [VirtualTryOnService],
})
export class VirtualTryOnModule {}
