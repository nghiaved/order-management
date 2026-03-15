export function generateOrderId(orders) {
    const today = new Date();
    const date =
        today.getFullYear().toString() +
        String(today.getMonth() + 1).padStart(2, '0') +
        String(today.getDate()).padStart(2, '0');

    const todayOrders = orders.filter((o) => o.id && o.id.includes(date));
    const seq = String(todayOrders.length + 1).padStart(3, '0');

    return `ORD-${date}-${seq}`;
}
