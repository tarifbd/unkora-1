import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async getStaff(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
    ]);
    return { data, total, page, limit };
  }

  async getStats() {
    const [totalStaff, pendingInvitations, auditLogCount] = await Promise.all([
      this.prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
      (this.prisma as any).staffInvitation.count({
        where: { usedAt: null, expiresAt: { gte: new Date() } },
      }),
      (this.prisma as any).auditLog.count(),
    ]);
    return { totalStaff, pendingInvitations, auditLogCount };
  }

  async invite(data: { email: string; role?: string }) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    return (this.prisma as any).staffInvitation.create({
      data: {
        email: data.email,
        role: data.role ?? 'ADMIN',
        token,
        expiresAt,
      },
    });
  }

  async removeStaff(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Staff user not found');
    return this.prisma.user.update({
      where: { id },
      data: { role: 'CUSTOMER' },
      select: { id: true, email: true, role: true },
    });
  }

  async getAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      (this.prisma as any).auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      (this.prisma as any).auditLog.count(),
    ]);
    return { data, total, page, limit };
  }

  async getInvitations(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      (this.prisma as any).staffInvitation.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).staffInvitation.count(),
    ]);
    return { data, total, page, limit };
  }
}
