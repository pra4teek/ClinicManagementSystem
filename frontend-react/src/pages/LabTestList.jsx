import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import NotificationBell from '../components/NotificationBell';
import {
  fetchLabDataFromApi,
  getLabTest,
  loadLabData,
  mergeLabData,
  saveLabData,
  syncLabOrders,
  createApiLabBill,
  updateApiLabPrescriptionStatus,
} from '../services/labService';
import '../styles/labPages.css';

const SECTIONS = [
  ['orders', '⚗', 'Lab Test Orders'],
  ['patient', '◷', 'Process Test'],
  ['reports', '▤', 'Reports'],
  ['billing', '▣', 'Billing'],
];

function formatOrderDateTime(order) {
  if (order.createdAt) {
    const timestamp = order.createdAt;
    const date = new Date(typeof timestamp === 'number' || /^\d+$/.test(String(timestamp))
      ? Number(timestamp) : timestamp);
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
  }

  if (!order.date) return '—';
  const date = new Date(order.date);
  if (Number.isNaN(date.getTime())) return '—';
  const formattedDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return order.time ? `${formattedDate}, ${order.time}` : formattedDate;
}

export default function LabTestList() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const displayName = currentUser?.name || 'Malathi Sreekumar';
  const displayRole = currentUser?.role || 'Lab Technician';
  const userInitials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const [data, setData] = useState(() => loadLabData());
  const [section, setSection] = useState(() => location.state?.section || 'orders');
  const [reportSearch, setReportSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [billingSearch, setBillingSearch] = useState('');
  const [billingStatus, setBillingStatus] = useState('All');
  const [selectedBill, setSelectedBill] = useState(() => location.state?.selectedTestId || '');
  const [selectedReportId, setSelectedReportId] = useState('');
  const [message, setMessage] = useState('');
  const [creatingBill, setCreatingBill] = useState(false);
  const [createdBill, setCreatedBill] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const refresh = async () => {
      try {
        await syncLabOrders();
        const apiData = await fetchLabDataFromApi();
        if (isMounted) {
          setData(mergeLabData(loadLabData(), apiData));
          setMessage('');
        }
      } catch (error) {
        if (isMounted) {
          setData(loadLabData());
          const detail = error.response?.data?.detail || error.message;
          setMessage(`Unable to load lab data from Django: ${detail}. Showing locally saved data.`);
        }
      }
    };
    refresh();
    const poll = setInterval(refresh, 15000);
    window.addEventListener('storage', refresh);
    window.addEventListener('cms_rx_updated', refresh);
    return () => {
      isMounted = false;
      clearInterval(poll);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('cms_rx_updated', refresh);
    };
  }, [location]);

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

  const reportKey = (report) => String(report.reportId || report.backendId || report.completedAt);

  const openReportForOrder = (order) => {
    const report = data.reports.find((item) => String(item.labOrderId) === String(order.backendId)
      || String(item.testId) === String(order.id));
    if (report) setSelectedReportId(reportKey(report));
    openSection('reports');
  };

  const showAllReports = () => {
    setSelectedReportId('');
    setReportSearch('');
  };

  const processOrder = async (order) => {
    if (order.status === 'Pending') {
      try {
        if (order.backendId) {
          await updateApiLabPrescriptionStatus(order.backendId, 'In Progress');
        } else {
          const next = {
            ...data,
            orders: data.orders.map((item) => String(item.id) === String(order.id)
              ? { ...item, status: 'In Progress' } : item),
          };
          saveLabData(next);
          setData(next);
        }
      } catch (error) {
        const detail = error.response?.data?.detail || error.message;
        setMessage(`Unable to update the lab test status: ${detail}`);
        return;
      }
    }
    navigate('/lab-reports/new', { state: { orderId: order.id } });
  };

  const createBill = async () => {
    if (creatingBill) return;
    if (!selectedBill) {
      setMessage('Please select a completed test.');
      return;
    }
    const order = data.orders.find((item) => String(item.id) === String(selectedBill));
    if (!order) {
      setMessage('Test not found.');
      return;
    }
    if (billForOrder(order)) {
      setMessage('Bill already created for this test.');
      return;
    }
    const test = getLabTest(order.testId, data.testMaster);
    const billId = Date.now();
    let bill = {
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

    setCreatingBill(true);
    try {
      // Always create the record through Django so the receptionist can see it.
      // Local-only storage is not enough when the two roles use different sessions.
      const patientId = Number(order.patientDbId || String(order.patientId).replace(/\D/g, ''));
      if (!Number.isInteger(patientId) || patientId <= 0) {
        throw new Error('The completed test is not linked to a database patient.');
      }
      const savedBill = await createApiLabBill({
        PatientId: patientId,
        BillDate: bill.date,
        Amount: test.charge,
        BillStatus: 'Pending',
        BillType: 'Laboratory Test',
      });
      bill = {
        ...bill,
        ...savedBill,
        id: String(savedBill.BillId),
        billId: savedBill.BillId,
        testId: order.id,
        patientId: order.patientId,
        patientName: order.patient,
        testName: test.testName,
        source: 'Lab',
        amount: test.charge,
        status: savedBill.BillStatus || 'Pending',
        date: savedBill.BillDate || bill.date,
      };
    } catch (error) {
      setMessage(`Unable to send the lab bill to reception: ${error.response?.data?.detail || error.message}`);
      setCreatingBill(false);
      return;
    }
    const next = { ...data, bills: [...data.bills, bill] };
    saveLabData(next);
    setData(next);
    setSelectedBill('');
    setCreatedBill(bill);
    setCreatingBill(false);
    setMessage('Bill created successfully and sent to receptionist.');
    window.dispatchEvent(new Event('cms_billing_updated'));
    window.setTimeout(() => {
      document.getElementById('billing-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const filteredReports = [...data.reports]
    .sort((a, b) => (Number(b.completedAt || b.reportId) || 0) - (Number(a.completedAt || a.reportId) || 0))
    .filter((report) => {
      const term = reportSearch.trim().toLowerCase();
      return !term || String(report.patientName || '').toLowerCase().includes(term)
        || String(report.patientId || '').toLowerCase().includes(term);
    });
  const visibleReports = selectedReportId
    ? filteredReports.filter((report) => reportKey(report) === selectedReportId)
    : filteredReports;

  const selectedOrder = data.orders.find((order) => String(order.id) === String(selectedBill));
  const billForOrder = (order) => {
    if (!order) return null;
    const testName = getLabTest(order.testId, data.testMaster).testName.trim().toLowerCase();
    return data.bills.find((bill) => String(bill.patientId) === String(order.patientId)
      && String(bill.testName || '').trim().toLowerCase() === testName);
  };
  const selectedOrderBill = billForOrder(selectedOrder);
  const billingHistory = useMemo(() => {
    const uniqueBills = new Map();
    data.bills.forEach((bill) => {
      const key = `${String(bill.patientId || '').toLowerCase()}::${String(bill.testName || '').trim().toLowerCase()}`;
      const existing = uniqueBills.get(key);
      if (!existing || bill.status === 'Paid' || existing.status !== 'Paid') {
        uniqueBills.set(key, bill);
      }
    });
    return [...uniqueBills.values()];
  }, [data.bills]);
  const filteredBillingHistory = useMemo(() => {
    const term = billingSearch.trim().toLowerCase();
    return billingHistory.filter((bill) => {
      const matchesSearch = !term
        || String(bill.patientId || '').toLowerCase().includes(term)
        || String(bill.patientName || '').toLowerCase().includes(term);
      const matchesStatus = billingStatus === 'All'
        || String(bill.status || '').toLowerCase() === billingStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [billingHistory, billingSearch, billingStatus]);
  const billableCompletedOrders = data.orders.filter((order) => order.status === 'Completed' && !billForOrder(order));

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
                    ? <button className="btn btn-sm btn-outline" onClick={() => openReportForOrder(order)}>View Report</button>
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
        <div className="lab-sidebar-brand"><span className="lab-brand-icon">⚗</span><span><strong>CarePoint</strong><small>Lab Technician</small></span></div>
        <p className="lab-nav-label">Workspace</p>
        <nav className="lab-sidebar-nav" aria-label="Lab technician navigation">
          {SECTIONS.map(([id, icon, title]) => (
            <button key={id} className={`lab-nav-item ${section === id ? 'active' : ''}`} onClick={() => openSection(id)}>
              <span aria-hidden="true">{icon}</span>{title}
            </button>
          ))}
        </nav>
        <div className="lab-sidebar-footer">
          <div className="lab-user"><span className="lab-avatar">{userInitials}</span><span><strong>{displayName}</strong><small>{displayRole}</small></span></div>
          <button className="lab-signout" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('accessToken'); localStorage.removeItem('user'); navigate('/login'); }}>⇥ Sign Out</button>
        </div>
      </aside>

      <main className="lab-main">
        <header className="page-header lab-page-header">
          <div><h1 className="page-title">Lab Technician Dashboard</h1><p className="page-subtitle">Manage lab tests, patient reports and billing</p></div>
          <div className="lab-header-actions"><NotificationBell role="Lab Technician" /><button className="btn btn-primary" onClick={() => openSection('orders')}>View Lab Tests</button></div>
        </header>

        {message && <div className="lab-message" role="status">{message}<button onClick={() => setMessage('')} aria-label="Dismiss">×</button></div>}

        <div className="stats-grid lab-stats">
          {[
            ['flask', counts.total, 'Active Test Orders'],
            ['clock', counts.pending, 'Pending Tests'],
            ['progress', counts.progress, 'In Progress'],
            ['check', counts.completed, 'Completed Tests'],
          ].map(([icon, count, label]) => <div className="stat-card" key={label}>
            <LabStatIcon name={icon} /><span><strong className="stat-value">{count}</strong><span className="stat-label">{label}</span></span>
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
            <div className="card-header"><h2 className="card-title">All Lab Test Orders (Doctor Prescriptions)</h2><p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>Showing active patient lab test requests ordered by doctors ({counts.total} orders)</p></div>
            <div className="card-body table-responsive">
              <table className="table">
                <thead><tr><th>Test ID</th><th>Patient ID</th><th>Patient Name</th><th>Doctor Name</th><th>Requested Date &amp; Time</th><th>Test Name</th><th>Sample Type</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {!filteredOrders.length && <tr><td colSpan="9" className="lab-empty">
                    {data.orders.length ? 'No lab tests match that patient name or ID.' : 'No lab tests available'}
                  </td></tr>}
                  {filteredOrders.map((order) => {
                    const test = getLabTest(order.testId, data.testMaster);
                    return <tr key={order.id}>
                      <td>{order.id}</td><td>{order.patientId}</td><td>{order.patient}</td><td>{order.doctorName || '—'}</td><td>{formatOrderDateTime(order)}</td><td>{test.testName}</td><td>{test.sampleType}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>{order.status === 'Completed'
                        ? <button className="btn btn-sm btn-outline" onClick={() => openReportForOrder(order)}>View Report</button>
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
              {selectedReportId && <button className="btn btn-sm btn-outline" onClick={showAllReports}>View All Reports</button>}
              <label className="form-label" htmlFor="report-search">Search reports by patient name or ID</label>
              <input id="report-search" type="search" className="form-control" placeholder="Enter patient name or patient ID" value={reportSearch} onChange={(event) => setReportSearch(event.target.value)} />
            </div>
          </section>
          {!visibleReports.length && <p className="lab-empty">{data.reports.length ? 'No reports match that patient name or ID.' : 'No reports available.'}</p>}
          {visibleReports.map((report) => <ReportCard report={report} key={reportKey(report)} />)}
        </>}

        {section === 'billing' && <>
          <section className="card lab-card">
            <div className="card-header"><h2 className="card-title">Create Lab Bill</h2></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label" htmlFor="billing-test">Select Completed Test</label>
                <select className="form-control" id="billing-test" value={selectedBill} onChange={(event) => {
                  setSelectedBill(event.target.value);
                  setCreatedBill(null);
                }}>
                  <option value="">Select Completed Test</option>
                  {billableCompletedOrders
                    .map((order) => <option key={order.id} value={order.id}>{order.id} - {getLabTest(order.testId, data.testMaster).testName} - {order.patient}</option>)}
                </select>
              </div>
              <div className="form-row">
                <ReadOnlyField label="Patient ID" value={selectedOrder?.patientId} />
                <ReadOnlyField label="Test Name" value={selectedOrder ? getLabTest(selectedOrder.testId, data.testMaster).testName : ''} />
                <ReadOnlyField label="Test Charge" value={selectedOrder ? `₹${getLabTest(selectedOrder.testId, data.testMaster).charge}` : ''} />
                <ReadOnlyField label="Payment Status" value={selectedOrderBill?.status || 'Pending'} />
              </div>
              <button type="button" className="btn btn-primary bill-submit-button" onClick={createBill} disabled={creatingBill} aria-busy={creatingBill}>
                {creatingBill && <span className="bill-submit-spinner" aria-hidden="true" />}
                {creatingBill ? 'Sending to Reception…' : 'Create Bill'}
              </button>
              {createdBill && (
                <div className="lab-bill-success" role="status" aria-live="polite">
                  <strong>Bill created successfully</strong>
                  <span>Bill #{createdBill.billId || createdBill.id} for {createdBill.patientName || 'the selected patient'} is ready in Billing History.</span>
                </div>
              )}
            </div>
          </section>
          <section className="card lab-card" id="billing-history">
            <div className="card-header"><h2 className="card-title">Billing History</h2></div>
            <div className="card-body">
              <div className="billing-history-filters">
                <div>
                  <label className="form-label" htmlFor="billing-history-search">Search by Patient ID or Name</label>
                  <input id="billing-history-search" type="search" className="form-control" placeholder="e.g. PAT-0001 or patient name" value={billingSearch} onChange={(event) => setBillingSearch(event.target.value)} />
                </div>
                <div>
                  <label className="form-label" htmlFor="billing-status-filter">Payment Status</label>
                  <select id="billing-status-filter" className="form-control" value={billingStatus} onChange={(event) => setBillingStatus(event.target.value)}>
                    <option value="All">All Bills</option>
                    <option value="Pending">Not Paid / Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="card-body table-responsive">
              <table className="table">
                <thead><tr><th>Bill ID</th><th>Patient ID</th><th>Patient Name</th><th>Test Name</th><th>Amount</th><th>Payment Status</th></tr></thead>
                <tbody>
                  {!filteredBillingHistory.length && <tr><td colSpan="6" className="lab-empty">No bills match your search or status filter.</td></tr>}
                  {filteredBillingHistory.map((bill) => <tr key={bill.id || bill.billId}><td>{bill.billId || bill.id}</td><td>{bill.patientId || '--'}</td><td>{bill.patientName || '--'}</td><td>{bill.testName || '--'}</td><td>₹{bill.amount}</td><td><StatusBadge status={bill.status} /></td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        </>}
      </main>
    </div>
  );
}

function LabStatIcon({ name }) {
  const iconPaths = {
    flask: <><path d="M10 2v7.5a2 2 0 0 1-.2.9L4.7 20.6a1 1 0 0 0 .9 1.4h12.8a1 1 0 0 0 .9-1.4l-5.1-10.2a2 2 0 0 1-.2-.9V2" /><path d="M8 2h8M7 16h10" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    progress: <><path d="M7 3v18M17 3v18M7 8h10M7 12h10M7 16h10" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    report: <><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v5h4M9 12h6M9 16h6" /></>,
  };

  return (
    <svg className="lab-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
      {iconPaths[name]}
    </svg>
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
