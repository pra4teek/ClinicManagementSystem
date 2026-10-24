import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/receptionist.css';

const navItems = [
  ['#overview', 'Dashboard', '▦'],
  ['#register', 'Register Patient', '♙'],
  ['#queue', 'Queue', '◷'],
  ['#billing', 'Billing', '▤'],
];

export default function ReceptionistLayout() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser() || { name: 'Receptionist', role: 'Receptionist' };
  const initials = String(user.name || user.username || 'RC')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const signOut = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="receptionist-shell">
      <aside className="receptionist-sidebar">
        <div>
          <NavLink to="/receptionist" className="receptionist-brand" aria-label="CarePoint Reception Portal">
            <span className="receptionist-brand-mark">⌁</span>
            <span><strong>CarePoint</strong><small>Reception Portal</small></span>
          </NavLink>
          <p className="receptionist-nav-label">Workspace</p>
          <nav className="receptionist-nav" aria-label="Receptionist navigation">
            {navItems.map(([href, label, icon]) => (
              <a href={href} key={href} className="receptionist-nav-link">
                <span aria-hidden="true">{icon}</span>{label}
              </a>
            ))}
          </nav>
        </div>
        <div className="receptionist-sidebar-footer">
          <div className="receptionist-user">
            <span className="receptionist-avatar">{initials}</span>
            <span><strong>{user.name || user.username || 'Receptionist'}</strong><small>Front Desk</small></span>
          </div>
          <button className="receptionist-signout" type="button" onClick={signOut}>⇥ Sign Out</button>
        </div>
      </aside>
      <main className="receptionist-main"><Outlet /></main>
    </div>
  );
}
