import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CreateGuestOrderDto } from './dto/create-guest-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersGuestController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('guest')
  @ApiOperation({ summary: 'Place order as guest (no auth required)' })
  createGuest(@Body() dto: CreateGuestOrderDto, @Req() req: FastifyRequest) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? (req as any).ip
      ?? req.socket?.remoteAddress
      ?? 'unknown';
    const userAgent = req.headers['user-agent'] ?? 'unknown';
    return this.ordersService.createGuestOrder(dto, { ip, userAgent });
  }

  @Get('track')
  @ApiOperation({ summary: 'Track order by order number + phone (public)' })
  track(@Query('orderNumber') orderNumber: string, @Query('phone') phone: string) {
    return this.ordersService.trackPublic(orderNumber, phone);
  }
}
