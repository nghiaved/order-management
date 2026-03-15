import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import OrderForm from '../components/OrderForm';
import { orderService } from '../services/orderService';

export default function OrderUpdatePage() {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) { navigate('/orders'); return; }
        orderService.getById(id)
            .then((o) => { setOrder(o); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <p className="text-gray-500">Loading…</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
                <p className="text-gray-400">Order not found.</p>
                <button onClick={() => navigate('/orders')} className="text-blue-400 hover:underline text-sm">← Back to Orders</button>
            </div>
        );
    }

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
                <h1 className="text-2xl font-bold text-white">
                    Edit Order: <span className="text-blue-400">{id}</span>
                </h1>
            </div>
            <OrderForm
                editingOrder={order}
                onSaved={() => navigate('/orders')}
                onCancel={() => navigate('/orders')}
            />
        </div>
    );
}
