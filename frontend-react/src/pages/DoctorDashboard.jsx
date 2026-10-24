import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import doctorService from '../services/doctorService';
import '../styles/doctor.css';

// SVG Icons matching original doctor portal
const EcgPulseIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const DashboardGridIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ClockHistoryIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const FlaskLabIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h4m6-5v5m0 0h-4m4 0h2" />
  </svg>
);

const DocumentCheckIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const SignOutIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const UsersQueueIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const EyePrescriptionIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const TrashIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const CalendarStatIcon = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const CheckCircleIcon = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// Storage Keys
const CMS_KEYS = {
  PATIENTS: 'cms_patients',
  APPOINTMENTS: 'cms_appointments',
  CONSULTATIONS: 'cms_consultations',
  PRESCRIPTIONS: 'cms_prescriptions',
  LAB_ORDERS: 'cms_lab_orders',
  LAB_REPORTS: 'cms_lab_reports',
  MEDICINES: 'cms_medicines',
  DRAFTS: 'cms_consultation_drafts'
};

// Clinical Normalizers
function normalizeDosage(raw) {
  const val = (raw || '').trim();
  if (!val) return null;
  if (/^\d+(\.\d+)?$/.test(val)) {
    const num = parseFloat(val);
    if (num <= 0) return null;
    return `${val}mg`;
  }
  const unitRegex = /^(\d+(\.\d+)?)\s*(mg|g|ml|mcg|iu|drops?|tabs?|tablets?|caps?|capsules?|puffs?|tsp|tbsp)$/i;
  const match = val.match(unitRegex);
  if (match) {
    const num = parseFloat(match[1]);
    if (num <= 0) return null;
    let unit = match[3].toLowerCase();
    if (unit === 'iu') unit = 'IU';
    else if (unit === 'ml') unit = 'ml';
    else if (unit.startsWith('tab')) unit = num === 1 ? 'tab' : 'tabs';
    else if (unit.startsWith('cap')) unit = num === 1 ? 'cap' : 'caps';
    else if (unit.startsWith('drop')) unit = num === 1 ? 'drop' : 'drops';
    else if (unit.startsWith('puff')) unit = num === 1 ? 'puff' : 'puffs';
    else unit = unit.charAt(0).toUpperCase() + unit.slice(1);
    const space = ['mg', 'g', 'ml', 'mcg', 'IU'].includes(unit) ? '' : ' ';
    return `${match[1]}${space}${unit}`;
  }
  return null;
}

function normalizeDuration(raw) {
  const val = (raw || '').trim();
  if (!val) return null;
  if (/^\d+$/.test(val)) {
    const num = parseInt(val, 10);
    if (num <= 0 || num > 365) return null;
    return num === 1 ? '1 Day' : `${num} Days`;
  }
  const durRegex = /^(\d+)\s*(days?|d|weeks?|w|months?|m)$/i;
  const match = val.match(durRegex);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num <= 0 || num > 365) return null;
    const unitPart = match[2].toLowerCase();
    if (unitPart.startsWith('d')) return num === 1 ? '1 Day' : `${num} Days`;
    if (unitPart.startsWith('w')) return num === 1 ? '1 Week' : `${num} Weeks`;
    if (unitPart.startsWith('m')) return num === 1 ? '1 Month' : `${num} Months`;
  }
  return null;
}

function evaluateLabReading(testName, readingStr, normalRef) {
  const name = String(testName || '').toLowerCase().trim();
  const valStr = String(readingStr || '').trim();
  const refStr = String(normalRef || '').trim().toLowerCase();

  if (!valStr || valStr === '—' || valStr === '-') return { isAbnormal: false, tag: 'RECORDED' };

  const valLower = valStr.toLowerCase();
  if (
    valStr.includes('(High)') || valStr.includes('(HIGH)') ||
    valLower.includes('elevated') || valLower.includes('positive') ||
    valLower.includes('critical') || valLower.includes('turbid') ||
    valLower.includes('abnormal')
  ) {
    return { isAbnormal: true, tag: 'HIGH' };
  }
  if (valStr.includes('(Low)') || valStr.includes('(LOW)') || valLower.includes('deficient')) {
    return { isAbnormal: true, tag: 'LOW' };
  }
  if (
    valLower === 'normal' || valLower === 'clear' || valLower === 'nil' ||
    valLower === 'negative' || valLower.includes('within normal limits') ||
    valLower.includes('clear lung fields')
  ) {
    return { isAbnormal: false, tag: 'NORMAL' };
  }

  const numMatch = valStr.match(/-?\d+(\.\d+)?/);
  if (!numMatch) return { isAbnormal: false, tag: 'NORMAL' };
  const val = parseFloat(numMatch[0]);

  if (name.includes('total chol') && val >= 200) return { isAbnormal: true, tag: 'HIGH' };
  if (name.includes('triglyceride') && val >= 150) return { isAbnormal: true, tag: 'HIGH' };
  if (name.includes('hdl') && val < 40) return { isAbnormal: true, tag: 'LOW' };
  if (name.includes('ldl') && val >= 100) return { isAbnormal: true, tag: 'HIGH' };
  if ((name.includes('fasting') || name.includes('fbs')) && val >= 100) return { isAbnormal: true, tag: 'HIGH' };
  if ((name.includes('fasting') || name.includes('fbs')) && val < 70) return { isAbnormal: true, tag: 'LOW' };
  if (name.includes('hba1c') && val >= 5.7) return { isAbnormal: true, tag: 'HIGH' };
  if ((name.includes('hemoglobin') || name === 'hb') && val < 12.0) return { isAbnormal: true, tag: 'LOW' };
  if (name.includes('creatinine') && val > 1.2) return { isAbnormal: true, tag: 'HIGH' };

  if (refStr && refStr.length < 35 && !refStr.includes('clear')) {
    if (refStr.includes('<')) {
      const m = refStr.match(/<\s*(\d+(\.\d+)?)/);
      if (m && val >= parseFloat(m[1])) return { isAbnormal: true, tag: 'HIGH' };
    } else if (refStr.includes('>')) {
      const m = refStr.match(/>\s*(\d+(\.\d+)?)/);
      if (m && val < parseFloat(m[1])) return { isAbnormal: true, tag: 'LOW' };
    } else if (refStr.includes('-')) {
      const m = refStr.match(/(\d+(\.\d+)?)\s*-\s*(\d+(\.\d+)?)/);
      if (m) {
        if (val < parseFloat(m[1])) return { isAbnormal: true, tag: 'LOW' };
        if (val > parseFloat(m[3])) return { isAbnormal: true, tag: 'HIGH' };
      }
    }
  }
  return { isAbnormal: false, tag: 'NORMAL' };
}

// LocalStorage helpers
function getStorage(key, defaultVal) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setStorage(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser() || { name: 'Dr. Prateek Pradeep', role: 'Doctor' };

  // Navigation tab state: 'dashboard' | 'history' | 'labrequests' | 'labresults'
  const [activeSection, setActiveSection] = useState('dashboard');

  // Queue & Consultation State
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [activeAppt, setActiveAppt] = useState(null);
  const [queueFilter, setQueueFilter] = useState('all'); // 'all' | 'Scheduled' | 'Completed'

  // Consultation Form State
  const [vitals, setVitals] = useState({ bp: '120/80', pulse: '72', temp: '37.0', weight: '68' });
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [remarks, setRemarks] = useState('');
  const [rxItems, setRxItems] = useState([]);
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [labRemarks, setLabRemarks] = useState('');

  // Prescription builder row inputs
  const [rxMedName, setRxMedName] = useState('');
  const [rxDosage, setRxDosage] = useState('');
  const [rxFrequency, setRxFrequency] = useState('1-0-1');
  const [rxDuration, setRxDuration] = useState('5 Days');
  const [rxInstructions, setRxInstructions] = useState('After Food');
  const [rxStockInfo, setRxStockInfo] = useState(null);

  // Search queries for tabs
  const [historySearch, setHistorySearch] = useState('');
  const [labReqSearch, setLabReqSearch] = useState('');
  const [labResSearch, setLabResSearch] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  // Modals
  const [prescriptionModalApptId, setPrescriptionModalApptId] = useState(null);
  const [isLabRequestModalOpen, setIsLabRequestModalOpen] = useState(false);
  const [modalLabPatientId, setModalLabPatientId] = useState('');
  const [modalLabSelectedTests, setModalLabSelectedTests] = useState([]);
  const [modalLabCustomTest, setModalLabCustomTest] = useState('');
  const [modalLabRemarks, setModalLabRemarks] = useState('');
  const [viewLabReportData, setViewLabReportData] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  };

  // Initial Data Load
  useEffect(() => {
    refreshAllData();

    const handleStorageChange = () => refreshAllData();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    window.addEventListener('cms_rx_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
      window.removeEventListener('cms_rx_updated', handleStorageChange);
    };
  }, []);

  const refreshAllData = async () => {
    // Default fallback appointments matching original
    const defaultAppts = [
      {
        appointmentId: 'APT-1',
        patientId: 'PAT-1',
        patientName: 'Arjun Ravi',
        doctorName: 'Dr. Prateek Pradeep',
        tokenNumber: 1,
        time: '10:00 AM',
        status: 'Scheduled',
        reason: 'Frequent headaches and mild fever'
      },
      {
        appointmentId: 'APT-2',
        patientId: 'PAT-2',
        patientName: 'Rohit Krishna',
        doctorName: 'Dr. Prateek Pradeep',
        tokenNumber: 2,
        time: '10:30 AM',
        status: 'Scheduled',
        reason: 'Severe throat irritation & dry cough'
      },
      {
        appointmentId: 'APT-3',
        patientId: 'PAT-3',
        patientName: 'Priya Nair',
        doctorName: 'Dr. Prateek Pradeep',
        tokenNumber: 3,
        time: '11:00 AM',
        status: 'Scheduled',
        reason: 'Acid reflux, bloating after meals'
      }
    ];

    const defaultPatients = [
      { patientId: 'PAT-1', name: 'Arjun Ravi', age: 47, gender: 'Male', phone: '9876543210', bloodGroup: 'O+' },
      { patientId: 'PAT-2', name: 'Rohit Krishna', age: 31, gender: 'Male', phone: '9845123456', bloodGroup: 'A+' },
      { patientId: 'PAT-3', name: 'Priya Nair', age: 40, gender: 'Female', phone: '9895012345', bloodGroup: 'B+' }
    ];

    const defaultMeds = [
      { id: 'MED-1', name: 'Paracetamol 500mg', dosage: '500mg', type: 'Tablet', quantity: 50 },
      { id: 'MED-2', name: 'Amoxicillin 500mg', dosage: '500mg', type: 'Capsule', quantity: 45 },
      { id: 'MED-3', name: 'Cetirizine 10mg', dosage: '10mg', type: 'Tablet', quantity: 60 },
      { id: 'MED-4', name: 'Metformin 500mg', dosage: '500mg', type: 'Tablet', quantity: 30 },
      { id: 'MED-5', name: 'Omeprazole 20mg', dosage: '20mg', type: 'Capsule', quantity: 40 },
      { id: 'MED-6', name: 'Ibuprofen 400mg', dosage: '400mg', type: 'Tablet', quantity: 50 },
      { id: 'MED-7', name: 'Azithromycin 500mg', dosage: '500mg', type: 'Tablet', quantity: 25 },
      { id: 'MED-8', name: 'Pantoprazole 40mg', dosage: '40mg', type: 'Tablet', quantity: 70 },
      { id: 'MED-9', name: 'Cough Syrup (Ascoril-D)', dosage: '10ml', type: 'Syrup', quantity: 15 },
      { id: 'MED-10', name: 'Salbutamol Inhaler 100mcg', dosage: '100mcg', type: 'Inhaler', quantity: 12 }
    ];

    try {
      const [backendAppts, backendPatients, backendMeds, backendLabs, backendCons] = await Promise.all([
        doctorService.getAppointments(),
        doctorService.getPatients(),
        doctorService.getMedicineCatalog(),
        doctorService.getLabCatalog(),
        doctorService.getAllConsultations()
      ]);

      if (Array.isArray(backendAppts) && backendAppts.length > 0) {
        setAppointments(backendAppts);
      } else {
        const storedAppts = getStorage(CMS_KEYS.APPOINTMENTS, defaultAppts);
        setAppointments(storedAppts);
      }

      if (Array.isArray(backendPatients) && backendPatients.length > 0) {
        setPatients(backendPatients);
      } else {
        const storedPatients = getStorage(CMS_KEYS.PATIENTS, defaultPatients);
        setPatients(storedPatients);
      }

      if (Array.isArray(backendMeds) && backendMeds.length > 0) {
        setMedicines(backendMeds);
      } else {
        const storedMeds = getStorage(CMS_KEYS.MEDICINES, defaultMeds);
        setMedicines(storedMeds);
      }
    } catch (err) {
      console.warn('Backend live data sync error; using local storage:', err);
      const storedAppts = getStorage(CMS_KEYS.APPOINTMENTS, defaultAppts);
      setAppointments(storedAppts);
      const storedPatients = getStorage(CMS_KEYS.PATIENTS, defaultPatients);
      setPatients(storedPatients);
      const storedMeds = getStorage(CMS_KEYS.MEDICINES, defaultMeds);
      setMedicines(storedMeds);
    }
  };

  // Select patient with Sequential Token Enforcement
  const handleSelectPatient = (appt) => {
    if (appt.status !== 'Completed') {
      const drafts = getStorage(CMS_KEYS.DRAFTS, {});
      const draft = drafts[appt.appointmentId];
      const labOrders = getStorage(CMS_KEYS.LAB_ORDERS, []);
      const labReports = getStorage(CMS_KEYS.LAB_REPORTS, []);
      const hasLabActivity =
        labOrders.some((o) => String(o.appointmentId) === String(appt.appointmentId)) ||
        labReports.some((r) => String(r.appointmentId) === String(appt.appointmentId));

      if (!draft && !hasLabActivity) {
        const scheduled = appointments
          .filter((a) => a.status === 'Scheduled')
          .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

        if (scheduled.length > 0) {
          const nextToken = scheduled[0].tokenNumber;
          if ((appt.tokenNumber || 0) > nextToken) {
            showToast(
              `Token #${nextToken} (${scheduled[0].patientName}) must be consulted first. Please follow the queue order.`,
              'warning'
            );
            return;
          }
        }
      }
    }

    setActiveAppt(appt);

    // If completed, load consultation and prescription
    if (appt.status === 'Completed') {
      const consList = getStorage(CMS_KEYS.CONSULTATIONS, []);
      const existingCons = consList.find((c) => c.appointmentId === appt.appointmentId);
      if (existingCons) {
        setVitals(existingCons.vitals || { bp: '120/80', pulse: '72', temp: '37.0', weight: '68' });
        setSymptoms(existingCons.symptoms || appt.reason || '');
        setDiagnosis(existingCons.diagnosis || '');
        setRemarks(existingCons.remarks || '');
      } else {
        setSymptoms(appt.reason || '');
        setDiagnosis('Routine Checkup Completed');
        setRemarks('Consultation completed. Advised lifestyle management.');
      }

      const rxList = getStorage(CMS_KEYS.PRESCRIPTIONS, []);
      const existingRx = rxList.find((r) => r.appointmentId === appt.appointmentId);
      if (existingRx && Array.isArray(existingRx.items)) {
        setRxItems([...existingRx.items]);
      } else {
        setRxItems([]);
      }
      setSelectedLabs([]);
      setLabRemarks('');
    } else {
      // Check for saved draft
      const drafts = getStorage(CMS_KEYS.DRAFTS, {});
      const draft = drafts[appt.appointmentId];
      if (draft) {
        setVitals(draft.vitals || { bp: '120/80', pulse: '72', temp: '37.0', weight: '68' });
        setSymptoms(draft.symptoms || appt.reason || '');
        setDiagnosis(draft.diagnosis || '');
        setRemarks(draft.remarks || '');
        setLabRemarks(draft.labRemarks || '');
        setSelectedLabs(Array.isArray(draft.labTests) ? draft.labTests : []);
        setRxItems(Array.isArray(draft.rxItems) ? draft.rxItems : []);
      } else {
        setVitals({ bp: '120/80', pulse: '72', temp: '37.0', weight: '68' });
        setSymptoms(appt.reason || '');
        setDiagnosis('');
        setRemarks('');
        setSelectedLabs([]);
        setLabRemarks('');
        setRxItems([]);
      }
    }
  };

  // Draft auto-saving
  const saveDraft = (currentUpdates = {}) => {
    if (!activeAppt || activeAppt.status === 'Completed') return;
    try {
      const drafts = getStorage(CMS_KEYS.DRAFTS, {});
      drafts[activeAppt.appointmentId] = {
        symptoms,
        diagnosis,
        remarks,
        vitals,
        labRemarks,
        labTests: selectedLabs,
        rxItems,
        savedAt: Date.now(),
        ...currentUpdates
      };
      setStorage(CMS_KEYS.DRAFTS, drafts);
    } catch (e) {}
  };

  // Medicine autocomplete & stock check
  const handleMedNameChange = (e) => {
    const val = e.target.value;
    setRxMedName(val);
    const found = medicines.find((m) => (m.name || '').toLowerCase() === val.trim().toLowerCase());
    if (found) {
      if (found.dosage) setRxDosage(found.dosage);
      const qty = Number(found.quantity ?? found.stock ?? 0);
      setRxStockInfo({ inStock: qty > 0, quantity: qty });
    } else {
      setRxStockInfo(null);
    }
  };

  // Add medicine to prescription list
  const handleAddRx = () => {
    const name = rxMedName.trim();
    const rawDosage = rxDosage.trim();
    const freq = rxFrequency.trim();
    const rawDur = rxDuration.trim();
    const inst = rxInstructions.trim();

    if (!name) {
      showToast('Medicine Name is mandatory! Please select or enter a medicine.', 'warning');
      return;
    }
    if (!/[a-zA-Z]/.test(name)) {
      showToast('Medicine Name must contain valid letters.', 'warning');
      return;
    }
    if (!rawDosage) {
      showToast('Dosage is mandatory (e.g. 500mg, 10ml, or enter a number like 8)!', 'warning');
      return;
    }
    const dosage = normalizeDosage(rawDosage);
    if (!dosage) {
      showToast('Please enter a valid dosage with quantity and unit (e.g. 500mg, 10ml, 1 tab, or enter 8).', 'warning');
      return;
    }
    if (!freq) {
      showToast('Frequency is mandatory!', 'warning');
      return;
    }
    if (!rawDur) {
      showToast('Duration is mandatory (e.g. 5 Days, 1 Week, or enter number of days)!', 'warning');
      return;
    }
    const dur = normalizeDuration(rawDur);
    if (!dur) {
      showToast('Duration must be a valid timeframe with numbers (e.g. 5 Days, 1 Week, or enter 5).', 'warning');
      return;
    }
    if (!inst) {
      showToast('Instructions are mandatory!', 'warning');
      return;
    }

    const stockInfo = medicines.find((m) => (m.name || '').toLowerCase() === name.toLowerCase());
    const qty = stockInfo ? Number(stockInfo.quantity ?? stockInfo.stock ?? 0) : 50;

    const newItem = {
      medicineName: name,
      dosage,
      frequency: freq,
      duration: dur,
      instructions: inst,
      inStock: qty > 0,
      availableStock: qty
    };

    const updated = [...rxItems, newItem];
    setRxItems(updated);
    setRxMedName('');
    setRxDosage('');
    setRxStockInfo(null);
    saveDraft({ rxItems: updated });
    showToast(`${name} (${dosage}) added to prescription.`, 'success');
  };

  const handleRemoveRx = (index) => {
    const updated = rxItems.filter((_, i) => i !== index);
    setRxItems(updated);
    saveDraft({ rxItems: updated });
  };

  // Instant Lab Request from Consultation
  const handleSendLabRequestNow = () => {
    if (!activeAppt) {
      showToast('Please select a patient first!', 'warning');
      return;
    }
    if (selectedLabs.length === 0 && !labRemarks.trim()) {
      showToast('Please select at least one lab test to request!', 'warning');
      return;
    }

    const labList = getStorage(CMS_KEYS.LAB_ORDERS, []);
    const uid = Date.now().toString().slice(-4);
    const newOrder = {
      labOrderId: `LAB-${uid}`,
      appointmentId: activeAppt.appointmentId,
      patientId: activeAppt.patientId,
      patientName: activeAppt.patientName,
      doctorName: currentUser.name || 'Dr. Prateek Pradeep',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      tests: selectedLabs.length > 0 ? selectedLabs : ['Diagnostic Evaluation'],
      remarks: labRemarks.trim(),
      status: 'Pending'
    };

    const updatedList = [newOrder, ...labList];
    setStorage(CMS_KEYS.LAB_ORDERS, updatedList);
    saveDraft();
    showToast(`Lab test requested for ${activeAppt.patientName}. Sent to Lab Technician pending queue!`, 'success');
  };

  // Save and Complete Consultation
  const handleSaveConsultation = (e) => {
    e.preventDefault();
    if (!activeAppt) {
      showToast('Please select a patient first!', 'warning');
      return;
    }

    if (!symptoms.trim()) {
      showToast('Symptoms & Observations are required!', 'warning');
      return;
    }
    if (!/[a-zA-Z]/.test(symptoms)) {
      showToast('Symptoms must contain descriptive text/letters.', 'warning');
      return;
    }
    if (!diagnosis.trim()) {
      showToast('Primary diagnosis is required!', 'warning');
      return;
    }
    if (!/[a-zA-Z]/.test(diagnosis)) {
      showToast('Primary diagnosis must contain letters describing condition.', 'warning');
      return;
    }

    if (rxMedName.trim()) {
      showToast(`You entered "${rxMedName}" without clicking "+ Add". Please add it or clear the input to complete.`, 'warning');
      return;
    }

    // Validate vitals
    if (vitals.bp) {
      const match = vitals.bp.match(/^(\d{2,3})\/(\d{2,3})$/);
      if (!match) {
        showToast('Blood Pressure must be formatted as Systolic/Diastolic (e.g. 120/80).', 'warning');
        return;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const uid = Date.now().toString().slice(-4);
    const consultationId = `CNS-${uid}`;

    // 1. Save Consultation
    const consList = getStorage(CMS_KEYS.CONSULTATIONS, []);
    const newCons = {
      consultationId,
      appointmentId: activeAppt.appointmentId,
      patientId: activeAppt.patientId,
      patientName: activeAppt.patientName,
      doctorName: currentUser.name || 'Dr. Prateek Pradeep',
      date: todayStr,
      vitals,
      symptoms: symptoms.trim(),
      diagnosis: diagnosis.trim(),
      remarks: remarks.trim(),
      status: 'Completed'
    };
    const cIdx = consList.findIndex((c) => c.appointmentId === activeAppt.appointmentId);
    if (cIdx >= 0) consList[cIdx] = newCons;
    else consList.unshift(newCons);
    setStorage(CMS_KEYS.CONSULTATIONS, consList);

    // 2. Save Prescription
    if (rxItems.length > 0) {
      const rxList = getStorage(CMS_KEYS.PRESCRIPTIONS, []);
      const newRx = {
        prescriptionId: `RX-${uid}`,
        consultationId,
        appointmentId: activeAppt.appointmentId,
        patientId: activeAppt.patientId,
        patientName: activeAppt.patientName,
        doctorName: currentUser.name || 'Dr. Prateek Pradeep',
        date: todayStr,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now(),
        symptoms: symptoms.trim(),
        diagnosis: diagnosis.trim(),
        items: rxItems,
        status: 'Pending'
      };
      const rIdx = rxList.findIndex((r) => r.appointmentId === activeAppt.appointmentId);
      if (rIdx >= 0) rxList[rIdx] = newRx;
      else rxList.unshift(newRx);
      setStorage(CMS_KEYS.PRESCRIPTIONS, rxList);
    }

    // 3. Save Lab Orders if tests selected
    if (selectedLabs.length > 0) {
      const labList = getStorage(CMS_KEYS.LAB_ORDERS, []);
      const alreadyExists = labList.some((o) => o.appointmentId === activeAppt.appointmentId);
      if (!alreadyExists) {
        labList.unshift({
          labOrderId: `LAB-${uid}`,
          consultationId,
          appointmentId: activeAppt.appointmentId,
          patientId: activeAppt.patientId,
          patientName: activeAppt.patientName,
          doctorName: currentUser.name || 'Dr. Prateek Pradeep',
          date: todayStr,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: Date.now(),
          tests: selectedLabs,
          remarks: labRemarks.trim(),
          status: 'Pending'
        });
        setStorage(CMS_KEYS.LAB_ORDERS, labList);
      }
    }

    // 4. Update Appointment to Completed
    const appts = getStorage(CMS_KEYS.APPOINTMENTS, []);
    const updatedAppts = appts.map((a) =>
      a.appointmentId === activeAppt.appointmentId ? { ...a, status: 'Completed' } : a
    );
    setStorage(CMS_KEYS.APPOINTMENTS, updatedAppts);
    setAppointments(updatedAppts);
    setActiveAppt({ ...activeAppt, status: 'Completed' });

    // Clear Draft
    const drafts = getStorage(CMS_KEYS.DRAFTS, {});
    delete drafts[activeAppt.appointmentId];
    setStorage(CMS_KEYS.DRAFTS, drafts);

    // Sync to MySQL Backend via doctorService
    doctorService.createConsultation(
      newCons,
      { items: rxItems },
      { tests: selectedLabs }
    ).catch((err) => console.warn('Background sync to backend failed:', err));

    showToast(`Consultation completed for ${activeAppt.patientName}.`, 'success');
    window.dispatchEvent(new Event('cms_rx_updated'));
  };

  // Sign out
  const handleSignOut = () => {
    authService.logout();
    navigate('/login');
  };

  // Patient demographic lookup
  const getPatientDetails = (patId, fallbackName) => {
    const found = patients.find((p) => p.patientId === patId);
    return found || { name: fallbackName || 'Patient', age: '—', gender: '—', bloodGroup: '—', phone: '—' };
  };

  // Filtered queue
  const filteredQueue = appointments
    .filter((a) => {
      if (queueFilter === 'Scheduled') return a.status === 'Scheduled';
      if (queueFilter === 'Completed') return a.status === 'Completed';
      return true;
    })
    .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

  // Lowest pending token
  const nextScheduled = appointments
    .filter((a) => a.status === 'Scheduled')
    .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));
  const nextTokenNum = nextScheduled.length > 0 ? nextScheduled[0].tokenNumber : null;

  // Stats calculation
  const totalCount = appointments.length;
  const waitingCount = appointments.filter((a) => a.status === 'Scheduled').length;
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;
  const prescriptionsCount = getStorage(CMS_KEYS.PRESCRIPTIONS, []).length;

  // Greeting date
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const currentHour = new Date().getHours();
  const greetingTime = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Active patient lab items for section 4 banner
  const patientLabOrders = activeAppt
    ? getStorage(CMS_KEYS.LAB_ORDERS, []).filter((o) => String(o.appointmentId) === String(activeAppt.appointmentId))
    : [];
  const patientLabReports = activeAppt
    ? getStorage(CMS_KEYS.LAB_REPORTS, []).filter(
        (r) =>
          patientLabOrders.some((po) => String(po.labOrderId) === String(r.labOrderId)) ||
          String(r.appointmentId) === String(activeAppt.appointmentId)
      )
    : [];

  return (
    <div className="doctor-shell">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '1.25rem',
            right: '1.5rem',
            zIndex: 9999,
            background: toast.type === 'warning' ? '#fef3c7' : toast.type === 'success' ? '#d1fae5' : '#eff6ff',
            color: toast.type === 'warning' ? '#92400e' : toast.type === 'success' ? '#065f46' : '#1e40af',
            border: `1.5px solid ${toast.type === 'warning' ? '#fcd34d' : toast.type === 'success' ? '#a7f3d0' : '#bfdbfe'}`,
            borderRadius: '8px',
            padding: '0.85rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            maxWidth: '420px'
          }}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          LEFT DARK SIDEBAR
      ────────────────────────────────────────────────────────── */}
      <aside className="doctor-sidebar">
        <div className="doctor-sidebar-brand">
          <div className="doctor-sidebar-brand-icon">
            <EcgPulseIcon size={20} color="#ffffff" />
          </div>
          <div>
            <span className="doctor-sidebar-brand-name">CarePoint</span>
            <span className="doctor-sidebar-brand-sub">Doctor Portal</span>
          </div>
        </div>

        <nav className="doctor-sidebar-nav">
          <div className="doctor-nav-section-label">Workspace</div>

          <button
            type="button"
            className={`doctor-nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            <DashboardGridIcon size={18} />
            Dashboard
          </button>

          <button
            type="button"
            className={`doctor-nav-item ${activeSection === 'history' ? 'active' : ''}`}
            onClick={() => setActiveSection('history')}
          >
            <ClockHistoryIcon size={18} />
            Consultation History
          </button>

          <div className="doctor-nav-section-label">Laboratory</div>

          <button
            type="button"
            className={`doctor-nav-item ${activeSection === 'labrequests' ? 'active' : ''}`}
            onClick={() => setActiveSection('labrequests')}
          >
            <FlaskLabIcon size={18} />
            Lab Requests
          </button>

          <button
            type="button"
            className={`doctor-nav-item ${activeSection === 'labresults' ? 'active' : ''}`}
            onClick={() => setActiveSection('labresults')}
          >
            <DocumentCheckIcon size={18} />
            Lab Results
          </button>
        </nav>

        <div className="doctor-sidebar-footer">
          <div className="doctor-sidebar-user">
            <div className="doctor-sidebar-avatar">
              {(currentUser.name || 'PP')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <span className="doctor-sidebar-user-name">{currentUser.name || 'Dr. Prateek Pradeep'}</span>
              <span className="doctor-sidebar-user-role">Physician</span>
            </div>
          </div>
          <button className="doctor-btn-signout" onClick={handleSignOut}>
            <SignOutIcon size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────────
          MAIN CONTENT AREA
      ────────────────────────────────────────────────────────── */}
      <main className="doctor-main-area">
        <div className="doctor-main-content">
          {/* SECTION 1: DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div>
              {/* Header Greeting */}
              <div style={{ marginBottom: '1.5rem' }}>
                <p className="doctor-greeting-eyebrow">{todayFormatted}</p>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: '0 0 0.35rem 0' }}>
                  {greetingTime}, {currentUser.name || 'Doctor'}
                </h1>
                <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem', margin: 0 }}>
                  Your patient queue is ready. Review appointments, record clinical findings, and issue prescriptions below.
                </p>
              </div>

              {/* 4 Stat Cards */}
              <div className="doctor-stats-grid">
                <div className="doctor-stat-card">
                  <div className="doctor-stat-icon blue">
                    <CalendarStatIcon size={22} color="var(--primary, #0057b8)" />
                  </div>
                  <div>
                    <div className="doctor-stat-value">{totalCount}</div>
                    <div className="doctor-stat-label">Appointments Today</div>
                  </div>
                </div>

                <div className="doctor-stat-card">
                  <div className="doctor-stat-icon amber">
                    <ClockHistoryIcon size={22} color="var(--warning, #f59e0b)" />
                  </div>
                  <div>
                    <div className="doctor-stat-value">{waitingCount}</div>
                    <div className="doctor-stat-label">Waiting in Queue</div>
                  </div>
                </div>

                <div className="doctor-stat-card">
                  <div className="doctor-stat-icon green">
                    <CheckCircleIcon size={22} color="var(--success, #10b981)" />
                  </div>
                  <div>
                    <div className="doctor-stat-value">{completedCount}</div>
                    <div className="doctor-stat-label">Consultations Done</div>
                  </div>
                </div>

                <div className="doctor-stat-card">
                  <div className="doctor-stat-icon indigo">
                    <DocumentCheckIcon size={22} color="#6366f1" />
                  </div>
                  <div>
                    <div className="doctor-stat-value">{prescriptionsCount}</div>
                    <div className="doctor-stat-label">Prescriptions Issued</div>
                  </div>
                </div>
              </div>

              {/* Workspace Layout: Left Queue + Right Clinical Examination */}
              <div className="doctor-layout-grid">
                {/* Patient Queue Column */}
                <div className="card" style={{ padding: '1rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem' }}>
                      <UsersQueueIcon size={18} color="#64748b" />
                      <span>Patient Queue</span>
                    </div>
                    <span className="badge badge-scheduled" style={{ fontSize: '0.72rem' }}>
                      {waitingCount} Waiting
                    </span>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${queueFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => setQueueFilter('all')}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${queueFilter === 'Scheduled' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => setQueueFilter('Scheduled')}
                    >
                      Waiting
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${queueFilter === 'Completed' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => setQueueFilter('Completed')}
                    >
                      Completed
                    </button>
                  </div>

                  {/* Queue Cards */}
                  <div>
                    {filteredQueue.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                        No appointments found.
                      </div>
                    ) : (
                      filteredQueue.map((appt) => {
                        const isSelected = activeAppt && activeAppt.appointmentId === appt.appointmentId;
                        const isNext = appt.status === 'Scheduled' && appt.tokenNumber === nextTokenNum;

                        return (
                          <div
                            key={appt.appointmentId}
                            className={`doctor-queue-card ${isSelected ? 'active' : ''}`}
                            onClick={() => handleSelectPatient(appt)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span className="doctor-token-badge">Token #{appt.tokenNumber || '—'}</span>
                                {isNext && (
                                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--success, #10b981)', textTransform: 'uppercase' }}>
                                    Next
                                  </span>
                                )}
                              </div>
                              <span
                                className={`badge ${
                                  appt.status === 'Completed'
                                    ? 'badge-completed'
                                    : appt.status === 'In-Progress'
                                    ? 'badge-warning'
                                    : 'badge-scheduled'
                                }`}
                                style={{ fontSize: '0.68rem' }}
                              >
                                {appt.status}
                              </span>
                            </div>

                            <div style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)', fontSize: '0.95rem' }}>
                              {appt.patientName}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: '0.15rem' }}>
                              {appt.time || '10:00 AM'} &nbsp;·&nbsp; {appt.reason || 'General Checkup'}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Clinical Examination Column */}
                <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <EcgPulseIcon size={20} color="#64748b" />
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Clinical Examination</h2>
                    </div>

                    {activeAppt && activeAppt.status === 'Completed' && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
                        onClick={() => setPrescriptionModalApptId(activeAppt.appointmentId)}
                      >
                        <EyePrescriptionIcon size={14} />
                        View Prescription
                      </button>
                    )}
                  </div>

                  {!activeAppt ? (
                    <div className="doctor-empty-panel">
                      <div className="doctor-empty-panel-icon">
                        <UsersQueueIcon size={24} color="#94a3b8" />
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '0.35rem' }}>
                        No Patient Selected
                      </h3>
                      <p style={{ fontSize: '0.85rem' }}>Select a patient from the queue to start consultation.</p>
                    </div>
                  ) : (
                    <div>
                      {/* Completed Notice Banner */}
                      {activeAppt.status === 'Completed' && (
                        <div
                          style={{
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            borderLeft: '4px solid #10b981',
                            padding: '0.75rem 1rem',
                            borderRadius: '6px',
                            marginBottom: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}
                        >
                          <div style={{ color: '#065f46', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <CheckCircleIcon size={18} color="#059669" />
                            <span>Consultation Complete — This record is locked in read-only mode to preserve medical integrity.</span>
                          </div>
                          <span className="badge badge-completed" style={{ fontSize: '0.72rem' }}>
                            Read Only
                          </span>
                        </div>
                      )}

                      {/* Patient Banner Demographics */}
                      {(() => {
                        const pat = getPatientDetails(activeAppt.patientId, activeAppt.patientName);
                        return (
                          <div className="doctor-patient-banner">
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary, #0057b8)', margin: 0 }}>
                                  {pat.name}
                                </h3>
                                <span className="doctor-token-badge">Token #{activeAppt.tokenNumber || '—'}</span>
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.3rem' }}>
                                Age: {pat.age || '—'}, Gender: {pat.gender || '—'}, Blood Group: {pat.bloodGroup || '—'} &ensp;·&ensp; Phone: {pat.phone || '—'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Scheduled at </span>
                              <strong style={{ fontSize: '0.85rem' }}>{activeAppt.time || '10:00 AM'}</strong>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Complaint Strip */}
                      <div className="doctor-complaint-strip">
                        <span>
                          <strong>Chief Complaint:&nbsp;</strong>
                          <span>{activeAppt.reason || 'General Consultation'}</span>
                        </span>
                      </div>

                      {/* Consultation Form */}
                      <form onSubmit={handleSaveConsultation}>
                        {/* 1. Vitals */}
                        <h4 className="doctor-form-section-title">
                          <EcgPulseIcon size={16} />
                          1. Record Patient Vitals
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Blood Pressure</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="120/80"
                              value={vitals.bp}
                              disabled={activeAppt.status === 'Completed'}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^\d/]/g, '');
                                setVitals({ ...vitals, bp: val });
                                saveDraft({ vitals: { ...vitals, bp: val } });
                              }}
                            />
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>mmHg (sys/dia)</span>
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Pulse Rate</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="72"
                              value={vitals.pulse}
                              disabled={activeAppt.status === 'Completed'}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^\d]/g, '');
                                setVitals({ ...vitals, pulse: val });
                                saveDraft({ vitals: { ...vitals, pulse: val } });
                              }}
                            />
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>bpm</span>
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Body Temp</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="37.0"
                              value={vitals.temp}
                              disabled={activeAppt.status === 'Completed'}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                                setVitals({ ...vitals, temp: val });
                                saveDraft({ vitals: { ...vitals, temp: val } });
                              }}
                            />
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>&deg;C</span>
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Body Weight</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="68"
                              value={vitals.weight}
                              disabled={activeAppt.status === 'Completed'}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                                setVitals({ ...vitals, weight: val });
                                saveDraft({ vitals: { ...vitals, weight: val } });
                              }}
                            />
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>kg</span>
                          </div>
                        </div>

                        {/* 2. Observations & Diagnosis */}
                        <h4 className="doctor-form-section-title">
                          <DocumentCheckIcon size={16} />
                          2. Clinical Observations &amp; Diagnosis
                        </h4>
                        <div style={{ marginBottom: '1rem' }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Symptoms &amp; Clinical Observations *</label>
                          <textarea
                            className="form-control"
                            rows={2}
                            placeholder="Detail patient symptoms, history of present illness..."
                            value={symptoms}
                            disabled={activeAppt.status === 'Completed'}
                            required
                            onChange={(e) => {
                              setSymptoms(e.target.value);
                              saveDraft({ symptoms: e.target.value });
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Primary Diagnosis *</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Acute Pharyngitis, Viral Fever, Hypertension"
                            value={diagnosis}
                            disabled={activeAppt.status === 'Completed'}
                            required
                            onChange={(e) => {
                              setDiagnosis(e.target.value);
                              saveDraft({ diagnosis: e.target.value });
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Doctor's Advice / Remarks</label>
                          <textarea
                            className="form-control"
                            rows={2}
                            placeholder="Lifestyle advice, dietary precautions..."
                            value={remarks}
                            disabled={activeAppt.status === 'Completed'}
                            onChange={(e) => {
                              setRemarks(e.target.value);
                              saveDraft({ remarks: e.target.value });
                            }}
                          />
                        </div>

                        {/* 3. Medications */}
                        <h4 className="doctor-form-section-title">
                          <DocumentCheckIcon size={16} />
                          3. Prescribe Medications
                        </h4>

                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                          {activeAppt.status !== 'Completed' && (
                            <div className="doctor-rx-grid">
                              <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Medicine *</label>
                                <input
                                  type="text"
                                  list="doctorMedicineOptions"
                                  className="form-control"
                                  placeholder="Type or select"
                                  value={rxMedName}
                                  onChange={handleMedNameChange}
                                />
                                <datalist id="doctorMedicineOptions">
                                  {medicines.map((m) => (
                                    <option key={m.id || m.name} value={m.name}>
                                      {m.name} ({m.dosage || '500mg'})
                                    </option>
                                  ))}
                                </datalist>
                                {rxStockInfo && (
                                  <div style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>
                                    {rxStockInfo.inStock ? (
                                      <span style={{ color: 'var(--success, #10b981)', fontWeight: 600 }}>
                                        ✓ In Stock: {rxStockInfo.quantity} units available
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--danger, #dc2626)', fontWeight: 700 }}>
                                        ⚠ Out of Stock in Pharmacy
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Dosage *</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="e.g. 500mg or 8"
                                  value={rxDosage}
                                  onChange={(e) => setRxDosage(e.target.value)}
                                  onBlur={(e) => {
                                    const formatted = normalizeDosage(e.target.value);
                                    if (formatted) setRxDosage(formatted);
                                  }}
                                />
                              </div>

                              <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Frequency *</label>
                                <select className="form-control" value={rxFrequency} onChange={(e) => setRxFrequency(e.target.value)}>
                                  <option value="1-0-1">1-0-1 (Twice daily)</option>
                                  <option value="1-0-0">1-0-0 (Morning)</option>
                                  <option value="0-0-1">0-0-1 (Night)</option>
                                  <option value="1-1-1">1-1-1 (Thrice daily)</option>
                                  <option value="SOS">SOS (As needed)</option>
                                </select>
                              </div>

                              <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Duration *</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="e.g. 5 Days or 5"
                                  value={rxDuration}
                                  onChange={(e) => setRxDuration(e.target.value)}
                                  onBlur={(e) => {
                                    const formatted = normalizeDuration(e.target.value);
                                    if (formatted) setRxDuration(formatted);
                                  }}
                                />
                              </div>

                              <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Instructions *</label>
                                <select className="form-control" value={rxInstructions} onChange={(e) => setRxInstructions(e.target.value)}>
                                  <option value="After Food">After Food</option>
                                  <option value="Before Food">Before Food</option>
                                  <option value="At Bedtime">At Bedtime</option>
                                  <option value="With Food">With Food</option>
                                </select>
                              </div>

                              <div>
                                <button type="button" className="btn btn-secondary" onClick={handleAddRx}>
                                  + Add
                                </button>
                              </div>
                            </div>
                          )}

                          {rxItems.length > 0 ? (
                            <div className="table-responsive" style={{ marginTop: '0.75rem' }}>
                              <table className="table" style={{ background: '#ffffff', borderRadius: '6px', fontSize: '0.85rem' }}>
                                <thead>
                                  <tr>
                                    <th>Medicine</th>
                                    <th>Dosage</th>
                                    <th>Frequency</th>
                                    <th>Duration</th>
                                    <th>Instructions</th>
                                    {activeAppt.status !== 'Completed' && <th>Action</th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  {rxItems.map((item, idx) => (
                                    <tr key={idx}>
                                      <td>
                                        <strong>{item.medicineName}</strong>
                                      </td>
                                      <td>{item.dosage}</td>
                                      <td>
                                        <span className="badge badge-scheduled">{item.frequency}</span>
                                      </td>
                                      <td>{item.duration}</td>
                                      <td>{item.instructions}</td>
                                      {activeAppt.status !== 'Completed' && (
                                        <td>
                                          <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '0.2rem 0.4rem' }}
                                            onClick={() => handleRemoveRx(idx)}
                                          >
                                            <TrashIcon size={13} />
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', padding: '0.5rem 0' }}>
                              No medications added yet. Use the fields above to prescribe.
                            </div>
                          )}
                        </div>

                        {/* 4. Diagnostic Lab Tests */}
                        <h4 className="doctor-form-section-title">
                          <FlaskLabIcon size={16} />
                          4. Diagnostic Lab Tests
                        </h4>

                        {/* Dynamic Patient Lab Status Banner */}
                        {patientLabReports.length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            {patientLabReports.map((r) => {
                              const evalRes = evaluateLabReading(r.testName, r.actualReading, r.normalValue);
                              const isAb = evalRes.isAbnormal;
                              return (
                                <div
                                  key={r.reportId}
                                  style={{
                                    background: isAb ? '#fef2f2' : '#ecfdf5',
                                    border: `1px solid ${isAb ? '#fecaca' : '#a7f3d0'}`,
                                    borderLeft: `4px solid ${isAb ? '#ef4444' : '#10b981'}`,
                                    padding: '0.85rem 1rem',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.75rem',
                                    flexWrap: 'wrap',
                                    marginBottom: '0.5rem'
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 700, color: isAb ? '#991b1b' : '#065f46', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span>Lab Findings Ready: <strong>{r.testName}</strong></span>
                                      <span className={isAb ? 'doctor-badge-status-abnormal' : 'doctor-badge-status-normal'}>
                                        {evalRes.tag}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: isAb ? '#b91c1c' : '#047857', marginTop: '0.2rem' }}>
                                      <strong>Result:</strong> {r.actualReading}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    style={isAb ? { background: '#dc2626', borderColor: '#dc2626' } : {}}
                                    onClick={() => setViewLabReportData({ report: r, order: patientLabOrders.find((o) => o.labOrderId === r.labOrderId) })}
                                  >
                                    View Official Report (Read Only)
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', marginBottom: '0.75rem' }}>
                            {[
                              'Complete Blood Count (CBC)',
                              'Fasting Blood Sugar (FBS)',
                              'Lipid Profile',
                              'Urine Routine Examination',
                              'Thyroid Profile (T3, T4, TSH)',
                              'Chest X-Ray PA View'
                            ].map((testName) => (
                              <label key={testName} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: activeAppt.status === 'Completed' ? 'not-allowed' : 'pointer' }}>
                                <input
                                  type="checkbox"
                                  value={testName}
                                  disabled={activeAppt.status === 'Completed'}
                                  checked={selectedLabs.includes(testName)}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...selectedLabs, testName]
                                      : selectedLabs.filter((t) => t !== testName);
                                    setSelectedLabs(next);
                                    saveDraft({ labTests: next });
                                  }}
                                />
                                {testName}
                              </label>
                            ))}
                          </div>

                          <input
                            type="text"
                            className="form-control"
                            placeholder="Special instructions for lab technician (optional)"
                            value={labRemarks}
                            disabled={activeAppt.status === 'Completed'}
                            onChange={(e) => {
                              setLabRemarks(e.target.value);
                              saveDraft({ labRemarks: e.target.value });
                            }}
                          />

                          {activeAppt.status !== 'Completed' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Request will be queued directly into Lab Technician's pending queue.
                              </span>
                              <button type="button" className="btn btn-secondary btn-sm" onClick={handleSendLabRequestNow}>
                                Send Request to Lab Now
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {activeAppt.status !== 'Completed' && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => {
                                setActiveAppt(null);
                                setRxItems([]);
                              }}
                            >
                              Discard
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.7rem 1.5rem', fontSize: '0.95rem', fontWeight: 700 }}>
                              Save &amp; Complete Consultation
                            </button>
                          </div>
                        )}
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: CONSULTATION HISTORY */}
          {activeSection === 'history' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: '0 0 0.35rem 0' }}>
                  Consultation History
                </h1>
                <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem', margin: 0 }}>
                  A complete record of all past consultations. Click any entry to expand details.
                </p>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <input
                  type="search"
                  className="form-control"
                  style={{ maxWidth: '360px' }}
                  placeholder="Search by patient name, diagnosis, symptoms..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>

              {(() => {
                const consList = getStorage(CMS_KEYS.CONSULTATIONS, []);
                const rxList = getStorage(CMS_KEYS.PRESCRIPTIONS, []);
                const labList = getStorage(CMS_KEYS.LAB_ORDERS, []);
                const q = historySearch.toLowerCase().trim();

                const filtered = consList.filter((c) => {
                  if (!q) return true;
                  return (
                    (c.patientName || '').toLowerCase().includes(q) ||
                    (c.diagnosis || '').toLowerCase().includes(q) ||
                    (c.symptoms || '').toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="doctor-empty-panel">
                      <div className="doctor-empty-panel-icon">
                        <ClockHistoryIcon size={24} color="#94a3b8" />
                      </div>
                      <h3>No Consultations Found</h3>
                      <p>{q ? 'No records match your search.' : 'Completed patient consultations will appear here.'}</p>
                    </div>
                  );
                }

                return (
                  <div>
                    {filtered.map((c) => {
                      const isExpanded = expandedHistoryId === (c.consultationId || c.appointmentId);
                      const pat = getPatientDetails(c.patientId, c.patientName);
                      const rx = rxList.find((r) => r.appointmentId === c.appointmentId || r.consultationId === c.consultationId);
                      const lab = labList.find((l) => l.appointmentId === c.appointmentId);
                      const meds = (rx && rx.items) || c.medicines || [];

                      return (
                        <div key={c.consultationId || c.appointmentId} className="doctor-history-card">
                          <div
                            className="doctor-history-card-header"
                            onClick={() => setExpandedHistoryId(isExpanded ? null : c.consultationId || c.appointmentId)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                              <div
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: '#eff6ff',
                                  color: 'var(--primary, #0057b8)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.95rem'
                                }}
                              >
                                {(c.patientName || '?').charAt(0)}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main, #0f172a)' }}>
                                    {c.patientName || 'Patient'}
                                  </span>
                                  <span className="badge badge-completed">Completed</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '0.15rem' }}>
                                  Gender: {pat.gender || '—'}, Age: {pat.age || '—'}, Blood Group: {pat.bloodGroup || '—'}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary, #0057b8)' }}>
                                  {c.diagnosis || 'General Checkup'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                                  {c.date || 'Today'}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPrescriptionModalApptId(c.appointmentId);
                                }}
                                title="View Prescription"
                              >
                                View
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="doctor-history-card-body">
                              {/* Vitals */}
                              {c.vitals && (
                                <div className="doctor-vitals-row">
                                  {c.vitals.bp && (
                                    <div className="doctor-vital-chip">
                                      <small>Blood Pressure</small>
                                      <span>{c.vitals.bp} mmHg</span>
                                    </div>
                                  )}
                                  {c.vitals.pulse && (
                                    <div className="doctor-vital-chip">
                                      <small>Pulse Rate</small>
                                      <span>{c.vitals.pulse} bpm</span>
                                    </div>
                                  )}
                                  {c.vitals.temp && (
                                    <div className="doctor-vital-chip">
                                      <small>Body Temp</small>
                                      <span>{c.vitals.temp} &deg;C</span>
                                    </div>
                                  )}
                                  {c.vitals.weight && (
                                    <div className="doctor-vital-chip">
                                      <small>Weight</small>
                                      <span>{c.vitals.weight} kg</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                                <div>
                                  <div className="doctor-detail-label">Chief Complaint &amp; Symptoms</div>
                                  <div className="doctor-detail-value">{c.symptoms || '—'}</div>
                                </div>
                                <div>
                                  <div className="doctor-detail-label">Primary Diagnosis</div>
                                  <div className="doctor-detail-value" style={{ fontWeight: 700, color: 'var(--primary, #0057b8)' }}>
                                    {c.diagnosis || '—'}
                                  </div>
                                </div>
                                {c.remarks && (
                                  <div style={{ gridColumn: '1 / -1' }}>
                                    <div className="doctor-detail-label">Doctor's Clinical Advice &amp; Remarks</div>
                                    <div className="doctor-detail-value">{c.remarks}</div>
                                  </div>
                                )}
                              </div>

                              {/* Meds */}
                              <div style={{ marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <div className="doctor-detail-label" style={{ margin: 0 }}>
                                    Medications Prescribed ({meds.length})
                                  </div>
                                  {rx && (
                                    <span className={`badge ${rx.status === 'Dispensed' ? 'badge-completed' : 'badge-scheduled'}`}>
                                      {rx.status === 'Dispensed' ? '✓ Dispensed by Pharmacist' : '⏳ Pending with Pharmacist'}
                                    </span>
                                  )}
                                </div>
                                {meds.length > 0 ? (
                                  <div className="table-responsive">
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', background: '#fff', border: '1px solid #e2e8f0' }}>
                                      <thead>
                                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                          <th style={{ padding: '0.45rem 0.6rem' }}>Medicine</th>
                                          <th style={{ padding: '0.45rem 0.6rem' }}>Dosage</th>
                                          <th style={{ padding: '0.45rem 0.6rem' }}>Frequency</th>
                                          <th style={{ padding: '0.45rem 0.6rem' }}>Duration</th>
                                          <th style={{ padding: '0.45rem 0.6rem' }}>Instructions</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {meds.map((m, i) => (
                                          <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '0.45rem 0.6rem', fontWeight: 700 }}>{m.medicineName || m.name}</td>
                                            <td style={{ padding: '0.45rem 0.6rem' }}>{m.dosage}</td>
                                            <td style={{ padding: '0.45rem 0.6rem' }}>
                                              <span className="badge badge-scheduled">{m.frequency || m.freq}</span>
                                            </td>
                                            <td style={{ padding: '0.45rem 0.6rem' }}>{m.duration}</td>
                                            <td style={{ padding: '0.45rem 0.6rem', color: '#64748b' }}>{m.instructions || m.timing}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                                    No medications prescribed.
                                  </div>
                                )}
                              </div>

                              {lab && lab.tests && lab.tests.length > 0 && (
                                <div>
                                  <div className="doctor-detail-label">Diagnostic Lab Tests Ordered</div>
                                  <div>
                                    {lab.tests.map((t, idx) => (
                                      <span key={idx} className="doctor-test-tag">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* SECTION 3: LAB REQUESTS */}
          {activeSection === 'labrequests' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: '0 0 0.35rem 0' }}>
                    Lab Requests
                  </h1>
                  <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem', margin: 0 }}>
                    Initiate diagnostic lab test requests and track orders sent to the laboratory team.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setModalLabPatientId(activeAppt ? activeAppt.patientId : '');
                    setModalLabSelectedTests([]);
                    setModalLabCustomTest('');
                    setModalLabRemarks('');
                    setIsLabRequestModalOpen(true);
                  }}
                >
                  + Request Lab Test
                </button>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <input
                  type="search"
                  className="form-control"
                  style={{ maxWidth: '360px' }}
                  placeholder="Search by patient name, test, order ID..."
                  value={labReqSearch}
                  onChange={(e) => setLabReqSearch(e.target.value)}
                />
              </div>

              {(() => {
                const labOrders = getStorage(CMS_KEYS.LAB_ORDERS, []);
                const labReports = getStorage(CMS_KEYS.LAB_REPORTS, []);
                const q = labReqSearch.toLowerCase().trim();

                const filtered = labOrders.filter((o) => {
                  if (!q) return true;
                  return (
                    (o.patientName || '').toLowerCase().includes(q) ||
                    (o.labOrderId || '').toLowerCase().includes(q) ||
                    (o.tests || []).join(' ').toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="doctor-empty-panel">
                      <div className="doctor-empty-panel-icon">
                        <FlaskLabIcon size={24} color="#94a3b8" />
                      </div>
                      <h3>No Lab Requests Found</h3>
                      <p>{q ? 'No orders match your search.' : 'Lab test orders will appear here once requested.'}</p>
                    </div>
                  );
                }

                return (
                  <div>
                    {filtered.map((order) => {
                      const report = labReports.find(
                        (r) =>
                          String(r.labOrderId) === String(order.labOrderId) ||
                          (r.patientId && String(r.patientId) === String(order.patientId))
                      );
                      const isReady = report || order.status === 'Completed' || order.actualReading;

                      return (
                        <div key={order.labOrderId} className="doctor-lab-order-row">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', fontFamily: 'monospace' }}>
                                {order.labOrderId}
                              </span>
                              <span className={`badge ${isReady ? 'badge-completed' : 'badge-scheduled'}`}>
                                {isReady ? 'Results Ready' : order.status || 'Pending'}
                              </span>
                            </div>

                            <div style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)', fontSize: '0.95rem' }}>
                              {order.patientName || 'Patient'}
                            </div>

                            <div style={{ margin: '0.35rem 0' }}>
                              {(order.tests || []).map((t, idx) => (
                                <span key={idx} className="doctor-test-tag">
                                  {t}
                                </span>
                              ))}
                            </div>

                            {order.remarks && (
                              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                                Note: {order.remarks}
                              </div>
                            )}

                            {isReady && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => setViewLabReportData({ report: report || order, order })}
                                >
                                  View Report
                                </button>
                              </div>
                            )}
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ordered On</div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{order.date || '—'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                              Dr. {order.doctorName || 'Doctor'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* SECTION 4: LAB RESULTS */}
          {activeSection === 'labresults' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: '0 0 0.35rem 0' }}>
                  Lab Results
                </h1>
                <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem', margin: 0 }}>
                  View laboratory investigation readings, parameter findings, and technologist reports.
                </p>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <input
                  type="search"
                  className="form-control"
                  style={{ maxWidth: '360px' }}
                  placeholder="Search by patient, order ID, test name..."
                  value={labResSearch}
                  onChange={(e) => setLabResSearch(e.target.value)}
                />
              </div>

              {(() => {
                const labOrders = getStorage(CMS_KEYS.LAB_ORDERS, []);
                const labReports = getStorage(CMS_KEYS.LAB_REPORTS, []);
                const combined = [];

                labReports.forEach((r) => {
                  const order = labOrders.find((o) => String(o.labOrderId) === String(r.labOrderId)) || {
                    labOrderId: r.labOrderId,
                    patientId: r.patientId,
                    patientName: r.patientName,
                    doctorName: r.doctorName,
                    tests: [r.testName || 'Diagnostic Test'],
                    date: r.date
                  };
                  combined.push({ report: r, order });
                });

                labOrders.forEach((o) => {
                  if ((o.actualReading || o.status === 'Completed') && !combined.some((c) => String(c.order.labOrderId) === String(o.labOrderId))) {
                    combined.push({
                      report: {
                        reportId: o.labOrderId,
                        labOrderId: o.labOrderId,
                        patientId: o.patientId,
                        patientName: o.patientName,
                        testName: (o.tests || ['Diagnostic Test']).join(', '),
                        actualReading: o.actualReading,
                        date: o.date,
                        technicianName: 'Malathi Sreekumar (Lab Tech)'
                      },
                      order: o
                    });
                  }
                });

                const q = labResSearch.toLowerCase().trim();
                const filtered = combined.filter(({ report, order }) => {
                  if (!q) return true;
                  return (
                    (order.patientName || report.patientName || '').toLowerCase().includes(q) ||
                    (order.labOrderId || '').toLowerCase().includes(q) ||
                    (order.tests || [report.testName]).join(' ').toLowerCase().includes(q) ||
                    (report.actualReading || '').toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="doctor-empty-panel">
                      <div className="doctor-empty-panel-icon">
                        <DocumentCheckIcon size={24} color="#94a3b8" />
                      </div>
                      <h3>{q ? 'No Results Match Your Search' : 'No Lab Results Yet'}</h3>
                      <p>{q ? 'Try a different search term.' : 'Results will appear here once reported by the laboratory.'}</p>
                    </div>
                  );
                }

                return (
                  <div>
                    {filtered.map(({ report, order }, idx) => {
                      const evalRes = evaluateLabReading(report.testName, report.actualReading, report.normalValue);
                      const hasAbnormal = evalRes.isAbnormal;

                      return (
                        <div key={idx} className="doctor-lab-order-row">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', fontFamily: 'monospace' }}>
                                {order.labOrderId || report.labOrderId}
                              </span>
                              <span className={hasAbnormal ? 'doctor-badge-status-abnormal' : 'doctor-badge-status-normal'}>
                                {hasAbnormal ? 'Abnormal Findings Flagged' : 'All Values Normal'}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#f1f5f9', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                                VIEW ONLY
                              </span>
                            </div>

                            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main, #0f172a)', marginBottom: '0.25rem' }}>
                              {order.patientName || report.patientName}
                            </div>

                            <div style={{ marginBottom: '0.5rem' }}>
                              {(order.tests || [report.testName]).map((t, i) => (
                                <span key={i} className="doctor-test-tag">
                                  {t}
                                </span>
                              ))}
                            </div>

                            {/* Parameter Chip */}
                            <div style={{ marginTop: '0.5rem' }}>
                              <div className={`doctor-result-chip ${hasAbnormal ? 'chip-abnormal' : 'chip-normal'}`}>
                                <strong>
                                  <span>{report.testName || 'Diagnostic Finding'}</span>
                                  <span className={hasAbnormal ? 'doctor-badge-status-abnormal' : 'doctor-badge-status-normal'}>
                                    {evalRes.tag}
                                  </span>
                                </strong>
                                <div className="chip-val">{report.actualReading || 'Normal'}</div>
                              </div>
                            </div>

                            {report.remarks && (
                              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.6rem', background: '#f8fafc', padding: '0.45rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #cbd5e1' }}>
                                <strong>Technician Note:</strong> {report.remarks}
                              </div>
                            )}

                            <div style={{ marginTop: '0.75rem' }}>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => setViewLabReportData({ report, order })}
                              >
                                View Official Report (Read Only)
                              </button>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Reported on</div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{report.date || '—'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                              By {report.technicianName || 'Malathi Sreekumar (Lab Tech)'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </main>

      {/* ──────────────────────────────────────────────────────────
          MODAL: VIEW PRESCRIPTION
      ────────────────────────────────────────────────────────── */}
      {prescriptionModalApptId && (
        <div className="doctor-modal-backdrop" onClick={() => setPrescriptionModalApptId(null)}>
          <div className="doctor-modal-card" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            {(() => {
              const appt = appointments.find((a) => a.appointmentId === prescriptionModalApptId) || {};
              const cons = getStorage(CMS_KEYS.CONSULTATIONS, []).find((c) => c.appointmentId === prescriptionModalApptId);
              const rx = getStorage(CMS_KEYS.PRESCRIPTIONS, []).find((r) => r.appointmentId === prescriptionModalApptId);
              const lab = getStorage(CMS_KEYS.LAB_ORDERS, []).find((l) => l.appointmentId === prescriptionModalApptId);
              const pat = getPatientDetails(appt.patientId || (cons && cons.patientId), appt.patientName);
              const items = (rx && rx.items) || (activeAppt && activeAppt.appointmentId === prescriptionModalApptId ? rxItems : []);

              return (
                <div className="doctor-rx-paper">
                  {/* CarePoint Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--primary, #0057b8)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <EcgPulseIcon size={24} color="var(--primary, #0057b8)" />
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary, #0057b8)', margin: 0 }}>
                          CarePoint Clinic
                        </h2>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                        Compassionate Care &bull; Comprehensive Health
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {cons ? cons.doctorName : currentUser.name || 'Dr. Prateek Pradeep'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>General Medicine &bull; Room 102</div>
                    </div>
                  </div>

                  {/* Patient Info Strip */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                    <div>
                      <span>Patient: </span>
                      <strong>{appt.patientName || (cons && cons.patientName)}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span>Date: </span>
                      <strong>{cons ? cons.date : new Date().toISOString().split('T')[0]}</strong>
                    </div>
                    <div>
                      <span>Age / Gender: </span>
                      <span>{pat.age || '—'} yrs / {pat.gender || '—'}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span>Blood Group: </span>
                      <strong style={{ color: '#dc2626' }}>{pat.bloodGroup || '—'}</strong>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
                    <strong>Diagnosis: </strong>
                    <span style={{ color: 'var(--primary, #0057b8)', fontWeight: 600 }}>
                      {cons ? cons.diagnosis : diagnosis || 'General Checkup'}
                    </span>
                  </div>

                  {/* Prescribed Meds Table */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary, #0057b8)', marginBottom: '0.4rem', fontStyle: 'italic' }}>
                      Rx
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid #cbd5e1', textAlign: 'left', color: '#64748b' }}>
                          <th style={{ padding: '0.4rem 0.3rem' }}>#</th>
                          <th style={{ padding: '0.4rem 0.3rem' }}>Medicine</th>
                          <th style={{ padding: '0.4rem 0.3rem' }}>Dosage</th>
                          <th style={{ padding: '0.4rem 0.3rem' }}>Frequency</th>
                          <th style={{ padding: '0.4rem 0.3rem' }}>Duration</th>
                          <th style={{ padding: '0.4rem 0.3rem' }}>Instructions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '0.75rem 0', color: '#64748b' }}>
                              No medications prescribed.
                            </td>
                          </tr>
                        ) : (
                          items.map((m, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                              <td style={{ padding: '0.4rem 0.3rem' }}>{idx + 1}</td>
                              <td style={{ padding: '0.4rem 0.3rem', fontWeight: 700 }}>{m.medicineName}</td>
                              <td style={{ padding: '0.4rem 0.3rem' }}>{m.dosage}</td>
                              <td style={{ padding: '0.4rem 0.3rem' }}>{m.frequency}</td>
                              <td style={{ padding: '0.4rem 0.3rem' }}>{m.duration}</td>
                              <td style={{ padding: '0.4rem 0.3rem' }}>{m.instructions}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Doctor's Advice */}
                  <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.2rem', color: '#334155' }}>Doctor's Advice &amp; Instructions:</div>
                    <div>{cons ? cons.remarks : remarks || 'Rest, take medications on schedule, follow up if symptoms persist.'}</div>
                  </div>

                  {/* Diagnostic Lab Tests if any */}
                  {lab && lab.tests && lab.tests.length > 0 && (
                    <div style={{ fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                      <strong>Diagnostic Tests Ordered: </strong>
                      <span>{lab.tests.join(', ')}</span>
                    </div>
                  )}

                  {/* Doctor Signature */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ textAlign: 'center', width: '200px' }}>
                      <div style={{ borderBottom: '1px solid #334155', marginBottom: '0.25rem' }}></div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                        {cons ? cons.doctorName : currentUser.name || 'Dr. Prateek Pradeep'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Consulting Physician</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}>
                      Print Prescription
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setPrescriptionModalApptId(null)}>
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: NEW LAB REQUEST
      ────────────────────────────────────────────────────────── */}
      {isLabRequestModalOpen && (
        <div className="doctor-modal-backdrop" onClick={() => setIsLabRequestModalOpen(false)}>
          <div className="doctor-modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.35rem' }}>Request Diagnostic Lab Test</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Order lab investigations for a patient. Orders are dispatched to the laboratory technician.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!modalLabPatientId) {
                    showToast('Please select a patient!', 'warning');
                    return;
                  }
                  const pat = patients.find((p) => p.patientId === modalLabPatientId);
                  const tests = [...modalLabSelectedTests];
                  if (modalLabCustomTest.trim()) tests.push(modalLabCustomTest.trim());
                  if (tests.length === 0) {
                    showToast('Please select or specify at least one lab test!', 'warning');
                    return;
                  }

                  const labList = getStorage(CMS_KEYS.LAB_ORDERS, []);
                  const uid = Date.now().toString().slice(-4);
                  const newOrder = {
                    labOrderId: `LAB-${uid}`,
                    appointmentId: activeAppt && activeAppt.patientId === modalLabPatientId ? activeAppt.appointmentId : null,
                    patientId: modalLabPatientId,
                    patientName: pat ? pat.name : 'Patient',
                    doctorName: currentUser.name || 'Dr. Prateek Pradeep',
                    date: new Date().toISOString().split('T')[0],
                    tests,
                    remarks: modalLabRemarks.trim(),
                    status: 'Pending'
                  };
                  setStorage(CMS_KEYS.LAB_ORDERS, [newOrder, ...labList]);
                  setIsLabRequestModalOpen(false);
                  showToast(`Lab request #${newOrder.labOrderId} dispatched to Laboratory queue!`, 'success');
                }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Patient *</label>
                  <select
                    className="form-control"
                    value={modalLabPatientId}
                    onChange={(e) => setModalLabPatientId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p) => (
                      <option key={p.patientId} value={p.patientId}>
                        {p.name} ({p.patientId} &bull; Age {p.age || '—'} &bull; {p.gender || '—'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Required Tests *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    {[
                      'Complete Blood Count (CBC)',
                      'Fasting Blood Sugar (FBS)',
                      'Lipid Profile',
                      'Urine Routine Examination',
                      'Thyroid Profile (T3, T4, TSH)',
                      'Chest X-Ray PA View'
                    ].map((testName) => (
                      <label key={testName} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={modalLabSelectedTests.includes(testName)}
                          onChange={(e) => {
                            if (e.target.checked) setModalLabSelectedTests([...modalLabSelectedTests, testName]);
                            else setModalLabSelectedTests(modalLabSelectedTests.filter((t) => t !== testName));
                          }}
                        />
                        {testName}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Other Custom Test Name (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Serum Creatinine, Liver Function Test (LFT)"
                    value={modalLabCustomTest}
                    onChange={(e) => setModalLabCustomTest(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Clinical Remarks / Instructions for Lab Technician</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="e.g. Fasting sample required, check baseline glucose..."
                    value={modalLabRemarks}
                    onChange={(e) => setModalLabRemarks(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsLabRequestModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Send Request to Lab Technician
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: VIEW READ-ONLY LAB REPORT
      ────────────────────────────────────────────────────────── */}
      {viewLabReportData && (
        <div className="doctor-modal-backdrop" onClick={() => setViewLabReportData(null)}>
          <div className="doctor-modal-card" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.75rem 2rem' }}>
              {/* Lab Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--primary, #0057b8)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                    <FlaskLabIcon size={24} color="var(--primary, #0057b8)" />
                    <h2 style={{ color: 'var(--primary, #0057b8)', fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                      CarePoint Diagnostic Laboratory
                    </h2>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, paddingLeft: '30px' }}>
                    Central Clinical Laboratory &amp; Pathology Services
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-completed" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    Verified &amp; Final
                  </span>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem' }}>VIEW ONLY &bull; NO EDIT</div>
                </div>
              </div>

              {/* Patient & Doctor Strip */}
              {(() => {
                const rep = viewLabReportData.report || {};
                const ord = viewLabReportData.order || {};
                const pat = getPatientDetails(rep.patientId || ord.patientId, rep.patientName || ord.patientName);
                const evalRes = evaluateLabReading(rep.testName, rep.actualReading, rep.normalValue);

                return (
                  <div>
                    <div style={{ background: '#f8fafb', border: '1px solid #e2e8f0', padding: '0.85rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          Patient Information
                        </div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                          {pat.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                          ID: {pat.patientId || '—'} &bull; Age: {pat.age || '—'}, Gender: {pat.gender || '—'}, Blood: {pat.bloodGroup || '—'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          Prescribing Physician
                        </div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {rep.doctorName || ord.doctorName || currentUser.name || 'Dr. Prateek Pradeep'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                          Report Date: <strong>{rep.date || ord.date || new Date().toISOString().split('T')[0]}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Test Findings Table */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>
                        Investigation Parameters &amp; Observed Findings
                      </h4>
                      <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', background: '#fff', border: '1px solid #e2e8f0' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ padding: '0.55rem 0.75rem', fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b' }}>Test Name</th>
                              <th style={{ padding: '0.55rem 0.75rem', fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b' }}>Specimen</th>
                              <th style={{ padding: '0.55rem 0.75rem', fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b' }}>Normal Reference</th>
                              <th style={{ padding: '0.55rem 0.75rem', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--primary, #0057b8)' }}>Actual Reading</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700 }}>{rep.testName || (ord.tests && ord.tests[0]) || 'Diagnostic Panel'}</td>
                              <td style={{ padding: '0.6rem 0.75rem', color: '#64748b' }}>Blood / Specimen</td>
                              <td style={{ padding: '0.6rem 0.75rem', color: '#64748b' }}>{rep.normalValue || 'Standard Reference Range'}</td>
                              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800, color: evalRes.isAbnormal ? '#dc2626' : '#059669' }}>
                                {rep.actualReading || ord.actualReading || 'Normal'} &nbsp;
                                <span className={evalRes.isAbnormal ? 'doctor-badge-status-abnormal' : 'doctor-badge-status-normal'}>
                                  {evalRes.tag}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Remarks */}
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#166534', marginBottom: '0.25rem' }}>
                        Technician Remarks &amp; Clinical Notes
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#14532d', fontWeight: 500 }}>
                        {rep.remarks || ord.reportRemarks || 'Findings recorded and verified within standard laboratory parameters.'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.4rem' }}>
                        Reported by: <span>{rep.technicianName || 'Malathi Sreekumar (Certified Lab Technologist)'}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', borderTop: '1px dashed #e2e8f0', paddingTop: '0.75rem' }}>
                      Notice: This report is securely transmitted from the laboratory for physician review only. Modifications are disabled to preserve medical audit integrity.
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ padding: '0.9rem 1.5rem', background: '#f8fafb', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
              <button type="button" className="btn btn-primary" onClick={() => setViewLabReportData(null)}>
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
