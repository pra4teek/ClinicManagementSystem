import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import adminService, { CMS_MEDICINES_KEY, CMS_REORDERS_KEY } from '../services/adminService';
import '../styles/admin.css';

// SVG Icons matching CarePoint Design System
const ShieldIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const DashboardGridIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const UsersIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const KeyIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="m21 3-9.5 9.5" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
);

const BuildingIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M8 10h.01" />
    <path d="M16 10h.01" />
    <path d="M8 14h.01" />
    <path d="M16 14h.01" />
  </svg>
);

const StethoscopeIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3M9 12.5A4.5 4.5 0 0 0 13.5 17h.5a3 3 0 0 0 3-3v-1.5" />
    <circle cx="17" cy="10.5" r="2.5" />
    <path d="M4.5 3h2m7 0h2" />
  </svg>
);

const BadgeContactIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="M15 8h2" />
    <path d="M15 12h2" />
    <path d="M7 16h10" />
  </svg>
);

const PillIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </svg>
);

const FlaskIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
    <path d="M8.5 2h7" />
    <path d="M7 16h10" />
  </svg>
);

const TruckIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const ActivityMonitorIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <path d="M12 17v4" />
    <path d="M8 21h8" />
    <path d="m7 10 2 2 3-4 2 3 3-1" />
  </svg>
);

const ClipboardListIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </svg>
);

const SignOutIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const SearchIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Tab & UI state
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sub-tabs
  const [medicinesSubTab, setMedicinesSubTab] = useState('catalog'); // 'catalog' | 'dosages'
  const [monitoringSubTab, setMonitoringSubTab] = useState('appointments'); // 'appointments' | 'patients'

  // Current logged in administrator
  const [currentUser] = useState(() => {
    return authService.getCurrentUser() || { name: 'Bala Weslin', role: 'Admin', username: 'admin' };
  });

  // Data state
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [dosages, setDosages] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [reorders, setReorders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toast feedback
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Modals state
  const [modalState, setModalState] = useState({ open: false, type: '', item: null });

  // Filtering states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('All');

  const [deptSearch, setDeptSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorDeptFilter, setDoctorDeptFilter] = useState('All');

  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('All');

  const [medSearch, setMedSearch] = useState('');
  const [medCategoryFilter, setMedCategoryFilter] = useState('All');

  const [labTestSearch, setLabTestSearch] = useState('');
  const [reorderFilter, setReorderFilter] = useState('All');

  const [auditActionFilter, setAuditActionFilter] = useState('All');
  const [auditUserFilter, setAuditUserFilter] = useState('');

  // Load all admin data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [
        metricsData,
        usersData,
        rolesData,
        deptData,
        docsData,
        staffData,
        medsData,
        dosagesData,
        testsData,
        aptsData,
        patientsData,
        auditData
      ] = await Promise.all([
        adminService.getDashboardMetrics(),
        adminService.getUsers(),
        adminService.getRoles(),
        adminService.getDepartments(),
        adminService.getDoctors(),
        adminService.getStaff(),
        adminService.getMedicines(),
        adminService.getDosages(),
        adminService.getLabTests(),
        adminService.getAppointments(),
        adminService.getPatients(),
        adminService.getAuditLogs()
      ]);

      setDashboardMetrics(metricsData);
      setUsers(usersData);
      setRoles(rolesData);
      setDepartments(deptData);
      setDoctors(docsData);
      setStaff(staffData);
      setMedicines(medsData);
      setDosages(dosagesData);
      setLabTests(testsData);
      setReorders(adminService.getReorderRequests());
      setAppointments(aptsData);
      setPatients(patientsData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();

    // Listen for cross-module events from Pharmacist or Receptionist
    const handleStockUpdate = () => {
      setMedicines(adminService.getLocalData().medicines || []);
      setReorders(adminService.getReorderRequests());
    };

    window.addEventListener('cms_stock_updated', handleStockUpdate);
    window.addEventListener('cms_rx_updated', handleStockUpdate);

    return () => {
      window.removeEventListener('cms_stock_updated', handleStockUpdate);
      window.removeEventListener('cms_rx_updated', handleStockUpdate);
    };
  }, []);

  const handleSignOut = () => {
    authService.logout();
    navigate('/login');
  };

  // Pending reorders count
  const pendingReordersCount = useMemo(() => {
    return reorders.filter(r => r.status === 'Ordered' || r.status === 'Pending Approval').length;
  }, [reorders]);

  // Form states for modals
  const [userForm, setUserForm] = useState({ Username: '', Password: '', RoleId: 2, isActive: true });
  const [roleForm, setRoleForm] = useState({ RoleName: '' });
  const [deptForm, setDeptForm] = useState({ DepartmentName: '', isActive: true });
  const [doctorForm, setDoctorForm] = useState({ Name: '', Qualification: 'MBBS', Specialization: 'General Medicine', UserId: '', DepartmentId: 1, isActive: true });
  const [staffForm, setStaffForm] = useState({ Name: '', UserId: '', RoleId: 3, DateofBirth: '1995-01-01', DateOfJoining: '2023-01-01', Address: '', phoneNumber: '' });
  const [medForm, setMedForm] = useState({ MedicineName: '', GenericName: '', Manufacturer: 'CarePoint Pharma', Category: 'Analgesic', CostValue: 5, MRP: 10, isActive: true });
  const [dosageForm, setDosageForm] = useState({ DosageValue: '500mg', Instructions: 'Twice daily after food' });
  const [labTestForm, setLabTestForm] = useState({ TestName: '', DepartmentId: 1, NormalName: 'Normal', TestCost: 200, isActive: true });

  // Open Add/Edit Modal
  const openModal = (type, item = null) => {
    setModalState({ open: true, type, item });
    if (type === 'user') {
      setUserForm(item ? { Username: item.Username, Password: '', RoleId: item.RoleId, isActive: item.isActive } : { Username: '', Password: '', RoleId: roles[0]?.RoleId || 2, isActive: true });
    } else if (type === 'role') {
      setRoleForm(item ? { RoleName: item.RoleName } : { RoleName: '' });
    } else if (type === 'department') {
      setDeptForm(item ? { DepartmentName: item.DepartmentName, isActive: item.isActive } : { DepartmentName: '', isActive: true });
    } else if (type === 'doctor') {
      setDoctorForm(item ? { ...item } : { Name: '', Qualification: 'MBBS, MD', Specialization: 'Internal Medicine', UserId: '', DepartmentId: departments[0]?.DepartmentId || 1, isActive: true });
    } else if (type === 'staff') {
      setStaffForm(item ? { ...item } : { Name: '', UserId: users[0]?.UserId || '', RoleId: 3, DateofBirth: '1995-01-01', DateOfJoining: new Date().toISOString().split('T')[0], Address: '', phoneNumber: '9876543210' });
    } else if (type === 'medicine') {
      setMedForm(item ? { ...item } : { MedicineName: '', GenericName: '', Manufacturer: 'CarePoint Medical', Category: 'Analgesic', CostValue: 8, MRP: 14, isActive: true });
    } else if (type === 'dosage') {
      setDosageForm(item ? { ...item } : { DosageValue: '500mg', Instructions: 'Once daily' });
    } else if (type === 'labTest') {
      setLabTestForm(item ? { ...item } : { TestName: '', DepartmentId: departments[0]?.DepartmentId || 1, NormalName: 'Normal', TestCost: 250, isActive: true });
    }
  };

  const closeModal = () => {
    setModalState({ open: false, type: '', item: null });
  };

  // Modal Submit Handlers
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalState.item) {
        await adminService.updateUser(modalState.item.UserId, userForm);
        showToast(`User ${userForm.Username} updated.`);
      } else {
        await adminService.createUser(userForm);
        showToast(`User ${userForm.Username} created.`);
      }
      closeModal();
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalState.item) {
        await adminService.updateRole(modalState.item.RoleId, roleForm);
        showToast(`Role updated.`);
      } else {
        await adminService.createRole(roleForm);
        showToast(`Role ${roleForm.RoleName} created.`);
      }
      closeModal();
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalState.item) {
        await adminService.updateDepartment(modalState.item.DepartmentId, deptForm);
        showToast(`Department updated.`);
      } else {
        await adminService.createDepartment(deptForm);
        showToast(`Department ${deptForm.DepartmentName} created.`);
      }
      closeModal();
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalState.item) {
        await adminService.updateDoctor(modalState.item.DoctorId, doctorForm);
        showToast(`Doctor profile updated.`);
      } else {
        await adminService.createDoctor(doctorForm);
        showToast(`Doctor ${doctorForm.Name} registered.`);
      }
      closeModal();
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(staffForm.phoneNumber)) {
      showToast('Phone number must be exactly 10 digits.', 'error');
      return;
    }
    try {
      if (modalState.item) {
        await adminService.updateStaff(modalState.item.StaffId, staffForm);
        showToast(`Staff member updated.`);
      } else {
        await adminService.createStaff(staffForm);
        showToast(`Staff member ${staffForm.Name} registered.`);
      }
      closeModal();
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleMedSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(medForm.MRP) < parseFloat(medForm.CostValue)) {
      showToast('MRP must be greater than or equal to Cost Value.', 'error');
      return;
    }
    try {
      if (modalState.item) {
        await adminService.updateMedicine(modalState.item.MedicineId, medForm);
        showToast(`Master medicine ${medForm.MedicineName} updated.`);
      } else {
        await adminService.createMedicine(medForm);
        showToast(`Master medicine ${medForm.MedicineName} added.`);
      }
      closeModal();
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDosageSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminService.createDosage(dosageForm);
      showToast(`Standard dosage ${dosageForm.DosageValue} saved.`);
      closeModal();
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleLabTestSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalState.item) {
        await adminService.updateLabTest(modalState.item.LabtestId, labTestForm);
        showToast(`Lab test updated.`);
      } else {
        await adminService.createLabTest(labTestForm);
        showToast(`Lab test ${labTestForm.TestName} created.`);
      }
      closeModal();
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  // Reorder approval / rejection
  const handleApproveReorder = (orderId) => {
    adminService.approveReorderRequest(orderId, 'Approved and inventory stock credited by Administrator.');
    showToast(`Purchase order ${orderId} approved! Stock added to pharmacy inventory.`);
    loadAdminData();
  };

  const handleRejectReorder = (orderId) => {
    const note = prompt('Please enter rejection reason:', 'Budget allocation reached or duplicate item.');
    if (note) {
      adminService.rejectReorderRequest(orderId, note);
      showToast(`Purchase order ${orderId} rejected.`);
      loadAdminData();
    }
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="admin-shell">
      {/* Toast Notification */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          LEFT DARK NAVY SIDEBAR (Matching Doctor & Pharmacist)
      ────────────────────────────────────────────────────────── */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-brand-icon">
            <ShieldIcon size={20} color="#ffffff" />
          </div>
          <div>
            <span className="admin-sidebar-brand-name">CarePoint</span>
            <span className="admin-sidebar-brand-sub">Administrator Portal</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-label">OVERVIEW</div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
          >
            <DashboardGridIcon size={18} />
            Dashboard
          </button>

          <div className="admin-nav-section-label">CLINIC & STAFF</div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
          >
            <UsersIcon size={18} />
            User Accounts
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => { setActiveTab('roles'); setMobileMenuOpen(false); }}
          >
            <KeyIcon size={18} />
            Roles & Permissions
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'departments' ? 'active' : ''}`}
            onClick={() => { setActiveTab('departments'); setMobileMenuOpen(false); }}
          >
            <BuildingIcon size={18} />
            Departments
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'doctors' ? 'active' : ''}`}
            onClick={() => { setActiveTab('doctors'); setMobileMenuOpen(false); }}
          >
            <StethoscopeIcon size={18} />
            Doctors
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => { setActiveTab('staff'); setMobileMenuOpen(false); }}
          >
            <BadgeContactIcon size={18} />
            Staff Directory
          </button>

          <div className="admin-nav-section-label">CATALOGS & INVENTORY</div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'medicines' ? 'active' : ''}`}
            onClick={() => { setActiveTab('medicines'); setMobileMenuOpen(false); }}
          >
            <PillIcon size={18} />
            Master Medicines
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'lab-tests' ? 'active' : ''}`}
            onClick={() => { setActiveTab('lab-tests'); setMobileMenuOpen(false); }}
          >
            <FlaskIcon size={18} />
            Lab Test Catalog
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'reorders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reorders'); setMobileMenuOpen(false); }}
          >
            <TruckIcon size={18} />
            Pharmacy Reorders
            {pendingReordersCount > 0 && (
              <span className="admin-nav-badge">{pendingReordersCount}</span>
            )}
          </button>

          <div className="admin-nav-section-label">MONITORING & COMPLIANCE</div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => { setActiveTab('monitoring'); setMobileMenuOpen(false); }}
          >
            <ActivityMonitorIcon size={18} />
            Monitoring
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'audit-logs' ? 'active' : ''}`}
            onClick={() => { setActiveTab('audit-logs'); setMobileMenuOpen(false); }}
          >
            <ClipboardListIcon size={18} />
            System Audit Logs
          </button>
        </nav>

        {/* Dynamic Authenticated Administrator Profile Footer */}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar">
              {(currentUser.name || 'BW')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <span className="admin-sidebar-user-name">
                {currentUser.name || 'Bala Weslin'}
              </span>
              <span className="admin-sidebar-user-role">
                Administrator
              </span>
            </div>
          </div>
          <button className="admin-btn-signout" onClick={handleSignOut}>
            <SignOutIcon size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────────
          MAIN CONTENT AREA
      ────────────────────────────────────────────────────────── */}
      <main className="admin-main-area">
        {/* Mobile Header Banner */}
        <div className="admin-top-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.25rem' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>CarePoint Admin</span>
          </div>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{currentUser.name}</span>
        </div>

        <div className="admin-main-content">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="admin-header-flex">
                <div>
                  <div className="admin-greeting-eyebrow">{todayFormatted}</div>
                  <h1 className="admin-page-title">Clinic Administration & Governance</h1>
                  <p className="admin-page-subtitle">
                    System-wide oversight of clinic users, clinical staff, diagnostic catalogs, and operational integrity
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button className="btn btn-outline" onClick={() => openModal('user')}>
                    + Add User
                  </button>
                  <button className="btn btn-outline" onClick={() => openModal('doctor')}>
                    + Add Doctor
                  </button>
                  <button className="btn btn-primary" onClick={() => openModal('medicine')}>
                    + Add Medicine
                  </button>
                </div>
              </div>

              {/* Pending Pharmacy Reorder Alert Banner */}
              {pendingReordersCount > 0 && (
                <div className="admin-alert-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>🔔</span>
                    <div>
                      <strong>{pendingReordersCount} Pharmacy Purchase Order{pendingReordersCount > 1 ? 's' : ''} Awaiting Review</strong>
                      <div style={{ fontSize: '0.82rem', color: '#92400e' }}>
                        Pharmacist submitted restock requests for depleted pharmaceuticals.
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-primary" onClick={() => setActiveTab('reorders')}>
                    Review Reorders →
                  </button>
                </div>
              )}

              {/* 6 KPI Stat Cards */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-icon blue">
                    <UsersIcon size={22} />
                  </div>
                  <div>
                    <span className="admin-stat-val">{dashboardMetrics?.users?.total || users.length}</span>
                    <span className="admin-stat-label">
                      {dashboardMetrics?.users?.active || users.filter(u => u.isActive).length} Active Users
                    </span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon teal">
                    <StethoscopeIcon size={22} />
                  </div>
                  <div>
                    <span className="admin-stat-val">{doctors.length + staff.length}</span>
                    <span className="admin-stat-label">
                      {doctors.length} Doctors · {staff.length} Staff
                    </span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon purple">
                    <BuildingIcon size={22} />
                  </div>
                  <div>
                    <span className="admin-stat-val">{departments.length}</span>
                    <span className="admin-stat-label">
                      {departments.filter(d => d.isActive).length} Active Departments
                    </span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon amber">
                    <ActivityMonitorIcon size={22} />
                  </div>
                  <div>
                    <span className="admin-stat-val">{dashboardMetrics?.appointments?.today || appointments.length}</span>
                    <span className="admin-stat-label">
                      {dashboardMetrics?.appointments?.waiting || 0} Waiting Tokens
                    </span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon green">
                    <BadgeContactIcon size={22} />
                  </div>
                  <div>
                    <span className="admin-stat-val">{dashboardMetrics?.patients_registered || patients.length}</span>
                    <span className="admin-stat-label">Registered Patients</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon red">
                    <PillIcon size={22} />
                  </div>
                  <div>
                    <span className="admin-stat-val">{medicines.length + labTests.length}</span>
                    <span className="admin-stat-label">
                      {medicines.length} Meds · {labTests.length} Lab Tests
                    </span>
                  </div>
                </div>
              </div>

              {/* 2-Column Panel Grid */}
              <div className="admin-panel-grid">
                {/* Left Panel: Recent Administrative Audit Activity */}
                <div className="admin-card" style={{ marginBottom: 0 }}>
                  <div className="admin-card-header">
                    <h3 className="admin-card-title">
                      <ClipboardListIcon size={18} color="var(--primary)" />
                      Recent Administrative Activity
                    </h3>
                    <button className="btn btn-sm btn-outline" onClick={() => setActiveTab('audit-logs')}>
                      View All Logs →
                    </button>
                  </div>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Action</th>
                          <th>Resource</th>
                          <th>Details</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dashboardMetrics?.recent_audit_activity || auditLogs).slice(0, 5).map((log, i) => (
                          <tr key={log.AuditId || i}>
                            <td>
                              <span className={`adm-badge ${
                                log.ActionType === 'CREATE' ? 'adm-badge-active' :
                                log.ActionType === 'DELETE' || log.ActionType === 'DEACTIVATE' ? 'adm-badge-inactive' :
                                log.ActionType === 'LOGIN' ? 'adm-badge-info' : 'adm-badge-warning'
                              }`}>
                                {log.ActionType}
                              </span>
                            </td>
                            <td><strong>{log.TableAffected}</strong> #{log.RecordId}</td>
                            <td style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.Details}
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {new Date(log.action_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Panel: Departments & Doctor Allocation */}
                <div className="admin-card" style={{ marginBottom: 0 }}>
                  <div className="admin-card-header">
                    <h3 className="admin-card-title">
                      <BuildingIcon size={18} color="var(--primary)" />
                      Department & Doctor Allocation
                    </h3>
                    <button className="btn btn-sm btn-outline" onClick={() => setActiveTab('departments')}>
                      Manage Depts →
                    </button>
                  </div>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th>Assigned Doctors</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.map(dept => {
                          const deptDocs = doctors.filter(d => d.DepartmentId === dept.DepartmentId);
                          return (
                            <tr key={dept.DepartmentId}>
                              <td><strong>{dept.DepartmentName}</strong></td>
                              <td>
                                {deptDocs.length > 0 ? (
                                  deptDocs.map(d => d.Name).join(', ')
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>No doctors assigned</span>
                                )}
                              </td>
                              <td>
                                <span className={`adm-badge ${dept.isActive ? 'adm-badge-active' : 'adm-badge-inactive'}`}>
                                  {dept.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => { setActiveTab('doctors'); setDoctorDeptFilter(String(dept.DepartmentId)); }}
                                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                >
                                  View Doctors
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER ACCOUNTS */}
          {activeTab === 'users' && (
            <div>
              <div className="admin-header-flex">
                <div>
                  <h1 className="admin-page-title">User Accounts</h1>
                  <p className="admin-page-subtitle">Manage portal login credentials, assigned roles, and account security</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal('user')}>
                  + Create User Account
                </button>
              </div>

              <div className="admin-toolbar">
                <div className="admin-search-box">
                  <span className="admin-search-icon"><SearchIcon size={16} /></span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search by username or user ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <select className="admin-select" value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
                  <option value="All">All Roles</option>
                  {roles.map(r => (
                    <option key={r.RoleId} value={r.RoleId}>{r.RoleName}</option>
                  ))}
                </select>
                <select className="admin-select" value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>

              <div className="admin-card">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Username</th>
                        <th>Full Name</th>
                        <th>Assigned Role</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter(u => {
                          const matchSearch = (u.Username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                            String(u.UserId).includes(userSearch);
                          const matchRole = userRoleFilter === 'All' || String(u.RoleId) === String(userRoleFilter);
                          const matchStatus = userStatusFilter === 'All' || (userStatusFilter === 'Active' ? u.isActive : !u.isActive);
                          return matchSearch && matchRole && matchStatus;
                        })
                        .map(u => {
                          const role = roles.find(r => r.RoleId === u.RoleId);
                          return (
                            <tr key={u.UserId}>
                              <td><strong>#{u.UserId}</strong></td>
                              <td><code>{u.Username}</code></td>
                              <td>{u.Name || '—'}</td>
                              <td>
                                <span className="adm-badge adm-badge-info">{role?.RoleName || `Role ${u.RoleId}`}</span>
                              </td>
                              <td>
                                <span className={`adm-badge ${u.isActive ? 'adm-badge-active' : 'adm-badge-inactive'}`}>
                                  {u.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                  <button className="btn btn-sm btn-outline" onClick={() => openModal('user', u)}>
                                    Edit
                                  </button>
                                  {u.UserId !== 1 && (
                                    <>
                                      {u.isActive ? (
                                        <button
                                          className="btn btn-sm btn-outline"
                                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                                          onClick={async () => {
                                            await adminService.deactivateUser(u.UserId);
                                            showToast(`User ${u.Username} deactivated.`);
                                            loadAdminData();
                                          }}
                                        >
                                          Deactivate
                                        </button>
                                      ) : (
                                        <button
                                          className="btn btn-sm btn-outline"
                                          style={{ color: '#16a34a', borderColor: '#86efac' }}
                                          onClick={async () => {
                                            await adminService.activateUser(u.UserId);
                                            showToast(`User ${u.Username} activated.`);
                                            loadAdminData();
                                          }}
                                        >
                                          Activate
                                        </button>
                                      )}
                                      <button
                                        className="btn btn-sm btn-outline"
                                        style={{ color: '#dc2626' }}
                                        onClick={async () => {
                                          if (confirm(`Delete user account ${u.Username}?`)) {
                                            await adminService.deleteUser(u.UserId);
                                            showToast(`User deleted.`);
                                            loadAdminData();
                                          }
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div>
              <div className="admin-header-flex">
                <div>
                  <h1 className="admin-page-title">Roles & Access Control</h1>
                  <p className="admin-page-subtitle">Configure system roles and inspect user allocations</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal('role')}>
                  + Add Role
                </button>
              </div>

              <div className="admin-card">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Role ID</th>
                        <th>Role Name</th>
                        <th>Assigned User Accounts</th>
                        <th>Assigned Staff</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map(r => {
                        const userCount = users.filter(u => u.RoleId === r.RoleId).length;
                        const staffCount = staff.filter(s => s.RoleId === r.RoleId).length;
                        return (
                          <tr key={r.RoleId}>
                            <td><strong>#{r.RoleId}</strong></td>
                            <td><strong style={{ color: 'var(--primary)' }}>{r.RoleName}</strong></td>
                            <td>{userCount} User{userCount === 1 ? '' : 's'}</td>
                            <td>{staffCount} Staff Member{staffCount === 1 ? '' : 's'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                <button className="btn btn-sm btn-outline" onClick={() => openModal('role', r)}>
                                  Edit
                                </button>
                                {r.RoleId > 5 && (
                                  <button
                                    className="btn btn-sm btn-outline"
                                    style={{ color: '#dc2626' }}
                                    onClick={async () => {
                                      if (confirm(`Delete role ${r.RoleName}?`)) {
                                        await adminService.deleteRole(r.RoleId);
                                        showToast(`Role deleted.`);
                                        loadAdminData();
                                      }
                                    }}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DEPARTMENTS */}
          {activeTab === 'departments' && (
            <div>
              <div className="admin-header-flex">
                <div>
                  <h1 className="admin-page-title">Clinic Departments</h1>
                  <p className="admin-page-subtitle">Clinical specialties, medical department heads, and diagnostic test associations</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal('department')}>
                  + Add Department
                </button>
              </div>

              <div className="admin-toolbar">
                <div className="admin-search-box">
                  <span className="admin-search-icon"><SearchIcon size={16} /></span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search departments..."
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Dept ID</th>
                        <th>Department Name</th>
                        <th>Assigned Doctors</th>
                        <th>Lab Tests Offered</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments
                        .filter(d => (d.DepartmentName || '').toLowerCase().includes(deptSearch.toLowerCase()))
                        .map(d => {
                          const deptDocs = doctors.filter(doc => doc.DepartmentId === d.DepartmentId);
                          const deptTests = labTests.filter(t => t.DepartmentId === d.DepartmentId);
                          return (
                            <tr key={d.DepartmentId}>
                              <td><strong>#{d.DepartmentId}</strong></td>
                              <td><strong>{d.DepartmentName}</strong></td>
                              <td>{deptDocs.map(doc => doc.Name).join(', ') || <span style={{ color: 'var(--text-muted)' }}>None</span>}</td>
                              <td>{deptTests.length} Diagnostic Tests</td>
                              <td>
                                <span className={`adm-badge ${d.isActive ? 'adm-badge-active' : 'adm-badge-inactive'}`}>
                                  {d.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                  <button className="btn btn-sm btn-outline" onClick={() => openModal('department', d)}>
                                    Edit
                                  </button>
                                  {d.isActive ? (
                                    <button
                                      className="btn btn-sm btn-outline"
                                      style={{ color: '#dc2626' }}
                                      onClick={async () => {
                                        await adminService.deactivateDepartment(d.DepartmentId);
                                        showToast(`Department deactivated.`);
                                        loadAdminData();
                                      }}
                                    >
                                      Deactivate
                                    </button>
                                  ) : (
                                    <button
                                      className="btn btn-sm btn-outline"
                                      style={{ color: '#16a34a' }}
                                      onClick={async () => {
                                        await adminService.activateDepartment(d.DepartmentId);
                                        showToast(`Department activated.`);
                                        loadAdminData();
                                      }}
                                    >
                                      Activate
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-sm btn-outline"
                                    style={{ color: '#dc2626' }}
                                    onClick={async () => {
                                      if (confirm(`Delete department ${d.DepartmentName}?`)) {
                                        await adminService.deleteDepartment(d.DepartmentId);
                                        showToast('Department deleted.');
                                        loadAdminData();
                                      }
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOCTORS */}
          {activeTab === 'doctors' && (
            <div>
              <div className="admin-header-flex">
                <div>
                  <h1 className="admin-page-title">Doctor Directory</h1>
                  <p className="admin-page-subtitle">Physicians, qualifications, clinical specializations, and portal linkings</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal('doctor')}>
                  + Register Doctor
                </button>
              </div>

              <div className="admin-toolbar">
                <div className="admin-search-box">
                  <span className="admin-search-icon"><SearchIcon size={16} /></span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search doctor name, specialization, or qualification..."
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                  />
                </div>
                <select className="admin-select" value={doctorDeptFilter} onChange={(e) => setDoctorDeptFilter(e.target.value)}>
                  <option value="All">All Departments</option>
                  {departments.map(d => (
                    <option key={d.DepartmentId} value={d.DepartmentId}>{d.DepartmentName}</option>
                  ))}
                </select>
              </div>

              <div className="admin-card">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Doc ID</th>
                        <th>Doctor Name</th>
                        <th>Department</th>
                        <th>Qualification</th>
                        <th>Specialization</th>
                        <th>Linked User</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctors
                        .filter(doc => {
                          const matchSearch = (doc.Name || '').toLowerCase().includes(doctorSearch.toLowerCase()) ||
                            (doc.Specialization || '').toLowerCase().includes(doctorSearch.toLowerCase()) ||
                            (doc.Qualification || '').toLowerCase().includes(doctorSearch.toLowerCase());
                          const matchDept = doctorDeptFilter === 'All' || String(doc.DepartmentId) === String(doctorDeptFilter);
                          return matchSearch && matchDept;
                        })
                        .map(doc => {
                          const dept = departments.find(d => d.DepartmentId === doc.DepartmentId);
                          const linkedUser = users.find(u => u.UserId === doc.UserId);
                          return (
                            <tr key={doc.DoctorId}>
                              <td><strong>#{doc.DoctorId}</strong></td>
                              <td><strong style={{ color: 'var(--primary)' }}>{doc.Name}</strong></td>
                              <td>{dept?.DepartmentName || `Dept ${doc.DepartmentId}`}</td>
                              <td>{doc.Qualification || 'MBBS'}</td>
                              <td>{doc.Specialization || 'General'}</td>
                              <td>
                                {linkedUser ? (
                                  <code>{linkedUser.Username}</code>
                                ) : (
                                  <span style={{ color: '#d97706', fontSize: '0.8rem' }}>Unlinked</span>
                                )}
                              </td>
                              <td>
                                <span className={`adm-badge ${doc.isActive ? 'adm-badge-active' : 'adm-badge-inactive'}`}>
                                  {doc.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                  <button className="btn btn-sm btn-outline" onClick={() => openModal('doctor', doc)}>
                                    Edit
                                  </button>
                                  {doc.isActive ? (
                                    <button
                                      className="btn btn-sm btn-outline"
                                      style={{ color: '#dc2626' }}
                                      onClick={async () => {
                                        await adminService.deactivateDoctor(doc.DoctorId);
                                        showToast(`Doctor deactivated.`);
                                        loadAdminData();
                                      }}
                                    >
                                      Deactivate
                                    </button>
                                  ) : (
                                    <button
                                      className="btn btn-sm btn-outline"
                                      style={{ color: '#16a34a' }}
                                      onClick={async () => {
                                        await adminService.activateDoctor(doc.DoctorId);
                                        showToast(`Doctor activated.`);
                                        loadAdminData();
                                      }}
                                    >
                                      Activate
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-sm btn-outline"
                                    style={{ color: '#dc2626' }}
                                    onClick={async () => {
                                      if (confirm(`Delete doctor record ${doc.Name}?`)) {
                                        await adminService.deleteDoctor(doc.DoctorId);
                                        showToast('Doctor record deleted.');
                                        loadAdminData();
                                      }
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: STAFF DIRECTORY */}
          {activeTab === 'staff' && (
            <div>
              <div className="admin-header-flex">
                <div>
                  <h1 className="admin-page-title">Clinical & Administrative Staff</h1>
                  <p className="admin-page-subtitle">Receptionists, laboratory technicians, pharmacists, and medical assistants</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal('staff')}>
                  + Add Staff Member
                </button>
              </div>

              <div className="admin-toolbar">
                <div className="admin-search-box">
                  <span className="admin-search-icon"><SearchIcon size={16} /></span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search staff by name, phone, or address..."
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                  />
                </div>
                <select className="admin-select" value={staffRoleFilter} onChange={(e) => setStaffRoleFilter(e.target.value)}>
                  <option value="All">All Roles</option>
                  <option value="3">Receptionist</option>
                  <option value="4">Lab Technician</option>
                  <option value="5">Pharmacist</option>
                </select>
              </div>

              <div className="admin-card">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Staff ID</th>
                        <th>Full Name</th>
                        <th>Role</th>
                        <th>Phone Number</th>
                        <th>Date of Joining</th>
                        <th>Address</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff
                        .filter(s => {
                          const matchSearch = (s.Name || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
                            (s.phoneNumber || '').includes(staffSearch) ||
                            (s.Address || '').toLowerCase().includes(staffSearch.toLowerCase());
                          const matchRole = staffRoleFilter === 'All' || String(s.RoleId) === String(staffRoleFilter);
                          return matchSearch && matchRole;
                        })
                        .map(s => {
                          const role = roles.find(r => r.RoleId === s.RoleId);
                          return (
                            <tr key={s.StaffId}>
                              <td><strong>#{s.StaffId}</strong></td>
                              <td><strong>{s.Name}</strong></td>
                              <td><span className="adm-badge adm-badge-info">{role?.RoleName || `Role ${s.RoleId}`}</span></td>
                              <td>{s.phoneNumber || '—'}</td>
                              <td>{s.DateOfJoining || '—'}</td>
                              <td>{s.Address || '—'}</td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                  <button className="btn btn-sm btn-outline" onClick={() => openModal('staff', s)}>
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline"
                                    style={{ color: '#dc2626' }}
                                    onClick={async () => {
                                      if (confirm(`Delete staff record for ${s.Name}?`)) {
                                        await adminService.deleteStaff(s.StaffId);
                                        showToast('Staff member deleted.');
                                        loadAdminData();
                                      }
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: MASTER MEDICINES & DOSAGES */}
          {activeTab === 'medicines' && (
            <div>
              <div className="admin-header-flex">
                <div>
                  <h1 className="admin-page-title">Pharmaceutical Master Catalog & Dosages</h1>
                  <p className="admin-page-subtitle">
                    Central authority for clinic medicine formulations, wholesale price lists, MRP, and standard dosage options
                  </p>
                </div>
                {medicinesSubTab === 'catalog' ? (
                  <button className="btn btn-primary" onClick={() => openModal('medicine')}>
                    + Add Master Medicine
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={() => openModal('dosage')}>
                    + Add Dosage
                  </button>
                )}
              </div>

              {/* Sub-tab pills */}
              <div className="admin-subnav-pills">
                <button
                  type="button"
                  className={`admin-subnav-pill ${medicinesSubTab === 'catalog' ? 'active' : ''}`}
                  onClick={() => setMedicinesSubTab('catalog')}
                >
                  Master Medicines ({medicines.length})
                </button>
                <button
                  type="button"
                  className={`admin-subnav-pill ${medicinesSubTab === 'dosages' ? 'active' : ''}`}
                  onClick={() => setMedicinesSubTab('dosages')}
                >
                  Standard Dosages ({dosages.length})
                </button>
              </div>

              {medicinesSubTab === 'catalog' ? (
                <>
                  <div className="admin-toolbar">
                    <div className="admin-search-box">
                      <span className="admin-search-icon"><SearchIcon size={16} /></span>
                      <input
                        type="text"
                        className="admin-search-input"
                        placeholder="Search by medicine name, generic name, or manufacturer..."
                        value={medSearch}
                        onChange={(e) => setMedSearch(e.target.value)}
                      />
                    </div>
                    <select className="admin-select" value={medCategoryFilter} onChange={(e) => setMedCategoryFilter(e.target.value)}>
                      <option value="All">All Categories</option>
                      <option value="Analgesic">Analgesics</option>
                      <option value="Antibiotic">Antibiotics</option>
                      <option value="Antihistamine">Antihistamines</option>
                      <option value="Antidiabetic">Antidiabetics</option>
                      <option value="Antacid">Antacids</option>
                      <option value="Cardiovascular">Cardiovascular</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div className="admin-card">
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Med ID</th>
                            <th>Medicine Name</th>
                            <th>Generic Name</th>
                            <th>Category</th>
                            <th>Manufacturer</th>
                            <th>Cost Value (₹)</th>
                            <th>Selling MRP (₹)</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medicines
                            .filter(m => {
                              const matchSearch = (m.MedicineName || '').toLowerCase().includes(medSearch.toLowerCase()) ||
                                (m.GenericName || '').toLowerCase().includes(medSearch.toLowerCase()) ||
                                (m.Manufacturer || '').toLowerCase().includes(medSearch.toLowerCase());
                              const matchCategory = medCategoryFilter === 'All' || m.Category === medCategoryFilter;
                              return matchSearch && matchCategory;
                            })
                            .map(m => (
                              <tr key={m.MedicineId}>
                                <td><strong>#{m.MedicineId}</strong></td>
                                <td><strong style={{ color: 'var(--primary)' }}>{m.MedicineName}</strong></td>
                                <td>{m.GenericName || '—'}</td>
                                <td><span className="adm-badge adm-badge-info">{m.Category || 'General'}</span></td>
                                <td>{m.Manufacturer || 'CarePoint'}</td>
                                <td>₹{m.CostValue}</td>
                                <td><strong>₹{m.MRP}</strong></td>
                                <td>
                                  <span className={`adm-badge ${m.isActive ? 'adm-badge-active' : 'adm-badge-inactive'}`}>
                                    {m.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-sm btn-outline" onClick={() => openModal('medicine', m)}>
                                      Edit
                                    </button>
                                    {m.isActive ? (
                                      <button
                                        className="btn btn-sm btn-outline"
                                        style={{ color: '#dc2626' }}
                                        onClick={async () => {
                                          await adminService.deactivateMedicine(m.MedicineId);
                                          showToast(`Medicine deactivated.`);
                                          loadAdminData();
                                        }}
                                      >
                                        Deactivate
                                      </button>
                                    ) : (
                                      <button
                                        className="btn btn-sm btn-outline"
                                        style={{ color: '#16a34a' }}
                                        onClick={async () => {
                                          await adminService.activateMedicine(m.MedicineId);
                                          showToast(`Medicine activated.`);
                                          loadAdminData();
                                        }}
                                      >
                                        Activate
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-sm btn-outline"
                                      style={{ color: '#dc2626' }}
                                      onClick={async () => {
                                        if (confirm(`Delete master medicine ${m.MedicineName}?`)) {
                                          await adminService.deleteMedicine(m.MedicineId);
                                          showToast('Medicine deleted.');
                                          loadAdminData();
                                        }
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="admin-card">
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Dosage ID</th>
                          <th>Dosage Value</th>
                          <th>Standard Instructions</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dosages.map(d => (
                          <tr key={d.DosageId}>
                            <td><strong>#{d.DosageId}</strong></td>
                            <td><strong style={{ color: 'var(--primary)' }}>{d.DosageValue}</strong></td>
                            <td>{d.Instructions || 'Take with water'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-sm btn-outline"
                                style={{ color: '#dc2626' }}
                                onClick={async () => {
                                  if (confirm(`Delete dosage ${d.DosageValue}?`)) {
                                    await adminService.deleteDosage(d.DosageId);
                                    showToast('Dosage deleted.');
                                    loadAdminData();
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: LAB TESTS CATALOG */}
          {activeTab === 'lab-tests' && (
            <div>
              <div className="admin-header-flex">
                <div>
                  <h1 className="admin-page-title">Laboratory Test Catalog</h1>
                  <p className="admin-page-subtitle">Diagnostic investigations, associated departments, reference ranges, and tariff charges</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal('labTest')}>
                  + Add Lab Test
                </button>
              </div>

              <div className="admin-toolbar">
                <div className="admin-search-box">
                  <span className="admin-search-icon"><SearchIcon size={16} /></span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search lab tests..."
                    value={labTestSearch}
                    onChange={(e) => setLabTestSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Test ID</th>
                        <th>Test Name</th>
                        <th>Department</th>
                        <th>Normal Reference Range</th>
                        <th>Standard Cost (₹)</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labTests
                        .filter(t => (t.TestName || '').toLowerCase().includes(labTestSearch.toLowerCase()))
                        .map(t => {
                          const dept = departments.find(d => d.DepartmentId === t.DepartmentId);
                          return (
                            <tr key={t.LabtestId}>
                              <td><strong>#{t.LabtestId}</strong></td>
                              <td><strong style={{ color: 'var(--primary)' }}>{t.TestName}</strong></td>
                              <td>{dept?.DepartmentName || 'General Pathology'}</td>
                              <td><code>{t.NormalName || t.NormalValue || 'Normal'}</code></td>
                              <td><strong>₹{t.TestCost}</strong></td>
                              <td>
                                <span className={`adm-badge ${t.isActive ? 'adm-badge-active' : 'adm-badge-inactive'}`}>
                                  {t.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                  <button className="btn btn-sm btn-outline" onClick={() => openModal('labTest', t)}>
                                    Edit
                                  </button>
                                  {t.isActive ? (
                                    <button
                                      className="btn btn-sm btn-outline"
                                      style={{ color: '#dc2626' }}
                                      onClick={async () => {
                                        await adminService.deactivateLabTest(t.LabtestId);
                                        showToast(`Lab test deactivated.`);
                                        loadAdminData();
                                      }}
                                    >
                                      Deactivate
                                    </button>
                                  ) : (
                                    <button
                                      className="btn btn-sm btn-outline"
                                      style={{ color: '#16a34a' }}
                                      onClick={async () => {
                                        await adminService.activateLabTest(t.LabtestId);
                                        showToast(`Lab test activated.`);
                                        loadAdminData();
                                      }}
                                    >
                                      Activate
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-sm btn-outline"
                                    style={{ color: '#dc2626' }}
                                    onClick={async () => {
                                      if (confirm(`Delete lab test ${t.TestName}?`)) {
                                        await adminService.deleteLabTest(t.LabtestId);
                                        showToast('Lab test deleted.');
                                        loadAdminData();
                                      }
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: PHARMACY REORDERS */}
          {activeTab === 'reorders' && (
            <div>
              <div className="admin-header-flex">
                <div>
                  <h1 className="admin-page-title">Pharmacy Reorder Authorizations</h1>
                  <p className="admin-page-subtitle">
                    Review and authorize pharmaceutical procurement requests submitted by the Pharmacist module
                  </p>
                </div>
              </div>

              <div className="admin-toolbar">
                {['All', 'Pending Approval', 'Ordered', 'Received', 'Rejected'].map(status => (
                  <button
                    key={status}
                    type="button"
                    className={`btn btn-sm ${reorderFilter === status ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setReorderFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="admin-card">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order PO #</th>
                        <th>Medicine</th>
                        <th>Requested Quantity</th>
                        <th>Wholesale Supplier</th>
                        <th>Order Date</th>
                        <th>Estimated Cost (₹)</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Authorization Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reorders.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                            No pharmacy reorders in queue.
                          </td>
                        </tr>
                      ) : (
                        reorders
                          .filter(r => {
                            if (reorderFilter === 'All') return true;
                            if (reorderFilter === 'Pending Approval') return r.status === 'Ordered' || r.status === 'Pending Approval';
                            return r.status === reorderFilter;
                          })
                          .map(order => (
                            <tr key={order.id}>
                              <td><strong>{order.id}</strong></td>
                              <td><strong>{order.medicineName}</strong></td>
                              <td>{order.requestedQty} Units</td>
                              <td>{order.supplier}</td>
                              <td>{order.orderDate}</td>
                              <td>₹{order.estimatedCost}</td>
                              <td>
                                <span className={`adm-badge ${
                                  order.status === 'Received' || order.status === 'Approved' ? 'adm-badge-active' :
                                  order.status === 'Rejected' ? 'adm-badge-inactive' : 'adm-badge-warning'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {order.status !== 'Received' && order.status !== 'Rejected' ? (
                                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                    <button
                                      className="btn btn-sm btn-primary"
                                      onClick={() => handleApproveReorder(order.id)}
                                    >
                                      ✓ Approve & Restock
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline"
                                      style={{ color: '#dc2626' }}
                                      onClick={() => handleRejectReorder(order.id)}
                                    >
                                      ✗ Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: order.status === 'Received' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                    {order.status === 'Received' ? '✓ Stock Credited' : 'Rejected'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: APPOINTMENTS & PATIENTS MONITORING */}
          {activeTab === 'monitoring' && (
            <div>
              <div className="admin-header-flex">
                <div>
                  <h1 className="admin-page-title">Appointments & Patient Registry Monitor</h1>
                  <p className="admin-page-subtitle">Read-only oversight of clinical bookings, queue statuses, and demographics</p>
                </div>
              </div>

              <div className="admin-subnav-pills">
                <button
                  type="button"
                  className={`admin-subnav-pill ${monitoringSubTab === 'appointments' ? 'active' : ''}`}
                  onClick={() => setMonitoringSubTab('appointments')}
                >
                  Appointment Bookings ({appointments.length})
                </button>
                <button
                  type="button"
                  className={`admin-subnav-pill ${monitoringSubTab === 'patients' ? 'active' : ''}`}
                  onClick={() => setMonitoringSubTab('patients')}
                >
                  Registered Patients ({patients.length})
                </button>
              </div>

              {monitoringSubTab === 'appointments' ? (
                <div className="admin-card">
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Apt ID</th>
                          <th>Patient Name</th>
                          <th>Attending Doctor</th>
                          <th>Department</th>
                          <th>Appointment Time</th>
                          <th>Queue Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.length === 0 ? (
                          <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No appointments recorded.</td></tr>
                        ) : (
                          appointments.map(apt => (
                            <tr key={apt.AppointmentId}>
                              <td><strong>#{apt.AppointmentId}</strong></td>
                              <td><strong>{apt.PatientName}</strong></td>
                              <td>{apt.DoctorName}</td>
                              <td>{apt.DepartmentName}</td>
                              <td>{new Date(apt.AppointmentDateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                              <td>
                                <span className={`adm-badge ${
                                  apt.AppointmentStatus === 'Completed' ? 'adm-badge-active' :
                                  apt.AppointmentStatus === 'Waiting' ? 'adm-badge-warning' : 'adm-badge-info'
                                }`}>
                                  {apt.AppointmentStatus}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="admin-card">
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Patient ID</th>
                          <th>Name</th>
                          <th>Gender & Age</th>
                          <th>Phone Number</th>
                          <th>Blood Group</th>
                          <th>Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.map(p => (
                          <tr key={p.PatientId}>
                            <td><strong>{p.PatientId}</strong></td>
                            <td><strong>{p.Name}</strong></td>
                            <td>{p.Gender || '—'} · {p.DOB ? `${new Date().getFullYear() - new Date(p.DOB).getFullYear()}y` : '—'}</td>
                            <td>{p.PhoneNumber || '—'}</td>
                            <td><span className="adm-badge adm-badge-info">{p.BloodGroup || 'O+'}</span></td>
                            <td>{p.Address || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 11: SYSTEM AUDIT LOGS */}
          {activeTab === 'audit-logs' && (
            <div>
              <div className="admin-header-flex">
                <div>
                  <h1 className="admin-page-title">System Audit Activity Logs</h1>
                  <p className="admin-page-subtitle">Immutable compliance records of logins, administrative writes, and policy actions</p>
                </div>
                <button className="btn btn-outline" onClick={loadAdminData}>
                  ⟳ Refresh Logs
                </button>
              </div>

              <div className="admin-toolbar">
                <select className="admin-select" value={auditActionFilter} onChange={(e) => setAuditActionFilter(e.target.value)}>
                  <option value="All">All Action Types</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="ACTIVATE">ACTIVATE</option>
                  <option value="DEACTIVATE">DEACTIVATE</option>
                  <option value="APPROVE">APPROVE</option>
                </select>
              </div>

              <div className="admin-card">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Audit ID</th>
                        <th>Action Type</th>
                        <th>Target Model</th>
                        <th>Record ID</th>
                        <th>Details</th>
                        <th>User ID</th>
                        <th>Action Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs
                        .filter(l => auditActionFilter === 'All' || l.ActionType === auditActionFilter)
                        .map(log => (
                          <tr key={log.AuditId}>
                            <td><code>#{log.AuditId}</code></td>
                            <td>
                              <span className={`adm-badge ${
                                log.ActionType === 'CREATE' || log.ActionType === 'APPROVE' ? 'adm-badge-active' :
                                log.ActionType === 'DELETE' || log.ActionType === 'DEACTIVATE' ? 'adm-badge-inactive' :
                                log.ActionType === 'LOGIN' ? 'adm-badge-info' : 'adm-badge-warning'
                              }`}>
                                {log.ActionType}
                              </span>
                            </td>
                            <td><strong>{log.TableAffected}</strong></td>
                            <td>#{log.RecordId || '—'}</td>
                            <td>{log.Details}</td>
                            <td>User #{log.UserId}</td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {new Date(log.action_time).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ──────────────────────────────────────────────────────────
          MODAL: USER ACCOUNT (CREATE / EDIT)
      ────────────────────────────────────────────────────────── */}
      {modalState.open && modalState.type === 'user' && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{modalState.item ? `Edit User #${modalState.item.UserId}` : 'Create User Account'}</h3>
              <button style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }} onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleUserSubmit}>
              <div className="admin-modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Username * (min 3 characters)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. jdoe"
                    value={userForm.Username}
                    onChange={(e) => setUserForm({ ...userForm, Username: e.target.value.replace(/\s+/g, '') })}
                    required
                    minLength={3}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">{modalState.item ? 'New Password (leave blank to keep unchanged)' : 'Password * (min 4 characters)'}</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={userForm.Password}
                    onChange={(e) => setUserForm({ ...userForm, Password: e.target.value })}
                    required={!modalState.item}
                    minLength={modalState.item && !userForm.Password ? 0 : 4}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Assigned Role *</label>
                  <select
                    className="form-control"
                    value={userForm.RoleId}
                    onChange={(e) => setUserForm({ ...userForm, RoleId: parseInt(e.target.value, 10) })}
                  >
                    {roles.map(r => (
                      <option key={r.RoleId} value={r.RoleId}>{r.RoleName}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <input
                    type="checkbox"
                    id="userActiveCheck"
                    checked={userForm.isActive}
                    onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                  />
                  <label htmlFor="userActiveCheck" style={{ margin: 0, fontSize: '0.88rem' }}>Account is Active</label>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: ROLE (CREATE / EDIT)
      ────────────────────────────────────────────────────────── */}
      {modalState.open && modalState.type === 'role' && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{modalState.item ? 'Edit Role' : 'Add New Role'}</h3>
              <button style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }} onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleRoleSubmit}>
              <div className="admin-modal-body">
                <div>
                  <label className="form-label">Role Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Head Nurse"
                    value={roleForm.RoleName}
                    onChange={(e) => setRoleForm({ ...roleForm, RoleName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: DEPARTMENT (CREATE / EDIT)
      ────────────────────────────────────────────────────────── */}
      {modalState.open && modalState.type === 'department' && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{modalState.item ? 'Edit Department' : 'Add Department'}</h3>
              <button style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }} onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleDeptSubmit}>
              <div className="admin-modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Department Name * (max 30 characters)</label>
                  <input
                    type="text"
                    maxLength={30}
                    className="form-control"
                    placeholder="e.g. Neurology"
                    value={deptForm.DepartmentName}
                    onChange={(e) => setDeptForm({ ...deptForm, DepartmentName: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="deptActiveCheck"
                    checked={deptForm.isActive}
                    onChange={(e) => setDeptForm({ ...deptForm, isActive: e.target.checked })}
                  />
                  <label htmlFor="deptActiveCheck" style={{ margin: 0, fontSize: '0.88rem' }}>Department is Active</label>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: DOCTOR (CREATE / EDIT)
      ────────────────────────────────────────────────────────── */}
      {modalState.open && modalState.type === 'doctor' && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{modalState.item ? 'Edit Doctor Profile' : 'Register New Doctor'}</h3>
              <button style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }} onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleDoctorSubmit}>
              <div className="admin-modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Doctor Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Dr. Sarah Thomas"
                    value={doctorForm.Name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, Name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Qualification *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. MBBS, MD"
                      value={doctorForm.Qualification}
                      onChange={(e) => setDoctorForm({ ...doctorForm, Qualification: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Specialization *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Cardiology"
                      value={doctorForm.Specialization}
                      onChange={(e) => setDoctorForm({ ...doctorForm, Specialization: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Department *</label>
                    <select
                      className="form-control"
                      value={doctorForm.DepartmentId}
                      onChange={(e) => setDoctorForm({ ...doctorForm, DepartmentId: parseInt(e.target.value, 10) })}
                    >
                      {departments.map(d => (
                        <option key={d.DepartmentId} value={d.DepartmentId}>{d.DepartmentName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Linked User Account</label>
                    <select
                      className="form-control"
                      value={doctorForm.UserId || ''}
                      onChange={(e) => setDoctorForm({ ...doctorForm, UserId: e.target.value ? parseInt(e.target.value, 10) : null })}
                    >
                      <option value="">(None / Unlinked)</option>
                      {users.map(u => (
                        <option key={u.UserId} value={u.UserId}>{u.Username} ({u.Name || 'User'})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="docActiveCheck"
                    checked={doctorForm.isActive}
                    onChange={(e) => setDoctorForm({ ...doctorForm, isActive: e.target.checked })}
                  />
                  <label htmlFor="docActiveCheck" style={{ margin: 0, fontSize: '0.88rem' }}>Doctor is Active</label>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: STAFF (CREATE / EDIT)
      ────────────────────────────────────────────────────────── */}
      {modalState.open && modalState.type === 'staff' && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{modalState.item ? 'Edit Staff Member' : 'Register Staff Member'}</h3>
              <button style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }} onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleStaffSubmit}>
              <div className="admin-modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Joel Jain"
                    value={staffForm.Name}
                    onChange={(e) => setStaffForm({ ...staffForm, Name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Role *</label>
                    <select
                      className="form-control"
                      value={staffForm.RoleId}
                      onChange={(e) => setStaffForm({ ...staffForm, RoleId: parseInt(e.target.value, 10) })}
                    >
                      {roles.map(r => (
                        <option key={r.RoleId} value={r.RoleId}>{r.RoleName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Phone Number * (10 digits)</label>
                    <input
                      type="text"
                      maxLength={10}
                      className="form-control"
                      placeholder="9876543210"
                      value={staffForm.phoneNumber}
                      onChange={(e) => setStaffForm({ ...staffForm, phoneNumber: e.target.value.replace(/\D/g, '') })}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      value={staffForm.DateofBirth}
                      onChange={(e) => setStaffForm({ ...staffForm, DateofBirth: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Date of Joining</label>
                    <input
                      type="date"
                      className="form-control"
                      value={staffForm.DateOfJoining}
                      onChange={(e) => setStaffForm({ ...staffForm, DateOfJoining: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ernakulam, Kerala"
                    value={staffForm.Address}
                    onChange={(e) => setStaffForm({ ...staffForm, Address: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Staff Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: MASTER MEDICINE (CREATE / EDIT)
      ────────────────────────────────────────────────────────── */}
      {modalState.open && modalState.type === 'medicine' && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{modalState.item ? 'Edit Master Medicine' : 'Add Master Medicine Formulation'}</h3>
              <button style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }} onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleMedSubmit}>
              <div className="admin-modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Medicine Brand Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Paracetamol"
                    value={medForm.MedicineName}
                    onChange={(e) => setMedForm({ ...medForm, MedicineName: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Generic / Chemical Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Acetaminophen"
                      value={medForm.GenericName}
                      onChange={(e) => setMedForm({ ...medForm, GenericName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={medForm.Category}
                      onChange={(e) => setMedForm({ ...medForm, Category: e.target.value })}
                    >
                      <option>Analgesic</option>
                      <option>Antibiotic</option>
                      <option>Antacid</option>
                      <option>Antihistamine</option>
                      <option>Antidiabetic</option>
                      <option>Cardiovascular</option>
                      <option>NSAID</option>
                      <option>General</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Manufacturer</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Cipla Laboratories"
                      value={medForm.Manufacturer}
                      onChange={(e) => setMedForm({ ...medForm, Manufacturer: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label className="form-label">Cost (₹) *</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="form-control"
                        value={medForm.CostValue}
                        onChange={(e) => setMedForm({ ...medForm, CostValue: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">MRP (₹) *</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="form-control"
                        value={medForm.MRP}
                        onChange={(e) => setMedForm({ ...medForm, MRP: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="medActiveCheck"
                    checked={medForm.isActive}
                    onChange={(e) => setMedForm({ ...medForm, isActive: e.target.checked })}
                  />
                  <label htmlFor="medActiveCheck" style={{ margin: 0, fontSize: '0.88rem' }}>Formulation is Active</label>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Formulation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: DOSAGE (CREATE)
      ────────────────────────────────────────────────────────── */}
      {modalState.open && modalState.type === 'dosage' && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Add Standard Prescription Dosage</h3>
              <button style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }} onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleDosageSubmit}>
              <div className="admin-modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Dosage Value *</label>
                  <select
                    className="form-control"
                    value={dosageForm.DosageValue}
                    onChange={(e) => setDosageForm({ ...dosageForm, DosageValue: e.target.value })}
                  >
                    <option value="250mg">250mg</option>
                    <option value="500mg">500mg</option>
                    <option value="650mg">650mg</option>
                    <option value="1000mg">1000mg</option>
                    <option value="5ml">5ml</option>
                    <option value="10ml">10ml</option>
                    <option value="1 tablet">1 tablet</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Instructions</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Twice daily with water after meals"
                    value={dosageForm.Instructions}
                    onChange={(e) => setDosageForm({ ...dosageForm, Instructions: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Dosage</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: LAB TEST (CREATE / EDIT)
      ────────────────────────────────────────────────────────── */}
      {modalState.open && modalState.type === 'labTest' && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{modalState.item ? 'Edit Lab Test' : 'Add Diagnostic Lab Test'}</h3>
              <button style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }} onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleLabTestSubmit}>
              <div className="admin-modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Test Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Serum Electrolytes"
                    value={labTestForm.TestName}
                    onChange={(e) => setLabTestForm({ ...labTestForm, TestName: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Department</label>
                    <select
                      className="form-control"
                      value={labTestForm.DepartmentId}
                      onChange={(e) => setLabTestForm({ ...labTestForm, DepartmentId: parseInt(e.target.value, 10) })}
                    >
                      {departments.map(d => (
                        <option key={d.DepartmentId} value={d.DepartmentId}>{d.DepartmentName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Standard Tariff (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={labTestForm.TestCost}
                      onChange={(e) => setLabTestForm({ ...labTestForm, TestCost: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Normal Reference Range *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 135-145 mEq/L"
                    value={labTestForm.NormalName}
                    onChange={(e) => setLabTestForm({ ...labTestForm, NormalName: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="labActiveCheck"
                    checked={labTestForm.isActive}
                    onChange={(e) => setLabTestForm({ ...labTestForm, isActive: e.target.checked })}
                  />
                  <label htmlFor="labActiveCheck" style={{ margin: 0, fontSize: '0.88rem' }}>Test is Active in Catalog</label>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Test</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
