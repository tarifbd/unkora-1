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
    const [stats, recent] = await Promise.all([
      this.svc.getDashboardStats(),
      this.svc.getRecentOrders(5),
    ]);
    return { success: true, data: { stats, recentOrders: recent } };
  }

  // ── Config endpoints ───────────────────────────────────────────────────────

  @Post('admin/configs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create preorder configuration' })
  async createConfig(@Body() dto: CreatePreorderConfigDto) {
    return { success: true, data: await this.svc.createConfig(dto) };
  }

  @Get('admin/configs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List preorder configurations' })
  async listConfigs(
    @Query('status') status?: PreorderConfigStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return { success: true, data: await this.svc.listConfigs({ status, page: +page, limit: +limit }) };
  }

  @Get('admin/configs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get preorder configuration' })
  async getConfig(@Param('id') id: string) {
    return { success: true, data: await this.svc.getConfig(id) };
  }

  @Put('admin/configs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update preorder configuration' })
  async updateConfig(@Param('id') id: string, @Body() dto: UpdatePreorderConfigDto) {
    return { success: true, data: await this.svc.updateConfig(id, dto) };
  }

  @Delete('admin/configs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete preorder configuration' })
  async deleteConfig(@Param('id') id: string) {
    return { success: true, data: await this.svc.deleteConfig(id) };
  }

  @Patch('admin/configs/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change config status (ACTIVE, PAUSED, CLOSED, etc.)' })
  async setConfigStatus(@Param('id') id: string, @Body('status') status: PreorderConfigStatus) {
    return { success: true, data: await this.svc.setConfigStatus(id, status) };
  }

  @Post('admin/configs/:id/mark-stock-available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark stock available — moves WAITING orders to READY_TO_FULFILL' })
  async markStockAvailable(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return { success: true, data: await this.svc.markStockAvailable(id, adminId) };
  }

  @Post('admin/configs/:id/bulk-convert')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk convert all READY_TO_FULFILL preorders to regular orders' })
  async bulkConvert(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return { success: true, data: await this.svc.bulkConvert(id, adminId) };
  }

  // ── Order admin endpoints ──────────────────────────────────────────────────

  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all preorder orders' })
  async listOrders(
    @Query('configId') configId?: string,
    @Query('status') status?: PreorderOrderStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return { success: true, data: await this.svc.listOrders({ configId, status, page: +page, limit: +limit }) };
  }

  @Get('admin/orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get preorder order detail' })
  async getOrder(@Param('id') id: string) {
    return { success: true, data: await this.svc.getOrder(id) };
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update preorder order status' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePreorderStatusDto,
    @CurrentUser('id') adminId: string,
  ) {
    return { success: true, data: await this.svc.updateOrderStatus(id, dto, adminId) };
  }

  @Post('admin/orders/:id/note')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add admin note to preorder' })
  async addNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @CurrentUser('id') adminId: string,
  ) {
    return { success: true, data: await this.svc.addNote(id, dto, adminId) };
  }

  @Post('admin/orders/:id/payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record payment for a preorder' })
  async recordPayment(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @CurrentUser('id') adminId: string,
  ) {
    return { success: true, data: await this.svc.recordPayment(id, +amount, adminId) };
  }

  @Post('admin/orders/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a preorder (admin)' })
  async adminCancelOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') adminId: string,
  ) {
    return { success: true, data: await this.svc.cancelOrder(id, reason, adminId) };
  }

  @Post('admin/orders/:id/convert')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert preorder to regular order' })
  async convertToOrder(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return { success: true, data: await this.svc.convertToOrder(id, adminId) };
  }

  // ── Public / Customer endpoints ────────────────────────────────────────────

  @Get('public/product/:productId')
  @ApiOperation({ summary: 'Get active preorder config for a product (public)' })
  async getPublicConfig(@Param('productId') productId: string) {
    return { success: true, data: await this.svc.getConfigByProduct(productId) };
  }

  @Post('place')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Place a preorder (authenticated customer)' })
  async placePreorder(@Body() dto: PlacePreorderDto, @CurrentUser('id') customerId: string) {
    return { success: true, data: await this.svc.placePreorder(dto, customerId) };
  }

  @Post('place/guest')
  @ApiOperation({ summary: 'Place a preorder (guest)' })
  async placeGuestPreorder(@Body() dto: PlacePreorderDto) {
    return { success: true, data: await this.svc.placePreorder(dto) };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my preorders' })
  async myPreorders(
    @CurrentUser('id') customerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return { success: true, data: await this.svc.getCustomerOrders(customerId, +page, +limit) };
  }

  @Get('my/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my preorder by ID' })
  async myOrder(@Param('id') id: string) {
    return { success: true, data: await this.svc.getOrder(id) };
  }

  @Post('my/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel my preorder' })
  async customerCancelOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return { success: true, data: await this.svc.cancelOrder(id, reason) };
  }

  @Get('track/:preorderNumber')
  @ApiOperation({ summary: 'Track a preorder by number (public)' })
  async track(@Param('preorderNumber') preorderNumber: string) {
    return { success: true, data: await this.svc.getOrderByNumber(preorderNumber) };
  }
}
