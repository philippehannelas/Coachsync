import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, FileText, User, Mail, Phone, Dumbbell, BarChart3, History, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import AthleteHubLogo from '../AthleteHubLogo';
import SessionHistoryView from '../SessionNotes/SessionHistoryView';
import MobileBottomNav from '../Customer/MobileBottomNav';

function CustomerDashboard({ user, onNavigate, onLogout }) {
  const navigate = useNavigate();
  const [credits, setCredits] = useState(0);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [coachBranding, setCoachBranding] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('🔍 CustomerDashboard render - user:', user, 'loading:', loading);

  useEffect(() => {
    console.log('🔄 useEffect triggered - user:', user);
    
    const fetchData = async () => {
      if (!user) {
        console.log('⚠️ No user, skipping fetch');
        return;
      }
      
      console.log('🚀 Starting data fetch...');
      setLoading(true);
      
      try {
        // Fetch profile using customerAPI
        console.log('📡 Fetching profile...');
        const profileResponse = await customerAPI.getProfile();
        console.log('✅ Profile data:', profileResponse.data);
        setUserProfile(profileResponse.data);
        setCredits(profileResponse.data.session_credits || 0);

        // Fetch bookings using customerAPI
        console.log('📡 Fetching bookings...');
        const bookingsResponse = await customerAPI.getBookings();
        console.log('✅ Bookings data:', bookingsResponse.data);
        
        // Filter for upcoming bookings only (confirmed/pending, future dates)
        const now = new Date();
        const upcoming = bookingsResponse.data.filter(booking => {
          const bookingDate = new Date(booking.start_time);
          return (booking.status === 'confirmed' || booking.status === 'pending') && bookingDate > now;
        });
        setUpcomingBookings(upcoming);

        // Fetch coach branding using customerAPI
        console.log('📡 Fetching coach branding...');
        const brandingResponse = await customerAPI.getCoachBranding();
        console.log('✅ Coach branding data:', brandingResponse.data);
        setCoachBranding(brandingResponse.data);
      } catch (error) {
        console.error('💥 Error fetching data:', error);
        console.error('Error details:', error.response?.data || error.message);
      } finally {
        console.log('🏁 Setting loading to FALSE');
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Show loading spinner while data is being fetched
  if (loading) {
    console.log('⏳ Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
          <p className="mt-2 text-xs text-gray-500">Check console (F12) for debug info</p>
        </div>
      </div>
    );
  }

  console.log('✨ Rendering dashboard content');

  const creditsStatus = credits > 5 ? 'good' : credits > 2 ? 'medium' : 'low';

  // Use coach branding colors or default colors
  const brandColor = coachBranding?.brand_color_primary || '#625ff7';
  const headerGradient = `linear-gradient(to right, ${brandColor}, ${brandColor}dd)`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20">
      {/* Header with Coach Branding */}
      <header className="text-white shadow-lg" style={{ background: headerGradient }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {coachBranding?.logo_url ? (
                <img 
                  src={coachBranding.logo_url} 
                  alt="Coach Logo" 
                  className="h-10 w-auto"
                />
              ) : (
                <AthleteHubLogo className="h-10 w-auto" color="white" />
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Welcome back, {user?.first_name || 'User'}!
                </h1>
                {coachBranding?.motto && (
                  <p className="text-white/90 text-sm mt-1">{coachBranding.motto}</p>
                )}
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
              {upcomingBookings.length === 0 ? 'No sessions booked' : `${upcomingBookings.length} sessions booked`}
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

        {/* Coach Profile Card with Branding */}
        {coachBranding && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-start space-x-6">
              {coachBranding.profile_photo_url && (
                <img 
                  src={coachBranding.profile_photo_url} 
                  alt="Coach Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 shadow-lg"
                  style={{ borderColor: brandColor }}
                />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {coachBranding.business_name || 'Your Coach'}
                </h2>
                {coachBranding.motto && (
                  <p className="text-lg font-medium mb-3" style={{ color: brandColor }}>
                    {coachBranding.motto}
                  </p>
                )}
                {coachBranding.description && (
                  <p className="text-gray-600 leading-relaxed">
                    {coachBranding.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Book a Session */}
          <button
            onClick={() => navigate('/customer/calendar')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left group"
            style={{ 
              borderLeft: `4px solid ${brandColor}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:scale-105 transition-transform">
                  Book a Session
                </h3>
                <p className="text-gray-600">Schedule your next training session</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: `${brandColor}15` }}>
                <Calendar className="h-8 w-8" style={{ color: brandColor }} />
              </div>
            </div>
          </button>

          {/* View Training Plans */}
          <button
            onClick={() => navigate('/customer/training-plans')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left group border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:scale-105 transition-transform">
                  Training Plans
                </h3>
                <p className="text-gray-600">View your personalized workout plans</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Dumbbell className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </button>

          {/* Session History */}
          <button
            onClick={() => navigate('/customer/history')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left group border-l-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:scale-105 transition-transform">
                  Session History
                </h3>
                <p className="text-gray-600">Review past sessions and progress</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <History className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </button>

          {/* Profile Settings */}
          <button
            onClick={() => navigate('/customer/profile')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left group border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:scale-105 transition-transform">
                  Profile Settings
                </h3>
                <p className="text-gray-600">Update your personal information</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <User className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </button>
        </div>

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-6 w-6 mr-2" style={{ color: brandColor }} />
              Upcoming Sessions
            </h2>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: `${brandColor}15` }}>
                      <Calendar className="h-6 w-6" style={{ color: brandColor }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Training Session</p>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.start_time).toLocaleDateString()} at {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

export default CustomerDashboard;
