import React, { useState, useEffect } from 'react';
import { User, Moon, Sun, Bell, Lock, LogOut, ChevronRight, Mail, Phone, Palette } from 'lucide-react';
import { authAPI } from '../../services/api.jsx';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchUserData();
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark-theme');
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('coachsync_token');
      localStorage.removeItem('theme');
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">
                {user?.first_name} {user?.last_name}
              </h3>
              <p className="text-sm text-gray-500">{user?.role === 'coach' ? 'Coach' : 'User'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{user?.email || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900">{user?.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/coach/profile')}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200"
          >
            <User size={18} />
            Edit Profile
          </button>
        </div>

        {/* Appearance Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h2>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="h-5 w-5 text-purple-600" /> : <Sun className="h-5 w-5 text-yellow-600" />}
              <div>
                <p className="font-medium text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-500">Switch between light and dark theme</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                darkMode ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="space-y-2">
            <button
              onClick={() => navigate('/coach/branding')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">Branding</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => alert('Notifications settings coming soon!')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Notifications</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => alert('Change password coming soon!')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">Change Password</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-all duration-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </main>
    </div>
  );
};

export default SettingsPage;
