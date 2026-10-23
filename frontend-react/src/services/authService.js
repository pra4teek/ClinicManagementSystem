import api from './api';

const authService = {
  login: async (username, password) => {
    const response = await api.post('/admin/login/', { username, password });
    if (response.data.token || response.data.access) {
      localStorage.setItem('token', response.data.token || response.data.access);
      localStorage.setItem('user', JSON.stringify(response.data.user || { username, role: 'Doctor' }));
    }
    return response.data;
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

