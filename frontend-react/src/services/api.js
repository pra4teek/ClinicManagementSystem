import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    // Never send Authorization header on login endpoints
    if (config.url && config.url.includes('/login/')) {
      return config;
    }
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    // Only attach Authorization header if it's a real JWT token (format: xxx.yyy.zzz)
    if (token && typeof token === 'string' && token.includes('.')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to /login if a REAL JWT token expired
    if (error.response && error.response.status === 401) {
      console.warn('API returned 401 Unauthorized for:', error.config?.url);
      const token = localStorage.getItem('token');
      if (token && typeof token === 'string' && token.includes('.')) {
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
