import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Settings, Users, Star, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import WeekCalendar from './WeekCalendar';
import BookingModal from './BookingModal';
import AvailabilityManager from './AvailabilityManager';
import SessionNotesModal from '../SessionNotes/SessionNotesModal';
import { availabilityApi, bookingApi } from '../../services/calendarApi';
import { dateSpecificApi } from '../../services/dateSpecificApi';

/**
 * CoachCalendarPage Component
 * Full calendar page for coaches with booking management
 */
const CoachCalendarPage = () => {
  const [availability, setAvailability] = useState([]);
  const [dateSpecific, setDateSpecific] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [availabilityData, dateSpecificData, bookingsData, customersData] = await Promise.all([
        availabilityApi.getCoachAvailability(),
        dateSpecificApi.getAll(),
        bookingApi.getCoachBookings(),
        fetchCustomers()
      ]);

      setAvailability(availabilityData);
      setDateSpecific(dateSpecificData);
      setBookings(bookingsData);
      setCustomers(customersData);
    } catch (err) {
      setError(err.message || 'Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('https://coachsync-pro.onrender.com/api/coach/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
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
    const isPast = new Date(booking.end_time) < new Date();
    const isCustomerSession = booking.event_type === 'customer_session';
    
    // If it's a past customer session, open notes modal directly
    if (isPast && isCustomerSession) {
      handleAddNotes(booking);
    } else {
      // Otherwise open booking modal
      setSelectedBooking(booking);
      setSelectedSlot(null);
      setShowBookingModal(true);
    }
  };

  const handleAddNotes = (booking) => {
    setSelectedBooking(booking);
    setShowNotesModal(true);
  };

  const handleNotesSaved = (updatedBooking) => {
    setSuccess('Session notes saved successfully!');
    setShowNotesModal(false);
    loadData();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreateBooking = async (bookingData) => {
    try {
      setError('');
      await bookingApi.createBookingAsCoach(bookingData);
      setSuccess('Booking created successfully!');
      setShowBookingModal(false);
      await loadData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setError('');
      await bookingApi.updateBooking(bookingId, { status: 'cancelled' });
      setSuccess('Booking cancelled successfully!');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
      throw err;
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      setError('');
      await bookingApi.updateBooking(bookingId, { status: 'completed' });
      setSuccess('Booking marked as complete!');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to complete booking');
      throw err;
    }
  };

  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
    setSelectedSlot(null);
    setShowBookingModal(true);
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // Filter bookings
  const todaySessions = bookings
    .filter(b => {
      const startTime = new Date(b.start_time);
      return startTime >= todayStart && startTime < todayEnd && b.status === 'confirmed';
    })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const upcomingBookings = bookings
    .filter(b => b.status === 'confirmed' && new Date(b.start_time) > now)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 5);

  const completedSessions = bookings
    .filter(b => b.event_type === 'customer_session' && new Date(b.end_time) < now)
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
    .slice(0, 5);

  const sessionsWithNotes = completedSessions.filter(b => b.has_session_notes);
  const sessionsNeedingNotes = completedSessions.filter(b => !b.has_session_notes);

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Session Notes</h3>
              <p className="text-2xl font-bold text-orange-600">
                {sessionsWithNotes.length}/{completedSessions.length}
              </p>
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
                dateSpecific={dateSpecific}
                bookings={bookings}
                onSlotClick={handleSlotClick}
                onBookingClick={handleBookingClick}
                onCancelBooking={handleCancelBooking}
                onCompleteBooking={handleCompleteBooking}
                onEditBooking={handleEditBooking}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Today's Sessions */}
            {todaySessions.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Today's Sessions
                </h3>
                <div className="space-y-3">
                  {todaySessions.map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => handleBookingClick(booking)}
                      className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg cursor-pointer hover:shadow-md transition-shadow border border-purple-200"
                    >
                      <p className="font-semibold text-gray-800">
                        {booking.customer?.name || booking.event_title || 'Session'}
                      </p>
                      <p className="text-sm text-purple-600 font-medium">
                        {new Date(booking.start_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
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
                      className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg cursor-pointer hover:shadow-md transition-shadow border border-blue-200"
                    >
                      <p className="font-semibold text-gray-800">
                        {booking.customer?.name || booking.event_title || 'Session'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(booking.start_time).toLocaleDateString('en-US', {
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
                  ))}
                </div>
              )}
            </div>

            {/* Recent Completed Sessions */}
            {completedSessions.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Recent Completed
                    {sessionsNeedingNotes.length > 0 && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                        {sessionsNeedingNotes.length} need notes
                      </span>
                    )}
                  </h3>
                  {showCompleted ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {showCompleted && (
                  <div className="space-y-3">
                    {completedSessions.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {booking.customer?.name || 'Customer'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.start_time).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          {booking.has_session_notes && booking.performance_rating && (
                            <div className="flex">
                              {[...Array(booking.performance_rating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleAddNotes(booking)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          {booking.has_session_notes ? 'Edit Notes' : 'Add Notes'}
                        </button>
                        
                        {booking.has_session_notes && (
                          <span className="inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Notes Added
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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

        {/* Availability Manager */}
        {showAvailabilityModal && (
          <AvailabilityManager
            isOpen={showAvailabilityModal}
            onClose={() => setShowAvailabilityModal(false)}
            onSave={loadData}
          />
        )}

        {/* Session Notes Modal */}
        {showNotesModal && selectedBooking && (
          <SessionNotesModal
            booking={selectedBooking}
            onClose={() => setShowNotesModal(false)}
            onSave={handleNotesSaved}
          />
        )}
      </div>
    </div>
  );
};

export default CoachCalendarPage;

