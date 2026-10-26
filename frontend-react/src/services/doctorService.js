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
  getDoctors: async () => {
    try {
      const res = await api.get('/doctors/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {}
    return [];
  },

  getAppointments: async () => {
    try {
      const [apptsRes, tokensRes, patientsRes, doctorsRes] = await Promise.all([
        api.get('/receptionist/appointments/'),
        api.get('/receptionist/tokens/'),
        api.get('/receptionist/patients/'),
        api.get('/doctors/').catch(() => ({ data: [] })),
      ]);

      const appts = Array.isArray(apptsRes.data) ? apptsRes.data : [];
      const tokens = Array.isArray(tokensRes.data) ? tokensRes.data : [];
      const patients = Array.isArray(patientsRes.data) ? patientsRes.data : [];
      const doctors = Array.isArray(doctorsRes.data) ? doctorsRes.data : [];

      const mapped = appts.map((a) => {
        const pat = patients.find((p) => Number(p.PatientId) === Number(a.PatientId)) || {};
        const tok = tokens.find((t) => Number(t.AppointmentId) === Number(a.AppointmentId)) || {};
        const doc = doctors.find((d) => Number(d.DoctorId) === Number(a.DoctorId)) || {};

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

        const resolvedDoctorName = doc.Name
          ? (doc.Name.startsWith('Dr.') ? doc.Name : `Dr. ${doc.Name}`)
          : (a.DoctorName ? (a.DoctorName.startsWith('Dr.') ? a.DoctorName : `Dr. ${a.DoctorName}`) : 'Doctor');

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
          doctorId: a.DoctorId,
          doctorName: resolvedDoctorName,
          tokenNumber: tok.TokenNo || a.AppointmentId,
          time: formattedTime,
          status: a.AppointmentStatus || 'Scheduled',
          reason: a.AppointmentStatus === 'Completed' ? 'Follow-up checkup' : 'Clinical consultation & checkup'
        };
      });

      saveLocal(STORAGE_KEYS.APPOINTMENTS, mapped);
      return mapped;
    } catch (err) {
      console.warn('API getAppointments error:', err);
      return getLocal(STORAGE_KEYS.APPOINTMENTS, []);
    }
  },

  resetAllAppointmentsStatus: async (doctorId = null) => {
    try {
      const payload = doctorId ? { doctor_id: doctorId } : {};
      const res = await api.post('/receptionist/appointments/reset-all-status/', payload);
      const localAppts = getLocal(STORAGE_KEYS.APPOINTMENTS, []);
      const updated = localAppts.map((a) => {
        if (!doctorId || Number(a.doctorId) === Number(doctorId)) {
          return { ...a, status: 'Scheduled' };
        }
        return a;
      });
      saveLocal(STORAGE_KEYS.APPOINTMENTS, updated);
      return res.data;
    } catch (err) {
      console.warn('API resetAllAppointmentsStatus error:', err);
      throw err;
    }
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

    await api.patch(`/receptionist/appointments/${rawId}/`, { AppointmentStatus: newStatus });

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
      const [consRes, patsRes, repsRes, labOrdersRes] = await Promise.all([
        api.get('/consultations/'),
        api.get('/receptionist/patients/').catch(() => ({ data: [] })),
        api.get('/lab/lab-reports/').catch(() => ({ data: [] })),
        api.get('/lab/lab-prescriptions/').catch(() => ({ data: [] })),
      ]);

      const patsList = Array.isArray(patsRes.data) ? patsRes.data : [];
      const labReportsList = Array.isArray(repsRes.data) ? repsRes.data : [];

      if (Array.isArray(consRes.data)) {
        const mapped = consRes.data.map((c) => {
          const pat = patsList.find((p) => p.PatientId === c.PatientId);
          const rxDetails = c.prescription_details && c.prescription_details[0];
          const items = rxDetails && rxDetails.item_details
            ? rxDetails.item_details.map((it) => ({
                medicineName: it.Medicine?.MedicineName || 'Medicine',
                dosage: it.Dosage?.DosageValue || '500mg',
                frequency: it.Frequency || '1-0-1',
                duration: it.Duration || '5 Days',
                instructions: it.Instructions || it.Dosage?.Instructions || ''
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
                    instructions: it.Instructions || it.Dosage?.Instructions || '',
                    quantity: Number(it.Quantity || 1)
                  }))
                : [],
              status: rx.Status || 'Not Dispensed'
            };
          });
        saveLocal(STORAGE_KEYS.PRESCRIPTIONS, rxList);

        // Sync Lab Orders and Lab Reports to localStorage
        const labOrderRows = Array.isArray(labOrdersRes.data) ? labOrdersRes.data : [];
        const consultationById = new Map(consRes.data.map((item) => [String(item.ConsultationId), item]));
        const labOrders = labOrderRows.map((lp) => {
          const consultation = consultationById.get(String(lp.ConsultationId));
          const testTitle = lp.TestName || lp.LabTest?.TestName || 'Lab Test';
          const orderId = `LAB-${lp.LabPrescriptionId}`;
          return {
            labOrderId: orderId,
            rawId: lp.LabPrescriptionId,
            consultationId: lp.ConsultationId ? `CNS-${lp.ConsultationId}` : null,
            appointmentId: consultation ? `APT-${consultation.AppointmentId}` : null,
            patientId: `PAT-${lp.PatientId}`,
            patientName: lp.PatientName || `Patient #${lp.PatientId}`,
            doctorName: lp.DoctorName || 'Doctor',
            date: lp.LabTestDate ? lp.LabTestDate.split('T')[0] : '',
            time: lp.LabTestDate ? new Date(lp.LabTestDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            createdAt: lp.LabTestDate || '',
            tests: [testTitle],
            remarks: 'Requested by doctor',
            status: lp.Status || 'Pending',
          };
        });
        const labOrderById = new Map(labOrders.map((order) => [String(order.rawId), order]));
        const labReports = labReportsList.map((report) => ({
          reportId: `REP-${report.ReportId}`,
          rawId: report.ReportId,
          labOrderId: `LAB-${report.LabPrescriptionId}`,
          patientId: labOrderById.get(String(report.LabPrescriptionId))?.patientId || '',
          patientName: report.PatientName || 'Patient',
          doctorName: report.DoctorName || 'Doctor',
          testName: report.TestName || 'Lab Test',
          actualReading: report.ActualReading,
          normalValue: report.NormalName || '',
          remarks: report.remarks,
          reportDate: report.ReportDate ? report.ReportDate.split('T')[0] : '',
          technicianName: report.LabTechnicianName || 'Lab Technician',
        }));
        saveLocal(STORAGE_KEYS.LAB_ORDERS, labOrders);
        saveLocal('cms_lab_reports', labReports);

        return mapped;
      }
    } catch (err) {
      console.warn('API getAllConsultations fallback:', err);
    }

    return getLocal(STORAGE_KEYS.CONSULTATIONS, DEFAULT_CONSULTATIONS);
  },

  // ── SAVE CONSULTATION TO BACKEND ─────────────────────────────────
  createConsultation: async (consultationData, rxData, labData) => {
    const rawId = (value, prefix) => {
      const text = String(value ?? '');
      return Number(text.startsWith(prefix) ? text.slice(prefix.length) : text);
    };
    const appointmentId = rawId(consultationData.appointmentId, 'APT-');
    const patientId = rawId(consultationData.patientId, 'PAT-');
    if (!Number.isInteger(appointmentId) || !Number.isInteger(patientId)) {
      throw new Error('The selected appointment or patient is not linked to a database record. Refresh the queue and try again.');
    }

    const response = await api.post('/consultations/complete/', {
      AppointmentId: appointmentId,
      PatientId: patientId,
      Diagnosis: consultationData.diagnosis,
      Symptoms: consultationData.symptoms,
      Remarks: consultationData.remarks || '',
      prescription_items: (rxData?.items || []).map((item) => ({
        medicineName: item.medicineName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
        quantity: item.quantity,
      })),
      lab_orders: (labData?.tests || []).map((testName) => ({ testName })),
    });
    return response.data;
  },

  // ── INSTANT LAB TEST REQUEST ─────────────────────────────────────
  requestLabTest: async (patientId, tests) => {
    try {
      const rawPatId = typeof patientId === 'string' ? parseInt(patientId.replace(/\D/g, ''), 10) : patientId;
      if (!Number.isInteger(rawPatId)) throw new Error('Choose a patient linked to a database record.');
      const response = await api.post('/lab/lab-prescriptions/request-batch/', {
        PatientId: rawPatId,
        tests,
        SampleType: 'Diagnostic Specimen',
      });
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message || 'Lab order could not be saved.');
    }
  },

  // ── MEDICINES CATALOG (FETCHES REAL MYSQL PHARMACY INVENTORY) ────
  getMedicineCatalog: async () => {
    try {
      const [response, stockResponse] = await Promise.all([
        api.get('/pharmacist/medicines/'),
        api.get('/pharmacist/stock/'),
      ]);
      if (Array.isArray(response.data)) {
        const stockRows = Array.isArray(stockResponse.data) ? stockResponse.data : [];
        const stockByMedicine = new Map(stockRows.map((row) => [
          Number(row.Medicine?.MedicineId || row.Medicine), row,
        ]));
        const mapped = response.data.map((m) => {
          const stock = stockByMedicine.get(Number(m.MedicineId));
          return ({
          id: `MED-${m.MedicineId}`,
          rawId: m.MedicineId,
          name: m.MedicineName,
          dosage: '500mg',
          type: m.Category || 'Tablet',
          quantity: Number(stock?.QuantityOnHand || 0),
          mrp: stock?.SellingPrice || m.MRP,
        });
        });
        saveLocal('cms_medicines', mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Backend medicine and stock fetch error:', err);
      return [];
    }
    return [];
  },

  // ── LAB TESTS CATALOG (FETCHES REAL MYSQL LAB TESTS) ─────────────
  getLabCatalog: async () => {
    try {
      const response = await api.get('/lab/lab-tests/');
      if (Array.isArray(response.data)) {
        return response.data.map((t) => ({
          id: t.LabtestId,
          name: t.TestName,
          sample: 'Blood / Specimen',
          ref: t.NormalName,
          cost: t.TestCost
        }));
      }
    } catch (err) {
      console.warn('Backend lab test fetch error:', err);
      return [];
    }
    return [];
  },
};

export default doctorService;
