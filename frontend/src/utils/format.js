/**
 * Shared formatting utilities — eliminates duplicated fmt() across components.
 */

export const fmt = (v) => Number(v).toLocaleString('vi-VN');

export const fmtVND = (v) => `${fmt(v)} VNĐ`;

export const fmtCurrency = (n) => `${fmt(n)} VNĐ`;

export const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export const fmtDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${date} ${time}`;
};

/** YYYY-MM key used for monthly grouping in charts. */
export const fmtMonth = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
