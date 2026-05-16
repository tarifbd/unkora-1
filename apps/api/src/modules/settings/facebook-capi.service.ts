import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { SettingsService } from './settings.service';

interface CAPIEvent {
  eventName: string;
  eventTime?: number;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbc?: string;
    fbp?: string;
  };
  customData?: {
    value?: number;
    currency?: string;
    orderId?: string;
    contentIds?: string[];
    contentType?: string;
    contents?: Array<{ id: string; quantity: number; itemPrice: number }>;
  };
  eventSourceUrl?: string;
}

@Injectable()
export class FacebookCAPIService {
  private readonly logger = new Logger(FacebookCAPIService.name);

  constructor(private readonly settingsService: SettingsService) {}

  private hashValue(value: string): string {
    return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
  }

  async sendEvent(event: CAPIEvent): Promise<void> {
    const settings = await this.settingsService.getMany([
      'analytics.capi.enabled',
      'analytics.capi.pixelId',
      'analytics.capi.accessToken',
    ]);

    if (settings['analytics.capi.enabled'] !== 'true') return;
    const pixelId = settings['analytics.capi.pixelId'];
    const accessToken = settings['analytics.capi.accessToken'];
    if (!pixelId || !accessToken) return;

    const hashedUserData: Record<string, string> = {};
    if (event.userData?.email) hashedUserData.em = this.hashValue(event.userData.email);
    if (event.userData?.phone) hashedUserData.ph = this.hashValue(event.userData.phone.replace(/\D/g, ''));
    if (event.userData?.firstName) hashedUserData.fn = this.hashValue(event.userData.firstName);
    if (event.userData?.lastName) hashedUserData.ln = this.hashValue(event.userData.lastName);
    if (event.userData?.clientIpAddress) hashedUserData.client_ip_address = event.userData.clientIpAddress;
    if (event.userData?.clientUserAgent) hashedUserData.client_user_agent = event.userData.clientUserAgent;
    if (event.userData?.fbc) hashedUserData.fbc = event.userData.fbc;
    if (event.userData?.fbp) hashedUserData.fbp = event.userData.fbp;

    const payload = {
      data: [{
        event_name: event.eventName,
        event_time: event.eventTime ?? Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: event.eventSourceUrl,
        user_data: hashedUserData,
        custom_data: event.customData,
      }],
    };

    try {
      const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.text();
        this.logger.warn(`CAPI event ${event.eventName} failed: ${err}`);
      } else {
        this.logger.log(`CAPI event sent: ${event.eventName}`);
      }
    } catch (err) {
      this.logger.error(`CAPI network error for ${event.eventName}`, err);
    }
  }

  async sendPurchase(params: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    orderId: string;
    value: number;
    currency?: string;
    items: Array<{ id: string; quantity: number; price: number }>;
  }): Promise<void> {
    await this.sendEvent({
      eventName: 'Purchase',
      userData: { email: params.email, phone: params.phone, firstName: params.firstName, lastName: params.lastName },
      customData: {
        value: params.value,
        currency: params.currency ?? 'BDT',
        orderId: params.orderId,
        contentIds: params.items.map(i => i.id),
        contentType: 'product',
        contents: params.items.map(i => ({ id: i.id, quantity: i.quantity, itemPrice: i.price })),
      },
    });
  }
}
