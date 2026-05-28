import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInvoicePdf(orderId: string): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: { include: { product: true } }, payment: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const addr = order.shippingAddress as any;
    const orange = '#f97316';
    const gray = '#666666';

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header ──────────────────────────────────────────────
      doc.fontSize(28).fillColor(orange).text('UNKORA', 50, 50, { continued: false });
      doc.fontSize(10).fillColor(gray).text("Bangladesh's Book & Lifestyle Store", 50, 85);

      doc.fontSize(20).fillColor('#111111').text('INVOICE', 400, 50, { align: 'right' });
      doc.fontSize(11).fillColor(gray)
        .text(`#${order.orderNumber}`, 400, 78, { align: 'right' })
        .text(new Date(order.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }), 400, 93, { align: 'right' })
        .text(`Status: ${order.paymentStatus}`, 400, 108, { align: 'right' });

      doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#dddddd').lineWidth(1).stroke();

      // ── Bill To / Ship To ────────────────────────────────────
      doc.fontSize(9).fillColor(gray).text('BILL TO', 50, 145);
      doc.fontSize(11).fillColor('#333333')
        .text(`${order.user.firstName ?? ''} ${order.user.lastName ?? ''}`.trim() || order.user.email, 50, 158)
        .text(order.user.email, 50, 172)
        .text(order.user.phone ?? '', 50, 186);

      doc.fontSize(9).fillColor(gray).text('SHIP TO', 300, 145);
      doc.fontSize(11).fillColor('#333333')
        .text(addr?.addressLine1 ?? addr?.address ?? '', 300, 158)
        .text(`${addr?.city ?? ''}, ${addr?.district ?? addr?.state ?? ''}`.replace(/^,\s*/, ''), 300, 172)
        .text(addr?.country ?? 'Bangladesh', 300, 186);

      // ── Items Table ──────────────────────────────────────────
      let y = 220;
      doc.rect(50, y, 495, 20).fill(orange);
      doc.fontSize(10).fillColor('#ffffff')
        .text('Item', 55, y + 5)
        .text('Qty', 370, y + 5, { width: 40, align: 'center' })
        .text('Unit Price', 410, y + 5, { width: 70, align: 'right' })
        .text('Total', 480, y + 5, { width: 65, align: 'right' });
      y += 22;

      order.items.forEach((item, idx) => {
        if (idx % 2 === 0) doc.rect(50, y, 495, 20).fill('#fafafa');
        doc.fontSize(10).fillColor('#333333')
          .text(item.productName.slice(0, 48), 55, y + 4)
          .text(String(item.quantity), 370, y + 4, { width: 40, align: 'center' })
          .text(`BDT ${Number(item.unitPrice).toLocaleString()}`, 410, y + 4, { width: 70, align: 'right' })
          .text(`BDT ${Number(item.totalPrice).toLocaleString()}`, 480, y + 4, { width: 65, align: 'right' });
        y += 22;
      });

      doc.moveTo(50, y).lineTo(545, y).strokeColor('#dddddd').lineWidth(0.5).stroke();
      y += 10;

      // ── Totals ───────────────────────────────────────────────
      const totals: Array<[string, number, string?]> = [
        ['Subtotal', Number(order.subtotal)],
        ['Shipping', Number(order.shippingCost)],
      ];
      if (Number(order.discount) > 0) totals.push(['Discount', -Number(order.discount), '#16a34a']);

      totals.forEach(([label, val, color]) => {
        doc.fontSize(11).fillColor(color ?? gray)
          .text(label, 380, y)
          .text(`BDT ${Math.abs(val).toLocaleString()}`, 480, y, { width: 65, align: 'right' });
        y += 18;
      });

      doc.moveTo(380, y).lineTo(545, y).strokeColor('#333333').lineWidth(1).stroke();
      y += 6;
      doc.fontSize(13).fillColor('#111111').font('Helvetica-Bold')
        .text('Total', 380, y)
        .text(`BDT ${Number(order.total).toLocaleString()}`, 480, y, { width: 65, align: 'right' });

      y += 30;
      doc.font('Helvetica').fontSize(10).fillColor(gray)
        .text(`Payment Method: ${order.paymentMethod}`, 50, y);

      // ── Footer — positioned dynamically below content ────────
      const footerY = Math.max(y + 40, doc.page.height - 60);
      doc.fontSize(9).fillColor('#999999')
        .text('Thank you for shopping with UNKORA!', 50, footerY, { align: 'center', width: 495 })
        .text('unkora.com  |  support@unkora.com  |  +880-XXXX-XXXX', 50, footerY + 13, { align: 'center', width: 495 });

      doc.end();
    });
  }

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
