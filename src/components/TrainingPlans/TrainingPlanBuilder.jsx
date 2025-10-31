import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, GripVertical, Users, Calendar } from 'lucide-react';

function TrainingPlanBuilder({ plan, customers, onSave, onCancel }) {
  const [planData, setPlanData] = useState({
    name: '',
    description: '',
    difficulty: 'beginner',
    duration_weeks: 4,
    is_active: true
  });
  
  const [exercises, setExercises] = useState([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [assignedCustomers, setAssignedCustomers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setPlanData({
        name: plan.name,
        description: plan.description || '',
        difficulty: plan.difficulty,
        duration_weeks: plan.duration_weeks,
        is_active: plan.is_active
      });
      setAssignedCustomers(plan.assigned_customer_ids || []);
      loadExercises(plan.id);
    }
  }, [plan]);

  const loadExercises = async (planId) => {
    try {
      const response = await fetch(`https://coachsync-pro.onrender.com/api/coach/training-plans/${planId}/exercises`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const handleSavePlan = async () => {
    try {
      setSaving(true);
      
      let planId = plan?.id;
      
      // Create or update plan
      if (plan) {
        // Update existing plan
        const response = await fetch(`https://coachsync-pro.onrender.com/api/coach/training-plans/${plan.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(planData)
        });
        
        if (!response.ok) throw new Error('Failed to update plan');
      } else {
        // Create new plan
        const response = await fetch('https://coachsync-pro.onrender.com/api/coach/training-plans', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(planData)
        });
        
        if (!response.ok) throw new Error('Failed to create plan');
        const newPlan = await response.json();
        planId = newPlan.id;
      }
      
      // Save exercises
      for (const exercise of exercises) {
        if (exercise.id && exercise.id.startsWith('new-')) {
          // Create new exercise
          await fetch(`https://coachsync-pro.onrender.com/api/coach/training-plans/${planId}/exercises`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(exercise)
          });
        } else if (exercise.id) {
          // Update existing exercise
          await fetch(`https://coachsync-pro.onrender.com/api/coach/exercises/${exercise.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(exercise)
          });
        }
      }
      
      // Handle customer assignments
      const currentAssigned = plan?.assigned_customer_ids || [];
      const toAssign = assignedCustomers.filter(id => !currentAssigned.includes(id));
      const toUnassign = currentAssigned.filter(id => !assignedCustomers.includes(id));
      
      // Assign new customers
      for (const customerId of toAssign) {
        await fetch(`https://coachsync-pro.onrender.com/api/coach/training-plans/${planId}/assign`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ customer_id: customerId })
        });
      }
      
      // Unassign removed customers
      for (const customerId of toUnassign) {
        await fetch(`https://coachsync-pro.onrender.com/api/coach/training-plans/${planId}/unassign`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ customer_id: customerId })
        });
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Failed to save training plan');
    } finally {
      setSaving(false);
    }
  };

  const addExercise = () => {
    const newExercise = {
      id: `new-${Date.now()}`,
      name: '',
      sets: 3,
      reps: '10-12',
      rest_seconds: 60,
      tempo: '',
      instructions: '',
      video_url: '',
      notes: '',
      order: exercises.filter(e => e.day_number === selectedDay).length,
      day_number: selectedDay
    };
    setExercises([...exercises, newExercise]);
  };

  const updateExercise = (id, field, value) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
  };

  const deleteExercise = async (id) => {
    if (id.startsWith('new-')) {
      setExercises(exercises.filter(ex => ex.id !== id));
    } else {
      try {
        await fetch(`https://coachsync-pro.onrender.com/api/coach/exercises/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
            'Content-Type': 'application/json'
          }
        });
        setExercises(exercises.filter(ex => ex.id !== id));
      } catch (error) {
        console.error('Error deleting exercise:', error);
      }
    }
  };

  const toggleCustomerAssignment = (customerId) => {
    if (assignedCustomers.includes(customerId)) {
      setAssignedCustomers(assignedCustomers.filter(id => id !== customerId));
    } else {
      setAssignedCustomers([...assignedCustomers, customerId]);
    }
  };

  const dayExercises = exercises.filter(ex => ex.day_number === selectedDay);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {plan ? 'Edit Training Plan' : 'Create Training Plan'}
            </h1>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5 inline mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                disabled={saving || !planData.name}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5 inline mr-2" />
                {saving ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Plan Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Plan Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    value={planData.name}
                    onChange={(e) => setPlanData({ ...planData, name: e.target.value })}
                    placeholder="e.g., Beginner Strength Program"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={planData.description}
                    onChange={(e) => setPlanData({ ...planData, description: e.target.value })}
                    placeholder="Describe the program goals and approach..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={planData.difficulty}
                    onChange={(e) => setPlanData({ ...planData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (weeks)
                  </label>
                  <input
                    type="number"
                    value={planData.duration_weeks}
                    onChange={(e) => setPlanData({ ...planData, duration_weeks: parseInt(e.target.value) })}
                    min="1"
                    max="52"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={planData.is_active}
                    onChange={(e) => setPlanData({ ...planData, is_active: e.target.checked })}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active (visible to assigned clients)
                  </label>
                </div>
              </div>
            </div>

            {/* Assign to Customers */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Assign to Clients
              </h2>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {customers.length === 0 ? (
                  <p className="text-sm text-gray-500">No customers yet</p>
                ) : (
                  customers.map(customer => (
                    <label
                      key={customer.id}
                      className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={assignedCustomers.includes(customer.id)}
                        onChange={() => toggleCustomerAssignment(customer.id)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        {customer.user ? `${customer.user.first_name} ${customer.user.last_name}` : 'Unknown'}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Exercises */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Workout Days
                </h2>
                <button
                  onClick={addExercise}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Exercise
                </button>
              </div>

              {/* Day Selector */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      selectedDay === day
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Day {day}
                    {exercises.filter(e => e.day_number === day).length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-30 rounded-full text-xs">
                        {exercises.filter(e => e.day_number === day).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Exercises List */}
              <div className="space-y-4">
                {dayExercises.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No exercises for Day {selectedDay} yet</p>
                    <button
                      onClick={addExercise}
                      className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                    >
                      + Add First Exercise
                    </button>
                  </div>
                ) : (
                  dayExercises.map((exercise, index) => (
                    <div key={exercise.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <GripVertical className="w-5 h-5 text-gray-400 mt-2 flex-shrink-0" />
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={exercise.name}
                              onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                              placeholder="Exercise name"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                              onClick={() => deleteExercise(exercise.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Sets</label>
                              <input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Reps</label>
                              <input
                                type="text"
                                value={exercise.reps}
                                onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                                placeholder="10-12"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Rest (sec)</label>
                              <input
                                type="number"
                                value={exercise.rest_seconds}
                                onChange={(e) => updateExercise(exercise.id, 'rest_seconds', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Instructions</label>
                            <textarea
                              value={exercise.instructions}
                              onChange={(e) => updateExercise(exercise.id, 'instructions', e.target.value)}
                              placeholder="Form cues and technique notes..."
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrainingPlanBuilder;

