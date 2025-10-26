import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Settings, Users } from 'lucide-react';
import WeekCalendar from './WeekCalendar';
import BookingModal from './BookingModal';
import { availabilityApi, bookingApi } from './calendarApi';

/**
 * CoachCalendarPage Component
 * Full calendar page for coaches with booking management
 */
const CoachCalendarPage = () => {
  const [availability, setAvailability] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Load availability, bookings, and customers
      const [availabilityData, bookingsData, customersData] = await Promise.all([
        availabilityApi.getCoachAvailability(),
        bookingApi.getCoachBookings(),
        fetchCustomers() // You'll need to implement this using your existing API
      ]);

      setAvailability(availabilityData);
      setBookings(bookingsData);
      setCustomers(customersData);
    } catch (err) {
      setError(err.message || 'Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    // This should use your existing customer API
    // For now, returning empty array
    try {
      const response = await fetch('https://coachsync-pro.onrender.com/api/coach/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    } catch (err) {
      console.error('Error fetching customers:', err);
      return [];
    }
  };

  const handleSlotClick = (date, time) => {
    setSelectedSlot({ date, time });
    setSelectedBooking(null);
    setShowBookingModal(true);
  };

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setSelectedSlot(null);
    setShowBookingModal(true);
  };

  const handleCreateBooking = async (bookingData) => {
    try {
      setError('');
      await bookingApi.createBookingAsCoach(bookingData);
      setSuccess('Booking created successfully!');
      setShowBookingModal(false);
      await loadData(); // Reload data
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setError('');
      await bookingApi.updateBookingAsCoach(bookingId, { status: 'cancelled' });
      setSuccess('Booking cancelled successfully!');
      setShowBookingModal(false);
      await loadData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
    }
  };

  const upcomingBookings = bookings
    .filter(b => b.status === 'confirmed' && new Date(b.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            <Calendar className="inline w-10 h-10 mr-3 text-purple-600" />
            Calendar & Bookings
          </h1>
          <p className="text-gray-600">Manage your availability and session bookings</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg animate-fade-in">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg animate-fade-in">
            {error}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setShowAvailabilityModal(true)}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex items-center gap-4 group"
          >
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">Manage Availability</h3>
              <p className="text-sm text-gray-600">Set your weekly schedule</p>
            </div>
          </button>

          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Total Bookings</h3>
              <p className="text-2xl font-bold text-blue-600">{bookings.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Active Customers</h3>
              <p className="text-2xl font-bold text-green-600">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading calendar...</p>
              </div>
            ) : (
              <WeekCalendar
                mode="coach"
                availability={availability}
                bookings={bookings}
                onSlotClick={handleSlotClick}
                onBookingClick={handleBookingClick}
              />
            )}
          </div>

          {/* Upcoming Bookings Sidebar */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Upcoming Sessions
            </h3>
            
            {upcomingBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No upcoming bookings</p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => handleBookingClick(booking)}
                    className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg cursor-pointer hover:shadow-md transition-shadow border border-purple-200"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {booking.customer?.name || 'Customer'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(booking.start_time).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-purple-600 font-medium">
                          {new Date(booking.start_time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Confirmed
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Modal */}
        {showBookingModal && (
          <BookingModal
            isOpen={showBookingModal}
            onClose={() => setShowBookingModal(false)}
            mode={selectedBooking ? 'view' : 'create'}
            booking={selectedBooking}
            selectedDate={selectedSlot?.date}
            selectedTime={selectedSlot?.time}
            customers={customers}
            onConfirm={handleCreateBooking}
            onCancel={handleCancelBooking}
          />
        )}

        {/* Availability Modal - TODO: Create this component */}
        {showAvailabilityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Manage Availability</h2>
              <p className="text-gray-600 mb-4">This feature is coming soon!</p>
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachCalendarPage;

