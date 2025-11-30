import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, CheckCircle, Circle, Play, ChevronRight } from 'lucide-react';
import AthleteHubLogo from '../AthleteHubLogo';
import WorkoutLogger from './WorkoutLogger';

function CustomerTrainingPlans({ userProfile }) {
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogger, setShowLogger] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch assigned training plans
      const plansResponse = await fetch('https://coachsync-pro.onrender.com/api/customer/training-plans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setTrainingPlans(plansData);
        if (plansData.length > 0 && !selectedPlan) {
          setSelectedPlan(plansData[0]);
        }
      }
      
      // Fetch workout logs
      const logsResponse = await fetch('https://coachsync-pro.onrender.com/api/customer/workout-logs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setWorkoutLogs(logsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutProgress = (planId) => {
    const planLogs = workoutLogs.filter(log => log.training_plan_id === planId && log.completed);
    const plan = trainingPlans.find(p => p.id === planId);
    if (!plan) return 0;
    
    const totalWorkouts = plan.duration_weeks * 7; // Assuming daily workouts
    return Math.round((planLogs.length / totalWorkouts) * 100);
  };

  const isDayCompleted = (planId, dayNumber) => {
    const today = new Date().toISOString().split('T')[0];
    return workoutLogs.some(log => 
      log.training_plan_id === planId && 
      log.workout_date === today &&
      log.completed
    );
  };

  const handleStartWorkout = () => {
    setShowLogger(true);
  };

  const handleWorkoutComplete = () => {
    setShowLogger(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading training plans...</p>
        </div>
      </div>
    );
  }

  if (showLogger && selectedPlan) {
    return (
      <WorkoutLogger
        plan={selectedPlan}
        dayNumber={selectedDay}
        onComplete={handleWorkoutComplete}
        onCancel={() => setShowLogger(false)}
      />
    );
  }

  if (trainingPlans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <AthleteHubLogo className="w-16 h-16 mx-auto mb-4" color="#CBD5E1" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Training Plans Yet</h2>
            <p className="text-gray-600">
              Your coach hasn't assigned you a training plan yet. Check back soon!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <AthleteHubLogo className="w-8 h-8" color="white" />
            My Training Plans
          </h1>
          <p className="text-purple-100 mt-2">Track your workouts and progress</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Plan Selector */}
        {trainingPlans.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan</label>
            <select
              value={selectedPlan?.id || ''}
              onChange={(e) => setSelectedPlan(trainingPlans.find(p => p.id === e.target.value))}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {trainingPlans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>
        )}

        {selectedPlan && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Plan Info & Progress */}
            <div className="lg:col-span-1 space-y-6">
              {/* Plan Details */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedPlan.name}</h2>
                <p className="text-gray-600 text-sm mb-4">{selectedPlan.description}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Difficulty</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedPlan.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                      selectedPlan.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedPlan.difficulty}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-semibold text-gray-900">{selectedPlan.duration_weeks} weeks</span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Progress
                  </h3>
                  <span className="text-2xl font-bold text-purple-600">
                    {getWorkoutProgress(selectedPlan.id)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${getWorkoutProgress(selectedPlan.id)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-green-600 font-medium">Completed</p>
                    <p className="text-2xl font-bold text-green-700">
                      {workoutLogs.filter(log => log.training_plan_id === selectedPlan.id && log.completed).length}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-blue-600 font-medium">This Week</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {workoutLogs.filter(log => {
                        const logDate = new Date(log.workout_date);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return log.training_plan_id === selectedPlan.id && 
                               log.completed && 
                               logDate >= weekAgo;
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Workout Days */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Workout Schedule
                  </h3>
                  <button
                    onClick={handleStartWorkout}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Start Workout
                  </button>
                </div>

                {/* Day Selector */}
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7].map(day => {
                    const completed = isDayCompleted(selectedPlan.id, day);
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`relative p-3 rounded-lg font-medium transition-all ${
                          selectedDay === day
                            ? 'bg-purple-600 text-white shadow-lg'
                            : completed
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="text-xs mb-1">Day</div>
                        <div className="text-lg font-bold">{day}</div>
                        {completed && (
                          <CheckCircle className="w-4 h-4 absolute top-1 right-1" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Exercises for Selected Day */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Day {selectedDay} Exercises
                  </h4>
                  
                  {selectedPlan.exercises?.filter(ex => ex.day_number === selectedDay).length === 0 ? (
                    <p className="text-center py-8 text-gray-500">
                      Rest day - No exercises scheduled
                    </p>
                  ) : (
                    selectedPlan.exercises
                      ?.filter(ex => ex.day_number === selectedDay)
                      .map((exercise, index) => (
                        <div
                          key={exercise.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 mb-1">{exercise.name}</h5>
                              <div className="flex gap-4 text-sm text-gray-600">
                                <span>{exercise.sets} sets</span>
                                <span>×</span>
                                <span>{exercise.reps} reps</span>
                                <span>•</span>
                                <span>{exercise.rest_seconds}s rest</span>
                              </div>
                              {exercise.instructions && (
                                <p className="text-sm text-gray-600 mt-2">{exercise.instructions}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerTrainingPlans;

