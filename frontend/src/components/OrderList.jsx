import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderService } from '../services/orderService';
import { customerService } from '../services/customerService';
import { paymentService } from '../services/paymentService';
import { useInventorySync } from '../hooks/useInventorySync';
import Allow from './Allow';
import { PERMISSIONS } from '../utils/rbacHelper';
import { ConfirmModal } from './Modal';
import CancelReasonModal from './CancelReasonModal';
import Pagination from './Pagination';
import DataTable from './DataTable';
import SearchFilter from './SearchFilter';
import { STATUS_CONFIG, PAGE_SIZE } from '../constants';
import { fmt, fmtDateTime } from '../utils/format';
import { getPaymentStatus } from '../utils/orderUtils';

export default function OrderList({ refreshKey, onRefresh }) {
    const navigate = useNavigate();
    const { restoreOrderInventory } = useInventorySync();
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [confirmingStatus, setConfirmingStatus] = useState(false);
    const [statusTarget, setStatusTarget] = useState(null);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [paymentSums, setPaymentSums] = useState({});

    useEffect(() => {
        setLoading(true);
        const load = async () => {
            const [o, c, ph] = await Promise.all([
                orderService.getAll(),
                customerService.getAll(),
                paymentService.getAll(),
            ]);
            setOrders([...o].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            setCustomers(c);
            const sums = {};
            ph.forEach((p) => {
                sums[p.order_id] = (sums[p.order_id] || 0) + Number(p.amount_paid);
            });
            setPaymentSums(sums);
        };
        load().finally(() => setLoading(false));
    }, [refreshKey]);

    const customerMap = useMemo(() => {
        const map = {};
        customers.forEach((c) => (map[c.id] = c));
        return map;
    }, [customers]);

    const filtered = useMemo(() => {
        let result = orders;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (o) =>
                    o.id.toLowerCase().includes(q) ||
                    (customerMap[o.customer_id]?.full_name || '').toLowerCase().includes(q) ||
                    (customerMap[o.customer_id]?.phone || '').includes(q)
            );
        }
        if (statusFilter) result = result.filter((o) => o.status === statusFilter);
        if (dateFilter) result = result.filter((o) => o.created_at?.slice(0, 10) === dateFilter);
        if (paymentFilter) {
            result = result.filter((o) => {
                const paid = paymentSums[o.id] || 0;
                const total = Number(o.total_amount);
                if (paymentFilter === 'paid') return paid >= total && total > 0;
                if (paymentFilter === 'partial') return paid > 0 && paid < total;
                if (paymentFilter === 'unpaid') return paid <= 0;
                return true;
            });
        }
        return result;
    }, [orders, search, statusFilter, dateFilter, paymentFilter, customerMap, paymentSums]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const updateStatus = async (order, newStatus) => {
        await orderService.update(order.id, { status: newStatus });
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)));
    };

    const confirmStatusChange = async () => {
        if (!statusTarget) return;
        setConfirmingStatus(true);
        try {
            await updateStatus(statusTarget.order, statusTarget.newStatus);
            toast.success(`Đơn hàng đã chuyển sang ${statusTarget.newStatus === 'Processing' ? 'Đang giao hàng' : 'Đã giao'}.`);
            onRefresh?.();
        } catch (err) {
            toast.error(err.message || 'Không thể cập nhật trạng thái.');
        } finally {
            setStatusTarget(null);
            setConfirmingStatus(false);
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
            setOrders((prev) =>
                prev.map((o) => (o.id === cancelTarget.id ? { ...o, status: 'Cancel' } : o))
            );
            toast.success(`Đơn ${cancelTarget.id} đã hủy. Tồn kho đã hoàn trả.`);
            onRefresh?.();
        } catch (err) {
            toast.error(err.message || 'Không thể hủy đơn hàng.');
        } finally {
            setCancelTarget(null);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            // Restore inventory if order was not already cancelled
            if (deleteTarget.status !== 'Cancel') {
                await restoreOrderInventory(deleteTarget.id);
            }
            await orderService.deleteOrder(deleteTarget.id);
            setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
            toast.success('Đã xóa đơn hàng.');
            onRefresh?.();
        } catch (err) {
            toast.error(err.message || 'Không thể xóa đơn hàng.');
        } finally {
            setDeleteTarget(null);
            setDeleting(false);
        }
    };

    const columns = [
        {
            header: 'Mã đơn', key: 'id',
            render: (o) => <span className="font-medium text-blue-400">{o.id}</span>,
        },
        {
            header: 'Khách hàng', key: 'customer',
            render: (o) => <span className="text-gray-300">{customerMap[o.customer_id]?.full_name || o.customer_id}</span>,
        },
        {
            header: 'Tổng tiền', key: 'total_amount',
            render: (o) => <span className="font-semibold text-gray-200">{fmt(o.total_amount)} VNĐ</span>,
        },
        {
            header: 'Ngày tạo', key: 'created_at',
            render: (o) => <span className="text-gray-500 text-xs">{fmtDateTime(o.created_at)}</span>,
        },
        {
            header: 'Thanh toán', key: 'payment_status',
            render: (o) => {
                const paid = paymentSums[o.id] || 0;
                const total = Number(o.total_amount);
                const status = getPaymentStatus(paid, total);
                const isPaid = status === 'paid';
                const isPartial = status === 'partial';
                return (
                    <div className="space-y-0.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${isPaid ? 'bg-emerald-500/15 text-emerald-400'
                            : isPartial ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-red-500/15 text-red-400'
                            }`}>
                            {isPaid ? 'Đã thanh toán' : isPartial ? 'Thanh toán một phần' : 'Chưa thanh toán'}
                        </span>
                        {paid > 0 && paid < total && (
                            <p className="text-sm text-gray-500">{fmt(paid)} VNĐ</p>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Trạng thái', key: 'status',
            render: (o) => {
                const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.New;
                return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg}`}>{cfg.label}</span>;
            },
        },
        {
            header: '', key: 'actions',
            render: (o) => (
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => navigate(`/orders/detail?id=${o.id}`)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 transition-colors">
                        Chi tiết
                    </button>
                    <Allow permission={PERMISSIONS.ORDERS_UPDATE}>
                        {o.status === 'New' && (
                            <>
                                <button onClick={() => navigate(`/orders/update?id=${o.id}`)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors">Sửa</button>
                                <button
                                    onClick={() => setStatusTarget({ order: o, newStatus: 'Processing', title: 'Xử lý đơn', message: `Chuyển đơn "${o.id}" sang Đang giao hàng?`, confirmText: 'Xử lý' })}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
                                >Xử lý</button>
                            </>
                        )}
                        {o.status === 'Processing' && (
                            <button
                                onClick={() => setStatusTarget({ order: o, newStatus: 'Done', title: 'Đã giao đơn', message: `Đánh dấu đơn "${o.id}" là Đã giao?`, confirmText: 'Đã giao' })}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                            >Đã giao</button>
                        )}
                        {(o.status === 'New' || o.status === 'Processing') && (
                            <button
                                onClick={() => setCancelTarget(o)}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                            >Hủy</button>
                        )}
                    </Allow>
                    <Allow permission={PERMISSIONS.ORDERS_DELETE}>
                        <button onClick={() => setDeleteTarget(o)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Xóa</button>
                    </Allow>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <SearchFilter
                search={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
                placeholder="Tìm theo mã đơn hoặc khách hàng…"
                filters={[
                    {
                        value: statusFilter,
                        onChange: (v) => { setStatusFilter(v); setPage(1); },
                        options: [{ value: '', label: 'Tất cả trạng thái' }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))],
                    },
                    {
                        value: paymentFilter,
                        onChange: (v) => { setPaymentFilter(v); setPage(1); },
                        options: [
                            { value: '', label: 'Tất cả thanh toán' },
                            { value: 'unpaid', label: 'Chưa thanh toán' },
                            { value: 'partial', label: 'Thanh toán một phần' },
                            { value: 'paid', label: 'Đã thanh toán' },
                        ],
                    },
                    {
                        type: 'date',
                        label: 'Lọc theo ngày tạo',
                        value: dateFilter,
                        onChange: (v) => { setDateFilter(v); setPage(1); },
                    },
                ]}
                resultCount={filtered.length}
            />
            {(search || statusFilter || paymentFilter || dateFilter) && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Bộ lọc đang dùng:</span>
                    {search && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-700/50 text-gray-300 border border-gray-600/30">
                            "{search}"
                            <button onClick={() => { setSearch(''); setPage(1); }} className="hover:text-white ml-0.5">×</button>
                        </span>
                    )}
                    {statusFilter && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-700/50 text-gray-300 border border-gray-600/30">
                            {STATUS_CONFIG[statusFilter]?.label}
                            <button onClick={() => { setStatusFilter(''); setPage(1); }} className="hover:text-white ml-0.5">×</button>
                        </span>
                    )}
                    {paymentFilter && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-700/50 text-gray-300 border border-gray-600/30">
                            {paymentFilter === 'paid' ? 'Đã thanh toán' : paymentFilter === 'partial' ? 'Một phần' : 'Chưa thanh toán'}
                            <button onClick={() => { setPaymentFilter(''); setPage(1); }} className="hover:text-white ml-0.5">×</button>
                        </span>
                    )}
                    {dateFilter && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-700/50 text-gray-300 border border-gray-600/30">
                            {dateFilter}
                            <button onClick={() => { setDateFilter(''); setPage(1); }} className="hover:text-white ml-0.5">×</button>
                        </span>
                    )}
                    <button
                        onClick={() => { setSearch(''); setStatusFilter(''); setPaymentFilter(''); setDateFilter(''); setPage(1); }}
                        className="ml-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                        Xóa tất cả
                    </button>
                </div>
            )}

            {loading ? (
                <div className="bg-[#111827] border border-gray-700/50 rounded-xl overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-800/50">
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse w-28" />
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse w-36" />
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse w-16" />
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse w-24" />
                            <div className="h-5 bg-gray-700/50 rounded-full animate-pulse w-20 ml-2" />
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse w-20 ml-auto" />
                            <div className="h-7 bg-gray-700/50 rounded-lg animate-pulse w-28" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <DataTable columns={columns} data={paginated} emptyText="Không tìm thấy đơn hàng." />
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}

            {/* ── Status Change Confirm (Process / Complete only) ── */}
            <ConfirmModal
                open={!!statusTarget}
                onClose={() => setStatusTarget(null)}
                onConfirm={confirmStatusChange}
                title={statusTarget?.title || ''}
                message={statusTarget?.message || ''}
                confirmText={statusTarget?.confirmText || 'Xác nhận'}
                variant={statusTarget?.variant || 'confirm'}
                deleting={confirmingStatus}
                loadingText="Đang lưu…"
            />

            {/* ── Cancel with Reason ──────────────────────────── */}
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
                deleting={deleting}
            />
        </div>
    );
}
