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
            created_at: new Date().toISOString(),
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
        const item = await this.getByProductId(String(productId));
        if (!item) throw new Error(`Không tìm thấy tồn kho cho sản phẩm ${productId}`);
        if (item.stock_quantity < quantity) {
            throw new Error(
                `Không đủ tồn kho cho sản phẩm ${productId}. Hiện có: ${item.stock_quantity}, Yêu cầu: ${quantity}`
            );
        }
        return this.updateStock(item.id, item.stock_quantity - quantity);
    },

    async restoreStock(productId, quantity) {
        const item = await this.getByProductId(String(productId));
        if (!item) return null;
        return this.updateStock(item.id, item.stock_quantity + quantity);
    },

    async remove(id) {
        await api.delete(`/inventory/${id}`);
    },
};
