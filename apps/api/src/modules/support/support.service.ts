import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  private generateTicketNumber(): string {
    const prefix = 'TKT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // ── Customer: create ticket ────────────────────────────────
  async createTicket(userId: string, dto: {
    subject: string;
    message: string;
    category?: string;
    priority?: string;
  }) {
    const ticket = await (this.prisma as any).supportTicket.create({
      data: {
        ticketNumber: this.generateTicketNumber(),
        userId,
        subject: dto.subject,
        category: dto.category ?? 'general',
        priority: dto.priority ?? 'MEDIUM',
        messages: {
          create: {
            senderId: userId,
            senderRole: 'customer',
            message: dto.message,
          },
        },
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    });
    return ticket;
  }

  // ── Customer: get own tickets ──────────────────────────────
  async getMyTickets(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      (this.prisma as any).supportTicket.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      (this.prisma as any).supportTicket.count({ where: { userId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── Customer: reply to ticket ──────────────────────────────
  async addMessage(userId: string, ticketId: string, message: string, isAdmin = false) {
    const ticket = await (this.prisma as any).supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!isAdmin && ticket.userId !== userId) throw new ForbiddenException('Access denied');

    const msg = await (this.prisma as any).ticketMessage.create({
      data: {
        ticketId,
        senderId: userId,
        senderRole: isAdmin ? 'admin' : 'customer',
        message,
      },
    });

    // Update ticket status
    const newStatus = isAdmin ? 'WAITING_CUSTOMER' : 'IN_PROGRESS';
    await (this.prisma as any).supportTicket.update({
      where: { id: ticketId },
      data: { status: newStatus, updatedAt: new Date() },
    });

    return msg;
  }

  // ── Admin: list all tickets ────────────────────────────────
  async getAllTickets(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
    category?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.priority) where.priority = params.priority;
    if (params.category) where.category = params.category;
    if (params.search) {
      where.OR = [
        { subject: { contains: params.search, mode: 'insensitive' } },
        { ticketNumber: { contains: params.search, mode: 'insensitive' } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      (this.prisma as any).supportTicket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
      }),
      (this.prisma as any).supportTicket.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── Admin: get ticket detail with all messages ─────────────
  async getTicketDetail(ticketId: string) {
    const ticket = await (this.prisma as any).supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, phone: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
          },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  // ── Admin: update ticket status / assign ──────────────────
  async updateTicket(ticketId: string, dto: {
    status?: string;
    priority?: string;
    assignedTo?: string;
  }) {
    const ticket = await (this.prisma as any).supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const data: any = {};
    if (dto.status) {
      data.status = dto.status;
      if (dto.status === 'RESOLVED') data.resolvedAt = new Date();
      if (dto.status === 'CLOSED') data.closedAt = new Date();
    }
    if (dto.priority) data.priority = dto.priority;
    if (dto.assignedTo !== undefined) data.assignedTo = dto.assignedTo;

    return (this.prisma as any).supportTicket.update({
      where: { id: ticketId },
      data,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { messages: true } },
      },
    });
  }

  // ── Stats for dashboard ────────────────────────────────────
  async getStats() {
    const [open, inProgress, waitingCustomer, resolved, closed, urgent] = await Promise.all([
      (this.prisma as any).supportTicket.count({ where: { status: 'OPEN' } }),
      (this.prisma as any).supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      (this.prisma as any).supportTicket.count({ where: { status: 'WAITING_CUSTOMER' } }),
      (this.prisma as any).supportTicket.count({ where: { status: 'RESOLVED' } }),
      (this.prisma as any).supportTicket.count({ where: { status: 'CLOSED' } }),
      (this.prisma as any).supportTicket.count({ where: { priority: 'URGENT', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    ]);
    return { open, inProgress, waitingCustomer, resolved, closed, urgent, total: open + inProgress + waitingCustomer + resolved + closed };
  }
}
