import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private config: ConfigService) {
    // Use Ethereal (fake SMTP) in dev if no SMTP config, or real SMTP in prod
    const host = this.config.get('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(this.config.get('SMTP_PORT') ?? '587', 10),
        secure: this.config.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
      });
    } else {
      // Auto-create Ethereal test account
      nodemailer.createTestAccount().then(account => {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: account.user, pass: account.pass },
        });
        this.logger.log(`Ethereal email: ${account.user}`);
      }).catch(() => this.logger.warn('Email not configured'));
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.transporter) { this.logger.warn('Email transporter not ready'); return; }
    try {
      const info = await this.transporter.sendMail({
        from: `"UNKORA" <${this.config.get('SMTP_FROM') ?? 'noreply@unkora.com'}>`,
        to, subject, html,
      });
      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (err) {
      this.logger.error('Email send failed', err);
    }
  }

  async sendOrderConfirmation(to: string, order: {
    orderNumber: string; total: string; items: Array<{ productName: string; quantity: number; price: string }>;
    shippingAddress: Record<string, string>;
  }) {
    const itemRows = order.items.map(i =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.productName}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">৳${Number(i.price) * i.quantity}</td></tr>`
    ).join('');

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#1c1917;color:#fbbf24;padding:20px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:28px">UNKORA</h1>
        <p style="margin:4px 0 0;color:#d6d3d1">Order Confirmed!</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
        <h2 style="color:#1c1917">Thank you for your order!</h2>
        <p>Your order <strong>#${order.orderNumber}</strong> has been received and is being processed.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#f9fafb"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Price</th></tr></thead>
          <tbody>${itemRows}</tbody>
          <tfoot><tr><td colspan="2" style="padding:8px;text-align:right;font-weight:bold">Total:</td><td style="padding:8px;text-align:right;font-weight:bold;color:#d97706">৳${order.total}</td></tr></tfoot>
        </table>
        <div style="background:#f9fafb;padding:12px;border-radius:6px;margin-top:16px">
          <strong>Shipping to:</strong><br>
          ${order.shippingAddress.fullName}<br>
          ${order.shippingAddress.addressLine1}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.district}<br>
          ${order.shippingAddress.division}
        </div>
        <p style="margin-top:20px;color:#6b7280;font-size:14px">Delivery within 3-7 business days. Questions? Email support@unkora.com</p>
      </div>
    </div>`;
    await this.send(to, `Order Confirmed #${order.orderNumber} — UNKORA`, html);
  }

  async sendLowStockAlert(productName: string, currentStock: number): Promise<void> {
    const adminEmail = this.config.get('ADMIN_EMAIL') ?? 'admin@unkora.com';
    await this.send(
      adminEmail,
      `Low Stock Alert: ${productName}`,
      `<div style="font-family:sans-serif;padding:20px">
        <h2 style="color:#dc2626">⚠️ Low Stock Alert</h2>
        <p>Product <strong>${productName}</strong> is running low.</p>
        <p>Current stock: <strong style="color:#dc2626">${currentStock} units</strong></p>
        <p>Please restock soon to avoid stockouts.</p>
      </div>`,
    );
  }

  async sendOrderStatusUpdate(to: string, orderNumber: string, status: string, note?: string) {
    const statusLabel: Record<string, string> = {
      CONFIRMED: '✅ Confirmed', PROCESSING: '🔄 Processing', SHIPPED: '🚚 Shipped',
      OUT_FOR_DELIVERY: '📦 Out for Delivery', DELIVERED: '🎉 Delivered', CANCELLED: '❌ Cancelled',
    };
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#1c1917;color:#fbbf24;padding:20px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:28px">UNKORA</h1>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
        <h2>Order Update — #${orderNumber}</h2>
        <p style="font-size:18px">${statusLabel[status] ?? status}</p>
        ${note ? `<p style="background:#f9fafb;padding:12px;border-radius:6px;color:#374151">${note}</p>` : ''}
        <p style="color:#6b7280;font-size:14px">Thank you for shopping with UNKORA!</p>
      </div>
    </div>`;
    await this.send(to, `Order #${orderNumber} — ${statusLabel[status] ?? status}`, html);
  }
}
