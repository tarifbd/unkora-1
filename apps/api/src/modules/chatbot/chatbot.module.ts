import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiStudioModule } from '../ai-studio/ai-studio.module';
import { SettingsModule } from '../settings/settings.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';

@Module({
  imports: [DatabaseModule, AiStudioModule, SettingsModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
