import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Circle, MessageSquare, Calendar, Clock } from 'lucide-react';

function SessionHistoryView({ userProfile }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('coachsync_token');
      const response = await fetch('https://coachsync-pro.onrender.com/api/customer/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter completed sessions with notes
        const completedWithNotes = data.filter(
          session => session.has_session_notes && new Date(session.end_time) < new Date()
        );
        setSessions(completedWithNotes);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setCustomerNotes(session.customer_notes || '');
  };

  const handleToggleActionItem = async (itemIndex) => {
    if (!selectedSession) return;

    const updatedItems = [...selectedSession.action_items];
    updatedItems[itemIndex].completed = !updatedItems[itemIndex].completed;

    try {
      const token = localStorage.getItem('coachsync_token');
      const response = await fetch(
        `https://coachsync-pro.onrender.com/api/customer/bookings/${selectedSession.id}/action-items`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action_items: updatedItems })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedSession(data.booking);
        // Update in sessions list
        setSessions(sessions.map(s => s.id === data.booking.id ? data.booking : s));
      }
    } catch (error) {
      console.error('Error updating action items:', error);
    }
  };

  const handleSaveCustomerNotes = async () => {
    if (!selectedSession) return;

    try {
      setSavingNotes(true);
      const token = localStorage.getItem('coachsync_token');
      const response = await fetch(
        `https://coachsync-pro.onrender.com/api/customer/bookings/${selectedSession.id}/customer-notes`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ customer_notes: customerNotes })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedSession(data.booking);
        setSessions(sessions.map(s => s.id === data.booking.id ? data.booking : s));
        
        // Show success feedback
        setSaveSuccess(true);
        
        // Close the detail view after 1 second
        setTimeout(() => {
          setSaveSuccess(false);
          setSelectedSession(null);
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No session notes yet</p>
        <p className="text-sm text-gray-400 mt-2">
          Your coach will add notes after your sessions
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sessions List */}
      <div className="lg:col-span-1 space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Session History</h3>
        {sessions.map((session) => {
          const sessionDate = new Date(session.start_time);
          const isSelected = selectedSession?.id === session.id;
          
          return (
            <button
              key={session.id}
              onClick={() => handleSessionClick(session)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {sessionDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                {session.performance_rating && (
                  <div className="flex">
                    {[...Array(session.performance_rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {sessionDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </button>
          );
        })}
      </div>

      {/* Session Details */}
      <div className="lg:col-span-2">
        {selectedSession ? (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-800">
                  {new Date(selectedSession.start_time).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                {selectedSession.performance_rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Performance:</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < selectedSession.performance_rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Session Summary */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Session Summary</h4>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {selectedSession.session_summary}
              </p>
            </div>

            {/* Action Items */}
            {selectedSession.action_items && selectedSession.action_items.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Action Items</h4>
                <div className="space-y-2">
                  {selectedSession.action_items.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleToggleActionItem(index)}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                    >
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <span
                        className={`flex-1 ${
                          item.completed ? 'line-through text-gray-500' : 'text-gray-700'
                        }`}
                      >
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Notes */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Your Notes & Reflections
              </h4>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Add your thoughts, progress, or questions about this session..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="4"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveCustomerNotes}
                  disabled={savingNotes || saveSuccess}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {savingNotes ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save Notes'}
                </button>
                {saveSuccess && (
                  <span className="text-green-600 text-sm font-medium animate-fade-in">
                    Notes saved successfully!
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Select a session to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionHistoryView;

