import React, { useState, useEffect } from 'react';
import { X, Edit, Dumbbell, Clock, Calendar, Target, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * TrainingPlanDetailModal - View full training plan with exercises
 * Used when coach wants to view plan details without editing
 */
function TrainingPlanDetailModal({ plan, onClose, onEdit }) {
  const [expandedDays, setExpandedDays] = useState([1]); // Start with day 1 expanded
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!plan) return null;

  // Fetch exercises from API
  useEffect(() => {
    const loadExercises = async () => {
      if (!plan?.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`https://coachsync-pro.onrender.com/api/coach/training-plans/${plan.id}/exercises`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('TrainingPlanDetailModal - Loaded exercises:', data);
          setExercises(data || []);
        } else {
          console.error('TrainingPlanDetailModal - Failed to load exercises:', response.status);
          setExercises([]);
        }
      } catch (error) {
        console.error('TrainingPlanDetailModal - Error loading exercises:', error);
        setExercises([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadExercises();
  }, [plan?.id]);

  // Group exercises by day
  const exercisesByDay = {};
  exercises.forEach(exercise => {
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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{plan.name}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(plan.status)}`}>
              {plan.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(plan.difficulty)}`}>
              {plan.difficulty}
            </span>
          </div>
          
          {plan.description && (
            <p className="text-purple-100 text-sm">{plan.description}</p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Plan Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Calendar size={16} />
                <span className="text-xs font-medium">Duration</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{plan.duration_weeks} weeks</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Target size={16} />
                <span className="text-xs font-medium">Assigned</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{plan.assigned_customer_ids?.length || 0} clients</p>
            </div>
            
            {plan.start_date && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Calendar size={16} />
                  <span className="text-xs font-medium">Start Date</span>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(plan.start_date).toLocaleDateString()}
                </p>
              </div>
            )}
            
            {plan.end_date && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <Calendar size={16} />
                  <span className="text-xs font-medium">End Date</span>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(plan.end_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Exercises by Day */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Dumbbell size={20} className="text-purple-600" />
              Exercises
            </h3>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading exercises...</p>
              </div>
            ) : sortedDays.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Dumbbell size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600">No exercises added yet</p>
                <p className="text-sm text-gray-500 mt-1">Click "Edit Plan" to add exercises</p>
              </div>
            ) : (
              sortedDays.map(day => (
                <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Day Header */}
                  <button
                    onClick={() => toggleDay(parseInt(day))}
                    className="w-full bg-gray-50 hover:bg-gray-100 p-4 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {day}
                      </div>
                      <span className="font-semibold text-gray-900">Day {day}</span>
                      <span className="text-sm text-gray-500">
                        ({exercisesByDay[day].length} exercise{exercisesByDay[day].length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    {expandedDays.includes(parseInt(day)) ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </button>

                  {/* Exercise List */}
                  {expandedDays.includes(parseInt(day)) && (
                    <div className="p-4 space-y-3 bg-white">
                      {exercisesByDay[day].map((exercise, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              #{idx + 1}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            {exercise.sets && (
                              <div>
                                <span className="text-gray-500">Sets:</span>
                                <span className="ml-2 font-medium text-gray-900">{exercise.sets}</span>
                              </div>
                            )}
                            {exercise.reps && (
                              <div>
                                <span className="text-gray-500">Reps:</span>
                                <span className="ml-2 font-medium text-gray-900">{exercise.reps}</span>
                              </div>
                            )}
                            {exercise.rest_seconds && (
                              <div className="flex items-center gap-1">
                                <Clock size={14} className="text-gray-400" />
                                <span className="text-gray-500">Rest:</span>
                                <span className="ml-1 font-medium text-gray-900">{exercise.rest_seconds}s</span>
                              </div>
                            )}
                            {exercise.tempo && (
                              <div>
                                <span className="text-gray-500">Tempo:</span>
                                <span className="ml-2 font-medium text-gray-900">{exercise.tempo}</span>
                              </div>
                            )}
                          </div>

                          {exercise.instructions && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium text-gray-700">Instructions:</span> {exercise.instructions}
                              </p>
                            </div>
                          )}

                          {exercise.notes && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium text-gray-700">Notes:</span> {exercise.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(plan)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Edit size={18} />
              Edit Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrainingPlanDetailModal;
