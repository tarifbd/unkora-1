import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PreorderConfigStatus, PreorderOrderStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PreordersService } from './preorders.service';
import { CreatePreorderConfigDto } from './dto/create-config.dto';
import { UpdatePreorderConfigDto } from './dto/update-config.dto';
import { PlacePreorderDto } from './dto/place-preorder.dto';
import { UpdatePreorderStatusDto } from './dto/update-status.dto';
import { AddNoteDto } from './dto/add-note.dto';

// ─── Admin helpers ────────────────────────────────────────────────────────────
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const;

@ApiTags('preorders')
@Controller('preorders')
export class PreordersController {
  constructor(private readonly svc: PreordersService) {}

  // ── Dashboard ──────────────────────────────────────────────────────────────

  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Preorder dashboard stats' })
  async dashboard() {
    const [stats, recentOrders] = await Promise.all([
      this.svc.getDashboardStats(),
      this.svc.getRecentOrders(5),
    ]);
    return { stats, recentOrders };
  }

  // ── Config endpoints ───────────────────────────────────────────────────────

  @Post('admin/configs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create preorder configuration' })
  createConfig(@Body() dto: CreatePreorderConfigDto) {
    return this.svc.createConfig(dto);
  }

  @Get('admin/configs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List preorder configurations' })
  listConfigs(
    @Query('status') status?: PreorderConfigStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.listConfigs({ status, page: +page, limit: +limit });
  }

  @Get('admin/configs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get preorder configuration' })
  getConfig(@Param('id') id: string) {
    return this.svc.getConfig(id);
  }

  @Put('admin/configs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update preorder configuration' })
  updateConfig(@Param('id') id: string, @Body() dto: UpdatePreorderConfigDto) {
    return this.svc.updateConfig(id, dto);
  }

  @Delete('admin/configs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete preorder configuration' })
  deleteConfig(@Param('id') id: string) {
    return this.svc.deleteConfig(id);
  }

  @Patch('admin/configs/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change config status (ACTIVE, PAUSED, CLOSED, etc.)' })
  setConfigStatus(@Param('id') id: string, @Body('status') status: PreorderConfigStatus) {
    return this.svc.setConfigStatus(id, status);
  }

  @Post('admin/configs/:id/mark-stock-available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark stock available — moves WAITING orders to READY_TO_FULFILL' })
  markStockAvailable(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.svc.markStockAvailable(id, adminId);
  }

  @Post('admin/configs/:id/bulk-convert')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk convert all READY_TO_FULFILL preorders to regular orders' })
  bulkConvert(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.svc.bulkConvert(id, adminId);
  }

  // ── Order admin endpoints ──────────────────────────────────────────────────

  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all preorder orders' })
  listOrders(
    @Query('configId') configId?: string,
    @Query('status') status?: PreorderOrderStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.listOrders({ configId, status, page: +page, limit: +limit });
  }

  @Get('admin/orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get preorder order detail' })
  getOrder(@Param('id') id: string) {
    return this.svc.getOrder(id);
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update preorder order status' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePreorderStatusDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.svc.updateOrderStatus(id, dto, adminId);
  }

  @Post('admin/orders/:id/note')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add admin note to preorder' })
  addNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.svc.addNote(id, dto, adminId);
  }

  @Post('admin/orders/:id/payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record payment for a preorder' })
  recordPayment(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @CurrentUser('id') adminId: string,
  ) {
    return this.svc.recordPayment(id, +amount, adminId);
  }

  @Post('admin/orders/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a preorder (admin)' })
  adminCancelOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.svc.cancelOrder(id, reason, adminId);
  }

  @Post('admin/orders/:id/convert')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert preorder to regular order' })
  convertToOrder(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.svc.convertToOrder(id, adminId);
  }

  // ── Public / Customer endpoints ────────────────────────────────────────────

  @Get('public/product/:productId')
  @ApiOperation({ summary: 'Get active preorder config for a product (public)' })
  getPublicConfig(@Param('productId') productId: string) {
    return this.svc.getConfigByProduct(productId);
  }

  @Post('place')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Place a preorder (authenticated customer)' })
  placePreorder(@Body() dto: PlacePreorderDto, @CurrentUser('id') customerId: string) {
    return this.svc.placePreorder(dto, customerId);
  }

  @Post('place/guest')
  @ApiOperation({ summary: 'Place a preorder (guest)' })
  placeGuestPreorder(@Body() dto: PlacePreorderDto) {
    return this.svc.placePreorder(dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my preorders' })
  myPreorders(
    @CurrentUser('id') customerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.svc.getCustomerOrders(customerId, +page, +limit);
  }

  @Get('my/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my preorder by ID' })
  myOrder(@Param('id') id: string) {
    return this.svc.getOrder(id);
  }

  @Post('my/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel my preorder' })
  customerCancelOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.svc.cancelOrder(id, reason);
  }

  @Get('track/:preorderNumber')
  @ApiOperation({ summary: 'Track a preorder by number (public)' })
  track(@Param('preorderNumber') preorderNumber: string) {
    return this.svc.getOrderByNumber(preorderNumber);
  }
}
