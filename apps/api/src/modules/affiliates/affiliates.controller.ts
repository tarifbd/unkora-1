import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AffiliatesService } from './affiliates.service';

@ApiTags('affiliates')
@Controller('affiliates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Get()
  @ApiOperation({ summary: 'List all affiliates' })
  getAffiliates(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.affiliatesService.getAffiliates(+page, +limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Affiliate program stats' })
  getStats() {
    return this.affiliatesService.getStats();
  }

  @Post()
  @ApiOperation({ summary: 'Create affiliate' })
  createAffiliate(
    @Body() body: { userId: string; commissionRate?: number; code: string },
  ) {
    return this.affiliatesService.createAffiliate(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update affiliate commission/status' })
  updateAffiliate(
    @Param('id') id: string,
    @Body() body: Partial<{ commissionRate: number; status: string }>,
  ) {
    return this.affiliatesService.updateAffiliate(id, body);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'List affiliate payouts' })
  getPayouts(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.affiliatesService.getPayouts(+page, +limit);
  }

  @Patch('payouts/:id')
  @ApiOperation({ summary: 'Approve or reject a payout' })
  updatePayout(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.affiliatesService.updatePayout(id, body);
  }
}
