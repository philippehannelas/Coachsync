import React, { useState, useEffect } from 'react';
import { X, Star, Calendar, User, MessageSquare, TrendingUp } from 'lucide-react';
import { coachAssignmentApi } from '../../services/coachAssignmentApi';

/**
 * Modal for viewing assignment history with a specific coach
 * @param {Object} props
 * @param {Object} props.connection - Connection object
 * @param {Function} props.onClose - Close modal callback
 */
const AssignmentHistoryModal = ({ connection, onClose }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [connection]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Add API endpoint to get assignment history with specific coach
      // For now, get all assignments and filter
      const response = await coachAssignmentApi.getAssignmentsGiven();
      const allAssignments = response.assignments || [];
      
      // Filter assignments for this coach
      const filtered = allAssignments.filter(
        a => a.substitute_coach_id === connection.coach_id
      );
      
      setAssignments(filtered);
      
      // Calculate stats
      const completed = filtered.filter(a => a.status === 'completed').length;
      const active = filtered.filter(a => a.status === 'active').length;
      const ratings = filtered.filter(a => a.assignment_rating).map(a => a.assignment_rating);
      const avgRating = ratings.length > 0 
        ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
        : null;
      
      setStats({
        total: filtered.length,
        completed,
        active,
        avgRating,
        totalRatings: ratings.length
      });
    } catch (err) {
      setError(err.error || 'Failed to load assignment history');
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const StarDisplay = ({ rating }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={`${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const coach = connection.coach || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Assignment History
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {coach.full_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="p-6 bg-gray-50 border-b">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.active}</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
              <div className="text-center">
                {stats.avgRating ? (
                  <>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-2xl font-bold text-yellow-600">{stats.avgRating}</p>
                      <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    </div>
                    <p className="text-xs text-gray-600">{stats.totalRatings} ratings</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-400">-</p>
                    <p className="text-xs text-gray-600">No ratings</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading history...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700">{error}</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No assignment history yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {assignment.customer_name}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                      assignment.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      assignment.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Calendar size={14} />
                    <span>
                      {new Date(assignment.start_date).toLocaleDateString()} - {' '}
                      {assignment.end_date 
                        ? new Date(assignment.end_date).toLocaleDateString()
                        : 'Ongoing'}
                    </span>
                  </div>

                  {/* Reason */}
                  {assignment.reason && (
                    <div className="bg-gray-50 rounded p-2 mb-3">
                      <p className="text-sm text-gray-700 italic">"{assignment.reason}"</p>
                    </div>
                  )}

                  {/* Rating */}
                  {assignment.assignment_rating && (
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Your Rating:</span>
                          <StarDisplay rating={assignment.assignment_rating} />
                        </div>
                        {assignment.rated_at && (
                          <span className="text-xs text-gray-500">
                            {new Date(assignment.rated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {assignment.assignment_feedback && (
                        <div className="mt-2 flex items-start gap-2">
                          <MessageSquare size={14} className="text-gray-400 mt-0.5" />
                          <p className="text-sm text-gray-700">{assignment.assignment_feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentHistoryModal;
