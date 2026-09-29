import api from './api';

export const equipmentService = {
  getEquipment: async (params = {}) => {
    return await api.get('/equipment', { params });
  },
  getEquipmentById: async (id) => {
    const data = await api.get(`/equipment/${id}`);
    return data.data;
  },
  createEquipment: async (payload) => {
    return await api.post('/equipment', payload);
  },
  updateEquipment: async (id, payload) => {
    return await api.put(`/equipment/${id}`, payload);
  },
};
