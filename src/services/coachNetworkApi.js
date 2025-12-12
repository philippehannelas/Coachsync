import axios from 'axios';

const API_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : 'https://coachsync-pro.onrender.com/api';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('coachsync_token');
};

// Create axios instance with auth interceptor
const createAuthRequest = () => {
  const token = getToken();
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * Coach Network API Service
 * Handles coach search and network management
 */
export const coachNetworkApi = {
  /**
   * Search for coaches by name or email
   * @param {string} query - Search query
   * @param {number} limit - Max results (default 20)
   * @returns {Promise<Object>} List of coaches
   */
  searchCoaches: async (query, limit = 20) => {
    try {
      const response = await axios.get(`${API_URL}/coach/search`, {
        params: { q: query, limit },
        ...createAuthRequest()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get list of all active coaches
   * @returns {Promise<Object>} List of all coaches
   */
  listAllCoaches: async () => {
    try {
      const response = await axios.get(`${API_URL}/coach/list`, createAuthRequest());
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default coachNetworkApi;
