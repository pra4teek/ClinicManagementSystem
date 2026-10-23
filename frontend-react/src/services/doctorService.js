import api from './api';

const doctorService = {
  // Doctor profile & list
  getAllDoctors: async () => {
    const response = await api.get('/doctors/');
    return response.data;
  },

  getDoctorById: async (id) => {
    const response = await api.get(`/doctors/${id}/`);
    return response.data;
  },

  // Consultations
  getAllConsultations: async (doctorId = null) => {
    const url = doctorId ? `/consultations/?doctor_id=${doctorId}` : '/consultations/';
    const response = await api.get(url);
    return response.data;
  },

  getConsultationById: async (id) => {
    const response = await api.get(`/consultations/${id}/`);
    return response.data;
  },

  createConsultation: async (consultationData) => {
    const response = await api.post('/consultations/', consultationData);
    return response.data;
  },

  updateConsultation: async (id, consultationData) => {
    const response = await api.put(`/consultations/${id}/`, consultationData);
    return response.data;
  },

  // Prescriptions
  getPrescriptions: async () => {
    const response = await api.get('/prescriptions/');
    return response.data;
  },

  createPrescription: async (prescriptionData) => {
    const response = await api.post('/prescriptions/', prescriptionData);
    return response.data;
  },

  // Lab Orders
  createLabPrescription: async (labData) => {
    const response = await api.post('/lab-prescriptions/', labData);
    return response.data;
  },
};

export default doctorService;

