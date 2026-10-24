import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import {
  MedicalCrossIcon,
  StethoscopeIcon,
  ClipboardIcon,
  PillIcon,
  FlaskIcon,
  SettingsIcon
} from '../components/Icons';

export default function Login() {
  const [username, setUsername] = useState('prateek');
  const [password, setPassword] = useState('prateek123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.login(username, password);
      const role = res.user?.role;
      if (role === 'Doctor') {
        navigate('/doctor');
      } else if (role === 'Receptionist') {
        navigate('/receptionist');
      } else if (role === 'Pharmacist') {
        navigate('/pharmacist');
      } else if (role === 'Lab Technician') {
        navigate('/lab-tests');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.message || 
        err.response?.data?.error || 
        'Invalid credentials. Please verify your username and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Access for each role
  const loginAsRole = (name, role, path) => {
    localStorage.setItem('token', `demo-token-${role.toLowerCase()}-${Date.now()}`);
    localStorage.setItem('user', JSON.stringify({ name, role, username: role.toLowerCase() }));
    navigate(path);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-page)',
      padding: '1.5rem'
    }}>
      <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem',
            boxShadow: '0 4px 14px rgba(0,87,184,0.25)'
          }}>
            <MedicalCrossIcon size={30} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
            CarePoint Clinic
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Sign in to access your clinical portal
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            marginBottom: '1.25rem',
            lineHeight: 1.4
          }}>
            {error}
          </div>
        )}

        {/* Regular Login Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. prateek or doctor"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Access Grid for All Roles */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Quick 1-Click Access by Role
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ justifyContent: 'center', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => loginAsRole('Dr. Prateek Pradeep', 'Doctor', '/doctor')}
            >
              <StethoscopeIcon size={14} color="var(--primary)" />
              Doctor
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => loginAsRole('Joel Jain', 'Receptionist', '/receptionist')}
            >
              <ClipboardIcon size={14} />
              Receptionist
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => loginAsRole('Adarsh Chandran', 'Pharmacist', '/pharmacist')}
            >
              <PillIcon size={14} />
              Pharmacist
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => loginAsRole('Malathi Sreekumar', 'Lab Technician', '/lab-tests')}
            >
              <FlaskIcon size={14} />
              Lab Tech
            </button>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline"
            style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => loginAsRole('Bala Weslin', 'Admin', '/dashboard')}
          >
            <SettingsIcon size={14} />
            Administrator (All Modules)
          </button>
        </div>
      </div>
    </div>
  );
}
