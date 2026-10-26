import api from './api';

const asList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

export const getApiErrorMessage = (error, fallback = 'Unable to complete the request.') => {
  const data = error?.response?.data;
  if (typeof data === 'string') return data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(' ') : messages}`)
      .join(' ') || fallback;
  }
  return error?.message || fallback;
};

const receptionistService = {
  async getPatients(search = '') {
    const response = await api.get('/receptionist/patients/', {
      params: search.trim() ? { search: search.trim() } : undefined,
    });
    return asList(response.data);
  },

  async createPatient(payload) {
    const response = await api.post('/receptionist/patients/', payload);
    return response.data;
  },

  async getAppointments() {
    const response = await api.get('/receptionist/appointments/');
    return asList(response.data);
  },

  async createAppointment(payload) {
    const response = await api.post('/receptionist/appointments/', payload);
    return response.data;
  },

  async updateAppointment(id, payload) {
    const response = await api.patch(`/receptionist/appointments/${id}/`, payload);
    return response.data;
  },

  async cancelAppointment(id) {
    const response = await api.patch(`/receptionist/appointments/${id}/`, { AppointmentStatus: 'Cancelled' });
    return response.data;
  },

  async getTokens() {
    const response = await api.get('/receptionist/tokens/');
    return asList(response.data);
  },

  async getDoctors() {
    const response = await api.get('/doctors/');
    return asList(response.data);
  },

  async getBills() {
    const response = await api.get('/receptionist/bills/');
    return asList(response.data);
  },
};

export default receptionistService;
