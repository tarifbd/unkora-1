import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShipmentStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { ShipmentsService } from './shipments.service';

@ApiTags('shipments')
@Controller('shipments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @Version('1')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin: create shipment for order' })
  create(@Body() dto: CreateShipmentDto) {
    return this.shipmentsService.create(dto);
  }

  @Get()
  @Version('1')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin: list all shipments' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: ShipmentStatus) {
    return this.shipmentsService.findAll(+page, +limit, status);
  }

  @Get(':id')
  @Version('1')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin: get shipment detail' })
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id')
  @Version('1')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin: update shipment status/tracking' })
  update(@Param('id') id: string, @Body() dto: UpdateShipmentDto) {
    return this.shipmentsService.update(id, dto);
  }

  @Get('order/:orderId')
  @Version('1')
  @ApiOperation({ summary: 'Customer: get shipment tracking for my order' })
  getMyShipment(@Param('orderId') orderId: string, @CurrentUser() user: { id: string }) {
    return this.shipmentsService.getMyShipment(orderId, user.id);
  }
}
