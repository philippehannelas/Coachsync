/**
 * Date-Specific Availability API Service
 * Handles all date-specific availability API calls
 */

const API_URL = 'https://coachsync-pro.onrender.com/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('coachsync_token');
};

/**
 * Date-Specific Availability API
 */
export const dateSpecificApi = {
  /**
   * Get all date-specific availability
   * @param {Object} filters - Optional filters
   * @param {string} filters.start_date - Start date (YYYY-MM-DD)
   * @param {string} filters.end_date - End date (YYYY-MM-DD)
   * @param {string} filters.type - Type filter ('available' or 'unavailable')
   * @returns {Promise<Array>}
   */
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.type) params.append('type', filters.type);
      
      const queryString = params.toString();
      const url = `${API_URL}/coach/date-specific-availability${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch date-specific availability');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching date-specific availability:', error);
      throw new Error(error.message || 'Failed to fetch date-specific availability');
    }
  },

  /**
   * Create a single date-specific availability entry
   * @param {Object} data
   * @param {string} data.date - Date (YYYY-MM-DD)
   * @param {string} data.type - Type ('available' or 'unavailable')
   * @param {string} data.start_time - Start time (HH:MM) - required if type='available'
   * @param {string} data.end_time - End time (HH:MM) - required if type='available'
   * @param {string} data.reason - Optional reason/note
   * @returns {Promise<Object>}
   */
  create: async (data) => {
    try {
      const response = await fetch(`${API_URL}/coach/date-specific-availability`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create date-specific availability');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error creating date-specific availability:', error);
      throw new Error(error.message || 'Failed to create date-specific availability');
    }
  },

  /**
   * Create multiple date-specific entries (vacation period)
   * @param {Object} data
   * @param {string} data.start_date - Start date (YYYY-MM-DD)
   * @param {string} data.end_date - End date (YYYY-MM-DD)
   * @param {string} data.type - Type ('available' or 'unavailable')
   * @param {string} data.start_time - Start time (HH:MM) - required if type='available'
   * @param {string} data.end_time - End time (HH:MM) - required if type='available'
   * @param {string} data.reason - Optional reason/note
   * @returns {Promise<Object>}
   */
  createBulk: async (data) => {
    try {
      const response = await fetch(`${API_URL}/coach/date-specific-availability/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create bulk date-specific availability');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error creating bulk date-specific availability:', error);
      throw new Error(error.message || 'Failed to create bulk date-specific availability');
    }
  },

  /**
   * Update a date-specific availability entry
   * @param {string} id - Entry ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>}
   */
  update: async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/coach/date-specific-availability/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update date-specific availability');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error updating date-specific availability:', error);
      throw new Error(error.message || 'Failed to update date-specific availability');
    }
  },

  /**
   * Delete a date-specific availability entry
   * @param {string} id - Entry ID
   * @returns {Promise<Object>}
   */
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/coach/date-specific-availability/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete date-specific availability');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error deleting date-specific availability:', error);
      throw new Error(error.message || 'Failed to delete date-specific availability');
    }
  }
};

export default dateSpecificApi;
