import {
  Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards, Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { SetStockDto } from './dto/set-stock.dto';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto } from './dto/purchase-order.dto';
import { InventoryService } from './inventory.service';
import { WarehouseService } from './warehouse.service';
import { SupplierService } from './supplier.service';
import { PurchaseOrderService } from './purchase-order.service';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly warehouseService: WarehouseService,
    private readonly supplierService: SupplierService,
    private readonly purchaseOrderService: PurchaseOrderService,
  ) {}

  // ─── V1 Legacy ───────────────────────────────────────────────

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Admin: get inventory overview' })
  getOverview(@Query('page') page = 1, @Query('limit') limit = 200, @Query('filter') filter?: string) {
    return this.inventoryService.getInventoryOverview(+page, +limit, filter);
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
  @ApiOperation({ summary: 'Admin: adjust stock for a product (legacy)' })
  adjust(@Body() dto: AdjustStockDto, @CurrentUser() user: { id: string }) {
    return this.inventoryService.adjustStock(dto, user.id);
  }

  // ─── V2 Dashboard ────────────────────────────────────────────

  @Get('v2/dashboard')
  @ApiOperation({ summary: 'Admin: inventory v2 dashboard stats' })
  getDashboard() {
    return this.inventoryService.getDashboard();
  }

  // ─── V2 Stocks ───────────────────────────────────────────────

  @Get('v2/stocks')
  @ApiOperation({ summary: 'Admin: list inventory stocks' })
  getStocks(
    @Query('page') page = 1,
    @Query('limit') limit = 30,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.inventoryService.getStocksV2(+page, +limit, warehouseId, status);
  }

  @Post('v2/stocks/set')
  @ApiOperation({ summary: 'Admin: set stock quantity for a product' })
  setStock(@Body() dto: SetStockDto, @CurrentUser() user: { id: string }) {
    return this.inventoryService.setStock(dto, user.id);
  }

  // ─── V2 Movements (Ledger) ────────────────────────────────────

  @Get('v2/movements')
  @ApiOperation({ summary: 'Admin: inventory movement ledger' })
  getMovements(
    @Query('page') page = 1,
    @Query('limit') limit = 30,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('type') type?: string,
  ) {
    return this.inventoryService.getMovements(+page, +limit, productId, warehouseId, type);
  }

  // ─── V2 Adjustments ──────────────────────────────────────────

  @Get('v2/adjustments')
  @ApiOperation({ summary: 'Admin: list stock adjustments' })
  getAdjustments(@Query('page') page = 1, @Query('limit') limit = 20, @Query('productId') productId?: string) {
    return this.inventoryService.getAdjustments(+page, +limit, productId);
  }

  @Post('v2/adjustments')
  @ApiOperation({ summary: 'Admin: create a stock adjustment' })
  createAdjustment(@Body() dto: StockAdjustmentDto, @CurrentUser() user: { id: string }) {
    return this.inventoryService.createAdjustment(dto, user.id);
  }

  // ─── V2 Alerts ───────────────────────────────────────────────

  @Get('v2/alerts')
  @ApiOperation({ summary: 'Admin: inventory alerts' })
  getAlerts(@Query('page') page = 1, @Query('limit') limit = 20, @Query('resolved') resolved?: string) {
    return this.inventoryService.getAlerts(+page, +limit, resolved === 'true');
  }

  @Patch('v2/alerts/:id/resolve')
  @ApiOperation({ summary: 'Admin: resolve an inventory alert' })
  resolveAlert(@Param('id') id: string) {
    return this.inventoryService.resolveAlert(id);
  }

  // ─── Warehouses ──────────────────────────────────────────────

  @Get('v2/warehouses')
  @ApiOperation({ summary: 'Admin: list warehouses' })
  getWarehouses() {
    return this.warehouseService.findAll();
  }

  @Post('v2/warehouses')
  @ApiOperation({ summary: 'Admin: create warehouse' })
  createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.warehouseService.create(dto);
  }

  @Put('v2/warehouses/:id')
  @ApiOperation({ summary: 'Admin: update warehouse' })
  updateWarehouse(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehouseService.update(id, dto);
  }

  @Delete('v2/warehouses/:id')
  @ApiOperation({ summary: 'Admin: delete warehouse' })
  deleteWarehouse(@Param('id') id: string) {
    return this.warehouseService.remove(id);
  }

  // ─── Suppliers ───────────────────────────────────────────────

  @Get('v2/suppliers')
  @ApiOperation({ summary: 'Admin: list suppliers' })
  getSuppliers(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.supplierService.findAll(+page, +limit, status);
  }

  @Get('v2/suppliers/:id')
  @ApiOperation({ summary: 'Admin: get supplier' })
  getSupplier(@Param('id') id: string) {
    return this.supplierService.findOne(id);
  }

  @Post('v2/suppliers')
  @ApiOperation({ summary: 'Admin: create supplier' })
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.supplierService.create(dto);
  }

  @Put('v2/suppliers/:id')
  @ApiOperation({ summary: 'Admin: update supplier' })
  updateSupplier(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.supplierService.update(id, dto);
  }

  @Delete('v2/suppliers/:id')
  @ApiOperation({ summary: 'Admin: delete supplier' })
  deleteSupplier(@Param('id') id: string) {
    return this.supplierService.remove(id);
  }

  // ─── Purchase Orders ─────────────────────────────────────────

  @Get('v2/purchase-orders')
  @ApiOperation({ summary: 'Admin: list purchase orders' })
  getPurchaseOrders(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.purchaseOrderService.findAll(+page, +limit, status);
  }

  @Get('v2/purchase-orders/:id')
  @ApiOperation({ summary: 'Admin: get purchase order' })
  getPurchaseOrder(@Param('id') id: string) {
    return this.purchaseOrderService.findOne(id);
  }

  @Post('v2/purchase-orders')
  @ApiOperation({ summary: 'Admin: create purchase order' })
  createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: { id: string }) {
    return this.purchaseOrderService.create(dto, user.id);
  }

  @Patch('v2/purchase-orders/:id/order')
  @ApiOperation({ summary: 'Admin: mark PO as ordered' })
  markOrdered(@Param('id') id: string) {
    return this.purchaseOrderService.markOrdered(id);
  }

  @Post('v2/purchase-orders/:id/receive')
  @ApiOperation({ summary: 'Admin: receive goods for a PO' })
  receivePO(@Param('id') id: string, @Body() dto: ReceivePurchaseOrderDto, @CurrentUser() user: { id: string }) {
    return this.purchaseOrderService.receive(id, dto, user.id);
  }

  @Patch('v2/purchase-orders/:id/cancel')
  @ApiOperation({ summary: 'Admin: cancel purchase order' })
  cancelPO(@Param('id') id: string) {
    return this.purchaseOrderService.cancel(id);
  }
}
