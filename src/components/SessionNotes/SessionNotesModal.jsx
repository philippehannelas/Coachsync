import React, { useState, useEffect } from 'react';
import { X, Star, Plus, Trash2, Save } from 'lucide-react';

function SessionNotesModal({ booking, onClose, onSave }) {
  const [sessionSummary, setSessionSummary] = useState('');
  const [performanceRating, setPerformanceRating] = useState(0);
  const [coachNotes, setCoachNotes] = useState('');
  const [actionItems, setActionItems] = useState([]);
  const [newActionItem, setNewActionItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load existing notes if available
    if (booking.session_summary) {
      setSessionSummary(booking.session_summary || '');
      setPerformanceRating(booking.performance_rating || 0);
      setCoachNotes(booking.coach_notes || '');
      setActionItems(booking.action_items || []);
    }
  }, [booking]);

  const handleAddActionItem = () => {
    if (newActionItem.trim()) {
      setActionItems([...actionItems, { text: newActionItem, completed: false }]);
      setNewActionItem('');
    }
  };

  const handleRemoveActionItem = (index) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('coachsync_token');
      const method = booking.has_session_notes ? 'PUT' : 'POST';
      
      const response = await fetch(
        `https://coachsync-pro.onrender.com/api/coach/bookings/${booking.id}/session-notes`,
        {
          method: method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_summary: sessionSummary,
            performance_rating: performanceRating || null,
            coach_notes: coachNotes,
            action_items: actionItems
          })
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save session notes');
      }

      const data = await response.json();
      onSave(data.booking);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const customerName = booking.customer?.name || 'Customer';
  const sessionDate = new Date(booking.start_time).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Session Notes</h2>
            <p className="text-sm text-gray-600 mt-1">
              {customerName} • {sessionDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Performance Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Performance Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setPerformanceRating(rating)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      rating <= performanceRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {performanceRating > 0 && (
                <button
                  onClick={() => setPerformanceRating(0)}
                  className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Session Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              value={sessionSummary}
              onChange={(e) => setSessionSummary(e.target.value)}
              placeholder="What did you cover in this session? Key exercises, techniques, progress made..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="4"
            />
          </div>

          {/* Action Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Items for Next Session
            </label>
            <div className="space-y-2">
              {actionItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                  <span className="flex-1 text-gray-700">{item.text}</span>
                  <button
                    onClick={() => handleRemoveActionItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newActionItem}
                  onChange={(e) => setNewActionItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddActionItem()}
                  placeholder="Add an action item..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddActionItem}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Private Coach Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Private Coach Notes
              <span className="text-xs text-gray-500 ml-2">(Only visible to you)</span>
            </label>
            <textarea
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder="Private observations, concerns, or notes for your reference..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="3"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !sessionSummary.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionNotesModal;

