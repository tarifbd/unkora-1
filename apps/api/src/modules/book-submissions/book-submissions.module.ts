import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { BookSubmissionsController } from './book-submissions.controller';
import { BookSubmissionsService } from './book-submissions.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BookSubmissionsController],
  providers: [BookSubmissionsService],
})
export class BookSubmissionsModule {}
