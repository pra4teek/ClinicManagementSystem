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
    appointmentId: 'APT-1',
    patientId: 'PAT-1',
    patientName: 'Arjun Ravi',
    age: 45,
    gender: 'Male',
    phone: '9876543210',
    bloodGroup: 'O+',
    doctorName: 'Dr. Prateek Pradeep',
    tokenNumber: 1,
    time: '10:00 AM',
    status: 'Scheduled',
    reason: 'Frequent headaches, dizziness, and mild fever'
  },
  {
    id: 2,
    appointmentId: 'APT-2',
    patientId: 'PAT-2',
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
    appointmentId: 'APT-3',
    patientId: 'PAT-3',
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
    appointmentId: 'APT-4',
    patientId: 'PAT-5',
    patientName: 'Vikram Malhotra',
    date: '2026-10-22',
    doctorName: 'Dr. Prateek Pradeep',
    vitals: { bp: '130/85', pulse: '78', temp: '37.0', weight: '76' },
    symptoms: 'Occasional occipital headaches and post-prandial heartburn',
    diagnosis: 'Hypertension Grade 1 & Acid Peptic Disease',
    remarks: 'Low salt diet, morning walks, avoid spicy meals and follow up after 2 weeks',
    medicines: [
      { name: 'Omeprazole 20mg', dosage: '1 tablet', freq: '1-0-0', timing: 'Before Food', duration: '14 Days' }
    ],
    labTests: ['Lipid Profile'],
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
  // ── APPOINTMENT QUEUE (FETCHES REAL MYSQL BACKEND DATA) ───────────
  getAppointments: async () => {
    try {
      const [apptsRes, tokensRes, patientsRes] = await Promise.all([
        api.get('/receptionist/appointments/'),
        api.get('/receptionist/tokens/'),
        api.get('/receptionist/patients/'),
      ]);

      const appts = Array.isArray(apptsRes.data) ? apptsRes.data : [];
      const tokens = Array.isArray(tokensRes.data) ? tokensRes.data : [];
      const patients = Array.isArray(patientsRes.data) ? patientsRes.data : [];

      if (appts.length > 0) {
        const mapped = appts.map((a) => {
          const pat = patients.find((p) => p.PatientId === a.PatientId) || {};
          const tok = tokens.find((t) => t.AppointmentId === a.AppointmentId) || {};

          let formattedTime = '10:00 AM';
          if (a.AppointmentDateTime) {
            try {
              formattedTime = new Date(a.AppointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (e) {}
          }

          let age = 30;
          if (pat.DOB) {
            const birthYear = new Date(pat.DOB).getFullYear();
            age = new Date().getFullYear() - birthYear;
          }

          return {
            id: a.AppointmentId,
            appointmentId: `APT-${a.AppointmentId}`,
            rawId: a.AppointmentId,
            patientId: `PAT-${pat.PatientId || a.PatientId}`,
            rawPatientId: pat.PatientId || a.PatientId,
            patientName: pat.Name || `Patient #${a.PatientId}`,
            age: age,
            gender: pat.Gender || 'Male',
            phone: pat.PhoneNumber || '—',
            bloodGroup: pat.BloodGroup || 'O+',
            doctorName: 'Dr. Prateek Pradeep',
            tokenNumber: tok.TokenNo || a.AppointmentId,
            time: formattedTime,
            status: a.AppointmentStatus || 'Scheduled',
            reason: a.AppointmentStatus === 'Completed' ? 'Follow-up checkup' : 'Clinical consultation & checkup'
          };
        });

        saveLocal(STORAGE_KEYS.APPOINTMENTS, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('API getAppointments fallback:', err);
    }
    const local = getLocal(STORAGE_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
    saveLocal(STORAGE_KEYS.APPOINTMENTS, local);
    return local;
  },

  // ── PATIENTS CATALOG ─────────────────────────────────────────────
  getPatients: async () => {
    try {
      const res = await api.get('/receptionist/patients/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((p) => {
          let age = 30;
          if (p.DOB) {
            const birthYear = new Date(p.DOB).getFullYear();
            age = new Date().getFullYear() - birthYear;
          }
          return {
            patientId: `PAT-${p.PatientId}`,
            rawId: p.PatientId,
            name: p.Name,
            age,
            gender: p.Gender,
            phone: p.PhoneNumber,
            bloodGroup: p.BloodGroup || 'O+',
            address: p.Address,
            weight: p.Weight,
            height: p.Height
          };
        });
        saveLocal('cms_patients', mapped);
        return mapped;
      }
    } catch (e) {}
    return getLocal('cms_patients', []);
  },

  // ── UPDATE APPOINTMENT STATUS ────────────────────────────────────
  updateAppointmentStatus: async (appointmentId, newStatus) => {
    const rawId = typeof appointmentId === 'string' && appointmentId.startsWith('APT-')
      ? appointmentId.replace('APT-', '')
      : appointmentId;

    try {
      await api.patch(`/receptionist/appointments/${rawId}/`, { AppointmentStatus: newStatus });
    } catch (err) {}

    // Update local cache
    const appts = getLocal(STORAGE_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
    const updated = appts.map((a) => {
      if (String(a.appointmentId) === String(appointmentId) || String(a.id) === String(appointmentId) || String(a.rawId) === String(rawId)) {
        return { ...a, status: newStatus };
      }
      return a;
    });
    saveLocal(STORAGE_KEYS.APPOINTMENTS, updated);
    return updated;
  },

  // ── CONSULTATIONS ────────────────────────────────────────────────
  getAllConsultations: async () => {
    try {
      const [consRes, patsRes, repsRes] = await Promise.all([
        api.get('/consultations/'),
        api.get('/receptionist/patients/').catch(() => ({ data: [] })),
        api.get('/lab/lab-reports/').catch(() => ({ data: [] }))
      ]);

      const patsList = Array.isArray(patsRes.data) ? patsRes.data : [];
      const labReportsList = Array.isArray(repsRes.data) ? repsRes.data : [];

      if (Array.isArray(consRes.data) && consRes.data.length > 0) {
        const mapped = consRes.data.map((c) => {
          const pat = patsList.find((p) => p.PatientId === c.PatientId);
          const rxDetails = c.prescription_details && c.prescription_details[0];
          const items = rxDetails && rxDetails.item_details
            ? rxDetails.item_details.map((it) => ({
                medicineName: it.Medicine?.MedicineName || 'Medicine',
                dosage: it.Dosage?.DosageValue || '500mg',
                frequency: it.Frequency || '1-0-1',
                duration: it.Duration || '5 Days',
                instructions: it.Dosage?.Instructions || 'After Food'
              }))
            : [];

          const labItems = c.lab_prescription_details
            ? c.lab_prescription_details.map((l) => l.LabTest?.TestName).filter(Boolean)
            : [];

          return {
            id: `CNS-${c.ConsultationId}`,
            consultationId: `CNS-${c.ConsultationId}`,
            rawId: c.ConsultationId,
            appointmentId: `APT-${c.AppointmentId}`,
            patientId: `PAT-${c.PatientId}`,
            patientName: pat?.Name || `Patient #${c.PatientId}`,
            doctorName: 'Dr. Prateek Pradeep',
            date: new Date().toISOString().split('T')[0],
            vitals: { bp: '130/85', pulse: '78', temp: '37.0', weight: '76' },
            symptoms: c.Symptoms,
            diagnosis: c.Diagnosis,
            remarks: c.Remarks,
            medicines: items,
            labTests: labItems,
            status: c.ConsultationStatus || 'Completed'
          };
        });
        saveLocal(STORAGE_KEYS.CONSULTATIONS, mapped);

        // Sync Prescriptions to localStorage
        const rxList = consRes.data
          .filter((c) => c.prescription_details && c.prescription_details.length > 0)
          .map((c) => {
            const rx = c.prescription_details[0];
            const pat = patsList.find((p) => p.PatientId === c.PatientId);
            return {
              prescriptionId: `RX-${rx.PrescriptionId}`,
              rawId: rx.PrescriptionId,
              consultationId: `CNS-${c.ConsultationId}`,
              appointmentId: `APT-${c.AppointmentId}`,
              patientId: `PAT-${c.PatientId}`,
              patientName: pat?.Name || `Patient #${c.PatientId}`,
              doctorName: 'Dr. Prateek Pradeep',
              date: rx.PrescriptionDateTime ? rx.PrescriptionDateTime.split('T')[0] : new Date().toISOString().split('T')[0],
              time: '10:00 AM',
              symptoms: c.Symptoms,
              diagnosis: c.Diagnosis,
              items: rx.item_details
                ? rx.item_details.map((it) => ({
                    medicineName: it.Medicine?.MedicineName || 'Medicine',
                    dosage: it.Dosage?.DosageValue || '500mg',
                    frequency: it.Frequency || '1-0-1',
                    duration: it.Duration || '5 Days',
                    instructions: it.Dosage?.Instructions || 'After Food'
                  }))
                : [],
              status: rx.Status || 'Dispensed'
            };
          });
        if (rxList.length > 0) {
          saveLocal(STORAGE_KEYS.PRESCRIPTIONS, rxList);
        }

        // Sync Lab Orders and Lab Reports to localStorage
        const labOrders = [];
        const labReports = [];

        consRes.data.forEach((c) => {
          if (c.lab_prescription_details && c.lab_prescription_details.length > 0) {
            const pat = patsList.find((p) => p.PatientId === c.PatientId);
            c.lab_prescription_details.forEach((lp) => {
              const testTitle = lp.LabTest?.TestName || 'Diagnostic Evaluation';
              const orderId = `LAB-${lp.LabPrescriptionId}`;

              labOrders.push({
                labOrderId: orderId,
                rawId: lp.LabPrescriptionId,
                consultationId: `CNS-${c.ConsultationId}`,
                appointmentId: `APT-${c.AppointmentId}`,
                patientId: `PAT-${c.PatientId}`,
                patientName: pat?.Name || `Patient #${c.PatientId}`,
                doctorName: 'Dr. Prateek Pradeep',
                date: lp.LabTestDate ? lp.LabTestDate.split('T')[0] : new Date().toISOString().split('T')[0],
                time: '10:00 AM',
                createdAt: Date.now(),
                tests: [testTitle],
                remarks: 'Requested by Dr. Prateek Pradeep',
                status: lp.Status || 'Completed'
              });

              const matchedReport = labReportsList.find((r) => r.LabPrescriptionId === lp.LabPrescriptionId);
              if (matchedReport) {
                labReports.push({
                  reportId: `REP-${matchedReport.ReportId}`,
                  rawId: matchedReport.ReportId,
                  labOrderId: orderId,
                  appointmentId: `APT-${c.AppointmentId}`,
                  patientId: `PAT-${c.PatientId}`,
                  patientName: pat?.Name || `Patient #${c.PatientId}`,
                  testName: testTitle,
                  actualReading: matchedReport.ActualReading,
                  normalValue: '< 200 mg/dL',
                  remarks: matchedReport.remarks,
                  reportDate: matchedReport.ReportDate ? matchedReport.ReportDate.split('T')[0] : '2026-10-23',
                  technicianName: 'Malathi Sreekumar (Certified Lab Technologist)'
                });
              }
            });
          }
        });

        if (labOrders.length > 0) {
          saveLocal(STORAGE_KEYS.LAB_ORDERS, labOrders);
        }
        if (labReports.length > 0) {
          saveLocal('cms_lab_reports', labReports);
        }

        return mapped;
      }
    } catch (err) {
      console.warn('API getAllConsultations fallback:', err);
    }

    return getLocal(STORAGE_KEYS.CONSULTATIONS, DEFAULT_CONSULTATIONS);
  },

  // ── SAVE CONSULTATION TO BACKEND ─────────────────────────────────
  createConsultation: async (consultationData, rxData, labData) => {
    try {
      const rawApptId = typeof consultationData.appointmentId === 'string' && consultationData.appointmentId.startsWith('APT-')
        ? parseInt(consultationData.appointmentId.replace('APT-', ''), 10)
        : parseInt(consultationData.appointmentId, 10);

      const rawPatId = typeof consultationData.patientId === 'string' && consultationData.patientId.startsWith('PAT-')
        ? parseInt(consultationData.patientId.replace('PAT-', ''), 10)
        : parseInt(consultationData.patientId, 10);

      const consPayload = {
        AppointmentId: rawApptId,
        PatientId: rawPatId,
        DoctorId: 3, // Dr. Prateek Pradeep (seeded DoctorId: 3)
        ConsultationStatus: 'Completed',
        Diagnosis: (consultationData.diagnosis || 'Clinical evaluation').slice(0, 100),
        Symptoms: (consultationData.symptoms || 'General discomfort').slice(0, 100),
        Remarks: consultationData.remarks || 'Consultation completed'
      };

      const consRes = await api.post('/consultations/', consPayload);
      const createdConsId = consRes.data?.ConsultationId;

      // If prescription items exist, save prescription
      if (rxData && rxData.items && rxData.items.length > 0 && createdConsId) {
        try {
          const medsRes = await api.get('/pharmacist/medicines/');
          const medsList = Array.isArray(medsRes.data) ? medsRes.data : [];

          const rxPayload = {
            ConsultationId: createdConsId,
            PatientId: rawPatId,
            DoctorId: 3,
            PrescriptionDateTime: new Date().toISOString(),
            Status: 'Pending',
            items: rxData.items.map((it) => {
              const matchedMed = medsList.find((m) => m.MedicineName.toLowerCase().includes(it.medicineName.toLowerCase()) || it.medicineName.toLowerCase().includes(m.MedicineName.toLowerCase()));
              return {
                MedicineId: matchedMed ? matchedMed.MedicineId : 1,
                DosageId: 1,
                Duration: it.duration || '5 Days',
                Frequency: it.frequency || '1-0-1'
              };
            })
          };
          await api.post('/prescriptions/', rxPayload);
        } catch (rxErr) {
          console.warn('Prescription backend creation error:', rxErr?.response?.data || rxErr?.message);
        }
      }

      // If lab tests requested
      if (labData && labData.tests && labData.tests.length > 0 && createdConsId) {
        try {
          const testsRes = await api.get('/lab/lab-tests/');
          const testsList = Array.isArray(testsRes.data) ? testsRes.data : [];

          for (const testName of labData.tests) {
            const matchedTest = testsList.find((t) => testName.toLowerCase().includes(t.TestName.toLowerCase()) || t.TestName.toLowerCase().includes(testName.toLowerCase()));
            if (matchedTest) {
              await api.post('/lab/lab-prescriptions/', {
                ConsultationId: createdConsId,
                PatientId: rawPatId,
                DoctorId: 3,
                LabTestId: matchedTest.LabtestId,
                Status: 'Pending',
                SampleType: 'Venous Blood',
                LabTestDate: new Date().toISOString()
              });
            }
          }
        } catch (labErr) {
          console.warn('Lab prescription backend creation error:', labErr?.response?.data || labErr?.message);
        }
      }

      // Update appointment status in backend
      await api.patch(`/receptionist/appointments/${rawApptId}/`, {
        AppointmentStatus: 'Completed'
      });

      return consRes.data;
    } catch (err) {
      console.warn('Backend consultation sync error (saved locally):', err?.response?.data || err?.message);
    }
  },

  // ── MEDICINES CATALOG (FETCHES REAL MYSQL PHARMACY INVENTORY) ────
  getMedicineCatalog: async () => {
    try {
      const response = await api.get('/pharmacist/medicines/');
      if (Array.isArray(response.data) && response.data.length > 0) {
        const mapped = response.data.map((m) => ({
          id: `MED-${m.MedicineId}`,
          rawId: m.MedicineId,
          name: m.MedicineName,
          dosage: '500mg',
          type: m.Category || 'Tablet',
          quantity: 50,
          mrp: m.MRP
        }));
        saveLocal('cms_medicines', mapped);
        return mapped;
      }
    } catch (err) {}

    return getLocal('cms_medicines', [
      { id: 'MED-1', name: 'Paracetamol 500mg', dosage: '500mg', type: 'Tablet', quantity: 50 },
      { id: 'MED-2', name: 'Amoxicillin 500mg', dosage: '500mg', type: 'Capsule', quantity: 45 },
      { id: 'MED-3', name: 'Cetirizine 10mg', dosage: '10mg', type: 'Tablet', quantity: 60 },
      { id: 'MED-4', name: 'Metformin 500mg', dosage: '500mg', type: 'Tablet', quantity: 30 },
      { id: 'MED-5', name: 'Omeprazole 20mg', dosage: '20mg', type: 'Capsule', quantity: 40 },
      { id: 'MED-6', name: 'Ibuprofen 400mg', dosage: '400mg', type: 'Tablet', quantity: 50 },
      { id: 'MED-7', name: 'Azithromycin 500mg', dosage: '500mg', type: 'Tablet', quantity: 25 },
      { id: 'MED-8', name: 'Pantoprazole 40mg', dosage: '40mg', type: 'Tablet', quantity: 70 },
      { id: 'MED-9', name: 'Cough Syrup (Ascoril-D)', dosage: '10ml', type: 'Syrup', quantity: 15 },
      { id: 'MED-10', name: 'Salbutamol Inhaler 100mcg', dosage: '100mcg', type: 'Inhaler', quantity: 12 },
    ]);
  },

  // ── LAB TESTS CATALOG (FETCHES REAL MYSQL LAB TESTS) ─────────────
  getLabCatalog: async () => {
    try {
      const response = await api.get('/lab/lab-tests/');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map((t) => ({
          id: t.LabtestId,
          name: t.TestName,
          sample: 'Blood / Specimen',
          ref: t.NormalName,
          cost: t.TestCost
        }));
      }
    } catch (err) {}

    return [
      { id: 1, name: 'Complete Blood Count (CBC)', sample: 'Blood', ref: '4.5-5.5 M/uL', cost: 300 },
      { id: 2, name: 'Fasting Blood Sugar (FBS)', sample: 'Blood', ref: '70-99 mg/dL', cost: 150 },
      { id: 3, name: 'Lipid Profile', sample: 'Blood', ref: '< 200 mg/dL', cost: 650 },
      { id: 4, name: 'Urine Routine Examination', sample: 'Urine', ref: 'Normal', cost: 200 },
      { id: 5, name: 'Thyroid Profile (T3, T4, TSH)', sample: 'Blood', ref: 'TSH 0.4-4.2 uIU/mL', cost: 550 },
      { id: 6, name: 'Chest X-Ray PA View', sample: 'Imaging', ref: 'Clear fields', cost: 500 },
      { id: 7, name: 'Serum Creatinine', sample: 'Blood', ref: '0.7-1.3 mg/dL', cost: 180 },
      { id: 8, name: 'Liver Function Test (LFT)', sample: 'Blood', ref: 'Normal enzymes', cost: 750 }
    ];
  },
};

export default doctorService;
