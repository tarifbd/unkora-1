import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async getWishlist(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggle(userId: string, productId: string): Promise<{ wishlisted: boolean }> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');

    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await this.prisma.wishlist.delete({ where: { id: existing.id } });
      return { wishlisted: false };
    }

    await this.prisma.wishlist.create({ data: { userId, productId } });
    return { wishlisted: true };
  }

  async isWishlisted(userId: string, productId: string): Promise<{ wishlisted: boolean }> {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return { wishlisted: !!existing };
  }
}
