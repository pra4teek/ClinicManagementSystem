import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

export default function Navbar() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser() || { name: 'Dr. Prateek Pradeep', role: 'Doctor' };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-brand">
          <span style={{ fontSize: '1.5rem' }}>⚕️</span>
          <div>
            <span className="brand-name">CarePoint</span>
            <span className="brand-badge" style={{ marginLeft: '0.5rem' }}>Clinic System</span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {user.name || user.username}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user.role || 'Doctor'}
            </div>
          </div>
          <button className="btn btn-sm btn-outline" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

