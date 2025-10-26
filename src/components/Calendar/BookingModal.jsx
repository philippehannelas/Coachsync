import React, { useState } from 'react';
import { X, Calendar, Clock, User, CreditCard, AlertCircle } from 'lucide-react';

/**
 * BookingModal Component
 * Modal for creating/viewing/cancelling bookings
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
  isLoading = false
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState(booking?.customer_id || '');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState(booking?.notes || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    setError('');

    if (mode === 'create' && customers.length > 0 && !selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    const bookingData = {
      customer_id: selectedCustomer,
      start_time: `${selectedDate.toISOString().split('T')[0]}T${selectedTime}:00`,
      end_time: `${selectedDate.toISOString().split('T')[0]}T${addMinutes(selectedTime, duration)}:00`,
      notes
    };

    onConfirm(bookingData);
  };

  const handleCancelBooking = () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      onCancel(booking.id);
    }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'create' && 'Book Session'}
            {mode === 'view' && 'Booking Details'}
            {mode === 'edit' && 'Edit Booking'}
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
          {/* Date & Time */}
          <div className="bg-purple-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-700">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">
                {selectedDate && formatDate(selectedDate)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-purple-700">
              <Clock className="w-5 h-5" />
              <span className="font-medium">
                {selectedTime} - {addMinutes(selectedTime, duration)}
              </span>
            </div>
          </div>

          {/* Customer Selection (for coaches) */}
          {mode === 'create' && customers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Select Customer
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Choose a customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name}
                    {customer.session_credits !== undefined && ` (${customer.session_credits} credits)`}
                  </option>
                ))}
              </select>
            </div>
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
          {mode === 'create' && customers.length === 0 && (
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

          {/* View Mode - Booking Details */}
          {mode === 'view' && booking && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {booking.customer?.name || 'Customer'}
                </span>
              </div>
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
          {mode === 'create' && customers.length === 0 && userCredits <= 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                You don't have enough credits to book this session. Please contact your coach.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
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
                disabled={isLoading || (customers.length === 0 && userCredits <= 0)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Booking...' : 'Confirm Booking'}
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
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Cancelling...' : 'Cancel Booking'}
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

