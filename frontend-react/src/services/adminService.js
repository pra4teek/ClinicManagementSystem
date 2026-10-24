import api from './api.js';

export const ADMIN_STORAGE_KEY = 'carepointClinicAdminDataV2';
export const CMS_MEDICINES_KEY = 'cms_medicines';
export const CMS_REORDERS_KEY = 'cms_reorder_requests';

function handleApiError(err) {
  // Only re-throw if it is a 400 validation error; 401/403/offline should fall back to localStorage
  if (err.response && err.response.status === 400) {
    throw new Error(JSON.stringify(err.response.data));
  }
}

// Initial Seed Data matching Django models and legacy admin.js
const INITIAL_ADMIN_DATA = {
  users: [
    { UserId: 1, Name: 'Bala Weslin', Username: 'admin', Password: '123', DOB: '1990-01-01', Address: 'CarePoint Clinic Plaza', PhoneNumber: '9999999999', EmailId: 'bala@carepointclinic.com', DepartmentId: 1, RoleId: 1, isActive: true },
    { UserId: 2, Name: 'Dr. Prateek Pradeep', Username: 'prateek', Password: 'prateek123', DOB: '1988-05-10', Address: 'Thiruvananthapuram, Kerala', PhoneNumber: '9876543210', EmailId: 'prateek@carepointclinic.com', DepartmentId: 1, RoleId: 2, isActive: true },
    { UserId: 3, Name: 'Joel Jain', Username: 'reception', Password: '123', DOB: '1995-05-10', Address: 'Kochi, Kerala', PhoneNumber: '9876500000', EmailId: 'joel@carepointclinic.com', DepartmentId: 1, RoleId: 3, isActive: true },
    { UserId: 4, Name: 'Malathi Sreekumar', Username: 'labtech', Password: '123', DOB: '1993-03-12', Address: 'Ernakulam, Kerala', PhoneNumber: '9876511111', EmailId: 'malathi@carepointclinic.com', DepartmentId: 1, RoleId: 4, isActive: true },
    { UserId: 5, Name: 'Adarsh Chandran', Username: 'pharma', Password: '123', DOB: '1992-07-20', Address: 'Palarivattom, Kochi', PhoneNumber: '9876522222', EmailId: 'adarsh@carepointclinic.com', DepartmentId: 1, RoleId: 5, isActive: true },
  ],
  roles: [
    { RoleId: 1, RoleName: 'Admin' },
    { RoleId: 2, RoleName: 'Doctor' },
    { RoleId: 3, RoleName: 'Receptionist' },
    { RoleId: 4, RoleName: 'Lab Technician' },
    { RoleId: 5, RoleName: 'Pharmacist' },
  ],
  departments: [
    { DepartmentId: 1, DepartmentName: 'General Medicine', isActive: true },
    { DepartmentId: 2, DepartmentName: 'Cardiology', isActive: true },
    { DepartmentId: 3, DepartmentName: 'Pediatrics', isActive: true },
    { DepartmentId: 4, DepartmentName: 'Orthopedics', isActive: true },
    { DepartmentId: 5, DepartmentName: 'Dermatology', isActive: true },
  ],
  staff: [
    { StaffId: 1, Name: 'Joel Jain', UserId: 3, RoleId: 3, DateofBirth: '1995-05-10', DateOfJoining: '2022-01-15', Address: 'MG Road, Kochi', phoneNumber: '9876500000' },
    { StaffId: 2, Name: 'Malathi Sreekumar', UserId: 4, RoleId: 4, DateofBirth: '1993-03-12', DateOfJoining: '2023-04-01', Address: 'Civil Station, Ernakulam', phoneNumber: '9876511111' },
    { StaffId: 3, Name: 'Adarsh Chandran', UserId: 5, RoleId: 5, DateofBirth: '1992-07-20', DateOfJoining: '2023-06-10', Address: 'Palarivattom, Kochi', phoneNumber: '9876522222' },
  ],
  doctors: [
    { DoctorId: 1, Name: 'Dr. Prateek Pradeep', Qualification: 'MBBS, MD (General Medicine)', Specialization: 'Internal Medicine', UserId: 2, DepartmentId: 1, isActive: true },
    { DoctorId: 2, Name: 'Dr. Arun', Qualification: 'MBBS, DNB', Specialization: 'Cardiology & Diabetes', UserId: null, DepartmentId: 2, isActive: true },
  ],
  labTests: [
    { LabtestId: 101, TestName: 'Complete Blood Count (CBC)', DepartmentId: 1, NormalName: '4.5-5.5 million/µL', TestCost: 300, isActive: true },
    { LabtestId: 102, TestName: 'Fasting Blood Glucose', DepartmentId: 1, NormalName: '70-100 mg/dL', TestCost: 150, isActive: true },
    { LabtestId: 103, TestName: 'Urine Routine & Microscopic', DepartmentId: 1, NormalName: 'Normal / Nil', TestCost: 200, isActive: true },
    { LabtestId: 104, TestName: 'Lipid Profile Screen', DepartmentId: 2, NormalName: 'Below 200 mg/dL', TestCost: 550, isActive: true },
    { LabtestId: 105, TestName: 'Thyroid Stimulating Hormone (TSH)', DepartmentId: 1, NormalName: '0.4-4.0 mIU/L', TestCost: 400, isActive: true },
    { LabtestId: 106, TestName: 'HbA1c Glycated Hemoglobin', DepartmentId: 1, NormalName: 'Below 5.7%', TestCost: 450, isActive: true },
  ],
  medicines: [
    { MedicineId: 1, MedicineName: 'Paracetamol', GenericName: 'Acetaminophen', Manufacturer: 'Cipla India', Category: 'Analgesic', CostValue: 3.5, MRP: 5.0, isActive: true },
    { MedicineId: 2, MedicineName: 'Amoxicillin', GenericName: 'Amoxicillin Trihydrate', Manufacturer: 'Sun Health Corp', Category: 'Antibiotic', CostValue: 12.0, MRP: 18.0, isActive: true },
    { MedicineId: 3, MedicineName: 'Cetirizine', GenericName: 'Cetirizine Hydrochloride', Manufacturer: 'Dr. Reddy Laboratories', Category: 'Antihistamine', CostValue: 4.0, MRP: 7.5, isActive: true },
    { MedicineId: 4, MedicineName: 'Metformin', GenericName: 'Metformin Hydrochloride', Manufacturer: 'USV Limited', Category: 'Antidiabetic', CostValue: 6.0, MRP: 10.0, isActive: true },
    { MedicineId: 5, MedicineName: 'Omeprazole', GenericName: 'Omeprazole', Manufacturer: 'Torrent Pharma', Category: 'Antacid', CostValue: 7.5, MRP: 12.0, isActive: true },
    { MedicineId: 6, MedicineName: 'Azithromycin', GenericName: 'Azithromycin Dihydrate', Manufacturer: 'Sun Health Corp', Category: 'Antibiotic', CostValue: 22.0, MRP: 35.0, isActive: true },
    { MedicineId: 7, MedicineName: 'Atorvastatin', GenericName: 'Atorvastatin Calcium', Manufacturer: 'Zydus Cadila', Category: 'Cardiovascular', CostValue: 11.0, MRP: 18.0, isActive: true },
    { MedicineId: 8, MedicineName: 'Ibuprofen', GenericName: 'Ibuprofen', Manufacturer: 'Abbott Healthcare', Category: 'NSAID', CostValue: 5.0, MRP: 8.0, isActive: true },
  ],
  dosages: [
    { DosageId: 1, DosageValue: '250mg', Instructions: 'Twice daily after food' },
    { DosageId: 2, DosageValue: '500mg', Instructions: 'Once daily in the morning' },
    { DosageId: 3, DosageValue: '650mg', Instructions: 'SOS for fever or acute body ache' },
    { DosageId: 4, DosageValue: '1000mg', Instructions: 'Single daily dose' },
    { DosageId: 5, DosageValue: '5ml', Instructions: 'Thrice daily with warm water' },
    { DosageId: 6, DosageValue: '10ml', Instructions: 'At bedtime after food' },
    { DosageId: 7, DosageValue: '1 tablet', Instructions: 'Early morning empty stomach' },
  ],
  auditLogs: [
    { AuditId: 101, UserId: 1, ActionType: 'LOGIN', TableAffected: 'User', RecordId: 1, Details: 'Administrator logged in successfully.', action_time: new Date(Date.now() - 3600000).toISOString() },
    { AuditId: 102, UserId: 1, ActionType: 'CREATE', TableAffected: 'MasterMedicine', RecordId: 7, Details: 'Master medicine Atorvastatin registered.', action_time: new Date(Date.now() - 7200000).toISOString() },
    { AuditId: 103, UserId: 1, ActionType: 'ACTIVATE', TableAffected: 'Department', RecordId: 2, Details: 'Cardiology department marked active.', action_time: new Date(Date.now() - 14400000).toISOString() },
  ]
};

export const adminService = {
  // Initialize storage
  initStorage: () => {
    if (!localStorage.getItem(ADMIN_STORAGE_KEY)) {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(INITIAL_ADMIN_DATA));
    }
    // Also sync admin medicines into cms_medicines if empty
    adminService.syncMedicinesToPharmacy();
  },

  getLocalData: () => {
    adminService.initStorage();
    try {
      const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_ADMIN_DATA;
    } catch {
      return INITIAL_ADMIN_DATA;
    }
  },

  saveLocalData: (data) => {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to save to localStorage:', err);
    }
  },

  logLocalAudit: (actionType, tableAffected, recordId, details) => {
    const data = adminService.getLocalData();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const newLog = {
      AuditId: (data.auditLogs?.length || 0) + 101,
      UserId: currentUser.UserId || 1,
      ActionType: actionType,
      TableAffected: tableAffected,
      RecordId: recordId,
      Details: details || `${tableAffected} ${actionType.toLowerCase()} by administrator.`,
      action_time: new Date().toISOString()
    };
    data.auditLogs = [newLog, ...(data.auditLogs || []).slice(0, 99)];
    adminService.saveLocalData(data);
  },

  // 1. DASHBOARD OVERVIEW
  getDashboardMetrics: async () => {
    adminService.initStorage();
    try {
      const res = await api.get('/admin/dashboard/');
      if (res.data) {
        return res.data;
      }
    } catch {
      // Fallback calculation from local state
    }

    const data = adminService.getLocalData();
    const totalUsers = data.users?.length || 0;
    const activeUsers = data.users?.filter(u => u.isActive)?.length || 0;
    const inactiveUsers = totalUsers - activeUsers;

    // Cross-module appointments
    let appointmentsToday = 0;
    let waitingAppointments = 0;
    let completedAppointments = 0;
    try {
      const apts = JSON.parse(localStorage.getItem('cms_appointments') || '[]');
      appointmentsToday = apts.length;
      waitingAppointments = apts.filter(a => (a.status || a.AppointmentStatus) === 'Waiting' || (a.status || a.AppointmentStatus) === 'Scheduled').length;
      completedAppointments = apts.filter(a => (a.status || a.AppointmentStatus) === 'Completed').length;
    } catch {
      // ignore
    }

    let patientsRegistered = 0;
    try {
      const pts = JSON.parse(localStorage.getItem('cms_patients') || '[]');
      patientsRegistered = pts.length || 18;
    } catch {
      patientsRegistered = 18;
    }

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers
      },
      appointments: {
        today: appointmentsToday,
        waiting: waitingAppointments,
        completed: completedAppointments
      },
      patients_registered: patientsRegistered,
      recent_audit_activity: (data.auditLogs || []).slice(0, 6)
    };
  },

  // 2. USERS MANAGEMENT
  getUsers: async () => {
    adminService.initStorage();
    try {
      const res = await api.get('/admin/users/');
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // fallback
    }
    return adminService.getLocalData().users || [];
  },

  createUser: async (userData) => {
    adminService.initStorage();
    const payload = {
      Username: (userData.Username || '').trim(),
      Password: userData.Password && userData.Password.trim().length >= 4 ? userData.Password.trim() : 'password123',
      RoleId: Number(userData.RoleId || 1),
      isActive: userData.isActive !== false
    };

    try {
      const res = await api.post('/admin/users/', payload);
      if (res.data) return res.data;
    } catch (err) {
      handleApiError(err);
    }

    const data = adminService.getLocalData();
    const newId = (data.users?.reduce((max, u) => Math.max(max, u.UserId || 0), 0) || 0) + 1;
    const newUser = {
      UserId: newId,
      Name: userData.Name || payload.Username,
      ...payload,
      DOB: userData.DOB || '',
      Address: userData.Address || '',
      PhoneNumber: userData.PhoneNumber || '',
      EmailId: userData.EmailId || ''
    };
    data.users = [...(data.users || []), newUser];
    adminService.saveLocalData(data);
    adminService.logLocalAudit('CREATE', 'User', newId, `User account ${newUser.Username} created.`);
    return newUser;
  },

  updateUser: async (userId, userData) => {
    const payload = {
      Username: (userData.Username || '').trim(),
      RoleId: Number(userData.RoleId || 1),
      isActive: userData.isActive !== false
    };
    if (userData.Password && userData.Password.trim().length >= 4) {
      payload.Password = userData.Password.trim();
    }

    try {
      const res = payload.Password ? await api.put(`/admin/users/${userId}/`, payload) : await api.patch(`/admin/users/${userId}/`, payload);
      if (res.data) return res.data;
    } catch (err) {
      handleApiError(err);
    }

    const data = adminService.getLocalData();
    data.users = (data.users || []).map(u => (u.UserId === userId ? { ...u, ...userData } : u));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('UPDATE', 'User', userId, `User account ${userId} updated.`);
    return data.users.find(u => u.UserId === userId);
  },

  deleteUser: async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}/`);
      return true;
    } catch {
      // fallback
    }

    const data = adminService.getLocalData();
    data.users = (data.users || []).filter(u => u.UserId !== userId);
    adminService.saveLocalData(data);
    adminService.logLocalAudit('DELETE', 'User', userId, `User account ${userId} deleted.`);
    return true;
  },

  activateUser: async (userId) => {
    try {
      const res = await api.post(`/admin/users/${userId}/activate/`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.users = (data.users || []).map(u => (u.UserId === userId ? { ...u, isActive: true } : u));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('ACTIVATE', 'User', userId, `User account ${userId} activated.`);
    return true;
  },

  deactivateUser: async (userId) => {
    try {
      const res = await api.post(`/admin/users/${userId}/deactivate/`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.users = (data.users || []).map(u => (u.UserId === userId ? { ...u, isActive: false } : u));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('DEACTIVATE', 'User', userId, `User account ${userId} deactivated.`);
    return true;
  },

  // 3. ROLES MANAGEMENT
  getRoles: async () => {
    adminService.initStorage();
    try {
      const res = await api.get('/admin/roles/');
      if (res.data && Array.isArray(res.data)) return res.data;
    } catch {
      // fallback
    }
    return adminService.getLocalData().roles || [];
  },

  createRole: async (roleData) => {
    try {
      const res = await api.post('/admin/roles/', roleData);
      if (res.data) return res.data;
    } catch (err) {
      handleApiError(err);
    }
    const data = adminService.getLocalData();
    const newId = (data.roles?.reduce((max, r) => Math.max(max, r.RoleId || 0), 0) || 0) + 1;
    const newRole = { RoleId: newId, RoleName: roleData.RoleName };
    data.roles = [...(data.roles || []), newRole];
    adminService.saveLocalData(data);
    adminService.logLocalAudit('CREATE', 'Role', newId, `Role ${newRole.RoleName} created.`);
    return newRole;
  },

  updateRole: async (roleId, roleData) => {
    try {
      const res = await api.put(`/admin/roles/${roleId}/`, roleData);
      if (res.data) return res.data;
    } catch (err) {
      handleApiError(err);
    }
    const data = adminService.getLocalData();
    data.roles = (data.roles || []).map(r => (r.RoleId === roleId ? { ...r, ...roleData } : r));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('UPDATE', 'Role', roleId, `Role ${roleId} updated.`);
    return data.roles.find(r => r.RoleId === roleId);
  },

  deleteRole: async (roleId) => {
    try {
      await api.delete(`/admin/roles/${roleId}/`);
      return true;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.roles = (data.roles || []).filter(r => r.RoleId !== roleId);
    adminService.saveLocalData(data);
    adminService.logLocalAudit('DELETE', 'Role', roleId, `Role ${roleId} deleted.`);
    return true;
  },

  // 4. DEPARTMENTS MANAGEMENT
  getDepartments: async () => {
    adminService.initStorage();
    try {
      const res = await api.get('/admin/departments/');
      if (res.data && Array.isArray(res.data)) return res.data;
    } catch {
      // fallback
    }
    return adminService.getLocalData().departments || [];
  },

  createDepartment: async (deptData) => {
    try {
      const res = await api.post('/admin/departments/', deptData);
      if (res.data) return res.data;
    } catch (err) {
      handleApiError(err);
    }
    const data = adminService.getLocalData();
    const newId = (data.departments?.reduce((max, d) => Math.max(max, d.DepartmentId || 0), 0) || 0) + 1;
    const newDept = { DepartmentId: newId, DepartmentName: deptData.DepartmentName, isActive: deptData.isActive !== false };
    data.departments = [...(data.departments || []), newDept];
    adminService.saveLocalData(data);
    adminService.logLocalAudit('CREATE', 'Department', newId, `Department ${newDept.DepartmentName} created.`);
    return newDept;
  },

  updateDepartment: async (deptId, deptData) => {
    try {
      const res = await api.put(`/admin/departments/${deptId}/`, deptData);
      if (res.data) return res.data;
    } catch (err) {
      handleApiError(err);
    }
    const data = adminService.getLocalData();
    data.departments = (data.departments || []).map(d => (d.DepartmentId === deptId ? { ...d, ...deptData } : d));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('UPDATE', 'Department', deptId, `Department ${deptId} updated.`);
    return data.departments.find(d => d.DepartmentId === deptId);
  },

  deleteDepartment: async (deptId) => {
    try {
      await api.delete(`/admin/departments/${deptId}/`);
      return true;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.departments = (data.departments || []).filter(d => d.DepartmentId !== deptId);
    adminService.saveLocalData(data);
    adminService.logLocalAudit('DELETE', 'Department', deptId, `Department ${deptId} deleted.`);
    return true;
  },

  activateDepartment: async (deptId) => {
    try {
      const res = await api.post(`/admin/departments/${deptId}/activate/`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.departments = (data.departments || []).map(d => (d.DepartmentId === deptId ? { ...d, isActive: true } : d));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('ACTIVATE', 'Department', deptId, `Department ${deptId} activated.`);
    return true;
  },

  deactivateDepartment: async (deptId) => {
    try {
      const res = await api.post(`/admin/departments/${deptId}/deactivate/`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.departments = (data.departments || []).map(d => (d.DepartmentId === deptId ? { ...d, isActive: false } : d));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('DEACTIVATE', 'Department', deptId, `Department ${deptId} deactivated.`);
    return true;
  },

  // 5. DOCTORS MANAGEMENT
  getDoctors: async () => {
    adminService.initStorage();
    try {
      const res = await api.get('/admin/doctors/');
      if (res.data && Array.isArray(res.data)) return res.data;
    } catch {
      // fallback
    }
    return adminService.getLocalData().doctors || [];
  },

  createDoctor: async (docData) => {
    let userId = docData.UserId ? Number(docData.UserId) : null;

    // Doctor.UserId is a required OneToOneField to User.
    // If no existing user selected, first create User account via POST /admin/users/
    if (!userId) {
      try {
        const cleanName = (docData.Name || 'doctor').toLowerCase().replace(/[^a-z0-9]/g, '');
        const autoUsername = `dr.${cleanName || 'doc'}_${Date.now().toString().slice(-4)}`;
        const userRes = await api.post('/admin/users/', {
          Username: autoUsername,
          Password: 'password123',
          RoleId: 2, // Doctor
          isActive: true
        });
        if (userRes.data?.UserId) {
          userId = userRes.data.UserId;
        }
      } catch {
        const data = adminService.getLocalData();
        userId = (data.users?.reduce((max, u) => Math.max(max, u.UserId || 0), 0) || 0) + 1;
      }
    }

    const payload = {
      Name: docData.Name,
      UserId: Number(userId),
      DepartmentId: Number(docData.DepartmentId || 1),
      Qualification: docData.Qualification || 'MBBS',
      Specialization: docData.Specialization || 'General',
      isActive: docData.isActive !== false
    };

    try {
      const res = await api.post('/admin/doctors/', payload);
      if (res.data) return res.data;
    } catch (err) {
      handleApiError(err);
    }

    const data = adminService.getLocalData();
    const newId = (data.doctors?.reduce((max, d) => Math.max(max, d.DoctorId || 0), 0) || 0) + 1;
    const newDoctor = {
      DoctorId: newId,
      ...payload
    };
    data.doctors = [...(data.doctors || []), newDoctor];
    adminService.saveLocalData(data);
    adminService.logLocalAudit('CREATE', 'Doctor', newId, `Doctor ${newDoctor.Name} registered.`);
    return newDoctor;
  },

  updateDoctor: async (docId, docData) => {
    const payload = {
      Name: docData.Name,
      UserId: Number(docData.UserId || 1),
      DepartmentId: Number(docData.DepartmentId || 1),
      Qualification: docData.Qualification || 'MBBS',
      Specialization: docData.Specialization || 'General',
      isActive: docData.isActive !== false
    };

    try {
      const res = await api.put(`/admin/doctors/${docId}/`, payload);
      if (res.data) return res.data;
    } catch (err) {
      handleApiError(err);
    }
    const data = adminService.getLocalData();
    data.doctors = (data.doctors || []).map(d => (d.DoctorId === docId ? { ...d, ...payload } : d));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('UPDATE', 'Doctor', docId, `Doctor ${docId} updated.`);
    return data.doctors.find(d => d.DoctorId === docId);
  },

  deleteDoctor: async (docId) => {
    try {
      await api.delete(`/admin/doctors/${docId}/`);
      return true;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.doctors = (data.doctors || []).filter(d => d.DoctorId !== docId);
    adminService.saveLocalData(data);
    adminService.logLocalAudit('DELETE', 'Doctor', docId, `Doctor ${docId} deleted.`);
    return true;
  },

  activateDoctor: async (docId) => {
    try {
      const res = await api.post(`/admin/doctors/${docId}/activate/`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.doctors = (data.doctors || []).map(d => (d.DoctorId === docId ? { ...d, isActive: true } : d));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('ACTIVATE', 'Doctor', docId, `Doctor ${docId} activated.`);
    return true;
  },

  deactivateDoctor: async (docId) => {
    try {
      const res = await api.post(`/admin/doctors/${docId}/deactivate/`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.doctors = (data.doctors || []).map(d => (d.DoctorId === docId ? { ...d, isActive: false } : d));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('DEACTIVATE', 'Doctor', docId, `Doctor ${docId} deactivated.`);
    return true;
  },

  // 6. STAFF DIRECTORY (Receptionists, Lab Techs, Pharmacists)
  getStaff: async () => {
    adminService.initStorage();
    try {
      const res = await api.get('/admin/staff/');
      if (res.data && Array.isArray(res.data)) return res.data;
    } catch {
      // fallback
    }
    return adminService.getLocalData().staff || [];
  },

  createStaff: async (staffData) => {
    let userId = staffData.UserId ? Number(staffData.UserId) : null;
    const roleId = Number(staffData.RoleId || 3);

    // Staff.UserId is a required OneToOneField to User.
    // If no existing user selected, first create User account via POST /admin/users/
    if (!userId) {
      try {
        const cleanName = (staffData.Name || 'staff').toLowerCase().replace(/[^a-z0-9]/g, '');
        const autoUsername = `staff.${cleanName || 'member'}_${Date.now().toString().slice(-4)}`;
        const userRes = await api.post('/admin/users/', {
          Username: autoUsername,
          Password: 'password123',
          RoleId: roleId,
          isActive: true
        });
        if (userRes.data?.UserId) {
          userId = userRes.data.UserId;
        }
      } catch {
        const data = adminService.getLocalData();
        userId = (data.users?.reduce((max, u) => Math.max(max, u.UserId || 0), 0) || 0) + 1;
      }
    }

    // Ensure phone number is strictly 10 digits for StaffSerializer
    let phone = (staffData.phoneNumber || '9876543210').replace(/\D/g, '');
    if (phone.length !== 10) {
      phone = phone.padEnd(10, '0').slice(0, 10);
    }

    const payload = {
      Name: staffData.Name,
      UserId: Number(userId),
      RoleId: roleId,
      DateofBirth: staffData.DateofBirth || '1995-01-01',
      DateOfJoining: staffData.DateOfJoining || new Date().toISOString().split('T')[0],
      Address: staffData.Address || 'Bangalore, India',
      phoneNumber: phone
    };

    try {
      const res = await api.post('/admin/staff/', payload);
      if (res.data) return res.data;
    } catch (err) {
      handleApiError(err);
    }

    const data = adminService.getLocalData();
    const newId = (data.staff?.reduce((max, s) => Math.max(max, s.StaffId || 0), 0) || 0) + 1;
    const newMember = {
      StaffId: newId,
      ...payload
    };
    data.staff = [...(data.staff || []), newMember];
    adminService.saveLocalData(data);
    adminService.logLocalAudit('CREATE', 'Staff', newId, `Staff member ${newMember.Name} registered.`);
    return newMember;
  },

  updateStaff: async (staffId, staffData) => {
    let phone = (staffData.phoneNumber || '9876543210').replace(/\D/g, '');
    if (phone.length !== 10) {
      phone = phone.padEnd(10, '0').slice(0, 10);
    }

    const payload = {
      Name: staffData.Name,
      UserId: Number(staffData.UserId || 1),
      RoleId: Number(staffData.RoleId || 3),
      DateofBirth: staffData.DateofBirth || '1995-01-01',
      DateOfJoining: staffData.DateOfJoining || new Date().toISOString().split('T')[0],
      Address: staffData.Address || 'Bangalore, India',
      phoneNumber: phone
    };

    try {
      const res = await api.put(`/admin/staff/${staffId}/`, payload);
      if (res.data) return res.data;
    } catch (err) {
      handleApiError(err);
    }
    const data = adminService.getLocalData();
    data.staff = (data.staff || []).map(s => (s.StaffId === staffId ? { ...s, ...payload } : s));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('UPDATE', 'Staff', staffId, `Staff member ${staffId} updated.`);
    return data.staff.find(s => s.StaffId === staffId);
  },

  deleteStaff: async (staffId) => {
    try {
      await api.delete(`/admin/staff/${staffId}/`);
      return true;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.staff = (data.staff || []).filter(s => s.StaffId !== staffId);
    adminService.saveLocalData(data);
    adminService.logLocalAudit('DELETE', 'Staff', staffId, `Staff member ${staffId} deleted.`);
    return true;
  },

  // 7. LAB TESTS CATALOG
  getLabTests: async () => {
    adminService.initStorage();
    try {
      const res = await api.get('/admin/lab-tests/');
      if (res.data && Array.isArray(res.data)) return res.data;
    } catch {
      // fallback
    }
    return adminService.getLocalData().labTests || [];
  },

  createLabTest: async (testData) => {
    const payload = {
      TestName: testData.TestName,
      DepartmentId: Number(testData.DepartmentId || 1),
      NormalName: testData.NormalName || 'Normal',
      TestCost: parseFloat(testData.TestCost || 0),
      isActive: testData.isActive !== false
    };

    try {
      const res = await api.post('/admin/lab-tests/', payload);
      if (res.data) return res.data;
    } catch (err) {
      handleApiError(err);
    }

    const data = adminService.getLocalData();
    const newId = (data.labTests?.reduce((max, t) => Math.max(max, t.LabtestId || 0), 0) || 100) + 1;
    const newTest = {
      LabtestId: newId,
      ...payload
    };
    data.labTests = [...(data.labTests || []), newTest];
    adminService.saveLocalData(data);
    adminService.logLocalAudit('CREATE', 'LabTest', newId, `Lab test ${newTest.TestName} created.`);
    return newTest;
  },

  updateLabTest: async (testId, testData) => {
    const payload = {
      TestName: testData.TestName,
      DepartmentId: Number(testData.DepartmentId || 1),
      NormalName: testData.NormalName || 'Normal',
      TestCost: parseFloat(testData.TestCost || 0),
      isActive: testData.isActive !== false
    };

    try {
      const res = await api.put(`/admin/lab-tests/${testId}/`, payload);
      if (res.data) return res.data;
    } catch (err) {
      handleApiError(err);
    }
    const data = adminService.getLocalData();
    data.labTests = (data.labTests || []).map(t => (t.LabtestId === testId ? { ...t, ...payload } : t));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('UPDATE', 'LabTest', testId, `Lab test ${testId} updated.`);
    return data.labTests.find(t => t.LabtestId === testId);
  },

  deleteLabTest: async (testId) => {
    try {
      await api.delete(`/admin/lab-tests/${testId}/`);
      return true;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.labTests = (data.labTests || []).filter(t => t.LabtestId !== testId);
    adminService.saveLocalData(data);
    adminService.logLocalAudit('DELETE', 'LabTest', testId, `Lab test ${testId} deleted.`);
    return true;
  },

  activateLabTest: async (testId) => {
    try {
      const res = await api.post(`/admin/lab-tests/${testId}/activate/`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.labTests = (data.labTests || []).map(t => (t.LabtestId === testId ? { ...t, isActive: true } : t));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('ACTIVATE', 'LabTest', testId, `Lab test ${testId} activated.`);
    return true;
  },

  deactivateLabTest: async (testId) => {
    try {
      const res = await api.post(`/admin/lab-tests/${testId}/deactivate/`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.labTests = (data.labTests || []).map(t => (t.LabtestId === testId ? { ...t, isActive: false } : t));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('DEACTIVATE', 'LabTest', testId, `Lab test ${testId} deactivated.`);
    return true;
  },

  // 8. MASTER MEDICINES & DOSAGES
  getMedicines: async () => {
    adminService.initStorage();
    try {
      const res = await api.get('/admin/medicines/');
      if (res.data && Array.isArray(res.data)) {
        // Sync to cms_medicines
        adminService.syncMedicinesToPharmacy(res.data);
        return res.data;
      }
    } catch {
      // fallback
    }
    const localMeds = adminService.getLocalData().medicines || [];
    adminService.syncMedicinesToPharmacy(localMeds);
    return localMeds;
  },

  createMedicine: async (medData) => {
    const cost = parseFloat(medData.CostValue || 10);
    const mrp = parseFloat(medData.MRP || 15);
    const payload = {
      MedicineName: medData.MedicineName,
      Manufacturer: medData.Manufacturer || 'CarePoint Pharma',
      GenericName: medData.GenericName || medData.MedicineName,
      Category: medData.Category || 'General',
      CostValue: cost,
      MRP: mrp,
      isActive: medData.isActive !== false
    };

    let createdMed = null;
    try {
      const res = await api.post('/admin/medicines/', payload);
      if (res.data) {
        createdMed = res.data;
        // Also persist initial stock in backend PharmacyStock
        try {
          await api.post('/pharmacist/stock/', {
            Medicine: createdMed.MedicineId,
            QuantityOnHand: 50,
            UnitPrice: cost,
            SellingPrice: mrp,
            ReorderLevel: 10
          });
        } catch {
          // ignore if stock couldn't be saved in backend
        }
      }
    } catch (err) {
      handleApiError(err);
    }

    if (!createdMed) {
      const data = adminService.getLocalData();
      const newId = (data.medicines?.reduce((max, m) => Math.max(max, m.MedicineId || 0), 0) || 0) + 1;
      createdMed = {
        MedicineId: newId,
        ...payload
      };
      data.medicines = [...(data.medicines || []), createdMed];
      adminService.saveLocalData(data);
      adminService.logLocalAudit('CREATE', 'MasterMedicine', newId, `Master medicine ${createdMed.MedicineName} added.`);
    }

    adminService.syncSingleMedToPharmacy(createdMed);
    return createdMed;
  },

  updateMedicine: async (medId, medData) => {
    const cost = parseFloat(medData.CostValue !== undefined ? medData.CostValue : 10);
    const mrp = parseFloat(medData.MRP !== undefined ? medData.MRP : 15);
    const payload = {
      MedicineName: medData.MedicineName,
      Manufacturer: medData.Manufacturer || 'CarePoint Pharma',
      GenericName: medData.GenericName || medData.MedicineName,
      Category: medData.Category || 'General',
      CostValue: cost,
      MRP: mrp,
      isActive: medData.isActive !== false
    };

    let updatedMed = null;
    try {
      const res = await api.put(`/admin/medicines/${medId}/`, payload);
      if (res.data) {
        updatedMed = res.data;
        // Also sync price to backend PharmacyStock if present
        try {
          const stocksRes = await api.get('/pharmacist/stock/');
          if (Array.isArray(stocksRes.data)) {
            const stock = stocksRes.data.find(s => s.Medicine === medId || s.Medicine?.MedicineId === medId);
            if (stock) {
              await api.patch(`/pharmacist/stock/${stock.StockId}/`, {
                UnitPrice: cost,
                SellingPrice: mrp
              });
            }
          }
        } catch {}
      }
    } catch (err) {
      handleApiError(err);
    }

    if (!updatedMed) {
      const data = adminService.getLocalData();
      data.medicines = (data.medicines || []).map(m => (m.MedicineId === medId ? { ...m, ...payload } : m));
      adminService.saveLocalData(data);
      adminService.logLocalAudit('UPDATE', 'MasterMedicine', medId, `Master medicine ${medId} updated.`);
      updatedMed = data.medicines.find(m => m.MedicineId === medId);
    }

    if (updatedMed) adminService.syncSingleMedToPharmacy(updatedMed);
    return updatedMed;
  },

  deleteMedicine: async (medId) => {
    try {
      await api.delete(`/admin/medicines/${medId}/`);
      return true;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.medicines = (data.medicines || []).filter(m => m.MedicineId !== medId);
    adminService.saveLocalData(data);
    adminService.logLocalAudit('DELETE', 'MasterMedicine', medId, `Master medicine ${medId} deleted.`);
    return true;
  },

  activateMedicine: async (medId) => {
    try {
      const res = await api.post(`/admin/medicines/${medId}/activate/`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.medicines = (data.medicines || []).map(m => (m.MedicineId === medId ? { ...m, isActive: true } : m));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('ACTIVATE', 'MasterMedicine', medId, `Master medicine ${medId} activated.`);
    return true;
  },

  deactivateMedicine: async (medId) => {
    try {
      const res = await api.post(`/admin/medicines/${medId}/deactivate/`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.medicines = (data.medicines || []).map(m => (m.MedicineId === medId ? { ...m, isActive: false } : m));
    adminService.saveLocalData(data);
    adminService.logLocalAudit('DEACTIVATE', 'MasterMedicine', medId, `Master medicine ${medId} deactivated.`);
    return true;
  },

  // Cross-Module Medicine Sync with Pharmacist
  syncMedicinesToPharmacy: (adminMeds) => {
    try {
      const medsToSync = adminMeds || adminService.getLocalData().medicines || [];
      const currentPharmaMeds = JSON.parse(localStorage.getItem(CMS_MEDICINES_KEY) || '[]');
      
      const merged = medsToSync.map(am => {
        const existing = currentPharmaMeds.find(pm =>
          pm.name?.toLowerCase() === am.MedicineName?.toLowerCase() ||
          pm.id === `MED-${String(am.MedicineId).padStart(3, '0')}`
        );
        return {
          id: existing?.id || `MED-${String(am.MedicineId).padStart(3, '0')}`,
          name: am.MedicineName,
          dosage: existing?.dosage || '500mg',
          type: existing?.type || 'Tablet',
          category: am.Category || 'General',
          quantity: existing?.quantity !== undefined ? existing.quantity : 50,
          minThreshold: existing?.minThreshold || 20,
          unitPrice: parseFloat(am.CostValue || 10),
          sellingPrice: parseFloat(am.MRP || 15),
          batchNo: existing?.batchNo || 'BAT-2025',
          expiryDate: existing?.expiryDate || '2027-12-31',
          supplier: am.Manufacturer || 'CarePoint Medical Supply',
          isActive: am.isActive !== false
        };
      });

      localStorage.setItem(CMS_MEDICINES_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event('cms_stock_updated'));
    } catch {
      // ignore
    }
  },

  syncSingleMedToPharmacy: (med) => {
    try {
      const currentPharmaMeds = JSON.parse(localStorage.getItem(CMS_MEDICINES_KEY) || '[]');
      const targetId = `MED-${String(med.MedicineId).padStart(3, '0')}`;
      const existingIdx = currentPharmaMeds.findIndex(m => m.id === targetId || m.name?.toLowerCase() === med.MedicineName?.toLowerCase());
      
      if (existingIdx >= 0) {
        currentPharmaMeds[existingIdx] = {
          ...currentPharmaMeds[existingIdx],
          name: med.MedicineName,
          category: med.Category || currentPharmaMeds[existingIdx].category,
          unitPrice: parseFloat(med.CostValue || currentPharmaMeds[existingIdx].unitPrice),
          sellingPrice: parseFloat(med.MRP || currentPharmaMeds[existingIdx].sellingPrice),
          isActive: med.isActive !== false
        };
      } else {
        currentPharmaMeds.push({
          id: targetId,
          name: med.MedicineName,
          dosage: '500mg',
          type: 'Tablet',
          category: med.Category || 'General',
          quantity: 50,
          minThreshold: 20,
          unitPrice: parseFloat(med.CostValue || 10),
          sellingPrice: parseFloat(med.MRP || 15),
          batchNo: 'BAT-2025',
          expiryDate: '2027-12-31',
          supplier: med.Manufacturer || 'CarePoint Medical Supply',
          isActive: med.isActive !== false
        });
      }
      localStorage.setItem(CMS_MEDICINES_KEY, JSON.stringify(currentPharmaMeds));
      window.dispatchEvent(new Event('cms_stock_updated'));
    } catch {
      // ignore
    }
  },

  // Standard Dosages
  getDosages: async () => {
    adminService.initStorage();
    try {
      const res = await api.get('/admin/dosages/');
      if (res.data && Array.isArray(res.data)) return res.data;
    } catch {
      // fallback
    }
    return adminService.getLocalData().dosages || [];
  },

  createDosage: async (dosageData) => {
    try {
      const res = await api.post('/admin/dosages/', dosageData);
      if (res.data) return res.data;
    } catch (err) {
      handleApiError(err);
    }
    const data = adminService.getLocalData();
    const newId = (data.dosages?.reduce((max, d) => Math.max(max, d.DosageId || 0), 0) || 0) + 1;
    const newDosage = {
      DosageId: newId,
      DosageValue: dosageData.DosageValue,
      Instructions: dosageData.Instructions || ''
    };
    data.dosages = [...(data.dosages || []), newDosage];
    adminService.saveLocalData(data);
    adminService.logLocalAudit('CREATE', 'Dosage', newId, `Standard dosage ${newDosage.DosageValue} created.`);
    return newDosage;
  },

  deleteDosage: async (dosageId) => {
    try {
      await api.delete(`/admin/dosages/${dosageId}/`);
      return true;
    } catch {
      // fallback
    }
    const data = adminService.getLocalData();
    data.dosages = (data.dosages || []).filter(d => d.DosageId !== dosageId);
    adminService.saveLocalData(data);
    adminService.logLocalAudit('DELETE', 'Dosage', dosageId, `Standard dosage ${dosageId} deleted.`);
    return true;
  },

  // 9. PHARMACY REORDER REQUESTS & APPROVAL WORKFLOW
  getReorderRequests: () => {
    try {
      const stored = localStorage.getItem(CMS_REORDERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  approveReorderRequest: (orderId, adminNote = '') => {
    try {
      const orders = adminService.getReorderRequests();
      let approvedItem = null;
      const updated = orders.map(o => {
        if (o.id === orderId) {
          approvedItem = o;
          return {
            ...o,
            status: 'Received',
            adminStatus: 'Approved by Administrator',
            adminNote: adminNote || 'Approved and stock credited.',
            receivedDate: new Date().toISOString().split('T')[0]
          };
        }
        return o;
      });
      localStorage.setItem(CMS_REORDERS_KEY, JSON.stringify(updated));

      // Auto-increment live medicine inventory in cms_medicines
      if (approvedItem) {
        const meds = JSON.parse(localStorage.getItem(CMS_MEDICINES_KEY) || '[]');
        const updatedMeds = meds.map(m => {
          if (m.id === approvedItem.medicineId || m.name?.toLowerCase() === approvedItem.medicineName?.toLowerCase()) {
            return { ...m, quantity: (m.quantity || 0) + (approvedItem.requestedQty || 50) };
          }
          return m;
        });
        localStorage.setItem(CMS_MEDICINES_KEY, JSON.stringify(updatedMeds));
        window.dispatchEvent(new Event('cms_stock_updated'));
      }

      adminService.logLocalAudit('APPROVE', 'ReorderRequest', orderId, `Purchase order ${orderId} approved and restocked (+${approvedItem?.requestedQty} units).`);
      return updated;
    } catch {
      return [];
    }
  },

  rejectReorderRequest: (orderId, adminNote = '') => {
    try {
      const orders = adminService.getReorderRequests();
      const updated = orders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'Rejected',
            adminStatus: 'Rejected by Administrator',
            adminNote: adminNote || 'Rejected due to budget limits or duplicate request.'
          };
        }
        return o;
      });
      localStorage.setItem(CMS_REORDERS_KEY, JSON.stringify(updated));
      adminService.logLocalAudit('REJECT', 'ReorderRequest', orderId, `Purchase order ${orderId} rejected: ${adminNote}`);
      return updated;
    } catch {
      return [];
    }
  },

  // 10. APPOINTMENTS & PATIENTS MONITORING
  getAppointments: async (params = {}) => {
    try {
      const res = await api.get('/admin/appointments/', { params });
      if (res.data && Array.isArray(res.data)) return res.data;
    } catch {
      // fallback
    }
    const apts = JSON.parse(localStorage.getItem('cms_appointments') || '[]');
    return apts.map((a, i) => ({
      AppointmentId: a.id || a.AppointmentId || i + 1,
      PatientId: a.patientId || 'PT-1001',
      PatientName: a.patientName || a.patient || 'Patient',
      DoctorId: a.doctorId || 1,
      DoctorName: a.doctorName || 'Dr. Prateek Pradeep',
      DepartmentId: a.departmentId || 1,
      DepartmentName: a.departmentName || 'General Medicine',
      AppointmentStatus: a.status || a.AppointmentStatus || 'Scheduled',
      AppointmentDateTime: a.date || a.AppointmentDateTime || new Date().toISOString()
    }));
  },

  getPatients: async (params = {}) => {
    try {
      const res = await api.get('/admin/patients/', { params });
      if (res.data && Array.isArray(res.data)) return res.data;
    } catch {
      // fallback
    }
    const pts = JSON.parse(localStorage.getItem('cms_patients') || '[]');
    if (pts.length > 0) {
      return pts.map((p, i) => ({
        PatientId: p.id || p.PatientId || i + 1,
        Name: p.name || p.Name,
        Gender: p.gender || p.Gender || 'Other',
        DOB: p.dob || p.DOB || '1995-01-01',
        PhoneNumber: p.phone || p.PhoneNumber || '9876543210',
        Address: p.address || p.Address || 'Kerala, India',
        BloodGroup: p.bloodGroup || p.BloodGroup || 'O+',
        Weight: p.weight || p.Weight || 68,
        Height: p.height || p.Height || 172
      }));
    }
    return [
      { PatientId: 'PT-1001', Name: 'Devika Pillai', Gender: 'Female', DOB: '1995-04-12', PhoneNumber: '9745198765', Address: 'MG Road, Kochi', BloodGroup: 'B+', Weight: 58, Height: 162 },
      { PatientId: 'PT-1002', Name: 'Amina Begum', Gender: 'Female', DOB: '1982-08-19', PhoneNumber: '9847123456', Address: 'Palarivattom, Kochi', BloodGroup: 'A+', Weight: 64, Height: 158 },
      { PatientId: 'PT-1003', Name: 'Karthik Subramanian', Gender: 'Male', DOB: '1968-11-22', PhoneNumber: '9446287654', Address: 'Kaloor, Ernakulam', BloodGroup: 'O+', Weight: 76, Height: 174 },
    ];
  },

  // 11. AUDIT LOGS
  getAuditLogs: async (params = {}) => {
    adminService.initStorage();
    try {
      const res = await api.get('/admin/audit-logs/', { params });
      if (res.data && Array.isArray(res.data)) return res.data;
    } catch {
      // fallback
    }
    const logs = adminService.getLocalData().auditLogs || [];
    if (!params.ActionType && !params.UserId) return logs;
    return logs.filter(l => {
      let match = true;
      if (params.ActionType && params.ActionType !== 'All') {
        match = match && l.ActionType === params.ActionType;
      }
      if (params.UserId) {
        match = match && String(l.UserId) === String(params.UserId);
      }
      return match;
    });
  }
};

export default adminService;
