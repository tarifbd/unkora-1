import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReturnsService } from './returns.service';

@ApiTags('returns')
@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all return/refund requests' })
  findAll(
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.returnsService.findAll({ status, page: +page, limit: +limit });
  }

  @Get('stats')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get return/refund request counts by status' })
  getStats() {
    return this.returnsService.getStats();
  }

  @Patch(':id/status')
  @Version('1')
  @ApiOperation({ summary: 'Update return/refund status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: string; adminNote?: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.returnsService.updateStatus(id, dto, user.id);
  }
}
