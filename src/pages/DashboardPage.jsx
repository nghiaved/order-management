import { useState, useEffect, useMemo } from 'react';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { inventoryService } from '../services/inventoryService';
import { customerService } from '../services/customerService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import { fmtCurrency, fmt } from '../utils/format';

const STATUS_COLORS = {
    New: '#3b82f6',
    Processing: '#f59e0b',
    Done: '#22c55e',
    Cancel: '#ef4444',
};

const STATUS_LABEL = {
    New: 'Mới',
    Processing: 'Đang xử lý',
    Done: 'Hoàn thành',
    Cancel: 'Đã hủy',
};

function StatCard({ icon, label, value, sub, color }) {
    return (
        <div className="bg-[#111827] border border-gray-700/50 rounded-xl p-5 flex items-start gap-4">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
                {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            orderService.getAll(),
            productService.getAll(),
            inventoryService.getAll(),
            customerService.getAll(),
        ])
            .then(([o, p, i, c]) => {
                setOrders(o);
                setProducts(p);
                setInventory(i);
                setCustomers(c);
            })
            .finally(() => setLoading(false));
    }, []);

    const stats = useMemo(() => {
        const totalOrders = orders.length;
        const revenue = orders
            .filter((o) => o.status !== 'Cancel')
            .reduce((s, o) => s + (o.total_amount || 0), 0);
        const totalStock = inventory.reduce((s, i) => s + (i.stock_quantity || 0), 0);
        const totalProducts = products.length;
        const totalCustomers = customers.length;

        // Status breakdown
        const statusMap = {};
        orders.forEach((o) => {
            statusMap[o.status] = (statusMap[o.status] || 0) + 1;
        });
        const statusData = Object.entries(statusMap).map(([name, value]) => ({
            name,
            value,
        }));

        // Monthly revenue (last 6 months)
        const monthlyMap = {};
        orders
            .filter((o) => o.status !== 'Cancel')
            .forEach((o) => {
                const d = new Date(o.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                monthlyMap[key] = (monthlyMap[key] || 0) + (o.total_amount || 0);
            });
        const monthlyRevenue = Object.entries(monthlyMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([month, amount]) => ({ month, amount }));

        // Top products by inventory
        const topInventory = inventory
            .map((inv) => {
                const prod = products.find((p) => String(p.id) === String(inv.product_id));
                return { name: prod?.name || `#${inv.product_id}`, stock: inv.stock_quantity };
            })
            .sort((a, b) => b.stock - a.stock);

        return { totalOrders, revenue, totalStock, totalProducts, totalCustomers, statusData, monthlyRevenue, topInventory };
    }, [orders, products, inventory, customers]);

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white">Tổng quan</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-[#111827] border border-gray-700/50 rounded-xl p-5 h-24 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>

            {/* ── Stat Cards ──────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    color="bg-blue-500/20 text-blue-400"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>}
                    label="Tổng đơn hàng"
                    value={stats.totalOrders}
                    sub={`${stats.statusData.find((s) => s.name === 'New')?.value || 0} mới`}
                />
                <StatCard
                    color="bg-green-500/20 text-green-400"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    label="Doanh thu"
                    value={fmtCurrency(stats.revenue)}
                    sub="Không tính hủy"
                />
                <StatCard
                    color="bg-amber-500/20 text-amber-400"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>}
                    label="Tồn kho"
                    value={stats.totalStock.toLocaleString()}
                    sub={`${stats.totalProducts} sản phẩm`}
                />
                <StatCard
                    color="bg-purple-500/20 text-purple-400"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
                    label="Khách hàng"
                    value={stats.totalCustomers}
                />
            </div>

            {/* ── Charts Row ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Revenue Bar Chart */}
                <div className="lg:col-span-2 bg-[#111827] border border-gray-700/50 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">Doanh thu theo tháng</h2>
                    {stats.monthlyRevenue.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={stats.monthlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a2035', border: '1px solid #374151', borderRadius: 8, color: '#fff' }}
                                    formatter={(v) => [fmtCurrency(v), 'Doanh thu']}
                                />
                                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-500 text-sm">Không có dữ liệu</p>
                    )}
                </div>

                {/* Order Status Pie */}
                <div className="bg-[#111827] border border-gray-700/50 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">Trạng thái đơn hàng</h2>
                    {stats.statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={stats.statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    dataKey="value"
                                    paddingAngle={3}
                                    label={({ name, value }) => `${STATUS_LABEL[name] || name}: ${value}`}
                                >
                                    {stats.statusData.map((entry) => (
                                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6b7280'} />
                                    ))}
                                </Pie>
                                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a2035', border: '1px solid #374151', borderRadius: 8, color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-500 text-sm">Không có dữ liệu</p>
                    )}
                </div>
            </div>

            {/* ── Inventory Bar Chart ────────────────────────── */}
            <div className="bg-[#111827] border border-gray-700/50 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Top sản phẩm theo tồn kho</h2>
                {stats.topInventory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={800}>
                        <BarChart data={stats.topInventory} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <Tooltip
                                formatter={(v) => [fmt(v), 'Kho']}
                                contentStyle={{ backgroundColor: '#1a2035', border: '1px solid #374151', borderRadius: 8, color: '#fff' }}
                            />
                            <Bar dataKey="stock" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-500 text-sm">Không có dữ liệu</p>
                )}
            </div>
        </div>
    );
}
