import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderService } from '../services/orderService';
import { customerService } from '../services/customerService';
import { useInventorySync } from '../hooks/useInventorySync';
import Allow from './Allow';
import { PERMISSIONS } from '../utils/rbacHelper';
import { ConfirmModal } from './Modal';
import CancelReasonModal from './CancelReasonModal';
import Pagination from './Pagination';
import DataTable from './DataTable';
import SearchFilter from './SearchFilter';
import { STATUS_CONFIG, PAGE_SIZE, PAYMENT_LABEL } from '../constants';
import { fmt, fmtDateTime } from '../utils/format';

export default function OrderList({ refreshKey, onRefresh }) {
    const navigate = useNavigate();
    const { restoreOrderInventory } = useInventorySync();
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [statusTarget, setStatusTarget] = useState(null);
    const [cancelTarget, setCancelTarget] = useState(null);

    useEffect(() => {
        setLoading(true);
        const load = async () => {
            const [o, c] = await Promise.all([orderService.getAll(), customerService.getAll()]);
            setOrders([...o].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            setCustomers(c);
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
        if (dateFilter) result = result.filter((o) => o.delivery_date === dateFilter);
        return result;
    }, [orders, search, statusFilter, dateFilter, customerMap]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const updateStatus = async (order, newStatus) => {
        await orderService.update(order.id, { status: newStatus });
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)));
    };

    const confirmStatusChange = async () => {
        if (!statusTarget) return;
        try {
            await updateStatus(statusTarget.order, statusTarget.newStatus);
            toast.success(`Đơn hàng đã chuyển sang ${statusTarget.newStatus === 'Processing' ? 'Đang xử lý' : 'Hoàn thành'}.`);
            onRefresh?.();
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
        try {
            await orderService.remove(deleteTarget.id);
            setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
            toast.success('Đã xóa đơn hàng.');
            onRefresh?.();
        } catch (err) {
            toast.error(err.message || 'Không thể xóa đơn hàng.');
        } finally {
            setDeleteTarget(null);
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
            header: 'Thanh toán', key: 'payment_method',
            render: (o) => <span className="text-gray-400">{PAYMENT_LABEL[o.payment_method] || o.payment_method}</span>,
        },
        {
            header: 'Tổng tiền', key: 'total_amount',
            render: (o) => <span className="font-semibold text-gray-200">{fmt(o.total_amount)} VNĐ</span>,
        },
        {
            header: 'Trạng thái', key: 'status',
            render: (o) => {
                const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.New;
                return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg}`}>{cfg.label}</span>;
            },
        },
        {
            header: 'Ngày tạo', key: 'created_at',
            render: (o) => <span className="text-gray-500 text-xs">{fmtDateTime(o.created_at)}</span>,
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
                                    onClick={() => setStatusTarget({ order: o, newStatus: 'Processing', title: 'Xử lý đơn', message: `Chuyển đơn "${o.id}" sang Đang xử lý?`, confirmText: 'Xử lý' })}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
                                >Xử lý</button>
                            </>
                        )}
                        {o.status === 'Processing' && (
                            <button
                                onClick={() => setStatusTarget({ order: o, newStatus: 'Done', title: 'Hoàn thành đơn', message: `Đánh dấu đơn "${o.id}" là Hoàn thành?`, confirmText: 'Hoàn thành' })}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                            >Hoàn thành</button>
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
                        type: 'date',
                        label: 'Lọc theo ngày giao',
                        value: dateFilter,
                        onChange: (v) => { setDateFilter(v); setPage(1); },
                    },
                ]}
                resultCount={filtered.length}
            />

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
                confirmText={statusTarget?.confirmText || 'Confirm'}
                variant={statusTarget?.variant || 'confirm'}
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
            />
        </div>
    );
}
