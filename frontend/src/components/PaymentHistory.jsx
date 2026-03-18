import { fmt, fmtDateTime } from '../utils/format';

const STATUS_MAP = {
    unpaid: { label: 'Chưa thanh toán', color: 'text-red-400', bg: 'bg-red-500/15 text-red-400', dot: 'bg-red-400' },
    partial: { label: 'Thanh toán một phần', color: 'text-amber-400', bg: 'bg-amber-500/15 text-amber-400', dot: 'bg-amber-400' },
    paid: { label: 'Đã thanh toán', color: 'text-emerald-400', bg: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
};

function getPaymentStatus(paidSum, totalAmount) {
    if (paidSum <= 0) return 'unpaid';
    if (paidSum >= totalAmount) return 'paid';
    return 'partial';
}

export default function PaymentHistory({ payments, totalAmount, onAddPayment, canAdd }) {
    const paidSum = payments.reduce((s, p) => s + Number(p.amount_paid), 0);
    const remaining = Math.max(0, Number(totalAmount) - paidSum);
    const pct = totalAmount > 0 ? Math.min(100, (paidSum / totalAmount) * 100) : 0;
    const status = getPaymentStatus(paidSum, totalAmount);
    const cfg = STATUS_MAP[status];

    return (
        <div className="bg-[#111827] rounded-2xl border border-gray-700/50 overflow-hidden h-fit">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-700/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-gray-300">Lịch sử thanh toán</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg}`}>
                        {cfg.label}
                    </span>
                </div>
                {canAdd && remaining > 0 && (
                    <button
                        onClick={onAddPayment}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Thêm thanh toán
                    </button>
                )}
            </div>

            {/* Progress bar + summary */}
            <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Đã thanh toán</span>
                    <span className="text-white font-semibold">{fmt(paidSum)} / {fmt(totalAmount)} VNĐ</span>
                </div>
                <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${status === 'paid' ? 'bg-emerald-500' : status === 'partial' ? 'bg-amber-500' : 'bg-gray-600'}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                    <span>{pct.toFixed(0)}%</span>
                    <span>Còn lại: {fmt(remaining)} VNĐ</span>
                </div>
            </div>

            {/* Timeline */}
            {payments.length > 0 ? (
                <div className="px-5 pb-5">
                    <div className="relative pl-6 space-y-4">
                        {/* Vertical line */}
                        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gray-700/60" />

                        {[...payments].sort((a, b) => new Date(b.date) - new Date(a.date)).map((p, i) => (
                            <div key={p.id} className="relative">
                                {/* Dot */}
                                <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#111827] ${i === 0 ? cfg.dot : 'bg-gray-600'}`} />
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="text-white text-sm font-medium">{fmt(p.amount_paid)} VNĐ</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{fmtDateTime(p.date)}</p>
                                        {p.note && <p className="text-xs text-gray-400 mt-1">{p.note}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="text-gray-500 text-sm px-5 pb-5 text-center">Chưa có thanh toán nào.</p>
            )}
        </div>
    );
}
