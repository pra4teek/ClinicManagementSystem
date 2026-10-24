import api from './api.js';

// Storage keys shared across modules
export const PHARMACY_STORAGE_KEYS = {
  MEDICINES: 'cms_medicines',
  PRESCRIPTIONS: 'cms_prescriptions',
  BILLS: 'cms_bills',
  RECEPTIONIST_BILLS: 'pending_receptionist_bills',
  REORDERS: 'cms_reorder_requests',
  DISPENSE_LOG: 'cms_dispense_log',
  SUPPLIERS: 'cms_suppliers',
};

// Standard initial master medicines if localStorage is empty
const INITIAL_MEDICINES = [
  { id: 'MED-001', name: 'Paracetamol', dosage: '500mg', type: 'Tablet', category: 'Analgesic', quantity: 120, minThreshold: 30, unitPrice: 3.5, sellingPrice: 5.0, batchNo: 'PCM-2025-01', expiryDate: '2026-12-31', supplier: 'MedLife Pharma' },
  { id: 'MED-002', name: 'Amoxicillin', dosage: '500mg', type: 'Capsule', category: 'Antibiotic', quantity: 45, minThreshold: 25, unitPrice: 12.0, sellingPrice: 18.0, batchNo: 'AMX-2024-88', expiryDate: '2026-08-15', supplier: 'Sun Health Corp' },
  { id: 'MED-003', name: 'Cetirizine', dosage: '10mg', type: 'Tablet', category: 'Antihistamine', quantity: 85, minThreshold: 20, unitPrice: 4.0, sellingPrice: 7.5, batchNo: 'CTZ-2025-11', expiryDate: '2027-03-30', supplier: 'Cipla Distributors' },
  { id: 'MED-004', name: 'Metformin', dosage: '500mg', type: 'Tablet', category: 'Antidiabetic', quantity: 8, minThreshold: 20, unitPrice: 6.0, sellingPrice: 10.0, batchNo: 'MET-2024-09', expiryDate: '2026-11-20', supplier: 'Apollo Wholesale' },
  { id: 'MED-005', name: 'Omeprazole', dosage: '20mg', type: 'Capsule', category: 'Antacid', quantity: 60, minThreshold: 25, unitPrice: 7.5, sellingPrice: 12.0, batchNo: 'OMP-2025-04', expiryDate: '2027-01-15', supplier: 'MedLife Pharma' },
  { id: 'MED-006', name: 'Azithromycin', dosage: '500mg', type: 'Tablet', category: 'Antibiotic', quantity: 4, minThreshold: 15, unitPrice: 22.0, sellingPrice: 35.0, batchNo: 'AZI-2024-32', expiryDate: '2026-09-10', supplier: 'Sun Health Corp' },
  { id: 'MED-007', name: 'Ibuprofen', dosage: '400mg', type: 'Tablet', category: 'NSAID', quantity: 95, minThreshold: 30, unitPrice: 5.0, sellingPrice: 8.0, batchNo: 'IBU-2025-22', expiryDate: '2027-05-18', supplier: 'Cipla Distributors' },
  { id: 'MED-008', name: 'Pantoprazole', dosage: '40mg', type: 'Tablet', category: 'Antacid', quantity: 70, minThreshold: 20, unitPrice: 9.0, sellingPrice: 15.0, batchNo: 'PAN-2025-17', expiryDate: '2026-10-30', supplier: 'Apollo Wholesale' },
  { id: 'MED-009', name: 'Salbutamol Inhaler', dosage: '100mcg', type: 'Inhaler', category: 'Respiratory', quantity: 18, minThreshold: 10, unitPrice: 95.0, sellingPrice: 140.0, batchNo: 'SAL-2025-02', expiryDate: '2027-04-12', supplier: 'Glaxo Respiratory' },
  { id: 'MED-010', name: 'Atorvastatin', dosage: '10mg', type: 'Tablet', category: 'Cardiovascular', quantity: 0, minThreshold: 15, unitPrice: 11.0, sellingPrice: 18.0, batchNo: 'ATV-2024-60', expiryDate: '2026-07-22', supplier: 'Sun Health Corp' },
  { id: 'MED-011', name: 'Cough Syrup (Ascoril)', dosage: '100ml', type: 'Syrup', category: 'Cough & Cold', quantity: 22, minThreshold: 12, unitPrice: 65.0, sellingPrice: 98.0, batchNo: 'ASC-2025-05', expiryDate: '2026-12-10', supplier: 'MedLife Pharma' },
  { id: 'MED-012', name: 'Ciprofloxacin Eye Drops', dosage: '5ml', type: 'Drops', category: 'Ophthalmic', quantity: 14, minThreshold: 10, unitPrice: 38.0, sellingPrice: 55.0, batchNo: 'CIP-2025-09', expiryDate: '2026-08-30', supplier: 'Cipla Distributors' },
];

const INITIAL_SUPPLIERS = [
  { id: 'SUP-01', name: 'MedLife Pharma Distribution', contactPerson: 'Rajesh Sharma', phone: '+91 98450 12345', email: 'orders@medlifepharma.in', city: 'Ernakulam, Kerala', rating: '4.9 ★', activeContracts: 6 },
  { id: 'SUP-02', name: 'Sun Health Corporation', contactPerson: 'Priya Nambiar', phone: '+91 94471 67890', email: 'supply@sunhealthcorp.com', city: 'Kochi, Kerala', rating: '4.8 ★', activeContracts: 4 },
  { id: 'SUP-03', name: 'Cipla Regional Agency', contactPerson: 'Anand Menon', phone: '+91 98952 34567', email: 'kerala.agency@cipla.com', city: 'Thiruvananthapuram, Kerala', rating: '4.7 ★', activeContracts: 8 },
  { id: 'SUP-04', name: 'Apollo Wholesale Logistics', contactPerson: 'Sunil Kumar', phone: '+91 97443 89012', email: 'wholesale@apollologistics.in', city: 'Thrissur, Kerala', rating: '4.6 ★', activeContracts: 5 },
  { id: 'SUP-05', name: 'Glaxo Respiratory Care', contactPerson: 'Deepa Varghese', phone: '+91 98460 45678', email: 'orders@glaxorespiratory.com', city: 'Kottayam, Kerala', rating: '4.9 ★', activeContracts: 3 }
];

const INITIAL_REORDERS = [
  { id: 'PO-2025-001', medicineId: 'MED-004', medicineName: 'Metformin 500mg', requestedQty: 100, supplier: 'Apollo Wholesale Logistics', orderDate: '2026-10-22', status: 'Pending Approval', expectedDelivery: '2026-10-26', estimatedCost: 600 },
  { id: 'PO-2025-002', medicineId: 'MED-010', medicineName: 'Atorvastatin 10mg', requestedQty: 80, supplier: 'Sun Health Corporation', orderDate: '2026-10-23', status: 'Shipped', expectedDelivery: '2026-10-25', estimatedCost: 880 },
  { id: 'PO-2025-003', medicineId: 'MED-006', medicineName: 'Azithromycin 500mg', requestedQty: 50, supplier: 'Sun Health Corporation', orderDate: '2026-10-24', status: 'Ordered', expectedDelivery: '2026-10-27', estimatedCost: 1100 }
];

export const pharmacistService = {
  // Initialize storage if needed
  initStorage: () => {
    if (!localStorage.getItem(PHARMACY_STORAGE_KEYS.MEDICINES)) {
      localStorage.setItem(PHARMACY_STORAGE_KEYS.MEDICINES, JSON.stringify(INITIAL_MEDICINES));
    }
    if (!localStorage.getItem(PHARMACY_STORAGE_KEYS.SUPPLIERS)) {
      localStorage.setItem(PHARMACY_STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
    }
    if (!localStorage.getItem(PHARMACY_STORAGE_KEYS.REORDERS)) {
      localStorage.setItem(PHARMACY_STORAGE_KEYS.REORDERS, JSON.stringify(INITIAL_REORDERS));
    }
    if (!localStorage.getItem(PHARMACY_STORAGE_KEYS.BILLS)) {
      localStorage.setItem(PHARMACY_STORAGE_KEYS.BILLS, JSON.stringify([]));
    }
    if (!localStorage.getItem(PHARMACY_STORAGE_KEYS.DISPENSE_LOG)) {
      localStorage.setItem(PHARMACY_STORAGE_KEYS.DISPENSE_LOG, JSON.stringify([]));
    }
  },

  // 1. Medicines & Inventory
  getMedicines: async () => {
    pharmacistService.initStorage();
    try {
      const res = await api.get('/pharmacist/medicines/');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        // Map Django MasterMedicine to normalized UI structure
        const normalized = res.data.map(m => ({
          id: `MED-${String(m.MedicineId || m.id).padStart(3, '0')}`,
          rawId: m.MedicineId || m.id,
          name: m.MedicineName || m.name,
          genericName: m.GenericName || '',
          dosage: m.Dosage || '500mg',
          type: m.Type || 'Tablet',
          category: m.Category || 'General',
          quantity: m.StockQuantity !== undefined ? m.StockQuantity : 50,
          minThreshold: m.MinThreshold || 20,
          unitPrice: parseFloat(m.UnitPrice || 10),
          sellingPrice: parseFloat(m.MRP || m.sellingPrice || 15),
          batchNo: m.BatchNo || 'BATCH-2025',
          expiryDate: m.ExpiryDate || '2026-12-31',
          supplier: m.Supplier || 'CarePoint Medical Supply'
        }));
        return normalized;
      }
    } catch {
      // Fallback to local storage
    }

    try {
      const stored = localStorage.getItem(PHARMACY_STORAGE_KEYS.MEDICINES);
      return stored ? JSON.parse(stored) : INITIAL_MEDICINES;
    } catch {
      return INITIAL_MEDICINES;
    }
  },

  saveMedicine: async (med) => {
    pharmacistService.initStorage();
    const stored = pharmacistService.getLocalMedicines();
    let updated;
    if (med.id && stored.some(m => m.id === med.id)) {
      updated = stored.map(m => (m.id === med.id ? { ...m, ...med } : m));
    } else {
      const nextNum = stored.length + 1;
      const newMed = {
        ...med,
        id: med.id || `MED-${String(nextNum).padStart(3, '0')}`,
        quantity: parseInt(med.quantity || 0, 10),
        minThreshold: parseInt(med.minThreshold || 20, 10),
        unitPrice: parseFloat(med.unitPrice || 10),
        sellingPrice: parseFloat(med.sellingPrice || 15),
      };
      updated = [newMed, ...stored];
    }
    localStorage.setItem(PHARMACY_STORAGE_KEYS.MEDICINES, JSON.stringify(updated));
    window.dispatchEvent(new Event('cms_stock_updated'));
    return updated;
  },

  updateStockQuantity: (medId, deltaQty, reason = 'Adjustment') => {
    pharmacistService.initStorage();
    const stored = pharmacistService.getLocalMedicines();
    let affectedItem = null;
    const updated = stored.map(m => {
      if (m.id === medId || String(m.rawId) === String(medId)) {
        const newQty = Math.max(0, (m.quantity || 0) + deltaQty);
        affectedItem = { ...m, quantity: newQty };
        return affectedItem;
      }
      return m;
    });
    localStorage.setItem(PHARMACY_STORAGE_KEYS.MEDICINES, JSON.stringify(updated));
    
    // Log adjustment
    if (affectedItem) {
      pharmacistService.addDispenseLogEntry({
        type: deltaQty < 0 ? 'STOCK_DEDUCTED' : 'STOCK_RESTOCKED',
        medicineId: medId,
        medicineName: affectedItem.name,
        qty: Math.abs(deltaQty),
        reason,
        timestamp: new Date().toISOString()
      });
    }

    window.dispatchEvent(new Event('cms_stock_updated'));
    return updated;
  },

  getLocalMedicines: () => {
    try {
      const stored = localStorage.getItem(PHARMACY_STORAGE_KEYS.MEDICINES);
      return stored ? JSON.parse(stored) : INITIAL_MEDICINES;
    } catch {
      return INITIAL_MEDICINES;
    }
  },

  // 2. Prescriptions Queue & Dispensing
  getPrescriptions: async () => {
    let backendList = [];
    try {
      const res = await api.get('/pharmacist/prescriptions/');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        backendList = res.data.map((p) => {
          const items = Array.isArray(p.items) ? p.items.map((it) => ({
            id: it.PrescriptionItemId,
            prescriptionItemId: it.PrescriptionItemId,
            medicineId: 'MED-' + String(it.MedicineId).padStart(3, '0'),
            rawMedicineId: it.MedicineId,
            medicineName: it.MedicineName || 'Prescribed Medicine',
            dosage: it.Dosage || '500mg',
            frequency: it.Frequency || '1-0-1',
            duration: it.Duration || '5 Days',
            quantity: 10,
            unitPrice: 15.0
          })) : [];

          let formattedDate = 'Today';
          if (p.PrescriptionDateTime) {
            try {
              formattedDate = new Date(p.PrescriptionDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            } catch (e) {}
          }

          return {
            id: 'RX-' + p.PrescriptionId,
            prescriptionId: 'RX-' + p.PrescriptionId,
            rawId: p.PrescriptionId,
            patientId: 'PAT-' + p.PatientId,
            patientName: p.PatientName || ('Patient #' + p.PatientId),
            patientAge: 45,
            patientGender: 'Male',
            patientPhone: '—',
            doctorId: 'DOC-' + p.DoctorId,
            doctorName: p.DoctorName ? (p.DoctorName.startsWith('Dr.') ? p.DoctorName : 'Dr. ' + p.DoctorName) : 'Dr. Prateek Pradeep',
            doctorDept: 'General Medicine',
            date: formattedDate,
            diagnosis: 'Prescribed by Doctor',
            notes: 'Dispense as directed',
            status: p.Status || 'Pending',
            items
          };
        });
      }
    } catch (err) {
      console.warn('Backend prescriptions fetch fallback:', err);
    }

    // Merge with local storage prescriptions
    let localRx = [];
    try {
      const stored = localStorage.getItem(PHARMACY_STORAGE_KEYS.PRESCRIPTIONS);
      if (stored) localRx = JSON.parse(stored);
    } catch {}

    const combined = [...backendList];
    localRx.forEach((lr) => {
      const id = lr.prescriptionId || lr.id;
      if (!combined.some((c) => c.prescriptionId === id || c.id === id || (c.rawId && lr.rawId && String(c.rawId) === String(lr.rawId)))) {
        combined.unshift({
          ...lr,
          id: lr.id || lr.prescriptionId,
          prescriptionId: lr.prescriptionId || lr.id,
          status: lr.status || 'Pending'
        });
      }
    });

    if (combined.length > 0) {
      return combined;
    }

    return [];
  },

  dispensePrescription: async (rxId, pharmacistUser = 'Adarsh Chandran') => {
    pharmacistService.initStorage();
    const prescriptions = await pharmacistService.getPrescriptions();
    const targetRx = prescriptions.find(r => r.id === rxId || r.prescriptionId === rxId);

    if (!targetRx) {
      throw new Error(`Prescription ${rxId} not found.`);
    }

    if (targetRx.status === 'Dispensed') {
      throw new Error(`Prescription ${rxId} has already been dispensed.`);
    }

    // Check inventory stock availability
    const inventory = pharmacistService.getLocalMedicines();
    const stockErrors = [];

    const itemsToDispense = (targetRx.items || targetRx.Medicines || []).map(item => {
      const name = item.medicineName || item.MedicineName || item.name || '';
      const qtyNeeded = parseInt(item.quantity || item.Quantity || 1, 10);
      const medId = item.medicineId || item.MedicineId || item.id;
      
      // Find matching inventory medicine by ID or name
      const foundMed = inventory.find(m => 
        (medId && m.id === medId) || 
        (name && m.name.toLowerCase().trim() === name.toLowerCase().trim())
      );

      if (!foundMed) {
        stockErrors.push(`Medicine "${name}" is not registered in the pharmacy inventory.`);
      } else if (foundMed.quantity < qtyNeeded) {
        stockErrors.push(`Insufficient stock for "${foundMed.name}": Available: ${foundMed.quantity}, Required: ${qtyNeeded}.`);
      }

      const unitPrice = foundMed ? foundMed.sellingPrice : (parseFloat(item.unitPrice || 10));
      return {
        medicineId: foundMed ? foundMed.id : medId,
        medicineName: foundMed ? foundMed.name : name,
        dosage: item.dosage || foundMed?.dosage || '',
        quantity: qtyNeeded,
        unitPrice: unitPrice,
        subtotal: qtyNeeded * unitPrice
      };
    });

    if (stockErrors.length > 0) {
      const err = new Error(stockErrors.join('\n'));
      err.stockErrors = stockErrors;
      throw err;
    }

    // Try backend dispense endpoint if real API
    let backendSuccess = false;
    try {
      const rawRxId = targetRx.id ? String(targetRx.id).replace(/\D/g, '') : null;
      if (rawRxId) {
        await api.post(`/pharmacist/prescriptions/${rawRxId}/dispense/`, {
          items: itemsToDispense.map(it => ({
            PrescriptionItemId: it.prescriptionItemId || it.id || 1,
            Quantity: it.quantity
          }))
        });
        backendSuccess = true;
      }
    } catch {
      // Continue with atomic local synchronization
    }

    // Deduct stock in inventory
    const updatedInventory = inventory.map(med => {
      const dispensedMatch = itemsToDispense.find(d => d.medicineId === med.id || d.medicineName.toLowerCase() === med.name.toLowerCase());
      if (dispensedMatch) {
        return {
          ...med,
          quantity: Math.max(0, med.quantity - dispensedMatch.quantity)
        };
      }
      return med;
    });
    localStorage.setItem(PHARMACY_STORAGE_KEYS.MEDICINES, JSON.stringify(updatedInventory));

    // Calculate Bill totals
    const subtotal = itemsToDispense.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
    const gstRate = 0.05; // Standard 5% Healthcare GST on retail pharma
    const gstAmount = Math.round(subtotal * gstRate * 100) / 100;
    const finalTotal = Math.round((subtotal + gstAmount) * 100) / 100;

    const billNumber = `PB-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    // Create Pharmacy Bill Object
    const newBill = {
      id: billNumber,
      billNumber: billNumber,
      prescriptionId: targetRx.id,
      patientId: targetRx.patientId || targetRx.PatientId || 'PT-1000',
      patientName: targetRx.patientName || targetRx.PatientName || 'Walk-in Patient',
      patientAge: targetRx.patientAge || '—',
      patientGender: targetRx.patientGender || '—',
      doctorName: targetRx.doctorName || targetRx.DoctorName || 'Staff Physician',
      dispensedBy: pharmacistUser,
      dispensedAt: timestamp,
      items: itemsToDispense,
      subtotal: subtotal,
      gstAmount: gstAmount,
      gstRatePercent: 5,
      totalAmount: finalTotal,
      status: 'Dispensed & Billed',
      paymentStatus: 'Pending Receptionist Payment',
      sentToReceptionist: true
    };

    // Save Bill in cms_bills
    const existingBills = pharmacistService.getBills();
    const updatedBills = [newBill, ...existingBills];
    localStorage.setItem(PHARMACY_STORAGE_KEYS.BILLS, JSON.stringify(updatedBills));

    // Also forward to Receptionist queue for billing desk settlement
    try {
      const recBills = localStorage.getItem(PHARMACY_STORAGE_KEYS.RECEPTIONIST_BILLS);
      const parsedRec = recBills ? JSON.parse(recBills) : [];
      const updatedRec = [newBill, ...parsedRec.filter(b => b.id !== newBill.id)];
      localStorage.setItem(PHARMACY_STORAGE_KEYS.RECEPTIONIST_BILLS, JSON.stringify(updatedRec));
    } catch {
      // ignore
    }

    // Mark prescription as Dispensed
    const updatedPrescriptions = prescriptions.map(r => {
      if (r.id === rxId || r.prescriptionId === rxId) {
        return {
          ...r,
          status: 'Dispensed',
          dispensedBy: pharmacistUser,
          dispensedAt: timestamp,
          billNumber: billNumber,
          billTotal: finalTotal
        };
      }
      return r;
    });
    localStorage.setItem(PHARMACY_STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(updatedPrescriptions));

    // Record in Dispense Log
    pharmacistService.addDispenseLogEntry({
      type: 'PRESCRIPTION_DISPENSED',
      prescriptionId: targetRx.id,
      patientName: targetRx.patientName,
      billNumber: billNumber,
      totalAmount: finalTotal,
      dispensedBy: pharmacistUser,
      itemCount: itemsToDispense.length,
      timestamp: new Date().toISOString()
    });

    // Fire cross-module events
    window.dispatchEvent(new Event('cms_stock_updated'));
    window.dispatchEvent(new Event('cms_rx_updated'));
    window.dispatchEvent(new Event('cms_billing_updated'));

    return {
      success: true,
      prescription: updatedPrescriptions.find(r => r.id === rxId),
      bill: newBill,
      backendSuccess
    };
  },

  // 3. Billing Management
  getBills: () => {
    pharmacistService.initStorage();
    try {
      const stored = localStorage.getItem(PHARMACY_STORAGE_KEYS.BILLS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  createDirectBill: (billData, pharmacistUser = 'Adarsh Chandran') => {
    pharmacistService.initStorage();
    const subtotal = billData.items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
    const gstRate = 0.05;
    const gstAmount = Math.round(subtotal * gstRate * 100) / 100;
    const finalTotal = Math.round((subtotal + gstAmount) * 100) / 100;

    const billNumber = `PB-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    const newBill = {
      id: billNumber,
      billNumber: billNumber,
      prescriptionId: billData.prescriptionId || 'OTC-DIRECT',
      patientId: billData.patientId || 'PT-WALKIN',
      patientName: billData.patientName || 'Walk-in Customer',
      doctorName: billData.doctorName || 'Self / OTC',
      dispensedBy: pharmacistUser,
      dispensedAt: timestamp,
      items: billData.items,
      subtotal: subtotal,
      gstAmount: gstAmount,
      gstRatePercent: 5,
      totalAmount: finalTotal,
      status: 'Paid / Completed',
      paymentStatus: 'Paid (Cash/UPI)',
      sentToReceptionist: true
    };

    // Deduct stock
    billData.items.forEach(it => {
      pharmacistService.updateStockQuantity(it.medicineId, -it.quantity, `Direct Sale ${billNumber}`);
    });

    const existingBills = pharmacistService.getBills();
    const updated = [newBill, ...existingBills];
    localStorage.setItem(PHARMACY_STORAGE_KEYS.BILLS, JSON.stringify(updated));

    window.dispatchEvent(new Event('cms_billing_updated'));
    return newBill;
  },

  // 4. Stock Orders & Procurement
  getReorders: () => {
    pharmacistService.initStorage();
    try {
      const stored = localStorage.getItem(PHARMACY_STORAGE_KEYS.REORDERS);
      return stored ? JSON.parse(stored) : INITIAL_REORDERS;
    } catch {
      return INITIAL_REORDERS;
    }
  },

  createReorder: (orderData) => {
    pharmacistService.initStorage();
    const existing = pharmacistService.getReorders();
    const nextId = `PO-2025-${String(existing.length + 1).padStart(3, '0')}`;
    const newOrder = {
      id: nextId,
      medicineId: orderData.medicineId,
      medicineName: orderData.medicineName,
      requestedQty: parseInt(orderData.requestedQty || 50, 10),
      supplier: orderData.supplier || 'MedLife Pharma Distribution',
      orderDate: new Date().toISOString().split('T')[0],
      status: 'Ordered',
      expectedDelivery: orderData.expectedDelivery || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      estimatedCost: parseFloat(orderData.estimatedCost || 500)
    };
    const updated = [newOrder, ...existing];
    localStorage.setItem(PHARMACY_STORAGE_KEYS.REORDERS, JSON.stringify(updated));
    return updated;
  },

  markOrderReceived: (orderId) => {
    pharmacistService.initStorage();
    const existing = pharmacistService.getReorders();
    let receivedItem = null;

    const updated = existing.map(o => {
      if (o.id === orderId) {
        receivedItem = o;
        return { ...o, status: 'Received', receivedDate: new Date().toISOString().split('T')[0] };
      }
      return o;
    });

    localStorage.setItem(PHARMACY_STORAGE_KEYS.REORDERS, JSON.stringify(updated));

    // Auto-increment the medicine stock!
    if (receivedItem && receivedItem.medicineId) {
      pharmacistService.updateStockQuantity(
        receivedItem.medicineId,
        receivedItem.requestedQty,
        `Procurement Received ${orderId}`
      );
    }

    return updated;
  },

  // 5. Suppliers
  getSuppliers: () => {
    pharmacistService.initStorage();
    try {
      const stored = localStorage.getItem(PHARMACY_STORAGE_KEYS.SUPPLIERS);
      return stored ? JSON.parse(stored) : INITIAL_SUPPLIERS;
    } catch {
      return INITIAL_SUPPLIERS;
    }
  },

  // 6. Dispense & Audit Log
  addDispenseLogEntry: (entry) => {
    try {
      const log = pharmacistService.getDispenseLog();
      const updated = [{ id: `LOG-${Date.now()}`, ...entry }, ...log.slice(0, 99)];
      localStorage.setItem(PHARMACY_STORAGE_KEYS.DISPENSE_LOG, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },

  getDispenseLog: () => {
    try {
      const stored = localStorage.getItem(PHARMACY_STORAGE_KEYS.DISPENSE_LOG);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // 7. Computed Metrics for Dashboard & Reports
  getDashboardMetrics: async () => {
    const medicines = await pharmacistService.getMedicines();
    const prescriptions = await pharmacistService.getPrescriptions();
    const bills = pharmacistService.getBills();
    const reorders = pharmacistService.getReorders();

    const totalMedicines = medicines.length;
    const lowStockCount = medicines.filter(m => m.quantity > 0 && m.quantity <= (m.minThreshold || 20)).length;
    const outOfStockCount = medicines.filter(m => m.quantity === 0).length;
    
    const pendingRxCount = prescriptions.filter(r => r.status === 'Pending' || !r.status).length;
    const completedRxCount = prescriptions.filter(r => r.status === 'Dispensed').length;

    // Today's completed transactions
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBills = bills.filter(b => (b.dispensedAt || '').includes(new Date().getFullYear()));
    const todayRevenue = todayBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    const pendingReordersCount = reorders.filter(r => r.status !== 'Received').length;

    return {
      totalMedicines,
      lowStockCount,
      outOfStockCount,
      pendingRxCount,
      completedRxCount,
      todayBillsCount: todayBills.length,
      todayRevenue,
      pendingReordersCount,
      inventoryValuation: medicines.reduce((acc, m) => acc + ((m.quantity || 0) * (m.sellingPrice || 0)), 0)
    };
  }
};

export default pharmacistService;
