import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

interface WhatsAppTextMessage {
  to: string;
  text: string;
}

interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiVersion = 'v19.0';

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get token() {
    return this.config.get<string>('WHATSAPP_API_TOKEN') ?? '';
  }

  private get phoneNumberId() {
    return this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID') ?? '';
  }

  private get isConfigured() {
    return !!(this.token && this.phoneNumberId);
  }

  private normalizePhone(phone: string): string {
    // Normalize BD numbers: 01XXXXXXXXX → 8801XXXXXXXXX
    const clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0') && clean.length === 11) return `88${clean}`;
    if (clean.startsWith('880')) return clean;
    return clean;
  }

  async sendText({ to, text }: WhatsAppTextMessage) {
    if (!this.isConfigured) {
      this.logger.warn('[WhatsApp] Not configured — set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID');
      return null;
    }

    const phone = this.normalizePhone(to);
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'text',
          text: { preview_url: false, body: text },
        }),
      });

      const data = await res.json() as any;
      if (!res.ok) {
        this.logger.error(`[WhatsApp] Send failed: ${JSON.stringify(data)}`);
        return null;
      }

      this.logger.log(`[WhatsApp] Sent to ${phone}: ${data.messages?.[0]?.id}`);
      return data;
    } catch (err) {
      this.logger.error('[WhatsApp] Network error', err);
      return null;
    }
  }

  async sendTemplate({ to, templateName, languageCode = 'en_US', components }: WhatsAppTemplateMessage) {
    if (!this.isConfigured) {
      this.logger.warn('[WhatsApp] Not configured');
      return null;
    }

    const phone = this.normalizePhone(to);
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components: components ?? [],
          },
        }),
      });

      const data = await res.json() as any;
      if (!res.ok) {
        this.logger.error(`[WhatsApp] Template send failed: ${JSON.stringify(data)}`);
        return null;
      }
      return data;
    } catch (err) {
      this.logger.error('[WhatsApp] Network error', err);
      return null;
    }
  }

  async sendOrderConfirmation(phone: string, orderNumber: string, total: string) {
    return this.sendText({
      to: phone,
      text: `✅ *Order Confirmed!*\n\nHello! Your order *#${orderNumber}* has been confirmed.\nTotal: *৳${total}*\n\nTrack your order at: ${this.config.get('NEXT_PUBLIC_SITE_URL') ?? 'https://unkora.shop'}/track-order\n\nThank you for shopping with UNKORA! 🛍️`,
    });
  }

  async sendShippingUpdate(phone: string, orderNumber: string, trackingCode: string, provider: string) {
    return this.sendText({
      to: phone,
      text: `📦 *Order Shipped!*\n\nYour order *#${orderNumber}* has been shipped via *${provider}*.\nTracking: *${trackingCode}*\n\nTrack at: ${this.config.get('NEXT_PUBLIC_SITE_URL') ?? 'https://unkora.shop'}/track-order\n\n— UNKORA`,
    });
  }

  async sendAbandonedCartReminder(phone: string, firstName: string, cartTotal: string) {
    return this.sendText({
      to: phone,
      text: `🛒 *Hey ${firstName}!*\n\nYou left items worth *৳${cartTotal}* in your cart.\n\nComplete your order now: ${this.config.get('NEXT_PUBLIC_SITE_URL') ?? 'https://unkora.shop'}/cart\n\n— UNKORA Team`,
    });
  }

  async sendBulk(phones: string[], message: string) {
    const results = await Promise.allSettled(
      phones.map(phone => this.sendText({ to: phone, text: message }))
    );
    const sent = results.filter(r => r.status === 'fulfilled' && r.value).length;
    return { sent, total: phones.length };
  }
}
