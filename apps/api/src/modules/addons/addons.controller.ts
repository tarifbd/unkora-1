import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AddonsService } from './addons.service';

@ApiTags('addons')
@Controller('addons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AddonsController {
  constructor(private readonly svc: AddonsService) {}

  @Get()
  @ApiOperation({ summary: 'List all addons' })
  findAll() { return this.svc.findAll(); }

  @Post('seed')
  @ApiOperation({ summary: 'Seed built-in addons' })
  seed() { return this.svc.seedBuiltIns(); }

  @Put(':slug/toggle')
  @ApiOperation({ summary: 'Enable/disable an addon' })
  toggle(@Param('slug') slug: string, @Body() dto: { enabled: boolean; config?: Record<string, any> }) {
    return this.svc.toggle(slug, dto.enabled, dto.config);
  }

  @Put(':slug/config')
  @ApiOperation({ summary: 'Update addon configuration' })
  updateConfig(@Param('slug') slug: string, @Body() config: Record<string, any>) {
    return this.svc.updateConfig(slug, config);
  }

  @Get('enabled')
  @ApiOperation({ summary: 'Get list of enabled addon slugs' })
  getEnabled() { return this.svc.getEnabledSlugs(); }
}
