import api from './api';

export const customerService = {
    async getAll() {
        const { data } = await api.get('/customers');
        return data;
    },

    async getById(id) {
        const { data } = await api.get(`/customers/${id}`);
        return data;
    },

    async create(customer) {
        const { data } = await api.post('/customers', {
            ...customer,
            created_at: new Date().toISOString(),
        });
        return data;
    },

    async update(id, customer) {
        const { data } = await api.patch(`/customers/${id}`, customer);
        return data;
    },

    async remove(id) {
        await api.delete(`/customers/${id}`);
    },

    async search(query) {
        const { data } = await api.get('/customers', {
            params: { full_name_like: query },
        });
        return data;
    },
};
