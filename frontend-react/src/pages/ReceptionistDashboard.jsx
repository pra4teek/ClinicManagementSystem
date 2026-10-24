
import { Link } from 'react-router-dom';

export default function ReceptionistDashboard() {
  return (
    <main className="page-container">
      <header className="page-header">
        <div>
          <h1>Receptionist Dashboard</h1>
          <p>Manage patients and appointments.</p>
        </div>
      </header>

      <section className="dashboard-actions">
        <Link to="/patients">Patient Registry</Link>
        <Link to="/patients/new">Register Patient</Link>
        <Link to="/appointments">Appointment Queue</Link>
        <Link to="/appointments/new">Book Appointment</Link>
      </section>
    </main>
  );
}
