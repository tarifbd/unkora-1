import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { FacebookCAPIService } from './facebook-capi.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, FacebookCAPIService],
  exports: [SettingsService, FacebookCAPIService],
})
export class SettingsModule {}
