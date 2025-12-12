import React, { useState } from 'react';
import { Calendar, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { coachAssignmentApi } from '../../services/coachAssignmentApi';

/**
 * Card component for displaying and managing pending assignments
 * @param {Object} props
 * @param {Object} props.assignment - Assignment object
 * @param {Function} props.onUpdate - Callback when assignment is updated
 */
const PendingAssignmentCard = ({ assignment, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [error, setError] = useState(null);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      await coachAssignmentApi.acceptAssignment(assignment.id);
      onUpdate && onUpdate();
    } catch (err) {
      setError(err.error || 'Failed to accept assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      setError('Please provide a reason for declining');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await coachAssignmentApi.declineAssignment(assignment.id, declineReason);
      onUpdate && onUpdate();
    } catch (err) {
      setError(err.error || 'Failed to decline assignment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {assignment.customer?.name || 'Customer'}
            </h3>
            <p className="text-xs text-gray-500">{assignment.customer?.email}</p>
          </div>
        </div>
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
          Pending
        </span>
      </div>

      {/* Assignment Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={16} className="text-gray-400" />
          <span>From: <span className="font-medium">{assignment.primary_coach?.name}</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} className="text-gray-400" />
          <span>
            {formatDate(assignment.start_date)} - {assignment.end_date ? formatDate(assignment.end_date) : 'Ongoing'}
          </span>
        </div>
        {assignment.reason && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Reason:</span> {assignment.reason}
          </div>
        )}
      </div>

      {/* Permissions */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-700 mb-2">Permissions:</p>
        <div className="flex flex-wrap gap-1">
          {assignment.can_view_history && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">View History</span>
          )}
          {assignment.can_book_sessions && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Book Sessions</span>
          )}
          {assignment.can_edit_plans && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Edit Plans</span>
          )}
          {assignment.can_view_notes && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">View Notes</span>
          )}
          {assignment.can_add_notes && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Add Notes</span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {/* Decline Form */}
      {showDeclineForm && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Reason for declining:
          </label>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="e.g., Already fully booked during this period"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="2"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!showDeclineForm ? (
          <>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Accept</span>
            </button>
            <button
              onClick={() => setShowDeclineForm(true)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <XCircle size={16} />
              <span className="text-sm font-medium">Decline</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleDecline}
              disabled={loading || !declineReason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-medium">
                {loading ? 'Declining...' : 'Confirm Decline'}
              </span>
            </button>
            <button
              onClick={() => {
                setShowDeclineForm(false);
                setDeclineReason('');
                setError(null);
              }}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">Cancel</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PendingAssignmentCard;
