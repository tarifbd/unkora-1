import { Injectable, NotFoundException } from '@nestjs/common';
import { GiftCardStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { CreateGiftCardDto } from './dto/create-gift-card.dto';
import type { UpdateGiftCardDto } from './dto/update-gift-card.dto';

@Injectable()
export class GiftCardsService {
  constructor(private readonly prisma: PrismaService) {}

  async adminFindAll(status?: GiftCardStatus) {
    return this.prisma.giftCard.findMany({
      where: status ? { status } : undefined,
      include: {
        purchaser: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { redemptions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminCreate(dto: CreateGiftCardDto) {
    return this.prisma.giftCard.create({
      data: {
        code: dto.code.toUpperCase(),
        amount: dto.amount,
        balance: dto.amount,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        note: dto.note ?? null,
      },
    });
  }

  async adminUpdate(id: string, dto: UpdateGiftCardDto) {
    const card = await this.prisma.giftCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('Gift card not found');
    return this.prisma.giftCard.update({
      where: { id },
      data: {
        status: dto.status,
        note: dto.note,
      },
    });
  }

  async adminDelete(id: string) {
    const card = await this.prisma.giftCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('Gift card not found');
    await this.prisma.giftCard.delete({ where: { id } });
    return { message: 'Gift card deleted' };
  }

  async adminStats() {
    const [total, active, cards] = await Promise.all([
      this.prisma.giftCard.count(),
      this.prisma.giftCard.count({ where: { status: 'ACTIVE' } }),
      this.prisma.giftCard.findMany({ select: { amount: true, balance: true } }),
    ]);
    const totalValue = cards.reduce((sum, c) => sum + Number(c.amount), 0);
    const usedValue = cards.reduce((sum, c) => sum + (Number(c.amount) - Number(c.balance)), 0);
    return { total, active, totalValue, usedValue };
  }

  async validate(code: string) {
    const card = await this.prisma.giftCard.findUnique({ where: { code: code.toUpperCase() } });
    if (!card) throw new NotFoundException('Gift card not found');
    return {
      id: card.id,
      code: card.code,
      balance: card.balance,
      status: card.status,
      expiresAt: card.expiresAt,
    };
  }
}
