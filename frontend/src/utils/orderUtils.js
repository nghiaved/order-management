/**
 * Pure order-domain helpers — no side-effects, no imports from services or components.
 * Centralises logic that was duplicated across OrderList, PaymentHistory, OrderDetailPage, OrderForm.
 */

import { VAT_RATE } from '../constants';

/**
 * Sum of (unit_price × quantity) for all detail lines.
 * @param {Array<{unit_price: number|string, quantity: number|string}>} details
 * @returns {number}
 */
export function calcSubtotal(details) {
    return details.reduce((s, d) => s + Number(d.unit_price) * Number(d.quantity), 0);
}

/**
 * Full order total: subtotal + optional VAT + shipping.
 * @param {Array} details
 * @param {{ has_vat: boolean, shipping_fee: number|string }} order
 * @returns {number}
 */
export function calcOrderTotal(details, order) {
    const subtotal = calcSubtotal(details);
    const vat = order.has_vat ? subtotal * VAT_RATE : 0;
    return subtotal + vat + Number(order.shipping_fee || 0);
}

/**
 * Derive payment status from amounts.
 * @param {number|string} paid  — sum of all payment_history.amount_paid
 * @param {number|string} total — order.total_amount
 * @returns {'paid' | 'partial' | 'unpaid'}
 */
export function getPaymentStatus(paid, total) {
    const p = Number(paid);
    const t = Number(total);
    if (p <= 0) return 'unpaid';
    if (t > 0 && p >= t) return 'paid';
    return 'partial';
}

/**
 * Sum all payment_history records for an order.
 * @param {Array<{amount_paid: number|string}>} payments
 * @returns {number}
 */
export function sumPayments(payments) {
    return payments.reduce((s, p) => s + Number(p.amount_paid), 0);
}
