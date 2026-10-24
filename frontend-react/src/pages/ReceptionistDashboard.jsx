import { useEffect, useMemo, useState } from 'react';
import receptionistService, { getApiErrorMessage } from '../services/receptionistService';

const emptyPatient = { Name: '', Gender: '', DOB: '', PhoneNumber: '', Address: '', BloodGroup: '', Weight: '', Height: '' };

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`))
  : '—';

const ageFromDob = (dob) => {
  if (!dob) return '—';
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return '—';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1;
  return age;
};

const statusClass = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'completed') return 'completed';
  if (value === 'cancelled') return 'cancelled';
  if (value === 'paid') return 'paid';
  if (value === 'scheduled' || value === 'waiting') return 'scheduled';
  return 'unknown';
};

function PatientFields({ value, onChange, disabled = false }) {
  const update = (event) => onChange({ ...value, [event.target.name]: event.target.value });
  return <>
    <div className="receptionist-field"><label htmlFor="reception-name">Full name</label><input id="reception-name" name="Name" value={value.Name} onChange={update} disabled={disabled} required /></div>
    <div className="receptionist-form-grid">
      <div className="receptionist-field"><label htmlFor="reception-dob">Date of birth</label><input id="reception-dob" name="DOB" type="date" value={value.DOB} onChange={update} disabled={disabled} required /></div>
      <div className="receptionist-field"><label htmlFor="reception-gender">Gender</label><select id="reception-gender" name="Gender" value={value.Gender} onChange={update} disabled={disabled} required><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
    </div>
    <div className="receptionist-form-grid">
      <div className="receptionist-field"><label htmlFor="reception-phone">Phone</label><input id="reception-phone" name="PhoneNumber" inputMode="numeric" value={value.PhoneNumber} onChange={update} disabled={disabled} required /></div>
      <div className="receptionist-field"><label htmlFor="reception-blood">Blood group</label><select id="reception-blood" name="BloodGroup" value={value.BloodGroup} onChange={update} disabled={disabled} required><option value="">Select</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <option key={group}>{group}</option>)}</select></div>
    </div>
    <div className="receptionist-field"><label htmlFor="reception-address">Address</label><textarea id="reception-address" name="Address" value={value.Address} onChange={update} disabled={disabled} required /></div>
    <div className="receptionist-form-grid">
      <div className="receptionist-field"><label htmlFor="reception-weight">Weight (kg)</label><input id="reception-weight" name="Weight" type="number" min="0.1" step="0.1" value={value.Weight} onChange={update} disabled={disabled} required /></div>
      <div className="receptionist-field"><label htmlFor="reception-height">Height (cm)</label><input id="reception-height" name="Height" type="number" min="0.1" step="0.1" value={value.Height} onChange={update} disabled={disabled} required /></div>
    </div>
  </>;
}

export default function ReceptionistDashboard() {
  const [data, setData] = useState({ patients: [], appointments: [], tokens: [], doctors: [], bills: [] });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [queueQuery, setQueueQuery] = useState('');
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState(null);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [form, setForm] = useState(emptyPatient);
  const [formState, setFormState] = useState({ submitting: false, error: '', success: '' });
  const [selectedBill, setSelectedBill] = useState(null);

  const refresh = async () => {
    setLoading(true);
    const requests = await Promise.allSettled([
      receptionistService.getPatients(),
      receptionistService.getAppointments(),
      receptionistService.getTokens(),
      receptionistService.getDoctors(),
      receptionistService.getBills(),
    ]);
    const keys = ['patients', 'appointments', 'tokens', 'doctors', 'bills'];
    const nextData = {};
    const nextErrors = {};
    requests.forEach((result, index) => {
      const key = keys[index];
      if (result.status === 'fulfilled') nextData[key] = result.value;
      else {
        nextData[key] = [];
        nextErrors[key] = getApiErrorMessage(result.reason, `Unable to load ${key}.`);
      }
    });
    setData(nextData);
    setErrors(nextErrors);
    setPatientResults(null);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const patientById = useMemo(() => new Map(data.patients.map((patient) => [String(patient.PatientId), patient])), [data.patients]);
  const doctorById = useMemo(() => new Map(data.doctors.map((doctor) => [String(doctor.DoctorId), doctor])), [data.doctors]);
  const tokenByAppointment = useMemo(() => new Map(data.tokens.map((token) => [String(token.AppointmentId), token])), [data.tokens]);
  const visiblePatients = patientResults ?? data.patients;
  const todaysAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return data.appointments.filter((appointment) => new Date(appointment.AppointmentDateTime).toDateString() === today);
  }, [data.appointments]);

  const filteredAppointments = useMemo(() => {
    const q = queueQuery.trim().toLowerCase();
    if (!q) return todaysAppointments;
    return todaysAppointments.filter((appointment) => {
      const patient = patientById.get(String(appointment.PatientId));
      const token = tokenByAppointment.get(String(appointment.AppointmentId));
      const patientName = patient?.Name?.toLowerCase() || '';
      const patientId = String(appointment.PatientId || '');
      const tokenNo = token ? String(token.TokenNo) : '';
      return patientName.includes(q) || patientId.includes(q) || tokenNo.includes(q);
    });
  }, [todaysAppointments, queueQuery, patientById, tokenByAppointment]);

  const searchPatients = async (event) => {
    event.preventDefault();
    const query = patientQuery.trim();
    if (!query) {
      setPatientResults(null);
      return;
    }
    setSearchingPatients(true);
    try {
      setPatientResults(await receptionistService.getPatients(query));
      setErrors((current) => ({ ...current, patientSearch: '' }));
    } catch (error) {
      setPatientResults([]);
      setErrors((current) => ({ ...current, patientSearch: getApiErrorMessage(error, 'Unable to search patients.') }));
    } finally {
      setSearchingPatients(false);
    }
  };

  const registerPatient = async (event) => {
    event.preventDefault();
    setFormState({ submitting: true, error: '', success: '' });
    try {
      const patient = await receptionistService.createPatient({ ...form, Weight: Number(form.Weight), Height: Number(form.Height) });
      setData((current) => ({ ...current, patients: [...current.patients, patient].sort((a, b) => a.PatientId - b.PatientId) }));
      setForm(emptyPatient);
      setFormState({ submitting: false, error: '', success: `Patient ${patient.Name} registered successfully.` });
    } catch (error) {
      setFormState({ submitting: false, success: '', error: getApiErrorMessage(error, 'Unable to register patient.') });
    }
  };

  return (
    <div className="receptionist-content">
      <header className="receptionist-heading" id="overview">
        <div><p className="receptionist-eyebrow">Reception</p><h1>Patient &amp; appointment management</h1><p>Register patients, view today&apos;s queue, and review available billing records.</p></div>
        <button type="button" className="receptionist-button secondary" onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh data'}</button>
      </header>

      <section className="receptionist-stats" aria-label="Reception summary">
        <div className="receptionist-stat"><span className="receptionist-stat-icon">♙</span><span><span>Registered patients</span><strong>{loading ? '—' : data.patients.length}</strong></span></div>
        <div className="receptionist-stat"><span className="receptionist-stat-icon teal">▣</span><span><span>Today&apos;s appointments</span><strong>{loading ? '—' : todaysAppointments.length}</strong></span></div>
        <div className="receptionist-stat"><span className="receptionist-stat-icon amber">◷</span><span><span>Scheduled</span><strong>{loading ? '—' : todaysAppointments.filter((item) => ['Scheduled', 'Waiting'].includes(item.AppointmentStatus)).length}</strong></span></div>
        <div className="receptionist-stat"><span className="receptionist-stat-icon green">✓</span><span><span>Completed</span><strong>{loading ? '—' : todaysAppointments.filter((item) => item.AppointmentStatus === 'Completed').length}</strong></span></div>
      </section>

      <div className="receptionist-grid">
        <div className="receptionist-column">
          <section className="receptionist-card" id="queue">
            <div className="receptionist-card-header">
              <div>
                <h2>Appointment queue</h2>
                <p>Today&apos;s appointments from the receptionist API.</p>
              </div>
              <div className="receptionist-search-row">
                <input
                  className="receptionist-search"
                  value={queueQuery}
                  onChange={(event) => setQueueQuery(event.target.value)}
                  placeholder="Filter patient or token…"
                  aria-label="Filter appointment queue"
                />
                {queueQuery && (
                  <button
                    type="button"
                    className="receptionist-button secondary"
                    style={{ minHeight: '34px', padding: '0 10px', fontSize: '12px' }}
                    onClick={() => setQueueQuery('')}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {errors.appointments ? (
              <p className="receptionist-api-error receptionist-card-body">{errors.appointments}</p>
            ) : loading ? (
              <p className="receptionist-loading">Loading appointments…</p>
            ) : (
              <div className="receptionist-table-wrap">
                <table className="receptionist-table">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaysAppointments.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="receptionist-empty">No appointments booked for today.</td>
                      </tr>
                    ) : filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="receptionist-empty">No appointments matching &quot;{queueQuery}&quot; in today&apos;s queue.</td>
                      </tr>
                    ) : (
                      filteredAppointments.map((appointment) => {
                        const patient = patientById.get(String(appointment.PatientId));
                        const doctor = doctorById.get(String(appointment.DoctorId));
                        const token = tokenByAppointment.get(String(appointment.AppointmentId));
                        return (
                          <tr key={appointment.AppointmentId}>
                            <td>{token ? <span className="receptionist-token">{token.TokenNo}</span> : '—'}</td>
                            <td>
                              <strong>{patient?.Name || `Patient #${appointment.PatientId}`}</strong>
                              <span className="receptionist-subtext">ID {appointment.PatientId}</span>
                            </td>
                            <td>{doctor?.Name || `Doctor #${appointment.DoctorId}`}</td>
                            <td>{formatDateTime(appointment.AppointmentDateTime)}</td>
                            <td><span className={`receptionist-status ${statusClass(appointment.AppointmentStatus)}`}>{appointment.AppointmentStatus}</span></td>
                            <td>
                              <button
                                type="button"
                                className="receptionist-text-button"
                                disabled
                                title="Appointment status changes are not writable through the backend serializer."
                              >
                                Unavailable
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="receptionist-card" id="patients">
            <div className="receptionist-card-header"><div><h2>Patient registry</h2><p>Search by patient name, ID, phone, or address.</p></div><form className="receptionist-search-row" onSubmit={searchPatients}><input className="receptionist-search" value={patientQuery} onChange={(event) => setPatientQuery(event.target.value)} placeholder="Search patient…" aria-label="Search patients" /><button className="receptionist-button" type="submit" disabled={searchingPatients}>{searchingPatients ? 'Searching…' : 'Search'}</button></form></div>
            {errors.patients ? <p className="receptionist-api-error receptionist-card-body">{errors.patients}</p> : errors.patientSearch ? <p className="receptionist-api-error receptionist-card-body">{errors.patientSearch}</p> : loading ? <p className="receptionist-loading">Loading patients…</p> : <div className="receptionist-table-wrap"><table className="receptionist-table"><thead><tr><th>ID</th><th>Name</th><th>DOB</th><th>Age / gender</th><th>Blood group</th><th>Phone</th></tr></thead><tbody>{visiblePatients.length === 0 ? <tr><td colSpan="6" className="receptionist-empty">No patients found.</td></tr> : visiblePatients.map((patient) => <tr key={patient.PatientId}><td><strong>{patient.PatientId}</strong></td><td>{patient.Name}</td><td>{formatDate(patient.DOB)}</td><td>{ageFromDob(patient.DOB)} / {patient.Gender}</td><td>{patient.BloodGroup}</td><td>{patient.PhoneNumber}</td></tr>)}</tbody></table></div>}
          </section>
        </div>

        <div className="receptionist-column">
          <section className="receptionist-card" id="register"><div className="receptionist-card-header"><div><h2>Register patient</h2><p>All fields required by the Django patient model.</p></div></div><form className="receptionist-card-body receptionist-form" onSubmit={registerPatient}><PatientFields value={form} onChange={setForm} disabled={formState.submitting} />{formState.error && <p className="receptionist-form-error" role="alert">{formState.error}</p>}{formState.success && <p className="receptionist-form-success" role="status">{formState.success}</p>}<button type="submit" className="receptionist-button" disabled={formState.submitting}>{formState.submitting ? 'Registering…' : 'Register patient'}</button></form></section>
          <section className="receptionist-card"><div className="receptionist-card-header"><div><h2>Book appointment</h2><p>Appointment booking is currently unavailable.</p></div></div><div className="receptionist-card-body"><p className="receptionist-notice">The backend requires a valid <strong>ReceptionistId</strong>, but the current authentication flow does not expose a staff profile ID. It also has no field for the legacy reason-for-visit value. No appointment will be created.</p></div></section>
          <section className="receptionist-card"><div className="receptionist-card-header"><div><h2>Update appointment</h2><p>Status changes and cancellation are unavailable.</p></div></div><div className="receptionist-card-body"><p className="receptionist-notice">The backend marks <strong>AppointmentStatus</strong> as read-only. Token creation is also unavailable because <strong>TokenDate</strong> is required by the model but read-only in the API serializer.</p></div></section>
        </div>
      </div>

      <section className="receptionist-card receptionist-billing" id="billing">
        <div className="receptionist-card-header">
          <div>
            <h2>Billing</h2>
            <p>Existing receptionist bill records. Invoice preview is read-only and does not record payment.</p>
          </div>
        </div>
        {errors.bills ? (
          <p className="receptionist-api-error receptionist-card-body">{errors.bills}</p>
        ) : loading ? (
          <p className="receptionist-loading">Loading bills…</p>
        ) : (
          <div className="receptionist-table-wrap">
            <table className="receptionist-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.bills.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="receptionist-empty">No billing records found.</td>
                  </tr>
                ) : (
                  data.bills.map((bill) => (
                    <tr key={bill.BillId}>
                      <td>{formatDate(bill.BillDate)}</td>
                      <td><strong>{patientById.get(String(bill.PatientId))?.Name || `Patient #${bill.PatientId}`}</strong></td>
                      <td>{bill.BillType}</td>
                      <td>₹{Number(bill.Amount || 0).toFixed(2)}</td>
                      <td><span className={`receptionist-status ${statusClass(bill.BillStatus)}`}>{bill.BillStatus}</span></td>
                      <td>
                        <button type="button" className="receptionist-text-button" onClick={() => setSelectedBill(bill)}>
                          Preview bill
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {selectedBill && (
          <div className="receptionist-invoice-card" id="invoice-preview">
            <div className="receptionist-invoice-header">
              <div className="receptionist-invoice-brand">
                <div className="receptionist-invoice-brand-icon">⌁</div>
                <div>
                  <h3 className="receptionist-invoice-title">CarePoint Reception &middot; Bill Invoice</h3>
                  <p className="receptionist-invoice-subtitle">Official Billing Record</p>
                </div>
              </div>
              <button
                type="button"
                className="receptionist-button secondary"
                style={{ minHeight: '32px', padding: '0 12px', fontSize: '12px' }}
                onClick={() => setSelectedBill(null)}
              >
                Close preview
              </button>
            </div>

            <div className="receptionist-invoice-grid">
              <div className="receptionist-invoice-meta">
                <span className="receptionist-invoice-label">Invoice / Bill ID</span>
                <span className="receptionist-invoice-value">#{selectedBill.BillId}</span>
              </div>
              <div className="receptionist-invoice-meta">
                <span className="receptionist-invoice-label">Patient</span>
                <span className="receptionist-invoice-value">
                  {patientById.get(String(selectedBill.PatientId))?.Name || `Patient #${selectedBill.PatientId}`}
                </span>
              </div>
              <div className="receptionist-invoice-meta">
                <span className="receptionist-invoice-label">Patient ID</span>
                <span className="receptionist-invoice-value">PAT-{selectedBill.PatientId}</span>
              </div>
              <div className="receptionist-invoice-meta">
                <span className="receptionist-invoice-label">Bill Date</span>
                <span className="receptionist-invoice-value">{formatDate(selectedBill.BillDate)}</span>
              </div>
              <div className="receptionist-invoice-meta">
                <span className="receptionist-invoice-label">Bill Category</span>
                <span className="receptionist-invoice-value">{selectedBill.BillType || 'General Consultation'}</span>
              </div>
              <div className="receptionist-invoice-meta">
                <span className="receptionist-invoice-label">Payment Status</span>
                <div>
                  <span className={`receptionist-status ${statusClass(selectedBill.BillStatus)}`}>
                    {selectedBill.BillStatus || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="receptionist-invoice-summary">
              <div className="receptionist-invoice-row">
                <span>Charge Type: {selectedBill.BillType || 'Consultation / Service'}</span>
                <span>₹{Number(selectedBill.Amount || 0).toFixed(2)}</span>
              </div>
              <div className="receptionist-invoice-row total">
                <span>Total Recorded Amount</span>
                <span>₹{Number(selectedBill.Amount || 0).toFixed(2)}</span>
              </div>
            </div>

            <p className="receptionist-notice">
              Payment processing, pharmacy settlement, and balance collection are unavailable because the backend does not provide a safe settlement workflow.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
