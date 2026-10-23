import api from './api';

const patientService = {
  getAllPatients: async () => {
    const response = await api.get('/receptionist/patients/');
    return response.data;
  },

  getPatientById: async (id) => {
    const response = await api.get(`/receptionist/patients/${id}/`);
    return response.data;
  },
};

export default patientService;

