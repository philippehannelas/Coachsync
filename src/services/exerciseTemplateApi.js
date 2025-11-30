import axios from 'axios';

// Backend API base URL
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

const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

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

// Exercise Template API functions

/**
 * Get all exercise templates with optional filtering
 * @param {Object} filters - Optional filters { muscle_group, category, difficulty, search }
 * @returns {Promise} - Promise resolving to exercise list
 */
export const getExerciseTemplates = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.muscle_group) params.append('muscle_group', filters.muscle_group);
    if (filters.category) params.append('category', filters.category);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.search) params.append('search', filters.search);
    
    const response = await api.get(`/exercise-templates?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exercise templates:', error);
    throw error;
  }
};

/**
 * Get a specific exercise template by ID
 * @param {string} exerciseId - Exercise template ID
 * @returns {Promise} - Promise resolving to exercise details
 */
export const getExerciseTemplate = async (exerciseId) => {
  try {
    const response = await api.get(`/exercise-templates/${exerciseId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exercise template:', error);
    throw error;
  }
};

/**
 * Create a new custom exercise template (coaches only)
 * @param {Object} exerciseData - Exercise template data
 * @returns {Promise} - Promise resolving to created exercise
 */
export const createExerciseTemplate = async (exerciseData) => {
  try {
    const response = await api.post('/exercise-templates', exerciseData);
    return response.data;
  } catch (error) {
    console.error('Error creating exercise template:', error);
    throw error;
  }
};

/**
 * Update an existing exercise template (coaches can only update their own)
 * @param {string} exerciseId - Exercise template ID
 * @param {Object} exerciseData - Updated exercise data
 * @returns {Promise} - Promise resolving to updated exercise
 */
export const updateExerciseTemplate = async (exerciseId, exerciseData) => {
  try {
    const response = await api.put(`/exercise-templates/${exerciseId}`, exerciseData);
    return response.data;
  } catch (error) {
    console.error('Error updating exercise template:', error);
    throw error;
  }
};

/**
 * Delete an exercise template (coaches can only delete their own)
 * @param {string} exerciseId - Exercise template ID
 * @returns {Promise} - Promise resolving to success message
 */
export const deleteExerciseTemplate = async (exerciseId) => {
  try {
    const response = await api.delete(`/exercise-templates/${exerciseId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting exercise template:', error);
    throw error;
  }
};

/**
 * Get available categories and muscle groups
 * @returns {Promise} - Promise resolving to categories object
 */
export const getExerciseCategories = async () => {
  try {
    const response = await api.get('/exercise-templates/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching exercise categories:', error);
    throw error;
  }
};
