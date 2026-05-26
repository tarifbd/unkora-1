import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SeoService } from './seo.service';

@ApiTags('seo')
@Controller('seo')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('products')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List products with SEO metadata status' })
  getProducts(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('missingMeta') missingMeta?: string,
  ) {
    return this.seoService.getProducts({
      page: +page,
      limit: +limit,
      missingMeta: missingMeta === 'true',
    });
  }

  @Get('stats')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get SEO health stats' })
  getStats() {
    return this.seoService.getStats();
  }

  @Get('sitemap-info')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get sitemap generation info' })
  getSitemapInfo() {
    return this.seoService.getSitemapInfo();
  }

  @Patch('products/:id')
  @Version('1')
  @ApiOperation({ summary: 'Update product SEO fields' })
  updateProduct(
    @Param('id') id: string,
    @Body() dto: { metaTitle?: string; metaDesc?: string; metaKeywords?: string },
  ) {
    return this.seoService.updateProduct(id, dto);
  }
}
