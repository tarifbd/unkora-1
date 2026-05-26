import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StaffService } from './staff.service';

@ApiTags('staff')
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @ApiOperation({ summary: 'List all staff (ADMIN and SUPER_ADMIN)' })
  getStaff(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.staffService.getStaff(+page, +limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Staff stats: count, invites, audit logs' })
  getStats() {
    return this.staffService.getStats();
  }

  @Post('invite')
  @ApiOperation({ summary: 'Send staff invitation' })
  invite(@Body() body: { email: string; role?: string }) {
    return this.staffService.invite(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove staff (demote to USER role)' })
  removeStaff(@Param('id') id: string) {
    return this.staffService.removeStaff(id);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'List recent audit logs' })
  getAuditLogs(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.staffService.getAuditLogs(+page, +limit);
  }

  @Get('invitations')
  @ApiOperation({ summary: 'List staff invitations' })
  getInvitations(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.staffService.getInvitations(+page, +limit);
  }
}
