import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PosService } from './pos.service';

@ApiTags('pos')
@Controller('pos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('dashboard')
  getDashboard() {
    return this.posService.getDashboard();
  }

  @Get('sessions')
  getSessions(@Query('page') page?: number, @Query('cashierId') cashierId?: string) {
    return this.posService.getSessions({ page: page ? +page : 1, cashierId });
  }

  @Post('sessions/open')
  openSession(@Body('openingCash') openingCash: number, @Req() req: any) {
    return this.posService.openSession(req.user.id, openingCash ?? 0);
  }

  @Patch('sessions/:id/close')
  closeSession(
    @Param('id') id: string,
    @Body('closingCash') closingCash: number,
    @Body('notes') notes?: string,
  ) {
    return this.posService.closeSession(id, closingCash, notes);
  }

  @Post('sessions/:id/orders')
  createOrder(@Param('id') sessionId: string, @Body() dto: any) {
    return this.posService.createOrder(sessionId, dto);
  }

  @Get('sessions/:id/orders')
  getSessionOrders(@Param('id') sessionId: string) {
    return this.posService.getSessionOrders(sessionId);
  }
}
