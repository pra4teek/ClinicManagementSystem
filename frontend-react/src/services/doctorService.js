import api from './api';

// Storage keys for seamless persistence & cross-module offline fallback
const STORAGE_KEYS = {
  APPOINTMENTS: 'cms_appointments',
  CONSULTATIONS: 'cms_consultations',
  PRESCRIPTIONS: 'cms_prescriptions',
  LAB_ORDERS: 'cms_lab_orders',
};

const DEFAULT_APPOINTMENTS = [
  {
    id: 1,
    appointmentId: 'APT-2001',
    patientId: 'PAT-1001',
    patientName: 'Arjun Ravi',
    age: 45,
    gender: 'Male',
    phone: '9876543210',
    bloodGroup: 'O+',
    doctorName: 'Dr. Prateek Pradeep',
    tokenNumber: 1,
    time: '10:00 AM',
    status: 'Waiting',
    reason: 'Frequent headaches, dizziness, and mild fever for 3 days'
  },
  {
    id: 2,
    appointmentId: 'APT-2002',
    patientId: 'PAT-1002',
    patientName: 'Rohit Krishna',
    age: 29,
    gender: 'Male',
    phone: '9845123456',
    bloodGroup: 'A+',
    doctorName: 'Dr. Prateek Pradeep',
    tokenNumber: 2,
    time: '10:30 AM',
    status: 'Scheduled',
    reason: 'Severe throat pain, difficulty swallowing, and dry cough'
  },
  {
    id: 3,
    appointmentId: 'APT-2003',
    patientId: 'PAT-1003',
    patientName: 'Priya Nair',
    age: 38,
    gender: 'Female',
    phone: '9895012345',
    bloodGroup: 'B+',
    doctorName: 'Dr. Prateek Pradeep',
    tokenNumber: 3,
    time: '11:00 AM',
    status: 'Scheduled',
    reason: 'Acid reflux, bloating after meals, epigastric discomfort'
  }
];

const DEFAULT_CONSULTATIONS = [
  {
    id: 'CNS-101',
    appointmentId: 'APT-1998',
    patientId: 'PAT-1001',
    patientName: 'Arjun Ravi',
    date: '2026-10-22',
    doctorName: 'Dr. Prateek Pradeep',
    vitals: { bp: '120/80', pulse: '76', temp: '98.6', weight: '70', height: '175', bmi: '22.9' },
    symptoms: 'Mild body ache and occasional dry cough',
    diagnosis: 'Acute Pharyngitis & Mild Upper Respiratory Infection',
    remarks: 'Adequate hydration, warm water gargles thrice daily',
    medicines: [
      { name: 'Paracetamol 500mg', dosage: '500mg', freq: '1-0-1', timing: 'After Food', duration: '3 Days' },
      { name: 'Cetirizine 10mg', dosage: '10mg', freq: '0-0-1', timing: 'After Food', duration: '5 Days' }
    ],
    labTests: ['Complete Blood Count (CBC)'],
    status: 'Completed'
  }
];

// Helper to get from localStorage
function getLocal(key, defaultVal) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

// Helper to save to localStorage
function saveLocal(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

const doctorService = {
  // ── APPOINTMENT QUEUE ───────────────────────────────────────────
  getAppointments: async () => {
    try {
      const response = await api.get('/appointments/');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (err) {
      // Backend offline or error -> use fallback
    }
    const local = getLocal(STORAGE_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
    saveLocal(STORAGE_KEYS.APPOINTMENTS, local);
    return local;
  },

  updateAppointmentStatus: async (appointmentId, newStatus) => {
    try {
      await api.patch(`/appointments/${appointmentId}/`, { status: newStatus });
    } catch (err) {}

    // Update local cache
    const appts = getLocal(STORAGE_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
    const updated = appts.map((a) => {
      if (a.appointmentId === appointmentId || a.id === appointmentId) {
        return { ...a, status: newStatus };
      }
      return a;
    });
    saveLocal(STORAGE_KEYS.APPOINTMENTS, updated);
    return updated;
  },

  // ── CONSULTATIONS ───────────────────────────────────────────────
  getAllConsultations: async () => {
    try {
      const response = await api.get('/consultations/');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (err) {}

    return getLocal(STORAGE_KEYS.CONSULTATIONS, DEFAULT_CONSULTATIONS);
  },

  getConsultationById: async (id) => {
    try {
      const response = await api.get(`/consultations/${id}/`);
      return response.data;
    } catch (err) {}

    const all = getLocal(STORAGE_KEYS.CONSULTATIONS, DEFAULT_CONSULTATIONS);
    return all.find((c) => c.id === id || String(c.id) === String(id)) || null;
  },

  createConsultation: async (consultationData) => {
    let savedRecord = null;
    try {
      const response = await api.post('/consultations/', consultationData);
      savedRecord = response.data;
    } catch (err) {
      console.warn('API save consultation unavailable, persisting locally.');
    }

    const newId = savedRecord?.id || `CNS-${Date.now().toString().slice(-4)}`;
    const fullRecord = {
      id: newId,
      date: new Date().toISOString().split('T')[0],
      status: 'Completed',
      ...consultationData,
    };

    // Save to local consultations history
    const history = getLocal(STORAGE_KEYS.CONSULTATIONS, DEFAULT_CONSULTATIONS);
    saveLocal(STORAGE_KEYS.CONSULTATIONS, [fullRecord, ...history]);

    // If prescription items exist, save to prescriptions table
    if (fullRecord.medicines && fullRecord.medicines.length > 0) {
      const rxRecord = {
        id: `RX-${Date.now().toString().slice(-4)}`,
        consultationId: newId,
        patientId: fullRecord.patientId,
        patientName: fullRecord.patientName,
        doctorName: fullRecord.doctorName || 'Dr. Prateek Pradeep',
        date: fullRecord.date,
        items: fullRecord.medicines,
        status: 'Prescribed', // For Pharmacist to dispense
      };
      const rxList = getLocal(STORAGE_KEYS.PRESCRIPTIONS, []);
      saveLocal(STORAGE_KEYS.PRESCRIPTIONS, [rxRecord, ...rxList]);
    }

    // Update appointment status to Completed
    if (fullRecord.appointmentId) {
      await doctorService.updateAppointmentStatus(fullRecord.appointmentId, 'Completed');
    }

    return fullRecord;
  },

  // ── PRESCRIPTIONS ───────────────────────────────────────────────
  getPrescriptions: async () => {
    try {
      const response = await api.get('/prescriptions/');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (err) {}

    const localRx = getLocal(STORAGE_KEYS.PRESCRIPTIONS, [
      {
        id: 'RX-1001',
        consultationId: 'CNS-101',
        patientId: 'PAT-1001',
        patientName: 'Arjun Ravi',
        doctorName: 'Dr. Prateek Pradeep',
        date: '2026-10-22',
        status: 'Dispensed',
        items: [
          { name: 'Paracetamol 500mg', dosage: '500mg', freq: '1-0-1', timing: 'After Food', duration: '3 Days' },
          { name: 'Cetirizine 10mg', dosage: '10mg', freq: '0-0-1', timing: 'After Food', duration: '5 Days' }
        ]
      }
    ]);
    return localRx;
  },

  // ── MEDICINES CATALOG (FOR PRESCRIPTION AUTOCOMPLETE) ───────────
  getMedicineCatalog: async () => {
    try {
      const response = await api.get('/pharmacist/medicines/');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (err) {}

    return [
      { id: 'MED-001', name: 'Paracetamol', dosage: '500mg', type: 'Tablet', stock: 50 },
      { id: 'MED-002', name: 'Amoxicillin', dosage: '500mg', type: 'Capsule', stock: 45 },
      { id: 'MED-003', name: 'Cetirizine', dosage: '10mg', type: 'Tablet', stock: 60 },
      { id: 'MED-004', name: 'Metformin', dosage: '500mg', type: 'Tablet', stock: 30 },
      { id: 'MED-005', name: 'Omeprazole', dosage: '20mg', type: 'Capsule', stock: 40 },
      { id: 'MED-006', name: 'Ibuprofen', dosage: '400mg', type: 'Tablet', stock: 50 },
      { id: 'MED-007', name: 'Azithromycin', dosage: '500mg', type: 'Tablet', stock: 25 },
      { id: 'MED-008', name: 'Pantoprazole', dosage: '40mg', type: 'Tablet', stock: 70 },
      { id: 'MED-009', name: 'Cough Syrup (Ascoril-D)', dosage: '10ml', type: 'Syrup', stock: 15 },
      { id: 'MED-010', name: 'Salbutamol Inhaler', dosage: '100mcg', type: 'Inhaler', stock: 12 },
    ];
  },

  // ── LAB TESTS CATALOG (FOR LAB ORDERING) ────────────────────────
  getLabCatalog: async () => {
    try {
      const response = await api.get('/lab/tests/');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (err) {}

    return [
      { id: 101, name: 'Complete Blood Count (CBC)', sample: 'Blood', ref: '4.5-5.5 M/µL', cost: 300 },
      { id: 102, name: 'Fasting Blood Sugar (FBS)', sample: 'Blood', ref: '70-100 mg/dL', cost: 150 },
      { id: 103, name: 'Postprandial Blood Sugar (PPBS)', sample: 'Blood', ref: '< 140 mg/dL', cost: 150 },
      { id: 104, name: 'Lipid Profile', sample: 'Blood', ref: '< 200 mg/dL', cost: 650 },
      { id: 105, name: 'Urine Routine Examination', sample: 'Urine', ref: 'Normal', cost: 200 },
      { id: 106, name: 'Liver Function Test (LFT)', sample: 'Blood', ref: 'Normal enzymes', cost: 750 },
      { id: 107, name: 'Kidney Function Test (KFT/RFT)', sample: 'Blood', ref: 'Creatinine 0.7-1.3', cost: 600 },
      { id: 108, name: 'Chest X-Ray (PA View)', sample: 'Imaging', ref: 'Clear fields', cost: 500 },
      { id: 109, name: '12-Lead Electrocardiogram (ECG)', sample: 'Cardio', ref: 'Normal sinus rhythm', cost: 350 },
      { id: 110, name: 'Thyroid Profile (T3, T4, TSH)', sample: 'Blood', ref: 'TSH 0.4-4.0 mIU/L', cost: 550 },
    ];
  },
};

export default doctorService;
