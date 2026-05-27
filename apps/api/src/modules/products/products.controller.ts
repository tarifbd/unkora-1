import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SetWholesaleDto } from './dto/wholesale.dto';
import { CsvImportService } from './csv-import.service';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly csvImportService: CsvImportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List products with filtering & pagination' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  findFeatured(@Query('limit') limit?: string) {
    return this.productsService.findFeatured(limit ? parseInt(limit, 10) : 8);
  }

  @Get('export/csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export products as CSV (admin)' })
  async exportCsv(@Res() res?: FastifyReply) {
    const csv = await this.productsService.exportCsv();
    (res as FastifyReply)
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"`)
      .send(csv);
  }

  @Get('import/template')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download CSV import template' })
  async getCsvTemplate(@Res() res?: FastifyReply) {
    const csv = `name,sku,basePrice,salePrice,stockQuantity,categoryName,brandName,description,shortDesc,tags,weight,isActive
"Sample Product 1",SKU-001,999,849,50,Electronics,Samsung,"Full product description here","Short desc",smartphone|mobile,0.3,true
"Sample Product 2",SKU-002,1999,,100,Clothing,,"Another description","Short",shirt|fashion,0.2,true`;
    (res as FastifyReply)
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename="unkora-import-template.csv"')
      .send(csv);
  }

  @Post('import/csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import products from CSV text (admin)' })
  async importCsv(
    @Body() dto: { csvContent: string; dryRun?: boolean; updateExisting?: boolean },
  ) {
    return this.csvImportService.importProducts(dto.csvContent, { dryRun: dto.dryRun, updateExisting: dto.updateExisting });
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: get product by ID' })
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get product by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product (admin)' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete product (admin)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get(':id/wholesale')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get wholesale pricing tiers for a product' })
  getWholesaleTiers(@Param('id') id: string) {
    return this.productsService.getWholesaleTiers(id);
  }

  @Put(':id/wholesale')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: replace all wholesale pricing tiers for a product' })
  setWholesaleTiers(@Param('id') id: string, @Body() dto: SetWholesaleDto) {
    return this.productsService.setWholesaleTiers(id, dto);
  }
}
