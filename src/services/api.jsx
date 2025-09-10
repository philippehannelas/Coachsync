import axios from 'axios';

// API Configuration
const API_BASE_URL = 'https://vgh0i1c5dyvj.manus.space/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getToken = () => localStorage.getItem('authToken');
const setToken = (token) => localStorage.setItem('authToken', token);
const removeToken = () => localStorage.removeItem('authToken');

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => {
    removeToken();
    return Promise.resolve();
  },
  getCurrentUser: () => api.get('/auth/me'),
};

// Coach API
export const coachAPI = {
  // Customer management
  getCustomers: () => api.get('/coach/customers'),
  createCustomer: (customerData) => api.post('/coach/customers', customerData),
  updateCustomer: (customerId, customerData) => api.put(`/coach/customers/${customerId}`, customerData),
  deleteCustomer: (customerId) => api.delete(`/coach/customers/${customerId}`),
  addCredits: (customerId, credits) => api.post(`/coach/customers/${customerId}/credits`, { credits }),

  // Training plans
  getTrainingPlans: () => api.get('/coach/training-plans'),
  createTrainingPlan: (planData) => api.post('/coach/training-plans', planData),
  updateTrainingPlan: (planId, planData) => api.put(`/coach/training-plans/${planId}`, planData),
  deleteTrainingPlan: (planId) => api.delete(`/coach/training-plans/${planId}`),
  assignPlan: (planId, customerIds) => api.post(`/coach/training-plans/${planId}/assign`, { customer_ids: customerIds }),

  // Bookings
  getBookings: () => api.get('/coach/bookings'),
  createBooking: (bookingData) => api.post('/coach/bookings', bookingData),
  updateBooking: (bookingId, bookingData) => api.put(`/coach/bookings/${bookingId}`, bookingData),
  deleteBooking: (bookingId) => api.delete(`/coach/bookings/${bookingId}`),

  // Availability
  getAvailability: () => api.get('/coach/availability'),
  setAvailability: (availabilityData) => api.post('/coach/availability', availabilityData),
};

// Customer API
export const customerAPI = {
  // Training plans
  getTrainingPlans: () => api.get('/customer/training-plans'),
  getTrainingPlan: (planId) => api.get(`/customer/training-plans/${planId}`),

  // Bookings
  getBookings: () => api.get('/customer/bookings'),
  createBooking: (bookingData) => api.post('/customer/bookings', bookingData),
  cancelBooking: (bookingId) => api.delete(`/customer/bookings/${bookingId}`),

  // Profile
  getProfile: () => api.get('/customer/profile'),
  updateProfile: (profileData) => api.put('/customer/profile', profileData),

  // Credits
  getCredits: () => api.get('/customer/credits'),
};

// Export token management functions
export { getToken, setToken, removeToken };

// Export default api instance
export default api;

