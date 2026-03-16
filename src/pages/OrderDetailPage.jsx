import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderService } from '../services/orderService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { useInventorySync } from '../hooks/useInventorySync';
import Allow from '../components/Allow';
import { PERMISSIONS } from '../utils/rbacHelper';
import { ConfirmModal } from '../components/Modal';
import CancelReasonModal from '../components/CancelReasonModal';
import { STATUS_CONFIG, VAT_RATE, PAYMENT_LABEL } from '../constants';
import { fmt, fmtDateTime } from '../utils/format';
import { printInvoice } from '../utils/printInvoice';

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
    const [cancelTarget, setCancelTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const { restoreOrderInventory } = useInventorySync();

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
        try {
            await orderService.update(statusTarget.order.id, { status: statusTarget.newStatus });
            setOrder((prev) => ({ ...prev, status: statusTarget.newStatus }));
            toast.success(`Đơn hàng đã chuyển sang ${statusTarget.newStatus === 'Processing' ? 'Đang xử lý' : 'Hoàn thành'}.`);
        } catch (err) {
            toast.error(err.message || 'Không thể cập nhật trạng thái.');
        } finally {
            setStatusTarget(null);
        }
    };

    const handleCancelConfirm = async (reason) => {
        if (!cancelTarget) return;
        try {
            await restoreOrderInventory(cancelTarget.id);
            await orderService.update(cancelTarget.id, {
                status: 'Cancel',
                ...(reason && { cancel_reason: reason }),
            });
            setOrder((prev) => ({ ...prev, status: 'Cancel' }));
            toast.success('Đơn hàng đã hủy. Tồn kho đã hoàn trả.');
        } catch (err) {
            toast.error(err.message || 'Không thể hủy đơn hàng.');
        } finally {
            setCancelTarget(null);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            if (deleteTarget.status !== 'Cancel') {
                await restoreOrderInventory(deleteTarget.id);
            }
            await orderService.deleteOrderDetails(deleteTarget.id);
            await orderService.remove(deleteTarget.id);
            toast.success('Đã xóa đơn hàng.');
            navigate('/orders');
        } catch (err) {
            toast.error(err.message || 'Không thể xóa đơn hàng.');
            setDeleteTarget(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-5xl animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-14 bg-[#111827] rounded border border-gray-700/50" />
                    <div className="h-8 w-40 bg-[#111827] rounded-xl border border-gray-700/50" />
                    <div className="h-7 w-32 bg-[#111827] rounded-xl border border-gray-700/50" />
                    <div className="ml-auto h-7 w-20 bg-[#111827] rounded-full border border-gray-700/50" />
                </div>
                <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-9 w-24 bg-[#111827] rounded-xl border border-gray-700/50" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-[#111827] rounded-2xl border border-gray-700/50" />)}
                </div>
                <div className="h-48 bg-[#111827] rounded-2xl border border-gray-700/50" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
                <p className="text-gray-400">Không tìm thấy đơn hàng.</p>
                <button onClick={() => navigate('/orders')} className="text-blue-400 hover:underline text-sm">← Quay lại đơn hàng</button>
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
                    Quay lại
                </button>
                <h1 className="text-2xl font-bold text-white">Chi tiết đơn hàng</h1>
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
                            >Sửa đơn</button>
                            <button
                                onClick={() => setStatusTarget({ order, newStatus: 'Processing', title: 'Xử lý đơn', message: `Chuyển đơn "${order.id}" sang Đang xử lý?`, confirmText: 'Xử lý' })}
                                className="px-4 py-1.5 rounded-xl text-sm font-medium bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/20 transition-colors"
                            >Xử lý</button>
                        </>
                    )}
                    {order.status === 'Processing' && (
                        <button
                            onClick={() => setStatusTarget({ order, newStatus: 'Done', title: 'Hoàn thành đơn', message: `Đánh dấu đơn "${order.id}" là Hoàn thành?`, confirmText: 'Hoàn thành' })}
                            className="px-4 py-1.5 rounded-xl text-sm font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 transition-colors"
                        >Hoàn thành</button>
                    )}
                    {(order.status === 'New' || order.status === 'Processing') && (
                        <button
                            onClick={() => setCancelTarget(order)}
                            className="px-4 py-1.5 rounded-xl text-sm font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 transition-colors"
                        >Hủy</button>
                    )}
                    <button
                        onClick={() => printInvoice({ order, details, customer, productMap })}
                        className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600/30 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        In hóa đơn
                    </button>
                </div>
            </Allow>

            {/* ── Info Cards ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Customer */}
                <div className="bg-[#111827] rounded-2xl border border-gray-700/50 p-5 space-y-2">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Khách hàng</h2>
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
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vận chuyển</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Đơn vị vận chuyển</dt>
                            <dd className="text-gray-300">{order.shipping_unit || '—'}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Ngày giao hàng</dt>
                            <dd className="text-gray-300">{order.delivery_date || '—'}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Ngày tạo</dt>
                            <dd className="text-gray-300 text-xs">
                                {fmtDateTime(order.created_at)}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Payment */}
                <div className="bg-[#111827] rounded-2xl border border-gray-700/50 p-5">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Thanh toán</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Phương thức</dt>
                            <dd className="text-gray-300 font-medium">{PAYMENT_LABEL[order.payment_method] || order.payment_method}</dd>
                        </div>
                        {(order.payment_method === 'Credit' || order.payment_method === 'Công nợ') && (
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Số ngày nợ</dt>
                                <dd className="text-gray-300">{order.debt_days} ngày</dd>
                            </div>
                        )}
                        {(order.payment_method === 'Transfer' || order.payment_method === 'Chuyển khoản') && bankInfo && (
                            <>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Ngân hàng</dt>
                                    <dd className="text-gray-300">{bankInfo.bank_name}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Số tài khoản</dt>
                                    <dd className="text-gray-300 font-mono text-xs">{bankInfo.account_number}</dd>
                                </div>
                            </>
                        )}
                        <div className="flex justify-between">
                            <dt className="text-gray-500">VAT</dt>
                            <dd className={order.has_vat ? 'text-emerald-400' : 'text-gray-500'}>
                                {order.has_vat ? 'Có (10%)' : 'Không'}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* ── Order Items ─────────────────────────────────── */}
            <div className="bg-[#111827] rounded-2xl border border-gray-700/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-700/50">
                    <h2 className="text-sm font-semibold text-gray-300">
                        Sản phẩm
                        <span className="ml-2 text-xs text-gray-500 font-normal">({details.length} dòng)</span>
                    </h2>
                </div>
                {details.length === 0 ? (
                    <p className="text-gray-500 text-sm px-5 py-8 text-center">Không có sản phẩm nào.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#1a2035] text-xs text-gray-500 uppercase tracking-wider">
                                <th className="text-left px-5 py-3">Sản phẩm</th>
                                <th className="text-left px-5 py-3">SKU</th>
                                <th className="text-right px-5 py-3">Đơn giá</th>
                                <th className="text-right px-5 py-3">SL</th>
                                <th className="text-right px-5 py-3">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {details.map((d) => {
                                const prod = productMap[d.product_id];
                                return (
                                    <tr key={d.id} className="border-t border-gray-800/50 hover:bg-white/[0.015] transition-colors">
                                        <td className="px-5 py-3.5 text-gray-200">{prod?.name || `Product #${d.product_id}`}</td>
                                        <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">{prod?.sku || '—'}</td>
                                        <td className="px-5 py-3.5 text-right text-gray-400">{fmt(d.unit_price)} VNĐ</td>
                                        <td className="px-5 py-3.5 text-right text-gray-400">{d.quantity}</td>
                                        <td className="px-5 py-3.5 text-right text-white font-medium">
                                            {fmt(Number(d.unit_price) * Number(d.quantity))} VNĐ
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
                <div className="flex flex-col gap-4 w-full lg:w-auto flex-1">
                    {/* Note */}
                    {order.note ? (
                        <div className="bg-[#111827] rounded-2xl border border-gray-700/50 p-5 flex-1 min-w-48">
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ghi chú</h2>
                            <p className="text-gray-300 text-sm leading-relaxed">{order.note}</p>
                        </div>
                    ) : <div />}
                    {/* Cancel Reason */}
                    {order.cancel_reason ? (
                        <div className="bg-[#111827] rounded-2xl border border-gray-700/50 p-5 flex-1 min-w-48">
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Lý do hủy</h2>
                            <p className="text-gray-300 text-sm leading-relaxed">{order.cancel_reason}</p>
                        </div>
                    ) : <div />}
                </div>

                {/* Totals */}
                <div className="bg-[#111827] rounded-2xl border border-gray-700/50 p-5 w-72 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                        <span>Tạm tính</span>
                        <span>{fmt(subtotal)} VNĐ</span>
                    </div>
                    {order.has_vat && (
                        <div className="flex justify-between text-emerald-400">
                            <span>VAT (10%)</span>
                            <span>+{fmt(vatAmount)} VNĐ</span>
                        </div>
                    )}
                    <div className="flex justify-between text-gray-400">
                        <span>Phí vận chuyển</span>
                        <span>+{fmt(order.shipping_fee || 0)} VNĐ</span>
                    </div>
                    <hr className="border-gray-700/50" />
                    <div className="flex justify-between text-white font-semibold text-base">
                        <span>Tổng cộng</span>
                        <span>{fmt(order.total_amount)} VNĐ</span>
                    </div>
                    {Number(order.prepaid_amount) > 0 && (
                        <>
                            <div className="flex justify-between text-blue-400">
                                <span>Trả trước</span>
                                <span>−{fmt(order.prepaid_amount)} VNĐ</span>
                            </div>
                            <div className="flex justify-between text-orange-400 font-semibold">
                                <span>Còn lại</span>
                                <span>{fmt(amountDue)} VNĐ</span>
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
                        Xoá đơn hàng
                    </button>
                </div>
            </Allow>

            {/* ── Status Confirm (Process / Complete) ── */}
            <ConfirmModal
                open={!!statusTarget}
                onClose={() => setStatusTarget(null)}
                onConfirm={confirmStatusChange}
                title={statusTarget?.title || ''}
                message={statusTarget?.message || ''}
                confirmText={statusTarget?.confirmText || 'Xác nhận'}
                variant={statusTarget?.variant || 'confirm'}
            />

            {/* ── Cancel with Reason ─────────────────── */}
            <CancelReasonModal
                open={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                onConfirm={handleCancelConfirm}
                orderId={cancelTarget?.id}
            />

            {/* ── Delete Confirm ───────────────────────────────── */}
            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Xóa đơn hàng"
                message={`Bạn có chắc chắn muốn xóa đơn "${deleteTarget?.id}"? Thao tác này không thể hoàn tác.`}
                confirmText="Xóa"
                variant="danger"
            />
        </div>
    );
}
