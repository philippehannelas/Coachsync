import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://coachsync-pro.onrender.com/api';

/**
 * Coach Assignment API Service
 * Handles all API calls related to temporary coach assignments
 */
export const coachAssignmentApi = {
  /**
   * Create new coach assignment(s)
   * @param {Object} data - Assignment data
   * @param {Array<string>} data.customer_ids - Array of customer IDs
   * @param {string} data.substitute_coach_email - Email of substitute coach
   * @param {string} data.start_date - Start date (YYYY-MM-DD)
   * @param {string} data.end_date - End date (YYYY-MM-DD) or null
   * @param {string} data.reason - Reason for assignment
   * @param {Object} data.permissions - Permission settings
   * @returns {Promise<Object>} Created assignments
   */
  createAssignment: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/coach/assignments`, data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get assignments created by current coach
   * @param {Object} filters - Optional filters
   * @param {string} filters.status - Filter by status (pending, active, completed, cancelled, declined)
   * @param {string} filters.customer_id - Filter by customer ID
   * @returns {Promise<Object>} List of assignments
   */
  getAssignmentsGiven: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/coach/assignments/given`, {
        params: filters,
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get assignments where current coach is substitute
   * @param {Object} filters - Optional filters
   * @param {string} filters.status - Filter by status
   * @returns {Promise<Object>} List of assignments
   */
  getAssignmentsReceived: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/coach/assignments/received`, {
        params: filters,
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Accept a substitute assignment
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<Object>} Updated assignment
   */
  acceptAssignment: async (assignmentId) => {
    try {
      const response = await axios.post(
        `${API_URL}/coach/assignments/${assignmentId}/accept`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Decline a substitute assignment
   * @param {string} assignmentId - Assignment ID
   * @param {string} reason - Reason for declining
   * @returns {Promise<Object>} Updated assignment
   */
  declineAssignment: async (assignmentId, reason) => {
    try {
      const response = await axios.post(
        `${API_URL}/coach/assignments/${assignmentId}/decline`,
        { reason },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Cancel an assignment (by primary coach)
   * @param {string} assignmentId - Assignment ID
   * @param {string} reason - Reason for cancellation
   * @returns {Promise<Object>} Updated assignment
   */
  cancelAssignment: async (assignmentId, reason) => {
    try {
      const response = await axios.post(
        `${API_URL}/coach/assignments/${assignmentId}/cancel`,
        { reason },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get customer's current assignment (for customer view)
   * @returns {Promise<Object>} Current assignment or null
   */
  getCurrentAssignment: async () => {
    try {
      const response = await axios.get(`${API_URL}/customer/current-assignment`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default coachAssignmentApi;
