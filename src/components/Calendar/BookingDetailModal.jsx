import React, { useState } from 'react';
import { X, Calendar, Clock, User, Mail, Phone, MapPin, Edit, Trash2, CheckCircle } from 'lucide-react';

/**
 * BookingDetailModal Component
 * Displays detailed information about a booking or personal event
 * Shows different content based on event type
 */
const BookingDetailModal = ({ 
  booking, 
  isOpen, 
  onClose,
  onEdit,
  onCancel,
  onComplete,
  mode = 'coach' // 'coach' or 'customer'
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !booking) return null;

  const isCustomerSession = booking.event_type === 'customer_session';
  const isPersonalEvent = booking.event_type === 'personal_event';

  // Format date and time
  const startDate = new Date(booking.start_time);
  const endDate = new Date(booking.end_time);
  
  const dateStr = startDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const timeStr = `${startDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })} - ${endDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}`;
  
  const duration = Math.round((endDate - startDate) / (1000 * 60)); // minutes

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setIsDeleting(true);
      try {
        await onCancel(booking.id);
        onClose();
      } catch (error) {
        alert('Failed to cancel booking');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleComplete = async () => {
    try {
      await onComplete(booking.id);
      onClose();
    } catch (error) {
      alert('Failed to mark as complete');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 border-b ${
          isCustomerSession 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-purple-50 border-purple-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${
                isCustomerSession ? 'text-blue-900' : 'text-purple-900'
              }`}>
                {isCustomerSession 
                  ? booking.customer?.name || 'Customer Session'
                  : booking.event_title || 'Personal Event'
                }
              </h2>
              <p className={`text-sm mt-1 ${
                isCustomerSession ? 'text-blue-600' : 'text-purple-600'
              }`}>
                {isCustomerSession ? 'Training Session' : 'Personal Event'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{dateStr}</p>
                <p className="text-sm text-gray-600">{timeStr}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <p className="text-gray-900">{duration} minutes</p>
            </div>
          </div>

          {/* Customer Information (for customer sessions) */}
          {isCustomerSession && booking.customer && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Customer Information
              </h3>
              <div className="space-y-2 ml-7">
                {booking.customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a 
                      href={`mailto:${booking.customer.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {booking.customer.email}
                    </a>
                  </div>
                )}
                {booking.customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a 
                      href={`tel:${booking.customer.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {booking.customer.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Event Description (for personal events) */}
          {isPersonalEvent && booking.event_description && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{booking.event_description}</p>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}

          {/* Status */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                booking.status === 'confirmed' 
                  ? 'bg-green-100 text-green-700'
                  : booking.status === 'cancelled'
                  ? 'bg-red-100 text-red-700'
                  : booking.status === 'completed'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {mode === 'coach' && booking.status !== 'cancelled' && (
          <div className="p-6 border-t bg-gray-50 flex flex-wrap gap-3">
            {booking.status !== 'completed' && (
              <>
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(booking);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
                
                {onComplete && isCustomerSession && (
                  <button
                    onClick={handleComplete}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Complete
                  </button>
                )}
              </>
            )}
            
            {onCancel && (
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            )}
          </div>
        )}

        {/* Customer View Actions */}
        {mode === 'customer' && booking.status === 'confirmed' && (
          <div className="p-6 border-t bg-gray-50">
            <button
              onClick={handleCancel}
              disabled={isDeleting}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Cancelling...' : 'Cancel This Session'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Please cancel at least 24 hours in advance
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetailModal;
