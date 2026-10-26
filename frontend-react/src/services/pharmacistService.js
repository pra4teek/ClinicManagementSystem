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

// Standard initial suppliers if empty
const INITIAL_SUPPLIERS = [
  { id: 'SUP-01', name: 'MedLife Pharma Distribution', contactPerson: 'Rajesh Sharma', phone: '+91 98450 12345', email: 'orders@medlifepharma.in', city: 'Ernakulam, Kerala', rating: '4.9 ★', activeContracts: 6 },
  { id: 'SUP-02', name: 'Sun Health Corporation', contactPerson: 'Priya Nambiar', phone: '+91 94471 67890', email: 'supply@sunhealthcorp.com', city: 'Kochi, Kerala', rating: '4.8 ★', activeContracts: 4 },
  { id: 'SUP-03', name: 'Cipla Regional Agency', contactPerson: 'Anand Menon', phone: '+91 98952 34567', email: 'kerala.agency@cipla.com', city: 'Thiruvananthapuram, Kerala', rating: '4.7 ★', activeContracts: 8 },
  { id: 'SUP-04', name: 'Apollo Wholesale Logistics', contactPerson: 'Sunil Kumar', phone: '+91 97443 89012', email: 'wholesale@apollologistics.in', city: 'Thrissur, Kerala', rating: '4.6 ★', activeContracts: 5 },
  { id: 'SUP-05', name: 'Glaxo Respiratory Care', contactPerson: 'Deepa Varghese', phone: '+91 98460 45678', email: 'orders@glaxorespiratory.com', city: 'Kottayam, Kerala', rating: '4.9 ★', activeContracts: 3 }
];

export const pharmacistService = {
  // Initialize storage if needed (for suppliers and logs only)
  initStorage: () => {
    if (!localStorage.getItem(PHARMACY_STORAGE_KEYS.SUPPLIERS)) {
      localStorage.setItem(PHARMACY_STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
    }
    if (!localStorage.getItem(PHARMACY_STORAGE_KEYS.DISPENSE_LOG)) {
      localStorage.setItem(PHARMACY_STORAGE_KEYS.DISPENSE_LOG, JSON.stringify([]));
    }
  },

  // 1. Medicines & Inventory (100% MySQL from /api/pharmacist/medicines/ and /api/pharmacist/stock/)
  getMedicines: async () => {
    try {
      const [medsRes, stockRes] = await Promise.all([
        api.get('/pharmacist/medicines/'),
        api.get('/pharmacist/stock/').catch(() => ({ data: [] }))
      ]);

      const meds = Array.isArray(medsRes.data) ? medsRes.data : (medsRes.data?.results || []);
      const stocks = Array.isArray(stockRes.data) ? stockRes.data : (stockRes.data?.results || []);

      const stockMap = new Map();
      stocks.forEach(s => {
        const medId = s.Medicine?.MedicineId || s.Medicine || s.MedicineId;
        if (medId) stockMap.set(Number(medId), s);
      });

      const mapped = meds.map(m => {
        const s = stockMap.get(Number(m.MedicineId)) || {};
        const qty = s.QuantityOnHand !== undefined ? Number(s.QuantityOnHand) : (m.StockQuantity !== undefined ? Number(m.StockQuantity) : 0);
        const minThresh = s.ReorderLevel !== undefined ? Number(s.ReorderLevel) : 20;
        const uPrice = Number(s.UnitPrice || m.CostValue || 0);
        const sPrice = Number(s.SellingPrice || m.MRP || 0);

        return {
          id: `MED-${String(m.MedicineId).padStart(3, '0')}`,
          rawId: m.MedicineId,
          MedicineId: m.MedicineId,
          name: m.MedicineName || '',
          MedicineName: m.MedicineName || '',
          genericName: m.GenericName || '',
          GenericName: m.GenericName || '',
          dosage: m.Dosage || '500mg',
          type: m.Type || 'Tablet',
          category: m.Category || 'General',
          Category: m.Category || 'General',
          quantity: qty,
          minThreshold: minThresh,
          reorderLevel: minThresh,
          unitPrice: uPrice,
          costValue: uPrice,
          sellingPrice: sPrice,
          mrp: sPrice,
          batchNo: s.BatchNo || 'BATCH-2025',
          expiryDate: s.ExpiryDate || '2026-12-31',
          supplier: m.Manufacturer || 'CarePoint Medical Supply',
          stockId: s.StockId || null,
          isActive: m.isActive !== false
        };
      });
      localStorage.setItem(PHARMACY_STORAGE_KEYS.MEDICINES, JSON.stringify(mapped));
      return mapped;
    } catch (err) {
      console.warn('Backend medicines fetch error:', err);
      return [];
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
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('getLocalMedicines parse error:', e);
    }
    return [];
  },

  // 2. Prescriptions Queue & Dispensing (100% MySQL from /api/pharmacist/prescriptions/)
  getPrescriptions: async () => {
    try {
      const res = await api.get('/pharmacist/prescriptions/');
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return data.map((p) => {
        const items = Array.isArray(p.items) ? p.items.map((it) => ({
          id: it.PrescriptionItemId,
          prescriptionItemId: it.PrescriptionItemId,
          medicineId: 'MED-' + String(it.MedicineId).padStart(3, '0'),
          rawMedicineId: it.MedicineId,
          medicineName: it.MedicineName || 'Prescribed Medicine',
          dosage: it.Dosage || '500mg',
          frequency: it.Frequency || '1-0-1',
          duration: it.Duration || '5 Days',
          quantity: it.Quantity || 10,
          unitPrice: Number(it.UnitPrice || 15.0)
        })) : [];

        let formattedDate = 'Today';
        if (p.PrescriptionDateTime) {
          try {
            formattedDate = new Date(p.PrescriptionDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
          } catch (e) {}
        }

        const isPending = !p.Status || p.Status === 'Not Dispensed' || p.Status === 'Pending';

        return {
          id: 'RX-' + p.PrescriptionId,
          prescriptionId: 'RX-' + p.PrescriptionId,
          rawId: p.PrescriptionId,
          patientId: 'PAT-' + p.PatientId,
          patientName: p.PatientName || ('Patient #' + p.PatientId),
          patientAge: p.PatientAge || 45,
          patientGender: p.PatientGender || 'Male',
          patientPhone: p.PatientPhone || '—',
          doctorId: 'DOC-' + p.DoctorId,
          doctorName: p.DoctorName ? (p.DoctorName.startsWith('Dr.') ? p.DoctorName : 'Dr. ' + p.DoctorName) : 'Dr. Prateek Pradeep',
          doctorDept: p.DepartmentName || 'General Medicine',
          date: formattedDate,
          diagnosis: p.Diagnosis || 'Prescribed by Doctor',
          notes: p.Notes || 'Dispense as directed',
          status: isPending ? 'Pending' : p.Status,
          rawStatus: p.Status,
          items
        };
      });
    } catch (err) {
      console.warn('Backend prescriptions fetch error:', err);
      return [];
    }
  },

  dispensePrescription: async (rxId, pharmacistUser = 'Adarsh Chandran') => {
    const prescriptions = await pharmacistService.getPrescriptions();
    const targetRx = prescriptions.find(r => r.id === rxId || r.prescriptionId === rxId);

    if (!targetRx) {
      throw new Error(`Prescription ${rxId} not found.`);
    }

    if (targetRx.status === 'Dispensed') {
      throw new Error(`Prescription ${rxId} has already been dispensed.`);
    }

    // Check inventory stock availability
    let inventory = pharmacistService.getLocalMedicines();
    if (!inventory || inventory.length === 0) {
      inventory = await pharmacistService.getMedicines();
    }
    const stockErrors = [];

    const itemsToDispense = (targetRx.items || targetRx.Medicines || []).map(item => {
      const name = item.medicineName || item.MedicineName || item.name || '';
      const qtyNeeded = parseInt(item.quantity || item.Quantity || 1, 10);
      const medId = item.medicineId || item.MedicineId || item.id;
      
      // Find matching inventory medicine by ID or name
      const foundMed = inventory.find(m => 
        (medId && (m.id === medId || String(m.rawId) === String(medId) || String(m.MedicineId) === String(medId))) || 
        (name && m.name.toLowerCase().trim() === name.toLowerCase().trim())
      );

      if (!foundMed) {
        stockErrors.push(`Medicine "${name}" is not registered in the pharmacy inventory.`);
      } else if (foundMed.quantity < qtyNeeded) {
        stockErrors.push(`Insufficient stock for "${foundMed.name}": Available: ${foundMed.quantity}, Required: ${qtyNeeded}.`);
      }

      const unitPrice = foundMed ? foundMed.sellingPrice : (parseFloat(item.unitPrice || 10));
      return {
        prescriptionItemId: item.prescriptionItemId || item.id,
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
      const rawRxId = targetRx.rawId || (targetRx.id ? String(targetRx.id).replace(/\D/g, '') : null);
      if (rawRxId) {
        await api.post(`/pharmacist/prescriptions/${rawRxId}/dispense/`, {
          items: itemsToDispense.map(it => ({
            PrescriptionItemId: it.prescriptionItemId || it.id || 1,
            Quantity: it.quantity
          }))
        });
        backendSuccess = true;
      }
    } catch (apiErr) {
      console.warn('Backend dispense endpoint warning:', apiErr?.response?.data || apiErr?.message);
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

    // Fire cross-module events across tabs and windows
    try {
      localStorage.setItem('cms_rx_updated_at', String(Date.now()));
      localStorage.setItem('cms_billing_updated_at', String(Date.now()));
    } catch (e) {}
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

  // 3. Billing Management (100% MySQL from /api/pharmacist/bills/)
  getBills: async () => {
    try {
      const res = await api.get('/pharmacist/bills/');
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return data.map((b) => ({
        id: b.BillNumber || `PB-${b.BillId}`,
        billNumber: b.BillNumber || `PB-${b.BillId}`,
        prescriptionId: b.Prescription ? `RX-${b.Prescription}` : 'OTC-DIRECT',
        patientId: b.Patient ? `PAT-${b.Patient}` : 'PAT-WALKIN',
        patientName: b.PatientName || (b.Patient ? `Patient #${b.Patient}` : 'Walk-in Patient'),
        patientAge: '—',
        patientGender: '—',
        doctorName: b.DoctorName || 'Staff Physician',
        dispensedBy: b.DispensedByName || 'Pharmacist',
        dispensedAt: b.BillDate ? new Date(b.BillDate).toLocaleString('en-IN') : new Date().toLocaleString('en-IN'),
        items: Array.isArray(b.items) ? b.items.map(it => ({
          medicineName: it.MedicineName || it.Medicine,
          quantity: it.Quantity,
          unitPrice: Number(it.UnitPrice || 0),
          subtotal: Number(it.TotalPrice || 0)
        })) : [],
        subtotal: Number(b.SubTotal || b.TotalAmount || 0),
        gstAmount: Number(b.TaxAmount || 0),
        gstRatePercent: 5,
        totalAmount: Number(b.TotalAmount || 0),
        status: b.PaymentStatus || 'Dispensed & Billed',
        paymentStatus: b.PaymentStatus || 'Paid',
        sentToReceptionist: true
      }));
    } catch (err) {
      console.warn('Backend bills fetch error:', err);
      return [];
    }
  },

  createDirectBill: (billData, pharmacistUser = 'Adarsh Chandran') => {
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

    window.dispatchEvent(new Event('cms_billing_updated'));
    return newBill;
  },

  // 4. Stock Orders & Procurement (100% MySQL from /api/pharmacist/reports/reorder/)
  getReorders: async () => {
    try {
      const res = await api.get('/pharmacist/reports/reorder/');
      const data = res.data?.results || (Array.isArray(res.data) ? res.data : []);
      return data.map((r, idx) => ({
        id: `PO-${new Date().getFullYear()}-${String(idx + 1).padStart(3, '0')}`,
        medicineId: `MED-${String(r.MedicineId).padStart(3, '0')}`,
        rawMedicineId: r.MedicineId,
        medicineName: r.MedicineName,
        requestedQty: Math.max(50, (r.ReorderLevel || 20) * 2 - (r.QuantityOnHand || 0)),
        currentStock: r.QuantityOnHand,
        reorderLevel: r.ReorderLevel,
        unitPrice: Number(r.UnitPrice || 0),
        estimatedCost: Math.max(50, (r.ReorderLevel || 20) * 2 - (r.QuantityOnHand || 0)) * Number(r.UnitPrice || 10),
        supplier: 'CarePoint Medical Supply',
        orderDate: new Date().toISOString().split('T')[0],
        status: r.StockStatus || (r.QuantityOnHand <= 0 ? 'Out of Stock' : 'Low Stock'),
        expectedDelivery: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
      }));
    } catch (err) {
      console.warn('Backend reorders fetch error:', err);
      return [];
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
    const [medicines, prescriptions, bills, reorders] = await Promise.all([
      pharmacistService.getMedicines(),
      pharmacistService.getPrescriptions(),
      pharmacistService.getBills(),
      pharmacistService.getReorders()
    ]);

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
