import api from './api';

const appointmentService = {
  getAllAppointments: async () => {
    const response = await api.get('/receptionist/appointments/');
    return response.data;
  },

  getTodayAppointments: async () => {
    const response = await api.get('/receptionist/appointments/');
    return response.data;
  },

  updateAppointmentStatus: async (id, status) => {
    const response = await api.patch(`/receptionist/appointments/${id}/`, { AppointmentStatus: status });
    return response.data;
  },
};

export default appointmentService;

