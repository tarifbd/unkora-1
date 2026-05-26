import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(params: { status?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 30;
    const where: any = {};
    if (params.status) where.status = params.status;

    const [data, total] = await Promise.all([
      this.prisma.smsLog.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.smsLog.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getStats() {
    const [total, sent, failed, pending] = await Promise.all([
      this.prisma.smsLog.count(),
      this.prisma.smsLog.count({ where: { status: 'SENT' } }),
      this.prisma.smsLog.count({ where: { status: 'FAILED' } }),
      this.prisma.smsLog.count({ where: { status: 'PENDING' } }),
    ]);
    const cost = await this.prisma.smsLog.aggregate({ _sum: { cost: true } });
    return { total, sent, failed, pending, totalCost: Number(cost._sum.cost ?? 0) };
  }

  async getTemplates() {
    return this.prisma.smsTemplate.findMany({ orderBy: { name: 'asc' } });
  }

  async createTemplate(dto: { name: string; content: string; variables?: string[] }) {
    return this.prisma.smsTemplate.create({ data: dto });
  }

  async updateTemplate(id: string, dto: { name?: string; content?: string; isActive?: boolean }) {
    const t = await this.prisma.smsTemplate.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Template not found');
    return this.prisma.smsTemplate.update({ where: { id }, data: dto });
  }

  async deleteTemplate(id: string) {
    return this.prisma.smsTemplate.delete({ where: { id } });
  }

  async sendSms(phone: string, message: string, provider = 'ssl_wireless') {
    const log = await this.prisma.smsLog.create({
      data: { phone, message, provider, status: 'PENDING' },
    });

    // In production, call actual SMS API here
    // For now, simulate success
    await this.prisma.smsLog.update({
      where: { id: log.id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    return log;
  }

  async sendBulk(phones: string[], message: string) {
    const results = await Promise.all(phones.map(p => this.sendSms(p, message)));
    return { sent: results.length, phones };
  }
}
