import api from './api.js';

// Helper error handler

// Helper error handler
function handleApiError(err) {
  const message =
    err.response?.data?.error ||
    err.response?.data?.detail ||
    (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : null) ||
    err.message ||
    'API request failed';
  throw new Error(message);
}

// -------------------------------------------------------------
// NORMALIZATION HELPERS (Ensure both PascalCase and camelCase keys)
// -------------------------------------------------------------
export const normalizeUser = (u = {}) => ({
  ...u,
  id: u.UserId || u.id,
  UserId: u.UserId || u.id,
  username: u.Username || u.username || '',
  Username: u.Username || u.username || '',
  name: u.Name || u.name || u.Username || u.username || 'User',
  Name: u.Name || u.name || u.Username || u.username || 'User',
  roleId: u.RoleId || u.roleId,
  RoleId: u.RoleId || u.roleId,
  isActive: u.isActive !== false,
  status: u.isActive !== false ? 'Active' : 'Inactive',
  DOB: u.DOB || u.dob || '',
  Address: u.Address || u.address || '',
  PhoneNumber: u.PhoneNumber || u.phone || u.phoneNumber || '',
  EmailId: u.EmailId || u.email || ''
});

export const normalizeRole = (r = {}) => ({
  ...r,
  id: r.RoleId || r.id,
  RoleId: r.RoleId || r.id,
  name: r.RoleName || r.name || '',
  roleName: r.RoleName || r.name || '',
  RoleName: r.RoleName || r.name || ''
});

export const normalizeDepartment = (d = {}) => ({
  ...d,
  id: d.DepartmentId || d.id,
  DepartmentId: d.DepartmentId || d.id,
  name: d.DepartmentName || d.name || '',
  departmentName: d.DepartmentName || d.name || '',
  DepartmentName: d.DepartmentName || d.name || '',
  isActive: d.isActive !== false
});

export const normalizeDoctor = (doc = {}) => ({
  ...doc,
  id: doc.DoctorId || doc.id,
  DoctorId: doc.DoctorId || doc.id,
  name: doc.Name || doc.name || '',
  Name: doc.Name || doc.name || '',
  userId: doc.UserId || doc.userId,
  UserId: doc.UserId || doc.userId,
  departmentId: doc.DepartmentId || doc.departmentId,
  DepartmentId: doc.DepartmentId || doc.departmentId,
  qualification: doc.Qualification || doc.qualification || '',
  Qualification: doc.Qualification || doc.qualification || '',
  specialization: doc.Specialization || doc.specialization || '',
  Specialization: doc.Specialization || doc.specialization || '',
  isActive: doc.isActive !== false
});

export const normalizeStaff = (s = {}) => ({
  ...s,
  id: s.StaffId || s.id,
  StaffId: s.StaffId || s.id,
  name: s.Name || s.name || '',
  Name: s.Name || s.name || '',
  userId: s.UserId || s.userId,
  UserId: s.UserId || s.userId,
  roleId: s.RoleId || s.roleId,
  RoleId: s.RoleId || s.roleId,
  phone: s.phoneNumber || s.phone || '',
  phoneNumber: s.phoneNumber || s.phone || '',
  dob: s.DateofBirth || s.dob || '',
  DateofBirth: s.DateofBirth || s.dob || '',
  joiningDate: s.DateOfJoining || s.joiningDate || '',
  DateOfJoining: s.DateOfJoining || s.joiningDate || '',
  address: s.Address || s.address || '',
  Address: s.Address || s.address || ''
});

export const normalizeMedicine = (m = {}, stockRow = null) => {
  const cost = Number(m.CostValue || m.costValue || m.unitPrice || 0);
  const mrp = Number(m.MRP || m.mrp || m.sellingPrice || 0);
  const qty = stockRow ? Number(stockRow.QuantityOnHand ?? stockRow.quantity ?? 0) : Number(m.quantity ?? 0);
  const stockId = stockRow ? (stockRow.StockId || stockRow.id) : null;
  const reorder = stockRow ? Number(stockRow.ReorderLevel || 10) : Number(m.reorderLevel || 10);

  return {
    ...m,
    id: m.MedicineId || m.id,
    MedicineId: m.MedicineId || m.id,
    name: m.MedicineName || m.name || '',
    medicineName: m.MedicineName || m.name || '',
    MedicineName: m.MedicineName || m.name || '',
    manufacturer: m.Manufacturer || m.manufacturer || '',
    Manufacturer: m.Manufacturer || m.manufacturer || '',
    genericName: m.GenericName || m.genericName || '',
    GenericName: m.GenericName || m.genericName || '',
    category: m.Category || m.category || 'General',
    Category: m.Category || m.category || 'General',
    costValue: cost,
    CostValue: cost,
    unitPrice: cost,
    mrp: mrp,
    MRP: mrp,
    sellingPrice: mrp,
    quantity: qty,
    stockId: stockId,
    reorderLevel: reorder,
    isActive: m.isActive !== false
  };
};

export const normalizeDosage = (ds = {}) => ({
  ...ds,
  id: ds.DosageId || ds.id,
  DosageId: ds.DosageId || ds.id,
  dosage: ds.DosageValue || ds.dosage || '',
  dosageValue: ds.DosageValue || ds.dosage || '',
  DosageValue: ds.DosageValue || ds.dosage || '',
  instructions: ds.Instructions || ds.instructions || '',
  Instructions: ds.Instructions || ds.instructions || ''
});

export const normalizeLabTest = (lt = {}) => ({
  ...lt,
  id: lt.LabtestId || lt.id,
  LabtestId: lt.LabtestId || lt.id,
  name: lt.TestName || lt.name || '',
  testName: lt.TestName || lt.name || '',
  TestName: lt.TestName || lt.name || '',
  departmentId: lt.DepartmentId || lt.departmentId,
  DepartmentId: lt.DepartmentId || lt.departmentId,
  normalRange: lt.NormalName || lt.normalRange || '',
  normalName: lt.NormalName || lt.normalName || '',
  NormalName: lt.NormalName || lt.normalName || '',
  cost: Number(lt.TestCost || lt.cost || 0),
  testCost: Number(lt.TestCost || lt.cost || 0),
  TestCost: Number(lt.TestCost || lt.cost || 0),
  isActive: lt.isActive !== false
});

export const normalizeAppointment = (a = {}) => ({
  ...a,
  id: a.AppointmentId || a.id,
  AppointmentId: a.AppointmentId || a.id,
  patientName: a.PatientName || a.patientName || '',
  doctorName: a.DoctorName || a.doctorName || '',
  departmentName: a.DepartmentName || a.departmentName || '',
  status: a.AppointmentStatus || a.status || '',
  AppointmentStatus: a.AppointmentStatus || a.status || '',
  dateTime: a.AppointmentDateTime || a.dateTime || '',
  AppointmentDateTime: a.AppointmentDateTime || a.dateTime || ''
});

export const normalizePatient = (p = {}) => ({
  ...p,
  id: p.PatientId || p.id,
  PatientId: p.PatientId || p.id,
  name: p.Name || p.name || '',
  Name: p.Name || p.name || '',
  gender: p.Gender || p.gender || '',
  Gender: p.Gender || p.gender || '',
  dob: p.DOB || p.dob || '',
  DOB: p.DOB || p.dob || '',
  phone: p.PhoneNumber || p.phone || '',
  PhoneNumber: p.PhoneNumber || p.phone || '',
  address: p.Address || p.address || '',
  Address: p.Address || p.address || '',
  bloodGroup: p.BloodGroup || p.bloodGroup || '',
  BloodGroup: p.BloodGroup || p.bloodGroup || '',
  // weight: Number(p.Weight || p.weight || 0),
  // Weight: Number(p.Weight || p.weight || 0),
  // height: Number(p.Height || p.height || 0),
  // Height: Number(p.Height || p.height || 0)
});

export const normalizeAuditLog = (log = {}) => ({
  ...log,
  id: log.AuditId || log.id,
  AuditId: log.AuditId || log.id,
  actionType: log.ActionType || log.actionType || '',
  ActionType: log.ActionType || log.actionType || '',
  tableAffected: log.TableAffected || log.tableAffected || '',
  TableAffected: log.TableAffected || log.tableAffected || '',
  recordId: log.RecordId ?? log.recordId,
  RecordId: log.RecordId ?? log.recordId,
  userId: log.UserId ?? log.userId,
  UserId: log.UserId ?? log.userId,
  details: log.Details || log.details || '',
  Details: log.Details || log.details || '',
  timestamp: log.action_time || log.timestamp || '',
  action_time: log.action_time || log.timestamp || ''
});

// -------------------------------------------------------------
// PURE DJANGO MYSQL ADMIN SERVICE
// -------------------------------------------------------------
export const adminService = {
  // 1. DASHBOARD OVERVIEW
  getDashboardMetrics: async () => {
    try {
      const res = await api.get('/admin/dashboard/');
      if (res.data) {
        return {
          users: {
            total: Number(res.data.users?.total || 0),
            active: Number(res.data.users?.active || 0),
            inactive: Number(res.data.users?.inactive || 0)
          },
          appointments: {
            today: Number(res.data.appointments?.today || 0),
            waiting: Number(res.data.appointments?.waiting || 0),
            completed: Number(res.data.appointments?.completed || 0)
          },
          patients_registered: Number(res.data.patients_registered || 0),
          recent_audit_activity: (Array.isArray(res.data.recent_audit_activity) ? res.data.recent_audit_activity : []).map(normalizeAuditLog)
        };
      }
    } catch (err) {
      handleApiError(err);
    }
    return {
      users: { total: 0, active: 0, inactive: 0 },
      appointments: { today: 0, waiting: 0, completed: 0 },
      patients_registered: 0,
      recent_audit_activity: []
    };
  },

  // 2. USERS MANAGEMENT
  getUsers: async () => {
    try {
      const res = await api.get('/admin/users/');
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return rawList.map(normalizeUser);
    } catch (err) {
      handleApiError(err);
      return [];
    }
  },

  createUser: async (userData) => {
    const payload = {
      Username: (userData.Username || userData.username || '').trim(),
      Password: (userData.Password || userData.password || 'password123').trim(),
      RoleId: Number(userData.RoleId || userData.roleId || 1),
      isActive: userData.isActive !== false
    };

    try {
      const res = await api.post('/admin/users/', payload);
      return normalizeUser(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  updateUser: async (userId, userData) => {
    const payload = {
      Username: (userData.Username || userData.username || '').trim(),
      RoleId: Number(userData.RoleId || userData.roleId || 1),
      isActive: userData.isActive !== false
    };
    if (userData.Password && userData.Password.trim().length >= 4) {
      payload.Password = userData.Password.trim();
    }

    try {
      const res = payload.Password
        ? await api.put(`/admin/users/${userId}/`, payload)
        : await api.patch(`/admin/users/${userId}/`, payload);
      return normalizeUser(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  deleteUser: async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}/`);
      return true;
    } catch (err) {
      handleApiError(err);
    }
  },

  activateUser: async (userId) => {
    try {
      const res = await api.post(`/admin/users/${userId}/activate/`);
      return normalizeUser(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  deactivateUser: async (userId) => {
    try {
      const res = await api.post(`/admin/users/${userId}/deactivate/`);
      return normalizeUser(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  // 3. ROLES MANAGEMENT
  getRoles: async () => {
    try {
      const res = await api.get('/admin/roles/');
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return rawList.map(normalizeRole);
    } catch (err) {
      handleApiError(err);
      return [];
    }
  },

  createRole: async (roleData) => {
    const payload = {
      RoleName: (roleData.RoleName || roleData.name || '').trim()
    };
    try {
      const res = await api.post('/admin/roles/', payload);
      return normalizeRole(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  updateRole: async (roleId, roleData) => {
    const payload = {
      RoleName: (roleData.RoleName || roleData.name || '').trim()
    };
    try {
      const res = await api.put(`/admin/roles/${roleId}/`, payload);
      return normalizeRole(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  deleteRole: async (roleId) => {
    try {
      await api.delete(`/admin/roles/${roleId}/`);
      return true;
    } catch (err) {
      handleApiError(err);
    }
  },

  // 4. DEPARTMENTS MANAGEMENT
  getDepartments: async () => {
    try {
      const res = await api.get('/admin/departments/');
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return rawList.map(normalizeDepartment);
    } catch (err) {
      handleApiError(err);
      return [];
    }
  },

  createDepartment: async (deptData) => {
    const payload = {
      DepartmentName: (deptData.DepartmentName || deptData.name || '').trim(),
      isActive: deptData.isActive !== false
    };
    try {
      const res = await api.post('/admin/departments/', payload);
      return normalizeDepartment(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  updateDepartment: async (deptId, deptData) => {
    const payload = {
      DepartmentName: (deptData.DepartmentName || deptData.name || '').trim(),
      isActive: deptData.isActive !== false
    };
    try {
      const res = await api.put(`/admin/departments/${deptId}/`, payload);
      return normalizeDepartment(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  deleteDepartment: async (deptId) => {
    try {
      await api.delete(`/admin/departments/${deptId}/`);
      return true;
    } catch (err) {
      handleApiError(err);
    }
  },

  activateDepartment: async (deptId) => {
    try {
      const res = await api.post(`/admin/departments/${deptId}/activate/`);
      return normalizeDepartment(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  deactivateDepartment: async (deptId) => {
    try {
      const res = await api.post(`/admin/departments/${deptId}/deactivate/`);
      return normalizeDepartment(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  // 5. DOCTORS MANAGEMENT
  getDoctors: async () => {
    try {
      const res = await api.get('/admin/doctors/');
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return rawList.map(normalizeDoctor);
    } catch (err) {
      handleApiError(err);
      return [];
    }
  },

  createDoctor: async (docData) => {
    let userId = docData.UserId || docData.userId ? Number(docData.UserId || docData.userId) : null;

    // Doctor.UserId is a required OneToOneField to User. If not provided, create User account first.
    if (!userId) {
      const cleanName = (docData.Name || docData.name || 'doctor').toLowerCase().replace(/[^a-z0-9]/g, '');
      const autoUsername = `dr.${cleanName || 'doc'}_${Date.now().toString().slice(-4)}`;
      const userRes = await api.post('/admin/users/', {
        Username: autoUsername,
        Password: 'password123',
        RoleId: 2, // Doctor
        isActive: true
      });
      userId = userRes.data?.UserId || userRes.data?.id;
    }

    const payload = {
      Name: (docData.Name || docData.name || '').trim(),
      UserId: Number(userId),
      DepartmentId: Number(docData.DepartmentId || docData.departmentId || 1),
      Qualification: docData.Qualification || docData.qualification || 'MBBS',
      Specialization: docData.Specialization || docData.specialization || 'General',
      isActive: docData.isActive !== false
    };

    try {
      const res = await api.post('/admin/doctors/', payload);
      return normalizeDoctor(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  updateDoctor: async (docId, docData) => {
    const payload = {
      Name: (docData.Name || docData.name || '').trim(),
      UserId: Number(docData.UserId || docData.userId || 1),
      DepartmentId: Number(docData.DepartmentId || docData.departmentId || 1),
      Qualification: docData.Qualification || docData.qualification || 'MBBS',
      Specialization: docData.Specialization || docData.specialization || 'General',
      isActive: docData.isActive !== false
    };

    try {
      const res = await api.put(`/admin/doctors/${docId}/`, payload);
      return normalizeDoctor(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  deleteDoctor: async (docId) => {
    try {
      await api.delete(`/admin/doctors/${docId}/`);
      return true;
    } catch (err) {
      handleApiError(err);
    }
  },

  activateDoctor: async (docId) => {
    try {
      const res = await api.post(`/admin/doctors/${docId}/activate/`);
      return normalizeDoctor(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  deactivateDoctor: async (docId) => {
    try {
      const res = await api.post(`/admin/doctors/${docId}/deactivate/`);
      return normalizeDoctor(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  // 6. STAFF DIRECTORY (Receptionists, Lab Techs, Pharmacists)
  getStaff: async () => {
    try {
      const res = await api.get('/admin/staff/');
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return rawList.map(normalizeStaff);
    } catch (err) {
      handleApiError(err);
      return [];
    }
  },

  createStaff: async (staffData) => {
    let userId = staffData.UserId || staffData.userId ? Number(staffData.UserId || staffData.userId) : null;
    const roleId = Number(staffData.RoleId || staffData.roleId || 3);

    // Staff.UserId is a required OneToOneField to User.
    if (!userId) {
      const cleanName = (staffData.Name || staffData.name || 'staff').toLowerCase().replace(/[^a-z0-9]/g, '');
      const autoUsername = `staff.${cleanName || 'member'}_${Date.now().toString().slice(-4)}`;
      const userRes = await api.post('/admin/users/', {
        Username: autoUsername,
        Password: 'password123',
        RoleId: roleId,
        isActive: true
      });
      userId = userRes.data?.UserId || userRes.data?.id;
    }

    let phone = String(staffData.phoneNumber || staffData.phone || '9876543210').replace(/\D/g, '');
    if (phone.length !== 10) {
      phone = phone.padEnd(10, '0').slice(0, 10);
    }

    const payload = {
      Name: (staffData.Name || staffData.name || '').trim(),
      UserId: Number(userId),
      RoleId: roleId,
      DateofBirth: staffData.DateofBirth || staffData.dob || '1995-01-01',
      DateOfJoining: staffData.DateOfJoining || staffData.joiningDate || new Date().toISOString().split('T')[0],
      Address: staffData.Address || staffData.address || 'Bangalore, India',
      phoneNumber: phone
    };

    try {
      const res = await api.post('/admin/staff/', payload);
      return normalizeStaff(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  updateStaff: async (staffId, staffData) => {
    let phone = String(staffData.phoneNumber || staffData.phone || '9876543210').replace(/\D/g, '');
    if (phone.length !== 10) {
      phone = phone.padEnd(10, '0').slice(0, 10);
    }

    const payload = {
      Name: (staffData.Name || staffData.name || '').trim(),
      UserId: Number(staffData.UserId || staffData.userId || 1),
      RoleId: Number(staffData.RoleId || staffData.roleId || 3),
      DateofBirth: staffData.DateofBirth || staffData.dob || '1995-01-01',
      DateOfJoining: staffData.DateOfJoining || staffData.joiningDate || new Date().toISOString().split('T')[0],
      Address: staffData.Address || staffData.address || 'Bangalore, India',
      phoneNumber: phone
    };

    try {
      const res = await api.put(`/admin/staff/${staffId}/`, payload);
      return normalizeStaff(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  deleteStaff: async (staffId) => {
    try {
      await api.delete(`/admin/staff/${staffId}/`);
      return true;
    } catch (err) {
      handleApiError(err);
    }
  },

  // 7. LAB TESTS CATALOG
  getLabTests: async () => {
    try {
      const res = await api.get('/admin/lab-tests/');
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return rawList.map(normalizeLabTest);
    } catch (err) {
      handleApiError(err);
      return [];
    }
  },

  createLabTest: async (testData) => {
    const payload = {
      TestName: (testData.TestName || testData.name || '').trim(),
      DepartmentId: Number(testData.DepartmentId || testData.departmentId || 1),
      NormalName: testData.NormalName || testData.normalRange || 'Normal',
      TestCost: parseFloat(testData.TestCost || testData.cost || 0),
      isActive: testData.isActive !== false
    };

    try {
      const res = await api.post('/admin/lab-tests/', payload);
      return normalizeLabTest(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  updateLabTest: async (testId, testData) => {
    const payload = {
      TestName: (testData.TestName || testData.name || '').trim(),
      DepartmentId: Number(testData.DepartmentId || testData.departmentId || 1),
      NormalName: testData.NormalName || testData.normalRange || 'Normal',
      TestCost: parseFloat(testData.TestCost || testData.cost || 0),
      isActive: testData.isActive !== false
    };

    try {
      const res = await api.put(`/admin/lab-tests/${testId}/`, payload);
      return normalizeLabTest(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  deleteLabTest: async (testId) => {
    try {
      await api.delete(`/admin/lab-tests/${testId}/`);
      return true;
    } catch (err) {
      handleApiError(err);
    }
  },

  activateLabTest: async (testId) => {
    try {
      const res = await api.post(`/admin/lab-tests/${testId}/activate/`);
      return normalizeLabTest(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  deactivateLabTest: async (testId) => {
    try {
      const res = await api.post(`/admin/lab-tests/${testId}/deactivate/`);
      return normalizeLabTest(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  // 8. MASTER MEDICINES & PHARMACY STOCKS
  getMedicines: async () => {
    try {
      const [medsRes, stocksRes] = await Promise.allSettled([
        api.get('/admin/medicines/'),
        api.get('/pharmacist/stock/')
      ]);

      const rawMeds = medsRes.status === 'fulfilled' && Array.isArray(medsRes.value?.data)
        ? medsRes.value.data
        : (medsRes.value?.data?.results || []);

      const rawStocks = stocksRes.status === 'fulfilled' && Array.isArray(stocksRes.value?.data)
        ? stocksRes.value.data
        : (stocksRes.value?.data?.results || []);

      return rawMeds.map((m) => {
        const stockRow = rawStocks.find(
          (s) => s.Medicine === m.MedicineId || s.Medicine?.MedicineId === m.MedicineId || s.MedicineId === m.MedicineId
        );
        return normalizeMedicine(m, stockRow);
      });
    } catch (err) {
      handleApiError(err);
      return [];
    }
  },

  createMedicine: async (medData) => {
    const cost = parseFloat(medData.CostValue || medData.costValue || 10);
    const mrp = parseFloat(medData.MRP || medData.mrp || 15);
    const payload = {
      MedicineName: (medData.MedicineName || medData.name || '').trim(),
      Manufacturer: medData.Manufacturer || medData.manufacturer || 'CarePoint Pharma',
      GenericName: medData.GenericName || medData.genericName || medData.MedicineName || '',
      Category: medData.Category || medData.category || 'General',
      CostValue: cost,
      MRP: mrp,
      isActive: medData.isActive !== false
    };

    try {
      const res = await api.post('/admin/medicines/', payload);
      const createdMed = res.data;

      // Automatically register initial stock row in MySQL
      let stockRow = null;
      try {
        const stockRes = await api.post('/pharmacist/stock/', {
          Medicine: createdMed.MedicineId,
          QuantityOnHand: Number(medData.quantity || 50),
          UnitPrice: cost,
          SellingPrice: mrp,
          ReorderLevel: Number(medData.reorderLevel || 10)
        });
        stockRow = stockRes.data;
      } catch {
        // Stock created or can be added later
      }

      return normalizeMedicine(createdMed, stockRow);
    } catch (err) {
      handleApiError(err);
    }
  },

  updateMedicine: async (medId, medData) => {
    const cost = parseFloat(medData.CostValue !== undefined ? medData.CostValue : (medData.costValue || 10));
    const mrp = parseFloat(medData.MRP !== undefined ? medData.MRP : (medData.mrp || 15));
    const payload = {
      MedicineName: (medData.MedicineName || medData.name || '').trim(),
      Manufacturer: medData.Manufacturer || medData.manufacturer || 'CarePoint Pharma',
      GenericName: medData.GenericName || medData.genericName || medData.MedicineName || '',
      Category: medData.Category || medData.category || 'General',
      CostValue: cost,
      MRP: mrp,
      isActive: medData.isActive !== false
    };

    try {
      const res = await api.put(`/admin/medicines/${medId}/`, payload);
      const updatedMed = res.data;

      // Also update matching stock price/quantity in MySQL if available
      try {
        const stocksRes = await api.get('/pharmacist/stock/');
        const stocks = Array.isArray(stocksRes.data) ? stocksRes.data : (stocksRes.data?.results || []);
        const stockRow = stocks.find(s => s.Medicine === medId || s.Medicine?.MedicineId === medId);
        if (stockRow) {
          const patchData = { UnitPrice: cost, SellingPrice: mrp };
          if (medData.quantity !== undefined) {
            patchData.QuantityOnHand = Number(medData.quantity);
          }
          await api.patch(`/pharmacist/stock/${stockRow.StockId}/`, patchData);
        }
      } catch {}

      return normalizeMedicine(updatedMed);
    } catch (err) {
      handleApiError(err);
    }
  },

  deleteMedicine: async (medId) => {
    try {
      await api.delete(`/admin/medicines/${medId}/`);
      return true;
    } catch (err) {
      handleApiError(err);
    }
  },

  activateMedicine: async (medId) => {
    try {
      const res = await api.post(`/admin/medicines/${medId}/activate/`);
      return normalizeMedicine(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  deactivateMedicine: async (medId) => {
    try {
      const res = await api.post(`/admin/medicines/${medId}/deactivate/`);
      return normalizeMedicine(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  // 9. DOSAGES
  getDosages: async () => {
    try {
      const res = await api.get('/admin/dosages/');
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return rawList.map(normalizeDosage);
    } catch (err) {
      handleApiError(err);
      return [];
    }
  },

  createDosage: async (dosageData) => {
    const payload = {
      DosageValue: dosageData.DosageValue || dosageData.dosage || '500mg',
      Instructions: dosageData.Instructions || dosageData.instructions || ''
    };
    try {
      const res = await api.post('/admin/dosages/', payload);
      return normalizeDosage(res.data);
    } catch (err) {
      handleApiError(err);
    }
  },

  deleteDosage: async (dosageId) => {
    try {
      await api.delete(`/admin/dosages/${dosageId}/`);
      return true;
    } catch (err) {
      handleApiError(err);
    }
  },

  // 10. REORDERS (DIRECTLY FROM MYSQL PHARMACY REORDERS)
  getReorderRequests: async () => {
    try {
      const res = await api.get('/pharmacist/reorders/');
      const rawList = Array.isArray(res.data?.results) ? res.data.results : (Array.isArray(res.data) ? res.data : []);
      return rawList.map(r => ({
        id: `PO-${r.ReorderId}`,
        reorderId: r.ReorderId,
        ReorderId: r.ReorderId,
        medicineId: r.Medicine,
        medicineName: r.MedicineName || 'Medicine',
        currentStock: Number(r.CurrentStock || 0),
        reorderLevel: Number(r.ReorderLevel || 10),
        requestedQty: Number(r.RequestedQuantity || 50),
        estimatedCost: Number(r.EstimatedCost || 0),
        supplier: r.SupplierName || 'Wholesale Supplier',
        status: r.Status || 'Pending Admin Approval',
        adminNote: r.AdminNote || '',
        reviewedBy: r.ReviewedBy || '',
        orderDate: r.CreatedAt ? r.CreatedAt.split('T')[0] : new Date().toISOString().split('T')[0]
      }));
    } catch {
      return [];
    }
  },

  approveReorderRequest: async (orderId, adminNote = '') => {
    try {
      const cleanId = String(orderId).replace(/\D/g, '');
      const res = await api.post(`/pharmacist/reorders/${cleanId}/approve_permission/`, {
        AdminNote: adminNote || 'Admin confirmed reorder permission.'
      });
      return res.data;
    } catch (err) {
      handleApiError(err);
    }
  },

  rejectReorderRequest: async (orderId, adminNote = '') => {
    try {
      const cleanId = String(orderId).replace(/\D/g, '');
      const res = await api.post(`/pharmacist/reorders/${cleanId}/reject_permission/`, {
        AdminNote: adminNote || 'Admin rejected reorder request.'
      });
      return res.data;
    } catch (err) {
      handleApiError(err);
    }
  },

  // Notification endpoints for Admin
  getNotifications: async (role = 'Admin') => {
    try {
      const res = await api.get('/pharmacist/notifications/', { params: { role } });
      return res.data; // { unread_count: number, results: [...] }
    } catch {
      return { unread_count: 0, results: [] };
    }
  },

  markNotificationRead: async (notifId) => {
    try {
      const res = await api.post(`/pharmacist/notifications/${notifId}/mark_read/`);
      return res.data;
    } catch {
      return false;
    }
  },

  markAllNotificationsRead: async (role = 'Admin') => {
    try {
      const res = await api.post('/pharmacist/notifications/mark_all_read/', { role }, { params: { role } });
      return res.data;
    } catch {
      return false;
    }
  },

  // 11. APPOINTMENTS & PATIENTS MONITORING
  getAppointments: async (params = {}) => {
    try {
      const res = await api.get('/admin/appointments/', { params });
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return rawList.map(normalizeAppointment);
    } catch (err) {
      handleApiError(err);
      return [];
    }
  },

  getPatients: async (params = {}) => {
    try {
      const res = await api.get('/admin/patients/', { params });
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return rawList.map(normalizePatient);
    } catch (err) {
      handleApiError(err);
      return [];
    }
  },

  // 12. AUDIT LOGS
  getAuditLogs: async (params = {}) => {
    try {
      const res = await api.get('/admin/audit-logs/', { params });
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return rawList.map(normalizeAuditLog);
    } catch (err) {
      handleApiError(err);
      return [];
    }
  },

  // Compatibility helper
  getLocalData: () => ({ medicines: [], users: [], departments: [] })
};

export default adminService;
