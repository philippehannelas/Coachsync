import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, CreditCard, AlertCircle, Repeat, FileText } from 'lucide-react';

/**
 * Enhanced BookingModal Component
 * Supports both customer sessions and personal events
 * Includes recurring event functionality
 */
const BookingModal = ({
  isOpen,
  onClose,
  mode = 'create', // 'create', 'view', 'edit'
  booking = null,
  selectedDate = null,
  selectedTime = null,
  customers = [],
  userCredits = 0,
  onConfirm,
  onCancel,
  isLoading = false,
  userRole = 'customer' // 'coach' or 'customer'
}) => {
  // Event type state (only for coaches)
  const [eventType, setEventType] = useState(booking?.event_type || 'customer_session');
  
  // Customer session fields
  const [selectedCustomer, setSelectedCustomer] = useState(booking?.customer_id || '');
  
  // Personal event fields
  const [eventTitle, setEventTitle] = useState(booking?.event_title || '');
  
  // Recurring event fields
  const [isRecurring, setIsRecurring] = useState(booking?.is_recurring || false);
  const [recurringDays, setRecurringDays] = useState(booking?.recurring_days || []);
  const [recurringEndDate, setRecurringEndDate] = useState(
    booking?.recurring_end_date || getDefaultEndDate()
  );
  
  // Common fields
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState(booking?.notes || '');
  const [error, setError] = useState('');

  const DAYS = [
    { name: 'Mon', value: 0 },
    { name: 'Tue', value: 1 },
    { name: 'Wed', value: 2 },
    { name: 'Thu', value: 3 },
    { name: 'Fri', value: 4 },
    { name: 'Sat', value: 5 },
    { name: 'Sun', value: 6 }
  ];

  function getDefaultEndDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + 3); // 3 months from now
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    // Reset recurring options when event type changes
    if (eventType === 'customer_session') {
      setIsRecurring(false);
      setRecurringDays([]);
    }
  }, [eventType]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setError('');

    // Validation based on event type
    if (eventType === 'customer_session') {
      if (!selectedCustomer) {
        setError('Please select a customer');
        return;
      }
    } else if (eventType === 'personal_event') {
      if (!eventTitle.trim()) {
        setError('Please enter an event title');
        return;
      }
      if (isRecurring && recurringDays.length === 0) {
        setError('Please select at least one day for recurring event');
        return;
      }
      if (isRecurring && !recurringEndDate) {
        setError('Please select an end date for recurring event');
        return;
      }
    }

    const bookingData = {
      event_type: eventType,
      start_time: `${selectedDate.toISOString().split('T')[0]}T${selectedTime}:00`,
      end_time: `${selectedDate.toISOString().split('T')[0]}T${addMinutes(selectedTime, duration)}:00`,
      notes
    };

    // Add fields based on event type
    if (eventType === 'customer_session') {
      bookingData.customer_id = selectedCustomer;
    } else if (eventType === 'personal_event') {
      bookingData.event_title = eventTitle;
      bookingData.is_recurring = isRecurring;
      
      if (isRecurring) {
        bookingData.recurring_days = recurringDays;
        bookingData.recurring_end_date = recurringEndDate;
      }
    }

    onConfirm(bookingData);
  };

  const handleCancelBooking = () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      onCancel(booking.id);
    }
  };

  const toggleRecurringDay = (dayValue) => {
    setRecurringDays(prev => 
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue].sort()
    );
  };

  function addMinutes(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isCoach = userRole === 'coach' || customers.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'create' && 'Create Event'}
            {mode === 'view' && (booking?.event_type === 'personal_event' ? 'Event Details' : 'Booking Details')}
            {mode === 'edit' && 'Edit Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Event Type Selector (Coach only, Create mode) */}
          {mode === 'create' && isCoach && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEventType('customer_session')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    eventType === 'customer_session'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className={`w-6 h-6 mx-auto mb-2 ${
                    eventType === 'customer_session' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-medium">Customer Session</div>
                </button>
                <button
                  type="button"
                  onClick={() => setEventType('personal_event')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    eventType === 'personal_event'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className={`w-6 h-6 mx-auto mb-2 ${
                    eventType === 'personal_event' ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-medium">Personal Event</div>
                </button>
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className={`rounded-lg p-4 space-y-2 ${
            eventType === 'personal_event' ? 'bg-purple-50' : 'bg-blue-50'
          }`}>
            <div className={`flex items-center gap-2 ${
              eventType === 'personal_event' ? 'text-purple-700' : 'text-blue-700'
            }`}>
              <Calendar className="w-5 h-5" />
              <span className="font-medium">
                {mode === 'view' && booking
                  ? new Date(booking.start_time).toLocaleDateString('en-US', { 
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                    })
                  : selectedDate && formatDate(selectedDate)
                }
              </span>
            </div>
            <div className={`flex items-center gap-2 ${
              eventType === 'personal_event' ? 'text-purple-700' : 'text-blue-700'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-medium">
                {mode === 'view' && booking
                  ? `${new Date(booking.start_time).toLocaleTimeString('en-US', { 
                      hour: '2-digit', minute: '2-digit', hour12: false 
                    })} - ${new Date(booking.end_time).toLocaleTimeString('en-US', { 
                      hour: '2-digit', minute: '2-digit', hour12: false 
                    })}`
                  : selectedTime && `${selectedTime} - ${addMinutes(selectedTime, duration)}`
                }
              </span>
            </div>
          </div>

          {/* Customer Session Fields */}
          {mode === 'create' && eventType === 'customer_session' && (
            <>
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Select Customer
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.user?.first_name || customer.first_name} {customer.user?.last_name || customer.last_name}
                      {customer.session_credits !== undefined && ` (${customer.session_credits} credits)`}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Personal Event Fields */}
          {mode === 'create' && eventType === 'personal_event' && (
            <>
              {/* Event Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Event Title
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g., Gym Workout, Team Meeting, Lunch Break"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Recurring Toggle */}
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Recurring Event</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isRecurring ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isRecurring ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Recurring Options */}
              {isRecurring && (
                <div className="space-y-3 p-4 bg-purple-50 rounded-lg">
                  {/* Day Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repeat On
                    </label>
                    <div className="flex gap-2">
                      {DAYS.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleRecurringDay(day.value)}
                          className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                            recurringDays.includes(day.value)
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-gray-600 border border-gray-300 hover:border-purple-300'
                          }`}
                        >
                          {day.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={recurringEndDate}
                      onChange={(e) => setRecurringEndDate(e.target.value)}
                      min={selectedDate?.toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Duration */}
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>
          )}

          {/* Credits Info (for customers) */}
          {mode === 'create' && !isCoach && (
            <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Session Credits: {userCredits}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  1 credit will be deducted for this booking
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any special notes or requirements..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* View Mode - Event/Booking Details */}
          {mode === 'view' && booking && (
            <div className="space-y-3">
              {booking.event_type === 'personal_event' ? (
                <>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-900 font-medium">{booking.event_title}</span>
                  </div>
                  {booking.is_recurring && (
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                      <Repeat className="w-4 h-4" />
                      <span>Recurring event</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    {booking.customer?.name || 'Customer'}
                  </span>
                </div>
              )}
              
              {booking.notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">{booking.notes}</p>
                </div>
              )}
              
              <div className={`
                inline-block px-3 py-1 rounded-full text-sm font-medium
                ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : ''}
                ${booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
              `}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Insufficient Credits Warning */}
          {mode === 'create' && !isCoach && userCredits <= 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                You don't have enough credits to book this session. Please contact your coach.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          {mode === 'create' && (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading || (!isCoach && userCredits <= 0)}
                className={`flex-1 px-4 py-3 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  eventType === 'personal_event'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                }`}
              >
                {isLoading ? 'Creating...' : (isRecurring ? 'Create Recurring Event' : 'Confirm')}
              </button>
            </>
          )}
          
          {mode === 'view' && booking && booking.status !== 'cancelled' && (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCancelBooking}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel {booking.event_type === 'personal_event' ? 'Event' : 'Booking'}
              </button>
            </>
          )}
          
          {mode === 'view' && booking && booking.status === 'cancelled' && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;

