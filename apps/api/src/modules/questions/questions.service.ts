import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { CreateQuestionDto } from './dto/create-question.dto';
import type { CreateAnswerDto } from './dto/create-answer.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(productId: string, dto: CreateQuestionDto, userId?: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.productQuestion.create({
      data: {
        productId,
        userId: userId ?? null,
        guestName: userId ? null : (dto.guestName ?? 'Guest'),
        body: dto.body,
        status: 'PENDING',
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        answers: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
  }

  async findByProduct(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.productQuestion.findMany({
        where: { productId, status: 'APPROVED' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
          answers: {
            orderBy: { createdAt: 'asc' },
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      this.prisma.productQuestion.count({ where: { productId, status: 'APPROVED' } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async adminGetAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.productQuestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          product: { select: { name: true, slug: true } },
          answers: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      }),
      this.prisma.productQuestion.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async adminUpdateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const q = await this.prisma.productQuestion.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Question not found');
    return this.prisma.productQuestion.update({ where: { id }, data: { status } });
  }

  async adminDelete(id: string) {
    const q = await this.prisma.productQuestion.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Question not found');
    return this.prisma.productQuestion.delete({ where: { id } });
  }

  async addAnswer(questionId: string, dto: CreateAnswerDto, userId: string, isAdmin: boolean) {
    const q = await this.prisma.productQuestion.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Question not found');
    if (q.status !== 'APPROVED' && !isAdmin) throw new ForbiddenException('Question not approved');

    return this.prisma.productAnswer.create({
      data: { questionId, userId, body: dto.body, isAdmin },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  async deleteAnswer(answerId: string, userId: string, isAdmin: boolean) {
    const a = await this.prisma.productAnswer.findUnique({ where: { id: answerId } });
    if (!a) throw new NotFoundException('Answer not found');
    if (!isAdmin && a.userId !== userId) throw new ForbiddenException();
    return this.prisma.productAnswer.delete({ where: { id: answerId } });
  }
}
