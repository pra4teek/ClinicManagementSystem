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
  { match: /cbc|complete blood count|blood count/, sampleType: 'Whole Blood (EDTA)', normalValue: 'WBC: 4.5-11.0 ×10³/µL, RBC: 4.5-5.5 ×10⁶/µL, Platelets: 150-450 ×10³/µL', charge: 300 },
  { match: /fbs|fasting blood sugar|fasting glucose|glucose/, sampleType: 'Fluoride Plasma', normalValue: '70 - 99 mg/dL (Normal Fasting)', charge: 150 },
  { match: /ppbs|post prandial/, sampleType: 'Fluoride Plasma', normalValue: '< 140 mg/dL', charge: 150 },
  { match: /hba1c|glycated/, sampleType: 'Whole Blood (EDTA)', normalValue: '< 5.7% (Normal), 5.7-6.4% (Prediabetic)', charge: 450 },
  { match: /lipid|cholesterol/, sampleType: 'Serum', normalValue: 'Total Chol: < 200 mg/dL, Triglycerides: < 150 mg/dL, HDL: > 40 mg/dL', charge: 400 },
  { match: /urine/, sampleType: 'Clean Catch Midstream Urine', normalValue: 'Color: Pale Yellow, pH: 5.0-7.0, Protein: Nil, Sugar: Nil', charge: 200 },
  { match: /thyroid|tsh|t3|t4/, sampleType: 'Serum', normalValue: 'TSH: 0.4 - 4.2 µIU/mL, Free T4: 0.8 - 1.8 ng/dL', charge: 500 },
  { match: /lft|liver/, sampleType: 'Serum', normalValue: 'Total Bilirubin: 0.2-1.2 mg/dL, SGOT/AST: 8-40 U/L, SGPT/ALT: 7-56 U/L', charge: 450 },
  { match: /kft|kidney|renal|creatinine/, sampleType: 'Serum', normalValue: 'Serum Creatinine: 0.6-1.2 mg/dL, Blood Urea: 15-40 mg/dL', charge: 400 },
  { match: /x-ray|chest|radiology/, sampleType: 'Radiology / Imaging', normalValue: 'Clear lung fields, normal cardiothoracic ratio (<0.5), no active lesion', charge: 350 },
  { match: /hemoglobin|hb/, sampleType: 'Whole Blood (EDTA)', normalValue: 'Male: 13.5-17.5 g/dL, Female: 12.0-15.5 g/dL', charge: 180 },
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
    match: /cbc|complete blood count|blood count/,
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
  { match: /hemoglobin|hb/, params: [{ id: 'hb_single', name: 'Hemoglobin', unit: 'g/dL', ref: '12.0 - 16.0 g/dL', normalVal: 14, highVal: 8.2, min: 2.5, max: 25 }] },
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

export function loadLabData() {
  const patients = getStored(KEYS.patients, []);
  const testMaster = getStored(KEYS.tests, DEFAULT_TESTS).map((test) => {
    if (test.normalValue && !test.normalValue.includes('Reference Normal') && test.normalValue !== 'Standard Reference Range') return test;
    return { ...test, ...getMeta(test.testName) };
  });
  const sharedOrders = getStored(KEYS.orders, []);
  const orders = sharedOrders.flatMap((shared) => {
    const id = shared.labOrderId || shared.id;
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
  localStorage.setItem(KEYS.orders, JSON.stringify(sharedOrders));
  localStorage.setItem(KEYS.reports, JSON.stringify(data.reports));
  localStorage.setItem(KEYS.bills, JSON.stringify([...bills.filter((bill) => bill.source !== 'Lab'), ...data.bills]));
  localStorage.setItem(KEYS.tests, JSON.stringify(data.testMaster));
}
