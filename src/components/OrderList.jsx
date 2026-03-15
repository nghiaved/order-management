import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { customerService } from '../services/customerService';
import Allow from './Allow';
import { PERMISSIONS } from '../utils/rbacHelper';
import { ConfirmModal } from './Modal';
import Pagination from './Pagination';
import DataTable from './DataTable';
import SearchFilter from './SearchFilter';
import { STATUS_CONFIG, PAGE_SIZE } from '../constants';
import { fmt, fmtDate } from '../utils/format';

export default function OrderList({ refreshKey }) {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [statusTarget, setStatusTarget] = useState(null);

    useEffect(() => {
        const load = async () => {
            const [o, c] = await Promise.all([orderService.getAll(), customerService.getAll()]);
            setOrders([...o].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            setCustomers(c);
        };
        load();
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
                    (customerMap[o.customer_id]?.full_name || '').toLowerCase().includes(q)
            );
        }
        if (statusFilter) result = result.filter((o) => o.status === statusFilter);
        return result;
    }, [orders, search, statusFilter, customerMap]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const updateStatus = async (order, newStatus) => {
        await orderService.update(order.id, { status: newStatus });
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)));
    };

    const confirmStatusChange = async () => {
        if (!statusTarget) return;
        await updateStatus(statusTarget.order, statusTarget.newStatus);
        setStatusTarget(null);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        await orderService.remove(deleteTarget.id);
        setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
        setDeleteTarget(null);
    };

    const columns = [
        {
            header: 'Order ID', key: 'id',
            render: (o) => <span className="font-medium text-blue-400">{o.id}</span>,
        },
        {
            header: 'Customer', key: 'customer',
            render: (o) => <span className="text-gray-300">{customerMap[o.customer_id]?.full_name || o.customer_id}</span>,
        },
        {
            header: 'Payment', key: 'payment_method',
            render: (o) => <span className="text-gray-400">{o.payment_method}</span>,
        },
        {
            header: 'Total', key: 'total_amount',
            render: (o) => <span className="font-semibold text-gray-200">{fmt(o.total_amount)} đ</span>,
        },
        {
            header: 'Status', key: 'status',
            render: (o) => {
                const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.New;
                return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg}`}>{cfg.label}</span>;
            },
        },
        {
            header: 'Date', key: 'created_at',
            render: (o) => <span className="text-gray-500 text-xs">{fmtDate(o.created_at)}</span>,
        },
        {
            header: 'Actions', key: 'actions',
            render: (o) => (
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => navigate(`/orders/detail?id=${o.id}`)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 transition-colors">
                        Detail
                    </button>
                    <Allow permission={PERMISSIONS.ORDERS_UPDATE}>
                        {o.status === 'New' && (
                            <>
                                <button onClick={() => navigate(`/orders/update?id=${o.id}`)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors">Edit</button>
                                <button
                                    onClick={() => setStatusTarget({ order: o, newStatus: 'Processing', title: 'Process Order', message: `Move order "${o.id}" to Processing?`, confirmText: 'Process' })}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
                                >Process</button>
                            </>
                        )}
                        {o.status === 'Processing' && (
                            <button
                                onClick={() => setStatusTarget({ order: o, newStatus: 'Done', title: 'Complete Order', message: `Mark order "${o.id}" as complete?`, confirmText: 'Complete' })}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                            >Complete</button>
                        )}
                        {(o.status === 'New' || o.status === 'Processing') && (
                            <button
                                onClick={() => setStatusTarget({ order: o, newStatus: 'Cancel', title: 'Cancel Order', message: `Cancel order "${o.id}"? This action cannot be undone.`, confirmText: 'Cancel Order', variant: 'danger' })}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                            >Cancel</button>
                        )}
                    </Allow>
                    <Allow permission={PERMISSIONS.ORDERS_DELETE}>
                        <button onClick={() => setDeleteTarget(o)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Delete</button>
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
                placeholder="Search orders…"
                filters={[{
                    value: statusFilter,
                    onChange: (v) => { setStatusFilter(v); setPage(1); },
                    options: [{ value: '', label: 'All Status' }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))],
                }]}
                resultCount={filtered.length}
            />

            <DataTable columns={columns} data={paginated} emptyText="No orders found." />
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

            {/* ── Status Change Confirm ────────────────────────── */}
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
                message={`Are you sure you want to delete order "${deleteTarget?.id}"? This action cannot be undone.`}
            />
        </div>
    );
}
