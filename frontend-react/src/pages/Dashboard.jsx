import React from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import {
  StethoscopeIcon,
  CalendarIcon,
  UsersIcon,
  PillIcon,
  FlaskIcon,
  SettingsIcon
} from '../components/Icons';

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
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0,87,184,0.1)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <StethoscopeIcon size={24} color="var(--primary)" />
          </div>
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
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245,158,11,0.1)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <CalendarIcon size={24} color="#f59e0b" />
          </div>
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
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16,185,129,0.1)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <UsersIcon size={24} color="#10b981" />
          </div>
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
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99,102,241,0.1)',
            color: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <PillIcon size={24} color="#6366f1" />
          </div>
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
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(236,72,153,0.1)',
            color: '#ec4899',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <FlaskIcon size={24} color="#ec4899" />
          </div>
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
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(100,116,139,0.1)',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <SettingsIcon size={24} color="#64748b" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Clinic Administration</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Department setup, staff management, role permissions, and clinic oversight.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/admin" className="btn btn-sm btn-primary">Admin Portal</Link>
            <Link to="/admin?tab=departments" className="btn btn-sm btn-outline">Departments</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
