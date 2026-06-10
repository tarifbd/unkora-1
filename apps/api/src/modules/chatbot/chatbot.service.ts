import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiProviderFactory } from '../ai-studio/providers/ai-provider.factory';
import { SettingsService } from '../settings/settings.service';

const CONFIG_KEYS = [
  'chatbot.enabled',
  'chatbot.welcomeMessage',
  'contact.whatsappNumber',
  'contact.messengerUsername',
];

const FALLBACK_REPLY =
  "I'm currently offline. Please use the WhatsApp or Messenger buttons to reach our team, or create a support ticket.";

const SYSTEM_PROMPT =
  'You are Unkora AI, the friendly customer support assistant for UNKORA, an online store in Bangladesh. ' +
  'Answer concisely in the same language the customer used (Bengali or English). ' +
  'Use ONLY the provided store knowledge and product data when relevant. ' +
  'Prices are in Bangladeshi Taka (৳). ' +
  'If you do not know, say so politely and suggest contacting human support. ' +
  'Never invent order or delivery information.';

@Injectable()
export class ChatbotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly aiFactory: AiProviderFactory,
  ) {}

  // ── Config ─────────────────────────────────────────────────
  async getPublicConfig() {
    return this.settings.getMany(CONFIG_KEYS);
  }

  async saveConfig(body: Record<string, string>) {
    const data: Record<string, string> = {};
    for (const key of CONFIG_KEYS) {
      if (body[key] !== undefined) data[key] = String(body[key]);
    }
    await this.settings.setMany(data);
    return this.settings.getMany(CONFIG_KEYS);
  }

  // ── Sessions ───────────────────────────────────────────────
  async createSession(dto: { visitorId?: string; userId?: string }) {
    return (this.prisma as any).chatSession.create({
      data: {
        visitorId: dto.visitorId ?? null,
        userId: dto.userId ?? null,
      },
    });
  }

  async getSession(id: string) {
    const session = await (this.prisma as any).chatSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) throw new NotFoundException('Chat session not found');
    return session;
  }

  // ── Messaging (RAG) ────────────────────────────────────────
  async sendMessage(sessionId: string, content: string) {
    const session = await (this.prisma as any).chatSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Chat session not found');

    await (this.prisma as any).chatMessage.create({
      data: { sessionId, role: 'user', content },
    });

    const words = content
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 2);

    const [chunks, products] = await Promise.all([
      words.length
        ? (this.prisma as any).ragDocumentChunk.findMany({
            where: {
              document: { isActive: true, status: 'INDEXED' },
              OR: words.map(w => ({ content: { contains: w, mode: 'insensitive' } })),
            },
            take: 6,
          })
        : [],
      words.length
        ? (this.prisma as any).product.findMany({
            where: {
              isActive: true,
              OR: words.map(w => ({ name: { contains: w, mode: 'insensitive' } })),
            },
            select: { name: true, slug: true, basePrice: true, salePrice: true, stockQuantity: true },
            take: 5,
          })
        : [],
    ]);

    let systemPrompt = SYSTEM_PROMPT;
    if (chunks.length) {
      systemPrompt +=
        '\n\n## Store knowledge\n' + chunks.map((c: any) => `- ${c.content}`).join('\n');
    }
    if (products.length) {
      systemPrompt +=
        '\n\n## Matching products\n' +
        products
          .map(
            (p: any) =>
              `- ${p.name} (/products/${p.slug}) — price ৳${p.salePrice ?? p.basePrice}${p.salePrice ? ` (regular ৳${p.basePrice})` : ''}, stock: ${p.stockQuantity}`,
          )
          .join('\n');
    }

    const provider = this.aiFactory.getProvider();

    if (provider.isConfigured()) {
      try {
        const text = await provider.generateText(content, {
          systemPrompt,
          temperature: 0.4,
          maxTokens: 600,
        });
        const message = await (this.prisma as any).chatMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: text,
            metadata: { provider: provider.name },
          },
        });
        await (this.prisma as any).chatSession.update({
          where: { id: sessionId },
          data: { updatedAt: new Date() },
        });
        return { message, fallback: false };
      } catch {
        // fall through to graceful fallback
      }
    }

    const message = await (this.prisma as any).chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: FALLBACK_REPLY,
        metadata: { fallback: true },
      },
    });
    await (this.prisma as any).chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
    return { message, fallback: true };
  }

  // ── Admin ──────────────────────────────────────────────────
  async getAdminSessions(params: { page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const [data, total] = await Promise.all([
      (this.prisma as any).chatSession.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
      }),
      (this.prisma as any).chatSession.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
