import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Dumbbell, TrendingUp, Award } from 'lucide-react';
import { getWorkoutHistory } from '../../services/workoutCompletionApi';

function WorkoutHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30); // days

  useEffect(() => {
    loadHistory();
  }, [timeRange]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getWorkoutHistory(timeRange);
      setHistory(data);
    } catch (error) {
      console.error('Error loading workout history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[7, 30, 90].map(days => (
          <button
            key={days}
            onClick={() => setTimeRange(days)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              timeRange === days
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last {days} days
          </button>
        ))}
      </div>

      {/* Workout List */}
      {history.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No workouts completed yet</p>
          <p className="text-sm text-gray-500 mt-1">Start your first workout to see it here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(workout => (
            <div
              key={workout.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Day {workout.day_number}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(workout.completed_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(workout.completed_at)}</span>
                    </div>
                    {workout.duration_minutes && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{workout.duration_minutes} min</span>
                      </div>
                    )}
                  </div>

                  {/* Exercise Count */}
                  {workout.exercise_completions && (
                    <div className="mt-2 text-sm text-gray-600">
                      {workout.exercise_completions.length} exercises completed
                      {workout.exercise_completions.some(ex => ex.is_pr) && (
                        <span className="ml-2 inline-flex items-center gap-1 text-yellow-600">
                          <Award className="w-4 h-4" />
                          PR!
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {workout.notes && (
                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2">
                      {workout.notes}
                    </p>
                  )}
                </div>

                {/* Rating */}
                {workout.rating && (
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < workout.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WorkoutHistory;
