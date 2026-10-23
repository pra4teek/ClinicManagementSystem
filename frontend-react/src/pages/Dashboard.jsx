import React from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';

export default function Dashboard() {
  const user = authService.getCurrentUser() || { name: 'Doctor', role: 'Doctor' };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
          Welcome back, {user.name || user.username || 'User'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Role: <strong style={{ color: 'var(--primary)' }}>{user.role || 'Doctor'}</strong> &mdash; Quick access to clinic modules and operations.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* Doctor Module Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🩺</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Doctor Workspace</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Patient queue, clinical examination, vitals, prescriptions, and lab orders.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/doctor" className="btn btn-sm btn-primary">Workspace</Link>
            <Link to="/consultations/new" className="btn btn-sm btn-outline">+ Consultation</Link>
            <Link to="/prescriptions" className="btn btn-sm btn-outline">Prescriptions</Link>
          </div>
        </div>

        {/* Appointments Card (Receptionist) */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📅</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Appointments (Reception)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            View today's scheduled tokens, queue check-in, and slot booking.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/appointments" className="btn btn-sm btn-outline">View Queue</Link>
            <Link to="/appointments/new" className="btn btn-sm btn-primary">+ Book Token</Link>
          </div>
        </div>

        {/* Patients Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👥</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Patient Directory</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Registered patients, medical histories, demographics, and registration.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/patients" className="btn btn-sm btn-outline">Patients List</Link>
            <Link to="/patients/new" className="btn btn-sm btn-primary">+ New Patient</Link>
          </div>
        </div>

        {/* Pharmacy Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💊</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Pharmacy & Medicines</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Medicine inventory, stock levels, dosages, batches, and dispensing.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/medicines" className="btn btn-sm btn-outline">Medicine Stock</Link>
            <Link to="/medicines/new" className="btn btn-sm btn-primary">+ Add Medicine</Link>
          </div>
        </div>

        {/* Lab Tests Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔬</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Laboratory Tests</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Diagnostic catalog, reference ranges, specimen tests, and report entry.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/lab-tests" className="btn btn-sm btn-outline">Tests Catalog</Link>
            <Link to="/lab-reports/new" className="btn btn-sm btn-primary">+ Enter Results</Link>
          </div>
        </div>

        {/* Admin Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚙️</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Clinic Administration</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Department setup, staff management, role permissions, and clinic oversight.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/departments" className="btn btn-sm btn-outline">Departments</Link>
            <Link to="/departments/new" className="btn btn-sm btn-primary">+ Add Dept</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
