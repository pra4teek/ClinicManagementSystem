import api from './api.js';

// Normalization helpers for Pharmacy Bill and Reorder objects
export const normalizeBill = (b = {}) => {
  const items = Array.isArray(b.items)
    ? b.items.map((it) => ({
        id: it.BillItemId,
        medicineName: it.MedicineName || it.Medicine || 'Medicine',
        name: it.MedicineName || it.Medicine || 'Medicine',
        quantity: Number(it.Quantity || 1),
        unitPrice: Number(it.UnitPrice || 0),
        subtotal: Number(it.LineAmount || (Number(it.Quantity || 1) * Number(it.UnitPrice || 0)))
      }))
    : [];

  const subtotal = Number(b.TotalAmount || 0);
  const gstAmount = Math.round(subtotal * 0.05 * 100) / 100;

  return {
    ...b,
    id: b.billNumber || (b.BillId ? `PB-${b.BillId}` : 'PB-REC'),
    billNumber: b.billNumber || (b.BillId ? `PB-${b.BillId}` : 'PB-REC'),
    prescriptionId: b.Prescription ? `RX-${b.Prescription}` : 'OTC-DIRECT',
    patientId: b.Patient ? `PAT-${b.Patient}` : 'PAT-WALKIN',
    patientName: b.PatientName || 'Patient',
    doctorName: b.DoctorName || 'Staff Physician',
    dispensedBy: b.DispensedByName || 'Pharmacist',
    dispensedAt: b.BillDate ? new Date(b.BillDate).toLocaleString('en-IN') : new Date().toLocaleString('en-IN'),
    items,
    subtotal,
    gstAmount,
    totalAmount: subtotal,
    status: 'Dispensed & Billed'
  };
};

export const normalizeReorder = (r = {}) => ({
  ...r,
  id: `PO-${r.ReorderId}`,
  reorderId: r.ReorderId,
  ReorderId: r.ReorderId,
  medicineId: `MED-${String(r.Medicine).padStart(3, '0')}`,
  rawMedicineId: r.Medicine,
  medicineName: r.MedicineName || 'Medicine',
  requestedQty: Number(r.RequestedQuantity || 50),
  currentStock: Number(r.CurrentStock || 0),
  reorderLevel: Number(r.ReorderLevel || 10),
  unitPrice: Number(r.UnitPrice || 0),
  estimatedCost: Number(r.EstimatedCost || 0),
  supplier: r.SupplierName || 'Wholesale Supplier',
  supplierId: r.Supplier,
  orderDate: r.CreatedAt ? r.CreatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
  status: r.Status || 'Pending Admin Approval',
  adminNote: r.AdminNote || '',
  reviewedBy: r.ReviewedBy || ''
});

export const pharmacistService = {
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
      stocks.forEach((s) => {
        const medId = s.Medicine?.MedicineId || s.Medicine || s.MedicineId;
        if (medId) stockMap.set(Number(medId), s);
      });

      return meds.map((m) => {
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
    } catch (err) {
      console.warn('Backend medicines fetch error:', err);
      return [];
    }
  },

  saveMedicine: async (med) => {
    try {
      // Create master medicine in MySQL
      const res = await api.post('/admin/medicines/', {
        MedicineName: med.name,
        Manufacturer: med.supplier || 'CarePoint Medical Supply',
        GenericName: med.genericName || med.name,
        Category: med.category || 'General',
        CostValue: parseFloat(med.unitPrice || 10),
        MRP: parseFloat(med.sellingPrice || 15),
        isActive: true
      });
      const createdMed = res.data;
      const medId = createdMed.MedicineId || createdMed.id;

      // Create pharmacy stock record
      if (medId) {
        await api.post('/pharmacist/stock/', {
          Medicine: medId,
          QuantityOnHand: parseInt(med.quantity || 50, 10),
          UnitPrice: parseFloat(med.unitPrice || 10),
          SellingPrice: parseFloat(med.sellingPrice || 15),
          ReorderLevel: parseInt(med.minThreshold || 20, 10)
        }).catch((err) => console.warn('Stock creation note:', err));
      }

      window.dispatchEvent(new Event('cms_stock_updated'));
      return createdMed;
    } catch (err) {
      console.error('Failed to save medicine to MySQL:', err);
      throw err;
    }
  },

  updateStockQuantity: async (medId, deltaQty, reason = 'Adjustment') => {
    try {
      const cleanId = Number(String(medId).replace(/\D/g, ''));
      const stockRes = await api.get('/pharmacist/stock/');
      const stocks = Array.isArray(stockRes.data) ? stockRes.data : (stockRes.data?.results || []);
      const targetStock = stocks.find((s) => Number(s.Medicine?.MedicineId || s.Medicine) === cleanId);

      if (targetStock) {
        const newQty = Math.max(0, (Number(targetStock.QuantityOnHand) || 0) + deltaQty);
        await api.patch(`/pharmacist/stock/${targetStock.StockId}/`, {
          QuantityOnHand: newQty
        });
      }
      window.dispatchEvent(new Event('cms_stock_updated'));
      return true;
    } catch (err) {
      console.warn('Stock adjustment error:', err);
      return false;
    }
  },

  // 2. Prescriptions Queue & Dispensing (100% MySQL from /api/pharmacist/prescriptions/)
  getPrescriptions: async () => {
    try {
      const res = await api.get('/pharmacist/prescriptions/');
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return data.map((p) => {
        const items = Array.isArray(p.items)
          ? p.items.map((it) => ({
              id: it.PrescriptionItemId,
              prescriptionItemId: it.PrescriptionItemId,
              medicineId: 'MED-' + String(it.MedicineId).padStart(3, '0'),
              rawMedicineId: it.MedicineId,
              medicineName: it.MedicineName || 'Prescribed Medicine',
              dosage: it.Dosage || '500mg',
              frequency: it.Frequency || '1-0-1',
              duration: it.Duration || '5 Days',
              instructions: it.Instructions || '',
              quantity: Number(it.Quantity || 1),
              dispensedQuantity: Number(it.DispensedQuantity || 0),
              remainingQuantity: Number(it.RemainingQuantity ?? it.Quantity ?? 1),
              unitPrice: Number(it.UnitPrice || 15.0)
            }))
          : [];

        let formattedDate = 'Today';
        if (p.PrescriptionDateTime) {
          try {
            formattedDate = new Date(p.PrescriptionDateTime).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          } catch (e) {}
        }

        const isPending = !p.Status || p.Status === 'Not Dispensed' || p.Status === 'Pending';

        return {
          id: 'RX-' + p.PrescriptionId,
          prescriptionId: 'RX-' + p.PrescriptionId,
          rawId: p.PrescriptionId,
          patientId: 'PAT-' + p.PatientId,
          patientName: p.PatientName || 'Patient #' + p.PatientId,
          patientAge: p.PatientAge || 45,
          patientGender: p.PatientGender || 'Male',
          patientPhone: p.PatientPhone || '—',
          doctorId: 'DOC-' + p.DoctorId,
          doctorName: p.DoctorName
            ? p.DoctorName.startsWith('Dr.')
              ? p.DoctorName
              : 'Dr. ' + p.DoctorName
            : 'Dr. Prateek Pradeep',
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

  dispensePrescription: async (rxId, pharmacistUser = 'Pharmacist', quantityOverrides = {}) => {
    const rawRxId = String(rxId).replace(/\D/g, '');
    if (!rawRxId) {
      throw new Error(`Invalid prescription ID: ${rxId}`);
    }

    const prescriptions = await pharmacistService.getPrescriptions();
    const targetRx = prescriptions.find((r) => String(r.rawId) === rawRxId || r.id === rxId || r.prescriptionId === rxId);

    if (targetRx && targetRx.rawStatus === 'Dispensed') {
      throw new Error(`Prescription RX-${rawRxId} has already been dispensed.`);
    }

    if (!targetRx) throw new Error('Prescription not found. Refresh the queue and try again.');

    const itemsPayload = (targetRx.items || []).map((item) => ({
      PrescriptionItemId: item.prescriptionItemId || item.id,
      Quantity: Number(quantityOverrides[item.prescriptionItemId || item.id] ?? item.remainingQuantity ?? item.quantity),
    })).filter((item) => item.Quantity > 0);
    if (!itemsPayload.length || itemsPayload.some((item) => !Number.isInteger(item.Quantity))) {
      throw new Error('Enter a valid dispense quantity for at least one prescription item.');
    }

    try {
      const response = await api.post(`/pharmacist/prescriptions/${rawRxId}/dispense/`, {
        items: itemsPayload
      });

      const normalized = normalizeBill(response.data);

      window.dispatchEvent(new Event('cms_stock_updated'));
      window.dispatchEvent(new Event('cms_rx_updated'));
      window.dispatchEvent(new Event('cms_billing_updated'));

      return {
        success: true,
        bill: normalized,
        prescription: targetRx
      };
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error || err.message || 'Dispensing failed.';
      throw new Error(detail);
    }
  },

  // 3. Billing Management (100% MySQL from /api/pharmacist/bills/)
  getBills: async () => {
    try {
      const res = await api.get('/pharmacist/bills/');
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return data.map(normalizeBill);
    } catch (err) {
      console.warn('Backend bills fetch error:', err);
      return [];
    }
  },

  // 4. Stock Reorders & Permissions (100% MySQL from /api/pharmacist/reorders/)
  getReorders: async () => {
    try {
      const res = await api.get('/pharmacist/reorders/');
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return data.map(normalizeReorder);
    } catch (err) {
      console.warn('Backend reorders fetch error:', err);
      return [];
    }
  },

  createReorder: async (orderData) => {
    try {
      const cleanMedId = Number(String(orderData.medicineId || orderData.rawMedicineId || '').replace(/\D/g, ''));
      const payload = {
        Medicine: cleanMedId,
        RequestedQuantity: parseInt(orderData.requestedQty || 50, 10),
        SupplierName: orderData.supplier || 'CarePoint Wholesale Supplier',
        EstimatedCost: parseFloat(orderData.estimatedCost || 500)
      };
      if (orderData.supplierId) {
        payload.Supplier = orderData.supplierId;
      }
      const res = await api.post('/pharmacist/reorders/', payload);
      window.dispatchEvent(new Event('cms_stock_updated'));
      return normalizeReorder(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Failed to submit reorder request.';
      throw new Error(detail);
    }
  },

  orderFromSupplier: async (orderId) => {
    try {
      const cleanId = String(orderId).replace(/\D/g, '');
      const res = await api.post(`/pharmacist/reorders/${cleanId}/order_from_supplier/`);
      window.dispatchEvent(new Event('cms_stock_updated'));
      return normalizeReorder(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Failed to request order from supplier.';
      throw new Error(detail);
    }
  },

  markOrderReceived: async (orderId) => {
    try {
      const cleanId = String(orderId).replace(/\D/g, '');
      const res = await api.post(`/pharmacist/reorders/${cleanId}/mark_received/`);
      window.dispatchEvent(new Event('cms_stock_updated'));
      return normalizeReorder(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Failed to mark order as received.';
      throw new Error(detail);
    }
  },

  // 5. Suppliers (100% MySQL from /api/pharmacist/suppliers/)
  getSuppliers: async () => {
    try {
      const res = await api.get('/pharmacist/suppliers/');
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return data.map((s) => ({
        id: `SUP-${String(s.SupplierId).padStart(2, '0')}`,
        rawId: s.SupplierId,
        SupplierId: s.SupplierId,
        name: s.SupplierName,
        SupplierName: s.SupplierName,
        contactPerson: s.ContactPerson || 'Supplier Representative',
        phone: s.PhoneNumber || '—',
        email: s.Email || 'orders@pharma.in',
        city: s.City || 'Kerala, India',
        isActive: s.IsActive !== false
      }));
    } catch (err) {
      console.warn('Backend suppliers fetch error:', err);
      return [];
    }
  },

  // 6. Notifications (100% MySQL from /api/pharmacist/notifications/)
  getNotifications: async (role = 'Pharmacist') => {
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

  markAllNotificationsRead: async (role = 'Pharmacist') => {
    try {
      const res = await api.post('/pharmacist/notifications/mark_all_read/', { role }, { params: { role } });
      return res.data;
    } catch {
      return false;
    }
  },

  // 7. Dispense Log from MySQL Bills
  getDispenseLog: async () => {
    try {
      const bills = await pharmacistService.getBills();
      const logs = [];
      const safeBills = Array.isArray(bills) ? bills : [];
      safeBills.forEach((b) => {
        const items = Array.isArray(b?.items) ? b.items : [];
        if (items.length > 0) {
          items.forEach((it, idx) => {
            logs.push({
              id: `LOG-${b?.id || b?.billNumber || 'BILL'}-${it?.id || idx}`,
              type: 'PRESCRIPTION_DISPENSED',
              prescriptionId: b?.prescriptionId,
              billNumber: b?.billNumber ?? (b?.BillId ? `PB-${b.BillId}` : '-'),
              patient: { name: b?.patientName ?? b?.PatientName ?? '-' },
              patientName: b?.patientName ?? b?.PatientName ?? '-',
              medicine: { name: it?.medicineName ?? it?.MedicineName ?? it?.name ?? '-' },
              medicineName: it?.medicineName ?? it?.MedicineName ?? it?.name ?? '-',
              quantity: it?.quantity ?? it?.Quantity ?? 1,
              pharmacist: b?.dispensedBy ?? b?.DispensedByName ?? 'Pharmacist',
              dispensedBy: b?.dispensedBy ?? b?.DispensedByName ?? 'Pharmacist',
              total: it?.subtotal != null ? `₹${Number(it.subtotal).toFixed(2)}` : (it?.unitPrice != null ? `₹${(Number(it.quantity || 1) * Number(it.unitPrice)).toFixed(2)}` : (b?.totalAmount != null ? `₹${b.totalAmount}` : '-')),
              totalAmount: b?.totalAmount ?? 0,
              timestamp: b?.dispensedAt ?? b?.BillDate ?? '-'
            });
          });
        } else {
          logs.push({
            id: `LOG-${b?.id || b?.billNumber || 'BILL'}`,
            type: 'PRESCRIPTION_DISPENSED',
            prescriptionId: b?.prescriptionId,
            billNumber: b?.billNumber ?? (b?.BillId ? `PB-${b.BillId}` : '-'),
            patient: { name: b?.patientName ?? b?.PatientName ?? '-' },
            patientName: b?.patientName ?? b?.PatientName ?? '-',
            medicine: { name: '-' },
            medicineName: '-',
            quantity: '-',
            pharmacist: b?.dispensedBy ?? b?.DispensedByName ?? 'Pharmacist',
            dispensedBy: b?.dispensedBy ?? b?.DispensedByName ?? 'Pharmacist',
            total: b?.totalAmount != null ? `₹${b.totalAmount}` : '-',
            totalAmount: b?.totalAmount ?? 0,
            timestamp: b?.dispensedAt ?? b?.BillDate ?? '-'
          });
        }
      });
      return logs;
    } catch {
      return [];
    }
  },

  // 8. Computed Metrics for Dashboard & Reports
  getDashboardMetrics: async () => {
    const [medicines, prescriptions, bills, reorders] = await Promise.all([
      pharmacistService.getMedicines(),
      pharmacistService.getPrescriptions(),
      pharmacistService.getBills(),
      pharmacistService.getReorders()
    ]);

    const totalMedicines = medicines.length;
    const lowStockCount = medicines.filter((m) => m.quantity > 0 && m.quantity <= (m.minThreshold || 20)).length;
    const outOfStockCount = medicines.filter((m) => m.quantity === 0).length;

    const pendingRxCount = prescriptions.filter((r) => r.status === 'Pending' || r.rawStatus === 'Not Dispensed').length;
    const completedRxCount = prescriptions.filter((r) => r.status === 'Dispensed').length;

    const todayBills = bills;
    const todayRevenue = todayBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const pendingReordersCount = reorders.filter((r) => r.status !== 'Received').length;

    return {
      totalMedicines,
      lowStockCount,
      outOfStockCount,
      pendingRxCount,
      completedRxCount,
      todayBillsCount: todayBills.length,
      todayRevenue,
      pendingReordersCount,
      inventoryValuation: medicines.reduce((acc, m) => acc + (m.quantity || 0) * (m.sellingPrice || 0), 0)
    };
  }
};

export default pharmacistService;
