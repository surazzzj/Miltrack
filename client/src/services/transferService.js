import api from './api';

export const transferService = {
  getTransfers: async (params = {}) => {
    return await api.get('/transfers', { params });
  },
  getTransferById: async (id) => {
    const data = await api.get(`/transfers/${id}`);
    return data.data;
  },
  createTransfer: async (payload) => {
    return await api.post('/transfers', payload);
  },
  updateTransferStatus: async (id, statusData) => {
    return await api.patch(`/transfers/${id}/status`, statusData);
  },
  deleteTransfer: async (id) => {
    return await api.delete(`/transfers/${id}`);
  },
};
