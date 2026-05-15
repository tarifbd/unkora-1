import { Body, Controller, Get, Param, Post, Query, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Admin: get inventory overview' })
  getOverview(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.inventoryService.getInventoryOverview(+page, +limit);
  }

  @Get('low-stock')
  @Version('1')
  @ApiOperation({ summary: 'Admin: get low stock products' })
  getLowStock() {
    return this.inventoryService.getLowStockProducts();
  }

  @Get(':productId/history')
  @Version('1')
  @ApiOperation({ summary: 'Admin: get stock movement history for a product' })
  getHistory(@Param('productId') productId: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.inventoryService.getStockHistory(productId, +page, +limit);
  }

  @Post('adjust')
  @Version('1')
  @ApiOperation({ summary: 'Admin: adjust stock for a product' })
  adjust(@Body() dto: AdjustStockDto, @CurrentUser() user: { id: string }) {
    return this.inventoryService.adjustStock(dto, user.id);
  }
}
