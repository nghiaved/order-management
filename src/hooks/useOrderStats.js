import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { inventoryService } from '../services/inventoryService';
import { productService } from '../services/productService';

/**
 * Fetches and computes order + inventory summary stats.
 * Used by OrderSummaryBar on the Orders page.
 */
export function useOrderStats(refreshKey) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            orderService.getAll(),
            inventoryService.getAll(),
            productService.getAll(),
        ])
            .then(([orders, inventory, products]) => {
                const productMap = {};
                products.forEach((p) => (productMap[p.id] = p));

                const revenue = orders
                    .filter((o) => o.status !== 'Cancel')
                    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

                const statusCounts = {};
                orders.forEach((o) => {
                    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
                });

                const lowStock = inventory
                    .filter((i) => i.stock_quantity < 5)
                    .map((i) => ({
                        ...i,
                        productName: productMap[i.product_id]?.name || `Product #${i.product_id}`,
                    }));

                setStats({
                    revenue,
                    total: orders.length,
                    active: (statusCounts.New || 0) + (statusCounts.Processing || 0),
                    statusCounts,
                    lowStock,
                });
            })
            .finally(() => setLoading(false));
    }, [refreshKey]);

    return { stats, loading };
}
