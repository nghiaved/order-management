import { orderService } from '../services/orderService';
import { inventoryService } from '../services/inventoryService';

/**
 * Provides inventory sync helpers tied to order lifecycle.
 * SRP: Only handles inventory restoration logic.
 * DIP: Depends on service abstractions, not raw API calls.
 */
export function useInventorySync() {
    /**
     * Restore stock quantities for all items in a cancelled order.
     * Silently skips products with no inventory record.
     * @param {string} orderId
     */
    const restoreOrderInventory = async (orderId) => {
        const details = await orderService.getOrderDetails(orderId);
        await Promise.all(
            details.map((d) =>
                inventoryService.restoreStock(d.product_id, Number(d.quantity))
            )
        );
    };

    return { restoreOrderInventory };
}
