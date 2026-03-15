/**
 * Shared application constants — single source of truth.
 */

export const PAGE_SIZE = 10;
export const VAT_RATE = 0.1;

export const STATUS_CONFIG = {
    New: { bg: 'bg-blue-500/20 text-blue-400', label: 'New' },
    Processing: { bg: 'bg-amber-500/20 text-amber-400', label: 'Processing' },
    Done: { bg: 'bg-emerald-500/20 text-emerald-400', label: 'Done' },
    Cancel: { bg: 'bg-red-500/20 text-red-400', label: 'Cancelled' },
};

export const PAYMENT_METHODS = ['COD', 'Cash', 'Transfer', 'Credit'];
export const SHIPPING_UNITS = ['GHN', 'GHTK', 'Ninja Van', 'J&T', 'VNPost'];
