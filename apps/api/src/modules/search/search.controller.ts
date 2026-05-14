import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search products' })
  search(
    @Query('q') q: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categorySlug') categorySlug?: string,
    @Query('inStock') inStock?: string,
  ) {
    return this.searchService.search(q ?? '', {
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
      categorySlug,
      inStock: inStock !== undefined ? inStock === 'true' : undefined,
    });
  }
}
