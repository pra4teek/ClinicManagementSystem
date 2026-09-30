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
  LAB_REPORTS: 'cms_lab_reports',
  MEDICINES: 'cms_medicines',
  BILLS: 'cms_bills'
};

const DEFAULT_USERS = [
  { username: 'doctor', password: '123', role: 'Doctor', name: 'Dr. Prateek Pradeep' },
  { username: 'reception', password: '123', role: 'Receptionist', name: 'Joel Jain' },
  { username: 'pharma', password: '123', role: 'Pharmacist', name: 'Adarsh Chandran' },
  { username: 'labtech', password: '123', role: 'Lab Technician', name: 'Malathi Sreekumar' },
  { username: 'admin', password: '123', role: 'Admin', name: 'Bala Weslin' }
];

const DEFAULT_MEDICINES = [
  { id: 'MED-001', name: 'Paracetamol', dosage: '500mg', type: 'Tablet', quantity: 50, costValue: 10, mrp: 15 },
  { id: 'MED-002', name: 'Amoxicillin', dosage: '250mg', type: 'Capsule', quantity: 50, costValue: 15, mrp: 25 },
  { id: 'MED-003', name: 'Cetirizine', dosage: '10mg', type: 'Tablet', quantity: 50, costValue: 5, mrp: 10 },
  { id: 'MED-004', name: 'Metformin', dosage: '500mg', type: 'Tablet', quantity: 50, costValue: 12, mrp: 20 },
  { id: 'MED-005', name: 'Omeprazole', dosage: '20mg', type: 'Capsule', quantity: 50, costValue: 10, mrp: 18 },
  { id: 'MED-006', name: 'Ibuprofen', dosage: '400mg', type: 'Tablet', quantity: 50, costValue: 8, mrp: 12 },
  { id: 'MED-007', name: 'Azithromycin', dosage: '500mg', type: 'Tablet', quantity: 50, costValue: 30, mrp: 45 }
];

const DEFAULT_PATIENTS = [
  { patientId: 'PAT-1001', name: 'Arjun Ravi', age: 45, gender: 'Male', phone: '9876543210', bloodGroup: 'O+' },
  { patientId: 'PAT-1002', name: 'Rohit Krishna', age: 29, gender: 'Male', phone: '9845123456', bloodGroup: 'A+' }
];

const DEFAULT_APPOINTMENTS = [
  {
    appointmentId: 'APT-2001',
    patientId: 'PAT-1001',
    patientName: 'Arjun Ravi',
    doctorName: 'Dr. Prateek Pradeep',
    tokenNumber: 1,
    time: '10:00 AM',
    status: 'Scheduled',
    reason: 'Frequent headaches and mild fever'
  },
  {
    appointmentId: 'APT-2002',
    patientId: 'PAT-1002',
    patientName: 'Rohit Krishna',
    doctorName: 'Dr. Prateek Pradeep',
    tokenNumber: 2,
    time: '10:30 AM',
    status: 'Scheduled',
    reason: 'Severe throat pain and dry cough'
  }
];

const DEFAULT_CONSULTATIONS = [];

const DEFAULT_PRESCRIPTIONS = [];

const DEFAULT_LAB_ORDERS = [];

// Initialize storage automatically
function initCMSStorage() {
  if (!localStorage.getItem(CMS_KEYS.USERS))        localStorage.setItem(CMS_KEYS.USERS,        JSON.stringify(DEFAULT_USERS));
  if (!localStorage.getItem(CMS_KEYS.MEDICINES))    localStorage.setItem(CMS_KEYS.MEDICINES,    JSON.stringify(DEFAULT_MEDICINES));
  if (!localStorage.getItem(CMS_KEYS.PATIENTS))     localStorage.setItem(CMS_KEYS.PATIENTS,     JSON.stringify(DEFAULT_PATIENTS));
  if (!localStorage.getItem(CMS_KEYS.APPOINTMENTS)) localStorage.setItem(CMS_KEYS.APPOINTMENTS, JSON.stringify(DEFAULT_APPOINTMENTS));

  // If consultations array doesn't exist or is empty, seed defaults
  const currentCons = getStorage(CMS_KEYS.CONSULTATIONS, null);
  if (!currentCons || currentCons.length === 0) {
    localStorage.setItem(CMS_KEYS.CONSULTATIONS, JSON.stringify(DEFAULT_CONSULTATIONS));
  }

  // If prescriptions array doesn't exist or is empty, seed defaults
  const currentRx = getStorage(CMS_KEYS.PRESCRIPTIONS, null);
  if (!currentRx || currentRx.length === 0) {
    localStorage.setItem(CMS_KEYS.PRESCRIPTIONS, JSON.stringify(DEFAULT_PRESCRIPTIONS));
  }

  // If lab orders array doesn't exist or is empty, seed defaults
  const currentLabs = getStorage(CMS_KEYS.LAB_ORDERS, null);
  if (!currentLabs || currentLabs.length === 0) {
    localStorage.setItem(CMS_KEYS.LAB_ORDERS, JSON.stringify(DEFAULT_LAB_ORDERS));
  }

  if (!localStorage.getItem(CMS_KEYS.LAB_REPORTS))  localStorage.setItem(CMS_KEYS.LAB_REPORTS,  JSON.stringify([]));
  if (!localStorage.getItem(CMS_KEYS.BILLS))        localStorage.setItem(CMS_KEYS.BILLS,        JSON.stringify([]));

  // Sync any Completed appointment without a consultation record
  const appts = getStorage(CMS_KEYS.APPOINTMENTS, []);
  const consList = getStorage(CMS_KEYS.CONSULTATIONS, []);
  let consUpdated = false;

  appts.filter(a => a.status === 'Completed').forEach(completedAppt => {
    const found = consList.find(c => c.appointmentId === completedAppt.appointmentId);
    if (!found) {
      consList.push({
        consultationId: `CNS-${completedAppt.appointmentId || Date.now()}`,
        appointmentId: completedAppt.appointmentId,
        patientId: completedAppt.patientId,
        patientName: completedAppt.patientName,
        doctorName: completedAppt.doctorName || 'Dr. Prateek Pradeep',
        date: new Date().toISOString().split('T')[0],
        vitals: { bp: '120/80', pulse: '72', temp: '37.0', weight: '65' },
        symptoms: completedAppt.reason || 'General health consultation',
        diagnosis: completedAppt.reason || 'Health Checkup Completed',
        remarks: 'Consultation completed. Advised lifestyle management and routine review.',
        status: 'Completed'
      });
      consUpdated = true;
    }
  });

  if (consUpdated) {
    setStorage(CMS_KEYS.CONSULTATIONS, consList);
  }

  // Automatically update to Indian names, 2 patients, reset all patients and completely clear orphan lab tests
  if (!localStorage.getItem('cms_two_patients_clean_v13')) {
    setStorage(CMS_KEYS.USERS, DEFAULT_USERS);
    setStorage(CMS_KEYS.PATIENTS, DEFAULT_PATIENTS);
    setStorage(CMS_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
    setStorage(CMS_KEYS.CONSULTATIONS, []);
    setStorage(CMS_KEYS.PRESCRIPTIONS, []);
    setStorage(CMS_KEYS.LAB_ORDERS, []);
    setStorage(CMS_KEYS.LAB_REPORTS, []);
    try {
      localStorage.removeItem("carepoint_lab_data");
      localStorage.removeItem("carepointClinicAdminDataV2");
    } catch(e) {}
    const curr = getStorage(CMS_KEYS.CURRENT_USER, null);
    if (curr && curr.role) {
      const matchUser = DEFAULT_USERS.find(u => u.role.toLowerCase() === curr.role.toLowerCase());
      if (matchUser) setStorage(CMS_KEYS.CURRENT_USER, matchUser);
    }
    localStorage.setItem('cms_two_patients_clean_v13', 'true');
  }
}

function resetAllToScheduled() {
  // 1. Reset all appointments to 'Scheduled'
  const appts = getStorage(CMS_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
  if (appts && appts.length > 0) {
    appts.forEach(a => {
      a.status = 'Scheduled';
      a.doctorName = 'Dr. Prateek Pradeep';
    });
    setStorage(CMS_KEYS.APPOINTMENTS, appts);
  }

  // 2. Clear completed consultations so all patients are fresh
  setStorage(CMS_KEYS.CONSULTATIONS, []);

  // 3. Clear prescriptions
  setStorage(CMS_KEYS.PRESCRIPTIONS, []);

  // 4. Completely clear all lab orders and lab reports (patients have NO lab tests before seeing the doctor)
  setStorage(CMS_KEYS.LAB_ORDERS, []);
  setStorage(CMS_KEYS.LAB_REPORTS, []);

  // 5. Clear lab technician local storage cache and consultation drafts
  try {
    localStorage.removeItem("carepoint_lab_data");
    localStorage.removeItem("cms_consultation_drafts");
  } catch(e) {}

  // Dispatch events for open tabs
  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('cms_rx_updated'));
    window.dispatchEvent(new Event('cms_stock_updated'));
  } catch(e) {}
}

const setAllAppointmentsScheduled = resetAllToScheduled;

function resetAllDemoData() {
  localStorage.setItem(CMS_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  localStorage.setItem(CMS_KEYS.MEDICINES,     JSON.stringify(DEFAULT_MEDICINES));
  localStorage.setItem(CMS_KEYS.PATIENTS,      JSON.stringify(DEFAULT_PATIENTS));
  localStorage.setItem(CMS_KEYS.APPOINTMENTS,  JSON.stringify(DEFAULT_APPOINTMENTS));
  localStorage.setItem(CMS_KEYS.CONSULTATIONS, JSON.stringify(DEFAULT_CONSULTATIONS));
  localStorage.setItem(CMS_KEYS.PRESCRIPTIONS, JSON.stringify(DEFAULT_PRESCRIPTIONS));
  localStorage.setItem(CMS_KEYS.LAB_ORDERS,    JSON.stringify(DEFAULT_LAB_ORDERS));
  localStorage.setItem(CMS_KEYS.LAB_REPORTS,   JSON.stringify([]));
  localStorage.setItem(CMS_KEYS.BILLS,         JSON.stringify([]));
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

function getAdminMedicineStock() {
  // Read live stock from Admin's storage key first
  try {
    const adminRaw = localStorage.getItem('carepointClinicAdminDataV2');
    if (adminRaw) {
      const adminData = JSON.parse(adminRaw);
      if (Array.isArray(adminData.medicines) && adminData.medicines.length > 0) {
        return adminData.medicines.map(m => ({
          id: `MED-${m.MedicineId}`,
          MedicineId: m.MedicineId,
          name: m.MedicineName,
          MedicineName: m.MedicineName,
          dosage: m.Dosage || '500mg',
          type: m.Type || m.Category || 'Tablet',
          category: m.Category || m.Type || 'General',
          manufacturer: m.Manufacturer || 'Not specified',
          costValue: Number(m.CostValue || 0),
          mrp: Number(m.MRP || 15),
          quantity: Number(m.Quantity ?? 0)
        }));
      }
    }
  } catch(e) {}

  // Fallback to cms_medicines
  const cmsMeds = getStorage(CMS_KEYS.MEDICINES, DEFAULT_MEDICINES);
  return cmsMeds.map((m, idx) => ({
    id: m.id || `MED-${idx + 1}`,
    MedicineId: idx + 1,
    name: m.name || m.MedicineName,
    MedicineName: m.name || m.MedicineName,
    dosage: m.dosage || m.Dosage || '500mg',
    type: m.type || m.Type || 'Tablet',
    category: m.category || m.Category || 'General',
    manufacturer: m.manufacturer || m.Manufacturer || 'Not specified',
    costValue: Number(m.costValue || m.CostValue || 0),
    mrp: Number(m.mrp || m.MRP || 15),
    quantity: Number(m.quantity ?? m.Quantity ?? 50)
  }));
}

function checkMedicineStock(medicineName) {
  const norm = String(medicineName || '').toLowerCase().trim();
  const allMeds = getAdminMedicineStock();
  const found = allMeds.find(m =>
    (m.name || m.MedicineName || '').toLowerCase().trim() === norm ||
    norm.includes((m.name || m.MedicineName || '').toLowerCase().trim())
  );
  if (!found) {
    return { exists: false, inStock: false, quantity: 0, medicine: null };
  }
  const qty = Number(found.quantity ?? 0);
  return { exists: true, inStock: qty > 0, quantity: qty, medicine: found };
}

function deductAdminMedicineStock(medicineName, qtyToDeduct = 1) {
  const normName = String(medicineName || '').toLowerCase().trim();
  let deducted = false;
  let remainingStock = 0;

  // 1. Update in Admin storage (carepointClinicAdminDataV2)
  try {
    const adminRaw = localStorage.getItem('carepointClinicAdminDataV2');
    if (adminRaw) {
      const adminData = JSON.parse(adminRaw);
      if (Array.isArray(adminData.medicines)) {
        const found = adminData.medicines.find(m =>
          (m.MedicineName || '').toLowerCase().trim() === normName ||
          normName.includes((m.MedicineName || '').toLowerCase().trim())
        );
        if (found) {
          const currentQty = Number(found.Quantity ?? 0);
          found.Quantity = Math.max(0, currentQty - qtyToDeduct);
          remainingStock = found.Quantity;
          deducted = true;
          localStorage.setItem('carepointClinicAdminDataV2', JSON.stringify(adminData));
        }
      }
    }
  } catch(e) {}

  // 2. Update in cms_medicines
  try {
    const cmsMeds = getStorage(CMS_KEYS.MEDICINES, DEFAULT_MEDICINES);
    const foundCms = cmsMeds.find(m =>
      (m.name || m.MedicineName || '').toLowerCase().trim() === normName ||
      normName.includes((m.name || m.MedicineName || '').toLowerCase().trim())
    );
    if (foundCms) {
      const currentQty = Number(foundCms.quantity ?? foundCms.Quantity ?? 0);
      foundCms.quantity = Math.max(0, currentQty - qtyToDeduct);
      foundCms.Quantity = foundCms.quantity;
      if (!deducted) remainingStock = foundCms.quantity;
      deducted = true;
      setStorage(CMS_KEYS.MEDICINES, cmsMeds);
    }
  } catch(e) {}

  // 3. Update in cms_pharmacy_ui inventory if present
  try {
    const puiRaw = localStorage.getItem('cms_pharmacy_ui');
    if (puiRaw) {
      const pui = JSON.parse(puiRaw);
      if (Array.isArray(pui.inventory)) {
        const foundInv = pui.inventory.find(i =>
          (i.medicine || '').toLowerCase().includes(normName) ||
          normName.includes((i.medicine || '').toLowerCase())
        );
        if (foundInv) {
          foundInv.quantity = Math.max(0, Number(foundInv.quantity || 0) - qtyToDeduct);
          localStorage.setItem('cms_pharmacy_ui', JSON.stringify(pui));
        }
      }
    }
  } catch(e) {}

  // Dispatch storage event manually for same-window updates
  try {
    window.dispatchEvent(new Event('cms_stock_updated'));
  } catch(e) {}

  return { success: deducted, remainingStock };
}

initCMSStorage();
