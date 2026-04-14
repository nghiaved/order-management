/**
 * Shared application constants — single source of truth.
 */

export const PAGE_SIZE = 10;
export const VAT_RATE = 0.1;

export const STATUS_CONFIG = {
    New: { bg: 'bg-blue-500/20 text-blue-400', label: 'Mới' },
    Processing: { bg: 'bg-amber-500/20 text-amber-400', label: 'Đang xử lý' },
    Done: { bg: 'bg-emerald-500/20 text-emerald-400', label: 'Đã giao' },
    Cancel: { bg: 'bg-red-500/20 text-red-400', label: 'Đã hủy' },
};

export const PAYMENT_METHODS = ['Thanh toán khi nhận hàng', 'Tiền mặt', 'Chuyển khoản', 'Công nợ'];
export const SHIPPING_UNITS = ['GHN', 'GHTK', 'Ninja Van', 'J&T', 'VNPost'];

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
