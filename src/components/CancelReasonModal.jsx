import { useState } from 'react';
import Modal from './Modal';

/**
 * Cancel reason input modal.
 * Shown instead of a plain ConfirmModal when cancelling an order,
 * so the reason can be captured and stored with the order.
 */
export default function CancelReasonModal({ open, onClose, onConfirm, orderId }) {
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    const handleConfirm = async () => {
        setSaving(true);
        try {
            await onConfirm(reason.trim());
        } finally {
            setSaving(false);
            setReason('');
        }
    };

    const handleClose = () => {
        if (saving) return;
        setReason('');
        onClose();
    };

    return (
        <Modal open={open} onClose={handleClose} title={`Cancel Order${orderId ? ` — ${orderId}` : ''}`}>
            <div className="space-y-4">
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-sm text-red-300">
                        This will cancel the order and <strong className="text-red-200">restore all inventory quantities</strong>. This action cannot be undone.
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">
                        Cancel Reason <span className="text-gray-600 font-normal">(optional)</span>
                    </label>
                    <textarea
                        rows={3}
                        className="w-full bg-[#0a0e1a] border border-gray-700/50 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-red-500/30 outline-none transition-all resize-none"
                        placeholder="e.g. Customer requested cancellation, item out of stock…"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={handleClose}
                        disabled={saving}
                        className="px-4 py-1.5 border border-gray-600/50 rounded-xl text-gray-300 hover:bg-gray-700/30 disabled:opacity-50 transition-colors"
                    >
                        Keep Order
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={saving}
                        className="px-5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Cancelling…' : 'Cancel Order'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
