import { useNavigate } from 'react-router-dom';

export default function AppointmentForm() {
  const navigate = useNavigate();

  return <div style={{ maxWidth: '700px', margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}><h2>Book New Appointment</h2><button type="button" className="btn btn-sm btn-outline" onClick={() => navigate('/appointments')}>Back to Appointments</button></div>
    <div className="card" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '.75rem' }}>Appointment booking unavailable</h3>
      <p className="text-muted" style={{ marginBottom: '1rem' }}>The verified receptionist API requires <strong>PatientId</strong>, <strong>ReceptionistId</strong>, <strong>DoctorId</strong>, <strong>DepartmentId</strong>, and <strong>AppointmentDateTime</strong>.</p>
      <p className="text-danger text-sm">The current application does not expose a legitimate receptionist staff ID, and the backend has no field for the legacy reason-for-visit value. This page will not create an appointment or token.</p>
    </div>
  </div>;
}
