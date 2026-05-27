import { Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { InvoiceService } from './invoice.service';

class UpdateOrderStatusDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Place order from cart' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createFromCart(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my orders' })
  findMyOrders(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findByUser(userId, page ? +page : 1, limit ? +limit : 10);
  }

  @Get('my/:id')
  @ApiOperation({ summary: 'Get order detail' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.ordersService.findById(id, userId);
  }

  @Patch('my/:id/cancel')
  @ApiOperation({ summary: 'Cancel my order' })
  cancel(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.cancel(id, userId, reason);
  }

  // Admin
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List all orders (admin)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findAll(page ? +page : 1, limit ? +limit : 20, status);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get single order (admin)' })
  adminFindOne(@Param('id') id: string) {
    return this.ordersService.adminFindById(id);
  }

  @Patch('admin/:id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update order status (admin)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status, dto.note);
  }

  @Get('admin/export/csv')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export orders as CSV (admin)' })
  async exportCsv(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: FastifyReply,
  ) {
    const csv = await this.ordersService.exportCsv(startDate, endDate);
    (res as FastifyReply)
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`)
      .send(csv);
  }

  @Get('admin/:id/invoice')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get order invoice HTML (admin)' })
  async getInvoiceAdmin(@Param('id') id: string, @Res() res?: FastifyReply) {
    const html = await this.invoiceService.generateInvoiceHtml(id);
    (res as FastifyReply)
      .header('Content-Type', 'text/html; charset=utf-8')
      .send(html);
  }

  @Get('my/:id/invoice')
  @ApiOperation({ summary: 'Get invoice HTML for own order' })
  async getInvoiceMy(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Res() res?: FastifyReply,
  ) {
    // Verify user owns the order before generating invoice
    await this.ordersService.findById(id, userId);
    const html = await this.invoiceService.generateInvoiceHtml(id);
    (res as FastifyReply)
      .header('Content-Type', 'text/html; charset=utf-8')
      .send(html);
  }
}
