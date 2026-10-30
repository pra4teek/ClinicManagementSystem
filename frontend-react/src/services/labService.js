import api from './api';

const KEYS = {
  orders: 'cms_lab_orders',
  patients: 'cms_patients',
  reports: 'cms_lab_reports',
  bills: 'cms_bills',
  tests: 'lab-test-master',
};

const DEFAULT_TESTS = [
  { testId: 'LT001', testName: 'Blood Count', sampleType: 'Blood', normalValue: '4.5-5.5 million/µL', charge: 300 },
  { testId: 'LT002', testName: 'Glucose', sampleType: 'Blood', normalValue: '70-100 mg/dL', charge: 150 },
  { testId: 'LT003', testName: 'Urine Test', sampleType: 'Urine', normalValue: 'Normal', charge: 200 },
  { testId: 'LT004', testName: 'Hemoglobin', sampleType: 'Blood', normalValue: '12-16 g/dL', charge: 180 },
  { testId: 'LT005', testName: 'Cholesterol', sampleType: 'Blood', normalValue: 'Below 200 mg/dL', charge: 400 },
  { testId: 'LT006', testName: 'Thyroid', sampleType: 'Blood', normalValue: '0.4-4.0 mIU/L', charge: 500 },
];

const META = [
  { match: /cbc|complete blood count|blood count|blood test/, sampleType: 'Whole Blood (EDTA)', normalValue: 'WBC: 4.5-11.0 ×10³/µL, RBC: 4.5-5.5 ×10⁶/µL, Platelets: 150-450 ×10³/µL', charge: 300 },
  { match: /fbs|fasting blood sugar|fasting glucose|glucose/, sampleType: 'Fluoride Plasma', normalValue: '70 - 99 mg/dL (Normal Fasting)', charge: 150 },
  { match: /ppbs|post prandial/, sampleType: 'Fluoride Plasma', normalValue: '< 140 mg/dL', charge: 150 },
  { match: /hba1c|glycated/, sampleType: 'Whole Blood (EDTA)', normalValue: '< 5.7% (Normal), 5.7-6.4% (Prediabetic)', charge: 450 },
  { match: /lipid|cholesterol/, sampleType: 'Serum', normalValue: 'Total Chol: < 200 mg/dL, Triglycerides: < 150 mg/dL, HDL: > 40 mg/dL', charge: 400 },
  { match: /urine/, sampleType: 'Clean Catch Midstream Urine', normalValue: 'Color: Pale Yellow, pH: 5.0-7.0, Protein: Nil, Sugar: Nil', charge: 200 },
  { match: /thyroid|tsh|t3|t4/, sampleType: 'Serum', normalValue: 'TSH: 0.4 - 4.2 µIU/mL, Free T4: 0.8 - 1.8 ng/dL', charge: 500 },
  { match: /lft|liver/, sampleType: 'Serum', normalValue: 'Total Bilirubin: 0.2-1.2 mg/dL, SGOT/AST: 8-40 U/L, SGPT/ALT: 7-56 U/L', charge: 450 },
  { match: /kft|kidney|renal|creatinine/, sampleType: 'Serum', normalValue: 'Serum Creatinine: 0.6-1.2 mg/dL, Blood Urea: 15-40 mg/dL', charge: 400 },
  { match: /x-ray|chest|radiology/, sampleType: 'Radiology / Imaging', normalValue: 'Clear lung fields, normal cardiothoracic ratio (<0.5), no active lesion', charge: 350 },
  { match: /ha?emoglobin|hb/, sampleType: 'Whole Blood (EDTA)', normalValue: 'Male: 13.5-17.5 g/dL, Female: 12.0-15.5 g/dL', charge: 180 },
];

const SCHEMAS = [
  {
    match: /x-ray|chest|radiology/,
    params: [
      { id: 'lungFields', name: 'Lung Fields & Pleura', unit: 'Visual', ref: 'Clear, normal vascularity', normalVal: 'Clear, no infiltrates or effusion', highVal: 'Infiltrates noted in lower zone', isText: true },
      { id: 'cardioRatio', name: 'Cardiothoracic Ratio (CTR)', unit: 'Ratio', ref: '< 0.50', normalVal: 0.44, highVal: 0.58, min: 0.2, max: 0.9 },
      { id: 'impression', name: 'Radiological Impression', unit: 'Impression', ref: 'Normal PA View', normalVal: 'Normal Chest Radiograph', highVal: 'Cardiomegaly / Active Lesion', isText: true },
    ],
  },
  {
    match: /lipid|cholesterol/,
    params: [
      { id: 'totalChol', name: 'Total Cholesterol', unit: 'mg/dL', ref: '< 200 mg/dL', normalVal: 175, highVal: 245, min: 40, max: 1000 },
      { id: 'triglycerides', name: 'Triglycerides', unit: 'mg/dL', ref: '< 150 mg/dL', normalVal: 125, highVal: 220, min: 20, max: 2000 },
      { id: 'hdl', name: 'HDL Cholesterol', unit: 'mg/dL', ref: '> 40 mg/dL', normalVal: 48, highVal: 32, min: 10, max: 200 },
      { id: 'ldl', name: 'LDL Cholesterol', unit: 'mg/dL', ref: '< 100 mg/dL', normalVal: 102, highVal: 168, min: 20, max: 800 },
    ],
  },
  {
    match: /cbc|complete blood count|blood count|blood test/,
    params: [
      { id: 'hb', name: 'Hemoglobin (Hb)', unit: 'g/dL', ref: '12.0 - 16.0 g/dL', normalVal: 14.2, highVal: 8.5, min: 2.5, max: 25 },
      { id: 'wbc', name: 'Total WBC Count', unit: '×10³/µL', ref: '4.5 - 11.0 ×10³/µL', normalVal: 7.2, highVal: 15.8, min: 0.5, max: 100 },
      { id: 'platelets', name: 'Platelet Count', unit: '×10³/µL', ref: '150 - 450 ×10³/µL', normalVal: 260, highVal: 95, min: 10, max: 2000 },
      { id: 'rbc', name: 'RBC Count', unit: '×10⁶/µL', ref: '4.5 - 5.5 ×10⁶/µL', normalVal: 4.8, highVal: 3.2, min: 1, max: 10 },
    ],
  },
  { match: /ppbs|post prandial/, params: [{ id: 'ppbs', name: 'Blood Glucose (PP)', unit: 'mg/dL', ref: '< 140 mg/dL', normalVal: 115, highVal: 220, min: 30, max: 1000 }] },
  { match: /fbs|fasting|glucose|sugar/, params: [{ id: 'fbs', name: 'Blood Glucose (Fasting)', unit: 'mg/dL', ref: '70 - 99 mg/dL', normalVal: 88, highVal: 172, min: 30, max: 1000 }] },
  { match: /hba1c|glycated/, params: [{ id: 'hba1c', name: 'HbA1c', unit: '%', ref: '< 5.7%', normalVal: 5.2, highVal: 8.4, min: 3, max: 20 }] },
  {
    match: /urine/,
    params: [
      { id: 'urineColor', name: 'Color & Appearance', unit: 'Visual', ref: 'Pale Yellow, Clear', normalVal: 'Pale Yellow / Clear', highVal: 'Turbid Amber', isText: true },
      { id: 'urinePH', name: 'pH', unit: 'pH', ref: '5.0 - 7.0', normalVal: 6, highVal: 8.5, min: 4, max: 9 },
      { id: 'urineProtein', name: 'Protein / Albumin', unit: 'Semi-quant', ref: 'Nil', normalVal: 'Nil', highVal: '2+ (Positive)', isText: true },
      { id: 'urineSugar', name: 'Sugar / Glucose', unit: 'Semi-quant', ref: 'Nil', normalVal: 'Nil', highVal: '1+ (Positive)', isText: true },
      { id: 'urinePus', name: 'Pus Cells / WBC', unit: '/HPF', ref: '0 - 2 /HPF', normalVal: '1-2 /HPF', highVal: '15-20 /HPF', isText: true },
    ],
  },
  { match: /thyroid|tsh|t3|t4/, params: [
    { id: 'tsh', name: 'TSH', unit: 'µIU/mL', ref: '0.4 - 4.2 µIU/mL', normalVal: 2.1, highVal: 8.6, min: 0.01, max: 150 },
    { id: 'ft4', name: 'Free T4', unit: 'ng/dL', ref: '0.8 - 1.8 ng/dL', normalVal: 1.2, highVal: 0.5, min: 0.1, max: 20 },
  ] },
  { match: /lft|liver/, params: [
    { id: 'bilirubin', name: 'Total Bilirubin', unit: 'mg/dL', ref: '0.2 - 1.2 mg/dL', normalVal: 0.7, highVal: 3.2, min: 0.1, max: 50 },
    { id: 'sgot', name: 'SGOT / AST', unit: 'U/L', ref: '8 - 40 U/L', normalVal: 24, highVal: 110, min: 1, max: 2000 },
    { id: 'sgpt', name: 'SGPT / ALT', unit: 'U/L', ref: '7 - 56 U/L', normalVal: 28, highVal: 145, min: 1, max: 2000 },
  ] },
  { match: /kft|kidney|renal|creatinine/, params: [
    { id: 'creatinine', name: 'Serum Creatinine', unit: 'mg/dL', ref: '0.6 - 1.2 mg/dL', normalVal: 0.9, highVal: 2.8, min: 0.2, max: 30 },
    { id: 'urea', name: 'Blood Urea', unit: 'mg/dL', ref: '15 - 40 mg/dL', normalVal: 26, highVal: 85, min: 2, max: 400 },
  ] },
  { match: /ha?emoglobin|hb/, params: [{ id: 'hb_single', name: 'Hemoglobin', unit: 'g/dL', ref: '12.0 - 16.0 g/dL', normalVal: 14, highVal: 8.2, min: 2.5, max: 25 }] },
];

function getStored(key, fallback) {
  const value = localStorage.getItem(key);
  return value === null ? fallback : JSON.parse(value);
}

function getMeta(name) {
  return META.find((item) => item.match.test(String(name || '').toLowerCase())) || {
    sampleType: 'Diagnostic Specimen',
    normalValue: 'Standard Reference Range',
    charge: 250,
  };
}

export function getLabTest(id, testMaster = []) {
  return testMaster.find((test) => String(test.testId) === String(id)
    || String(test.testName).toLowerCase() === String(id || '').toLowerCase()) || {
    testId: id || 'LT-GEN',
    testName: typeof id === 'string' && Number.isNaN(Number(id)) ? id : 'Diagnostic Lab Test',
    ...getMeta(id),
  };
}

export function getLabSchema(name) {
  return SCHEMAS.find((schema) => schema.match.test(String(name || '').toLowerCase())) || null;
}

function mapApiStatus(status) {
  if (status === 'Sample collected') return 'In Progress';
  return status || 'Pending';
}

function mapApiTest(test) {
  const meta = getMeta(test.TestName);
  return {
    testId: String(test.LabtestId),
    testName: test.TestName,
    ...meta,
    normalValue: test.NormalName,
    charge: Number(test.TestCost),
    isActive: test.isActive,
  };
}

function mapApiOrder(order) {
  const timestamp = order.LabTestDate || '';
  const id = `api-lab-${order.LabPrescriptionId}`;
  return {
    id,
    backendId: order.LabPrescriptionId,
    labOrderId: order.LabPrescriptionId,
    patientDbId: order.PatientId,
    patientId: order.PatientId ? `PAT-${String(order.PatientId).padStart(4, '0')}` : '',
    patient: order.PatientName || 'Patient',
    doctorId: order.DoctorId || '',
    doctorName: order.DoctorName
      ? (order.DoctorName.startsWith('Dr.') ? order.DoctorName : `Dr. ${order.DoctorName}`)
      : '',
    createdAt: timestamp,
    testId: String(order.LabTestId || ''),
    status: mapApiStatus(order.Status),
    date: timestamp,
    time: '',
    sampleType: order.SampleType || '',
  };
}

function mapApiReport(report, orders) {
  const orderId = report.LabPrescriptionId;
  const order = orders.find((item) => String(item.backendId) === String(orderId));
  const reportDate = report.ReportDate ? new Date(report.ReportDate) : null;
  const testName = report.TestName || (order ? getLabTest(order.testId).testName : 'Lab Test');
  return {
    reportId: report.ReportId,
    backendId: report.ReportId,
    testId: order?.id || `api-lab-${orderId}`,
    labOrderId: orderId,
    patientId: order?.patientId || (report.PatientId ? `PAT-${String(report.PatientId).padStart(4, '0')}` : ''),
    patientName: report.PatientName || order?.patient || 'Patient',
    doctorId: order?.doctorId || '',
    doctorName: report.DoctorName
      ? (report.DoctorName.startsWith('Dr.') ? report.DoctorName : `Dr. ${report.DoctorName}`)
      : order?.doctorName || '',
    testName,
    sampleType: report.SampleType || order?.sampleType || '',
    normalValue: report.NormalName || '',
    actualReading: report.ActualReading || '',
    results: null,
    remarks: report.remarks || '',
    completedAt: reportDate && !Number.isNaN(reportDate.getTime()) ? reportDate.getTime() : report.ReportId,
    date: reportDate && !Number.isNaN(reportDate.getTime()) ? reportDate.toLocaleDateString() : '',
    time: reportDate && !Number.isNaN(reportDate.getTime()) ? reportDate.toLocaleTimeString() : '',
  };
}

function mapApiBill(bill, orders, testMaster) {
  const patientId = bill.PatientId ? `PAT-${String(bill.PatientId).padStart(4, '0')}` : '';
  const matchingOrder = orders.find((order) => (
    String(order.backendId || '') === String(bill.LabPrescriptionId || '')
  ));
  const matchingTest = matchingOrder ? getLabTest(matchingOrder.testId, testMaster) : null;
  return {
    id: String(bill.BillId),
    billId: bill.BillId,
    backendBillId: bill.BillId,
    patientId,
    patientDbId: bill.PatientId,
    patientName: matchingOrder?.patient || 'Patient',
    amount: Number(bill.Amount || 0),
    status: bill.BillStatus || 'Pending',
    date: bill.BillDate || '',
    source: 'Lab',
    billType: bill.BillType || 'Laboratory Test',
    labPrescriptionId: bill.LabPrescriptionId || '',
    testId: matchingOrder?.id || '',
    testName: matchingTest?.testName || '',
    BillId: bill.BillId,
    BillStatus: bill.BillStatus,
  };
}

function mergeLabBills(localBills, apiBills) {
  const apiById = new Map(apiBills.map((bill) => [String(bill.BillId), bill]));
  const merged = localBills.map((localBill) => {
    const backendId = localBill.backendBillId || localBill.BillId || localBill.billId;
    const apiBill = apiById.get(String(backendId));
    if (!apiBill) return localBill;
    apiById.delete(String(backendId));
    return { ...localBill, ...apiBill };
  });
  return [...merged, ...apiById.values()];
}

export function mergeLabData(localData, apiData) {
  return {
    ...localData,
    testMaster: apiData.testMaster,
    orders: apiData.orders,
    reports: apiData.reports,
    bills: mergeLabBills(localData.bills || [], apiData.bills || []),
  };
}

export async function fetchLabDataFromApi() {
  const [testsResponse, ordersResponse, reportsResponse, billsResponse] = await Promise.all([
    api.get('/lab/lab-tests/'),
    api.get('/lab/lab-prescriptions/'),
    api.get('/lab/lab-reports/'),
    api.get('/receptionist/bills/').catch((err) => {
      console.warn('Could not load bills for lab:', err?.response?.data || err.message);
      return { data: [] };
    }),
  ]);
  const testMaster = (testsResponse.data || []).filter((test) => test.isActive).map(mapApiTest);
  const orders = (ordersResponse.data || []).map(mapApiOrder);
  return {
    testMaster,
    orders,
    reports: (reportsResponse.data || []).map((report) => mapApiReport(report, orders)),
    bills: (billsResponse.data || [])
      .filter((bill) => String(bill.BillType || '').toLowerCase().includes('lab'))
      .map((bill) => mapApiBill(bill, orders, testMaster)),
  };
}

export async function updateApiLabPrescriptionStatus(id, status) {
  const response = await api.patch(`/lab/lab-prescriptions/${id}/`, { Status: status });
  return mapApiOrder(response.data);
}

export async function submitApiLabReport(id, report) {
  const response = await api.post(`/lab/lab-prescriptions/${id}/submit-report/`, report);
  return mapApiReport(response.data.report, [mapApiOrder(response.data.prescription)]);
}

export async function createApiLabBill(bill) {
  const response = await api.post('/receptionist/bills/', bill);
  return response.data;
}

export function loadLabData() {
  const patients = getStored(KEYS.patients, []);
  const testMaster = getStored(KEYS.tests, DEFAULT_TESTS).map((test) => {
    if (test.normalValue && !test.normalValue.includes('Reference Normal') && test.normalValue !== 'Standard Reference Range') return test;
    return { ...test, ...getMeta(test.testName) };
  });
  const sharedOrders = getStored(KEYS.orders, []);
  const orders = sharedOrders.flatMap((shared) => {
    const id = shared.labOrderId || shared.id;
    const backendId = shared.rawId;
    const tests = Array.isArray(shared.tests) && shared.tests.length ? shared.tests : [shared.testName || 'Clinical Diagnostic Test'];
    const patient = patients.find((item) => String(item.patientId ?? item.PatientId) === String(shared.patientId));
    return tests.map((name, index) => {
      let test = testMaster.find((item) => String(item.testName).toLowerCase() === String(name).toLowerCase());
      if (!test) {
        test = { testId: `LT${101 + testMaster.length}`, testName: name, ...getMeta(name) };
        testMaster.push(test);
      }
      return {
        id: tests.length > 1 ? `${id}-${index + 1}` : id,
        labOrderId: id,
        backendId: backendId ? Number(backendId) : undefined,
        patientId: shared.patientId || patient?.patientId || patient?.PatientId || '',
        patient: shared.patientName || patient?.name || patient?.Name || 'Patient',
        doctorId: shared.doctorId || '',
        doctorName: shared.doctorName || '',
        createdAt: shared.createdAt || '',
        testId: test.testId,
        status: shared.testStatuses?.[index] || shared.status || 'Pending',
        date: shared.date || '',
        time: shared.time || '',
      };
    });
  });
  return {
    orders,
    reports: getStored(KEYS.reports, []),
    bills: getStored(KEYS.bills, []).filter((bill) => bill.source === 'Lab'),
    testMaster,
  };
}

export function saveLabData(data) {
  const sharedOrders = getStored(KEYS.orders, []).map((shared) => {
    const id = String(shared.labOrderId || shared.id);
    const related = data.orders.filter((order) => String(order.labOrderId || order.id) === id);
    if (!related.length) return shared;
    const statuses = related.map((order) => order.status);
    return {
      ...shared,
      testStatuses: statuses,
      status: statuses.every((status) => status === 'Completed') ? 'Completed'
        : statuses.every((status) => status === 'Cancelled') ? 'Cancelled'
          : statuses.some((status) => status !== 'Pending') ? 'In Progress' : 'Pending',
    };
  });
  const bills = getStored(KEYS.bills, []);
  const localReports = data.reports.filter((report) => !report.backendId);
  localStorage.setItem(KEYS.orders, JSON.stringify(sharedOrders));
  localStorage.setItem(KEYS.reports, JSON.stringify(localReports));
  localStorage.setItem(KEYS.bills, JSON.stringify([...bills.filter((bill) => bill.source !== 'Lab'), ...data.bills]));
  localStorage.setItem(KEYS.tests, JSON.stringify(data.testMaster));
}

export async function syncLabOrders() {
  try {
    const res = await api.get('/lab/lab-prescriptions/');
    if (Array.isArray(res.data) && res.data.length > 0) {
      const [testsRes, patsRes] = await Promise.all([
        api.get('/lab/lab-tests/').catch(() => ({ data: [] })),
        api.get('/receptionist/patients/').catch(() => ({ data: [] }))
      ]);
      const tests = Array.isArray(testsRes.data) ? testsRes.data : [];
      const patients = Array.isArray(patsRes.data) ? patsRes.data : [];

      const currentOrders = getStored(KEYS.orders, []);
      const merged = [...currentOrders];

      res.data.forEach((lp) => {
        const orderId = 'LAB-' + lp.LabPrescriptionId;
        const matchedTest = tests.find((t) => t.LabtestId === lp.LabTestId);
        const matchedPat = patients.find((p) => p.PatientId === lp.PatientId);
        const testName = matchedTest?.TestName || 'Diagnostic Evaluation';

        if (!merged.some((m) => String(m.labOrderId) === orderId || String(m.id) === orderId || String(m.rawId) === String(lp.LabPrescriptionId))) {
          merged.unshift({
            labOrderId: orderId,
            id: orderId,
            rawId: lp.LabPrescriptionId,
            patientId: matchedPat ? 'PAT-' + matchedPat.PatientId : 'PAT-' + lp.PatientId,
            patientName: matchedPat?.Name || ('Patient #' + lp.PatientId),
            doctorName: 'Dr. Prateek Pradeep',
            date: lp.LabTestDate ? lp.LabTestDate.split('T')[0] : new Date().toISOString().split('T')[0],
            time: '10:00 AM',
            createdAt: Date.now(),
            tests: [testName],
            testName: testName,
            status: lp.Status || 'Pending',
            remarks: 'Suggested by Doctor'
          });
        }
      });

      localStorage.setItem(KEYS.orders, JSON.stringify(merged));
    }
  } catch (e) {
    console.warn('syncLabOrders fallback:', e);
  }
}
