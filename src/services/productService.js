import api from './api';

export const productService = {
    async getAll() {
        const { data } = await api.get('/products');
        return data;
    },

    async getById(id) {
        const { data } = await api.get(`/products/${id}`);
        return data;
    },

    async create(product) {
        const { data } = await api.post('/products', product);
        return data;
    },

    async update(id, product) {
        const { data } = await api.patch(`/products/${id}`, product);
        return data;
    },

    async remove(id) {
        await api.delete(`/products/${id}`);
    },
};
