export function generateOrderId(orders) {
    const today = new Date();
    const date =
        today.getFullYear().toString() +
        String(today.getMonth() + 1).padStart(2, '0') +
        String(today.getDate()).padStart(2, '0');

    const prefix = `ORD-${date}-`;
    let maxSeq = 0;
    for (const o of orders) {
        if (o.id && o.id.startsWith(prefix)) {
            const seq = parseInt(o.id.slice(prefix.length), 10);
            if (seq > maxSeq) maxSeq = seq;
        }
    }

    return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}
