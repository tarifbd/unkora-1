import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class VirtualTryOnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async createSession(dto: {
    productId: string;
    variantId?: string;
    userImageUrl?: string;
    userId?: string;
  }) {
    return (this.prisma as any).virtualTryOnSession.create({
      data: {
        productId: dto.productId,
        variantId: dto.variantId,
        userImageUrl: dto.userImageUrl,
        userId: dto.userId,
        status: 'PENDING',
      },
    });
  }

  async processSession(sessionId: string) {
    const session = await (this.prisma as any).virtualTryOnSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');

    const cfg = await this.settings.getMany([
      'virtual-tryon.aiServiceUrl',
      'virtual-tryon.aiServiceKey',
      'virtual-tryon.enabled',
    ]);

    const aiServiceUrl = cfg['virtual-tryon.aiServiceUrl'];
    const aiServiceKey = cfg['virtual-tryon.aiServiceKey'];

    if (!aiServiceUrl || cfg['virtual-tryon.enabled'] !== 'true') {
      return (this.prisma as any).virtualTryOnSession.update({
        where: { id: sessionId },
        data: {
          status: 'FAILED',
          errorMessage: 'AI service not configured',
        },
      });
    }

    await (this.prisma as any).virtualTryOnSession.update({
      where: { id: sessionId },
      data: { status: 'PROCESSING' },
    });

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (aiServiceKey) headers['Authorization'] = `Bearer ${aiServiceKey}`;

      const response = await fetch(aiServiceUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_image: session.userImageUrl,
          product_image: session.productId,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }

      const result = await response.json() as { result_url?: string };
      return (this.prisma as any).virtualTryOnSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          resultImageUrl: result.result_url ?? null,
        },
      });
    } catch (err: any) {
      return (this.prisma as any).virtualTryOnSession.update({
        where: { id: sessionId },
        data: {
          status: 'FAILED',
          errorMessage: err?.message ?? 'Processing failed',
        },
      });
    }
  }

  async getSession(id: string) {
    const session = await (this.prisma as any).virtualTryOnSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async getUserSessions(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      (this.prisma as any).virtualTryOnSession.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).virtualTryOnSession.count({ where: { userId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getAdminSessions(params: {
    page?: number;
    limit?: number;
    status?: string;
    productId?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.productId) where.productId = params.productId;

    const [data, total] = await Promise.all([
      (this.prisma as any).virtualTryOnSession.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).virtualTryOnSession.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getSettings() {
    return this.settings.getMany([
      'virtual-tryon.enabled',
      'virtual-tryon.aiServiceUrl',
      'virtual-tryon.requireLogin',
    ]);
  }

  async saveSettings(data: Record<string, string>) {
    const allowed = [
      'virtual-tryon.enabled',
      'virtual-tryon.aiServiceUrl',
      'virtual-tryon.aiServiceKey',
      'virtual-tryon.requireLogin',
    ];
    const filtered = Object.fromEntries(
      Object.entries(data).filter(([k]) => allowed.includes(k)),
    );
    await this.settings.setMany(filtered);
    return { success: true };
  }
}
