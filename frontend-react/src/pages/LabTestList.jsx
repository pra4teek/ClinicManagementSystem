import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getLabTest, loadLabData, saveLabData } from '../services/labService';
import '../styles/labPages.css';

const SECTIONS = [
  ['orders', '⚗', 'Lab Tests'],
  ['patient', '◷', 'Process Test'],
  ['reports', '▤', 'Reports'],
  ['billing', '▣', 'Billing'],
];

export default function LabTestList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(() => loadLabData());
  const [section, setSection] = useState(() => location.state?.section || 'orders');
  const [reportSearch, setReportSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState(() => location.state?.selectedTestId || '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const refresh = () => setData(loadLabData());
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const counts = useMemo(() => ({
    total: data.orders.length,
    pending: data.orders.filter((order) => order.status === 'Pending').length,
    progress: data.orders.filter((order) => order.status === 'In Progress').length,
    completed: data.orders.filter((order) => order.status === 'Completed').length,
    reports: data.reports.length,
  }), [data]);

  const openSection = (value) => {
    setSection(value);
    setMessage('');
    if (value === 'reports') setReportSearch('');
  };

  const processOrder = (order) => {
    if (order.status === 'Pending') {
      const next = {
        ...data,
        orders: data.orders.map((item) => String(item.id) === String(order.id)
          ? { ...item, status: 'In Progress' } : item),
      };
      saveLabData(next);
      setData(next);
    }
    navigate('/lab-reports/new', { state: { orderId: order.id } });
  };

  const createBill = () => {
    if (!selectedBill) {
      setMessage('Please select a completed test.');
      return;
    }
    const order = data.orders.find((item) => String(item.id) === String(selectedBill));
    if (!order) {
      setMessage('Test not found.');
      return;
    }
    if (data.bills.some((bill) => String(bill.testId) === String(selectedBill))) {
      setMessage('Bill already created for this test.');
      return;
    }
    const test = getLabTest(order.testId, data.testMaster);
    const billId = Date.now();
    const bill = {
      id: String(billId),
      billId,
      testId: order.id,
      patientId: order.patientId,
      patientName: order.patient,
      testName: test.testName,
      source: 'Lab',
      amount: test.charge,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
    };
    const next = { ...data, bills: [...data.bills, bill] };
    saveLabData(next);
    setData(next);
    setSelectedBill('');
    setMessage('Bill created successfully and sent to receptionist.');
  };

  const filteredReports = [...data.reports]
    .sort((a, b) => (Number(b.completedAt || b.reportId) || 0) - (Number(a.completedAt || a.reportId) || 0))
    .filter((report) => {
      const term = reportSearch.trim().toLowerCase();
      return !term || String(report.patientName || '').toLowerCase().includes(term)
        || String(report.patientId || '').toLowerCase().includes(term);
    });

  const filteredOrders = data.orders.filter((order) => {
    const term = orderSearch.trim().toLowerCase();
    return !term || String(order.patientId || '').toLowerCase().includes(term)
      || String(order.patient || '').toLowerCase().includes(term);
  });

  const renderQueue = (status, heading, emptyMessage, patientSearch = '') => {
    const term = patientSearch.trim().toLowerCase();
    const statusOrders = data.orders.filter((order) => order.status === status);
    const queue = statusOrders.filter((order) => !term
      || String(order.patientId || '').toLowerCase().includes(term)
      || String(order.patient || '').toLowerCase().includes(term));
    return (
      <section className="card lab-card">
        <div className="card-header"><h2 className="card-title">{heading}</h2></div>
        <div className="card-body table-responsive">
          <table className="table">
            <thead><tr><th>Test ID</th><th>Patient ID</th><th>Patient Name</th><th>Doctor Name</th><th>Test Name</th><th>Action</th></tr></thead>
            <tbody>
              {!queue.length && <tr><td colSpan="6" className="lab-empty">
                {term && statusOrders.length ? 'No tests match that patient name or ID.' : emptyMessage}
              </td></tr>}
              {queue.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td><td>{order.patientId}</td><td>{order.patient}</td><td>{order.doctorName || '—'}</td>
                  <td>{getLabTest(order.testId, data.testMaster).testName}</td>
                  <td>{status === 'Completed'
                    ? <button className="btn btn-sm btn-outline" onClick={() => openSection('reports')}>View Report</button>
                    : <button className="btn btn-sm btn-primary" onClick={() => processOrder(order)}>{status === 'Pending' ? 'Process' : 'Continue'}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <div className="lab-page">
      <aside className="lab-sidebar">
        <div className="lab-sidebar-brand"><span className="lab-brand-icon">⚕</span><span><strong>CarePoint</strong><small>Lab Technician</small></span></div>
        <p className="lab-nav-label">Workspace</p>
        <nav className="lab-sidebar-nav" aria-label="Lab technician navigation">
          {SECTIONS.map(([id, icon, title]) => (
            <button key={id} className={`lab-nav-item ${section === id ? 'active' : ''}`} onClick={() => openSection(id)}>
              <span aria-hidden="true">{icon}</span>{title}
            </button>
          ))}
        </nav>
        <div className="lab-sidebar-footer">
          <div className="lab-user"><span className="lab-avatar">LT</span><span><strong>Lab Technician</strong><small>CarePoint Clinic</small></span></div>
          <button className="lab-signout" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('accessToken'); localStorage.removeItem('user'); navigate('/login'); }}>⇥ Sign Out</button>
        </div>
      </aside>

      <main className="lab-main">
        <header className="page-header lab-page-header">
          <div><h1 className="page-title">Lab Technician Dashboard</h1><p className="page-subtitle">Manage lab tests, patient reports and billing</p></div>
          <button className="btn btn-primary" onClick={() => openSection('orders')}>View Lab Tests</button>
        </header>

        {message && <div className="lab-message" role="status">{message}<button onClick={() => setMessage('')} aria-label="Dismiss">×</button></div>}

        <div className="stats-grid lab-stats">
          {[
            ['⚗', counts.total, 'Total Lab Tests', 'blue'],
            ['◷', counts.pending, 'Pending Tests', 'amber'],
            ['⇄', counts.progress, 'In Progress', 'teal'],
            ['✓', counts.completed, 'Completed Tests', 'green'],
            ['▤', counts.reports, 'Reports', 'indigo'],
          ].map(([icon, count, label, tone]) => <div className="stat-card" key={label}>
            <span className={`stat-icon ${tone}`}>{icon}</span><span><strong className="stat-value">{count}</strong><span className="stat-label">{label}</span></span>
          </div>)}
        </div>

        {section === 'orders' && <>
          <section className="card lab-card">
            <div className="card-body">
              <label className="form-label" htmlFor="order-search">Search lab tests by patient name or ID</label>
              <input
                id="order-search"
                type="search"
                className="form-control"
                placeholder="Enter patient name or patient ID"
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
              />
            </div>
          </section>
          <section className="card lab-card">
            <div className="card-header"><h2 className="card-title">All Lab Tests</h2></div>
            <div className="card-body table-responsive">
              <table className="table">
                <thead><tr><th>Test ID</th><th>Patient ID</th><th>Patient Name</th><th>Doctor Name</th><th>Test Name</th><th>Sample Type</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {!filteredOrders.length && <tr><td colSpan="8" className="lab-empty">
                    {data.orders.length ? 'No lab tests match that patient name or ID.' : 'No lab tests available'}
                  </td></tr>}
                  {filteredOrders.map((order) => {
                    const test = getLabTest(order.testId, data.testMaster);
                    return <tr key={order.id}>
                      <td>{order.id}</td><td>{order.patientId}</td><td>{order.patient}</td><td>{order.doctorName || '—'}</td><td>{test.testName}</td><td>{test.sampleType}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>{order.status === 'Completed'
                        ? <button className="btn btn-sm btn-outline" onClick={() => openSection('reports')}>View Report</button>
                        : <button className="btn btn-sm btn-primary" onClick={() => processOrder(order)}>{order.status === 'Pending' ? 'Process' : 'Continue'}</button>}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </section>
          {renderQueue('Pending', 'Pending Queue', 'No pending tests.')}
          {renderQueue('In Progress', 'In Progress Queue', 'No tests in progress.')}
          {renderQueue('Completed', 'Completed Queue', 'No completed tests.')}
        </>}

        {section === 'patient' && <>
          <section className="card lab-card">
            <div className="card-body">
              <label className="form-label" htmlFor="order-search">Search tests by patient name or ID</label>
              <input
                id="order-search"
                type="search"
                className="form-control"
                placeholder="Enter patient name or patient ID"
                value={pendingSearch}
                onChange={(event) => setPendingSearch(event.target.value)}
              />
            </div>
          </section>
          {renderQueue('Pending', 'Pending Queue', 'No pending tests.', pendingSearch)}
        </>}

        {section === 'reports' && <>
          <section className="card lab-card">
            <div className="card-body">
              <label className="form-label" htmlFor="report-search">Search reports by patient name or ID</label>
              <input id="report-search" type="search" className="form-control" placeholder="Enter patient name or patient ID" value={reportSearch} onChange={(event) => setReportSearch(event.target.value)} />
            </div>
          </section>
          {!filteredReports.length && <p className="lab-empty">{data.reports.length ? 'No reports match that patient name or ID.' : 'No reports available.'}</p>}
          {filteredReports.map((report) => <ReportCard report={report} key={report.reportId || report.completedAt} />)}
        </>}

        {section === 'billing' && <>
          <section className="card lab-card">
            <div className="card-header"><h2 className="card-title">Create Lab Bill</h2></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label" htmlFor="billing-test">Select Completed Test</label>
                <select className="form-control" id="billing-test" value={selectedBill} onChange={(event) => setSelectedBill(event.target.value)}>
                  <option value="">Select Completed Test</option>
                  {data.orders.filter((order) => order.status === 'Completed' && !data.bills.some((bill) => String(bill.testId) === String(order.id)))
                    .map((order) => <option key={order.id} value={order.id}>{order.id} - {getLabTest(order.testId, data.testMaster).testName} - {order.patient}</option>)}
                </select>
              </div>
              <div className="form-row">
                <ReadOnlyField label="Patient ID" value={data.orders.find((order) => String(order.id) === String(selectedBill))?.patientId} />
                <ReadOnlyField label="Test Name" value={data.orders.find((order) => String(order.id) === String(selectedBill)) ? getLabTest(data.orders.find((order) => String(order.id) === String(selectedBill)).testId, data.testMaster).testName : ''} />
                <ReadOnlyField label="Test Charge" value={data.orders.find((order) => String(order.id) === String(selectedBill)) ? `₹${getLabTest(data.orders.find((order) => String(order.id) === String(selectedBill)).testId, data.testMaster).charge}` : ''} />
                <ReadOnlyField label="Payment Status" value={selectedBill ? 'Pending' : 'Pending'} />
              </div>
              <button className="btn btn-primary" onClick={createBill}>Create Bill</button>
            </div>
          </section>
          <section className="card lab-card">
            <div className="card-header"><h2 className="card-title">Billing History</h2></div>
            <div className="card-body table-responsive">
              <table className="table">
                <thead><tr><th>Bill ID</th><th>Patient ID</th><th>Test Name</th><th>Amount</th><th>Payment Status</th></tr></thead>
                <tbody>
                  {!data.bills.length && <tr><td colSpan="5" className="lab-empty">No bills available.</td></tr>}
                  {data.bills.map((bill) => <tr key={bill.id || bill.billId}><td>{bill.billId || bill.id}</td><td>{bill.patientId || '--'}</td><td>{bill.testName || '--'}</td><td>₹{bill.amount}</td><td><StatusBadge status={bill.status} /></td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        </>}
      </main>
    </div>
  );
}

function StatusBadge({ status }) {
  const style = status === 'Completed' || status === 'Paid' ? 'badge-completed'
    : status === 'In Progress' ? 'badge-in-progress'
      : status === 'Cancelled' ? 'badge-cancelled' : 'badge-scheduled';
  return <span className={`badge ${style}`}>{status || 'Pending'}</span>;
}

function ReadOnlyField({ label, value }) {
  return <div className="form-group"><label className="form-label">{label}</label><input className="form-control" readOnly value={value || ''} /></div>;
}

function ReportCard({ report }) {
  const results = Array.isArray(report.results) && report.results.length
    ? report.results
    : [{ test: report.testName, normalValue: report.normalValue, reading: report.actualReading }];
  return <section className="card lab-card">
    <div className="card-header lab-report-header"><div><h2 className="card-title">CarePoint Clinic</h2><p className="page-subtitle">Laboratory Report</p></div><div><strong>Date:</strong> {report.date}<br /><strong>Time:</strong> {report.time}</div></div>
    <div className="card-body">
      <div className="form-row"><div><strong>Patient ID:</strong> {report.patientId}<br /><strong>Patient Name:</strong> {report.patientName}</div><div><strong>Doctor Name:</strong> {report.doctorName}</div></div>
      <hr className="lab-divider" />
      <div className="table-responsive"><table className="table"><thead><tr><th>Test Name</th><th>Normal Value</th><th>Actual Reading</th></tr></thead>
        <tbody>{results.map((result, index) => <tr key={`${result.test}-${index}`}><td><strong>{result.test || report.testName}</strong></td><td>{result.normalValue || report.normalValue}</td><td><strong>{result.reading}</strong></td></tr>)}</tbody>
      </table></div>
      <div className="lab-report-remarks"><strong>Remarks</strong><p>{report.remarks || 'No remarks'}</p></div>
    </div>
  </section>;
}
