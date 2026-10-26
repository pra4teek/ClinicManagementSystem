import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import receptionistService, { getApiErrorMessage } from '../services/receptionistService';

export default function AppointmentForm() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    PatientId: '',
    DoctorId: '',
    AppointmentDateTime: '',
  });
  const [state, setState] = useState({ submitting: false, error: '', success: '' });

  useEffect(() => {
    async function loadData() {
      try {
        const [pts, dcs] = await Promise.all([
          receptionistService.getPatients(),
          receptionistService.getDoctors(),
        ]);
        setPatients(pts);
        setDoctors(dcs);
      } catch (err) {
        setState((prev) => ({ ...prev, error: getApiErrorMessage(err, 'Failed to load doctors/patients.') }));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState({ submitting: true, error: '', success: '' });
    try {
      const res = await receptionistService.createAppointment({
        PatientId: Number(formData.PatientId),
        DoctorId: Number(formData.DoctorId),
        AppointmentDateTime: formData.AppointmentDateTime || new Date().toISOString(),
        AppointmentStatus: 'Scheduled',
      });
      setState({
        submitting: false,
        error: '',
        success: `Appointment #${res.AppointmentId} booked successfully! Token issued.`,
      });
      window.dispatchEvent(new Event('cms_rx_updated'));
      setTimeout(() => navigate('/appointments'), 1000);
    } catch (err) {
      setState({
        submitting: false,
        error: getApiErrorMessage(err, 'Failed to book appointment.'),
        success: '',
      });
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Book New Appointment</h2>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => navigate('/appointments')}>
          Back to Appointments
        </button>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        {state.error && <div style={{ marginBottom: '1rem', color: '#b91c1c', background: '#fef2f2', padding: '0.75rem', borderRadius: '6px' }}>{state.error}</div>}
        {state.success && <div style={{ marginBottom: '1rem', color: '#15803d', background: '#f0fdf4', padding: '0.75rem', borderRadius: '6px' }}>{state.success}</div>}

        {loading ? (
          <p>Loading doctors and patients…</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                Select Patient *
              </label>
              <select
                className="form-control"
                value={formData.PatientId}
                onChange={(e) => setFormData({ ...formData, PatientId: e.target.value })}
                required
                disabled={state.submitting}
              >
                <option value="">-- Choose patient --</option>
                {patients.map((p) => (
                  <option key={p.PatientId} value={p.PatientId}>
                    {p.Name} (ID: PAT-{p.PatientId}) - {p.PhoneNumber}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                Select Doctor *
              </label>
              <select
                className="form-control"
                value={formData.DoctorId}
                onChange={(e) => setFormData({ ...formData, DoctorId: e.target.value })}
                required
                disabled={state.submitting}
              >
                <option value="">-- Choose doctor --</option>
                {doctors.map((d) => (
                  <option key={d.DoctorId} value={d.DoctorId}>
                    Dr. {d.Name} ({d.Specialization || 'General Practice'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                Appointment Date &amp; Time *
              </label>
              <input
                type="datetime-local"
                className="form-control"
                value={formData.AppointmentDateTime}
                onChange={(e) => setFormData({ ...formData, AppointmentDateTime: e.target.value })}
                required
                disabled={state.submitting}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={state.submitting}>
              {state.submitting ? 'Booking appointment…' : 'Book Appointment & Issue Token'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
