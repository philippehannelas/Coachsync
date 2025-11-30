import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CreditCard, AlertCircle } from 'lucide-react';
import WeekCalendar from './WeekCalendar';
import BookingModal from './BookingModal';
import { availabilityApi, bookingApi } from '../../services/calendarApi';

/**
 * CustomerCalendarPage Component
 * Full calendar page for customers to book sessions
 */
const CustomerCalendarPage = ({ userProfile }) => {
  const [availability, setAvailability] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [credits, setCredits] = useState(userProfile?.session_credits || 0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = localStorage.getItem('coachsync_token');
      
      // Load profile, coach availability, and customer bookings
      const [profileResponse, availabilityData, bookingsData] = await Promise.all([
        fetch('https://coachsync-pro.onrender.com/api/customer/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        availabilityApi.getCoachAvailabilityForCustomer(),
        bookingApi.getCustomerBookings()
      ]);

      // Update credits from latest profile data
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setCredits(profileData.session_credits || 0);
      }

      // Extract availability schedule and booked slots from response
      setAvailability(availabilityData.availability || []);
      setBookedSlots(availabilityData.booked_slots || []);
      setBookings(bookingsData);
    } catch (err) {
      setError(err.message || 'Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotClick = (date, time) => {
    if (credits <= 0) {
      setError('You don\'t have enough credits to book a session. Please contact your coach.');
      return;
    }

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
      const response = await bookingApi.createBookingAsCustomer(bookingData);
      setSuccess('Booking created successfully!');
      setCredits(response.remaining_credits);
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
      const response = await bookingApi.cancelBookingAsCustomer(bookingId);
      setSuccess('Session cancelled successfully!');
      setCredits(response.remaining_credits);
      setShowBookingModal(false);
      await loadData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
    }
  };

  const upcomingBookings = bookings
    .filter(b => b.status === 'confirmed' && new Date(b.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const pastBookings = bookings
    .filter(b => new Date(b.start_time) < new Date())
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            <Calendar className="inline w-10 h-10 mr-3 text-blue-600" />
            Book Training Sessions
          </h1>
          <p className="text-gray-600">Select an available time slot to book your session</p>
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

        {/* Credits Card */}
        <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Session Credits</h3>
              <p className="text-blue-100">Available for booking</p>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8" />
              <span className="text-5xl font-bold">{credits}</span>
            </div>
          </div>
          {credits <= 0 && (
            <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                You're out of credits! Contact your coach to add more session credits.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading calendar...</p>
              </div>
            ) : (
              <WeekCalendar
                mode="customer"
                availability={availability}
                bookedSlots={bookedSlots}
                bookings={bookings}
                onSlotClick={handleSlotClick}
                onBookingClick={handleBookingClick}
                onCancelBooking={handleCancelBooking}
              />
            )}
          </div>

          {/* Bookings Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Bookings */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
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
                      className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg cursor-pointer hover:shadow-md transition-shadow border border-blue-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">
                            Training Session
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(booking.start_time).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-blue-600 font-medium">
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

            {/* Past Sessions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Recent Sessions
              </h3>
              
              {pastBookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No past sessions</p>
              ) : (
                <div className="space-y-2">
                  {pastBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <p className="text-sm text-gray-600">
                        {new Date(booking.start_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.status === 'completed' ? 'Completed' : 'Cancelled'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            customers={[]} // Empty for customers
            userCredits={credits}
            onConfirm={handleCreateBooking}
            onCancel={handleCancelBooking}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerCalendarPage;

