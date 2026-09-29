import api from './api';

export const baseService = {
  getBases: async (params = {}) => {
    return await api.get('/bases', { params });
  },
  getBaseById: async (id) => {
    const data = await api.get(`/bases/${id}`);
    return data.data;
  },
  createBase: async (payload) => {
    return await api.post('/bases', payload);
  },
  updateBase: async (id, payload) => {
    return await api.put(`/bases/${id}`, payload);
  },
};
