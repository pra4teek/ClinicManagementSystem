import api from './api.js';

const TEAM_USERS = [
  { username: 'prateek', password: 'prateek123', role: 'Doctor', name: 'Dr. Prateek Pradeep' },
  { username: 'doctor', password: '123', role: 'Doctor', name: 'Dr. Prateek Pradeep' },
  { username: 'Dr.Arun', password: 'arun123', role: 'Doctor', name: 'Dr. Arun' },
  { username: 'reception', password: '123', role: 'Receptionist', name: 'Joel Jain' },
  { username: 'pharma', password: '123', role: 'Pharmacist', name: 'Adarsh Chandran' },
  { username: 'labtech', password: '123', role: 'Lab Technician', name: 'Malathi Sreekumar' },
  { username: 'admin', password: '123', role: 'Admin', name: 'Bala Weslin' },
];

const authService = {
  login: async (username, password) => {
    const trimmedUser = (username || '').trim();
    const trimmedPass = (password || '').trim();

    // 1. If logging in as admin or general user, prioritize Django backend login for real JWT token
    try {
      const response = await api.post('/admin/login/', {
        Username: trimmedUser,
        Password: trimmedPass,
      });

      if (response.data && (response.data.access || response.data.token)) {
        const token = response.data.access || response.data.token;
        const userObj = {
          username: trimmedUser,
          role: 'Admin',
          name: trimmedUser.toLowerCase() === 'admin' ? 'Bala Weslin' : trimmedUser,
        };
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userObj));
        return { success: true, user: userObj, token };
      }
    } catch (err) {
      // If admin login failed with admin123, retry with 123 (from seed_db.py)
      if (trimmedUser.toLowerCase() === 'admin' && (trimmedPass === 'admin123' || trimmedPass === '123')) {
        try {
          const altPass = trimmedPass === 'admin123' ? '123' : 'admin123';
          const retryRes = await api.post('/admin/login/', {
            Username: 'admin',
            Password: altPass,
          });
          if (retryRes.data && (retryRes.data.access || retryRes.data.token)) {
            const token = retryRes.data.access || retryRes.data.token;
            const userObj = {
              username: 'admin',
              role: 'Admin',
              name: 'Bala Weslin',
            };
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userObj));
            return { success: true, user: userObj, token };
          }
        } catch {}
      }

      const errorMsg = err.response?.data?.error || err.response?.data?.detail;
      if (err.response && err.response.status === 403) {
        throw new Error(errorMsg || 'Admin access required.');
      }
    }

    // 2. Check local team credentials fallback (for offline demo mode)
    const localMatch = TEAM_USERS.find(
      (u) => u.username.toLowerCase() === trimmedUser.toLowerCase() && (u.password === trimmedPass || (trimmedUser.toLowerCase() === 'admin' && trimmedPass === 'admin123'))
    );

    if (localMatch) {
      // Non-dotted demo token string so api.js never attaches forged Authorization headers
      const token = `demo-token-${localMatch.role.toLowerCase().replace(/\s+/g, '')}-${Date.now()}`;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(localMatch));
      return { success: true, user: localMatch, token };
    }

    throw new Error('Invalid username or password. Check credentials or use 1-Click Quick Demo Access below.');
  },

  // 1-Click Administrator Login helper
  loginAdminDemo: async () => {
    const adminUser = { name: 'Bala Weslin', role: 'Admin', username: 'admin' };
    
    // Call POST /admin/login/ with { Username: 'admin', Password: '123' } first to get real signed JWT!
    const credentialPairs = [
      { Username: 'admin', Password: '123' },
      { Username: 'admin', Password: 'admin123' }
    ];

    for (const cred of credentialPairs) {
      try {
        const response = await api.post('/admin/login/', cred);
        if (response.data && (response.data.access || response.data.token)) {
          const token = response.data.access || response.data.token;
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(adminUser));
          return { success: true, user: adminUser, token };
        }
      } catch {
        // Try next credential
      }
    }

    // Offline fallback demo token without dots
    const demoToken = `demo-token-admin-${Date.now()}`;
    localStorage.setItem('token', demoToken);
    localStorage.setItem('user', JSON.stringify(adminUser));
    return { success: true, user: adminUser, token: demoToken };
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!(localStorage.getItem('token') || localStorage.getItem('accessToken'));
  },
};

export default authService;
