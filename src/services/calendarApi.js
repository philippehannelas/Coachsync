/**
 * Calendar API Service
 * Handles all booking and availability API calls
 */

const API_URL = 'https://coachsync-pro.onrender.com/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('coachsync_token');
};

// Availability API
export const availabilityApi = {
  // Get coach's availability schedule
  getCoachAvailability: async () => {
    const response = await fetch(`${API_URL}/coach/availability`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch availability');
    return response.json();
  },

  // Create availability slot
  createAvailability: async (data) => {
    const response = await fetch(`${API_URL}/coach/availability`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create availability');
    }
    return response.json();
  },

  // Update availability slot
  updateAvailability: async (id, data) => {
    const response = await fetch(`${API_URL}/coach/availability/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update availability');
    return response.json();
  },

  // Delete availability slot
  deleteAvailability: async (id) => {
    const response = await fetch(`${API_URL}/coach/availability/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to delete availability');
    return response.json();
  },

  // Get coach availability (for customers)
  getCoachAvailabilityForCustomer: async (startDate, endDate) => {
    // Default to current week if no dates provided
    if (!startDate || !endDate) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      startDate = monday.toISOString().split('T')[0];
      endDate = sunday.toISOString().split('T')[0];
    }
    
    const response = await fetch(`${API_URL}/customer/coach/availability?start_date=${startDate}&end_date=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch coach availability');
    return response.json();
  }
};

// Booking API
export const bookingApi = {
  // Get coach's bookings
  getCoachBookings: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_URL}/coach/bookings${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
  },

  // Create booking as coach
  createBookingAsCoach: async (data) => {
    const response = await fetch(`${API_URL}/coach/bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create booking');
    }
    return response.json();
  },

  // Update booking as coach
  updateBookingAsCoach: async (id, data) => {
    const response = await fetch(`${API_URL}/coach/bookings/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update booking');
    return response.json();
  },

  // Get customer's bookings
  getCustomerBookings: async () => {
    const response = await fetch(`${API_URL}/customer/bookings`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
  },

  // Create booking as customer
  createBookingAsCustomer: async (data) => {
    const response = await fetch(`${API_URL}/customer/bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create booking');
    }
    return response.json();
  },

  // Cancel booking as customer
  cancelBookingAsCustomer: async (id) => {
    const response = await fetch(`${API_URL}/customer/bookings/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'cancelled' })
    });
    if (!response.ok) throw new Error('Failed to cancel booking');
    return response.json();
  },

  // Alias for updateBookingAsCoach (for backward compatibility)
  updateBooking: async (id, data) => {
    return bookingApi.updateBookingAsCoach(id, data);
  }
};

// Helper functions
export const calendarHelpers = {
  // Generate time slots for a day
  generateTimeSlots: (startTime, endTime, intervalMinutes = 30) => {
    const slots = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      slots.push(timeString);
      
      currentMinute += intervalMinutes;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }
    
    return slots;
  },

  // Check if a time slot is available
  isSlotAvailable: (date, time, bookings, availability) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if coach has availability for this day and time
    const hasAvailability = availability.some(slot => {
      if (slot.day_of_week !== dayOfWeek) return false;
      return time >= slot.start_time && time < slot.end_time;
    });
    
    if (!hasAvailability) return false;
    
    // Check if slot is already booked
    const dateString = date.toISOString().split('T')[0];
    const isBooked = bookings.some(booking => {
      if (booking.status === 'cancelled') return false;
      if (booking.date !== dateString) return false;
      return time >= booking.start_time && time < booking.end_time;
    });
    
    return !isBooked;
  },

  // Format date for API
  formatDateForAPI: (date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  },

  // Format datetime for API
  formatDateTimeForAPI: (date, time) => {
    return `${date.toISOString().split('T')[0]}T${time}:00`;
  },

  // Parse API datetime
  parseDateTimeFromAPI: (dateTimeString) => {
    return new Date(dateTimeString);
  }
};

