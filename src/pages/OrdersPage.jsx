import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderList from '../components/OrderList';
import OrderSummaryBar from '../components/OrderSummaryBar';
import Allow from '../components/Allow';
import { PERMISSIONS } from '../utils/rbacHelper';

export default function OrdersPage() {
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Orders</h1>
                <Allow permission={PERMISSIONS.ORDERS_CREATE}>
                    <button
                        onClick={() => navigate('/orders/create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl font-medium transition-colors"
                    >
                        + New Order
                    </button>
                </Allow>
            </div>
            <OrderSummaryBar refreshKey={refreshKey} />
            <OrderList refreshKey={refreshKey} onRefresh={handleRefresh} />
        </div>
    );
}
