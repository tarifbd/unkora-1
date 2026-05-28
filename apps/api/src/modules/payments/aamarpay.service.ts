import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface AamarPayCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

export interface AamarPayUrls {
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
}

@Injectable()
export class AamarPayService {
  private readonly logger = new Logger(AamarPayService.name);
  private readonly storeId: string;
  private readonly signatureKey: string;
  private readonly baseUrl: string;
  private readonly verifyBaseUrl: string;

  constructor() {
    this.storeId = process.env['AAMARPAY_STORE_ID'] ?? '';
    this.signatureKey = process.env['AAMARPAY_SIGNATURE_KEY'] ?? '';
    const sandbox = (process.env['AAMARPAY_SANDBOX'] ?? 'true') === 'true';
    this.baseUrl = sandbox
      ? 'https://sandbox.aamarpay.com'
      : 'https://secure.aamarpay.com';
    this.verifyBaseUrl = sandbox
      ? 'https://sandbox.aamarpay.com'
      : 'https://secure.aamarpay.com';
  }

  async initiatePayment(
    orderId: string,
    amount: number,
    orderNumber: string,
    customer: AamarPayCustomer,
    urls: AamarPayUrls,
  ): Promise<{ tran_id: string; payment_url: string }> {
    const tran_id = `UNKORA-${orderNumber}`;

    const payload = {
      store_id: this.storeId,
      tran_id,
      success_url: urls.successUrl,
      fail_url: urls.failUrl,
      cancel_url: urls.cancelUrl,
      amount: Number(amount).toFixed(2),
      currency: 'BDT',
      signature_key: this.signatureKey,
      desc: `Order ${orderNumber} payment`,
      cus_name: customer.name,
      cus_email: customer.email,
      cus_phone: customer.phone,
      cus_add1: customer.address,
      cus_city: customer.city,
      cus_country: 'BD',
      type: 'json',
    };

    this.logger.log(`AamarPay initiatePayment: orderId=${orderId}, tran_id=${tran_id}`);

    const res = await axios.post(`${this.baseUrl}/index.php`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30_000,
    });

    const data = res.data as { result?: string; payment_url?: string; error?: string };

    if (data.result !== 'true' || !data.payment_url) {
      this.logger.error(`AamarPay initiate failed: ${JSON.stringify(res.data)}`);
      throw new BadRequestException(
        `AamarPay initiation failed: ${data.error ?? 'Unknown error'}`,
      );
    }

    return { tran_id, payment_url: data.payment_url };
  }

  async verifyPayment(
    request_id: string,
  ): Promise<{ status: string; amount: string; tran_id: string }> {
    const payload = {
      request_id,
      store_id: this.storeId,
      signature_key: this.signatureKey,
      type: 'json',
    };

    const res = await axios.post(
      `${this.verifyBaseUrl}/api/v1/trxcheck/request.php`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30_000,
      },
    );

    const data = res.data as {
      pay_status?: string;
      amount?: string;
      mer_txnid?: string;
      risk_title?: string;
    };

    this.logger.log(
      `AamarPay verify: request_id=${request_id}, status=${data.pay_status}`,
    );

    return {
      status: data.pay_status ?? 'unknown',
      amount: data.amount ?? '0',
      tran_id: data.mer_txnid ?? request_id,
    };
  }
}
