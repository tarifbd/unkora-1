import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdvancedReportsService } from './advanced-reports.service';

@ApiTags('advanced-reports')
@Controller('advanced-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AdvancedReportsController {
  constructor(private readonly svc: AdvancedReportsService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue over time — reads from DailyMetric cache, falls back to live' })
  getRevenue(@Query('period') period = '30d') {
    return this.svc.getDailyMetrics(period);
  }

  @Get('revenue/live')
  @ApiOperation({ summary: 'Live revenue aggregation (slower on large datasets)' })
  getRevenueLive(@Query('period') period = '30d') {
    return this.svc.getRevenue(period);
  }

  @Post('metrics/sync')
  @ApiOperation({ summary: "Sync today's metrics into DailyMetric cache table" })
  syncMetrics() {
    return this.svc.syncDailyMetrics();
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Top 10 products by units sold' })
  getTopProducts() {
    return this.svc.getTopProducts();
  }

  @Get('top-customers')
  @ApiOperation({ summary: 'Top 10 customers by total spend' })
  getTopCustomers() {
    return this.svc.getTopCustomers();
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Conversion funnel: customers → orders → paid → delivered' })
  getFunnel() {
    return this.svc.getFunnel();
  }

  @Get('cohort')
  @ApiOperation({ summary: 'Monthly user cohort with order counts and revenue' })
  getCohort() {
    return this.svc.getCohort();
  }
}
