import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, X, Check } from 'lucide-react';

/**
 * WeekCalendar Component
 * Displays a week view with time slots for booking/availability management
 */
const WeekCalendar = ({ 
  mode = 'customer', // 'coach' or 'customer'
  availability = [],
  bookings = [],
  onSlotClick,
  onBookingClick,
  selectedDate = new Date()
}) => {
  const [currentWeek, setCurrentWeek] = useState(getWeekDates(selectedDate));
  const timeSlots = generateTimeSlots('08:00', '20:00', 60); // 8 AM to 8 PM, 1-hour slots

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

  function generateTimeSlots(start, end, interval) {
    const slots = [];
    const [startHour] = start.split(':').map(Number);
    const [endHour] = end.split(':').map(Number);
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
    }
    
    return slots;
  }

  function isSlotAvailable(date, time) {
    const dayOfWeek = date.getDay();
    
    // Check availability
    const hasAvailability = availability.some(slot => {
      if (slot.day_of_week !== dayOfWeek) return false;
      const slotStart = slot.start_time;
      const slotEnd = slot.end_time;
      return time >= slotStart && time < slotEnd;
    });
    
    if (!hasAvailability) return false;
    
    // Check bookings
    const dateString = date.toISOString().split('T')[0];
    const isBooked = bookings.some(booking => {
      if (booking.status === 'cancelled') return false;
      const bookingDate = booking.start_time.split('T')[0];
      if (bookingDate !== dateString) return false;
      const bookingTime = booking.start_time.split('T')[1].substring(0, 5);
      return time === bookingTime;
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
    
    if (booking && onBookingClick) {
      onBookingClick(booking);
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
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            {currentWeek[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors font-medium"
          >
            Today
          </button>
          <button
            onClick={goToNextWeek}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="text-center font-semibold text-gray-600 py-2">Time</div>
            {currentWeek.map((date, index) => (
              <div
                key={index}
                className={`text-center py-3 rounded-lg ${
                  date.toDateString() === new Date().toDateString()
                    ? 'bg-purple-100 text-purple-700 font-bold'
                    : 'bg-gray-50 text-gray-700'
                }`}
              >
                <div className="text-sm font-medium">{weekDays[index]}</div>
                <div className="text-lg">{date.getDate()}</div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-8 gap-2 mb-2">
              <div className="flex items-center justify-center text-sm font-medium text-gray-600">
                {time}
              </div>
              
              {currentWeek.map((date, dayIndex) => {
                const available = isSlotAvailable(date, time);
                const booking = getBookingForSlot(date, time);
                const isPast = new Date(date.toDateString() + ' ' + time) < new Date();
                
                return (
                  <button
                    key={dayIndex}
                    onClick={() => !isPast && handleSlotClick(date, time)}
                    disabled={isPast}
                    className={`
                      min-h-[60px] rounded-lg border-2 transition-all duration-200
                      ${isPast ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50' : ''}
                      ${booking ? 'bg-blue-100 border-blue-400 hover:bg-blue-200' : ''}
                      ${available && !booking && !isPast ? 'bg-green-50 border-green-300 hover:bg-green-100 cursor-pointer' : ''}
                      ${!available && !booking && !isPast ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : ''}
                    `}
                  >
                    {booking && (
                      <div className="text-xs font-medium text-blue-700 p-1">
                        {booking.customer?.name || 'Booked'}
                      </div>
                    )}
                    {available && !booking && !isPast && (
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
      <div className="flex items-center gap-6 mt-6 pt-6 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
          <span className="text-sm text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded"></div>
          <span className="text-sm text-gray-600">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
          <span className="text-sm text-gray-600">Unavailable</span>
        </div>
      </div>
    </div>
  );
};

export default WeekCalendar;

