// API Configuration
// This file determines the correct API base URL based on the environment

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://coachsync-pro.onrender.com';

export { API_BASE_URL };
