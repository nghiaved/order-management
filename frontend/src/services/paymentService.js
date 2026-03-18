import api from './api';

export const paymentService = {
    async getAll() {
        const { data } = await api.get('/payment_history');
        return data;
    },

    async getByOrderId(orderId) {
        const { data } = await api.get('/payment_history', {
            params: { order_id: orderId },
        });
        return data;
    },

    async create(entry) {
        const { data } = await api.post('/payment_history', entry);
        return data;
    },

    async deleteByOrderId(orderId) {
        const { data: entries } = await api.get('/payment_history', {
            params: { order_id: orderId },
        });
        for (const e of entries) {
            await api.delete(`/payment_history/${e.id}`);
        }
    },
};
