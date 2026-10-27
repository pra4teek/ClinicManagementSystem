import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

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
  async (error) => {
    const request = error.config;
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    // ClinicJWTAuthentication returns None for expired/missing tokens, so
    // DRF reports the resulting permission failure as 403 rather than 401.
    const isAuthenticationFailure =
      status === 401 ||
      (status === 403 && detail === 'Authentication credentials were not provided.');
    const isLoginRequest = request?.url?.includes('/login/');
    const isRefreshRequest = request?.url?.includes('/token/refresh/');
    if (isAuthenticationFailure && request && !request._retriedAfterRefresh && !request._skipAuthRefresh && !isLoginRequest && !isRefreshRequest) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        request._retriedAfterRefresh = true;
        try {
          const response = await api.post('/token/refresh/', { refresh: refreshToken }, { _skipAuthRefresh: true });
          localStorage.setItem('token', response.data.access);
          if (response.data.refresh) localStorage.setItem('refreshToken', response.data.refresh);
          request.headers.Authorization = `Bearer ${response.data.access}`;
          return api.request(request);
        } catch (refreshError) {
          console.warn('Session refresh failed:', refreshError.response?.data || refreshError.message);
        }
      }
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
