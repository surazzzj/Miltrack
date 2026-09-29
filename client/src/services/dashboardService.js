import api from './api';

export const dashboardService = {
  getSummary: async (params = {}) => {
    const data = await api.get('/dashboard/summary', { params });
    return data.data;
  },
};
