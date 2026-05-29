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

    try {
      const result = await this.dispatchSms(phone, message, provider);
      await this.prisma.smsLog.update({
        where: { id: log.id },
        data: { status: 'SENT', sentAt: new Date(), messageId: result?.messageId },
      });
    } catch {
      await this.prisma.smsLog.update({
        where: { id: log.id },
        data: { status: 'FAILED' },
      });
    }

    return log;
  }

  private async dispatchSms(phone: string, message: string, provider: string): Promise<{ messageId?: string }> {
    // Normalize phone number — ensure it starts with 880 for Bangladesh
    const normalizedPhone = phone.startsWith('0') ? `880${phone.slice(1)}` : phone.replace(/^\+/, '');

    if (provider === 'ssl_wireless') {
      const apiKey = process.env.SSL_WIRELESS_API_KEY;
      const sid = process.env.SSL_WIRELESS_SID;
      if (!apiKey || !sid) {
        console.warn('[SMS] SSL Wireless credentials not set — SMS not sent');
        return {};
      }
      const params = new URLSearchParams({
        api_token: apiKey,
        sid,
        msisdn: normalizedPhone,
        sms: message,
        csms_id: `unkora_${Date.now()}`,
      });
      const res = await fetch(`https://sms.sslwireless.com/pushapi/dynamic/server.php?${params.toString()}`);
      const text = await res.text();
      return { messageId: text.trim() };
    }

    if (provider === 'twilio') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_FROM_NUMBER;
      if (!accountSid || !authToken || !from) {
        console.warn('[SMS] Twilio credentials not set — SMS not sent');
        return {};
      }
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const body = new URLSearchParams({ To: `+${normalizedPhone}`, From: from, Body: message });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const data = await res.json() as any;
      return { messageId: data.sid };
    }

    // Default: log but don't send (dev mode)
    console.log(`[SMS Dev] To: ${phone} | ${message}`);
    return {};
  }

  async sendBulk(phones: string[], message: string) {
    const results = await Promise.all(phones.map(p => this.sendSms(p, message)));
    return { sent: results.length, phones };
  }
}
