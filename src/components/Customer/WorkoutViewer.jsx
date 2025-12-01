import React, { useState, useEffect } from 'react';
import { Play, Pause, Check, X, Clock, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import ExerciseVideoPlayer from '../TrainingPlans/ExerciseVideoPlayer';

function WorkoutViewer({ trainingPlanId, dayNumber, onComplete, onCancel }) {
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exerciseStates, setExerciseStates] = useState({});
  const [currentExercise, setCurrentExercise] = useState(null);
  const [restTimer, setRestTimer] = useState(null);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [expandedExercises, setExpandedExercises] = useState({});

  useEffect(() => {
    loadWorkout();
    setStartTime(new Date());
  }, [trainingPlanId, dayNumber]);

  useEffect(() => {
    let interval;
    if (isResting && restTimeLeft > 0) {
      interval = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            setIsResting(false);
            // Play notification sound or vibrate
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimeLeft]);

  const loadWorkout = async () => {
    try {
      const response = await fetch(
        `https://coachsync-pro.onrender.com/api/customer/workouts/${trainingPlanId}/day/${dayNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWorkout(data);
        
        // Initialize exercise states
        const states = {};
        data.exercises.forEach(ex => {
          states[ex.id] = {
            setsCompleted: 0,
            repsPerSet: [],
            weightPerSet: [],
            notes: '',
            isCompleted: false
          };
        });
        setExerciseStates(states);
        
        // Expand first exercise by default
        if (data.exercises.length > 0) {
          setExpandedExercises({ [data.exercises[0].id]: true });
        }
      }
    } catch (error) {
      console.error('Error loading workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExerciseExpanded = (exerciseId) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const markSetComplete = (exerciseId, setNumber) => {
    const exercise = workout.exercises.find(ex => ex.id === exerciseId);
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        setsCompleted: Math.max(prev[exerciseId].setsCompleted, setNumber + 1)
      }
    }));

    // Start rest timer
    if (exercise && setNumber < exercise.sets - 1) {
      startRestTimer(exercise.rest_seconds || 60);
    }
  };

  const startRestTimer = (seconds) => {
    setRestTimeLeft(seconds);
    setIsResting(true);
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimeLeft(0);
  };

  const toggleExerciseComplete = (exerciseId) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        isCompleted: !prev[exerciseId].isCompleted
      }
    }));
  };

  const handleCompleteWorkout = async () => {
    const duration = Math.round((new Date() - startTime) / 1000 / 60); // minutes

    const workoutData = {
      training_plan_id: trainingPlanId,
      day_number: dayNumber,
      duration_minutes: duration,
      exercises: workout.exercises.map(ex => ({
        exercise_id: ex.id,
        sets_completed: exerciseStates[ex.id]?.setsCompleted || 0,
        reps_completed: exerciseStates[ex.id]?.repsPerSet.join(',') || '',
        weight_used: exerciseStates[ex.id]?.weightPerSet.join(',') || '',
        notes: exerciseStates[ex.id]?.notes || ''
      }))
    };

    try {
      const response = await fetch(
        'https://coachsync-pro.onrender.com/api/customer/workouts/complete',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(workoutData)
        }
      );

      if (response.ok) {
        onComplete();
      }
    } catch (error) {
      console.error('Error completing workout:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workout...</p>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Workout not found</p>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const completedExercises = Object.values(exerciseStates).filter(s => s.isCompleted).length;
  const totalExercises = workout.exercises.length;
  const progressPercentage = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {workout.plan.name}
              </h1>
              <p className="text-sm text-gray-600">Day {dayNumber}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>{completedExercises} of {totalExercises} exercises</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rest Timer Overlay */}
      {isResting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
            <Clock className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Rest Time</h2>
            <div className="text-6xl font-bold text-purple-600 mb-6">
              {Math.floor(restTimeLeft / 60)}:{String(restTimeLeft % 60).padStart(2, '0')}
            </div>
            <button
              onClick={skipRest}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Skip Rest
            </button>
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 space-y-3">
        {workout.exercises.map((exercise, index) => {
          const state = exerciseStates[exercise.id] || {};
          const isExpanded = expandedExercises[exercise.id];
          
          return (
            <div
              key={exercise.id}
              className={`bg-white rounded-lg border-2 transition-all ${
                state.isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              {/* Exercise Header */}
              <div
                className="p-3 sm:p-4 cursor-pointer"
                onClick={() => toggleExerciseExpanded(exercise.id)}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExerciseComplete(exercise.id);
                    }}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      state.isCompleted
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {state.isCompleted && <Check className="w-4 h-4 text-white" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
                    <p className="text-sm text-gray-600">
                      {exercise.sets} sets × {exercise.reps} reps
                      {exercise.rest_seconds && ` • ${exercise.rest_seconds}s rest`}
                    </p>
                    {state.setsCompleted > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        {state.setsCompleted} / {exercise.sets} sets completed
                      </p>
                    )}
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </div>
              </div>

              {/* Exercise Details (Expanded) */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-3 sm:p-4 space-y-4">
                  {/* Video */}
                  {exercise.video_url && (
                    <ExerciseVideoPlayer videoUrl={exercise.video_url} exerciseName={exercise.name} />
                  )}

                  {/* Instructions */}
                  {exercise.instructions && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{exercise.instructions}</p>
                    </div>
                  )}

                  {/* Set Tracker */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Track Sets</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[...Array(exercise.sets)].map((_, setIndex) => (
                        <button
                          key={setIndex}
                          onClick={() => markSetComplete(exercise.id, setIndex)}
                          className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            state.setsCompleted > setIndex
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 text-gray-700 hover:border-green-500'
                          }`}
                        >
                          Set {setIndex + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Complete Workout Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 sm:p-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleCompleteWorkout}
            disabled={completedExercises === 0}
            className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Complete Workout
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkoutViewer;
