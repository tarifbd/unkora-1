import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import type { CreateCouponDto } from './dto/create-coupon.dto';
import type { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(code: string, orderTotal: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

    if (!coupon) throw new BadRequestException('Invalid coupon code');
    if (!coupon.isActive) throw new BadRequestException('Coupon is not active');

    const now = new Date();
    if (coupon.startsAt > now) throw new BadRequestException('Coupon is not yet valid');
    if (coupon.expiresAt && coupon.expiresAt < now) throw new BadRequestException('Coupon has expired');

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit has been reached');
    }

    if (coupon.minOrderValue !== null && orderTotal < Number(coupon.minOrderValue)) {
      throw new BadRequestException(
        `Minimum order value of ${coupon.minOrderValue} required to use this coupon`,
      );
    }

    let discountAmount: number;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (orderTotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount !== null) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
      }
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    discountAmount = Math.min(discountAmount, orderTotal);
    discountAmount = Math.round(discountAmount * 100) / 100;

    return { valid: true, coupon, discountAmount };
  }

  async apply(code: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    return this.prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });
  }

  async adminCreate(dto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        description: dto.description,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderValue: dto.minOrderValue ?? null,
        maxDiscount: dto.maxDiscount ?? null,
        usageLimit: dto.usageLimit ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async adminGetAll() {
    const coupons = await this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { usages: true } } },
    });
    return coupons.map(({ _count, ...c }) => ({ ...c, usageCount: _count.usages }));
  }

  async adminGetOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        usages: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          orderBy: { usedAt: 'desc' },
          take: 50,
        },
        _count: { select: { usages: true } },
      },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');
    const { _count, ...rest } = coupon;
    return { ...rest, usageCount: _count.usages };
  }

  async adminStats() {
    const [totalActive, usages] = await Promise.all([
      this.prisma.coupon.count({ where: { isActive: true } }),
      this.prisma.couponUsage.findMany({
        include: {
          order: { select: { discount: true } },
        },
      }),
    ]);
    const totalUsed = usages.length;
    const revenueSaved = usages.reduce((sum, u) => sum + Number(u.order.discount), 0);
    return { totalActive, totalUsed, revenueSaved };
  }

  async adminToggle(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    return this.prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });
  }

  async adminUpdate(id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.discountType !== undefined && { discountType: dto.discountType }),
        ...(dto.discountValue !== undefined && { discountValue: dto.discountValue }),
        ...(dto.minOrderValue !== undefined && { minOrderValue: dto.minOrderValue }),
        ...(dto.maxDiscount !== undefined && { maxDiscount: dto.maxDiscount }),
        ...(dto.usageLimit !== undefined && { usageLimit: dto.usageLimit }),
        ...(dto.startsAt !== undefined && { startsAt: new Date(dto.startsAt) }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async adminDelete(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    await this.prisma.coupon.delete({ where: { id } });
    return { message: 'Coupon deleted' };
  }
}
