import api from './api';

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

    // 1. Check local team credentials (matches your original data.js)
    const localMatch = TEAM_USERS.find(
      (u) => u.username.toLowerCase() === trimmedUser.toLowerCase() && u.password === trimmedPass
    );

    if (localMatch) {
      const token = `token-${localMatch.role.toLowerCase()}-${Date.now()}`;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(localMatch));
      return { success: true, user: localMatch, token };
    }

    // 2. Try Django backend login
    try {
      const response = await api.post('/admin/login/', {
        Username: trimmedUser,
        Password: trimmedPass,
        username: trimmedUser,
        password: trimmedPass
      });

      if (response.data.access || response.data.token) {
        const token = response.data.access || response.data.token;
        const userObj = {
          username: trimmedUser,
          role: 'Admin',
          name: trimmedUser,
        };
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userObj));
        return { success: true, user: userObj, token };
      }
    } catch (err) {
      // If backend specifically returned an error message, extract it
      const errorMsg = err.response?.data?.error || err.response?.data?.detail;
      if (errorMsg) {
        throw new Error(errorMsg);
      }
    }

    throw new Error('Invalid username or password. Check credentials or use 1-Click Quick Demo Access below.');
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
