import { useNavigate } from 'react-router-dom';
import OrderForm from '../components/OrderForm';

export default function OrderCreatePage() {
    const navigate = useNavigate();

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <h1 className="text-2xl font-bold text-white">New Order</h1>
            </div>
            <OrderForm
                editingOrder={null}
                onSaved={() => navigate('/orders')}
                onCancel={() => navigate('/orders')}
            />
        </div>
    );
}
