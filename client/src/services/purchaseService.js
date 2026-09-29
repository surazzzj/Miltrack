import api from './api';

export const purchaseService = {
  getPurchases: async (params = {}) => {
    return await api.get('/purchases', { params });
  },
  getPurchaseById: async (id) => {
    const data = await api.get(`/purchases/${id}`);
    return data.data;
  },
  createPurchase: async (payload) => {
    return await api.post('/purchases', payload);
  },
  updatePurchase: async (id, payload) => {
    return await api.put(`/purchases/${id}`, payload);
  },
  deletePurchase: async (id) => {
    return await api.delete(`/purchases/${id}`);
  },
};
