import { fmt } from './format';

const STATUS_BADGE = {
    New: 'background:#dbeafe;color:#1d4ed8',
    Processing: 'background:#fef3c7;color:#b45309',
    Done: 'background:#dcfce7;color:#166534',
    Cancel: 'background:#fee2e2;color:#991b1b',
};

/**
 * Opens a new browser window with a clean print-friendly invoice and triggers window.print().
 * No external dependencies — pure HTML/CSS rendered into a popup window.
 */
export function printInvoice({ order, details, customer, productMap }) {
    const subtotal = details.reduce((s, d) => s + Number(d.unit_price) * Number(d.quantity), 0);
    const vatAmt = order.has_vat ? subtotal * 0.1 : 0;
    const amountDue = Number(order.total_amount) - Number(order.prepaid_amount || 0);

    const rows = details
        .map((d) => {
            const prod = productMap[d.product_id];
            return `
            <tr>
                <td>${prod?.name || `Product #${d.product_id}`}</td>
                <td style="color:#6b7280">${prod?.sku || '—'}</td>
                <td style="text-align:right">${fmt(d.unit_price)} đ</td>
                <td style="text-align:center">${d.quantity}</td>
                <td style="text-align:right;font-weight:600">${fmt(Number(d.unit_price) * Number(d.quantity))} đ</td>
            </tr>`;
        })
        .join('');

    const badgeStyle = STATUS_BADGE[order.status] || 'background:#f3f4f6;color:#374151';

    const html = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"/><title>Invoice — ${order.id}</title><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:13px;color:#111827;padding:36px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #e5e7eb}
  .brand{font-size:22px;font-weight:700;color:#111827}
  .brand-sub{font-size:11px;color:#9ca3af;margin-top:3px}
  .invoice-id{font-size:18px;font-weight:700;color:#1d4ed8;text-align:right}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin-top:6px}
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px}
  .card{border:1px solid #e5e7eb;border-radius:8px;padding:14px}
  .card-title{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;font-weight:600;margin-bottom:8px}
  .card p{margin:3px 0;color:#374151;font-size:12px}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}
  thead tr{background:#f9fafb}
  th{text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb}
  td{padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151}
  .totals{width:280px;margin-left:auto}
  .totals table{margin:0}
  .totals td{padding:5px 4px;border:none}
  .grand td{border-top:2px solid #111827;padding-top:8px;font-weight:700;font-size:15px}
  .note-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin-bottom:20px;font-size:12px;color:#374151}
  .footer{margin-top:32px;padding-top:14px;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:11px}
  @media print{body{padding:18px}}
</style></head>
<body>
  <div class="header">
    <div><div class="brand">OMS — Order Management</div><div class="brand-sub">Printed: ${new Date().toLocaleString('vi-VN')}</div></div>
    <div><div class="invoice-id">${order.id}</div><span class="badge" style="${badgeStyle}">${order.status}</span></div>
  </div>
  <div class="grid3">
    <div class="card">
      <div class="card-title">Customer</div>
      <p><strong>${customer?.full_name || order.customer_id}</strong></p>
      ${customer?.phone ? `<p>${customer.phone}</p>` : ''}
      ${customer?.address ? `<p style="color:#6b7280">${customer.address}</p>` : ''}
    </div>
    <div class="card">
      <div class="card-title">Shipping</div>
      <p>Carrier: <strong>${order.shipping_unit || '—'}</strong></p>
      <p>Delivery: ${order.delivery_date || '—'}</p>
      <p>Created: ${order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN') : '—'}</p>
    </div>
    <div class="card">
      <div class="card-title">Payment</div>
      <p>Method: <strong>${order.payment_method}</strong></p>
      <p>VAT: ${order.has_vat ? 'Included (10%)' : 'None'}</p>
      ${Number(order.prepaid_amount) > 0 ? `<p>Prepaid: ${fmt(order.prepaid_amount)} đ</p>` : ''}
    </div>
  </div>
  <table>
    <thead><tr>
      <th>Product</th><th>SKU</th>
      <th style="text-align:right">Unit Price</th>
      <th style="text-align:center">Qty</th>
      <th style="text-align:right">Subtotal</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  ${order.note ? `<div class="note-box"><strong>Note:</strong> ${order.note}</div>` : ''}
  <div class="totals">
    <table>
      <tr><td>Subtotal</td><td style="text-align:right">${fmt(subtotal)} đ</td></tr>
      ${order.has_vat ? `<tr><td>VAT (10%)</td><td style="text-align:right">+${fmt(vatAmt)} đ</td></tr>` : ''}
      <tr><td>Shipping Fee</td><td style="text-align:right">+${fmt(Number(order.shipping_fee || 0))} đ</td></tr>
      <tr class="grand"><td>Total</td><td style="text-align:right">${fmt(Number(order.total_amount))} đ</td></tr>
      ${Number(order.prepaid_amount) > 0 ? `
      <tr><td style="color:#3b82f6">Prepaid</td><td style="text-align:right;color:#3b82f6">−${fmt(Number(order.prepaid_amount))} đ</td></tr>
      <tr><td style="color:#f97316;font-weight:600">Amount Due</td><td style="text-align:right;color:#f97316;font-weight:600">${fmt(amountDue)} đ</td></tr>` : ''}
    </table>
  </div>
  <div class="footer">Thank you for your business · OMS Dashboard</div>
</body></html>`;

    const win = window.open('', '_blank', 'width=920,height=720');
    if (!win) { alert('Please allow popups to print the invoice.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 450);
}
