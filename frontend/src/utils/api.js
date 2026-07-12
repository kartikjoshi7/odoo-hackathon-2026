import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to inject the JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('transitops_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response interceptor
api.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('transitops_token');
    localStorage.removeItem('transitops_active_user');
    window.location.reload();
  }
  return Promise.reject(error);
});

export default api;
