import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SellerStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SellersService } from './sellers.service';
import { ApplySellerDto } from './dto/apply-seller.dto';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  // ─── SELLER-FACING ROUTES ─────────────────────────────────────

  /** Apply to become a seller (any authenticated user) */
  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  apply(@CurrentUser('id') userId: string, @Body() dto: ApplySellerDto) {
    return this.sellersService.apply(userId, dto);
  }

  /** Check own seller status (returns null if not a seller) */
  @Get('me/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myStatus(@CurrentUser('id') userId: string) {
    return this.sellersService.findMeOptional(userId);
  }

  /** Get own seller profile */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMe(@CurrentUser('id') userId: string) {
    return this.sellersService.findMe(userId);
  }

  /** Update own shop profile */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateSellerProfileDto) {
    return this.sellersService.updateMe(userId, dto);
  }

  /** My submitted books */
  @Get('me/submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  mySubmissions(@CurrentUser('id') userId: string, @Query('page') page?: number) {
    return this.sellersService.mySubmissions(userId, page ? +page : 1);
  }

  /** Orders for my products */
  @Get('me/orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myOrders(@CurrentUser('id') userId: string, @Query('page') page?: number) {
    return this.sellersService.myOrders(userId, page ? +page : 1);
  }

  /** My earnings breakdown */
  @Get('me/earnings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myEarnings(@CurrentUser('id') userId: string) {
    return this.sellersService.myEarnings(userId);
  }

  /** My withdrawals */
  @Get('me/withdrawals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myWithdrawals(@CurrentUser('id') userId: string, @Query('page') page?: number) {
    return this.sellersService.myWithdrawals(userId, page ? +page : 1);
  }

  /** Request a withdrawal */
  @Post('me/withdrawals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  requestWithdrawal(@CurrentUser('id') userId: string, @Body() dto: RequestWithdrawalDto) {
    return this.sellersService.requestWithdrawal(userId, dto);
  }

  // ─── ADMIN ROUTES ─────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  findAll(
    @Query('status') status?: SellerStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
  ) {
    return this.sellersService.findAll({ status, search, page: page ? +page : 1 });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  getStats() {
    return this.sellersService.getStats();
  }

  @Get('withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  getWithdrawals(@Query('sellerId') sellerId?: string, @Query('status') status?: string, @Query('page') page?: number) {
    return this.sellersService.getWithdrawals({ sellerId, status, page: page ? +page : 1 });
  }

  @Patch('withdrawals/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  processWithdrawal(@Param('id') id: string, @Body('status') status: string) {
    return this.sellersService.processWithdrawal(id, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.sellersService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  updateStatus(@Param('id') id: string, @Body('status') status: SellerStatus) {
    return this.sellersService.updateStatus(id, status);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: any) {
    return this.sellersService.update(id, dto);
  }
}
