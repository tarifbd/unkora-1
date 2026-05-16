import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateGuestOrderDto } from './dto/create-guest-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersGuestController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('guest')
  @ApiOperation({ summary: 'Place order as guest (no auth required)' })
  createGuest(@Body() dto: CreateGuestOrderDto) {
    return this.ordersService.createGuestOrder(dto);
  }
}
