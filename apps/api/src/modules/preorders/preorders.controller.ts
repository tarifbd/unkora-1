import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PreordersService } from './preorders.service';

@ApiTags('preorders')
@Controller('preorders')
export class PreordersController {
  constructor(private readonly svc: PreordersService) {}

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get preorder config for product (public)' })
  findByProduct(@Param('productId') id: string) { return this.svc.findByProductId(id); }

  @Post('product/:productId/place')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Place a preorder' })
  place(@Param('productId') productId: string, @CurrentUser('id') userId: string, @Body('orderId') orderId: string) {
    return this.svc.placePreorder(userId, productId, orderId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my preorders' })
  myPreorders(@CurrentUser('id') userId: string) { return this.svc.myPreorders(userId); }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) { return this.svc.findAll(+page, +limit); }

  @Put('admin/product/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  configure(@Param('productId') id: string, @Body() dto: any) { return this.svc.configure(id, dto); }

  @Delete('admin/product/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  delete(@Param('productId') id: string) { return this.svc.delete(id); }
}
