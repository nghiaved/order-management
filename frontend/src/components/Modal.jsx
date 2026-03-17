import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, size = 'md', children }) {
    const backdropRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    const widthClass = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    }[size] || 'max-w-lg';

    return (
        <div
            style={{ marginTop: 0 }}
            ref={backdropRef}
            onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <div className={`w-full ${widthClass} bg-[#111827] border border-gray-700/50 rounded-2xl shadow-2xl animate-modal`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Xoá', variant = 'danger' }) {
    const colors = variant === 'danger'
        ? 'bg-red-600 hover:bg-red-700'
        : 'bg-blue-600 hover:bg-blue-700';

    return (
        <Modal open={open} onClose={onClose} title={title} size="sm">
            <p className="text-gray-300 text-sm mb-6">{message}</p>
            <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700/50 text-sm font-medium">
                    Hủy
                </button>
                <button onClick={onConfirm} className={`px-4 py-1.5 rounded-lg text-white text-sm font-medium ${colors}`}>
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
}
