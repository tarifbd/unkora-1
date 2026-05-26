import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { UpdateLoyaltyConfigDto } from './dto/update-loyalty-config.dto';
import { LoyaltyService } from './loyalty.service';

@ApiTags('loyalty')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get loyalty program configuration' })
  getConfig() {
    return this.loyaltyService.getConfig();
  }

  @Patch('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update loyalty config' })
  updateConfig(@Body() dto: UpdateLoyaltyConfigDto) {
    return this.loyaltyService.updateConfig(dto);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all point transactions (paginated)' })
  getTransactions(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.loyaltyService.getTransactions(+page, +limit);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: loyalty stats' })
  getStats() {
    return this.loyaltyService.getStats();
  }

  @Get('users/:userId/points')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user point balance and history' })
  getUserPoints(@Param('userId') userId: string) {
    return this.loyaltyService.getUserPoints(userId);
  }

  @Post('admin/adjust')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: manually adjust user points' })
  adminAdjust(@Body() dto: AdjustPointsDto) {
    return this.loyaltyService.adminAdjust(dto);
  }
}
