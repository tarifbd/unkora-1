import {
  Body, Controller, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SupportService } from './support.service';

@ApiTags('support')
@Controller('support')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly svc: SupportService) {}

  // ── Customer endpoints ───────────────────────────────────

  @Post('tickets')
  @ApiOperation({ summary: 'Create a new support ticket' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: { subject: string; message: string; category?: string; priority?: string },
  ) {
    return this.svc.createTicket(userId, dto);
  }

  @Get('tickets/my')
  @ApiOperation({ summary: 'Get my tickets' })
  getMyTickets(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.getMyTickets(userId, +page, +limit);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Reply to a ticket' })
  addMessage(
    @CurrentUser('id') userId: string,
    @Param('id') ticketId: string,
    @Body() dto: { message: string },
  ) {
    return this.svc.addMessage(userId, ticketId, dto.message, false);
  }

  // ── Admin endpoints ──────────────────────────────────────

  @Get('admin/tickets')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: '[Admin] List all tickets' })
  getAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.svc.getAllTickets({ page: +page, limit: +limit, status, priority, category, search });
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: '[Admin] Ticket stats' })
  getStats() {
    return this.svc.getStats();
  }

  @Get('admin/tickets/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: '[Admin] Get ticket detail' })
  getDetail(@Param('id') id: string) {
    return this.svc.getTicketDetail(id);
  }

  @Patch('admin/tickets/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: '[Admin] Update ticket status/priority/assignment' })
  update(
    @Param('id') id: string,
    @Body() dto: { status?: string; priority?: string; assignedTo?: string },
  ) {
    return this.svc.updateTicket(id, dto);
  }

  @Post('admin/tickets/:id/messages')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: '[Admin] Reply to ticket' })
  adminReply(
    @CurrentUser('id') adminId: string,
    @Param('id') ticketId: string,
    @Body() dto: { message: string },
  ) {
    return this.svc.addMessage(adminId, ticketId, dto.message, true);
  }
}
