import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, RefundStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { CreateRefundDto } from './dto/create-refund.dto';
import type { UpdateRefundDto } from './dto/update-refund.dto';

@Injectable()
export class RefundsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRefundDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Refunds can only be requested for delivered orders');
    }

    const existing = await this.prisma.refund.findFirst({
      where: { orderId: dto.orderId, userId, status: { not: RefundStatus.REJECTED } },
    });
    if (existing) {
      throw new BadRequestException('A refund request already exists for this order');
    }

    return this.prisma.refund.create({
      data: {
        orderId: dto.orderId,
        userId,
        amount: dto.amount,
        reason: dto.reason,
        description: dto.description,
      },
      include: {
        order: { select: { id: true, status: true, total: true } },
      },
    });
  }

  async findAll(query: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = query;
    const where = status ? { status: status as RefundStatus } : {};

    const [data, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
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

  async findByUser(userId: string) {
    return this.prisma.refund.findMany({
      where: { userId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdateRefundDto, adminId: string) {
    const refund = await this.prisma.refund.findUnique({ where: { id } });
    if (!refund) throw new NotFoundException('Refund not found');

    const isTerminalStatus = dto.status !== RefundStatus.PENDING;

    return this.prisma.refund.update({
      where: { id },
      data: {
        status: dto.status,
        adminNote: dto.adminNote,
        ...(isTerminalStatus && {
          processedBy: adminId,
          processedAt: new Date(),
        }),
      },
      include: {
        order: { select: { id: true, status: true, total: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }
}
