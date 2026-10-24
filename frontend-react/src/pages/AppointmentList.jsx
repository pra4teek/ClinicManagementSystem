import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import receptionistService, { getApiErrorMessage } from '../services/receptionistService';

const formatDateTime = (value) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

export default function AppointmentList() {
  const [data, setData] = useState({ appointments: [], patients: [], doctors: [], tokens: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const results = await Promise.allSettled([receptionistService.getAppointments(), receptionistService.getPatients(), receptionistService.getDoctors(), receptionistService.getTokens()]);
      const failed = results.find((result) => result.status === 'rejected');
      if (failed) setError(getApiErrorMessage(failed.reason, 'Unable to load appointment records.'));
      setData({
        appointments: results[0].status === 'fulfilled' ? results[0].value : [],
        patients: results[1].status === 'fulfilled' ? results[1].value : [],
        doctors: results[2].status === 'fulfilled' ? results[2].value : [],
        tokens: results[3].status === 'fulfilled' ? results[3].value : [],
      });
      setLoading(false);
    };
    load();
  }, []);

  const patients = useMemo(() => new Map(data.patients.map((item) => [String(item.PatientId), item.Name])), [data.patients]);
  const doctors = useMemo(() => new Map(data.doctors.map((item) => [String(item.DoctorId), item.Name])), [data.doctors]);
  const tokens = useMemo(() => new Map(data.tokens.map((item) => [String(item.AppointmentId), item.TokenNo])), [data.tokens]);

  return <div className="card" style={{ padding: '1.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
      <div>
        <h2>Appointments List</h2>
        <p className="text-muted text-sm">Read-only appointment data from the receptionist API.</p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Link to="/receptionist" className="btn btn-sm btn-outline">Reception Portal</Link>
        <Link to="/appointments/new" className="btn btn-sm btn-outline">Booking unavailable</Link>
      </div>
    </div>
    {error && <p className="text-danger text-sm">{error}</p>}
    {loading ? <p className="empty-state">Loading appointments…</p> : <div className="table-responsive"><table className="table"><thead><tr><th>Token</th><th>Patient</th><th>Time</th><th>Doctor</th><th>Status</th></tr></thead><tbody>{data.appointments.length === 0 ? <tr><td colSpan="5" className="empty-state">No appointments found.</td></tr> : data.appointments.map((appointment) => <tr key={appointment.AppointmentId}><td><strong>{tokens.get(String(appointment.AppointmentId)) ?? '—'}</strong></td><td>{patients.get(String(appointment.PatientId)) || `Patient #${appointment.PatientId}`}</td><td>{formatDateTime(appointment.AppointmentDateTime)}</td><td>{doctors.get(String(appointment.DoctorId)) || `Doctor #${appointment.DoctorId}`}</td><td><span className="badge badge-scheduled">{appointment.AppointmentStatus}</span></td></tr>)}</tbody></table></div>}
  </div>;
}
