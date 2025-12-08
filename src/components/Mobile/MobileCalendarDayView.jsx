import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User } from 'lucide-react';

const MobileCalendarDayView = ({ bookings = [], onDateChange, onBookingClick }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Navigate days
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    if (onDateChange) onDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    if (onDateChange) onDateChange(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    if (onDateChange) onDateChange(today);
  };

  // Filter bookings for selected date
  const dayBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date || booking.start_time);
    return bookingDate.toDateString() === selectedDate.toDateString();
  });

  // Sort bookings by time
  const sortedBookings = dayBookings.sort((a, b) => {
    const timeA = new Date(a.start_time || a.date);
    const timeB = new Date(b.start_time || b.date);
    return timeA - timeB;
  });

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Check if date is today
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="mobile-calendar-day-view">
      {/* Date Navigation */}
      <div className="mobile-calendar-header">
        <button 
          className="mobile-calendar-nav-btn"
          onClick={goToPreviousDay}
          aria-label="Previous day"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="mobile-calendar-date">
          <CalendarIcon size={20} className="text-blue-600" />
          <div>
            <div className="mobile-calendar-date-text">
              {formatDate(selectedDate)}
            </div>
            {!isToday && (
              <button 
                className="mobile-calendar-today-btn"
                onClick={goToToday}
              >
                Go to Today
              </button>
            )}
          </div>
        </div>

        <button 
          className="mobile-calendar-nav-btn"
          onClick={goToNextDay}
          aria-label="Next day"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Bookings List */}
      <div className="mobile-calendar-bookings">
        {sortedBookings.length === 0 ? (
          <div className="mobile-calendar-empty">
            <CalendarIcon size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-lg font-medium">No sessions scheduled</p>
            <p className="text-gray-400 text-sm mt-1">
              {isToday ? 'You have no sessions today' : 'No sessions on this day'}
            </p>
          </div>
        ) : (
          <div className="mobile-calendar-booking-list">
            {sortedBookings.map((booking, index) => (
              <div 
                key={booking.id || index}
                className="mobile-calendar-booking-card"
                onClick={() => onBookingClick && onBookingClick(booking)}
              >
                {/* Time */}
                <div className="mobile-calendar-booking-time">
                  <Clock size={18} />
                  <span>{formatTime(booking.start_time || booking.date)}</span>
                </div>

                {/* Customer Info */}
                <div className="mobile-calendar-booking-customer">
                  <div className="mobile-calendar-booking-avatar">
                    {booking.customer_name?.[0] || booking.customer?.first_name?.[0] || 'C'}
                  </div>
                  <div>
                    <div className="mobile-calendar-booking-name">
                      {booking.customer_name || `${booking.customer?.first_name || ''} ${booking.customer?.last_name || ''}`.trim() || 'Customer'}
                    </div>
                    {booking.service && (
                      <div className="mobile-calendar-booking-service">
                        {booking.service}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`mobile-calendar-booking-status ${
                  booking.status === 'confirmed' ? 'status-confirmed' :
                  booking.status === 'completed' ? 'status-completed' :
                  booking.status === 'cancelled' ? 'status-cancelled' :
                  'status-pending'
                }`}>
                  {booking.status || 'pending'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCalendarDayView;
