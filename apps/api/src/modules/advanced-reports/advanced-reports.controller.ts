import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
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
  constructor(private readonly advancedReportsService: AdvancedReportsService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue over time (period: 7d|30d|90d|1y)' })
  getRevenue(@Query('period') period = '30d') {
    return this.advancedReportsService.getRevenue(period);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Top 10 products by units sold' })
  getTopProducts() {
    return this.advancedReportsService.getTopProducts();
  }

  @Get('top-customers')
  @ApiOperation({ summary: 'Top 10 customers by total spend' })
  getTopCustomers() {
    return this.advancedReportsService.getTopCustomers();
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Conversion funnel: users → orders → delivered' })
  getFunnel() {
    return this.advancedReportsService.getFunnel();
  }

  @Get('cohort')
  @ApiOperation({ summary: 'Monthly user cohort with order counts' })
  getCohort() {
    return this.advancedReportsService.getCohort();
  }
}
