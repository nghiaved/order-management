import api from './api';

export const orderService = {
    async getAll() {
        const { data } = await api.get('/orders');
        return data;
    },

    async getById(id) {
        const { data } = await api.get(`/orders/${encodeURIComponent(id)}`);
        return data;
    },

    async create(order) {
        const { data } = await api.post('/orders', {
            ...order,
            created_at: new Date().toISOString(),
        });
        return data;
    },

    async update(id, order) {
        const { data } = await api.patch(`/orders/${encodeURIComponent(id)}`, order);
        return data;
    },

    async remove(id) {
        await api.delete(`/orders/${encodeURIComponent(id)}`);
    },

    async getOrderDetails(orderId) {
        const { data } = await api.get('/order_details', {
            params: { order_id: orderId },
        });
        return data;
    },

    async createOrderDetail(detail) {
        const { data } = await api.post('/order_details', detail);
        return data;
    },

    async deleteOrderDetails(orderId) {
        const { data: details } = await api.get('/order_details', {
            params: { order_id: orderId },
        });
        await Promise.all(details.map((d) => api.delete(`/order_details/${d.id}`)));
    },
};