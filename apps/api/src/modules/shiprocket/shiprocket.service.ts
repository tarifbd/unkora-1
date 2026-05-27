import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ShiprocketService {
  private readonly logger = new Logger(ShiprocketService.name);
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private readonly config: ConfigService) {}

  private get baseUrl() {
    return 'https://apiv2.shiprocket.in/v1/external';
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) return this.token;

    const email = this.config.get<string>('SHIPROCKET_EMAIL');
    const password = this.config.get<string>('SHIPROCKET_PASSWORD');
    if (!email || !password) throw new BadRequestException('Shiprocket credentials not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.');

    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json() as any;
    if (!data.token) throw new BadRequestException('Shiprocket login failed: ' + (data.message ?? 'Unknown error'));
    this.token = data.token;
    this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000; // 9 days (token valid 10 days)
    return this.token!;
  }

  private async apiCall(method: string, path: string, body?: any): Promise<any> {
    const token = await this.getToken();
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }

  async createOrder(orderData: {
    orderId: string;
    orderDate: string;
    pickupLocation: string;
    billingName: string;
    billingPhone: string;
    billingAddress: string;
    billingCity: string;
    billingPincode: string;
    billingState: string;
    billingCountry: string;
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    shippingCity: string;
    shippingPincode: string;
    shippingState: string;
    shippingCountry: string;
    paymentMethod: string; // 'Prepaid' | 'COD'
    subTotal: number;
    weight: number; // kg
    items: { name: string; sku: string; units: number; sellingPrice: number }[];
  }) {
    return this.apiCall('POST', '/orders/create/adhoc', {
      order_id: orderData.orderId,
      order_date: orderData.orderDate,
      pickup_location: orderData.pickupLocation,
      billing_customer_name: orderData.billingName,
      billing_phone: orderData.billingPhone,
      billing_address: orderData.billingAddress,
      billing_city: orderData.billingCity,
      billing_pincode: orderData.billingPincode,
      billing_state: orderData.billingState,
      billing_country: orderData.billingCountry,
      shipping_is_billing: false,
      shipping_customer_name: orderData.shippingName,
      shipping_phone: orderData.shippingPhone,
      shipping_address: orderData.shippingAddress,
      shipping_city: orderData.shippingCity,
      shipping_pincode: orderData.shippingPincode,
      shipping_state: orderData.shippingState,
      shipping_country: orderData.shippingCountry,
      payment_method: orderData.paymentMethod,
      sub_total: orderData.subTotal,
      weight: orderData.weight,
      order_items: orderData.items.map(i => ({
        name: i.name,
        sku: i.sku,
        units: i.units,
        selling_price: i.sellingPrice,
      })),
    });
  }

  async trackOrder(shipmentId: string) {
    return this.apiCall('GET', `/courier/track/shipment/${shipmentId}`);
  }

  async trackByAwb(awb: string) {
    return this.apiCall('GET', `/courier/track/awbs?awbs=${awb}`);
  }

  async getOrderDetails(orderId: string) {
    return this.apiCall('GET', `/orders/show/${orderId}`);
  }

  async cancelOrder(ids: number[]) {
    return this.apiCall('POST', '/orders/cancel', { ids });
  }

  async getShippingRates(params: {
    pickupPostcode: string;
    deliveryPostcode: string;
    weight: number;
    cod: 0 | 1;
    declaredValue?: number;
  }) {
    const q = new URLSearchParams({
      pickup_postcode: params.pickupPostcode,
      delivery_postcode: params.deliveryPostcode,
      weight: String(params.weight),
      cod: String(params.cod),
      ...(params.declaredValue ? { declared_value: String(params.declaredValue) } : {}),
    });
    return this.apiCall('GET', `/courier/serviceability/?${q.toString()}`);
  }

  async generateLabel(shipmentIds: number[]) {
    return this.apiCall('POST', '/courier/generate/label', { shipment_id: shipmentIds });
  }

  async generateInvoice(orderIds: number[]) {
    return this.apiCall('POST', '/orders/print/invoice', { ids: orderIds });
  }

  async getPickupLocations() {
    return this.apiCall('GET', '/settings/company/pickup');
  }

  async listOrders(page = 1, perPage = 20) {
    return this.apiCall('GET', `/orders?page=${page}&per_page=${perPage}`);
  }
}
