import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as qs from 'querystring';

export interface SslCommerzCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

export interface SslCommerzUrls {
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}

@Injectable()
export class SslCommerzService {
  private readonly logger = new Logger(SslCommerzService.name);
  private readonly storeId: string;
  private readonly storePassword: string;
  private readonly baseUrl: string;

  constructor() {
    this.storeId = process.env['SSLCOMMERZ_STORE_ID'] ?? '';
    this.storePassword = process.env['SSLCOMMERZ_STORE_PASSWORD'] ?? '';
    const sandbox = (process.env['SSLCOMMERZ_SANDBOX'] ?? 'true') === 'true';
    this.baseUrl = sandbox
      ? 'https://sandbox.sslcommerz.com'
      : 'https://securepay.sslcommerz.com';
  }

  async initiate(
    orderId: string,
    amount: number,
    orderNumber: string,
    customer: SslCommerzCustomer,
    urls: SslCommerzUrls,
  ): Promise<{ tran_id: string; redirectUrl: string }> {
    const tran_id = `UNKORA-${orderNumber}-${Date.now()}`;

    const params = {
      store_id: this.storeId,
      store_passwd: this.storePassword,
      total_amount: String(Number(amount).toFixed(2)),
      currency: 'BDT',
      tran_id,
      success_url: urls.successUrl,
      fail_url: urls.failUrl,
      cancel_url: urls.cancelUrl,
      ipn_url: urls.ipnUrl,
      cus_name: customer.name,
      cus_email: customer.email,
      cus_phone: customer.phone,
      cus_add1: customer.address,
      cus_city: customer.city,
      cus_country: 'Bangladesh',
      product_name: `Order ${orderNumber}`,
      product_category: 'general',
      product_profile: 'general',
    };

    this.logger.log(`SSLCommerz initiate: orderId=${orderId}, tran_id=${tran_id}`);

    const res = await axios.post(
      `${this.baseUrl}/gwprocess/v4/api.php`,
      qs.stringify(params),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30_000 },
    );

    if (res.data?.status !== 'SUCCESS') {
      this.logger.error(`SSLCommerz initiate failed: ${JSON.stringify(res.data)}`);
      throw new BadRequestException(
        `SSLCommerz initiation failed: ${res.data?.failedreason ?? 'Unknown error'}`,
      );
    }

    return { tran_id, redirectUrl: res.data.GatewayPageURL as string };
  }

  async verify(
    val_id: string,
  ): Promise<{ status: string; tran_id: string; amount: string }> {
    const params = {
      val_id,
      store_id: this.storeId,
      store_passwd: this.storePassword,
      v: '1',
      format: 'json',
    };

    const res = await axios.post(
      `${this.baseUrl}/validator/api/validationserverAPI.php`,
      qs.stringify(params),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30_000 },
    );

    this.logger.log(`SSLCommerz verify: val_id=${val_id}, status=${res.data?.status}`);

    return {
      status: res.data?.status as string,
      tran_id: res.data?.tran_id as string,
      amount: res.data?.amount as string,
    };
  }
}
