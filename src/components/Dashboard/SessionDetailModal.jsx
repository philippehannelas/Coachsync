import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Clock, Dumbbell, ChevronDown, ChevronUp, Phone, Mail, CreditCard, FileText } from 'lucide-react';

/**
 * SessionDetailModal - View session details with customer info and training plan
 * Used when coach clicks on a session from Today's Sessions
 */
function SessionDetailModal({ booking, customer, onClose }) {
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlans, setExpandedPlans] = useState([]);

  useEffect(() => {
    if (customer?.id) {
      fetchCustomerPlans();
    }
  }, [customer]);

  const fetchCustomerPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://coachsync-pro.onrender.com/api/coach/training-plans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const allPlans = await response.json();
        // Filter plans assigned to this customer and active
        const customerPlans = allPlans.filter(plan => 
          plan.assigned_customer_ids?.includes(customer.id) && plan.status === 'active'
        );
        setTrainingPlans(customerPlans);
        // Auto-expand first plan
        if (customerPlans.length > 0) {
          setExpandedPlans([customerPlans[0].id]);
        }
      }
    } catch (error) {
      console.error('Error fetching training plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlan = (planId) => {
    setExpandedPlans(prev =>
      prev.includes(planId) ? prev.filter(id => id !== planId) : [...prev, planId]
    );
  };

  if (!booking || !customer) return null;

  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  const duration = Math.round((endTime - startTime) / (1000 * 60)); // minutes

  // Group exercises by day for each plan
  const getExercisesByDay = (plan) => {
    const exercisesByDay = {};
    (plan.exercises || []).forEach(exercise => {
      const day = exercise.day_number || 1;
      if (!exercisesByDay[day]) {
        exercisesByDay[day] = [];
      }
      exercisesByDay[day].push(exercise);
    });
    return exercisesByDay;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">Session Details</h2>
              <p className="text-blue-100">
                {startTime.toLocaleDateString()} • {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-500 rounded-lg p-2 transition-colors ml-4"
            >
              <X size={24} />
            </button>
          </div>

          {/* Session Info */}
          <div className="flex items-center gap-4 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{duration} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span className="capitalize">{booking.status}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {(customer.user?.first_name?.[0] || customer.first_name?.[0] || 'C').toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {customer.user?.first_name || customer.first_name} {customer.user?.last_name || customer.last_name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <CreditCard size={14} />
                  <span className="font-semibold">{customer.session_credits || 0} credits</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              {customer.user?.phone && (
                <a
                  href={`tel:${customer.user.phone}`}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                >
                  <Phone size={16} />
                  Call
                </a>
              )}
              {customer.user?.email && (
                <a
                  href={`mailto:${customer.user.email}`}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                >
                  <Mail size={16} />
                  Email
                </a>
              )}
            </div>
          </div>

          {/* Training Plans */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Dumbbell size={20} />
              Active Training Plans
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : trainingPlans.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No active training plans for this customer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trainingPlans.map(plan => {
                  const exercisesByDay = getExercisesByDay(plan);
                  const sortedDays = Object.keys(exercisesByDay).sort((a, b) => parseInt(a) - parseInt(b));
                  const isExpanded = expandedPlans.includes(plan.id);

                  return (
                    <div key={plan.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Plan Header */}
                      <button
                        onClick={() => togglePlan(plan.id)}
                        className="w-full bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 p-4 flex items-center justify-between transition-colors"
                      >
                        <div className="text-left flex-1">
                          <h4 className="font-bold text-gray-900">{plan.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                          <div className="flex gap-3 mt-2 text-xs text-gray-500">
                            <span className="capitalize">{plan.difficulty}</span>
                            <span>•</span>
                            <span>{plan.duration_weeks} weeks</span>
                            <span>•</span>
                            <span>{(plan.exercises || []).length} exercises</span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 ml-4" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 ml-4" />
                        )}
                      </button>

                      {/* Exercises */}
                      {isExpanded && (
                        <div className="p-4 bg-white">
                          {sortedDays.map(day => {
                            const dayExercises = exercisesByDay[day];
                            return (
                              <div key={day} className="mb-4 last:mb-0">
                                <div className="bg-gray-100 px-3 py-2 rounded-lg mb-2">
                                  <h5 className="font-semibold text-gray-900 text-sm">Day {day} ({dayExercises.length} exercises)</h5>
                                </div>
                                <div className="space-y-3 pl-3">
                                  {dayExercises.map((exercise, index) => (
                                    <div key={index} className="border-l-2 border-purple-200 pl-3">
                                      <h6 className="font-semibold text-gray-900 text-sm">{exercise.name}</h6>
                                      <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-1">
                                        <span className="font-medium">{exercise.sets} sets × {exercise.reps} reps</span>
                                        {exercise.rest_seconds && (
                                          <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {exercise.rest_seconds}s rest
                                          </span>
                                        )}
                                        {exercise.tempo && <span>Tempo: {exercise.tempo}</span>}
                                      </div>
                                      {exercise.instructions && (
                                        <p className="text-xs text-gray-500 mt-1 italic">{exercise.instructions}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionDetailModal;
