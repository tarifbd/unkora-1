import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FraudService {
  constructor(private readonly prisma: PrismaService) {}

  async getBlockedEntities(type?: string) {
    return this.prisma.blockedEntity.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async blockEntity(type: string, value: string, reason?: string, blockedBy?: string) {
    return this.prisma.blockedEntity.upsert({
      where: { type_value: { type, value } },
      create: { type, value, reason, blockedBy },
      update: { reason, blockedBy },
    });
  }

  async unblockEntity(id: string) {
    return this.prisma.blockedEntity.delete({ where: { id } });
  }

  async isBlocked(type: string, value: string): Promise<boolean> {
    const entity = await this.prisma.blockedEntity.findUnique({
      where: { type_value: { type, value } },
    });
    return !!entity;
  }

  async checkOrderMetadata(metadata: Record<string, any>) {
    const checks: { type: string; value: string; blocked: boolean }[] = [];
    if (metadata?.ip) {
      checks.push({ type: 'ip', value: metadata.ip, blocked: await this.isBlocked('ip', metadata.ip) });
    }
    if (metadata?.deviceFingerprint) {
      checks.push({ type: 'device', value: metadata.deviceFingerprint, blocked: await this.isBlocked('device', metadata.deviceFingerprint) });
    }
    return checks;
  }

  async getOrdersWithMetadata(limit = 200) {
    const orders = await this.prisma.order.findMany({
      where: { NOT: { metadata: undefined } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, orderNumber: true, status: true, paymentMethod: true,
        total: true, createdAt: true, metadata: true,
        shippingAddress: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true, _count: { select: { orders: true } } } },
        items: { select: { productName: true, quantity: true, unitPrice: true } },
      },
    });
    return orders;
  }

  async getIpClusters() {
    const orders = await this.prisma.order.findMany({
      where: { NOT: { metadata: undefined } },
      select: { id: true, orderNumber: true, metadata: true, shippingAddress: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const ipMap = new Map<string, typeof orders>();
    for (const order of orders) {
      const meta = order.metadata as Record<string, any> | null;
      if (!meta?.ip || meta.ip === 'unknown') continue;
      if (!ipMap.has(meta.ip)) ipMap.set(meta.ip, []);
      ipMap.get(meta.ip)!.push(order);
    }

    return Array.from(ipMap.entries())
      .filter(([, orders]) => orders.length > 1)
      .map(([ip, orders]) => ({ ip, orderCount: orders.length, orders }))
      .sort((a, b) => b.orderCount - a.orderCount);
  }
}
