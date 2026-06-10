import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiStudioModule } from '../ai-studio/ai-studio.module';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';

@Module({
  imports: [DatabaseModule, AiStudioModule],
  controllers: [PredictionsController],
  providers: [PredictionsService],
  exports: [PredictionsService],
})
export class PredictionsModule {}
