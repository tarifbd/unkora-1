import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CourierProvider } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CourierService } from './courier.service';

@ApiTags('courier')
@Controller('courier')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  @Get()
  findAll(
    @Query('provider') provider?: CourierProvider,
    @Query('status') status?: string,
    @Query('page') page?: number,
  ) {
    return this.courierService.findAll({ provider, status, page: page ? +page : 1 });
  }

  @Get('stats')
  getStats() {
    return this.courierService.getStats();
  }

  @Get('cod-pending')
  getCodPending() {
    return this.courierService.getByCodPending();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courierService.findOne(id);
  }

  @Post()
  create(@Body() dto: { orderId: string; provider: CourierProvider; weight?: number; codAmount?: number; charge?: number }) {
    return this.courierService.createShipment(dto.orderId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.courierService.updateShipment(id, dto);
  }
}
