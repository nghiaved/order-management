import { useState } from 'react';
import Modal from './Modal';
import { fmt } from '../utils/format';

export default function AddPaymentModal({ open, onClose, onConfirm, remainingBalance }) {
    const [form, setForm] = useState({
        amount_paid: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
    });
    const [saving, setSaving] = useState(false);

    const reset = () => setForm({
        amount_paid: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
    });

    const handleClose = () => {
        if (saving) return;
        reset();
        onClose();
    };

    const handlePayFull = () => {
        setForm((f) => ({ ...f, amount_paid: String(remainingBalance) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amount = Number(form.amount_paid);
        if (!amount || amount <= 0) return;
        if (amount > remainingBalance) return;

        setSaving(true);
        try {
            await onConfirm({
                amount_paid: amount,
                date: new Date(form.date + new Date().toISOString().slice(10)).toISOString(),
                note: form.note.trim(),
            });
            reset();
        } finally {
            setSaving(false);
        }
    };

    const amount = Number(form.amount_paid) || 0;
    const exceedsBalance = amount > remainingBalance;

    return (
        <Modal open={open} onClose={handleClose} title="Thêm thanh toán">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Remaining balance info */}
                <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                    <span className="text-sm text-blue-300">Còn phải thanh toán</span>
                    <span className="text-blue-200 font-semibold">{fmt(remainingBalance)} VNĐ</span>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Số tiền thanh toán *</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="1"
                            max={remainingBalance}
                            required
                            className={`flex-1 bg-[#0a0e1a] border rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all ${exceedsBalance ? 'border-red-500' : 'border-gray-700/50'}`}
                            placeholder="Nhập số tiền…"
                            value={form.amount_paid}
                            onChange={(e) => setForm((f) => ({ ...f, amount_paid: e.target.value }))}
                        />
                        <button
                            type="button"
                            onClick={handlePayFull}
                            className="px-3 py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-medium hover:bg-emerald-500/25 transition-colors whitespace-nowrap"
                        >
                            Thanh toán hết
                        </button>
                    </div>
                    {exceedsBalance && (
                        <p className="text-red-400 text-xs mt-1">Số tiền vượt quá số còn lại ({fmt(remainingBalance)} VNĐ)</p>
                    )}
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Ngày thanh toán</label>
                    <input
                        type="date"
                        className="w-full bg-[#0a0e1a] border border-gray-700/50 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/40 outline-none transition-all"
                        value={form.date}
                        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    />
                </div>

                {/* Note */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">
                        Ghi chú <span className="text-gray-600 font-normal">(không bắt buộc)</span>
                    </label>
                    <textarea
                        rows={2}
                        className="w-full bg-[#0a0e1a] border border-gray-700/50 rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all resize-none"
                        placeholder="VD: Thanh toán đợt 2…"
                        value={form.note}
                        onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-1">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={saving}
                        className="px-4 py-1.5 border border-gray-600/50 rounded-xl text-gray-300 hover:bg-gray-700/30 disabled:opacity-50 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={saving || exceedsBalance || !amount}
                        className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Đang lưu…' : 'Xác nhận'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
