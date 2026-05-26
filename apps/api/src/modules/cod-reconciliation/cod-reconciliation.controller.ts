import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CodReconciliationService } from './cod-reconciliation.service';

@ApiTags('cod-reconciliation')
@Controller('cod-reconciliation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class CodReconciliationController {
  constructor(private readonly codService: CodReconciliationService) {}

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List delivered shipments with COD amounts' })
  findAll(
    @Query('provider') provider?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.codService.findAll({ provider, page: +page, limit: +limit });
  }

  @Get('stats')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get COD reconciliation stats' })
  getStats() {
    return this.codService.getStats();
  }

  @Get('summary')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get COD totals grouped by provider' })
  getSummary() {
    return this.codService.getSummaryByProvider();
  }
}
