import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, CreditCard, Calendar, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import MobilePageLayout from './MobilePageLayout';

function CustomerProfilePage() {
  const { user } = useAuth();
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerProfile();
  }, []);

  const fetchCustomerProfile = async () => {
    try {
      const token = localStorage.getItem('coachsync_token');
      const response = await fetch('https://coachsync-pro.onrender.com/api/customer/profile', {
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

  if (loading) {
    return (
      <MobilePageLayout title="Profile">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MobilePageLayout>
    );
  }

  const credits = customerData?.session_credits || 0;
  const creditsStatus = credits > 5 ? 'good' : credits > 2 ? 'medium' : 'low';

  return (
    <MobilePageLayout title="Profile">
      <div className="p-4 space-y-4">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <User className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-blue-100">Customer</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-md p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            </div>
          </div>

          {user?.phone && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900">{user.phone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Session Credits */}
        <div className={`bg-white rounded-xl shadow-md p-4 border-l-4 ${
          creditsStatus === 'good' ? 'border-green-500' :
          creditsStatus === 'medium' ? 'border-yellow-500' :
          'border-red-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Session Credits</p>
              <p className={`text-3xl font-bold mt-1 ${
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
              <CreditCard className={`w-8 h-8 ${
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

        {/* Coach Info */}
        {customerData?.coach && (
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Your Coach</h3>
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="bg-blue-500 p-3 rounded-full">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {customerData.coach.user?.first_name} {customerData.coach.user?.last_name}
                </p>
                {customerData.coach.user?.email && (
                  <p className="text-sm text-gray-600">{customerData.coach.user.email}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MobilePageLayout>
  );
}

export default CustomerProfilePage;
