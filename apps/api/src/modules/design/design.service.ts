import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DesignService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Themes ───────────────────────────────────────────────────

  async getThemes() {
    return (this.prisma as any).themeConfig.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createTheme(data: {
    name: string;
    primaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    borderRadius?: string;
    config?: Record<string, any>;
  }) {
    return (this.prisma as any).themeConfig.create({ data });
  }

  async updateTheme(id: string, data: Partial<{
    name: string;
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    borderRadius: string;
    config: Record<string, any>;
  }>) {
    const existing = await (this.prisma as any).themeConfig.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Theme not found');
    return (this.prisma as any).themeConfig.update({ where: { id }, data });
  }

  async deleteTheme(id: string) {
    const existing = await (this.prisma as any).themeConfig.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Theme not found');
    if (existing.isActive) throw new NotFoundException('Cannot delete the active theme');
    return (this.prisma as any).themeConfig.delete({ where: { id } });
  }

  async activateTheme(id: string) {
    const existing = await (this.prisma as any).themeConfig.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Theme not found');
    await (this.prisma as any).themeConfig.updateMany({ data: { isActive: false } });
    return (this.prisma as any).themeConfig.update({ where: { id }, data: { isActive: true } });
  }

  // ─── Banners ──────────────────────────────────────────────────

  async getBanners() {
    return (this.prisma as any).banner.findMany({ orderBy: [{ position: 'asc' }, { order: 'asc' }] });
  }

  async createBanner(data: {
    title: string;
    imageUrl: string;
    linkUrl?: string;
    position?: string;
    order?: number;
    isActive?: boolean;
    startsAt?: string;
    endsAt?: string;
  }) {
    return (this.prisma as any).banner.create({ data });
  }

  async updateBanner(id: string, data: Partial<{
    title: string;
    imageUrl: string;
    linkUrl: string;
    position: string;
    order: number;
    isActive: boolean;
    startsAt: string;
    endsAt: string;
  }>) {
    const existing = await (this.prisma as any).banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Banner not found');
    return (this.prisma as any).banner.update({ where: { id }, data });
  }

  async deleteBanner(id: string) {
    const existing = await (this.prisma as any).banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Banner not found');
    return (this.prisma as any).banner.delete({ where: { id } });
  }

  // ─── Homepage Sections ────────────────────────────────────────

  async getSections() {
    return (this.prisma as any).homepageSection.findMany({ orderBy: { order: 'asc' } });
  }

  async createSection(data: {
    type: string;
    title?: string;
    subtitle?: string;
    config?: Record<string, any>;
    order?: number;
    isActive?: boolean;
  }) {
    return (this.prisma as any).homepageSection.create({ data });
  }

  async updateSection(id: string, data: Partial<{
    type: string;
    title: string;
    subtitle: string;
    config: Record<string, any>;
    order: number;
    isActive: boolean;
  }>) {
    const existing = await (this.prisma as any).homepageSection.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Section not found');
    return (this.prisma as any).homepageSection.update({ where: { id }, data });
  }

  async deleteSection(id: string) {
    const existing = await (this.prisma as any).homepageSection.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Section not found');
    return (this.prisma as any).homepageSection.delete({ where: { id } });
  }

  async reorderSections(items: { id: string; order: number }[]) {
    await Promise.all(
      items.map(item =>
        (this.prisma as any).homepageSection.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );
    return this.getSections();
  }
}
