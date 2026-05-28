import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ShurjoPayCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

interface ShurjoPayToken {
  token: string;
  store_id: string;
  execute_url: string;
  token_type: string;
  sp_code: string;
  message: string;
  expires_in?: number;
}

@Injectable()
export class ShurjoPayService {
  private readonly logger = new Logger(ShurjoPayService.name);
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly prefix: string;
  private readonly returnUrl: string;

  private cachedToken: ShurjoPayToken | null = null;
  private tokenExpiry = 0;

  constructor() {
    this.baseUrl =
      process.env['SHURJOPAY_BASE_URL'] ?? 'https://sandbox.shurjopayment.com';
    this.username = process.env['SHURJOPAY_USERNAME'] ?? '';
    this.password = process.env['SHURJOPAY_PASSWORD'] ?? '';
    this.prefix = process.env['SHURJOPAY_PREFIX'] ?? 'UNKORA';
    this.returnUrl =
      process.env['SHURJOPAY_RETURN_URL'] ??
      'https://your-domain.com/checkout/payment-result';
  }

  private async authenticate(): Promise<ShurjoPayToken> {
    if (this.cachedToken && Date.now() < this.tokenExpiry - 60_000) {
      return this.cachedToken;
    }

    const res = await axios.post(
      `${this.baseUrl}/api/get_token`,
      { username: this.username, password: this.password },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30_000 },
    );

    const data = res.data as ShurjoPayToken & { token_create_time?: string; expires_in?: number };

    this.cachedToken = data;
    // Default token TTL to 1 hour if not provided
    const ttlMs = ((data.expires_in ?? 3600) as number) * 1000;
    this.tokenExpiry = Date.now() + ttlMs;

    this.logger.log(`ShurjoPay token granted, sp_code=${data.sp_code}`);
    return this.cachedToken;
  }

  async createPayment(
    orderId: string,
    amount: number,
    orderNumber: string,
    customer: ShurjoPayCustomer,
  ): Promise<{ sp_order_id: string; checkout_url: string }> {
    const tokenData = await this.authenticate();

    if (tokenData.sp_code !== '200') {
      throw new BadRequestException(
        `ShurjoPay authentication failed: ${tokenData.message}`,
      );
    }

    const payload = {
      prefix: this.prefix,
      token: tokenData.token,
      store_id: tokenData.store_id,
      return_url: this.returnUrl,
      cancel_url: this.returnUrl,
      amount,
      order_id: `${this.prefix}-${orderNumber}`,
      currency: 'BDT',
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_address: customer.address,
      customer_city: customer.city,
      customer_country: 'Bangladesh',
    };

    this.logger.log(`ShurjoPay createPayment: orderId=${orderId}, order_id=${payload.order_id}`);

    const res = await axios.post(tokenData.execute_url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${tokenData.token_type} ${tokenData.token}`,
      },
      timeout: 30_000,
    });

    const result = res.data as {
      checkout_url: string;
      sp_order_id: string;
      customer_order_id: string;
      transactionStatus: string;
    };

    if (!result.checkout_url) {
      throw new BadRequestException('ShurjoPay did not return a checkout URL');
    }

    return {
      sp_order_id: result.sp_order_id,
      checkout_url: result.checkout_url,
    };
  }

  async verifyPayment(
    sp_order_id: string,
  ): Promise<{ status: string; amount: string; transaction_id: string }> {
    const tokenData = await this.authenticate();

    const res = await axios.post(
      `${this.baseUrl}/api/verification`,
      { order_id: sp_order_id },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${tokenData.token_type} ${tokenData.token}`,
        },
        timeout: 30_000,
      },
    );

    // Returns an array; first element has the result
    const results = res.data as Array<{
      sp_code: string;
      sp_message: string;
      transaction_status: string;
      amount: string;
      bank_trx_id?: string;
      id?: string;
    }>;

    const first = Array.isArray(results) ? results[0] : (results as typeof results[0]);

    this.logger.log(
      `ShurjoPay verify: sp_order_id=${sp_order_id}, sp_code=${first?.sp_code}`,
    );

    return {
      status: first?.transaction_status ?? 'unknown',
      amount: String(first?.amount ?? '0'),
      transaction_id: first?.bank_trx_id ?? first?.id ?? '',
    };
  }
}
