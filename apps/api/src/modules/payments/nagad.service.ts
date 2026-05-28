import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { constants, createSign, publicEncrypt, randomBytes } from 'crypto';

@Injectable()
export class NagadService {
  private readonly logger = new Logger(NagadService.name);
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;
  private readonly merchantId: string;
  private readonly publicKey: string;
  private readonly privateKey: string;

  constructor() {
    this.baseUrl =
      process.env['NAGAD_BASE_URL'] ??
      'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0';
    this.merchantId = process.env['NAGAD_MERCHANT_ID'] ?? '';
    this.publicKey = process.env['NAGAD_PUBLIC_KEY'] ?? '';
    this.privateKey = process.env['NAGAD_PRIVATE_KEY'] ?? '';
    this.http = axios.create({ baseURL: this.baseUrl, timeout: 30_000 });
  }

  private getDatetime(): string {
    return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  }

  private encryptData(data: object): string {
    if (!this.publicKey) return Buffer.from(JSON.stringify(data)).toString('base64');
    const pem = `-----BEGIN PUBLIC KEY-----\n${this.publicKey}\n-----END PUBLIC KEY-----`;
    return publicEncrypt(
      { key: pem, padding: constants.RSA_PKCS1_PADDING },
      Buffer.from(JSON.stringify(data)),
    ).toString('base64');
  }

  private signData(data: string): string {
    if (!this.privateKey) return '';
    const pem = `-----BEGIN RSA PRIVATE KEY-----\n${this.privateKey}\n-----END RSA PRIVATE KEY-----`;
    return createSign('SHA256').update(data).sign(pem, 'base64');
  }

  private nagadHeaders(extraMerchantId?: string): Record<string, string> {
    return {
      'X-KM-IP-V4': '127.0.0.1',
      'X-KM-MC-Id': extraMerchantId ?? this.merchantId,
      'X-KM-Client-Type': 'PC_WEB',
      'X-KM-Api-Version': 'v-0.2.0',
      'Content-Type': 'application/json',
    };
  }

  async initializePayment(
    orderId: string,
    _userId: string,
    _amount: number,
    callbackUrl: string,
  ): Promise<{ paymentReferenceId: string; redirectURL: string }> {
    const datetime = this.getDatetime();
    const challenge = randomBytes(16).toString('hex');
    const sensitive = { merchantId: this.merchantId, datetime, orderId, challenge };
    const sensitiveData = this.encryptData(sensitive);
    const signature = this.signData(JSON.stringify({ datetime, merchantId: this.merchantId, orderId, challenge }));

    const res = await this.http.post(
      `/api/dfs/check-out/initialize/${this.merchantId}/${orderId}`,
      { dateTime: datetime, sensitiveData, signature, merchantCallbackURL: callbackUrl },
      { headers: this.nagadHeaders() },
    );

    if (res.data.reason || !res.data.paymentReferenceId) {
      throw new BadRequestException(`Nagad init failed: ${res.data.message ?? res.data.reason ?? 'unknown'}`);
    }

    return {
      paymentReferenceId: res.data.paymentReferenceId as string,
      redirectURL: res.data.callBackUrl as string,
    };
  }

  async completePayment(
    paymentReferenceId: string,
    merchantId: string,
    orderId: string,
    challenge: string,
  ): Promise<{ status: string; trxId: string; amount: string }> {
    const datetime = this.getDatetime();
    const sensitive = { merchantId, datetime, orderId, challenge };
    const sensitiveData = this.encryptData(sensitive);
    const signature = this.signData(JSON.stringify({ datetime, merchantId, orderId, challenge }));

    const res = await this.http.post(
      `/api/dfs/check-out/complete/${paymentReferenceId}`,
      {
        sensitiveData,
        signature,
        merchantCallbackURL: process.env['NAGAD_CALLBACK_URL'] ?? '',
        additionalMerchantInfo: {},
      },
      { headers: this.nagadHeaders(merchantId) },
    );

    return {
      status: res.data.status as string,
      trxId: res.data.merchantInvoiceNumber as string,
      amount: res.data.amount as string,
    };
  }

  async verifyPayment(paymentReferenceId: string): Promise<{ status: string; amount: string; trxId: string }> {
    const res = await this.http.get(
      `/api/dfs/verify/payment/${paymentReferenceId}`,
      { headers: this.nagadHeaders() },
    );
    return {
      status: res.data.status as string,
      amount: res.data.amount as string,
      trxId: res.data.merchantInvoiceNumber as string,
    };
  }
}
