import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import OrderCreatePage from './pages/OrderCreatePage';
import OrderUpdatePage from './pages/OrderUpdatePage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProductsPage from './pages/ProductsPage';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import { PERMISSIONS } from './utils/rbacHelper';

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<DashboardPage />} />
                        <Route
                            path="orders"
                            element={
                                <ProtectedRoute permission={PERMISSIONS.ORDERS_LIST}>
                                    <OrdersPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="orders/create"
                            element={
                                <ProtectedRoute permission={PERMISSIONS.ORDERS_CREATE}>
                                    <OrderCreatePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="orders/update"
                            element={
                                <ProtectedRoute permission={PERMISSIONS.ORDERS_UPDATE}>
                                    <OrderUpdatePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="orders/detail"
                            element={
                                <ProtectedRoute permission={PERMISSIONS.ORDERS_LIST}>
                                    <OrderDetailPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="products"
                            element={
                                <ProtectedRoute permission={PERMISSIONS.PRODUCTS_LIST}>
                                    <ProductsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="inventory"
                            element={
                                <ProtectedRoute permission={PERMISSIONS.INVENTORY_LIST}>
                                    <InventoryPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="customers"
                            element={
                                <ProtectedRoute permission={PERMISSIONS.CUSTOMERS_LIST}>
                                    <CustomersPage />
                                </ProtectedRoute>
                            }
                        />
                    </Route>
                </Routes>
            </AuthProvider>
            <Toaster
                position="bottom-center"
                toastOptions={{
                    duration: 3500,
                    style: {
                        background: '#1a2035',
                        color: '#e5e7eb',
                        border: '1px solid rgba(55,65,81,0.4)',
                        borderRadius: '12px',
                        fontSize: '14px',
                    },
                    success: { iconTheme: { primary: '#22c55e', secondary: '#1a2035' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#1a2035' } },
                }}
            />
        </BrowserRouter>
    );
}
