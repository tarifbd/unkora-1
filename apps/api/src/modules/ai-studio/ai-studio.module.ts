import { Module } from '@nestjs/common';
import { AiStudioController } from './ai-studio.controller';
import { AiStudioService } from './ai-studio.service';

@Module({
  controllers: [AiStudioController],
  providers: [AiStudioService],
  exports: [AiStudioService],
})
export class AiStudioModule {}
