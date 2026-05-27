import { Module } from '@nestjs/common';
import { CsvImportService } from './csv-import.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, CsvImportService],
  exports: [ProductsService, CsvImportService],
})
export class ProductsModule {}
