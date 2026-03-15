import { useNavigate } from 'react-router-dom';
import OrderList from '../components/OrderList';
import Allow from '../components/Allow';
import { PERMISSIONS } from '../utils/rbacHelper';

export default function OrdersPage() {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Orders</h1>
                <Allow permission={PERMISSIONS.ORDERS_CREATE}>
                    <button
                        onClick={() => navigate('/orders/create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
                    >
                        + New Order
                    </button>
                </Allow>
            </div>
            <OrderList />
        </div>
    );
}
