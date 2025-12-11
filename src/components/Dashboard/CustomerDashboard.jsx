import React, { useState, useEffect, useRef } from 'react';
import { Calendar, CreditCard, FileText, User, Mail, Phone, Dumbbell, BarChart3, History, LogOut, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import AthleteHubLogo from '../AthleteHubLogo';
import SessionHistoryView from '../SessionNotes/SessionHistoryView';
import MobileBottomNav from '../Customer/MobileBottomNav';

// Animated Counter Component
function AnimatedCounter({ value, duration = 1000 }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count}</span>;
}

// Progress Ring Component
function ProgressRing({ progress, size = 120, strokeWidth = 8, color = '#10B981' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

function CustomerDashboard({ user, onNavigate, onLogout }) {
  const navigate = useNavigate();
  const [credits, setCredits] = useState(0);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [coachBranding, setCoachBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coachBioExpanded, setCoachBioExpanded] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);

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
        // Trigger card animations after a brief delay
        setTimeout(() => setAnimateCards(true), 100);
      }
    };

    fetchData();
  }, [user]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Get user initials for avatar
  const getInitials = () => {
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  // Show loading spinner while data is being fetched
  if (loading) {
    console.log('⏳ Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  console.log('✨ Rendering dashboard content');

  const creditsStatus = credits > 5 ? 'good' : credits > 2 ? 'medium' : 'low';
  const creditsPercentage = Math.min((credits / 10) * 100, 100); // Assuming 10 credits is 100%

  // Use coach branding colors or default colors
  const brandColor = coachBranding?.brand_color_primary || '#5B8DEF';
  const headerGradient = `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20">
      {/* Enhanced Header with Coach Branding */}
      <header className="text-white shadow-xl relative overflow-hidden" style={{ background: headerGradient }}>
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {coachBranding?.logo_url ? (
                <img 
                  src={coachBranding.logo_url} 
                  alt="Coach Logo" 
                  className="h-12 w-auto drop-shadow-lg"
                />
              ) : (
                <AthleteHubLogo className="h-12 w-auto" color="white" />
              )}
              {/* Customer Avatar with Initials */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-lg"></div>
                <div className="relative bg-white/20 backdrop-blur-sm p-3 rounded-full border-2 border-white/40 shadow-xl">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{getInitials()}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">{getGreeting()},</p>
                <h1 className="text-3xl md:text-4xl font-bold">
                  {user?.first_name || 'User'}! 👋
                </h1>
                {coachBranding?.motto && (
                  <p className="text-white/90 text-sm mt-1 italic">"{coachBranding.motto}"</p>
                )}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/30 hover:scale-105 active:scale-95"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Grid with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Session Credits Card with Gradient */}
          <div className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 ${animateCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ 
              background: creditsStatus === 'good' 
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : creditsStatus === 'medium'
                ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                : 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)',
              transitionDelay: '0ms'
            }}
          >
            <div className="p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/90 text-sm font-medium mb-1">Session Credits</p>
                  <p className="text-5xl font-bold">
                    <AnimatedCounter value={credits} />
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                  <div className="relative bg-white/30 p-4 rounded-2xl backdrop-blur-sm">
                    <CreditCard className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
              {credits <= 2 && (
                <div className="mt-3 p-3 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30">
                  <p className="text-white text-xs font-medium flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Low credits! Contact your coach to add more.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Sessions Card with Gradient */}
          <div className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 ${animateCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ 
              background: 'linear-gradient(135deg, #5B8DEF 0%, #4F7CFF 100%)',
              transitionDelay: '100ms'
            }}
          >
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm font-medium mb-1">Upcoming Sessions</p>
                  <p className="text-5xl font-bold">
                    <AnimatedCounter value={upcomingBookings.length} />
                  </p>
                  <p className="text-xs text-white/80 mt-2">
                    {upcomingBookings.length === 0 ? 'No sessions booked' : `${upcomingBookings.length} ${upcomingBookings.length === 1 ? 'session' : 'sessions'} booked`}
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                  <div className="relative bg-white/30 p-4 rounded-2xl backdrop-blur-sm">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sessions Completed Card with Gradient */}
          <div className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 ${animateCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ 
              background: 'linear-gradient(135deg, #9F7AEA 0%, #8B5CF6 100%)',
              transitionDelay: '200ms'
            }}
          >
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm font-medium mb-1">Sessions Completed</p>
                  <p className="text-5xl font-bold">
                    <AnimatedCounter value={0} />
                  </p>
                  <p className="text-xs text-white/80 mt-2">Keep up the great work! 💪</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                  <div className="relative bg-white/30 p-4 rounded-2xl backdrop-blur-sm">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Items Card with Gradient */}
          <div className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 ${animateCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ 
              background: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
              transitionDelay: '300ms'
            }}
          >
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm font-medium mb-1">Action Items</p>
                  <p className="text-5xl font-bold">
                    <AnimatedCounter value={0} />
                  </p>
                  <p className="text-xs text-white/80 mt-2">All tasks complete! ✨</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                  <div className="relative bg-white/30 p-4 rounded-2xl backdrop-blur-sm">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Coach Profile Card with Collapsible Bio */}
        {coachBranding && (
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 mb-8 border border-gray-100">
            {/* Your Personal Coach Header */}
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5" style={{ color: brandColor }} />
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Your Personal Coach</h3>
            </div>
            
            <div className="flex items-start space-x-6">
              {coachBranding.profile_photo_url && (
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-xl opacity-30" style={{ background: brandColor }}></div>
                  <img 
                    src={coachBranding.profile_photo_url} 
                    alt="Coach Profile" 
                    className="relative w-24 h-24 rounded-full object-cover border-4 shadow-xl"
                    style={{ borderColor: brandColor }}
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {coachBranding.business_name || 'Your Coach'}
                </h2>
                {coachBranding.motto && (
                  <p className="text-lg font-semibold mb-3" style={{ color: brandColor }}>
                    "{coachBranding.motto}"
                  </p>
                )}
                {coachBranding.description && (
                  <>
                    <p className={`text-gray-600 leading-relaxed transition-all duration-300 ${coachBioExpanded ? '' : 'line-clamp-2'}`}>
                      {coachBranding.description}
                    </p>
                    <button
                      onClick={() => setCoachBioExpanded(!coachBioExpanded)}
                      className="mt-2 text-sm font-medium flex items-center hover:underline transition-colors"
                      style={{ color: brandColor }}
                    >
                      {coachBioExpanded ? (
                        <>
                          Show less <ChevronUp className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        <>
                          Read more <ChevronDown className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Contact Coach Buttons */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex flex-wrap gap-3">
                {userProfile?.coach?.user?.email && (
                  <a
                    href={`mailto:${userProfile.coach.user.email}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` }}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email Coach</span>
                  </a>
                )}
                {userProfile?.coach?.user?.phone && (
                  <a
                    href={`tel:${userProfile.coach.user.phone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-xl font-medium text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call Coach</span>
                  </a>
                )}
                <button
                  onClick={() => navigate('/customer/calendar')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl font-medium text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Book Session</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Quick Actions with Pulse Animation on Primary CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Book a Session - Primary CTA with Pulse */}
          <button
            onClick={() => navigate('/customer/calendar')}
            className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 transform hover:-translate-y-2 text-left group overflow-hidden"
            style={{ 
              borderLeft: `6px solid ${brandColor}`,
            }}
          >
            {/* Pulse animation background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:scale-105 transition-transform flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" style={{ color: brandColor }} />
                  Book a Session
                </h3>
                <p className="text-gray-600">Schedule your next training session</p>
              </div>
              <div className="p-4 rounded-2xl transition-all duration-300 group-hover:scale-110" 
                style={{ backgroundColor: `${brandColor}15` }}>
                <Calendar className="h-8 w-8" style={{ color: brandColor }} />
              </div>
            </div>
          </button>

          {/* View Training Plans */}
          <button
            onClick={() => navigate('/customer/training-plans')}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 transform hover:-translate-y-2 text-left group border-l-6 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:scale-105 transition-transform">
                  Training Plans
                </h3>
                <p className="text-gray-600">View your personalized workout plans</p>
              </div>
              <div className="bg-green-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <Dumbbell className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </button>

          {/* Session History */}
          <button
            onClick={() => navigate('/customer/history')}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 transform hover:-translate-y-2 text-left group border-l-6 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:scale-105 transition-transform">
                  Session History
                </h3>
                <p className="text-gray-600">Review past sessions and progress</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <History className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </button>

          {/* Profile Settings */}
          <button
            onClick={() => navigate('/customer/profile')}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 transform hover:-translate-y-2 text-left group border-l-6 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:scale-105 transition-transform">
                  Profile Settings
                </h3>
                <p className="text-gray-600">Update your personal information</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <User className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </button>
        </div>

        {/* Enhanced Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Calendar className="h-6 w-6 mr-3" style={{ color: brandColor }} />
              Upcoming Sessions
            </h2>
            <div className="space-y-4">
              {upcomingBookings.map((booking, index) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-all duration-300 border border-gray-100"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.5s ease-out forwards'
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: `${brandColor}15` }}>
                      <Calendar className="h-6 w-6" style={{ color: brandColor }} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">Training Session</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(booking.start_time).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} at {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
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

      {/* Add keyframes for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default CustomerDashboard;
