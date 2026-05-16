import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics settings (public - only non-secret values)' })
  async getAnalytics() {
    const settings = await this.settingsService.getAnalyticsSettings();
    // Never expose the CAPI access token publicly
    const { 'analytics.capi.accessToken': _secret, ...publicSettings } = settings;
    return { data: publicSettings };
  }

  @Post('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save analytics settings (admin)' })
  async saveAnalytics(@Body() body: Record<string, string>) {
    // Prefix all keys with analytics. namespace for safety
    const allowed = [
      'analytics.ga4.enabled', 'analytics.ga4.measurementId', 'analytics.ga4.enhancedEcom', 'analytics.ga4.debugMode',
      'analytics.gtm.enabled', 'analytics.gtm.containerId',
      'analytics.pixel.enabled', 'analytics.pixel.pixelId',
      'analytics.capi.enabled', 'analytics.capi.pixelId', 'analytics.capi.accessToken',
      'analytics.gsc.verificationTag', 'analytics.gsc.sitemapUrl',
    ];
    const filtered = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
    await this.settingsService.setMany(filtered);
    return { data: { success: true } };
  }
}
