import {
  Controller, Delete, Get, Param, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PredictionsService } from './predictions.service';

@ApiTags('predictions')
@Controller('predictions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class PredictionsController {
  constructor(private readonly svc: PredictionsService) {}

  @Get('admin/dashboard')
  @ApiOperation({ summary: '[Admin] Predictive demand dashboard' })
  getDashboard() {
    return this.svc.getDashboard();
  }

  @Get('admin/trending')
  @ApiOperation({ summary: '[Admin] Trending products by sales velocity' })
  getTrending() {
    return this.svc.getTrendingProducts();
  }

  @Get('admin/festivals')
  @ApiOperation({ summary: '[Admin] Upcoming festivals & seasons' })
  getFestivals() {
    return this.svc.getUpcomingFestivals();
  }

  @Get('admin/seasonal')
  @ApiOperation({ summary: '[Admin] Seasonal sales analysis by category' })
  getSeasonal() {
    return this.svc.getSeasonalAnalysis();
  }

  @Post('admin/forecast')
  @ApiOperation({ summary: '[Admin] Generate AI demand forecast report' })
  generateForecast() {
    return this.svc.generateForecast();
  }

  @Get('admin/reports')
  @ApiOperation({ summary: '[Admin] List forecast reports' })
  listReports(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.svc.listReports({ page: +page, limit: +limit });
  }

  @Get('admin/reports/:id')
  @ApiOperation({ summary: '[Admin] Get forecast report detail' })
  getReport(@Param('id') id: string) {
    return this.svc.getReport(id);
  }

  @Delete('admin/reports/:id')
  @ApiOperation({ summary: '[Admin] Delete forecast report' })
  deleteReport(@Param('id') id: string) {
    return this.svc.deleteReport(id);
  }
}
