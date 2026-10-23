import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getLabSchema, getLabTest, loadLabData, saveLabData } from '../services/labService';
import '../styles/labPages.css';

function restoreValues(id, data) {
  const order = data.orders.find((item) => String(item.id) === String(id));
  const report = data.reports.find((item) => String(item.testId) === String(id));
  const test = order ? getLabTest(order.testId, data.testMaster) : null;
  const schema = test ? getLabSchema(test.testName) : null;
  const values = {};
  if (schema && report?.results) {
    report.results.forEach((result) => {
      const parameter = schema.params.find((item) => item.name.toLowerCase() === String(result.test || '').toLowerCase());
      if (parameter) values[parameter.id] = parameter.isText ? result.reading : String(result.reading).replace(/[^\d.-]/g, '');
    });
  }
  return values;
}

export default function LabReportForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data] = useState(() => loadLabData());
  const [orderId, setOrderId] = useState(() => String(location.state?.orderId || ''));

  const order = data.orders.find((item) => String(item.id) === String(orderId));
  const test = order ? getLabTest(order.testId, data.testMaster) : null;
  const schema = test ? getLabSchema(test.testName) : null;
  const existingReport = data.reports.find((item) => String(item.testId) === String(order?.id));
  const [values, setValues] = useState(() => restoreValues(
    location.state?.orderId,
    data,
  ));
  const [normalValue, setNormalValue] = useState(() => existingReport?.normalValue || test?.normalValue || '');
  const [actualReading, setActualReading] = useState(() => existingReport?.actualReading || '');
  const [remarks, setRemarks] = useState(() => existingReport?.remarks || '');
  const [error, setError] = useState('');

  const chooseOrder = (nextId) => {
    const nextOrder = data.orders.find((item) => String(item.id) === String(nextId));
    const nextTest = nextOrder ? getLabTest(nextOrder.testId, data.testMaster) : null;
    const nextReport = data.reports.find((item) => String(item.testId) === String(nextId));
    setOrderId(nextId);
    setValues(restoreValues(nextId, data));
    setNormalValue(nextReport?.normalValue || nextTest?.normalValue || '');
    setActualReading(nextReport?.actualReading || '');
    setRemarks(nextReport?.remarks || '');
    setError('');
  };

  const compiledReading = useMemo(() => schema?.params
    .filter((parameter) => String(values[parameter.id] || '').trim())
    .map((parameter) => `${parameter.name}: ${values[parameter.id]} ${parameter.unit}`)
    .join(', ') || '', [schema, values]);

  const setParameter = (id, value) => {
    setValues((current) => ({ ...current, [id]: value }));
    setError('');
  };

  const applyPreset = (type) => {
    if (!schema) return;
    const nextValues = Object.fromEntries(schema.params.map((parameter) => [
      parameter.id,
      String(type === 'high' ? parameter.highVal : parameter.normalVal),
    ]));
    setValues(nextValues);
    setRemarks(type === 'high'
      ? 'Elevated/abnormal parameters noted. Clinical correlation and follow-up recommended.'
      : 'All measured parameters are within healthy biological reference intervals.');
    setError('');
  };

  const validate = () => {
    if (schema) {
      for (const parameter of schema.params) {
        const value = String(values[parameter.id] ?? '').trim();
        if (!value) return `Please enter a measured value for "${parameter.name}".`;
        if (!parameter.isText) {
          const number = Number(value);
          if (!Number.isFinite(number)) return `"${parameter.name}" must be a valid numeric measurement.`;
          if (number <= 0) return `"${parameter.name}" cannot be zero or negative.`;
          if (parameter.min !== undefined && number < parameter.min) return `${parameter.name} is below the minimum clinical threshold of ${parameter.min} ${parameter.unit}.`;
          if (parameter.max !== undefined && number > parameter.max) return `${parameter.name} exceeds the maximum clinical threshold of ${parameter.max} ${parameter.unit}.`;
        }
      }
      return '';
    }
    const value = actualReading.trim();
    if (!value) return 'Please enter the actual reading.';
    if (/^-?(?:0+(?:\.0*)?|\.0+)$/.test(value)) return 'Actual reading cannot be zero.';
    if (!Number.isNaN(Number(value)) && Number(value) < 0) return 'Actual reading cannot be negative.';
    return '';
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!order || !test) {
      setError('Select a valid lab test before entering a report.');
      return;
    }
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    const timestamp = Date.now();
    const now = new Date(timestamp);
    const results = schema?.params.map((parameter) => ({
      test: parameter.name,
      sampleType: test.sampleType,
      normalValue: parameter.ref,
      reading: parameter.isText ? values[parameter.id].trim() : `${values[parameter.id].trim()} ${parameter.unit}`,
    })) || null;
    const report = {
      reportId: timestamp,
      completedAt: timestamp,
      testId: order.id,
      labOrderId: order.labOrderId || order.id,
      patientId: order.patientId,
      patientName: order.patient,
      doctorId: order.doctorId || 'DOC-101',
      doctorName: order.doctorName || 'Dr. Prateek Pradeep',
      testName: test.testName,
      sampleType: test.sampleType,
      normalValue: normalValue.trim() || test.normalValue || 'Standard Reference Range',
      actualReading: results ? results.map((item) => `${item.test}: ${item.reading}`).join(', ') : actualReading.trim(),
      results,
      remarks: remarks.trim(),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      technicianName: 'Lab Technician',
    };
    const existingIndex = data.reports.findIndex((item) => String(item.testId) === String(order.id));
    const reports = existingIndex === -1
      ? [report, ...data.reports]
      : data.reports.map((item, index) => index === existingIndex ? report : item);
    const orders = data.orders.map((item) => String(item.id) === String(order.id) ? { ...item, status: 'Completed' } : item);
    const testMaster = data.testMaster.map((item) => String(item.testId) === String(test.testId)
      ? { ...item, normalValue: report.normalValue } : item);
    const nextData = { ...data, orders, reports, testMaster };
    try {
      saveLabData(nextData);
      navigate('/lab-tests', { state: { section: 'billing', selectedTestId: order.id } });
    } catch {
      setError('Unable to save the lab report. Please check browser storage and try again.');
    }
  };

  return (
    <div className="lab-form-page">
      <div className="page-header lab-form-header">
        <div><h1 className="page-title">Process Patient Test</h1><p className="page-subtitle">Enter results and publish the report to the doctor</p></div>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => navigate('/lab-tests')}>← Back to Lab Tests</button>
      </div>
      <section className="card">
        <div className="card-header"><h2 className="card-title">Lab Report Details</h2></div>
        <form className="card-body" onSubmit={handleSubmit}>
          {!location.state?.orderId && <div className="form-group">
            <label className="form-label" htmlFor="lab-order-select">Select Lab Test</label>
            <select className="form-control" id="lab-order-select" value={orderId} onChange={(event) => chooseOrder(event.target.value)}>
              <option value="">Select a pending or in-progress test</option>
              {data.orders.filter((item) => item.status === 'Pending' || item.status === 'In Progress')
                .map((item) => <option key={item.id} value={item.id}>{item.id} - {item.patient} - {getLabTest(item.testId, data.testMaster).testName}</option>)}
            </select>
          </div>}

          {!order && <p className="lab-empty">Choose a lab order to begin processing.</p>}
          {order && test && <>
            <div className="form-row">
              <ReadOnlyField label="Patient ID" value={order.patientId} />
              <ReadOnlyField label="Patient Name" value={order.patient} />
              <ReadOnlyField label="Doctor Name" value={order.doctorName || 'Dr. Prateek Pradeep'} />
              <ReadOnlyField label="Test Name" value={test.testName} />
              <ReadOnlyField label="Sample Type" value={test.sampleType} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="normal-value">Normal Reference Value / Range (Editable)</label>
              <input id="normal-value" className="form-control" value={normalValue} onChange={(event) => setNormalValue(event.target.value)} />
              <small className="form-hint">Established healthy clinical reference interval. You can edit this to match your lab analyzer standards.</small>
            </div>

            {error && <div className="lab-validation" role="alert"><strong>Invalid Clinical Reading:</strong> {error}</div>}
            {schema && <div className="lab-param-card">
              <div className="lab-param-header">
                <strong>Test Component Parameters</strong>
                <div className="lab-preset-actions">
                  <button type="button" className="lab-preset normal" onClick={() => applyPreset('normal')}>Fill Normal Preset</button>
                  <button type="button" className="lab-preset high" onClick={() => applyPreset('high')}>Fill High / Abnormal</button>
                  <button type="button" className="lab-preset" onClick={() => { setValues({}); setActualReading(''); setRemarks(''); }}>Clear</button>
                </div>
              </div>
              {schema.params.map((parameter) => <div className="lab-param-row" key={parameter.id}>
                <span><strong>{parameter.name}</strong><small>Ref: {parameter.ref}</small></span>
                <input
                  className="form-control"
                  type={parameter.isText ? 'text' : 'number'}
                  step={parameter.isText ? undefined : 'any'}
                  placeholder={parameter.isText ? parameter.ref : `e.g. ${parameter.normalVal}`}
                  value={values[parameter.id] || ''}
                  aria-label={parameter.name}
                  onChange={(event) => setParameter(parameter.id, event.target.value)}
                />
                <span className="lab-unit">{parameter.unit}</span>
              </div>)}
            </div>}

            <div className="form-group">
              <label className="form-label" htmlFor="actual-reading">{schema ? 'Compiled Reading Summary' : 'Actual Reading'}</label>
              <input
                id="actual-reading"
                className="form-control"
                value={schema ? compiledReading : actualReading}
                readOnly={Boolean(schema)}
                placeholder={schema ? 'Auto-compiled from component parameters above' : 'Enter analyzer reading with units'}
                onChange={(event) => setActualReading(event.target.value)}
              />
              <small className="form-hint">Enter measured value from analyzer. Standalone zero or blank entries are not accepted.</small>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="lab-remarks">Technologist Remarks</label>
              <textarea id="lab-remarks" className="form-control" rows="3" placeholder="Enter remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">Save Lab Report</button>
          </>}
        </form>
      </section>
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return <div className="form-group"><label className="form-label">{label}</label><input className="form-control" value={value || ''} readOnly /></div>;
}
