import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CreateNotificationDto {
  title: string;
  body: string;
  imageUrl?: string;
  targetUrl?: string;
  audience?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = params;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      (this.prisma as any).pushNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prisma as any).pushNotification.count({ where }),
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

  async create(dto: CreateNotificationDto) {
    return (this.prisma as any).pushNotification.create({
      data: {
        title: dto.title,
        body: dto.body,
        imageUrl: dto.imageUrl ?? null,
        targetUrl: dto.targetUrl ?? null,
        audience: dto.audience ?? 'ALL',
        status: 'DRAFT',
      },
    });
  }

  async send(id: string) {
    const notification = await (this.prisma as any).pushNotification.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    // Count users in audience as a proxy for sentCount
    let sentCount = 0;
    try {
      const audience = notification.audience as string;
      if (audience === 'ALL') {
        sentCount = await this.prisma.user.count();
      } else if (audience === 'BUYERS') {
        sentCount = await this.prisma.user.count({
          where: { role: 'CUSTOMER' },
        });
      } else if (audience === 'SELLERS') {
        sentCount = await this.prisma.user.count({
          where: { seller: { isNot: null } },
        });
      }
    } catch {
      sentCount = 0;
    }

    return (this.prisma as any).pushNotification.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentCount,
      },
    });
  }

  async remove(id: string) {
    const notification = await (this.prisma as any).pushNotification.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    await (this.prisma as any).pushNotification.delete({ where: { id } });
    return { message: 'Notification deleted' };
  }

  async getStats() {
    const [total, sent, draft] = await Promise.all([
      (this.prisma as any).pushNotification.count(),
      (this.prisma as any).pushNotification.count({ where: { status: 'SENT' } }),
      (this.prisma as any).pushNotification.count({ where: { status: 'DRAFT' } }),
    ]);

    return { total, sent, draft };
  }
}
