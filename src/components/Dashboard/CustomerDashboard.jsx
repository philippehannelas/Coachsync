import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, CreditCard, LogOut, Calendar, Dumbbell, TrendingUp, FileText, Star } from 'lucide-react';
import SessionHistoryView from '../SessionNotes/SessionHistoryView'; // NEW IMPORT

function CustomerDashboard({ userProfile, onLogout, onNavigate }) {
  const [customerData, setCustomerData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // NEW STATE

  useEffect(() => {
    fetchCustomerProfile();
  }, []);

  const fetchCustomerProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('coachsync_token');
      
      // Fetch both profile and bookings
      const [profileResponse, bookingsResponse] = await Promise.all([
        fetch('https://coachsync-pro.onrender.com/api/customer/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('https://coachsync-pro.onrender.com/api/customer/bookings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch customer profile');
      }

      const profileData = await profileResponse.json();
      setCustomerData(profileData);
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData);
      }
    } catch (err) {
      console.error('Error fetching customer profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-red-600 text-center mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-600">{error}</p>
          </div>
          <button
            onClick={fetchCustomerProfile}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const user = userProfile || {};
  const credits = customerData?.session_credits || 0;
  const creditsStatus = credits > 5 ? 'good' : credits > 2 ? 'medium' : 'low';
  
  // Calculate booking stats
  const now = new Date();
  const upcomingBookings = bookings.filter(b => 
    b.status === 'confirmed' && new Date(b.start_time) > now
  );
  const completedThisMonth = bookings.filter(b => {
    const bookingDate = new Date(b.start_time);
    return bookingDate.getMonth() === now.getMonth() && 
           bookingDate.getFullYear() === now.getFullYear() &&
           (b.status === 'completed' || new Date(b.start_time) < now);
  }).length;

  // NEW: Calculate session notes stats
  const sessionsWithNotes = bookings.filter(b => b.has_session_notes);
  const pendingActionItems = bookings
    .filter(b => b.action_items && b.action_items.length > 0)
    .reduce((count, b) => count + b.action_items.filter(item => !item.completed).length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CoachSync</h1>
                <p className="text-sm text-gray-600">Customer Portal</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white transform hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {user.first_name || 'there'}! 👋
              </h2>
              <p className="text-blue-100 text-lg">
                Ready to crush your fitness goals today?
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6">
                <Dumbbell className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* NEW: Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Session History
                {sessionsWithNotes.length > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                    {sessionsWithNotes.length}
                  </span>
                )}
              </div>
              {pendingActionItems > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {pendingActionItems}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
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
                <p className="text-gray-500 text-xs mt-3">
                  {upcomingBookings.length === 0 ? 'No sessions scheduled yet' : `${upcomingBookings.length} session${upcomingBookings.length > 1 ? 's' : ''} booked`}
                </p>
              </div>

              {/* Progress Card */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 transform hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">This Month</p>
                    <p className="text-4xl font-bold text-gray-900 mt-1">{completedThisMonth}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-3">Sessions completed</p>
              </div>

              {/* NEW: Session Notes Card */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 transform hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Session Notes</p>
                    <p className="text-4xl font-bold text-gray-900 mt-1">{sessionsWithNotes.length}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-3">
                  {pendingActionItems > 0 && (
                    <span className="text-red-600 font-medium">{pendingActionItems} pending tasks</span>
                  )}
                  {pendingActionItems === 0 && 'All tasks complete'}
                </p>
              </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
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

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              <button
                onClick={() => onNavigate('training-plans')}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-left group"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 p-4 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Dumbbell className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">My Workouts</h3>
                    <p className="text-gray-600">View training plans and log workouts</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('sessions')}
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
          </>
        )}

        {/* NEW: Session History Tab */}
        {activeTab === 'sessions' && (
          <SessionHistoryView userProfile={userProfile} />
        )}
      </main>
    </div>
  );
}

export default CustomerDashboard;

