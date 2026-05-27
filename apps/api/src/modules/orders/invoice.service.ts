import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInvoiceHtml(orderId: string): Promise<string> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
        payment: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const shippingAddr = order.shippingAddress as any;
    const rows = order.items.map(item => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.productName}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">৳${Number(item.unitPrice).toLocaleString()}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">৳${Number(item.totalPrice).toLocaleString()}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice #${order.orderNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; background: #fff; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .logo { font-size: 28px; font-weight: 800; color: #f97316; }
  .invoice-info h2 { font-size: 22px; color: #111; }
  .invoice-info p { color: #666; font-size: 14px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; background: #dcfce7; color: #16a34a; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
  .section h3 { font-size: 13px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 10px; }
  .section p { font-size: 14px; color: #333; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #f97316; color: white; }
  thead th { padding: 10px 8px; text-align: left; font-size: 13px; }
  thead th:nth-child(2) { text-align: center; }
  thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
  .totals { margin-left: auto; width: 280px; }
  .totals table td { padding: 6px 8px; font-size: 14px; }
  .totals table tr:last-child td { font-weight: 700; font-size: 16px; border-top: 2px solid #333; }
  .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">Unkora</div>
    <p style="color:#666;font-size:13px;margin-top:4px">Your Trusted Online Shop</p>
  </div>
  <div class="invoice-info" style="text-align:right">
    <h2>INVOICE</h2>
    <p>#${order.orderNumber}</p>
    <p style="margin-top:4px">${new Date(order.createdAt).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <div style="margin-top:8px"><span class="badge">${order.paymentStatus}</span></div>
  </div>
</div>

<div class="grid">
  <div class="section">
    <h3>Bill To</h3>
    <p><strong>${order.user.firstName ?? ''} ${order.user.lastName ?? ''}</strong></p>
    <p>${order.user.email}</p>
    <p>${order.user.phone ?? ''}</p>
  </div>
  <div class="section">
    <h3>Ship To</h3>
    <p>${shippingAddr?.addressLine1 ?? shippingAddr?.address ?? ''}</p>
    <p>${shippingAddr?.city ?? ''}, ${shippingAddr?.district ?? shippingAddr?.state ?? ''}</p>
    <p>${shippingAddr?.country ?? 'Bangladesh'}</p>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Item</th>
      <th>Qty</th>
      <th>Unit Price</th>
      <th>Total</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>

<div class="totals">
  <table>
    <tr><td style="color:#666">Subtotal</td><td style="text-align:right">৳${Number(order.subtotal).toLocaleString()}</td></tr>
    <tr><td style="color:#666">Shipping</td><td style="text-align:right">৳${Number(order.shippingCost).toLocaleString()}</td></tr>
    ${Number(order.discount) > 0 ? `<tr><td style="color:#16a34a">Discount</td><td style="text-align:right;color:#16a34a">-৳${Number(order.discount).toLocaleString()}</td></tr>` : ''}
    <tr><td>Total</td><td style="text-align:right">৳${Number(order.total).toLocaleString()}</td></tr>
  </table>
</div>

<div style="margin-top:30px;padding:16px;background:#fff7ed;border-radius:8px;border:1px solid #fed7aa">
  <p style="font-size:13px;color:#9a3412"><strong>Payment Method:</strong> ${order.paymentMethod} &nbsp;|&nbsp; <strong>Status:</strong> ${order.paymentStatus}</p>
  ${order.notes ? `<p style="font-size:13px;color:#9a3412;margin-top:4px"><strong>Note:</strong> ${order.notes}</p>` : ''}
</div>

<div class="footer">
  <p>Thank you for shopping with Unkora!</p>
  <p style="margin-top:4px">For support: support@unkora.com | +880-XXXX-XXXX</p>
</div>
</body>
</html>`;
  }
}
