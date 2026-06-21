import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  getGoogleUrl: () => api.get('/auth/google'),
  getMe:        () => api.get('/auth/me'),
  logout:       () => api.post('/auth/logout'),
};

export const transactionsAPI = {
  getAll:     (params) => api.get('/transactions', { params }),
  getSummary: (params) => api.get('/transactions/summary', { params }),
  create:     (data)   => api.post('/transactions', data),
};

export const statementsAPI = {
  upload: (formData) => api.post('/statements/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default api;