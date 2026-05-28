import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class BkashService {
  private readonly logger = new Logger(BkashService.name);
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;
  private readonly appKey: string;
  private readonly appSecret: string;
  private idToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry = 0;

  constructor() {
    this.baseUrl =
      process.env['BKASH_BASE_URL'] ??
      'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized';
    this.appKey = process.env['BKASH_APP_KEY'] ?? '';
    this.appSecret = process.env['BKASH_APP_SECRET'] ?? '';
    this.http = axios.create({ baseURL: this.baseUrl, timeout: 30_000 });
  }

  private async getToken(): Promise<string> {
    if (this.idToken && Date.now() < this.tokenExpiry - 60_000) return this.idToken;
    if (this.refreshToken) {
      try { return await this.refreshAccessToken(); } catch { /* fall to grant */ }
    }
    return this.grantToken();
  }

  private async grantToken(): Promise<string> {
    const res = await this.http.post(
      '/checkout/token/grant',
      { app_key: this.appKey, app_secret: this.appSecret },
      { headers: { username: this.appKey, password: this.appSecret } },
    );
    if (res.data.statusCode !== '0000') {
      throw new BadRequestException(`bKash token grant failed: ${res.data.statusMessage}`);
    }
    this.idToken = res.data.id_token as string;
    this.refreshToken = res.data.refresh_token as string;
    this.tokenExpiry = Date.now() + ((res.data.expires_in as number) ?? 3600) * 1000;
    return this.idToken;
  }

  private async refreshAccessToken(): Promise<string> {
    const res = await this.http.post(
      '/checkout/token/refresh',
      { app_key: this.appKey, refresh_token: this.refreshToken },
      { headers: { username: this.appKey, password: this.appSecret } },
    );
    if (res.data.statusCode !== '0000') throw new Error('bKash token refresh failed');
    this.idToken = res.data.id_token as string;
    this.refreshToken = res.data.refresh_token as string;
    this.tokenExpiry = Date.now() + ((res.data.expires_in as number) ?? 3600) * 1000;
    return this.idToken;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    return {
      Authorization: await this.getToken(),
      'X-APP-Key': this.appKey,
      'Content-Type': 'application/json',
    };
  }

  async createPayment(
    _orderId: string,
    userId: string,
    amount: number,
    orderNumber: string,
    callbackUrl: string,
  ): Promise<{ paymentID: string; bkashURL: string }> {
    const prefix = process.env['BKASH_MERCHANT_INVOICE_PREFIX'] ?? 'UNKORA';
    const res = await this.http.post(
      '/checkout/create',
      {
        mode: '0011',
        payerReference: userId,
        callbackURL: callbackUrl,
        amount: String(Number(amount).toFixed(2)),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: `${prefix}-${orderNumber}`,
      },
      { headers: await this.authHeaders() },
    );
    if (res.data.statusCode !== '0000') {
      throw new BadRequestException(`bKash create failed: ${res.data.statusMessage}`);
    }
    return { paymentID: res.data.paymentID as string, bkashURL: res.data.bkashURL as string };
  }

  async executePayment(paymentID: string): Promise<{ trxID: string; amount: string; status: string }> {
    const res = await this.http.post(
      '/checkout/execute',
      { paymentID },
      { headers: await this.authHeaders() },
    );
    if (res.data.statusCode !== '0000') {
      throw new BadRequestException(`bKash execute failed: ${res.data.statusMessage}`);
    }
    return {
      trxID: res.data.trxID as string,
      amount: res.data.amount as string,
      status: res.data.transactionStatus as string,
    };
  }

  async queryPayment(paymentID: string): Promise<{ trxID: string; status: string }> {
    const res = await this.http.post(
      '/checkout/payment/status',
      { paymentID },
      { headers: await this.authHeaders() },
    );
    return { trxID: res.data.trxID as string, status: res.data.transactionStatus as string };
  }

  async refund(
    paymentID: string,
    trxID: string,
    amount: string,
    sku: string,
    reason: string,
  ): Promise<unknown> {
    const res = await this.http.post(
      '/checkout/payment/refund',
      { paymentID, amount, trxID, sku, reason },
      { headers: await this.authHeaders() },
    );
    if (res.data.statusCode !== '0000') {
      throw new BadRequestException(`bKash refund failed: ${res.data.statusMessage}`);
    }
    return res.data;
  }
}
