import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { DesignController } from './design.controller';
import { DesignService } from './design.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DesignController],
  providers: [DesignService],
  exports: [DesignService],
})
export class DesignModule {}
