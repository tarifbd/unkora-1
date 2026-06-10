import {
  Body, Controller, Get, Param, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VirtualTryOnService } from './virtual-tryon.service';

@ApiTags('virtual-tryon')
@Controller('virtual-tryon')
export class VirtualTryOnController {
  constructor(private readonly svc: VirtualTryOnService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create a virtual try-on session' })
  createSession(
    @Body() dto: { productId: string; variantId?: string; userImageUrl?: string; userId?: string },
  ) {
    return this.svc.createSession(dto);
  }

  @Post('sessions/:id/process')
  @ApiOperation({ summary: 'Trigger AI processing for a session' })
  processSession(@Param('id') id: string) {
    return this.svc.processSession(id);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get a try-on session' })
  getSession(@Param('id') id: string) {
    return this.svc.getSession(id);
  }

  @Get('my-sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my try-on sessions' })
  getMySessions(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.getUserSessions(userId, +page, +limit);
  }

  @Get('admin/sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] List all try-on sessions' })
  getAdminSessions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('productId') productId?: string,
  ) {
    return this.svc.getAdminSessions({ page: +page, limit: +limit, status, productId });
  }

  @Get('admin/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Get virtual try-on settings' })
  getSettings() {
    return this.svc.getSettings();
  }

  @Post('admin/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Save virtual try-on settings' })
  saveSettings(@Body() body: Record<string, string>) {
    return this.svc.saveSettings(body);
  }
}
