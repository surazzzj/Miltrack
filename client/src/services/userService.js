import api from './api';

export const userService = {
  getUsers: async (params = {}) => {
    return await api.get('/users', { params });
  },
  getUserById: async (id) => {
    const data = await api.get(`/users/${id}`);
    return data.data;
  },
  createUser: async (payload) => {
    return await api.post('/users', payload);
  },
  updateUser: async (id, payload) => {
    return await api.put(`/users/${id}`, payload);
  },
};
