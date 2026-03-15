/**
 * Shared formatting utilities — eliminates duplicated fmt() across components.
 */

export const fmt = (v) => Number(v).toLocaleString('vi-VN');

export const fmtCurrency = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export const fmtDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : '—';

export const fmtDateTime = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleString('vi-VN') : '—';
