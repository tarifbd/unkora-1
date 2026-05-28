import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiStudioController } from './ai-studio.controller';
import { AiStudioService } from './ai-studio.service';
import { AiProviderFactory } from './providers/ai-provider.factory';

@Module({
  imports: [DatabaseModule],
  controllers: [AiStudioController],
  providers: [AiStudioService, AiProviderFactory],
  exports: [AiStudioService, AiProviderFactory],
})
export class AiStudioModule {}
