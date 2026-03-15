import Modal from './Modal';

/**
 * Reusable form modal for CRUD operations.
 * SRP: Handles modal + form layout — field rendering is configurable.
 *
 * @param {boolean}  open         — whether modal is shown
 * @param {Function} onClose      — close handler
 * @param {Function} onSubmit     — form submit handler
 * @param {string}   title        — modal title
 * @param {boolean}  saving       — loading state for submit button
 * @param {React.ReactNode} children — form body (fields)
 */
export default function CrudFormModal({ open, onClose, onSubmit, title, saving, children }) {
    return (
        <Modal open={open} onClose={onClose} title={title}>
            <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {children}
                <div className="sm:col-span-2 flex gap-2 justify-end pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 border border-gray-600/50 rounded-xl text-gray-300 hover:bg-gray-700/30 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

/**
 * Reusable form field input.
 */
export function FormField({ label, colSpan, children }) {
    return (
        <div className={colSpan === 2 ? 'sm:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

/**
 * Standard text/number input styled for dark theme forms.
 */
export function FormInput({ value, onChange, type = 'text', required = true, ...props }) {
    return (
        <input
            type={type}
            min={type === 'number' ? '0' : undefined}
            required={required}
            className="w-full bg-[#0a0e1a] border border-gray-700/50 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all"
            value={value}
            onChange={onChange}
            {...props}
        />
    );
}
