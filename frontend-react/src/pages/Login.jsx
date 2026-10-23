import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

export default function Login() {
  const [username, setUsername] = useState('doctor');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.error || 
        'Django backend not connected on :8000. Use one of the Quick Demo Logins below to test each module directly!'
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Access for each role
  const loginAsRole = (name, role, path) => {
    localStorage.setItem('token', `demo-token-${role.toLowerCase()}`);
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
          <div style={{ fontSize: '2.5rem' }}>⚕️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
            CarePoint Clinic
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Sign in to access your portal
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
              placeholder="e.g. doctor"
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
            {loading ? 'Connecting to Django...' : 'Sign In via Django API'}
          </button>
        </form>

        {/* Quick Access Grid for All Roles */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            ⚡ Quick Demo Access by Role
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ justifyContent: 'center', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 600 }}
              onClick={() => loginAsRole('Dr. Prateek Pradeep', 'Doctor', '/doctor')}
            >
              🩺 Doctor
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ justifyContent: 'center' }}
              onClick={() => loginAsRole('Joel Jain', 'Receptionist', '/appointments')}
            >
              📋 Receptionist
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ justifyContent: 'center' }}
              onClick={() => loginAsRole('Adarsh Chandran', 'Pharmacist', '/prescriptions')}
            >
              💊 Pharmacist
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ justifyContent: 'center' }}
              onClick={() => loginAsRole('Malathi Sreekumar', 'Lab Technician', '/lab-tests')}
            >
              🔬 Lab Tech
            </button>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline"
            style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
            onClick={() => loginAsRole('Bala Weslin', 'Admin', '/dashboard')}
          >
            ⚙️ Administrator (All Modules Dashboard)
          </button>
        </div>
      </div>
    </div>
  );
}
