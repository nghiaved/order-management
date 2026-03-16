import { fmt } from './format';

const STATUS_BADGE = {
    New: 'background:#dbeafe;color:#1d4ed8',
    Processing: 'background:#fef3c7;color:#b45309',
    Done: 'background:#dcfce7;color:#166534',
    Cancel: 'background:#fee2e2;color:#991b1b',
};

const STATUS_LABEL = {
    New: 'Mới',
    Processing: 'Đang xử lý',
    Done: 'Hoàn thành',
    Cancel: 'Đã hủy',
};

const PAYMENT_LABEL_MAP = {
    COD: 'Thanh toán khi nhận hàng',
    Cash: 'Tiền mặt',
    'Tiền mặt': 'Tiền mặt',
    Transfer: 'Chuyển khoản',
    'Chuyển khoản': 'Chuyển khoản',
    Credit: 'Công nợ',
    'Công nợ': 'Công nợ',
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
                <td>${prod?.name || `SP #${d.product_id}`}</td>
                <td style="color:#6b7280">${prod?.sku || '—'}</td>
                <td style="text-align:right">${fmt(d.unit_price)} VNĐ</td>
                <td style="text-align:center">${d.quantity}</td>
                <td style="text-align:right;font-weight:600">${fmt(Number(d.unit_price) * Number(d.quantity))} VNĐ</td>
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
    <div><div class="brand">HÓA ĐƠN BÁN HÀNG</div><div class="brand-sub">In ngày: ${new Date().toLocaleString('vi-VN')}</div></div>
    <div><div class="invoice-id">${order.id}</div><span class="badge" style="${badgeStyle}">${STATUS_LABEL[order.status] || order.status}</span></div>
  </div>
  <div class="grid3">
    <div class="card">
      <div class="card-title">Khách hàng</div>
      <p><strong>${customer?.full_name || order.customer_id}</strong></p>
      ${customer?.phone ? `<p>${customer.phone}</p>` : ''}
      ${customer?.address ? `<p style="color:#6b7280">${customer.address}</p>` : ''}
    </div>
    <div class="card">
      <div class="card-title">Vận chuyển</div>
      <p>Đơn vị: <strong>${order.shipping_unit || '—'}</strong></p>
      <p>Ngày giao: ${order.delivery_date || '—'}</p>
      <p>Ngày tạo: ${order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN') : '—'}</p>
    </div>
    <div class="card">
      <div class="card-title">Thanh toán</div>
      <p>Phương thức: <strong>${PAYMENT_LABEL_MAP[order.payment_method] || order.payment_method}</strong></p>
      <p>VAT: ${order.has_vat ? 'Có (10%)' : 'Không'}</p>
      ${Number(order.prepaid_amount) > 0 ? `<p>Trả trước: ${fmt(order.prepaid_amount)} VNĐ</p>` : ''}
    </div>
  </div>
  <table>
    <thead><tr>
      <th>Sản phẩm</th><th>SKU</th>
      <th style="text-align:right">Đơn giá</th>
      <th style="text-align:center">SL</th>
      <th style="text-align:right">Thành tiền</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  ${order.note ? `<div class="note-box"><strong>Ghi chú:</strong> ${order.note}</div>` : ''}
  <div class="totals">
    <table>
      <tr><td>Tạm tính</td><td style="text-align:right">${fmt(subtotal)} VNĐ</td></tr>
      ${order.has_vat ? `<tr><td>VAT (10%)</td><td style="text-align:right">+${fmt(vatAmt)} VNĐ</td></tr>` : ''}
      <tr><td>Phí vận chuyển</td><td style="text-align:right">+${fmt(Number(order.shipping_fee || 0))} VNĐ</td></tr>
      <tr class="grand"><td>Tổng cộng</td><td style="text-align:right">${fmt(Number(order.total_amount))} VNĐ</td></tr>
      ${Number(order.prepaid_amount) > 0 ? `
      <tr><td style="color:#3b82f6">Trả trước</td><td style="text-align:right;color:#3b82f6">−${fmt(Number(order.prepaid_amount))} VNĐ</td></tr>
      <tr><td style="color:#f97316;font-weight:600">Còn lại</td><td style="text-align:right;color:#f97316;font-weight:600">${fmt(amountDue)} VNĐ</td></tr>` : ''}
    </table>
  </div>
  <div class="footer">Cảm ơn quý khách · Quản lý đơn hàng</div>
</body></html>`;

    const win = window.open('', '_blank', 'width=920,height=720');
    if (!win) { alert('Vui lòng cho phép popup để in hóa đơn.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 450);
}
