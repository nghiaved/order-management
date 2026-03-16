import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import Allow from '../components/Allow';
import { PERMISSIONS } from '../utils/rbacHelper';
import { ConfirmModal } from '../components/Modal';
import { STATUS_CONFIG, VAT_RATE } from '../constants';
import { fmt, fmtDateTime } from '../utils/format';

export default function OrderDetailPage() {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [details, setDetails] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [productMap, setProductMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [statusTarget, setStatusTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        if (!id) { navigate('/orders'); return; }
        const load = async () => {
            const [o, orderDets, customers, products] = await Promise.all([
                orderService.getById(id),
                orderService.getOrderDetails(id),
                customerService.getAll(),
                productService.getAll(),
            ]);
            setOrder(o);
            setDetails(orderDets);
            setCustomer(customers.find((c) => c.id === o.customer_id) || null);
            const pMap = {};
            products.forEach((p) => (pMap[p.id] = p));
            setProductMap(pMap);
            setLoading(false);
        };
        load().catch(() => setLoading(false));
    }, [id, navigate]);

    const confirmStatusChange = async () => {
        if (!statusTarget) return;
        await orderService.update(statusTarget.order.id, { status: statusTarget.newStatus });
        setOrder((prev) => ({ ...prev, status: statusTarget.newStatus }));
        setStatusTarget(null);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        await orderService.remove(deleteTarget.id);
        navigate('/orders');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <p className="text-gray-500">Loading…</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
                <p className="text-gray-400">Order not found.</p>
                <button onClick={() => navigate('/orders')} className="text-blue-400 hover:underline text-sm">← Back to Orders</button>
            </div>
        );
    }

    const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.New;

    const subtotal = details.reduce((sum, d) => sum + Number(d.unit_price) * Number(d.quantity), 0);
    const vatAmount = order.has_vat ? subtotal * VAT_RATE : 0;
    const amountDue = Number(order.total_amount) - Number(order.prepaid_amount || 0);

    let bankInfo = null;
    if (order.bank_info) {
        try { bankInfo = JSON.parse(order.bank_info); } catch { /* not JSON */ }
    }

    return (
        <div className="space-y-6 max-w-5xl">

            {/* ── Header ───────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <h1 className="text-2xl font-bold text-white">Order Detail</h1>
                <span className="font-mono text-blue-400 text-lg">{order.id}</span>
                <span className={`ml-auto inline-flex px-3 py-1 rounded-full text-sm font-semibold ${statusCfg.bg}`}>
                    {statusCfg.label}
                </span>
            </div>

            {/* ── Action Buttons ───────────────────────────────── */}
            <Allow permission={PERMISSIONS.ORDERS_UPDATE}>
                <div className="flex flex-wrap gap-2">
                    {order.status === 'New' && (
                        <>
                            <button
                                onClick={() => navigate(`/orders/update?id=${order.id}`)}
                                className="px-4 py-1.5 rounded-xl text-sm font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20 transition-colors"
                            >Edit Order</button>
                            <button
                                onClick={() => setStatusTarget({ order, newStatus: 'Processing', title: 'Process Order', message: `Move order "${order.id}" to Processing?`, confirmText: 'Process' })}
                                className="px-4 py-1.5 rounded-xl text-sm font-medium bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/20 transition-colors"
                            >Process</button>
                        </>
                    )}
                    {order.status === 'Processing' && (
                        <button
                            onClick={() => setStatusTarget({ order, newStatus: 'Done', title: 'Complete Order', message: `Mark order "${order.id}" as complete?`, confirmText: 'Complete' })}
                            className="px-4 py-1.5 rounded-xl text-sm font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 transition-colors"
                        >Complete</button>
                    )}
                    {(order.status === 'New' || order.status === 'Processing') && (
                        <button
                            onClick={() => setStatusTarget({ order, newStatus: 'Cancel', title: 'Cancel Order', message: `Cancel order "${order.id}"? This action cannot be undone.`, confirmText: 'Cancel Order', variant: 'danger' })}
                            className="px-4 py-1.5 rounded-xl text-sm font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 transition-colors"
                        >Cancel</button>
                    )}
                </div>
            </Allow>

            {/* ── Info Cards ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Customer */}
                <div className="bg-[#111827] rounded-2xl border border-gray-700/50 p-5 space-y-2">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer</h2>
                    {customer ? (
                        <>
                            <p className="text-white font-semibold">{customer.full_name}</p>
                            <p className="text-sm text-gray-400">{customer.phone}</p>
                            {customer.address && <p className="text-sm text-gray-500">{customer.address}</p>}
                        </>
                    ) : (
                        <p className="text-gray-400 text-sm">{order.customer_id}</p>
                    )}
                </div>

                {/* Shipping */}
                <div className="bg-[#111827] rounded-2xl border border-gray-700/50 p-5">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Shipping</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Shipping Unit</dt>
                            <dd className="text-gray-300">{order.shipping_unit || '—'}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Delivery Date</dt>
                            <dd className="text-gray-300">{order.delivery_date || '—'}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Created At</dt>
                            <dd className="text-gray-300 text-xs">
                                {fmtDateTime(order.created_at)}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Payment */}
                <div className="bg-[#111827] rounded-2xl border border-gray-700/50 p-5">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Method</dt>
                            <dd className="text-gray-300 font-medium">{order.payment_method}</dd>
                        </div>
                        {order.payment_method === 'Credit' && (
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Debt Days</dt>
                                <dd className="text-gray-300">{order.debt_days} days</dd>
                            </div>
                        )}
                        {order.payment_method === 'Transfer' && bankInfo && (
                            <>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Bank</dt>
                                    <dd className="text-gray-300">{bankInfo.bank_name}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Account</dt>
                                    <dd className="text-gray-300 font-mono text-xs">{bankInfo.account_number}</dd>
                                </div>
                            </>
                        )}
                        <div className="flex justify-between">
                            <dt className="text-gray-500">VAT</dt>
                            <dd className={order.has_vat ? 'text-emerald-400' : 'text-gray-500'}>
                                {order.has_vat ? 'Included (10%)' : 'None'}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* ── Order Items ─────────────────────────────────── */}
            <div className="bg-[#111827] rounded-2xl border border-gray-700/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-700/50">
                    <h2 className="text-sm font-semibold text-gray-300">
                        Order Items
                        <span className="ml-2 text-xs text-gray-500 font-normal">({details.length} item{details.length !== 1 && 's'})</span>
                    </h2>
                </div>
                {details.length === 0 ? (
                    <p className="text-gray-500 text-sm px-5 py-8 text-center">No items in this order.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#1a2035] text-xs text-gray-500 uppercase tracking-wider">
                                <th className="text-left px-5 py-3">Product</th>
                                <th className="text-left px-5 py-3">SKU</th>
                                <th className="text-right px-5 py-3">Unit Price</th>
                                <th className="text-right px-5 py-3">Qty</th>
                                <th className="text-right px-5 py-3">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {details.map((d) => {
                                const prod = productMap[d.product_id];
                                return (
                                    <tr key={d.id} className="border-t border-gray-800/50 hover:bg-white/[0.015] transition-colors">
                                        <td className="px-5 py-3.5 text-gray-200">{prod?.name || `Product #${d.product_id}`}</td>
                                        <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">{prod?.sku || '—'}</td>
                                        <td className="px-5 py-3.5 text-right text-gray-400">{fmt(d.unit_price)} đ</td>
                                        <td className="px-5 py-3.5 text-right text-gray-400">{d.quantity}</td>
                                        <td className="px-5 py-3.5 text-right text-white font-medium">
                                            {fmt(Number(d.unit_price) * Number(d.quantity))} đ
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Summary & Note ───────────────────────────────── */}
            <div className="flex flex-wrap gap-4 items-start justify-between">
                {/* Note */}
                {order.note ? (
                    <div className="bg-[#111827] rounded-2xl border border-gray-700/50 p-5 flex-1 min-w-48">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Note</h2>
                        <p className="text-gray-300 text-sm leading-relaxed">{order.note}</p>
                    </div>
                ) : <div />}

                {/* Totals */}
                <div className="bg-[#111827] rounded-2xl border border-gray-700/50 p-5 w-72 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                        <span>Subtotal</span>
                        <span>{fmt(subtotal)} đ</span>
                    </div>
                    {order.has_vat && (
                        <div className="flex justify-between text-emerald-400">
                            <span>VAT (10%)</span>
                            <span>+{fmt(vatAmount)} đ</span>
                        </div>
                    )}
                    <div className="flex justify-between text-gray-400">
                        <span>Shipping Fee</span>
                        <span>+{fmt(order.shipping_fee || 0)} đ</span>
                    </div>
                    <hr className="border-gray-700/50" />
                    <div className="flex justify-between text-white font-semibold text-base">
                        <span>Total</span>
                        <span>{fmt(order.total_amount)} đ</span>
                    </div>
                    {Number(order.prepaid_amount) > 0 && (
                        <>
                            <div className="flex justify-between text-blue-400">
                                <span>Prepaid</span>
                                <span>−{fmt(order.prepaid_amount)} đ</span>
                            </div>
                            <div className="flex justify-between text-orange-400 font-semibold">
                                <span>Amount Due</span>
                                <span>{fmt(amountDue)} đ</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Delete ───────────────────────────────────────── */}
            <Allow permission={PERMISSIONS.ORDERS_DELETE}>
                <div className="pt-2 border-t border-gray-800/60">
                    <button
                        onClick={() => setDeleteTarget(order)}
                        className="px-4 py-1.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                    >
                        Delete Order
                    </button>
                </div>
            </Allow>

            {/* ── Status Confirm ───────────────────────────────── */}
            <ConfirmModal
                open={!!statusTarget}
                onClose={() => setStatusTarget(null)}
                onConfirm={confirmStatusChange}
                title={statusTarget?.title || ''}
                message={statusTarget?.message || ''}
                confirmText={statusTarget?.confirmText || 'Confirm'}
                variant={statusTarget?.variant || 'confirm'}
            />

            {/* ── Delete Confirm ───────────────────────────────── */}
            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete Order"
                message={`Are you sure you want to permanently delete order "${deleteTarget?.id}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
