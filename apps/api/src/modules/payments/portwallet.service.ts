import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface PortWalletCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

export interface PortWalletUrls {
  returnUrl: string;
  cancelUrl: string;
}

@Injectable()
export class PortWalletService {
  private readonly logger = new Logger(PortWalletService.name);
  private readonly http: AxiosInstance;

  constructor() {
    const appKey = process.env['PORTWALLET_APP_KEY'] ?? '';
    const appSecret = process.env['PORTWALLET_APP_SECRET'] ?? '';
    const sandbox = (process.env['PORTWALLET_SANDBOX'] ?? 'true') === 'true';
    const baseURL = sandbox
      ? 'https://sandbox.portwallet.com'
      : 'https://api.portwallet.com';

    const credentials = Buffer.from(`${appKey}:${appSecret}`).toString('base64');

    this.http = axios.create({
      baseURL,
      timeout: 30_000,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createInvoice(
    orderId: string,
    amount: number,
    orderNumber: string,
    customer: PortWalletCustomer,
    urls: PortWalletUrls,
  ): Promise<{ invoice_hash: string; redirect_url: string }> {
    const invoiceRef = `UNKORA-${orderNumber}`;

    const payload = {
      amount,
      currency: 'BDT',
      invoice: invoiceRef,
      return_url: urls.returnUrl,
      cancel_url: urls.cancelUrl,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: {
          line1: customer.address,
          city: customer.city,
          country: 'BD',
        },
      },
    };

    this.logger.log(`PortWallet createInvoice: orderId=${orderId}, invoice=${invoiceRef}`);

    const res = await this.http.post('/payment/v2/invoice/', payload);

    const data = res.data as {
      status?: number;
      data?: { invoice_hash?: string; link?: string };
      message?: string;
    };

    if (data.status !== 1 || !data.data?.invoice_hash) {
      this.logger.error(`PortWallet createInvoice failed: ${JSON.stringify(res.data)}`);
      throw new BadRequestException(
        `PortWallet invoice creation failed: ${data.message ?? 'Unknown error'}`,
      );
    }

    return {
      invoice_hash: data.data.invoice_hash,
      redirect_url: data.data.link ?? '',
    };
  }

  async verifyInvoice(
    invoice_hash: string,
  ): Promise<{ status: string; amount: number }> {
    const res = await this.http.get(`/payment/v2/invoice/${invoice_hash}/`);

    const data = res.data as {
      status?: number;
      data?: { status?: string; amount?: number };
    };

    this.logger.log(
      `PortWallet verifyInvoice: invoice_hash=${invoice_hash}, status=${data.data?.status}`,
    );

    return {
      status: data.data?.status ?? 'unknown',
      amount: data.data?.amount ?? 0,
    };
  }
}
