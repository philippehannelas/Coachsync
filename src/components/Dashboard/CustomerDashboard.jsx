import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, FileText, User, Mail, Phone, Dumbbell, BarChart3, History, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AthleteHubLogo from '../AthleteHubLogo';
// SessionHistoryView removed - use bottom nav to access history
import MobileBottomNav from './MobileBottomNav';

function CustomerDashboard({ user, onNavigate, onLogout }) {
  const navigate = useNavigate();
  // Removed activeTab - using navigation instead
  const [credits, setCredits] = useState(0);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUpcomingBookings();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('coachsync_token');
      const response = await fetch('/api/customers/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setCredits(data.credits || 0);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUpcomingBookings = async () => {
    try {
      const token = localStorage.getItem('coachsync_token');
      const response = await fetch('/api/bookings/upcoming', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUpcomingBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const creditsStatus = credits > 5 ? 'good' : credits > 2 ? 'medium' : 'low';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <AthleteHubLogo className="h-10 w-auto" color="white" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Welcome back, {user.first_name}!
                </h1>
                <p className="text-blue-100 text-sm mt-1">Ready to crush your goals today?</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Session Credits Card */}
          <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 transform hover:-translate-y-1 transition-all duration-300 ${
            creditsStatus === 'good' ? 'border-green-500' :
            creditsStatus === 'medium' ? 'border-yellow-500' :
            'border-red-500'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">Session Credits</p>
                <p className={`text-4xl font-bold mt-1 ${
                  creditsStatus === 'good' ? 'text-green-600' :
                  creditsStatus === 'medium' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {credits}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                creditsStatus === 'good' ? 'bg-green-100' :
                creditsStatus === 'medium' ? 'bg-yellow-100' :
                'bg-red-100'
              }`}>
                <CreditCard className={`h-8 w-8 ${
                  creditsStatus === 'good' ? 'text-green-600' :
                  creditsStatus === 'medium' ? 'text-yellow-600' :
                  'text-red-600'
                }`} />
              </div>
            </div>
            {credits <= 2 && (
              <div className="mt-3 p-2 bg-red-50 rounded-lg">
                <p className="text-red-700 text-xs font-medium">
                  ⚠️ Low credits! Contact your coach to add more.
                </p>
              </div>
            )}
          </div>

          {/* Upcoming Sessions Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Upcoming Sessions</p>
                <p className="text-4xl font-bold text-gray-900 mt-1">{upcomingBookings.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {upcomingBookings.length === 0 ? 'No sessions booked' : '2 sessions booked'}
            </p>
          </div>

          {/* Sessions Completed Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Sessions completed</p>
                <p className="text-4xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Keep up the great work!</p>
          </div>

          {/* Tasks Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Action Items</p>
                <p className="text-4xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">All tasks complete</p>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-full">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Your Profile</h3>
              <p className="text-gray-600">Manage your personal information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <User className="h-5 w-5 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">Full Name</label>
              </div>
              <p className="text-lg font-semibold text-gray-900 ml-8">
                {user.first_name} {user.last_name}
              </p>
            </div>

            {/* Email */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Mail className="h-5 w-5 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">Email Address</label>
              </div>
              <p className="text-lg font-semibold text-gray-900 ml-8 break-all">
                {user.email || 'N/A'}
              </p>
            </div>

            {/* Phone */}
            {user.phone && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                </div>
                <p className="text-lg font-semibold text-gray-900 ml-8">
                  {user.phone}
                </p>
              </div>
            )}

            {/* Role */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <User className="h-5 w-5 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">Account Type</label>
              </div>
              <div className="ml-8">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Customer
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - NEW WORKOUT FEATURES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Book a Session */}
          <button
            onClick={() => onNavigate('calendar')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-4 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Book a Session</h3>
                <p className="text-gray-600">Schedule your next training session</p>
              </div>
            </div>
          </button>

          {/* Start Workout - NEW */}
          <button
            onClick={() => navigate('/customer/start-workout')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-4 rounded-lg group-hover:bg-white/30 transition-colors">
                <Dumbbell className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Start Workout</h3>
                <p className="text-purple-100">Begin your training session</p>
              </div>
            </div>
          </button>

          {/* My Progress - NEW */}
          <button
            onClick={() => navigate('/customer/progress')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-4 rounded-lg group-hover:bg-green-200 transition-colors">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">My Progress</h3>
                <p className="text-gray-600">View stats and achievements</p>
              </div>
            </div>
          </button>

          {/* Workout History - NEW */}
          <button
            onClick={() => navigate('/customer/workout-history')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-100 p-4 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <History className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Workout History</h3>
                <p className="text-gray-600">Review past workouts</p>
              </div>
            </div>
          </button>

          {/* My Workouts */}
          <button
            onClick={() => onNavigate('training-plans')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-4 rounded-lg group-hover:bg-purple-200 transition-colors">
                <AthleteHubLogo className="h-8 w-8" color="#0066FF" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">My Training Plans</h3>
                <p className="text-gray-600">View assigned training plans</p>
              </div>
            </div>
          </button>

          {/* View Session Notes */}
          <button
            onClick={() => navigate('/customer/workout-history')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 p-4 rounded-lg group-hover:bg-orange-200 transition-colors">
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">View Session Notes</h3>
                <p className="text-gray-600">Review your progress and action items</p>
              </div>
            </div>
          </button>
        </div>


      </main>

      {/* Bottom Navigation - Visible on all devices */}
      <MobileBottomNav />
    </div>
  );
}

export default CustomerDashboard;
