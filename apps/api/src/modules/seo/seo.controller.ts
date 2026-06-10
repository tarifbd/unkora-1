import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SeoService } from './seo.service';
import { AiStudioService } from '../ai-studio/ai-studio.service';
import { UpsertSeoMetadataDto } from './dto/upsert-seo-metadata.dto';
import { CreateRedirectDto } from './dto/create-redirect.dto';
import { UpdateSitemapEntryDto } from './dto/update-sitemap-entry.dto';
import { UpdateSeoSettingsDto } from './dto/update-seo-settings.dto';

@ApiTags('seo')
@Controller('seo')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class SeoController {
  constructor(
    private readonly seoService: SeoService,
    private readonly aiStudioService: AiStudioService,
  ) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────────

  @Get('dashboard')
  @Version('1')
  @ApiOperation({ summary: 'Get SEO dashboard overview' })
  getDashboard() {
    return this.seoService.getDashboard();
  }

  // ─── Legacy endpoints (keep for backward compatibility) ───────────────────────

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
  @ApiOperation({ summary: 'Update product SEO fields (legacy)' })
  updateProductLegacy(
    @Param('id') id: string,
    @Body() dto: { metaTitle?: string; metaDesc?: string; metaKeywords?: string },
  ) {
    return this.seoService.updateProduct(id, dto);
  }

  // ─── Product SEO ──────────────────────────────────────────────────────────────

  @Get('products/:id/full')
  @Version('1')
  @ApiOperation({ summary: 'Get full product SEO data with metadata' })
  getProductSeoFull(@Param('id') id: string) {
    return this.seoService.getProductSeo(id);
  }

  @Post('products/:id/audit')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run SEO audit on a product' })
  auditProduct(@Param('id') id: string, @Query('url') url?: string) {
    return this.seoService.auditEntity('PRODUCT', id, url);
  }

  @Post('products/:id/generate-ai')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate SEO data for a product using AI' })
  async generateProductSeoAi(
    @Param('id') id: string,
    @Body() dto: { productName?: string; targetKeywords?: string[] },
    @CurrentUser('id') userId: string,
  ) {
    const product = await this.seoService.getProductSeo(id);
    const productName = dto.productName ?? (product as any).name ?? '';
    return this.aiStudioService.generateProductSeo(
      { productName, targetKeywords: dto.targetKeywords },
      userId,
    );
  }

  // ─── Category SEO ─────────────────────────────────────────────────────────────

  @Get('categories')
  @Version('1')
  @ApiOperation({ summary: 'List categories with SEO metadata' })
  getCategoriesSeo(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.seoService.getCategoriesSeo({ page: +page, limit: +limit });
  }

  @Get('categories/:id')
  @Version('1')
  @ApiOperation({ summary: 'Get category SEO data' })
  getCategorySeo(@Param('id') id: string) {
    return this.seoService.getCategorySeo(id);
  }

  @Patch('categories/:id')
  @Version('1')
  @ApiOperation({ summary: 'Update category SEO metadata' })
  updateCategorySeo(@Param('id') id: string, @Body() dto: UpsertSeoMetadataDto) {
    return this.seoService.updateCategorySeo(id, dto);
  }

  @Post('categories/:id/audit')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run SEO audit on a category' })
  auditCategory(@Param('id') id: string, @Query('url') url?: string) {
    return this.seoService.auditEntity('CATEGORY', id, url);
  }

  @Post('categories/:id/generate-ai')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate SEO data for a category using AI' })
  async generateCategorySeoAi(
    @Param('id') id: string,
    @Body() dto: { categoryName?: string; targetKeywords?: string[] },
    @CurrentUser('id') userId: string,
  ) {
    const category = await this.seoService.getCategorySeo(id);
    const categoryName = dto.categoryName ?? (category as any).name ?? '';
    return this.aiStudioService.generateCategorySeo(
      { categoryName, targetKeywords: dto.targetKeywords },
      userId,
    );
  }

  // ─── SEO Metadata ─────────────────────────────────────────────────────────────

  @Get('metadata')
  @Version('1')
  @ApiOperation({ summary: 'List all SEO metadata records' })
  listMetadata(
    @Query('entityType') entityType?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.seoService.listMetadata({ entityType, page: +page, limit: +limit });
  }

  @Post('metadata')
  @Version('1')
  @ApiOperation({ summary: 'Create SEO metadata record' })
  createMetadata(
    @Body()
    dto: UpsertSeoMetadataDto & { entityType: string; entityId: string },
  ) {
    const { entityType, entityId, ...rest } = dto;
    return this.seoService.createMetadata(entityType, entityId, rest);
  }

  @Get('metadata/:id')
  @Version('1')
  @ApiOperation({ summary: 'Get a SEO metadata record' })
  getMetadata(@Param('id') id: string) {
    return this.seoService.getMetadata(id);
  }

  @Patch('metadata/:id')
  @Version('1')
  @ApiOperation({ summary: 'Update a SEO metadata record' })
  updateMetadata(@Param('id') id: string, @Body() dto: UpsertSeoMetadataDto) {
    return this.seoService.updateMetadata(id, dto);
  }

  @Delete('metadata/:id')
  @Version('1')
  @ApiOperation({ summary: 'Delete a SEO metadata record' })
  async deleteMetadata(@Param('id') id: string) {
    await this.seoService.deleteMetadata(id);
    return { message: 'SEO metadata deleted' };
  }

  // ─── Audits ───────────────────────────────────────────────────────────────────

  @Get('audits')
  @Version('1')
  @ApiOperation({ summary: 'List SEO audits' })
  listAudits(
    @Query('entityType') entityType?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.seoService.listAudits({ entityType, page: +page, limit: +limit });
  }

  @Get('audits/:id')
  @Version('1')
  @ApiOperation({ summary: 'Get a specific audit' })
  getAudit(@Param('id') id: string) {
    return this.seoService.getAudit(id);
  }

  @Post('audit/bulk')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run bulk SEO audit for all entities of a type' })
  bulkAudit(@Body() dto: { entityType: string }) {
    return this.seoService.bulkAudit(dto.entityType);
  }

  // ─── Redirects ────────────────────────────────────────────────────────────────

  @Get('redirects')
  @Version('1')
  @ApiOperation({ summary: 'List SEO redirects' })
  listRedirects(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('isActive') isActive?: string,
  ) {
    return this.seoService.listRedirects({
      page: +page,
      limit: +limit,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Post('redirects')
  @Version('1')
  @ApiOperation({ summary: 'Create a SEO redirect' })
  createRedirect(@Body() dto: CreateRedirectDto) {
    return this.seoService.createRedirect(dto);
  }

  @Get('redirects/:id')
  @Version('1')
  @ApiOperation({ summary: 'Get a SEO redirect' })
  getRedirect(@Param('id') id: string) {
    return this.seoService.getRedirect(id);
  }

  @Patch('redirects/:id')
  @Version('1')
  @ApiOperation({ summary: 'Update a SEO redirect' })
  updateRedirect(@Param('id') id: string, @Body() dto: Partial<CreateRedirectDto>) {
    return this.seoService.updateRedirect(id, dto);
  }

  @Delete('redirects/:id')
  @Version('1')
  @ApiOperation({ summary: 'Delete a SEO redirect' })
  async deleteRedirect(@Param('id') id: string) {
    await this.seoService.deleteRedirect(id);
    return { message: 'Redirect deleted' };
  }

  // ─── Sitemap ──────────────────────────────────────────────────────────────────

  @Get('sitemap')
  @Version('1')
  @ApiOperation({ summary: 'Get sitemap entries' })
  getSitemap() {
    return this.seoService.getSitemap();
  }

  @Post('sitemap/regenerate')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate sitemap from live data' })
  regenerateSitemap() {
    return this.seoService.regenerateSitemap();
  }

  @Patch('sitemap/entries/:id')
  @Version('1')
  @ApiOperation({ summary: 'Update a sitemap entry' })
  updateSitemapEntry(@Param('id') id: string, @Body() dto: UpdateSitemapEntryDto) {
    return this.seoService.updateSitemapEntry(id, dto);
  }

  @Get('sitemap/xml')
  @Version('1')
  @Header('Content-Type', 'application/xml')
  @ApiOperation({ summary: 'Get XML sitemap (public endpoint)' })
  getSitemapXml() {
    return this.seoService.generateSitemapXml();
  }

  // ─── Robots.txt ───────────────────────────────────────────────────────────────

  @Get('robots')
  @Version('1')
  @ApiOperation({ summary: 'Get robots.txt content' })
  getRobots() {
    return this.seoService.getRobots();
  }

  @Patch('robots')
  @Version('1')
  @ApiOperation({ summary: 'Update robots.txt content' })
  updateRobots(@Body() dto: { robotsTxt: string }) {
    return this.seoService.updateRobots(dto.robotsTxt);
  }

  // ─── Image Alts ───────────────────────────────────────────────────────────────

  @Get('image-alts')
  @Version('1')
  @ApiOperation({ summary: 'List image alt text records' })
  listImageAlts(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.seoService.listImageAlts({
      entityType,
      entityId,
      page: +page,
      limit: +limit,
    });
  }

  @Post('image-alts')
  @Version('1')
  @ApiOperation({ summary: 'Create image alt text record' })
  createImageAlt(
    @Body() dto: {
      entityType: string;
      entityId: string;
      imageUrl: string;
      altText: string;
      titleText?: string;
    },
  ) {
    return this.seoService.createImageAlt(dto);
  }

  @Patch('image-alts/:id')
  @Version('1')
  @ApiOperation({ summary: 'Update image alt text record' })
  updateImageAlt(
    @Param('id') id: string,
    @Body() dto: { altText?: string; titleText?: string },
  ) {
    return this.seoService.updateImageAlt(id, dto);
  }

  // ─── SEO Settings ─────────────────────────────────────────────────────────────

  @Get('settings')
  @Version('1')
  @ApiOperation({ summary: 'Get SEO global settings' })
  getSettings() {
    return this.seoService.getSettings();
  }

  @Patch('settings')
  @Version('1')
  @ApiOperation({ summary: 'Update SEO global settings' })
  updateSettings(@Body() dto: UpdateSeoSettingsDto) {
    return this.seoService.updateSettings(dto);
  }
}
