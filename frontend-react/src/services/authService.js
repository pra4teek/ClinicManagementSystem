import api from './api.js';

const authService = {
  login: async (username, password) => {
    const trimmedUser = (username || '').trim();
    const passwordValue = password || '';

    if (!trimmedUser || !passwordValue) {
      throw new Error('Please enter both username and password.');
    }

    // Try general login endpoint first (/api/login/), fallback to /api/admin/login/
    let response = null;
    let lastError = null;

    try {
      response = await api.post('/login/', {
        Username: trimmedUser,
        Password: passwordValue,
      });
    } catch (err) {
      lastError = err;
      // If general /login/ endpoint failed or was not reachable, try /admin/login/
      try {
        response = await api.post('/admin/login/', {
          Username: trimmedUser,
          Password: passwordValue,
        });
      } catch (adminErr) {
        lastError = adminErr;
      }
    }

    if (response?.data && (response.data.access || response.data.token)) {
      const token = response.data.access || response.data.token;
      const refresh = response.data.refresh;
      const returnedUser = response.data.user || {};
      const userObj = {
        userId: returnedUser.userId || returnedUser.UserId,
        username: returnedUser.username || returnedUser.Username || trimmedUser,
        role: returnedUser.role || returnedUser.Role || (trimmedUser.toLowerCase() === 'admin' ? 'Admin' : 'Staff'),
        name: returnedUser.name || returnedUser.Name || (trimmedUser.toLowerCase() === 'admin' ? 'Bala Weslin' : trimmedUser),
        doctorId: returnedUser.doctorId || returnedUser.DoctorId || null,
        specialization: returnedUser.specialization || null,
        departmentName: returnedUser.departmentName || null,
      };

      localStorage.setItem('token', token);
      if (refresh) localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(userObj));
      return { success: true, user: userObj, token, refresh };
    }

    const errorMsg =
      lastError?.response?.data?.error ||
      lastError?.response?.data?.detail ||
      lastError?.message ||
      'Invalid username or password.';
    throw new Error(errorMsg);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || token.split('.').length !== 3) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return Number(payload.exp) * 1000 > Date.now() || !!localStorage.getItem('refreshToken');
    } catch {
      return false;
    }
  },
};

export default authService;
