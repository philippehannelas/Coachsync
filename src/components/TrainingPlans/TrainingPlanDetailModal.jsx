import React, { useState } from 'react';
import { X, Edit, Dumbbell, Clock, Calendar, Target, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * TrainingPlanDetailModal - View full training plan with exercises
 * Used when coach wants to view plan details without editing
 */
function TrainingPlanDetailModal({ plan, onClose, onEdit }) {
  const [expandedDays, setExpandedDays] = useState([1]); // Start with day 1 expanded

  if (!plan) return null;

  // Group exercises by day
  const exercisesByDay = {};
  (plan.exercises || []).forEach(exercise => {
    const day = exercise.day_number || 1;
    if (!exercisesByDay[day]) {
      exercisesByDay[day] = [];
    }
    exercisesByDay[day].push(exercise);
  });

  // Sort days
  const sortedDays = Object.keys(exercisesByDay).sort((a, b) => parseInt(a) - parseInt(b));

  const toggleDay = (day) => {
    setExpandedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <p className="text-purple-100">{plan.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-purple-500 rounded-lg p-2 transition-colors ml-4"
            >
              <X size={24} />
            </button>
          </div>

          {/* Plan Info */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full font-semibold ${getStatusColor(plan.status)}`}>
                {plan.status?.charAt(0).toUpperCase() + plan.status?.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-purple-100">
              <Target size={16} />
              <span className="capitalize">{plan.difficulty}</span>
            </div>
            <div className="flex items-center gap-2 text-purple-100">
              <Calendar size={16} />
              <span>{plan.duration_weeks} weeks</span>
            </div>
            {plan.start_date && (
              <div className="flex items-center gap-2 text-purple-100">
                <Clock size={16} />
                <span>{new Date(plan.start_date).toLocaleDateString()} - {plan.end_date ? new Date(plan.end_date).toLocaleDateString() : 'Ongoing'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Exercises */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {sortedDays.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No exercises added yet</p>
              <button
                onClick={() => {
                  onClose();
                  onEdit(plan);
                }}
                className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
              >
                Add Exercises
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDays.map(day => {
                const dayExercises = exercisesByDay[day];
                const isExpanded = expandedDays.includes(parseInt(day));

                return (
                  <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Day Header */}
                    <button
                      onClick={() => toggleDay(parseInt(day))}
                      className="w-full bg-gray-50 hover:bg-gray-100 p-4 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Dumbbell className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">Day {day}</h3>
                          <p className="text-sm text-gray-600">{dayExercises.length} exercises</p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {/* Exercise List */}
                    {isExpanded && (
                      <div className="divide-y divide-gray-100">
                        {dayExercises.map((exercise, index) => (
                          <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{exercise.name}</h4>
                                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                  <span className="font-medium">{exercise.sets} sets × {exercise.reps} reps</span>
                                  {exercise.rest_seconds && (
                                    <span className="flex items-center gap-1">
                                      <Clock size={14} />
                                      Rest: {exercise.rest_seconds}s
                                    </span>
                                  )}
                                  {exercise.tempo && (
                                    <span>Tempo: {exercise.tempo}</span>
                                  )}
                                </div>
                                {exercise.instructions && (
                                  <p className="mt-2 text-sm text-gray-600 italic">{exercise.instructions}</p>
                                )}
                                {exercise.notes && (
                                  <p className="mt-2 text-sm text-gray-500">📝 {exercise.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-3">
          <button
            onClick={() => {
              onClose();
              onEdit(plan);
            }}
            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Edit size={18} />
            Edit Plan
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TrainingPlanDetailModal;
