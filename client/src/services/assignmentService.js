import api from './api';

export const assignmentService = {
  getAssignments: async (params = {}) => {
    return await api.get('/assignments', { params });
  },
  getAssignmentById: async (id) => {
    const data = await api.get(`/assignments/${id}`);
    return data.data;
  },
  createAssignment: async (payload) => {
    return await api.post('/assignments', payload);
  },
  updateAssignment: async (id, payload) => {
    return await api.patch(`/assignments/${id}`, payload);
  },
  deleteAssignment: async (id) => {
    return await api.delete(`/assignments/${id}`);
  },
};
