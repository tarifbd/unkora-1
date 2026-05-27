import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookSubmissionStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import type { SubmitBookDto } from './dto/submit-book.dto';
import type { UpdateSubmissionDto } from './dto/update-submission.dto';

function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 80);
}

function randomSku() {
  return 'BK-' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

@Injectable()
export class BookSubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(userId: string, dto: SubmitBookDto) {
    return this.prisma.bookSubmission.create({
      data: {
        userId,
        title: dto.title,
        authorName: dto.authorName,
        publisherName: dto.publisherName,
        isbn: dto.isbn,
        language: dto.language ?? 'Bengali',
        pageCount: dto.pageCount,
        edition: dto.edition,
        genres: dto.genres,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        suggestedPrice: dto.suggestedPrice,
        royaltyPercent: dto.requestedRoyaltyPercent ?? 10,
      },
    });
  }

  async findMySubmissions(userId: string) {
    return this.prisma.bookSubmission.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, name: true, slug: true, isActive: true, isDigital: true, stockQuantity: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(params?: { status?: BookSubmissionStatus; page?: number; search?: string }) {
    const page = params?.page ?? 1;
    const limit = 20;
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { authorName: { contains: params.search, mode: 'insensitive' } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.bookSubmission.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          product: { select: { id: true, name: true, slug: true, isActive: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bookSubmission.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async update(id: string, dto: UpdateSubmissionDto, adminId: string) {
    const submission = await this.prisma.bookSubmission.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!submission) throw new NotFoundException('Book submission not found');

    // If approving and product not yet created → auto-create product
    if (dto.status === BookSubmissionStatus.APPROVED && !submission.productId) {
      return this.approveAndCreateProduct(submission, dto, adminId);
    }

    // If publishing (already approved, product exists) → activate product
    if (dto.status === BookSubmissionStatus.PUBLISHED && submission.productId) {
      await this.prisma.product.update({
        where: { id: submission.productId },
        data: { isActive: true },
      });
    }

    return this.prisma.bookSubmission.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.adminNote !== undefined && { adminNote: dto.adminNote }),
        ...(dto.royaltyPercent !== undefined && { royaltyPercent: dto.royaltyPercent }),
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  private async approveAndCreateProduct(submission: any, dto: UpdateSubmissionDto, adminId: string) {
    const isEbook = (submission as any).bookType === 'EBOOK';
    const finalPrice = dto.finalPrice ?? Number(submission.suggestedPrice);
    const royaltyPercent = dto.royaltyPercent ?? submission.royaltyPercent ?? 10;

    // Find a default book category
    let categoryId = dto.categoryId;
    if (!categoryId) {
      const bookCat = await this.prisma.category.findFirst({
        where: { slug: { contains: 'book' } },
        select: { id: true },
      });
      if (!bookCat) {
        const anyCat = await this.prisma.category.findFirst({ select: { id: true } });
        if (!anyCat) throw new BadRequestException('No category found. Please create a category first or pass categoryId.');
        categoryId = anyCat.id;
      } else {
        categoryId = bookCat.id;
      }
    }

    // Ensure unique slug
    let productSlug = slug(submission.title);
    const existing = await this.prisma.product.findFirst({ where: { slug: productSlug } });
    if (existing) productSlug = productSlug + '-' + Date.now().toString(36);

    // Create product in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: submission.title,
          slug: productSlug,
          sku: randomSku(),
          description: submission.description,
          categoryId,
          source: 'SELLER',
          basePrice: finalPrice,
          salePrice: null,
          stockQuantity: isEbook ? 9999 : 0, // unlimited for ebooks
          isActive: false, // admin can activate after review
          isDigital: isEbook,
          digitalFileUrl: isEbook ? (submission as any).digitalFileUrl ?? null : null,
          tags: submission.genres ?? [],
          images: submission.coverImageUrl
            ? {
                create: {
                  url: submission.coverImageUrl,
                  alt: submission.title,
                  isPrimary: true,
                  sortOrder: 0,
                },
              }
            : undefined,
          bookDetail: {
            create: {
              author: submission.authorName,
              publisher: submission.publisherName ?? 'Self Published',
              isbn: submission.isbn ?? undefined,
              language: submission.language ?? 'Bengali',
              pageCount: submission.pageCount ?? undefined,
              edition: submission.edition ?? undefined,
              genres: submission.genres ?? [],
            },
          },
        },
      });

      const updated = await tx.bookSubmission.update({
        where: { id: submission.id },
        data: {
          status: BookSubmissionStatus.APPROVED,
          adminNote: dto.adminNote,
          royaltyPercent,
          productId: product.id,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          product: { select: { id: true, name: true, slug: true, isActive: true } },
        },
      });

      return updated;
    });

    return result;
  }

  async getStats() {
    const [total, pending, underReview, approved, rejected, published] = await Promise.all([
      this.prisma.bookSubmission.count(),
      this.prisma.bookSubmission.count({ where: { status: 'PENDING' } }),
      this.prisma.bookSubmission.count({ where: { status: 'UNDER_REVIEW' } }),
      this.prisma.bookSubmission.count({ where: { status: 'APPROVED' } }),
      this.prisma.bookSubmission.count({ where: { status: 'REJECTED' } }),
      this.prisma.bookSubmission.count({ where: { status: 'PUBLISHED' } }),
    ]);
    return { total, pending, underReview, approved, rejected, published };
  }
}
