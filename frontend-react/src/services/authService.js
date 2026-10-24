import api from './api.js';

const authService = {
  login: async (username, password) => {
    const trimmedUser = (username || '').trim();
    const trimmedPass = (password || '').trim();

    if (!trimmedUser || !trimmedPass) {
      throw new Error('Please enter both username and password.');
    }

    // Try general login endpoint first (/api/login/), fallback to /api/admin/login/
    let response = null;
    let lastError = null;

    try {
      response = await api.post('/login/', {
        Username: trimmedUser,
        Password: trimmedPass,
      });
    } catch (err) {
      lastError = err;
      // If general /login/ endpoint failed or was not reachable, try /admin/login/
      try {
        response = await api.post('/admin/login/', {
          Username: trimmedUser,
          Password: trimmedPass,
        });
      } catch (adminErr) {
        lastError = adminErr;
      }
    }

    // If still failed and user is admin trying with admin123, retry with 123
    if (!response && trimmedUser.toLowerCase() === 'admin' && trimmedPass === 'admin123') {
      try {
        response = await api.post('/admin/login/', {
          Username: 'admin',
          Password: '123',
        });
      } catch (retryErr) {
        lastError = retryErr;
      }
    }

    if (response?.data && (response.data.access || response.data.token)) {
      const token = response.data.access || response.data.token;
      const returnedUser = response.data.user || {};
      const userObj = {
        userId: returnedUser.userId || returnedUser.UserId,
        username: returnedUser.username || returnedUser.Username || trimmedUser,
        role: returnedUser.role || returnedUser.Role || (trimmedUser.toLowerCase() === 'admin' ? 'Admin' : 'Staff'),
        name: returnedUser.name || returnedUser.Name || (trimmedUser.toLowerCase() === 'admin' ? 'Bala Weslin' : trimmedUser),
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userObj));
      return { success: true, user: userObj, token };
    }

    const errorMsg =
      lastError?.response?.data?.error ||
      lastError?.response?.data?.detail ||
      lastError?.message ||
      'Invalid username or password.';
    throw new Error(errorMsg);
  },

  // 1-Click Administrator Login helper
  loginAdminDemo: async () => {
    // Authenticate directly against the MySQL User row created by seed_db.py
    const credentialPairs = [
      { Username: 'admin', Password: '123' },
      { Username: 'admin', Password: 'admin123' },
    ];

    let lastError = null;
    for (const cred of credentialPairs) {
      try {
        const response = await api.post('/admin/login/', cred);
        if (response.data && (response.data.access || response.data.token)) {
          const token = response.data.access || response.data.token;
          const returnedUser = response.data.user || {};
          const userObj = {
            userId: returnedUser.userId || returnedUser.UserId || 1,
            username: returnedUser.username || returnedUser.Username || 'admin',
            role: returnedUser.role || returnedUser.Role || 'Admin',
            name: returnedUser.name || returnedUser.Name || 'Bala Weslin',
          };
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userObj));
          return { success: true, user: userObj, token };
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw new Error(
      lastError?.response?.data?.error ||
        lastError?.response?.data?.detail ||
        'Unable to connect to Django MySQL backend. Please verify server is running on port 8000.'
    );
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
