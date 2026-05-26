import { Module } from '@nestjs/common';
import { ProductNotesController } from './product-notes.controller';
import { ProductNotesService } from './product-notes.service';

@Module({
  controllers: [ProductNotesController],
  providers: [ProductNotesService],
  exports: [ProductNotesService],
})
export class ProductNotesModule {}
