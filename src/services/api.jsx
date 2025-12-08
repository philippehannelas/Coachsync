import axios from 'axios';

// Backend API base URL
// Hardcode the production URL to avoid issues with import.meta.env.DEV in production builds
const API_BASE_URL = 'https://coachsync-pro.onrender.com/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'coachsync_token';

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  delete api.defaults.headers.common['Authorization'];
};

// Set token on app initialization if it exists
const existingToken = getToken();
if (existingToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
}

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// Coach API endpoints
export const coachAPI = {
  getCustomers: () => api.get('/coach/customers'),
  createCustomer: (customerData) => api.post('/coach/customers', customerData),
  updateCustomer: (customerId, customerData) => api.put(`/coach/customers/${customerId}`, customerData),
  deleteCustomer: (customerId) => api.delete(`/coach/customers/${customerId}`),
  addCredits: (customerId, credits) => api.post(`/coach/customers/${customerId}/credits`, { credits }),
  inviteCustomer: (customerData) => api.post('/coach/customers', customerData),
  
  getTrainingPlans: () => api.get('/coach/training-plans'),
  createTrainingPlan: (planData) => api.post('/coach/training-plans', planData),
  updateTrainingPlan: (planId, planData) => api.put(`/coach/training-plans/${planId}`, planData),
  deleteTrainingPlan: (planId) => api.delete(`/coach/training-plans/${planId}`),
  
  getBookings: () => api.get('/coach/bookings'),
  createBooking: (bookingData) => api.post('/coach/bookings', bookingData),
  updateBooking: (bookingId, bookingData) => api.put(`/coach/bookings/${bookingId}`, bookingData),
  cancelBooking: (bookingId) => api.delete(`/coach/bookings/${bookingId}`),
  
  getBranding: () => api.get('/branding'),
};

// Customer API endpoints
export const customerAPI = {
  getProfile: () => api.get('/customer/profile'),
  updateProfile: (profileData) => api.put('/customer/profile', profileData),
  getTrainingPlans: () => api.get('/customer/training-plans'),
  getBookings: () => api.get('/customer/bookings'),
  createBooking: (bookingData) => api.post('/customer/bookings', bookingData),
  cancelBooking: (bookingId) => api.delete(`/customer/bookings/${bookingId}`),
  getCredits: () => api.get('/customer/credits'),
  getCoachBranding: () => api.get('/customer/coach-branding'),
};

// Admin API endpoints
export const adminAPI = {
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  updateUserStatus: (userId, statusData) => api.put(`/admin/users/${userId}/status`, statusData),
  adminResetPassword: (userId) => api.post(`/admin/users/${userId}/reset-password`),
  getAuditLog: () => api.get('/admin/audit-log'),
};

export default api;

