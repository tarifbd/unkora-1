import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';

export interface CreateEmailCampaignDto {
  name: string;
  subject: string;
  htmlContent: string;
  audience?: string;
  scheduledAt?: string;
}

export interface UpdateEmailCampaignDto {
  name?: string;
  subject?: string;
  htmlContent?: string;
  audience?: string;
  scheduledAt?: string;
}

@Injectable()
export class EmailCampaignsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async findAll(params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = params;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      (this.prisma as any).emailCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prisma as any).emailCampaign.count({ where }),
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

  async findOne(id: string) {
    const campaign = await (this.prisma as any).emailCampaign.findUnique({
      where: { id },
    });
    if (!campaign) throw new NotFoundException('Email campaign not found');
    return campaign;
  }

  async create(dto: CreateEmailCampaignDto) {
    return (this.prisma as any).emailCampaign.create({
      data: {
        name: dto.name,
        subject: dto.subject,
        htmlContent: dto.htmlContent,
        audience: dto.audience ?? 'ALL',
        status: 'DRAFT',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      },
    });
  }

  async update(id: string, dto: UpdateEmailCampaignDto) {
    await this.findOne(id);
    return (this.prisma as any).emailCampaign.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.htmlContent !== undefined && { htmlContent: dto.htmlContent }),
        ...(dto.audience !== undefined && { audience: dto.audience }),
        ...(dto.scheduledAt !== undefined && {
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        }),
      },
    });
  }

  async send(id: string) {
    const campaign = await this.findOne(id);

    // Get target users' emails
    let users: Array<{ email: string; firstName: string }> = [];
    try {
      const audience = campaign.audience as string;
      const where: any = { email: { not: null } };
      if (audience === 'BUYERS') where.role = 'CUSTOMER';
      else if (audience === 'SELLERS') where.seller = { isNot: null };

      users = await this.prisma.user.findMany({
        where,
        select: { email: true, firstName: true },
        take: 5000,
      });
    } catch {
      users = [];
    }

    // Send in batches of 50 to avoid overwhelming SMTP
    const batchSize = 50;
    let sentCount = 0;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(u =>
          this.emailService.sendCampaign(u.email, {
            firstName: u.firstName ?? '',
            subject: campaign.subject as string,
            htmlContent: campaign.htmlContent as string,
          }),
        ),
      );
      sentCount += batch.length;
    }

    return (this.prisma as any).emailCampaign.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentCount,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await (this.prisma as any).emailCampaign.delete({ where: { id } });
    return { message: 'Email campaign deleted' };
  }

  async getStats() {
    const [total, sent, draft] = await Promise.all([
      (this.prisma as any).emailCampaign.count(),
      (this.prisma as any).emailCampaign.count({ where: { status: 'SENT' } }),
      (this.prisma as any).emailCampaign.count({ where: { status: 'DRAFT' } }),
    ]);

    const sentCampaigns = await (this.prisma as any).emailCampaign.findMany({
      where: { status: 'SENT', sentCount: { gt: 0 } },
      select: { sentCount: true, openCount: true },
    });

    const avgOpenRate =
      sentCampaigns.length > 0
        ? sentCampaigns.reduce((sum: number, c: any) => {
            const rate = c.sentCount > 0 ? (c.openCount / c.sentCount) * 100 : 0;
            return sum + rate;
          }, 0) / sentCampaigns.length
        : 0;

    return {
      total,
      sent,
      draft,
      avgOpenRate: Math.round(avgOpenRate * 100) / 100,
    };
  }
}
