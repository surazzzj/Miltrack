import api from './api';

export const authService = {
  login: async (credentials) => {
    const data = await api.post('/auth/login', credentials);
    if (data.token) {
      localStorage.setItem('miltrack_token', data.token);
      localStorage.setItem('miltrack_user', JSON.stringify(data.user));
    }
    return data;
  },

  getMe: async () => {
    const data = await api.get('/auth/me');
    if (data.data) {
      localStorage.setItem('miltrack_user', JSON.stringify(data.data));
    }
    return data.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('miltrack_token');
      localStorage.removeItem('miltrack_user');
    }
  },
};
