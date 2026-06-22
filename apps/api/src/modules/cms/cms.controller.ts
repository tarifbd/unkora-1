import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CmsService } from './cms.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { CreateFaqDto } from './dto/create-faq.dto';

@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  // ── Admin: Pages ───────────────────────────────────────────

  @Get('pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all CMS pages' })
  findAll(
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
  ) {
    return this.cms.findAllPages(parseInt(limit, 10), parseInt(offset, 10));
  }

  @Post('pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create a CMS page' })
  create(@Body() dto: CreatePageDto) {
    return this.cms.createPage(dto);
  }

  @Get('pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: get a CMS page by id' })
  findOne(@Param('id') id: string) {
    return this.cms.findPageById(id);
  }

  @Patch('pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update a CMS page' })
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.cms.updatePage(id, dto);
  }

  @Delete('pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: delete a CMS page' })
  remove(@Param('id') id: string) {
    return this.cms.deletePage(id);
  }

  // Upsert by slug — used by the static page editor
  @Put('pages/by-slug/:slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: upsert a CMS page by slug' })
  upsertBySlug(@Param('slug') slug: string, @Body() dto: UpdatePageDto) {
    return this.cms.upsertPageBySlug(slug, dto);
  }

  // ── Public: Pages ──────────────────────────────────────────

  @Get('public/:slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public: get a published page by slug' })
  getPublicPage(@Param('slug') slug: string) {
    return this.cms.findPageBySlug(slug, true);
  }

  // ── Admin: FAQs ────────────────────────────────────────────

  @Get('faqs')
  @ApiOperation({ summary: 'Get all FAQs (public + admin)' })
  findAllFaqs() {
    return this.cms.findAllFaqs();
  }

  @Post('faqs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create an FAQ' })
  createFaq(@Body() dto: CreateFaqDto) {
    return this.cms.createFaq(dto);
  }

  @Patch('faqs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update an FAQ' })
  updateFaq(@Param('id') id: string, @Body() dto: Partial<CreateFaqDto>) {
    return this.cms.updateFaq(id, dto);
  }

  @Delete('faqs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: delete an FAQ' })
  deleteFaq(@Param('id') id: string) {
    return this.cms.deleteFaq(id);
  }

  @Post('faqs/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: reorder FAQs' })
  reorderFaqs(@Body('ids') ids: string[]) {
    return this.cms.reorderFaqs(ids);
  }
}
