import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import pharmacistService, { PHARMACY_STORAGE_KEYS } from '../services/pharmacistService';
import '../styles/pharmacist.css';

// SVG Icons matching CarePoint Design System
const PillIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </svg>
);

const DashboardIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const PrescriptionIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const BoxArchiveIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

const ReceiptIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M16 8H8" />
    <path d="M16 12H8" />
    <path d="M11 16H8" />
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

const BarChartIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const HistoryIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SettingsIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

export default function PharmacistDashboard() {
  const navigate = useNavigate();

  // Active section/tab
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authenticated user
  const [currentUser, setCurrentUser] = useState(() => {
    return authService.getCurrentUser() || { name: 'Adarsh Chandran', role: 'Pharmacist', username: 'pharma' };
  });

  // State data
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [reorders, setReorders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [dispenseLog, setDispenseLog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toast notifications
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Modals state
  const [selectedRx, setSelectedRx] = useState(null);
  const [viewBill, setViewBill] = useState(null);
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(null);
  const [dispensingRxId, setDispensingRxId] = useState(null);

  // Form states
  const [medFormData, setMedFormData] = useState({
    name: '',
    dosage: '500mg',
    category: 'Analgesic',
    type: 'Tablet',
    quantity: '50',
    minThreshold: '20',
    unitPrice: '8',
    sellingPrice: '14',
    supplier: 'MedLife Pharma Distribution',
    batchNo: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
    expiryDate: '2027-06-30'
  });

  const [reorderFormData, setReorderFormData] = useState({
    medicineId: '',
    medicineName: '',
    requestedQty: 50,
    supplier: 'MedLife Pharma Distribution',
    estimatedCost: 400
  });

  const [stockAdjustQty, setStockAdjustQty] = useState(10);
  const [stockAdjustReason, setStockAdjustReason] = useState('Restock Shipment');

  // Search and filter states
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('All');
  const [inventoryStockStatus, setInventoryStockStatus] = useState('All');

  const [rxSearch, setRxSearch] = useState('');
  const [rxStatusFilter, setRxStatusFilter] = useState('All');

  const [billSearch, setBillSearch] = useState('');

  // Load all pharmacy data
  const loadData = async () => {
    try {
      setLoading(true);
      const [medsList, rxList, billsList, reordersList] = await Promise.all([
        pharmacistService.getMedicines(),
        pharmacistService.getPrescriptions(),
        pharmacistService.getBills(),
        pharmacistService.getReorders()
      ]);
      setMedicines(medsList);
      setPrescriptions(rxList);
      setBills(billsList);
      setReorders(reordersList);
      setSuppliers(pharmacistService.getSuppliers());
      setDispenseLog(pharmacistService.getDispenseLog());
    } catch (err) {
      console.error('Error loading pharmacy data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for live updates from Doctor or Receptionist modules
    const handleStockUpdate = async () => {
      const [medsList, billsList, reordersList] = await Promise.all([
        pharmacistService.getMedicines(),
        pharmacistService.getBills(),
        pharmacistService.getReorders()
      ]);
      setMedicines(medsList);
      setBills(billsList);
      setReorders(reordersList);
      setDispenseLog(pharmacistService.getDispenseLog());
    };

    const handleRxUpdate = async () => {
      const rxList = await pharmacistService.getPrescriptions();
      setPrescriptions(rxList);
    };

    window.addEventListener('cms_stock_updated', handleStockUpdate);
    window.addEventListener('cms_rx_updated', handleRxUpdate);
    window.addEventListener('cms_billing_updated', handleStockUpdate);

    const handleStorageChange = (e) => {
      if (!e.key || e.key.includes('rx') || e.key.includes('med') || e.key.includes('stock') || e.key.includes('bill')) {
        handleRxUpdate();
        handleStockUpdate();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleRxUpdate);
    const pollInterval = setInterval(() => {
      handleRxUpdate();
    }, 5000);

    return () => {
      window.removeEventListener('cms_stock_updated', handleStockUpdate);
      window.removeEventListener('cms_rx_updated', handleRxUpdate);
      window.removeEventListener('cms_billing_updated', handleStockUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleRxUpdate);
      clearInterval(pollInterval);
    };
  }, []);

  // Sign out handler
  const handleSignOut = () => {
    authService.logout();
    navigate('/login');
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const totalMedicines = medicines.length;
    const lowStockMedicines = medicines.filter(m => m.quantity > 0 && m.quantity <= (m.minThreshold || 20));
    const outOfStockMedicines = medicines.filter(m => m.quantity === 0);
    const pendingPrescriptions = prescriptions.filter(r => r.status === 'Pending' || r.status === 'Not Dispensed' || !r.status);
    const dispensedPrescriptions = prescriptions.filter(r => r.status === 'Dispensed');
    
    const todayBills = bills;
    const todayRevenue = bills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const activeReorders = reorders.filter(r => r.status !== 'Received');

    return {
      totalMedicines,
      lowStockCount: lowStockMedicines.length,
      outOfStockCount: outOfStockMedicines.length,
      criticalStockCount: lowStockMedicines.length + outOfStockMedicines.length,
      lowStockList: [...outOfStockMedicines, ...lowStockMedicines],
      pendingRxCount: pendingPrescriptions.length,
      pendingRxList: pendingPrescriptions,
      dispensedRxCount: dispensedPrescriptions.length,
      todayBillsCount: todayBills.length,
      todayRevenue,
      activeReordersCount: activeReorders.length
    };
  }, [medicines, prescriptions, bills, reorders]);

  // Dispense handler
  const handleDispense = async (prescriptionId) => {
    try {
      setDispensingRxId(prescriptionId);
      const res = await pharmacistService.dispensePrescription(prescriptionId, currentUser.name || 'Adarsh Chandran');
      showToast(`Prescription ${prescriptionId} successfully dispensed! Bill ${res.bill.billNumber} created.`);
      setSelectedRx(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Dispensing failed due to insufficient stock.', 'error');
    } finally {
      setDispensingRxId(null);
    }
  };

  // Save new medicine
  const handleAddMedicineSubmit = async (e) => {
    e.preventDefault();
    try {
      await pharmacistService.saveMedicine({
        ...medFormData,
        quantity: parseInt(medFormData.quantity, 10),
        minThreshold: parseInt(medFormData.minThreshold, 10),
        unitPrice: parseFloat(medFormData.unitPrice),
        sellingPrice: parseFloat(medFormData.sellingPrice),
      });
      showToast(`Medicine "${medFormData.name}" added to inventory.`);
      setShowAddMedModal(false);
      setMedFormData({
        name: '',
        dosage: '500mg',
        category: 'Analgesic',
        type: 'Tablet',
        quantity: '50',
        minThreshold: '20',
        unitPrice: '8',
        sellingPrice: '14',
        supplier: 'MedLife Pharma Distribution',
        batchNo: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: '2027-06-30'
      });
      await loadData();
    } catch (err) {
      showToast('Failed to add medicine.', 'error');
    }
  };

  // Reorder Low stock 1-click
  const handleQuickReorder = (medicine) => {
    setReorderFormData({
      medicineId: medicine.id,
      medicineName: `${medicine.name} ${medicine.dosage}`,
      requestedQty: 60,
      supplier: medicine.supplier || 'MedLife Pharma Distribution',
      estimatedCost: Math.round(60 * (medicine.unitPrice || 8))
    });
    setShowReorderModal(true);
  };

  const handleReorderSubmit = (e) => {
    e.preventDefault();
    pharmacistService.createReorder(reorderFormData);
    showToast(`Purchase order created for ${reorderFormData.requestedQty} units of ${reorderFormData.medicineName}.`);
    setShowReorderModal(false);
    loadData();
  };

  const handleMarkReceived = (orderId) => {
    pharmacistService.markOrderReceived(orderId);
    showToast(`Order ${orderId} marked as received! Medicine stock updated.`);
    loadData();
  };

  const handleAdjustStockSubmit = (e) => {
    e.preventDefault();
    if (!showAdjustStockModal) return;
    pharmacistService.updateStockQuantity(showAdjustStockModal.id, parseInt(stockAdjustQty, 10), stockAdjustReason);
    showToast(`Stock updated for ${showAdjustStockModal.name}.`);
    setShowAdjustStockModal(null);
    loadData();
  };

  // Filtered inventory
  const filteredMedicines = useMemo(() => {
    return medicines.filter(m => {
      const matchSearch = (m.name || '').toLowerCase().includes(inventorySearch.toLowerCase()) ||
        (m.id || '').toLowerCase().includes(inventorySearch.toLowerCase()) ||
        (m.category || '').toLowerCase().includes(inventorySearch.toLowerCase()) ||
        (m.batchNo || '').toLowerCase().includes(inventorySearch.toLowerCase());
      
      const matchCategory = inventoryCategory === 'All' || m.category === inventoryCategory;
      
      let matchStatus = true;
      if (inventoryStockStatus === 'In Stock') matchStatus = m.quantity > (m.minThreshold || 20);
      else if (inventoryStockStatus === 'Low Stock') matchStatus = m.quantity > 0 && m.quantity <= (m.minThreshold || 20);
      else if (inventoryStockStatus === 'Out of Stock') matchStatus = m.quantity === 0;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [medicines, inventorySearch, inventoryCategory, inventoryStockStatus]);

  // Filtered Prescriptions
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter(r => {
      const matchSearch = (r.patientName || '').toLowerCase().includes(rxSearch.toLowerCase()) ||
        (r.id || '').toLowerCase().includes(rxSearch.toLowerCase()) ||
        (r.doctorName || '').toLowerCase().includes(rxSearch.toLowerCase()) ||
        (r.diagnosis || '').toLowerCase().includes(rxSearch.toLowerCase());
      
      const matchStatus = rxStatusFilter === 'All'
        ? true
        : rxStatusFilter === 'Pending'
          ? (r.status === 'Pending' || r.status === 'Not Dispensed' || !r.status)
          : r.status === rxStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [prescriptions, rxSearch, rxStatusFilter]);

  // Filtered Bills
  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      return (b.billNumber || '').toLowerCase().includes(billSearch.toLowerCase()) ||
        (b.patientName || '').toLowerCase().includes(billSearch.toLowerCase()) ||
        (b.prescriptionId || '').toLowerCase().includes(billSearch.toLowerCase());
    });
  }, [bills, billSearch]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="pharmacist-shell">
      {/* Toast Notification */}
      {toast && (
        <div className={`pharmacist-toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          LEFT DARK NAVY SIDEBAR (Matching Doctor & Lab Modules)
      ────────────────────────────────────────────────────────── */}
      <aside className={`pharmacist-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="pharmacist-sidebar-brand">
          <div className="pharmacist-sidebar-brand-icon">
            <PillIcon size={20} color="#ffffff" />
          </div>
          <div>
            <span className="pharmacist-sidebar-brand-name">CarePoint</span>
            <span className="pharmacist-sidebar-brand-sub">Pharmacy Portal</span>
          </div>
        </div>

        <nav className="pharmacist-sidebar-nav">
          <div className="pharmacist-nav-section-label">Workspace</div>

          <button
            type="button"
            className={`pharmacist-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
          >
            <DashboardIcon size={18} />
            Dashboard
          </button>

          <button
            type="button"
            className={`pharmacist-nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('prescriptions'); setMobileMenuOpen(false); }}
          >
            <PrescriptionIcon size={18} />
            Prescriptions
            {metrics.pendingRxCount > 0 && (
              <span className="pharmacist-nav-badge">{metrics.pendingRxCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`pharmacist-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => { setActiveTab('inventory'); setMobileMenuOpen(false); }}
          >
            <BoxArchiveIcon size={18} />
            Medicine Inventory
            {metrics.criticalStockCount > 0 && (
              <span className="pharmacist-nav-badge" style={{ background: '#d97706' }}>
                {metrics.criticalStockCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`pharmacist-nav-item ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => { setActiveTab('billing'); setMobileMenuOpen(false); }}
          >
            <ReceiptIcon size={18} />
            Billing & Invoices
          </button>

          <div className="pharmacist-nav-section-label">Procurement & Orders</div>

          <button
            type="button"
            className={`pharmacist-nav-item ${activeTab === 'stock-orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('stock-orders'); setMobileMenuOpen(false); }}
          >
            <TruckIcon size={18} />
            Stock Orders
            {metrics.activeReordersCount > 0 && (
              <span className="pharmacist-nav-badge" style={{ background: '#0284c7' }}>
                {metrics.activeReordersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`pharmacist-nav-item ${activeTab === 'suppliers' ? 'active' : ''}`}
            onClick={() => { setActiveTab('suppliers'); setMobileMenuOpen(false); }}
          >
            <BuildingIcon size={18} />
            Suppliers Directory
          </button>

          <button
            type="button"
            className={`pharmacist-nav-item ${activeTab === 'dispense-log' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dispense-log'); setMobileMenuOpen(false); }}
          >
            <HistoryIcon size={18} />
            Dispense & Audit Log
          </button>

          <div className="pharmacist-nav-section-label">Analytics & Admin</div>

          <button
            type="button"
            className={`pharmacist-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
          >
            <BarChartIcon size={18} />
            Pharmacy Reports
          </button>

          <button
            type="button"
            className={`pharmacist-nav-item ${activeTab === 'returns' ? 'active' : ''}`}
            onClick={() => { setActiveTab('returns'); setMobileMenuOpen(false); }}
          >
            <span className="icon" style={{ fontSize: '1.1rem' }}>♻</span>
            Returns & Expiry
          </button>

          <button
            type="button"
            className={`pharmacist-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
          >
            <SettingsIcon size={18} />
            Pharmacy Settings
          </button>
        </nav>

        {/* Dynamic Logged-in Pharmacist Footer */}
        <div className="pharmacist-sidebar-footer">
          <div className="pharmacist-sidebar-user">
            <div className="pharmacist-sidebar-avatar">
              {(currentUser.name || 'AC')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <span className="pharmacist-sidebar-user-name">
                {currentUser.name || 'Adarsh Chandran'}
              </span>
              <span className="pharmacist-sidebar-user-role">
                {currentUser.role || 'Pharmacist'}
              </span>
            </div>
          </div>
          <button className="pharmacist-btn-signout" onClick={handleSignOut}>
            <SignOutIcon size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────────
          MAIN CONTENT AREA
      ────────────────────────────────────────────────────────── */}
      <main className="pharmacist-main-area">
        {/* Mobile Header Banner */}
        <div className="pharmacist-top-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.25rem' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>CarePoint Pharmacy</span>
          </div>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{currentUser.name}</span>
        </div>

        <div className="pharmacist-main-content">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Header Greeting */}
              <div className="pharmacist-header-flex">
                <div>
                  <div className="pharmacist-greeting-eyebrow">{todayFormatted}</div>
                  <h1 className="pharmacist-page-title">
                    Pharmacy Operations Dashboard
                  </h1>
                  <p className="pharmacist-page-subtitle">
                    Real-time prescription dispensing, stock tracking, and pharmacy billing
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => setActiveTab('prescriptions')}
                  >
                    View Prescription Queue
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddMedModal(true)}
                  >
                    + Add Medicine
                  </button>
                </div>
              </div>

              {/* 4 Primary Summary Cards */}
              <div className="pharmacist-stats-grid">
                <div className="pharmacist-stat-card">
                  <div className="pharmacist-stat-icon blue">
                    <BoxArchiveIcon size={22} />
                  </div>
                  <div>
                    <span className="pharmacist-stat-val">{metrics.totalMedicines}</span>
                    <span className="pharmacist-stat-label">Total Medicines in Stock</span>
                  </div>
                </div>

                <div className="pharmacist-stat-card">
                  <div className="pharmacist-stat-icon amber">
                    <PrescriptionIcon size={22} />
                  </div>
                  <div>
                    <span className="pharmacist-stat-val">{metrics.pendingRxCount}</span>
                    <span className="pharmacist-stat-label">Pending Prescriptions</span>
                  </div>
                </div>

                <div className="pharmacist-stat-card">
                  <div className="pharmacist-stat-icon red">
                    <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>!</span>
                  </div>
                  <div>
                    <span className="pharmacist-stat-val">{metrics.criticalStockCount}</span>
                    <span className="pharmacist-stat-label">Low / Out-of-Stock Items</span>
                  </div>
                </div>

                <div className="pharmacist-stat-card">
                  <div className="pharmacist-stat-icon green">
                    <ReceiptIcon size={22} />
                  </div>
                  <div>
                    <span className="pharmacist-stat-val">₹{metrics.todayRevenue.toLocaleString('en-IN')}</span>
                    <span className="pharmacist-stat-label">{metrics.todayBillsCount} Bills Dispensed</span>
                  </div>
                </div>
              </div>

              {/* Panel 1: Pending Doctor Prescriptions Queue */}
              <div className="pharmacist-card">
                <div className="pharmacist-card-header">
                  <h3 className="pharmacist-card-title">
                    <PrescriptionIcon size={18} color="var(--primary)" />
                    Pending Doctor Prescriptions Queue
                  </h3>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => setActiveTab('prescriptions')}
                  >
                    All Prescriptions →
                  </button>
                </div>
                <div className="pharmacist-table-wrap">
                  <table className="pharmacist-table">
                    <thead>
                      <tr>
                        <th>Rx ID</th>
                        <th>Patient Name</th>
                        <th>Prescribing Doctor</th>
                        <th>Diagnosis / Instructions</th>
                        <th>Items Count</th>
                        <th>Requested Date</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.pendingRxList.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            ✓ No pending prescriptions. All doctor orders are fulfilled!
                          </td>
                        </tr>
                      ) : (
                        metrics.pendingRxList.map(rx => (
                          <tr key={rx.id}>
                            <td><strong>{rx.id}</strong></td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{rx.patientName}</div>
                              <small style={{ color: 'var(--text-muted)' }}>
                                {rx.patientAge ? `${rx.patientAge}y` : ''} {rx.patientGender || ''}
                              </small>
                            </td>
                            <td>{rx.doctorName || 'Dr. Prateek Pradeep'}</td>
                            <td style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {rx.diagnosis || rx.notes || 'Routine prescription'}
                            </td>
                            <td>
                              <span className="ph-badge ph-badge-normal">
                                {(rx.items || []).length} Medicines
                              </span>
                            </td>
                            <td>{rx.date || 'Today'}</td>
                            <td>
                              <span className="ph-badge ph-badge-pending">
                                Pending Dispense
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => setSelectedRx(rx)}
                              >
                                Review & Dispense
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Two Column Grid for Restocking and Recent Bills */}
              <div className="pharmacist-panel-grid">
                {/* Panel 2: Medicines Requiring Restocking */}
                <div className="pharmacist-card" style={{ marginBottom: 0 }}>
                  <div className="pharmacist-card-header">
                    <h3 className="pharmacist-card-title">
                      <span style={{ color: '#dc2626' }}>⚠</span>
                      Medicines Requiring Restocking
                    </h3>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => setActiveTab('stock-orders')}
                    >
                      View POs
                    </button>
                  </div>
                  <div className="pharmacist-table-wrap">
                    <table className="pharmacist-table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Stock Level</th>
                          <th>Min Threshold</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Reorder</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.lowStockList.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                              ✓ All medicine inventories are above safe thresholds.
                            </td>
                          </tr>
                        ) : (
                          metrics.lowStockList.slice(0, 5).map(med => (
                            <tr key={med.id}>
                              <td>
                                <strong>{med.name}</strong>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.dosage} · {med.type}</div>
                              </td>
                              <td>
                                <strong style={{ color: med.quantity === 0 ? '#dc2626' : '#d97706' }}>
                                  {med.quantity}
                                </strong>
                              </td>
                              <td>{med.minThreshold || 20}</td>
                              <td>
                                <span className={`ph-badge ${med.quantity === 0 ? 'ph-badge-outofstock' : 'ph-badge-lowstock'}`}>
                                  {med.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => handleQuickReorder(med)}
                                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                >
                                  + Order Stock
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Panel 3: Recent Dispensing Activity */}
                <div className="pharmacist-card" style={{ marginBottom: 0 }}>
                  <div className="pharmacist-card-header">
                    <h3 className="pharmacist-card-title">
                      <ReceiptIcon size={18} color="var(--primary)" />
                      Recent Dispensing & Billing
                    </h3>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => setActiveTab('billing')}
                    >
                      All Bills →
                    </button>
                  </div>
                  <div className="pharmacist-table-wrap">
                    <table className="pharmacist-table">
                      <thead>
                        <tr>
                          <th>Bill #</th>
                          <th>Patient</th>
                          <th>Dispensed At</th>
                          <th>Total (₹)</th>
                          <th style={{ textAlign: 'right' }}>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bills.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                              No bills recorded yet.
                            </td>
                          </tr>
                        ) : (
                          bills.slice(0, 5).map(b => (
                            <tr key={b.id}>
                              <td><strong>{b.billNumber}</strong></td>
                              <td>{b.patientName}</td>
                              <td>{b.dispensedAt || 'Recent'}</td>
                              <td><strong>₹{b.totalAmount}</strong></td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => setViewBill(b)}
                                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                >
                                  View Receipt
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRESCRIPTIONS */}
          {activeTab === 'prescriptions' && (
            <div>
              <div className="pharmacist-header-flex">
                <div>
                  <h1 className="pharmacist-page-title">Prescription Queue</h1>
                  <p className="pharmacist-page-subtitle">
                    Review doctor prescriptions, check live inventory availability, and dispense medicines
                  </p>
                </div>
              </div>

              {/* Toolbar */}
              <div className="pharmacist-toolbar">
                <div className="pharmacist-search-box">
                  <span className="pharmacist-search-icon"><SearchIcon size={16} /></span>
                  <input
                    type="text"
                    className="pharmacist-search-input"
                    placeholder="Search by Patient Name, Rx ID, or Doctor..."
                    value={rxSearch}
                    onChange={(e) => setRxSearch(e.target.value)}
                  />
                </div>
                <select
                  className="pharmacist-select"
                  value={rxStatusFilter}
                  onChange={(e) => setRxStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending Only</option>
                  <option value="Dispensed">Dispensed Only</option>
                </select>
              </div>

              <div className="pharmacist-card">
                <div className="pharmacist-table-wrap">
                  <table className="pharmacist-table">
                    <thead>
                      <tr>
                        <th>Rx ID</th>
                        <th>Date & Time</th>
                        <th>Patient Details</th>
                        <th>Prescribing Doctor</th>
                        <th>Prescribed Medicines</th>
                        <th>Instructions</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrescriptions.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                            No prescriptions match your search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredPrescriptions.map(rx => (
                          <tr key={rx.id}>
                            <td><strong>{rx.id}</strong></td>
                            <td style={{ whiteSpace: 'nowrap' }}>{rx.date || 'Today'}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{rx.patientName}</div>
                              <small style={{ color: 'var(--text-muted)' }}>
                                {rx.patientAge ? `${rx.patientAge}y` : ''} {rx.patientGender || ''} · {rx.patientPhone || ''}
                              </small>
                            </td>
                            <td>
                              <div>{rx.doctorName || 'Staff Physician'}</div>
                              <small style={{ color: 'var(--text-muted)' }}>{rx.doctorDept || 'General Medicine'}</small>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                {(rx.items || []).map((it, idx) => (
                                  <span key={idx} style={{ fontSize: '0.8rem' }}>
                                    • {it.medicineName || it.name} ({it.dosage || ''}) × {it.quantity}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ maxWidth: '200px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {rx.notes || rx.diagnosis || '—'}
                            </td>
                            <td>
                              <span className={`ph-badge ${rx.status === 'Dispensed' ? 'ph-badge-completed' : 'ph-badge-pending'}`}>
                                {rx.status === 'Dispensed' ? '✓ Dispensed' : 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {rx.status === 'Dispensed' ? (
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => {
                                    const matchBill = bills.find(b => b.prescriptionId === rx.id);
                                    if (matchBill) setViewBill(matchBill);
                                    else showToast('Prescription dispensed. Bill record available in billing.', 'info');
                                  }}
                                >
                                  View Bill
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => setSelectedRx(rx)}
                                >
                                  Dispense
                                </button>
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

          {/* TAB 3: MEDICINE INVENTORY */}
          {activeTab === 'inventory' && (
            <div>
              <div className="pharmacist-header-flex">
                <div>
                  <h1 className="pharmacist-page-title">Medicine Inventory</h1>
                  <p className="pharmacist-page-subtitle">
                    Central catalog of pharmaceuticals, stock balance, price lists, and batch expiry tracking
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddMedModal(true)}
                >
                  + Add New Medicine
                </button>
              </div>

              {/* Toolbar */}
              <div className="pharmacist-toolbar">
                <div className="pharmacist-search-box">
                  <span className="pharmacist-search-icon"><SearchIcon size={16} /></span>
                  <input
                    type="text"
                    className="pharmacist-search-input"
                    placeholder="Search by Medicine Name, ID, Category, or Batch..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                  />
                </div>
                <select
                  className="pharmacist-select"
                  value={inventoryCategory}
                  onChange={(e) => setInventoryCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  <option value="Antibiotic">Antibiotics</option>
                  <option value="Analgesic">Analgesics & Antipyretics</option>
                  <option value="Antacid">Antacids & GI</option>
                  <option value="Antihistamine">Antihistamines</option>
                  <option value="Antidiabetic">Antidiabetics</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Respiratory">Respiratory</option>
                  <option value="Cough & Cold">Cough & Cold</option>
                  <option value="Ophthalmic">Ophthalmic</option>
                </select>
                <select
                  className="pharmacist-select"
                  value={inventoryStockStatus}
                  onChange={(e) => setInventoryStockStatus(e.target.value)}
                >
                  <option value="All">All Stock Levels</option>
                  <option value="In Stock">In Stock (&gt; Safe Threshold)</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock (0)</option>
                </select>
              </div>

              <div className="pharmacist-card">
                <div className="pharmacist-table-wrap">
                  <table className="pharmacist-table">
                    <thead>
                      <tr>
                        <th>Medicine ID</th>
                        <th>Medicine Name</th>
                        <th>Dosage & Form</th>
                        <th>Category</th>
                        <th>Batch & Expiry</th>
                        <th>Stock Available</th>
                        <th>Unit Cost (₹)</th>
                        <th>Selling Price (₹)</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMedicines.length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                            No medicines match your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredMedicines.map(med => (
                          <tr key={med.id}>
                            <td><strong>{med.id}</strong></td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{med.name}</div>
                              <small style={{ color: 'var(--text-muted)' }}>{med.supplier || 'CarePoint Supply'}</small>
                            </td>
                            <td>{med.dosage} · {med.type}</td>
                            <td><span className="ph-badge ph-badge-normal">{med.category}</span></td>
                            <td>
                              <div>{med.batchNo || 'BATCH-2025'}</div>
                              <small style={{ color: 'var(--text-muted)' }}>Exp: {med.expiryDate || '2026-12'}</small>
                            </td>
                            <td>
                              <strong style={{
                                color: med.quantity === 0 ? '#dc2626' : (med.quantity <= (med.minThreshold || 20) ? '#d97706' : '#166534')
                              }}>
                                {med.quantity}
                              </strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                                (Min: {med.minThreshold || 20})
                              </span>
                            </td>
                            <td>₹{med.unitPrice}</td>
                            <td><strong>₹{med.sellingPrice}</strong></td>
                            <td>
                              <span className={`ph-badge ${
                                med.quantity === 0
                                  ? 'ph-badge-outofstock'
                                  : (med.quantity <= (med.minThreshold || 20) ? 'ph-badge-lowstock' : 'ph-badge-completed')
                              }`}>
                                {med.quantity === 0 ? 'Out of Stock' : (med.quantity <= (med.minThreshold || 20) ? 'Low Stock' : 'In Stock')}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => {
                                    setShowAdjustStockModal(med);
                                    setStockAdjustQty(10);
                                  }}
                                  title="Adjust or Restock Quantity"
                                >
                                  Stock ±
                                </button>
                                {med.quantity <= (med.minThreshold || 20) && (
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleQuickReorder(med)}
                                    title="Create Purchase Order"
                                  >
                                    Reorder
                                  </button>
                                )}
                              </div>
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

          {/* TAB 4: BILLING & INVOICES */}
          {activeTab === 'billing' && (
            <div>
              <div className="pharmacist-header-flex">
                <div>
                  <h1 className="pharmacist-page-title">Pharmacy Billing & Invoices</h1>
                  <p className="pharmacist-page-subtitle">
                    Dispensed medication invoices, itemized tax calculation (5% GST), and billing records
                  </p>
                </div>
              </div>

              {/* Toolbar */}
              <div className="pharmacist-toolbar">
                <div className="pharmacist-search-box">
                  <span className="pharmacist-search-icon"><SearchIcon size={16} /></span>
                  <input
                    type="text"
                    className="pharmacist-search-input"
                    placeholder="Search by Bill #, Patient Name, or Rx ID..."
                    value={billSearch}
                    onChange={(e) => setBillSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="pharmacist-card">
                <div className="pharmacist-table-wrap">
                  <table className="pharmacist-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Dispense Date & Time</th>
                        <th>Patient Name</th>
                        <th>Prescription Ref</th>
                        <th>Dispensed By</th>
                        <th>Subtotal</th>
                        <th>GST (5%)</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                            No pharmacy invoices found.
                          </td>
                        </tr>
                      ) : (
                        filteredBills.map(b => (
                          <tr key={b.id}>
                            <td><strong>{b.billNumber}</strong></td>
                            <td style={{ whiteSpace: 'nowrap' }}>{b.dispensedAt || 'Recent'}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{b.patientName}</div>
                              <small style={{ color: 'var(--text-muted)' }}>{b.patientId || ''}</small>
                            </td>
                            <td>{b.prescriptionId || 'OTC'}</td>
                            <td>{b.dispensedBy || 'Adarsh Chandran'}</td>
                            <td>₹{b.subtotal}</td>
                            <td>₹{b.gstAmount}</td>
                            <td><strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>₹{b.totalAmount}</strong></td>
                            <td>
                              <span className="ph-badge ph-badge-completed">
                                {b.paymentStatus || 'Billed'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => setViewBill(b)}
                              >
                                View / Print Receipt
                              </button>
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

          {/* TAB 5: STOCK ORDERS */}
          {activeTab === 'stock-orders' && (
            <div>
              <div className="pharmacist-header-flex">
                <div>
                  <h1 className="pharmacist-page-title">Stock Orders & Procurement</h1>
                  <p className="pharmacist-page-subtitle">
                    Manage replenishment purchase orders to distributors and auto-increment inventory upon receipt
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const firstMed = medicines[0];
                    setReorderFormData({
                      medicineId: firstMed ? firstMed.id : 'MED-001',
                      medicineName: firstMed ? `${firstMed.name} ${firstMed.dosage}` : 'Paracetamol 500mg',
                      requestedQty: 50,
                      supplier: 'MedLife Pharma Distribution',
                      estimatedCost: 350
                    });
                    setShowReorderModal(true);
                  }}
                >
                  + New Reorder Request
                </button>
              </div>

              <div className="pharmacist-card">
                <div className="pharmacist-table-wrap">
                  <table className="pharmacist-table">
                    <thead>
                      <tr>
                        <th>Order PO #</th>
                        <th>Medicine</th>
                        <th>Quantity</th>
                        <th>Supplier / Distributor</th>
                        <th>Order Date</th>
                        <th>Expected Delivery</th>
                        <th>Est. Cost</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reorders.map(order => (
                        <tr key={order.id}>
                          <td><strong>{order.id}</strong></td>
                          <td><strong>{order.medicineName}</strong></td>
                          <td>{order.requestedQty} Units</td>
                          <td>{order.supplier}</td>
                          <td>{order.orderDate}</td>
                          <td>{order.expectedDelivery || '2-3 Days'}</td>
                          <td>₹{order.estimatedCost}</td>
                          <td>
                            <span className={`ph-badge ${
                              order.status === 'Received'
                                ? 'ph-badge-completed'
                                : (order.status === 'Shipped' ? 'ph-badge-normal' : 'ph-badge-pending')
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {order.status !== 'Received' ? (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleMarkReceived(order.id)}
                              >
                                Mark Received (Restock)
                              </button>
                            ) : (
                              <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>
                                ✓ Restocked into Inventory
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SUPPLIERS */}
          {activeTab === 'suppliers' && (
            <div>
              <div className="pharmacist-header-flex">
                <div>
                  <h1 className="pharmacist-page-title">Authorized Medical Suppliers</h1>
                  <p className="pharmacist-page-subtitle">
                    Registered pharmaceutical distributors, wholesale agencies, and active supply contracts
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {suppliers.map(sup => (
                  <div key={sup.id} className="pharmacist-card" style={{ marginBottom: 0 }}>
                    <div className="pharmacist-card-header">
                      <h3 className="pharmacist-card-title">
                        <BuildingIcon size={18} color="var(--primary)" />
                        {sup.name}
                      </h3>
                      <span className="ph-badge ph-badge-completed">{sup.rating}</span>
                    </div>
                    <div className="pharmacist-card-body" style={{ fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div><strong>Contact Person:</strong> {sup.contactPerson}</div>
                      <div><strong>Phone:</strong> {sup.phone}</div>
                      <div><strong>Email:</strong> {sup.email}</div>
                      <div><strong>Location:</strong> {sup.city}</div>
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{sup.activeContracts} Active Contracts</span>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => showToast(`Contacting ${sup.name} at ${sup.phone}...`, 'info')}
                        >
                          Contact Supplier
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: DISPENSE & AUDIT LOG */}
          {activeTab === 'dispense-log' && (
            <div>
              <div className="pharmacist-header-flex">
                <div>
                  <h1 className="pharmacist-page-title">Dispensing & Audit Log</h1>
                  <p className="pharmacist-page-subtitle">
                    Immutable event audit trail for dispensing operations, stock adjustments, and replenishment
                  </p>
                </div>
              </div>

              <div className="pharmacist-card">
                <div className="pharmacist-table-wrap">
                  <table className="pharmacist-table">
                    <thead>
                      <tr>
                        <th>Log ID</th>
                        <th>Event Type</th>
                        <th>Reference</th>
                        <th>Details</th>
                        <th>Authorized By</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispenseLog.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                            No audit log events recorded yet in this session.
                          </td>
                        </tr>
                      ) : (
                        dispenseLog.map(log => (
                          <tr key={log.id}>
                            <td><code>{log.id}</code></td>
                            <td>
                              <span className={`ph-badge ${
                                log.type === 'PRESCRIPTION_DISPENSED'
                                  ? 'ph-badge-completed'
                                  : (log.type === 'STOCK_RESTOCKED' ? 'ph-badge-normal' : 'ph-badge-lowstock')
                              }`}>
                                {log.type}
                              </span>
                            </td>
                            <td><strong>{log.prescriptionId || log.medicineId || '—'}</strong></td>
                            <td>
                              {log.patientName && `Patient: ${log.patientName} (Bill: ${log.billNumber}, Total: ₹${log.totalAmount})`}
                              {log.medicineName && `${log.reason || 'Stock Update'}: ${log.qty} units for ${log.medicineName}`}
                            </td>
                            <td>{log.dispensedBy || currentUser.name}</td>
                            <td>{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: PHARMACY REPORTS */}
          {activeTab === 'reports' && (
            <div>
              <div className="pharmacist-header-flex">
                <div>
                  <h1 className="pharmacist-page-title">Pharmacy Analytics & Reports</h1>
                  <p className="pharmacist-page-subtitle">
                    Dispensing turnover, inventory valuation, stock distribution, and medication consumption
                  </p>
                </div>
              </div>

              <div className="pharmacist-stats-grid">
                <div className="pharmacist-stat-card">
                  <div className="pharmacist-stat-icon green">
                    <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>₹</span>
                  </div>
                  <div>
                    <span className="pharmacist-stat-val">
                      ₹{medicines.reduce((acc, m) => acc + (m.quantity * m.sellingPrice), 0).toLocaleString('en-IN')}
                    </span>
                    <span className="pharmacist-stat-label">Total Inventory Valuation</span>
                  </div>
                </div>

                <div className="pharmacist-stat-card">
                  <div className="pharmacist-stat-icon blue">
                    <ReceiptIcon size={22} />
                  </div>
                  <div>
                    <span className="pharmacist-stat-val">
                      {prescriptions.length > 0
                        ? `${Math.round((metrics.dispensedRxCount / prescriptions.length) * 100)}%`
                        : '100%'}
                    </span>
                    <span className="pharmacist-stat-label">Prescription Fulfillment Rate</span>
                  </div>
                </div>

                <div className="pharmacist-stat-card">
                  <div className="pharmacist-stat-icon purple">
                    <BoxArchiveIcon size={22} />
                  </div>
                  <div>
                    <span className="pharmacist-stat-val">
                      {medicines.reduce((acc, m) => acc + m.quantity, 0)}
                    </span>
                    <span className="pharmacist-stat-label">Total Units in Storage</span>
                  </div>
                </div>

                <div className="pharmacist-stat-card">
                  <div className="pharmacist-stat-icon amber">
                    <TruckIcon size={22} />
                  </div>
                  <div>
                    <span className="pharmacist-stat-val">{suppliers.length}</span>
                    <span className="pharmacist-stat-label">Active Supply Partners</span>
                  </div>
                </div>
              </div>

              <div className="pharmacist-panel-grid">
                {/* Category Inventory Breakdown */}
                <div className="pharmacist-card">
                  <div className="pharmacist-card-header">
                    <h3 className="pharmacist-card-title">Inventory Stock by Category</h3>
                  </div>
                  <div className="pharmacist-card-body">
                    {['Antibiotic', 'Analgesic', 'Antacid', 'Antihistamine', 'Antidiabetic', 'Respiratory'].map(cat => {
                      const count = medicines.filter(m => m.category === cat).reduce((acc, m) => acc + m.quantity, 0);
                      const pct = Math.min(100, Math.round((count / 200) * 100));
                      return (
                        <div key={cat} style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '0.3rem' }}>
                            <strong>{cat}</strong>
                            <span>{count} units ({pct}%)</span>
                          </div>
                          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* High Dispensing Turnover */}
                <div className="pharmacist-card">
                  <div className="pharmacist-card-header">
                    <h3 className="pharmacist-card-title">High Demand / Fast Moving Medicines</h3>
                  </div>
                  <div className="pharmacist-card-body">
                    {medicines.slice(0, 5).map((med, idx) => (
                      <div key={med.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: idx < 4 ? '1px solid var(--border)' : 'none' }}>
                        <div>
                          <strong>{med.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.dosage} · MRP: ₹{med.sellingPrice}</div>
                        </div>
                        <span className="ph-badge ph-badge-normal">
                          {med.quantity} in stock
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: RETURNS & EXPIRED */}
          {activeTab === 'returns' && (
            <div>
              <div className="pharmacist-header-flex">
                <div>
                  <h1 className="pharmacist-page-title">Returns & Expiry Tracking</h1>
                  <p className="pharmacist-page-subtitle">
                    Monitoring batches near expiry and vendor return-for-credit processing
                  </p>
                </div>
              </div>

              <div className="pharmacist-card">
                <div className="pharmacist-table-wrap">
                  <table className="pharmacist-table">
                    <thead>
                      <tr>
                        <th>Batch #</th>
                        <th>Medicine</th>
                        <th>Quantity</th>
                        <th>Expiry Date</th>
                        <th>Days Remaining</th>
                        <th>Vendor / Supplier</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>ATV-2024-60</strong></td>
                        <td>Atorvastatin 10mg</td>
                        <td>0 Units (Stockout)</td>
                        <td>2026-07-22</td>
                        <td><span className="ph-badge ph-badge-lowstock">Near Expiry</span></td>
                        <td>Sun Health Corporation</td>
                        <td>
                          <button className="btn btn-sm btn-outline" onClick={() => showToast('Batch quarantined for vendor credit return.', 'info')}>
                            Process Return
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>AMX-2024-88</strong></td>
                        <td>Amoxicillin 500mg</td>
                        <td>45 Units</td>
                        <td>2026-08-15</td>
                        <td><span className="ph-badge ph-badge-normal">Valid &gt; 90 Days</span></td>
                        <td>Sun Health Corporation</td>
                        <td>
                          <button className="btn btn-sm btn-outline" onClick={() => showToast('Batch audit confirmed safe for dispensing.', 'info')}>
                            Audit Batch
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: PHARMACY SETTINGS */}
          {activeTab === 'settings' && (
            <div>
              <div className="pharmacist-header-flex">
                <div>
                  <h1 className="pharmacist-page-title">Pharmacy Settings & Configuration</h1>
                  <p className="pharmacist-page-subtitle">
                    Dispensing rules, license details, and billing parameters
                  </p>
                </div>
              </div>

              <div className="pharmacist-card" style={{ maxWidth: '680px' }}>
                <div className="pharmacist-card-header">
                  <h3 className="pharmacist-card-title">Pharmacy Operations Profile</h3>
                </div>
                <div className="pharmacist-card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label className="form-label">Pharmacy Name</label>
                      <input type="text" className="form-control" defaultValue="CarePoint Central Pharmacy" readOnly />
                    </div>
                    <div>
                      <label className="form-label">Drug License Number</label>
                      <input type="text" className="form-control" defaultValue="KL-EKM-2024-PH-8841" readOnly />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label className="form-label">GST Tax Rate on Medications</label>
                      <input type="text" className="form-control" defaultValue="5.0% (Healthcare Standard)" readOnly />
                    </div>
                    <div>
                      <label className="form-label">Default Reorder Threshold</label>
                      <input type="text" className="form-control" defaultValue="20 Units" readOnly />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Head Pharmacist On Duty</label>
                    <input type="text" className="form-control" defaultValue={`${currentUser.name} (Registration #PH-99420)`} readOnly />
                  </div>

                  <button className="btn btn-primary" onClick={() => showToast('Pharmacy settings updated successfully.')}>
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ──────────────────────────────────────────────────────────
          MODAL 1: REVIEW & DISPENSE PRESCRIPTION
      ────────────────────────────────────────────────────────── */}
      {selectedRx && (
        <div className="pharmacist-modal-overlay" onClick={() => setSelectedRx(null)}>
          <div className="pharmacist-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pharmacist-modal-header">
              <h3>Dispense Prescription — {selectedRx.id}</h3>
              <button
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setSelectedRx(null)}
              >
                ×
              </button>
            </div>
            <div className="pharmacist-modal-body">
              {/* Patient & Doctor metadata */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.86rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>PATIENT</div>
                  <strong>{selectedRx.patientName}</strong> ({selectedRx.patientAge || '—'}y, {selectedRx.patientGender || '—'})
                  <div style={{ color: 'var(--text-muted)' }}>{selectedRx.patientPhone || ''}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>PRESCRIBING PHYSICIAN</div>
                  <strong>{selectedRx.doctorName || 'Dr. Prateek Pradeep'}</strong>
                  <div style={{ color: 'var(--text-muted)' }}>{selectedRx.doctorDept || 'General Medicine'}</div>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong>Diagnosis / Notes:</strong>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                  {selectedRx.diagnosis || selectedRx.notes || 'Routine prescription'}
                </p>
              </div>

              {/* Items Table with Live Stock Check */}
              <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.95rem' }}>Prescribed Items & Inventory Stock Check:</h4>
              <table className="pharmacist-table" style={{ border: '1px solid var(--border)', borderRadius: '6px' }}>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Dosage & Frequency</th>
                    <th>Duration</th>
                    <th>Req. Qty</th>
                    <th>Live Stock</th>
                    <th>Unit MRP</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedRx.items || []).map((item, i) => {
                    const matchMed = medicines.find(m =>
                      m.id === item.medicineId ||
                      (item.medicineName && m.name.toLowerCase().trim() === item.medicineName.toLowerCase().trim())
                    );
                    const stockAvail = matchMed ? matchMed.quantity : 0;
                    const reqQty = item.quantity || 1;
                    const hasStock = stockAvail >= reqQty;

                    return (
                      <tr key={i}>
                        <td><strong>{item.medicineName || item.name}</strong></td>
                        <td>{item.dosage || ''} · {item.frequency || 'Daily'}</td>
                        <td>{item.duration || '—'}</td>
                        <td><strong>{reqQty}</strong></td>
                        <td>
                          <span style={{ fontWeight: 700, color: hasStock ? '#166534' : '#dc2626' }}>
                            {stockAvail} units
                          </span>
                        </td>
                        <td>₹{matchMed ? matchMed.sellingPrice : (item.unitPrice || 10)}</td>
                        <td>
                          <span className={`ph-badge ${hasStock ? 'ph-badge-completed' : 'ph-badge-outofstock'}`}>
                            {hasStock ? '✓ In Stock' : '✗ Insufficient'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pharmacist-modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedRx(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={dispensingRxId === selectedRx.id}
                onClick={() => handleDispense(selectedRx.id)}
              >
                {dispensingRxId === selectedRx.id ? 'Dispensing & Billing...' : 'Confirm Dispensing & Bill'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL 2: VIEW / PRINT RECEIPT
      ────────────────────────────────────────────────────────── */}
      {viewBill && (
        <div className="pharmacist-modal-overlay" onClick={() => setViewBill(null)}>
          <div className="pharmacist-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pharmacist-modal-header">
              <h3>Pharmacy Tax Invoice — {viewBill.billNumber}</h3>
              <button
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setViewBill(null)}
              >
                ×
              </button>
            </div>
            <div className="pharmacist-modal-body" id="printable-receipt">
              <div style={{ textAlign: 'center', marginBottom: '1.25rem', borderBottom: '1px dashed var(--border)', paddingBottom: '1rem' }}>
                <h2 style={{ margin: '0 0 0.25rem', color: 'var(--primary)', fontSize: '1.4rem' }}>CarePoint Clinic & Pharmacy</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Central Health Plaza, MG Road, Ernakulam · Ph: +91 484 2345678
                </p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Drug License: KL-EKM-2024-PH-8841 · GSTIN: 32AABCU9603R1ZM
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <div><strong>Invoice No:</strong> {viewBill.billNumber}</div>
                <div><strong>Date & Time:</strong> {viewBill.dispensedAt || 'Recent'}</div>
                <div><strong>Patient Name:</strong> {viewBill.patientName}</div>
                <div><strong>Prescription Ref:</strong> {viewBill.prescriptionId || 'Direct'}</div>
                <div><strong>Doctor:</strong> {viewBill.doctorName || 'Staff Doctor'}</div>
                <div><strong>Dispensed By:</strong> {viewBill.dispensedBy || 'Adarsh Chandran'}</div>
              </div>

              <table className="pharmacist-table" style={{ border: '1px solid var(--border)', marginBottom: '1rem' }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit MRP</th>
                    <th style={{ textAlign: 'right' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewBill.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.medicineName || it.name}</td>
                      <td>{it.quantity}</td>
                      <td>₹{it.unitPrice}</td>
                      <td style={{ textAlign: 'right' }}>₹{(it.quantity * it.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: 'right', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div>Subtotal: <strong>₹{viewBill.subtotal ? viewBill.subtotal.toFixed(2) : viewBill.totalAmount}</strong></div>
                <div>Healthcare GST (5%): <strong>₹{viewBill.gstAmount ? viewBill.gstAmount.toFixed(2) : '0.00'}</strong></div>
                <div style={{ fontSize: '1.15rem', color: 'var(--primary)', marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px solid var(--border)' }}>
                  Grand Total: <strong>₹{viewBill.totalAmount}</strong>
                </div>
              </div>
            </div>

            <div className="pharmacist-modal-footer">
              <button className="btn btn-outline" onClick={() => setViewBill(null)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  window.print();
                }}
              >
                🖨 Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL 3: ADD NEW MEDICINE
      ────────────────────────────────────────────────────────── */}
      {showAddMedModal && (
        <div className="pharmacist-modal-overlay" onClick={() => setShowAddMedModal(false)}>
          <div className="pharmacist-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pharmacist-modal-header">
              <h3>Add New Medicine to Pharmacy Inventory</h3>
              <button
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowAddMedModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddMedicineSubmit}>
              <div className="pharmacist-modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Medicine Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Paracetamol, Azithromycin"
                    value={medFormData.name}
                    onChange={(e) => setMedFormData({ ...medFormData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Dosage *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 500mg, 10ml, 100mcg"
                      value={medFormData.dosage}
                      onChange={(e) => setMedFormData({ ...medFormData, dosage: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Form / Type *</label>
                    <select
                      className="form-control"
                      value={medFormData.type}
                      onChange={(e) => setMedFormData({ ...medFormData, type: e.target.value })}
                    >
                      <option>Tablet</option>
                      <option>Capsule</option>
                      <option>Syrup</option>
                      <option>Inhaler</option>
                      <option>Injection</option>
                      <option>Drops</option>
                      <option>Ointment</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Category *</label>
                    <select
                      className="form-control"
                      value={medFormData.category}
                      onChange={(e) => setMedFormData({ ...medFormData, category: e.target.value })}
                    >
                      <option>Analgesic</option>
                      <option>Antibiotic</option>
                      <option>Antacid</option>
                      <option>Antihistamine</option>
                      <option>Antidiabetic</option>
                      <option>Cardiovascular</option>
                      <option>Respiratory</option>
                      <option>Cough & Cold</option>
                      <option>Ophthalmic</option>
                      <option>General</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Supplier / Distributor</label>
                    <select
                      className="form-control"
                      value={medFormData.supplier}
                      onChange={(e) => setMedFormData({ ...medFormData, supplier: e.target.value })}
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Initial Stock *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={medFormData.quantity}
                      onChange={(e) => setMedFormData({ ...medFormData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Min Threshold *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={medFormData.minThreshold}
                      onChange={(e) => setMedFormData({ ...medFormData, minThreshold: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Cost (₹) *</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-control"
                      value={medFormData.unitPrice}
                      onChange={(e) => setMedFormData({ ...medFormData, unitPrice: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Selling MRP (₹) *</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-control"
                      value={medFormData.sellingPrice}
                      onChange={(e) => setMedFormData({ ...medFormData, sellingPrice: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Batch Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={medFormData.batchNo}
                      onChange={(e) => setMedFormData({ ...medFormData, batchNo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Expiry Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={medFormData.expiryDate}
                      onChange={(e) => setMedFormData({ ...medFormData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="pharmacist-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddMedModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL 4: CREATE REORDER REQUEST
      ────────────────────────────────────────────────────────── */}
      {showReorderModal && (
        <div className="pharmacist-modal-overlay" onClick={() => setShowReorderModal(false)}>
          <div className="pharmacist-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pharmacist-modal-header">
              <h3>Create Restock Purchase Order</h3>
              <button
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowReorderModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleReorderSubmit}>
              <div className="pharmacist-modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Medicine</label>
                  <input
                    type="text"
                    className="form-control"
                    value={reorderFormData.medicineName}
                    readOnly
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Order Quantity (Units) *</label>
                    <input
                      type="number"
                      min="10"
                      className="form-control"
                      value={reorderFormData.requestedQty}
                      onChange={(e) => setReorderFormData({ ...reorderFormData, requestedQty: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Supplier</label>
                    <select
                      className="form-control"
                      value={reorderFormData.supplier}
                      onChange={(e) => setReorderFormData({ ...reorderFormData, supplier: e.target.value })}
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Estimated Wholesale Total Cost (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={reorderFormData.estimatedCost}
                    onChange={(e) => setReorderFormData({ ...reorderFormData, estimatedCost: e.target.value })}
                  />
                </div>
              </div>
              <div className="pharmacist-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowReorderModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Dispatch Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL 5: ADJUST INVENTORY STOCK
      ────────────────────────────────────────────────────────── */}
      {showAdjustStockModal && (
        <div className="pharmacist-modal-overlay" onClick={() => setShowAdjustStockModal(null)}>
          <div className="pharmacist-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pharmacist-modal-header">
              <h3>Adjust Stock — {showAdjustStockModal.name}</h3>
              <button
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowAdjustStockModal(null)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAdjustStockSubmit}>
              <div className="pharmacist-modal-body">
                <p style={{ margin: '0 0 1rem', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  Current inventory balance: <strong>{showAdjustStockModal.quantity} units</strong>
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Units to Add or Remove *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 50 or -10"
                      value={stockAdjustQty}
                      onChange={(e) => setStockAdjustQty(e.target.value)}
                      required
                    />
                    <small style={{ color: 'var(--text-muted)' }}>Enter positive to restock, negative to deduct</small>
                  </div>
                  <div>
                    <label className="form-label">Reason *</label>
                    <select
                      className="form-control"
                      value={stockAdjustReason}
                      onChange={(e) => setStockAdjustReason(e.target.value)}
                    >
                      <option>Restock Shipment</option>
                      <option>Physical Count Audit</option>
                      <option>Damaged or Broken</option>
                      <option>Expired Disposal</option>
                      <option>Emergency Requisition</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="pharmacist-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAdjustStockModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
