/* ========================================================
   CAREPOINT CLINIC MANAGEMENT SYSTEM - SHARED DATA & LOCALSTORAGE
   ======================================================== */

const CMS_KEYS = {
  USERS: 'cms_users',
  CURRENT_USER: 'cms_current_user',
  PATIENTS: 'cms_patients',
  APPOINTMENTS: 'cms_appointments',
  CONSULTATIONS: 'cms_consultations',
  PRESCRIPTIONS: 'cms_prescriptions',
  LAB_ORDERS: 'cms_lab_orders',
  MEDICINES: 'cms_medicines'
};

const DEFAULT_USERS = [
  { username: 'doctor', password: '123', role: 'Doctor', name: 'Dr. Jane Smith' },
  { username: 'reception', password: '123', role: 'Receptionist', name: 'Sarah Miller' },
  { username: 'pharma', password: '123', role: 'Pharmacist', name: 'Alex Johnson' },
  { username: 'labtech', password: '123', role: 'Lab Technician', name: 'David Lee' },
  { username: 'admin', password: '123', role: 'Admin', name: 'Admin User' }
];

const DEFAULT_MEDICINES = [
  { id: 'MED-001', name: 'Paracetamol', dosage: '500mg', type: 'Tablet' },
  { id: 'MED-002', name: 'Amoxicillin', dosage: '250mg', type: 'Capsule' },
  { id: 'MED-003', name: 'Cetirizine', dosage: '10mg', type: 'Tablet' },
  { id: 'MED-004', name: 'Metformin', dosage: '500mg', type: 'Tablet' },
  { id: 'MED-005', name: 'Omeprazole', dosage: '20mg', type: 'Capsule' },
  { id: 'MED-006', name: 'Ibuprofen', dosage: '400mg', type: 'Tablet' },
  { id: 'MED-007', name: 'Azithromycin', dosage: '500mg', type: 'Tablet' }
];

const DEFAULT_PATIENTS = [
  { patientId: 'PAT-1001', name: 'Robert Davis', age: 45, gender: 'Male', phone: '9876543210', bloodGroup: 'O+' },
  { patientId: 'PAT-1002', name: 'Emma Watson', age: 29, gender: 'Female', phone: '9845123456', bloodGroup: 'A+' },
  { patientId: 'PAT-1003', name: 'Liam Johnson', age: 62, gender: 'Male', phone: '9712345678', bloodGroup: 'B-' },
  { patientId: 'PAT-1004', name: 'Sophia Martinez', age: 34, gender: 'Female', phone: '9923456781', bloodGroup: 'AB+' }
];

const DEFAULT_APPOINTMENTS = [
  {
    appointmentId: 'APT-2001',
    patientId: 'PAT-1001',
    patientName: 'Robert Davis',
    doctorName: 'Dr. Jane Smith',
    tokenNumber: 1,
    time: '10:00 AM',
    status: 'Scheduled',
    reason: 'Frequent headaches and mild fever'
  },
  {
    appointmentId: 'APT-2002',
    patientId: 'PAT-1002',
    patientName: 'Emma Watson',
    doctorName: 'Dr. Jane Smith',
    tokenNumber: 2,
    time: '10:30 AM',
    status: 'Scheduled',
    reason: 'Severe throat pain and dry cough'
  },
  {
    appointmentId: 'APT-2003',
    patientId: 'PAT-1003',
    patientName: 'Liam Johnson',
    doctorName: 'Dr. Jane Smith',
    tokenNumber: 3,
    time: '11:00 AM',
    status: 'Scheduled',
    reason: 'Routine diabetic & BP checkup'
  },
  {
    appointmentId: 'APT-2004',
    patientId: 'PAT-1004',
    patientName: 'Sophia Martinez',
    doctorName: 'Dr. Jane Smith',
    tokenNumber: 4,
    time: '11:30 AM',
    status: 'Completed',
    reason: 'Acidity and stomach discomfort'
  }
];

// Initialize storage automatically
function initCMSStorage() {
  if (!localStorage.getItem(CMS_KEYS.USERS)) localStorage.setItem(CMS_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  if (!localStorage.getItem(CMS_KEYS.MEDICINES)) localStorage.setItem(CMS_KEYS.MEDICINES, JSON.stringify(DEFAULT_MEDICINES));
  if (!localStorage.getItem(CMS_KEYS.PATIENTS)) localStorage.setItem(CMS_KEYS.PATIENTS, JSON.stringify(DEFAULT_PATIENTS));
  if (!localStorage.getItem(CMS_KEYS.APPOINTMENTS)) localStorage.setItem(CMS_KEYS.APPOINTMENTS, JSON.stringify(DEFAULT_APPOINTMENTS));
  if (!localStorage.getItem(CMS_KEYS.CONSULTATIONS)) localStorage.setItem(CMS_KEYS.CONSULTATIONS, JSON.stringify([]));
  if (!localStorage.getItem(CMS_KEYS.PRESCRIPTIONS)) localStorage.setItem(CMS_KEYS.PRESCRIPTIONS, JSON.stringify([]));
  if (!localStorage.getItem(CMS_KEYS.LAB_ORDERS)) localStorage.setItem(CMS_KEYS.LAB_ORDERS, JSON.stringify([]));
}

function resetAllDemoData() {
  localStorage.setItem(CMS_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  localStorage.setItem(CMS_KEYS.MEDICINES, JSON.stringify(DEFAULT_MEDICINES));
  localStorage.setItem(CMS_KEYS.PATIENTS, JSON.stringify(DEFAULT_PATIENTS));
  localStorage.setItem(CMS_KEYS.APPOINTMENTS, JSON.stringify(DEFAULT_APPOINTMENTS));
  localStorage.setItem(CMS_KEYS.CONSULTATIONS, JSON.stringify([]));
  localStorage.setItem(CMS_KEYS.PRESCRIPTIONS, JSON.stringify([]));
  localStorage.setItem(CMS_KEYS.LAB_ORDERS, JSON.stringify([]));
  alert('Demo data has been reset to defaults!');
  window.location.reload();
}

function getStorage(key, fallback = []) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CMS_KEYS.CURRENT_USER));
  } catch (e) {
    return null;
  }
}

function setCurrentUser(u) {
  localStorage.setItem(CMS_KEYS.CURRENT_USER, JSON.stringify(u));
}

function logoutUser(redirect = '../index.html') {
  localStorage.removeItem(CMS_KEYS.CURRENT_USER);
  window.location.href = redirect;
}

function requireAuth(allowedRoles = [], redirect = '../index.html') {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = redirect;
    return null;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    alert(`Access denied! Role required: ${allowedRoles.join(' or ')}`);
    window.location.href = redirect;
    return null;
  }
  return user;
}

function showToast(msg, type = 'info') {
  let c = document.querySelector('.toast-container');
  if (!c) {
    c = document.createElement('div');
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

initCMSStorage();
