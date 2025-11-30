import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, X, Check, Ban } from 'lucide-react';
import BookingDetailModal from './BookingDetailModal';

/**
 * WeekCalendar Component
 * Displays a week view with time slots for booking/availability management
 * Now supports date-specific availability (blocked dates and custom hours)
 */
const WeekCalendar = ({ 
  mode = 'customer', // 'coach' or 'customer'
  availability = [],
  dateSpecific = [], // NEW: Date-specific availability
  bookings = [],
  onSlotClick,
  onBookingClick,
  onCancelBooking,
  onCompleteBooking,
  onEditBooking,
  selectedDate = new Date()
}) => {
  const [currentWeek, setCurrentWeek] = useState(getWeekDates(selectedDate));
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const timeSlots = generateDynamicTimeSlots(availability, dateSpecific, currentWeek);

  function getWeekDates(date) {
    const week = [];
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    
    current.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return week;
  }

  /**
   * Generate time slots dynamically based on availability
   * Shows 30-minute intervals from earliest to latest availability
   */
  function generateDynamicTimeSlots(availability, dateSpecific, week) {
    // Default range if no availability set
    let earliestHour = 6;  // 6 AM
    let latestHour = 22;   // 10 PM
    
    // Find earliest and latest times from recurring availability
    if (availability && availability.length > 0) {
      availability.forEach(slot => {
        const [startHour] = slot.start_time.split(':').map(Number);
        const [endHour] = slot.end_time.split(':').map(Number);
        earliestHour = Math.min(earliestHour, startHour);
        latestHour = Math.max(latestHour, endHour);
      });
    }
    
    // Check date-specific availability for this week
    if (dateSpecific && dateSpecific.length > 0 && week) {
      week.forEach(date => {
        const dateString = date.toISOString().split('T')[0];
        const specific = dateSpecific.find(item => item.date === dateString && item.type === 'override');
        if (specific) {
          const [startHour] = specific.start_time.split(':').map(Number);
          const [endHour] = specific.end_time.split(':').map(Number);
          earliestHour = Math.min(earliestHour, startHour);
          latestHour = Math.max(latestHour, endHour);
        }
      });
    }
    
    // Generate 30-minute slots
    const slots = [];
    for (let hour = earliestHour; hour <= latestHour; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      if (hour < latestHour) {
        slots.push(`${String(hour).padStart(2, '0')}:30`);
      }
    }
    
    return slots;
  }

  /**
   * Check if a specific date has date-specific availability
   * Returns: { type: 'blocked' | 'override' | null, data: {...} }
   */
  function getDateSpecificAvailability(date) {
    const dateString = date.toISOString().split('T')[0];
    const specific = dateSpecific.find(item => item.date === dateString);
    
    if (!specific) return { type: null, data: null };
    
    return {
      type: specific.type,
      data: specific
    };
  }

  /**
   * Check if a slot is available
   * Priority: Date-specific > Recurring weekly
   */
  function isSlotAvailable(date, time) {
    const dateString = date.toISOString().split('T')[0];
    
    // Step 1: Check date-specific availability (highest priority)
    const dateSpecificInfo = getDateSpecificAvailability(date);
    
    if (dateSpecificInfo.type === 'blocked') {
      // Date is completely blocked
      return false;
    }
    
    if (dateSpecificInfo.type === 'override') {
      // Check if time falls within override hours
      const { start_time, end_time } = dateSpecificInfo.data;
      const hasAvailability = time >= start_time && time < end_time;
      
      if (!hasAvailability) return false;
      
      // Check if booked - consider booking duration
      const isBooked = bookings.some(booking => {
        if (booking.status === 'cancelled') return false;
        const bookingDate = booking.start_time.split('T')[0];
        if (bookingDate !== dateString) return false;
        
        // Get booking start and end times
        const bookingStartTime = booking.start_time.split('T')[1].substring(0, 5);
        const bookingEndTime = booking.end_time.split('T')[1].substring(0, 5);
        
        // Check if current time slot falls within booking duration
        return time >= bookingStartTime && time < bookingEndTime;
      });
      
      return !isBooked;
    }
    
    // Step 2: Use recurring weekly availability (fallback)
    const dayOfWeek = date.getDay();
    // Convert JS day (0=Sunday) to backend day (0=Monday)
    const backendDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    // Check availability
    const hasAvailability = availability.some(slot => {
      if (slot.day_of_week !== backendDay) return false;
      const slotStart = slot.start_time;
      const slotEnd = slot.end_time;
      return time >= slotStart && time < slotEnd;
    });
    
    if (!hasAvailability) return false;
    
    // Check bookings - consider booking duration
    const isBooked = bookings.some(booking => {
      if (booking.status === 'cancelled') return false;
      const bookingDate = booking.start_time.split('T')[0];
      if (bookingDate !== dateString) return false;
      
      // Get booking start and end times
      const bookingStartTime = booking.start_time.split('T')[1].substring(0, 5);
      const bookingEndTime = booking.end_time.split('T')[1].substring(0, 5);
      
      // Check if current time slot falls within booking duration
      return time >= bookingStartTime && time < bookingEndTime;
    });
    
    return !isBooked;
  }

  function getBookingForSlot(date, time) {
    const dateString = date.toISOString().split('T')[0];
    return bookings.find(booking => {
      if (booking.status === 'cancelled') return false;
      const bookingDate = booking.start_time.split('T')[0];
      if (bookingDate !== dateString) return false;
      const bookingTime = booking.start_time.split('T')[1].substring(0, 5);
      return time === bookingTime;
    });
  }

  function handleSlotClick(date, time) {
    const booking = getBookingForSlot(date, time);
    
    if (booking) {
      // Open modal with booking details
      setSelectedBooking(booking);
      setIsModalOpen(true);
      // Also call the callback if provided
      if (onBookingClick) {
        onBookingClick(booking);
      }
    } else if (isSlotAvailable(date, time) && onSlotClick) {
      onSlotClick(date, time);
    }
  }

  function goToPreviousWeek() {
    const newDate = new Date(currentWeek[0]);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(getWeekDates(newDate));
  }

  function goToNextWeek() {
    const newDate = new Date(currentWeek[0]);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(getWeekDates(newDate));
  }

  function goToToday() {
    setCurrentWeek(getWeekDates(new Date()));
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {currentWeek[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={goToPreviousWeek}
            className="px-2 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
          >
            ← <span className="hidden sm:inline">Previous</span>
          </button>
          <button
            onClick={goToToday}
            className="px-2 sm:px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors font-medium text-sm flex-1 sm:flex-none"
          >
            Today
          </button>
          <button
            onClick={goToNextWeek}
            className="px-2 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
          >
            <span className="hidden sm:inline">Next</span> →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="min-w-full">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-1 sm:gap-2 mb-2">
            <div className="text-center font-semibold text-gray-600 py-2 text-xs sm:text-sm">Time</div>
            {currentWeek.map((date, index) => {
              const dateSpecificInfo = getDateSpecificAvailability(date);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`text-center py-3 rounded-lg relative ${
                    isToday
                      ? 'bg-purple-100 text-purple-700 font-bold'
                      : dateSpecificInfo.type === 'blocked'
                      ? 'bg-red-50 text-red-700'
                      : dateSpecificInfo.type === 'override'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-medium">{weekDays[index]}</div>
                  <div className="text-sm sm:text-lg">{date.getDate()}</div>
                  {dateSpecificInfo.type === 'blocked' && (
                    <div className="absolute top-1 right-1">
                      <Ban className="w-4 h-4 text-red-600" />
                    </div>
                  )}
                  {dateSpecificInfo.type === 'override' && (
                    <div className="absolute top-1 right-1">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                  )}
                  {dateSpecificInfo.data?.reason && (
                    <div className="text-xs mt-1 truncate px-1" title={dateSpecificInfo.data.reason}>
                      {dateSpecificInfo.data.reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-8 gap-1 sm:gap-2 mb-2">
              <div className="flex items-center justify-center text-xs sm:text-sm font-medium text-gray-600">
                {time}
              </div>
              
              {currentWeek.map((date, dayIndex) => {
                const available = isSlotAvailable(date, time);
                const booking = getBookingForSlot(date, time);
                const isPast = new Date(date.toDateString() + ' ' + time) < new Date();
                const dateSpecificInfo = getDateSpecificAvailability(date);
                
                return (
                  <button
                    key={dayIndex}
                    onClick={() => {
                      if (booking) {
                        setSelectedBooking(booking);
                        setIsModalOpen(true);
                      } else if (!isPast) {
                        handleSlotClick(date, time);
                      }
                    }}
                    disabled={isPast || dateSpecificInfo.type === 'blocked'}
                    className={`
                      min-h-[50px] sm:min-h-[60px] rounded text-xs sm:text-sm border-2 transition-all duration-200
                      ${isPast ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50' : ''}
                      ${dateSpecificInfo.type === 'blocked' ? 'bg-red-50 border-red-200 cursor-not-allowed' : ''}
                      ${booking && booking.event_type === 'customer_session' ? 'bg-blue-100 border-blue-400 hover:bg-blue-200' : ''}
                      ${booking && booking.event_type === 'personal_event' ? 'bg-purple-100 border-purple-400 hover:bg-purple-200' : ''}
                      ${available && !booking && !isPast && dateSpecificInfo.type !== 'blocked' ? 'bg-green-50 border-green-300 hover:bg-green-100 cursor-pointer' : ''}
                      ${!available && !booking && !isPast && dateSpecificInfo.type !== 'blocked' ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : ''}
                    `}
                  >
                    {dateSpecificInfo.type === 'blocked' && (
                      <div className="text-red-400">
                        <Ban className="w-4 h-4 mx-auto" />
                      </div>
                    )}
                    {booking && booking.event_type === 'customer_session' && (
                      <div className="text-xs font-medium text-blue-700 p-1 truncate">
                        {booking.customer?.name || 'Booked'}
                      </div>
                    )}
                    {booking && booking.event_type === 'personal_event' && (
                      <div className="text-xs font-medium text-purple-700 p-1 truncate">
                        {booking.event_title || 'Personal'}
                      </div>
                    )}
                    {available && !booking && !isPast && dateSpecificInfo.type !== 'blocked' && (
                      <div className="text-green-600">
                        <Plus className="w-4 h-4 mx-auto" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 pt-6 border-t flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
          <span className="text-sm text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded"></div>
          <span className="text-sm text-gray-600">Customer Session</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-100 border-2 border-purple-400 rounded"></div>
          <span className="text-sm text-gray-600">Personal Event</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
          <span className="text-sm text-gray-600">Unavailable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-200 rounded"></div>
          <span className="text-sm text-gray-600">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
          <span className="text-sm text-gray-600">Custom Hours</span>
        </div>
      </div>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={onEditBooking}
        onCancel={onCancelBooking}
        onComplete={onCompleteBooking}
        mode={mode}
      />
    </div>
  );
};

export default WeekCalendar;

