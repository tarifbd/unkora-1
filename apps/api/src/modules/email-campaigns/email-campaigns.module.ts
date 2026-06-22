import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { EmailModule } from '../email/email.module';
import { EmailCampaignsController } from './email-campaigns.controller';
import { EmailCampaignsService } from './email-campaigns.service';

@Module({
  imports: [DatabaseModule, EmailModule],
  controllers: [EmailCampaignsController],
  providers: [EmailCampaignsService],
  exports: [EmailCampaignsService],
})
export class EmailCampaignsModule {}
