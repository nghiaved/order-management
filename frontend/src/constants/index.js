/**
 * Shared application constants — single source of truth.
 */

export const PAGE_SIZE = 10;
export const VAT_RATE = 0.1;

export const STATUS_CONFIG = {
    New: { bg: 'bg-blue-500/20 text-blue-400', label: 'Mới' },
    Processing: { bg: 'bg-amber-500/20 text-amber-400', label: 'Đang giao hàng' },
    Done: { bg: 'bg-emerald-500/20 text-emerald-400', label: 'Đã giao' },
    Cancel: { bg: 'bg-red-500/20 text-red-400', label: 'Đã hủy' },
};

export const PAYMENT_METHODS = ['Thanh toán khi nhận hàng', 'Tiền mặt', 'Chuyển khoản', 'Công nợ'];
export const SHIPPING_UNITS = ['GHN', 'GHTK', 'Ninja Van', 'J&T', 'VNPost'];

/** Derived from STATUS_CONFIG — single source of truth for status labels. */
export const STATUS_LABEL = Object.fromEntries(
    Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])
);

/** Hex colours for Recharts charts — co-located with STATUS_CONFIG. */
export const STATUS_COLORS = {
    New: '#3b82f6',
    Processing: '#f59e0b',
    Done: '#22c55e',
    Cancel: '#ef4444',
};

/** Inline CSS badge strings for non-Tailwind contexts (e.g. printInvoice popup). */
export const STATUS_BADGE_INLINE = {
    New: 'background:#dbeafe;color:#1d4ed8',
    Processing: 'background:#fef3c7;color:#b45309',
    Done: 'background:#dcfce7;color:#166534',
    Cancel: 'background:#fee2e2;color:#991b1b',
};

/** Map English payment method keys stored in DB to Vietnamese display labels */
export const PAYMENT_LABEL = {
    COD: 'Thanh toán khi nhận hàng',
    Cash: 'Tiền mặt',
    Transfer: 'Chuyển khoản',
    Credit: 'Công nợ',
    'Tiền mặt': 'Tiền mặt',
    'Chuyển khoản': 'Chuyển khoản',
    'Công nợ': 'Công nợ',
};
