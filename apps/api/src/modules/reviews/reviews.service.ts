import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { CreateReviewDto } from './dto/create-review.dto';
import type { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, productId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');

    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) throw new BadRequestException('You have already reviewed this product');

    // Check if user has a delivered order containing this product
    const verifiedPurchase = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: 'DELIVERED' },
      },
    });

    return this.prisma.review.create({
      data: {
        userId,
        productId,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        isVerified: !!verifiedPurchase,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findByProduct(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId, isPublished: true },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCount = reviews.length;
    const averageRating =
      totalCount > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount) * 10) / 10
        : 0;

    return { reviews, averageRating, totalCount };
  }

  async findMyReview(userId: string, productId: string) {
    const review = await this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async update(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('Not allowed to update this review');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async delete(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('Not allowed to delete this review');

    await this.prisma.review.delete({ where: { id: reviewId } });
    return { message: 'Review deleted' };
  }

  async adminGetAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true } },
          product: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count(),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adminPublish(reviewId: string, isPublished: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isPublished },
    });
  }
}
