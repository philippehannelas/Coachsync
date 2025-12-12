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
 * Coach Connections API Service
 * Handles coach network connections and team management
 */
export const coachConnectionsApi = {
  /**
   * Send a connection request to another coach
   * @param {number} receiverCoachId - ID of the coach to connect with
   * @param {string} message - Optional message with the request
   * @returns {Promise<Object>} Connection object
   */
  sendConnectionRequest: async (receiverCoachId, message = '') => {
    try {
      const response = await axios.post(
        `${API_URL}/coach/network/connections/request`,
        { receiver_coach_id: receiverCoachId, message },
        createAuthRequest()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all connections
   * @param {string} status - Filter by status (optional)
   * @param {number} limit - Max results
   * @param {number} offset - Pagination offset
   * @returns {Promise<Object>} List of connections
   */
  getConnections: async (status = null, limit = 50, offset = 0) => {
    try {
      const params = { limit, offset };
      if (status) params.status = status;
      
      const response = await axios.get(`${API_URL}/coach/network/connections`, {
        params,
        ...createAuthRequest()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get pending connection requests received
   * @returns {Promise<Object>} List of pending requests
   */
  getPendingRequests: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/coach/network/connections/pending`,
        createAuthRequest()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Accept a connection request
   * @param {number} connectionId - ID of the connection
   * @returns {Promise<Object>} Updated connection
   */
  acceptConnection: async (connectionId) => {
    try {
      const response = await axios.post(
        `${API_URL}/coach/network/connections/${connectionId}/accept`,
        {},
        createAuthRequest()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Decline a connection request
   * @param {number} connectionId - ID of the connection
   * @param {string} reason - Optional reason for declining
   * @returns {Promise<Object>} Updated connection
   */
  declineConnection: async (connectionId, reason = null) => {
    try {
      const response = await axios.post(
        `${API_URL}/coach/network/connections/${connectionId}/decline`,
        { reason },
        createAuthRequest()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Remove a connection
   * @param {number} connectionId - ID of the connection
   * @returns {Promise<Object>} Success message
   */
  removeConnection: async (connectionId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/coach/network/connections/${connectionId}`,
        createAuthRequest()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update notes and tags for a connection
   * @param {number} connectionId - ID of the connection
   * @param {string} notes - Private notes
   * @param {Array<string>} tags - Tags for categorization
   * @returns {Promise<Object>} Updated connection
   */
  updateConnectionNotes: async (connectionId, notes, tags) => {
    try {
      const response = await axios.put(
        `${API_URL}/coach/network/connections/${connectionId}/notes`,
        { notes, tags },
        createAuthRequest()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get network statistics
   * @returns {Promise<Object>} Network stats
   */
  getNetworkStats: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/coach/network/stats`,
        createAuthRequest()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default coachConnectionsApi;
