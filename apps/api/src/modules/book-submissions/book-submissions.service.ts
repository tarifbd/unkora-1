import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { SubmitBookDto } from './dto/submit-book.dto';
import type { UpdateSubmissionDto } from './dto/update-submission.dto';

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
      },
    });
  }

  async findMySubmissions(userId: string) {
    return this.prisma.bookSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.bookSubmission.findMany({
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateSubmissionDto, adminId: string) {
    const submission = await this.prisma.bookSubmission.findUnique({ where: { id } });
    if (!submission) throw new NotFoundException('Book submission not found');

    return this.prisma.bookSubmission.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.adminNote !== undefined && { adminNote: dto.adminNote }),
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });
  }
}
