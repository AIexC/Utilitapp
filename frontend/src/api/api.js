import axios from 'axios';
import API_URL from '../config';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data)
};

// Landlords API
export const landlordsAPI = {
  getAll: () => api.get('/landlords'),
  getOne: (id) => api.get(`/landlords/${id}`),
  create: (data) => api.post('/landlords', data),
  update: (id, data) => api.put(`/landlords/${id}`, data),
  delete: (id) => api.delete(`/landlords/${id}`)
};

// Properties API
export const propertiesAPI = {
  getAll: () => api.get('/properties'),
  getOne: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`)
};

// Rooms API
export const roomsAPI = {
  getByProperty: (propertyId) => api.get(`/rooms/property/${propertyId}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`)
};

// Meters API
export const metersAPI = {
  getByProperty: (propertyId) => api.get(`/meters/property/${propertyId}`),
  create: (data) => api.post('/meters', data),
  update: (id, data) => api.put(`/meters/${id}`, data),
  delete: (id) => api.delete(`/meters/${id}`)
};

// Readings API
export const readingsAPI = {
  getAll: (params) => api.get('/readings', { params }),
  create: (data) => api.post('/readings', data),
  update: (id, data) => api.put(`/readings/${id}`, data),
  delete: (id) => api.delete(`/readings/${id}`)
};

// Bills API
export const billsAPI = {
  getAll: (params) => api.get('/bills', { params }),
  create: (formData) => api.post('/bills', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/bills/${id}`, data),
  verify: (id, verified) => api.patch(`/bills/${id}/verify`, { verified }),
  delete: (id) => api.delete(`/bills/${id}`)
};

// Users API (Admin only)
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getAccess: (id) => api.get(`/users/${id}/property-access`),
  grantAccess: (id, propertyId) => api.post(`/users/${id}/property-access`, { propertyId }),
  revokeAccess: (id, propertyId) => api.delete(`/users/${id}/property-access/${propertyId}`)
};

// Dashboard API
export const dashboardAPI = {
  getSummary: (params) => api.get('/dashboard/summary', { params }),
  getMonthlyByLandlord: (params) => api.get('/dashboard/monthly-by-landlord', { params }),
  getRecentActivity: (params) => api.get('/dashboard/recent-activity', { params })
};

export default api;