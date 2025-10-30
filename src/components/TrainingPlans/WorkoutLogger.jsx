import React, { useState, useEffect } from 'react';
import { Check, X, Plus, Minus, Save, Trophy } from 'lucide-react';

function WorkoutLogger({ plan, dayNumber, onComplete, onCancel }) {
  const [exerciseLogs, setExerciseLogs] = useState([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [startTime] = useState(new Date());
  const [saving, setSaving] = useState(false);

  const exercises = plan.exercises?.filter(ex => ex.day_number === dayNumber) || [];

  useEffect(() => {
    // Initialize exercise logs
    const initialLogs = exercises.map(exercise => ({
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      sets: Array(exercise.sets).fill(null).map(() => ({
        reps_completed: null,
        weight_used: null,
        notes: ''
      }))
    }));
    setExerciseLogs(initialLogs);
  }, []);

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const newLogs = [...exerciseLogs];
    newLogs[exerciseIndex].sets[setIndex][field] = value;
    setExerciseLogs(newLogs);
  };

  const handleSaveWorkout = async () => {
    try {
      setSaving(true);
      
      const endTime = new Date();
      const durationMinutes = Math.round((endTime - startTime) / 60000);
      
      // Create workout log
      const workoutLogResponse = await fetch('https://coachsync-pro.onrender.com/api/customer/workout-logs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          training_plan_id: plan.id,
          workout_date: new Date().toISOString().split('T')[0],
          completed: true,
          notes: workoutNotes,
          duration_minutes: durationMinutes
        })
      });
      
      if (!workoutLogResponse.ok) throw new Error('Failed to create workout log');
      
      const workoutLog = await workoutLogResponse.json();
      
      // Save exercise logs
      for (const exerciseLog of exerciseLogs) {
        for (let setNumber = 0; setNumber < exerciseLog.sets.length; setNumber++) {
          const set = exerciseLog.sets[setNumber];
          if (set.reps_completed !== null || set.weight_used !== null) {
            await fetch('https://coachsync-pro.onrender.com/api/customer/exercise-logs', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                workout_log_id: workoutLog.id,
                exercise_id: exerciseLog.exercise_id,
                exercise_name: exerciseLog.exercise_name,
                set_number: setNumber + 1,
                reps_completed: set.reps_completed,
                weight_used: set.weight_used,
                notes: set.notes
              })
            });
          }
        }
      }
      
      onComplete();
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  const isWorkoutComplete = exerciseLogs.every(exerciseLog =>
    exerciseLog.sets.some(set => set.reps_completed !== null)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{plan.name}</h1>
              <p className="text-purple-100">Day {dayNumber} Workout</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleSaveWorkout}
                disabled={saving || !isWorkoutComplete}
                className="flex items-center gap-2 px-6 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Complete Workout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Workout Progress</span>
            <span className="text-sm font-medium text-purple-600">
              {exerciseLogs.filter(log => log.sets.some(s => s.reps_completed !== null)).length} / {exercises.length} exercises
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(exerciseLogs.filter(log => log.sets.some(s => s.reps_completed !== null)).length / exercises.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-6">
          {exercises.map((exercise, exerciseIndex) => (
            <div key={exercise.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-lg">
                  {exerciseIndex + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{exercise.name}</h3>
                  <p className="text-sm text-gray-600">
                    {exercise.sets} sets × {exercise.reps} reps • {exercise.rest_seconds}s rest
                  </p>
                  {exercise.instructions && (
                    <p className="text-sm text-gray-600 mt-2 bg-blue-50 p-3 rounded-lg">
                      💡 {exercise.instructions}
                    </p>
                  )}
                </div>
              </div>

              {/* Sets Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Set</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Target</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Reps</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Weight (kg)</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exerciseLogs[exerciseIndex]?.sets.map((set, setIndex) => (
                      <tr key={setIndex} className="border-b border-gray-100">
                        <td className="py-3 px-3 font-medium text-gray-900">{setIndex + 1}</td>
                        <td className="py-3 px-3 text-center text-gray-600">{exercise.reps}</td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            value={set.reps_completed || ''}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps_completed', parseInt(e.target.value) || null)}
                            placeholder="0"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-purple-500"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            step="0.5"
                            value={set.weight_used || ''}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight_used', parseFloat(e.target.value) || null)}
                            placeholder="0"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-purple-500"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          {set.reps_completed !== null && (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Workout Notes */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Workout Notes (Optional)
          </label>
          <textarea
            value={workoutNotes}
            onChange={(e) => setWorkoutNotes(e.target.value)}
            placeholder="How did you feel? Any observations?"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Complete Button (Bottom) */}
        <div className="mt-6">
          <button
            onClick={handleSaveWorkout}
            disabled={saving || !isWorkoutComplete}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
          >
            {saving ? (
              <>Saving Workout...</>
            ) : isWorkoutComplete ? (
              <>
                <Trophy className="w-6 h-6" />
                Complete Workout
              </>
            ) : (
              <>Log at least 1 set per exercise to complete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkoutLogger;

