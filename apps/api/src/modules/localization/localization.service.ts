import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LocalizationService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Currencies ───────────────────────────────────────────────

  async getCurrencies() {
    return (this.prisma as any).currency.findMany({ orderBy: { isDefault: 'desc' } });
  }

  async createCurrency(data: {
    code: string;
    name: string;
    symbol: string;
    rate?: number;
    isActive?: boolean;
  }) {
    const existing = await (this.prisma as any).currency.findUnique({ where: { code: data.code } });
    if (existing) throw new BadRequestException(`Currency with code ${data.code} already exists`);
    return (this.prisma as any).currency.create({ data });
  }

  async updateCurrency(id: string, data: Partial<{ code: string; name: string; symbol: string; rate: number; isActive: boolean }>) {
    const existing = await (this.prisma as any).currency.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Currency not found');
    return (this.prisma as any).currency.update({ where: { id }, data });
  }

  async deleteCurrency(id: string) {
    const existing = await (this.prisma as any).currency.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Currency not found');
    if (existing.isDefault) throw new BadRequestException('Cannot delete the default currency');
    return (this.prisma as any).currency.delete({ where: { id } });
  }

  async setDefaultCurrency(id: string) {
    const existing = await (this.prisma as any).currency.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Currency not found');
    await (this.prisma as any).currency.updateMany({ data: { isDefault: false } });
    return (this.prisma as any).currency.update({ where: { id }, data: { isDefault: true } });
  }

  // ─── Languages ────────────────────────────────────────────────

  async getLanguages() {
    return (this.prisma as any).language.findMany({ orderBy: { isDefault: 'desc' } });
  }

  async createLanguage(data: {
    code: string;
    name: string;
    nativeName: string;
    isRtl?: boolean;
    isActive?: boolean;
  }) {
    const existing = await (this.prisma as any).language.findUnique({ where: { code: data.code } });
    if (existing) throw new BadRequestException(`Language with code ${data.code} already exists`);
    return (this.prisma as any).language.create({ data });
  }

  async updateLanguage(id: string, data: Partial<{ code: string; name: string; nativeName: string; isRtl: boolean; isActive: boolean }>) {
    const existing = await (this.prisma as any).language.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Language not found');
    return (this.prisma as any).language.update({ where: { id }, data });
  }

  async deleteLanguage(id: string) {
    const existing = await (this.prisma as any).language.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Language not found');
    if (existing.isDefault) throw new BadRequestException('Cannot delete the default language');
    return (this.prisma as any).language.delete({ where: { id } });
  }

  async setDefaultLanguage(id: string) {
    const existing = await (this.prisma as any).language.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Language not found');
    await (this.prisma as any).language.updateMany({ data: { isDefault: false } });
    return (this.prisma as any).language.update({ where: { id }, data: { isDefault: true } });
  }
}
