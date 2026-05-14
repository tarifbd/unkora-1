import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BooksService } from './books.service';
import { BookFilterDto } from './dto/book-filter.dto';

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @ApiOperation({ summary: 'List books with advanced filtering' })
  findAll(@Query() filter: BookFilterDto) {
    return this.booksService.findAll(filter);
  }

  @Get('filter-options')
  @ApiOperation({ summary: 'Get available filter options (authors, genres, etc.)' })
  getFilterOptions() {
    return this.booksService.getFilterOptions();
  }
}
