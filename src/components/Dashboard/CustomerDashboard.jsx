import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, FileText, User, Mail, Phone, Dumbbell, BarChart3, History, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
      const token = localStorage.getItem('coachsync_token');
      console.log('🔑 Token:', token ? 'exists' : 'missing');
      
      try {
        // Fetch profile
        console.log('📡 Fetching profile...');
        const profileResponse = await fetch('https://coachsync-pro.onrender.com/api/customer/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('📥 Profile response status:', profileResponse.status);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('✅ Profile data:', profileData);
          setUserProfile(profileData);
          setCredits(profileData.credits || 0);
          
          // Fetch coach branding if coach_id exists
          if (profileData.coach_id) {
            console.log('📡 Fetching coach branding...');
            try {
              const brandingResponse = await fetch(`https://coachsync-pro.onrender.com/api/customer/coach-branding`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (brandingResponse.ok) {
                const brandingData = await brandingResponse.json();
                console.log('✅ Coach branding data:', brandingData);
                setCoachBranding(brandingData);
              }
            } catch (error) {
              console.log('⚠️ Coach branding not available:', error);
            }
          }
        } else {
          console.error('❌ Profile fetch failed:', profileResponse.status);
        }

        // Fetch bookings
        console.log('📡 Fetching bookings...');
        const bookingsResponse = await fetch('https://coachsync-pro.onrender.com/api/customer/bookings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('📥 Bookings response status:', bookingsResponse.status);
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          console.log('✅ Bookings data:', bookingsData);
          setUpcomingBookings(bookingsData);
        } else {
          console.error('❌ Bookings fetch failed:', bookingsResponse.status);
        }
      } catch (error) {
        console.error('💥 Error fetching data:', error);
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
        </div>
      </div>
    );
  }

  console.log('✨ Rendering dashboard content');

  const creditsStatus = credits > 5 ? 'good' : credits > 2 ? 'medium' : 'low';
  const brandColor = coachBranding?.brand_color_primary || '#8B5CF6';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20">
      {/* Header with Coach Branding */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" style={{
        background: coachBranding?.brand_color_primary 
          ? `linear-gradient(to right, ${coachBranding.brand_color_primary}, ${coachBranding.brand_color_primary}dd)` 
          : undefined
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {coachBranding?.logo_url ? (
                <img src={coachBranding.logo_url} alt="Coach Logo" className="h-10 w-auto object-contain" />
              ) : (
                <AthleteHubLogo className="h-10 w-auto" color="white" />
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Welcome back, {user?.first_name || 'User'}!
                </h1>
                {coachBranding?.motto && (
                  <p className="text-sm text-white/90 italic mt-1">{coachBranding.motto}</p>
                )}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Coach Info Card (if branding exists) */}
      {coachBranding && (coachBranding.profile_photo_url || coachBranding.business_name || coachBranding.description) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-start gap-4">
              {coachBranding.profile_photo_url && (
                <img 
                  src={coachBranding.profile_photo_url} 
                  alt="Your Coach" 
                  className="w-20 h-20 rounded-full object-cover border-4 border-purple-100"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800" style={{ color: brandColor }}>
                  {coachBranding.business_name || 'Your Coach'}
                </h3>
                {coachBranding.description && (
                  <p className="text-sm text-gray-600 mt-2">{coachBranding.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Credits Card */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Session Credits</p>
                <p className="text-3xl font-bold mt-1" style={{ color: brandColor }}>{credits}</p>
              </div>
              <div className={`p-4 rounded-full ${
                creditsStatus === 'good' ? 'bg-green-100' :
                creditsStatus === 'medium' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <CreditCard className={`w-8 h-8 ${
                  creditsStatus === 'good' ? 'text-green-600' :
                  creditsStatus === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {creditsStatus === 'good' ? 'You\'re all set!' :
               creditsStatus === 'medium' ? 'Consider topping up soon' :
               'Time to renew your credits'}
            </p>
          </div>

          {/* Upcoming Sessions Card */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Sessions</p>
                <p className="text-3xl font-bold mt-1" style={{ color: brandColor }}>{upcomingBookings.length}</p>
              </div>
              <div className="p-4 rounded-full bg-blue-100">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <button
              onClick={() => onNavigate('bookings')}
              className="text-sm mt-2 hover:underline"
              style={{ color: brandColor }}
            >
              View all bookings →
            </button>
          </div>

          {/* Training Plan Card */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Training Plan</p>
                <p className="text-lg font-semibold mt-1 text-gray-800">Active</p>
              </div>
              <div className="p-4 rounded-full bg-purple-100">
                <Dumbbell className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <button
              onClick={() => onNavigate('training')}
              className="text-sm mt-2 hover:underline"
              style={{ color: brandColor }}
            >
              View training plan →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Book a Session */}
          <button
            onClick={() => onNavigate('bookings')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                  Book a Session
                </h3>
                <p className="text-sm text-gray-600 mt-1">Schedule your next training session</p>
              </div>
              <Calendar className="w-8 h-8" style={{ color: brandColor }} />
            </div>
          </button>

          {/* View History */}
          <button
            onClick={() => onNavigate('history')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                  Session History
                </h3>
                <p className="text-sm text-gray-600 mt-1">Review your past sessions and notes</p>
              </div>
              <History className="w-8 h-8" style={{ color: brandColor }} />
            </div>
          </button>
        </div>

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Next Sessions</h2>
            <div className="space-y-3">
              {upcomingBookings.slice(0, 3).map((booking, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${brandColor}20` }}>
                      <Calendar className="w-5 h-5" style={{ color: brandColor }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{booking.date}</p>
                      <p className="text-sm text-gray-600">{booking.time}</p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full" style={{
                    backgroundColor: `${brandColor}20`,
                    color: brandColor
                  }}>
                    Confirmed
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onNavigate={onNavigate} />
    </div>
  );
}

export default CustomerDashboard;
