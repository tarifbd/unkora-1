import { Injectable, NotFoundException } from '@nestjs/common';
import { RefundStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReturnsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params;
    const where: any = {};
    if (status && status !== 'ALL') where.status = status as RefundStatus;

    const [data, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              total: true,
              createdAt: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.refund.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async getStats() {
    const [total, pending, approved, rejected, processed] = await Promise.all([
      this.prisma.refund.count(),
      this.prisma.refund.count({ where: { status: RefundStatus.PENDING } }),
      this.prisma.refund.count({ where: { status: RefundStatus.APPROVED } }),
      this.prisma.refund.count({ where: { status: RefundStatus.REJECTED } }),
      this.prisma.refund.count({ where: { status: RefundStatus.PROCESSED } }),
    ]);

    return { total, pending, approved, rejected, processed };
  }

  async updateStatus(
    id: string,
    dto: { status: string; adminNote?: string },
    adminId: string,
  ) {
    const refund = await this.prisma.refund.findUnique({ where: { id } });
    if (!refund) throw new NotFoundException('Return/refund request not found');

    const isTerminal = dto.status !== RefundStatus.PENDING;

    return this.prisma.refund.update({
      where: { id },
      data: {
        status: dto.status as RefundStatus,
        adminNote: dto.adminNote,
        ...(isTerminal && {
          processedBy: adminId,
          processedAt: new Date(),
        }),
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}
