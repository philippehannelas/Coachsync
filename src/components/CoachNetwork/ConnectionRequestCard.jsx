import React, { useState } from 'react';
import { Check, X, MessageSquare } from 'lucide-react';
import { coachConnectionsApi } from '../../services/coachConnectionsApi';

/**
 * Card component for displaying and responding to connection requests
 * @param {Object} props
 * @param {Object} props.request - Connection request object
 * @param {Function} props.onAccept - Callback when request is accepted
 * @param {Function} props.onDecline - Callback when request is declined
 */
const ConnectionRequestCard = ({ request, onAccept, onDecline }) => {
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      await coachConnectionsApi.acceptConnection(request.id);
      onAccept && onAccept(request.id);
    } catch (err) {
      setError(err.error || 'Failed to accept connection');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    setError(null);
    try {
      await coachConnectionsApi.declineConnection(request.id, declineReason || null);
      onDecline && onDecline(request.id);
    } catch (err) {
      setError(err.error || 'Failed to decline connection');
    } finally {
      setLoading(false);
    }
  };

  const coach = request.coach || {};
  const initials = `${coach.first_name?.[0] || ''}${coach.last_name?.[0] || ''}`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Coach Info */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-lg flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {coach.full_name || 'Unknown Coach'}
          </h3>
          <p className="text-sm text-gray-600 truncate">{coach.email}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(request.requested_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Message */}
      {request.request_message && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <MessageSquare size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 italic">"{request.request_message}"</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Decline Reason Input */}
      {showDeclineReason && (
        <div className="mb-3">
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Optional: Why are you declining?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!showDeclineReason ? (
          <>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Check size={18} />
              <span className="font-medium">Accept</span>
            </button>
            <button
              onClick={() => setShowDeclineReason(true)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <X size={18} />
              <span className="font-medium">Decline</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleDecline}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Declining...' : 'Confirm Decline'}
            </button>
            <button
              onClick={() => {
                setShowDeclineReason(false);
                setDeclineReason('');
              }}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectionRequestCard;
