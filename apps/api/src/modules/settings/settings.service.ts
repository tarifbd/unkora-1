import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string): Promise<string | null> {
    const setting = await this.prisma.siteSetting.findUnique({ where: { key } });
    return setting?.value ?? null;
  }

  async getMany(keys: string[]): Promise<Record<string, string>> {
    const settings = await this.prisma.siteSetting.findMany({ where: { key: { in: keys } } });
    return Object.fromEntries(settings.map(s => [s.key, s.value]));
  }

  async set(key: string, value: string): Promise<void> {
    await this.prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  async setMany(data: Record<string, string>): Promise<void> {
    await Promise.all(Object.entries(data).map(([key, value]) => this.set(key, value)));
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const settings = await this.prisma.siteSetting.findMany({ orderBy: { key: 'asc' } });
    return Object.fromEntries(settings.map(s => [s.key, s.value]));
  }

  async getAnalyticsSettings() {
    const keys = [
      'analytics.ga4.enabled', 'analytics.ga4.measurementId', 'analytics.ga4.enhancedEcom', 'analytics.ga4.debugMode',
      'analytics.gtm.enabled', 'analytics.gtm.containerId',
      'analytics.pixel.enabled', 'analytics.pixel.pixelId',
      'analytics.capi.enabled', 'analytics.capi.pixelId', 'analytics.capi.accessToken',
      'analytics.gsc.verificationTag', 'analytics.gsc.sitemapUrl',
    ];
    return this.getMany(keys);
  }
}
