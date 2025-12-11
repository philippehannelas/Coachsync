import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, CreditCard, Calendar, Star, Copy, Check, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import MobilePageLayout from './MobilePageLayout';
import { API_BASE_URL } from '../../config';

function CustomerProfilePage() {
  const { user } = useAuth();
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    fetchCustomerProfile();
  }, []);

  const fetchCustomerProfile = async () => {
    try {
      const token = localStorage.getItem('coachsync_token');
      const response = await fetch(`${API_BASE_URL}/api/customer/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomerData(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Get user initials for avatar
  const getInitials = () => {
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <MobilePageLayout title="Profile">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading profile...</p>
          </div>
        </div>
      </MobilePageLayout>
    );
  }

  const credits = customerData?.session_credits || 0;
  const creditsStatus = credits > 5 ? 'good' : credits > 2 ? 'medium' : 'low';
  const creditsPercentage = Math.min((credits / 10) * 100, 100);

  return (
    <MobilePageLayout title="Profile">
      <div className="p-4 space-y-6">
        {/* Enhanced Profile Header with Gradient and Avatar */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-3xl p-8 text-white shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>
          
          <div className="relative flex flex-col items-center text-center">
            {/* Avatar with initials */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-white/30 rounded-full blur-xl"></div>
              <div className="relative bg-white/20 backdrop-blur-sm p-8 rounded-full border-4 border-white/30 shadow-xl">
                <User className="w-16 h-16" />
              </div>
              {/* Alternative: Show initials */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold">{getInitials()}</span>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold mb-1">
              {user?.first_name} {user?.last_name}
            </h2>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <Star className="w-4 h-4" />
              <p className="text-sm font-medium">Customer</p>
            </div>
          </div>
        </div>

        {/* Enhanced Contact Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-blue-600" />
            Contact Information
          </h3>
          
          {/* Email */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl mb-3 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-blue-500 p-3 rounded-xl shadow-md">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium">Email</p>
                <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(user?.email, 'email')}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              {copiedField === 'email' ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Phone */}
          {user?.phone && (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-green-500 p-3 rounded-xl shadow-md">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Phone</p>
                  <p className="text-sm font-semibold text-gray-900">{user.phone}</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(user?.phone, 'phone')}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                {copiedField === 'phone' ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Enhanced Session Credits with Gradient */}
        <div className={`relative overflow-hidden rounded-2xl shadow-xl`}
          style={{ 
            background: creditsStatus === 'good' 
              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              : creditsStatus === 'medium'
              ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
              : 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)'
          }}
        >
          <div className="p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/90 text-sm font-medium mb-1 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Session Credits
                </p>
                <p className="text-5xl font-bold">
                  {credits}
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                <div className="relative bg-white/30 p-4 rounded-2xl backdrop-blur-sm">
                  <CreditCard className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/20 rounded-full h-2 mb-3 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${creditsPercentage}%` }}
              ></div>
            </div>

            {credits <= 2 ? (
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30">
                <p className="text-white text-sm font-medium flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Low credits! Contact your coach to add more.
                </p>
              </div>
            ) : (
              <p className="text-white/80 text-sm">
                {credits > 5 ? 'You\'re all set! 🎉' : 'Running low on credits'}
              </p>
            )}
          </div>
        </div>

        {/* Enhanced Coach Info */}
        {customerData?.coach && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Your Coach
            </h3>
            <div className="relative overflow-hidden p-5 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all duration-300">
              {/* Decorative element */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full -translate-y-12 translate-x-12"></div>
              
              <div className="relative flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900">
                    {customerData.coach.user?.first_name} {customerData.coach.user?.last_name}
                  </p>
                  {customerData.coach.user?.email && (
                    <p className="text-sm text-gray-600 mt-1">{customerData.coach.user.email}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Certified Trainer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats (Optional - can show membership info, streak, etc.) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Member Since</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Total Sessions</p>
            </div>
            <p className="text-lg font-bold text-gray-900">0</p>
          </div>
        </div>
      </div>
    </MobilePageLayout>
  );
}

export default CustomerProfilePage;
