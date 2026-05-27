import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ShiprocketService } from './shiprocket.service';

@ApiTags('shiprocket')
@Controller('shiprocket')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class ShiprocketController {
  constructor(private readonly svc: ShiprocketService) {}

  @Post('orders')
  @ApiOperation({ summary: 'Create Shiprocket order' })
  createOrder(@Body() dto: any) { return this.svc.createOrder(dto); }

  @Get('orders')
  @ApiOperation({ summary: 'List Shiprocket orders' })
  listOrders(@Query('page') page = 1, @Query('per_page') perPage = 20) {
    return this.svc.listOrders(+page, +perPage);
  }

  @Get('track/:shipmentId')
  @ApiOperation({ summary: 'Track shipment by ID' })
  track(@Param('shipmentId') id: string) { return this.svc.trackOrder(id); }

  @Get('track/awb/:awb')
  @ApiOperation({ summary: 'Track by AWB number' })
  trackAwb(@Param('awb') awb: string) { return this.svc.trackByAwb(awb); }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel orders' })
  cancel(@Body() dto: { ids: number[] }) { return this.svc.cancelOrder(dto.ids); }

  @Get('rates')
  @ApiOperation({ summary: 'Get courier rates for a shipment' })
  getRates(
    @Query('pickup_postcode') pickupPostcode: string,
    @Query('delivery_postcode') deliveryPostcode: string,
    @Query('weight') weight: string,
    @Query('cod') cod: string,
  ) {
    return this.svc.getShippingRates({ pickupPostcode, deliveryPostcode, weight: +weight, cod: cod === '1' ? 1 : 0 });
  }

  @Post('labels')
  @ApiOperation({ summary: 'Generate shipping labels' })
  generateLabels(@Body() dto: { shipment_ids: number[] }) { return this.svc.generateLabel(dto.shipment_ids); }

  @Get('pickup-locations')
  @ApiOperation({ summary: 'Get pickup locations' })
  getPickupLocations() { return this.svc.getPickupLocations(); }
}
