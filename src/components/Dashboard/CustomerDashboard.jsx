import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, CreditCard, LogOut, Calendar, Dumbbell, TrendingUp } from 'lucide-react';

function CustomerDashboard({ userProfile, onLogout, onNavigate }) {
  const [customerData, setCustomerData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                  Customer
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => onNavigate && onNavigate('calendar')}
              className="flex items-center justify-center space-x-3 p-6 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border border-blue-200 transition-all duration-200 transform hover:scale-105"
            >
              <Calendar className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-blue-900">Book Session</span>
            </button>
            
            <button className="flex items-center justify-center space-x-3 p-6 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl border border-purple-200 transition-all duration-200 transform hover:scale-105">
              <Dumbbell className="h-6 w-6 text-purple-600" />
              <span className="font-semibold text-purple-900">View Plans</span>
            </button>
            
            <button className="flex items-center justify-center space-x-3 p-6 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl border border-green-200 transition-all duration-200 transform hover:scale-105">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <span className="font-semibold text-green-900">Track Progress</span>
            </button>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 rounded-full p-2">
              <span className="text-white text-sm font-bold">ℹ️</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Session Booking Now Available!</p>
              <p className="text-gray-600 text-sm">
                Click "Book Session" above to view your coach's availability and schedule training sessions.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CustomerDashboard;

