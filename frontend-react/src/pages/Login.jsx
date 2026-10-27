import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/style.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.login(username.trim(), password.trim());
      const role = res.user?.role;
      if (role === 'Doctor') {
        navigate('/doctor');
      } else if (role === 'Receptionist') {
        navigate('/receptionist');
      } else if (role === 'Pharmacist') {
        navigate('/pharmacist');
      } else if (role === 'Lab Technician') {
        navigate('/lab-tests');
      } else if (role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.message || 
        err.response?.data?.error || 
        'Invalid username or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-page)',
      padding: '1.5rem',
      backgroundImage: 'radial-gradient(ellipse 900px 600px at 80% 20%, rgba(0,87,184,.07) 0%, transparent 70%)'
    }}>
      <div className="login-wrapper">
        <div className="login-side">
          <img
            src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            alt="Clinic"
          />
          <div className="login-side-overlay"></div>
          <div className="login-side-logo">
            <div className="side-icon">⚕️</div>
            <div>
              <div className="side-brand-name">CarePoint</div>
              <div className="side-tagline">Clinic Management System</div>
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="mobile-brand">
            <div className="side-icon">⚕️</div>
            <span>CarePoint Clinic</span>
          </div>

          <div className="login-card-header">
            <h1>Welcome back</h1>
            <p>Sign in to access your portal</p>
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-light, #fee2e2)',
              color: 'var(--danger, #dc2626)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm, 8px)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              lineHeight: 1.4,
              border: '1px solid rgba(220, 38, 38, 0.2)'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} id="loginForm">
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                className="form-control"
                placeholder="doctor"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-control"
                  placeholder="******"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-eye"
                  id="eyeBtn"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  👁
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              id="signInBtn"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
