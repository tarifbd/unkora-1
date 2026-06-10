import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RagService {
  constructor(private readonly prisma: PrismaService) {}

  async listDocuments(params: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where: any = {};
    if (params.category) where.category = params.category;
    if (params.status) where.status = params.status;

    const [data, total] = await Promise.all([
      (this.prisma as any).ragDocument.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { chunks: true } } },
      }),
      (this.prisma as any).ragDocument.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getDocument(id: string) {
    const doc = await (this.prisma as any).ragDocument.findUnique({
      where: { id },
      include: { chunks: { orderBy: { chunkIndex: 'asc' } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async createDocument(dto: {
    title: string;
    content: string;
    category?: string;
    source?: string;
  }) {
    const doc = await (this.prisma as any).ragDocument.create({
      data: {
        title: dto.title,
        content: dto.content,
        category: dto.category ?? 'GENERAL',
        source: dto.source,
        status: 'PENDING',
      },
    });

    try {
      const chunks = this.chunkContent(dto.content);
      await (this.prisma as any).ragDocumentChunk.createMany({
        data: chunks.map((content, chunkIndex) => ({
          documentId: doc.id,
          chunkIndex,
          content,
        })),
      });

      await (this.prisma as any).ragDocument.update({
        where: { id: doc.id },
        data: { status: 'INDEXED' },
      });

      return { ...doc, status: 'INDEXED' };
    } catch {
      await (this.prisma as any).ragDocument.update({
        where: { id: doc.id },
        data: { status: 'FAILED' },
      });
      return { ...doc, status: 'FAILED' };
    }
  }

  async updateDocument(id: string, dto: {
    title?: string;
    content?: string;
    category?: string;
    isActive?: boolean;
  }) {
    const doc = await (this.prisma as any).ragDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return (this.prisma as any).ragDocument.update({ where: { id }, data });
  }

  async deleteDocument(id: string) {
    const doc = await (this.prisma as any).ragDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    await (this.prisma as any).ragDocument.delete({ where: { id } });
    return { success: true };
  }

  async searchDocuments(query: string) {
    const data = await (this.prisma as any).ragDocument.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { _count: { select: { chunks: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { data };
  }

  async getStats() {
    const [total, pending, indexed, failed] = await Promise.all([
      (this.prisma as any).ragDocument.count(),
      (this.prisma as any).ragDocument.count({ where: { status: 'PENDING' } }),
      (this.prisma as any).ragDocument.count({ where: { status: 'INDEXED' } }),
      (this.prisma as any).ragDocument.count({ where: { status: 'FAILED' } }),
    ]);

    const byCategory = await (this.prisma as any).ragDocument.groupBy({
      by: ['category'],
      _count: { _all: true },
    });

    return {
      total,
      byStatus: { pending, indexed, failed },
      byCategory: Object.fromEntries(
        byCategory.map((r: any) => [r.category, r._count._all]),
      ),
    };
  }

  private chunkContent(content: string, chunkSize = 500): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < content.length) {
      chunks.push(content.slice(i, i + chunkSize));
      i += chunkSize;
    }
    return chunks;
  }
}
