import api from './api';

const AUTH_KEY = 'auth_user';

export const authService = {
    async login(username, password) {
        const { data: users } = await api.get('/users', {
            params: { username, password },
        });
        if (users.length === 0) {
            throw new Error('Invalid username or password');
        }
        const user = users[0];

        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
        return user;
    },

    logout() {
        localStorage.removeItem(AUTH_KEY);
    },

    getCurrentUser() {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem(AUTH_KEY);
    },
};
