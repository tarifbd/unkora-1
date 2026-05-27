import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ShippingZonesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return (this.prisma as any).shippingZone.findMany({
      where: { isActive: true },
      include: { rates: { where: { isActive: true }, orderBy: { baseRate: 'asc' } } },
    });
  }

  async calculateRate(params: { district?: string; division?: string; country?: string; weight: number; orderTotal: number }) {
    const zones = await (this.prisma as any).shippingZone.findMany({
      where: { isActive: true },
      include: { rates: { where: { isActive: true } } },
    });

    // Find matching zone
    const matchingZone = zones.find((zone: any) => {
      const districts = zone.districts as string[];
      const divisions = zone.divisions as string[];
      const countries = zone.countries as string[];
      if (params.district && districts.length && districts.includes(params.district)) return true;
      if (params.division && divisions.length && divisions.includes(params.division)) return true;
      if (params.country && countries.length && countries.includes(params.country)) return true;
      // Fallback: zone with no restrictions = default zone
      return !districts.length && !divisions.length && !countries.length;
    }) ?? zones[0];

    if (!matchingZone) return { rates: [], zone: null };

    const applicableRates = matchingZone.rates.filter((rate: any) => {
      const minW = Number(rate.minWeight);
      const maxW = rate.maxWeight ? Number(rate.maxWeight) : Infinity;
      return params.weight >= minW && params.weight <= maxW;
    });

    return {
      zone: { id: matchingZone.id, name: matchingZone.name },
      rates: applicableRates.map((rate: any) => {
        const base = Number(rate.baseRate);
        const perKg = Number(rate.perKgRate);
        const freeAbove = rate.freeAbove ? Number(rate.freeAbove) : null;
        const calculated = freeAbove && params.orderTotal >= freeAbove ? 0 : base + perKg * params.weight;
        return {
          id: rate.id,
          name: rate.name,
          carrier: rate.carrier,
          cost: Math.round(calculated * 100) / 100,
          estimatedDays: rate.estimatedDays,
          isFree: freeAbove != null && params.orderTotal >= freeAbove,
        };
      }),
    };
  }

  async adminCreate(dto: any) {
    return (this.prisma as any).shippingZone.create({ data: { ...dto, rates: dto.rates ? { create: dto.rates } : undefined } });
  }

  async adminUpdate(id: string, dto: any) {
    const z = await (this.prisma as any).shippingZone.findUnique({ where: { id } });
    if (!z) throw new NotFoundException('Zone not found');
    return (this.prisma as any).shippingZone.update({ where: { id }, data: dto });
  }

  async addRate(zoneId: string, dto: any) {
    return (this.prisma as any).shippingRate.create({ data: { ...dto, zoneId } });
  }

  async deleteRate(rateId: string) {
    return (this.prisma as any).shippingRate.delete({ where: { id: rateId } });
  }

  async delete(id: string) {
    return (this.prisma as any).shippingZone.delete({ where: { id } });
  }
}
