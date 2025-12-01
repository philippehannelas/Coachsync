import React, { useState, useEffect } from 'react';
import { TrendingUp, Flame, Award, Clock, Calendar, Dumbbell } from 'lucide-react';
import { getCustomerStats } from '../../services/workoutCompletionApi';
import WorkoutHistory from './WorkoutHistory';

function ProgressDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, history

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getCustomerStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
          <p className="text-gray-600 mt-1">Track your fitness journey</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-3 sm:px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6">
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Current Streak */}
              <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5" />
                  <span className="text-sm font-medium">Current Streak</span>
                </div>
                <div className="text-3xl font-bold">{stats.current_streak}</div>
                <div className="text-sm opacity-90 mt-1">
                  {stats.current_streak === 1 ? 'day' : 'days'}
                </div>
              </div>

              {/* Total Workouts */}
              <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-5 h-5" />
                  <span className="text-sm font-medium">Total Workouts</span>
                </div>
                <div className="text-3xl font-bold">{stats.total_workouts}</div>
                <div className="text-sm opacity-90 mt-1">all time</div>
              </div>

              {/* This Week */}
              <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">This Week</span>
                </div>
                <div className="text-3xl font-bold">{stats.workouts_this_week}</div>
                <div className="text-sm opacity-90 mt-1">workouts</div>
              </div>

              {/* This Month */}
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">This Month</span>
                </div>
                <div className="text-3xl font-bold">{stats.workouts_this_month}</div>
                <div className="text-sm opacity-90 mt-1">workouts</div>
              </div>

              {/* Average Duration */}
              <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">Avg Duration</span>
                </div>
                <div className="text-3xl font-bold">{stats.average_duration_minutes}</div>
                <div className="text-sm opacity-90 mt-1">minutes</div>
              </div>

              {/* Personal Records */}
              <div className="bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5" />
                  <span className="text-sm font-medium">Personal Records</span>
                </div>
                <div className="text-3xl font-bold">{stats.personal_records}</div>
                <div className="text-sm opacity-90 mt-1">PRs achieved</div>
              </div>
            </div>

            {/* Motivational Messages */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Keep Going! 💪</h2>
              {stats.current_streak === 0 && (
                <p className="text-gray-700">
                  Start your workout streak today! Consistency is key to reaching your fitness goals.
                </p>
              )}
              {stats.current_streak > 0 && stats.current_streak < 7 && (
                <p className="text-gray-700">
                  Great start! You're on a {stats.current_streak}-day streak. Keep it up to build a strong habit!
                </p>
              )}
              {stats.current_streak >= 7 && stats.current_streak < 30 && (
                <p className="text-gray-700">
                  Awesome! {stats.current_streak} days in a row! You're building incredible discipline. 🔥
                </p>
              )}
              {stats.current_streak >= 30 && (
                <p className="text-gray-700">
                  Legendary! {stats.current_streak}-day streak! You're a fitness champion! 🏆
                </p>
              )}
            </div>

            {/* Weekly Goal Progress */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Goal</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Target: 4 workouts/week</span>
                  <span className="font-semibold text-gray-900">
                    {stats.workouts_this_week} / 4
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      stats.workouts_this_week >= 4 ? 'bg-green-500' : 'bg-purple-600'
                    }`}
                    style={{ width: `${Math.min((stats.workouts_this_week / 4) * 100, 100)}%` }}
                  />
                </div>
                {stats.workouts_this_week >= 4 ? (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    ✓ Weekly goal achieved! Amazing work!
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mt-2">
                    {4 - stats.workouts_this_week} more {4 - stats.workouts_this_week === 1 ? 'workout' : 'workouts'} to reach your weekly goal
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <WorkoutHistory />
        )}
      </div>
    </div>
  );
}

export default ProgressDashboard;
