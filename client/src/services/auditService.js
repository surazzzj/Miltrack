import api from './api';

export const auditService = {
  getAuditLogs: async (params = {}) => {
    return await api.get('/audit-logs', { params });
  },
  getAuditLogById: async (id) => {
    const data = await api.get(`/audit-logs/${id}`);
    return data.data;
  },
};
