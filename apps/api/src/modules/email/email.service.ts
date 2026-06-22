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
    } else if (process.env['NODE_ENV'] === 'production') {
      this.logger.error('SMTP_HOST is not set — emails will NOT be sent in production. Set SMTP_HOST, SMTP_USER, SMTP_PASS in env.');
    } else {
      // Auto-create Ethereal test account (dev only)
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
          ${order.shippingAddress['recipientName'] ?? ''}<br>
          ${order.shippingAddress['phone'] ?? ''}<br>
          ${order.shippingAddress['addressLine1'] ?? ''}<br>
          ${order.shippingAddress['city'] ?? ''}, ${order.shippingAddress['district'] ?? ''}<br>
          ${order.shippingAddress['division'] ?? ''}
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

  async sendPasswordReset(to: string, resetUrl: string, firstName: string) {
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <div style="background:#1c1917;color:#fbbf24;padding:20px;text-align:center;border-radius:8px 8px 0 0">
      <h1 style="margin:0;font-size:28px">UNKORA</h1>
      <p style="margin:4px 0 0;color:#d6d3d1">Password Reset</p>
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
      <h2 style="color:#1c1917">Hi ${firstName},</h2>
      <p>You requested to reset your password. Click the button below within 1 hour:</p>
      <div style="text-align:center;margin:28px 0">
        <a href="${resetUrl}" style="background:#d97706;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
          Reset Password
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
      <p style="color:#9ca3af;font-size:12px;word-break:break-all">Or copy this link: ${resetUrl}</p>
    </div>
  </div>`;
  await this.send(to, 'Reset Your UNKORA Password', html);
}

  async sendEmailVerification(to: string, verifyUrl: string, firstName: string) {
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <div style="background:#1c1917;color:#fbbf24;padding:20px;text-align:center;border-radius:8px 8px 0 0">
      <h1 style="margin:0;font-size:28px">UNKORA</h1>
      <p style="margin:4px 0 0;color:#d6d3d1">Verify Your Email</p>
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
      <h2 style="color:#1c1917">Welcome to UNKORA, ${firstName}!</h2>
      <p>Please verify your email address to unlock all features. This link expires in 24 hours.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="${verifyUrl}" style="background:#16a34a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
          Verify Email
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px">If you didn't create an account, please ignore this email.</p>
      <p style="color:#9ca3af;font-size:12px;word-break:break-all">Or copy this link: ${verifyUrl}</p>
    </div>
  </div>`;
  await this.send(to, 'Verify your UNKORA email address', html);
}

async sendPreorderConfirmation(to: string, data: {
  preorderNumber: string;
  customerName: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  prepaymentAmount: number;
  expectedDelivery: string;
}) {
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
    <h2 style="color:#111827">Preorder Confirmed — ${data.preorderNumber}</h2>
    <p>Hi ${data.customerName}, your preorder has been received!</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280">Product</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${data.productName}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280">Quantity</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${data.quantity}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280">Total</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">৳${data.totalAmount.toFixed(2)}</td></tr>
      ${data.prepaymentAmount > 0 ? `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280">Prepayment Due</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">৳${data.prepaymentAmount.toFixed(2)}</td></tr>` : ''}
      <tr><td style="padding:8px;color:#6b7280">Expected Delivery</td><td style="padding:8px">${data.expectedDelivery}</td></tr>
    </table>
    <p style="color:#6b7280;font-size:13px">We will notify you when your item is ready.</p>
  </div>`;
  await this.send(to, `Preorder Confirmed: ${data.preorderNumber}`, html);
}

async sendPreorderStockAvailable(to: string, customerName: string) {
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
    <h2 style="color:#111827">Great news, ${customerName}!</h2>
    <p>Your preordered item is now in stock and ready to be fulfilled. Our team will process your order shortly.</p>
    <p style="color:#6b7280;font-size:13px">Thank you for your patience.</p>
  </div>`;
  await this.send(to, 'Your preorder is ready!', html);
}

  async sendCampaign(to: string, data: {
    firstName: string;
    subject: string;
    htmlContent: string;
  }) {
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1c1917;padding:20px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="color:#f97316;margin:0;font-size:28px;font-weight:900">UNKORA</h1>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
        ${data.htmlContent}
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0" />
        <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0">
          You received this email because you have an account at UNKORA.<br>
          <a href="${process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://unkora.shop'}/account" style="color:#f97316">Manage preferences</a>
        </p>
      </div>
    </div>`;

    await this.send(to, data.subject, html);
  }

  async sendAbandonedCartRecovery(to: string, data: {
    firstName: string;
    cartItems: Array<{ name: string; quantity: number; price: string; imageUrl?: string }>;
    cartTotal: string;
    recoveryUrl: string;
  }) {
    const itemsHtml = data.cartItems.map(item => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #f3f4f6">
          ${item.imageUrl ? `<img src="${item.imageUrl}" width="48" height="48" style="border-radius:6px;object-fit:cover;vertical-align:middle;margin-right:8px" />` : ''}
          ${item.name}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #f3f4f6;text-align:center">${item.quantity}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #f3f4f6;text-align:right">৳${Number(item.price) * item.quantity}</td>
      </tr>`).join('');

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
      <div style="background:#1c1917;padding:24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#f97316;margin:0;font-size:32px;font-weight:900">UNKORA</h1>
        <p style="color:#d6d3d1;margin:4px 0 0;font-size:14px">You left something behind!</p>
      </div>
      <div style="padding:32px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <h2 style="color:#1c1917;margin:0 0 8px">Hey ${data.firstName}, your cart misses you 🛒</h2>
        <p style="color:#6b7280;margin:0 0 24px">You left some great items in your cart. They're still waiting for you — but they might sell out soon!</p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase">Item</th>
              <th style="padding:10px 8px;text-align:center;font-size:12px;color:#6b7280;text-transform:uppercase">Qty</th>
              <th style="padding:10px 8px;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:12px 8px;text-align:right;font-weight:700;font-size:15px">Total:</td>
              <td style="padding:12px 8px;text-align:right;font-weight:700;font-size:15px;color:#f97316">৳${data.cartTotal}</td>
            </tr>
          </tfoot>
        </table>

        <div style="text-align:center;margin:28px 0">
          <a href="${data.recoveryUrl}"
             style="background:#f97316;color:#fff;font-weight:700;font-size:16px;padding:14px 40px;border-radius:50px;text-decoration:none;display:inline-block">
            Complete My Order →
          </a>
        </div>

        <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0">
          If you have any questions, reply to this email or visit our <a href="${process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://unkora.shop'}/help" style="color:#f97316">Help Center</a>.
        </p>
      </div>
    </div>`;

    await this.send(to, `${data.firstName}, your cart is waiting for you! 🛒`, html);
  }
}
