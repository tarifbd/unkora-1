import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ShippingZonesService } from './shipping-zones.service';

@ApiTags('shipping-zones')
@Controller('shipping-zones')
export class ShippingZonesController {
  constructor(private readonly svc: ShippingZonesService) {}

  @Get()
  findAll() { return this.svc.findAll(); }

  @Get('calculate')
  @ApiOperation({ summary: 'Calculate shipping rates for district/weight' })
  calculate(
    @Query('district') district?: string,
    @Query('division') division?: string,
    @Query('country') country?: string,
    @Query('weight') weight = '1',
    @Query('orderTotal') orderTotal = '0',
  ) {
    return this.svc.calculateRate({ district, division, country, weight: +weight, orderTotal: +orderTotal });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  create(@Body() dto: any) { return this.svc.adminCreate(dto); }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: any) { return this.svc.adminUpdate(id, dto); }

  @Post(':id/rates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  addRate(@Param('id') id: string, @Body() dto: any) { return this.svc.addRate(id, dto); }

  @Delete(':id/rates/:rateId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  deleteRate(@Param('rateId') rateId: string) { return this.svc.deleteRate(rateId); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  delete(@Param('id') id: string) { return this.svc.delete(id); }
}
