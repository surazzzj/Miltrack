import api from './api';

export const expenditureService = {
  getExpenditures: async (params = {}) => {
    return await api.get('/expenditures', { params });
  },
  getExpenditureById: async (id) => {
    const data = await api.get(`/expenditures/${id}`);
    return data.data;
  },
  createExpenditure: async (payload) => {
    return await api.post('/expenditures', payload);
  },
  deleteExpenditure: async (id) => {
    return await api.delete(`/expenditures/${id}`);
  },
};
