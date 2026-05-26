import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DesignService } from './design.service';

@ApiTags('design')
@Controller('design')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class DesignController {
  constructor(private readonly designService: DesignService) {}

  // ─── Themes ───────────────────────────────────────────────────

  @Get('themes')
  @ApiOperation({ summary: 'List all themes' })
  getThemes() {
    return this.designService.getThemes();
  }

  @Post('themes')
  @ApiOperation({ summary: 'Create a theme' })
  createTheme(@Body() body: any) {
    return this.designService.createTheme(body);
  }

  @Patch('themes/:id')
  @ApiOperation({ summary: 'Update a theme' })
  updateTheme(@Param('id') id: string, @Body() body: any) {
    return this.designService.updateTheme(id, body);
  }

  @Delete('themes/:id')
  @ApiOperation({ summary: 'Delete a theme' })
  deleteTheme(@Param('id') id: string) {
    return this.designService.deleteTheme(id);
  }

  @Patch('themes/:id/activate')
  @ApiOperation({ summary: 'Activate a theme' })
  activateTheme(@Param('id') id: string) {
    return this.designService.activateTheme(id);
  }

  // ─── Banners ──────────────────────────────────────────────────

  @Get('banners')
  @ApiOperation({ summary: 'List all banners' })
  getBanners() {
    return this.designService.getBanners();
  }

  @Post('banners')
  @ApiOperation({ summary: 'Create a banner' })
  createBanner(@Body() body: any) {
    return this.designService.createBanner(body);
  }

  @Patch('banners/:id')
  @ApiOperation({ summary: 'Update a banner' })
  updateBanner(@Param('id') id: string, @Body() body: any) {
    return this.designService.updateBanner(id, body);
  }

  @Delete('banners/:id')
  @ApiOperation({ summary: 'Delete a banner' })
  deleteBanner(@Param('id') id: string) {
    return this.designService.deleteBanner(id);
  }

  // ─── Homepage Sections ────────────────────────────────────────

  @Get('sections')
  @ApiOperation({ summary: 'List all homepage sections' })
  getSections() {
    return this.designService.getSections();
  }

  @Post('sections')
  @ApiOperation({ summary: 'Create a homepage section' })
  createSection(@Body() body: any) {
    return this.designService.createSection(body);
  }

  @Patch('sections/reorder')
  @ApiOperation({ summary: 'Reorder homepage sections' })
  reorderSections(@Body() body: { items: { id: string; order: number }[] }) {
    return this.designService.reorderSections(body.items);
  }

  @Patch('sections/:id')
  @ApiOperation({ summary: 'Update a homepage section' })
  updateSection(@Param('id') id: string, @Body() body: any) {
    return this.designService.updateSection(id, body);
  }

  @Delete('sections/:id')
  @ApiOperation({ summary: 'Delete a homepage section' })
  deleteSection(@Param('id') id: string) {
    return this.designService.deleteSection(id);
  }
}
