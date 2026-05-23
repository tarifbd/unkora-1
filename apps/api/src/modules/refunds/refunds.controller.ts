import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundDto } from './dto/update-refund.dto';
import { RefundsService } from './refunds.service';

@ApiTags('refunds')
@Controller('refunds')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create a refund request for a delivered order' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateRefundDto) {
    return this.refundsService.create(user.id, dto);
  }

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user refund requests' })
  findMyRefunds(@CurrentUser() user: { id: string }) {
    return this.refundsService.findByUser(user.id);
  }

  @Get('admin')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin: list all refunds with optional status filter' })
  findAll(
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.refundsService.findAll({ status, page: +page, limit: +limit });
  }

  @Patch('admin/:id')
  @Version('1')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin: update refund status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRefundDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.refundsService.updateStatus(id, dto, user.id);
  }
}
