import api from './api';

export const inventoryService = {
    async getAll() {
        const { data } = await api.get('/inventory');
        return data;
    },

    async getByProductId(productId) {
        const { data } = await api.get('/inventory', {
            params: { product_id: productId },
        });
        return data[0] || null;
    },

    async create(payload) {
        const { data } = await api.post('/inventory', {
            ...payload,
            last_updated: new Date().toISOString(),
        });
        return data;
    },

    async update(id, payload) {
        const { data } = await api.patch(`/inventory/${id}`, {
            ...payload,
            last_updated: new Date().toISOString(),
        });
        return data;
    },

    async updateStock(inventoryId, newQuantity) {
        const { data } = await api.patch(`/inventory/${inventoryId}`, {
            stock_quantity: newQuantity,
            last_updated: new Date().toISOString(),
        });
        return data;
    },

    async deductStock(productId, quantity) {
        const item = await this.getByProductId(productId);
        if (!item) throw new Error(`No inventory record for product ${productId}`);
        if (item.stock_quantity < quantity) {
            throw new Error(
                `Insufficient stock for product ${productId}. Available: ${item.stock_quantity}, Requested: ${quantity}`
            );
        }
        return this.updateStock(item.id, item.stock_quantity - quantity);
    },

    async remove(id) {
        await api.delete(`/inventory/${id}`);
    },
};
