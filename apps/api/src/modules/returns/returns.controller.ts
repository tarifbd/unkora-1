import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, Patch, Post, Query, UseGuards, Version,
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
  @ApiOperation({ summary: 'List all return requests' })
  findAll(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.returnsService.findAll({ status, type, page: +page, limit: +limit });
  }

  @Get('stats')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get return counts by status' })
  getStats() {
    return this.returnsService.getStats();
  }

  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Get a single return request' })
  findOne(@Param('id') id: string) {
    return this.returnsService.findOne(id);
  }

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a return request' })
  create(@Body() dto: any) {
    return this.returnsService.create(dto);
  }

  @Patch(':id/status')
  @Version('1')
  @ApiOperation({ summary: 'Update return request status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: string; adminNote?: string; refundAmount?: number },
    @CurrentUser() user: { id: string },
  ) {
    return this.returnsService.updateStatus(id, dto, user.id);
  }
}
