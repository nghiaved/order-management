import { useOrderStats } from '../hooks/useOrderStats';
import { fmtCurrency } from '../utils/format';

function StatChip({ label, value, accent }) {
    return (
        <div className={`bg-[#111827] border rounded-xl px-4 py-3 ${accent}`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    );
}

function SkeletonChip() {
    return <div className="h-16 flex-1 bg-[#111827] border border-gray-700/50 rounded-xl animate-pulse" />;
}

/**
 * Summary bar shown at top of Orders page.
 * Displays revenue, order counts, and low-stock alerts.
 */
export default function OrderSummaryBar({ refreshKey }) {
    const { stats, loading } = useOrderStats(refreshKey);

    if (loading) {
        return (
            <div className="flex gap-3">
                <SkeletonChip />
                <SkeletonChip />
                <SkeletonChip />
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-2.5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatChip label="Revenue (excl. cancelled)" value={fmtCurrency(stats.revenue)} accent="border-emerald-700/40" />
                <StatChip label="Total Orders" value={stats.total} accent="border-blue-700/40" />
                <StatChip label="Active (New + Processing)" value={stats.active} accent="border-amber-700/40" />
            </div>
            {stats.lowStock.length > 0 && (
                <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/25 rounded-xl px-4 py-2.5">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div className="text-sm">
                        <span className="font-medium text-red-400">Low stock alert · </span>
                        <span className="text-red-300">
                            {stats.lowStock.map((i) => `${i.productName} (${i.stock_quantity} left)`).join(' · ')}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
