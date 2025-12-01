import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Calendar, ChevronRight, Play } from 'lucide-react';
import MobilePageLayout from './MobilePageLayout';

function StartWorkoutPage() {
  const navigate = useNavigate();
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainingPlans();
  }, []);

  const fetchTrainingPlans = async () => {
    try {
      const token = localStorage.getItem('coachsync_token');
      const response = await fetch('/api/customer/training-plans', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTrainingPlans(data);
      }
    } catch (error) {
      console.error('Error fetching training plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = (planId, dayNumber) => {
    navigate(`/customer/workout/${planId}/${dayNumber}`);
  };

  if (loading) {
    return (
      <MobilePageLayout title="Start Workout">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MobilePageLayout>
    );
  }

  return (
    <MobilePageLayout title="Start Workout">
      <div className="p-4 space-y-4">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <Dumbbell className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Ready to Train?</h2>
              <p className="text-green-100">Select a workout to begin</p>
            </div>
          </div>
        </div>

        {/* Training Plans List */}
        {trainingPlans.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-md">
            <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Training Plans</h3>
            <p className="text-gray-600">Your coach hasn't assigned any training plans yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trainingPlans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Plan Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-blue-100 text-sm mt-1">{plan.description}</p>
                  )}
                </div>

                {/* Days List */}
                <div className="divide-y divide-gray-100">
                  {Array.from({ length: plan.days_per_week }, (_, i) => i + 1).map((dayNumber) => {
                    const exerciseCount = plan.exercises?.filter(ex => ex.day_number === dayNumber).length || 0;
                    
                    return (
                      <button
                        key={dayNumber}
                        onClick={() => startWorkout(plan.id, dayNumber)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <Calendar className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-gray-900">Day {dayNumber}</h4>
                            <p className="text-sm text-gray-600">{exerciseCount} exercises</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-green-500 p-2 rounded-lg">
                            <Play className="w-5 h-5 text-white" />
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobilePageLayout>
  );
}

export default StartWorkoutPage;
