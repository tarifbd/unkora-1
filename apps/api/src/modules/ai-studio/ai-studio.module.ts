import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiStudioController } from './ai-studio.controller';
import { AiPublicController } from './ai-public.controller';
import { AiStudioService } from './ai-studio.service';
import { AiProviderFactory } from './providers/ai-provider.factory';

@Module({
  imports: [DatabaseModule],
  controllers: [AiStudioController, AiPublicController],
  providers: [AiStudioService, AiProviderFactory],
  exports: [AiStudioService, AiProviderFactory],
})
export class AiStudioModule {}
