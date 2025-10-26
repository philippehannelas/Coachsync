import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthForm from './components/AuthForm';
import CoachDashboard from './components/Dashboard/CoachDashboard';
import CustomerDashboard from './components/Dashboard/CustomerDashboard';
import CoachCalendarPage from './components/Calendar/CoachCalendarPage';
import CustomerCalendarPage from './components/Calendar/CustomerCalendarPage';
import { Calendar, Users, LayoutDashboard, LogOut } from 'lucide-react';

function AppContent() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!user) {
    return <AuthForm />;
  }

  const isCoach = user.role === 'coach';

  const handleLogout = () => {
    logout();
    setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">CS</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  CoachSync
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentPage === 'dashboard'
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              <button
                onClick={() => setCurrentPage('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentPage === 'calendar'
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="hidden sm:inline">Calendar</span>
              </button>

              {isCoach && (
                <button
                  onClick={() => setCurrentPage('customers')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    currentPage === 'customers'
                      ? 'bg-purple-100 text-purple-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="hidden sm:inline">Customers</span>
                </button>
              )}

              <div className="h-6 w-px bg-gray-300"></div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main>
        {currentPage === 'dashboard' && (
          isCoach ? (
            <CoachDashboard onNavigate={setCurrentPage} />
          ) : (
            <CustomerDashboard userProfile={user} onNavigate={setCurrentPage} />
          )
        )}

        {currentPage === 'calendar' && (
          isCoach ? (
            <CoachCalendarPage />
          ) : (
            <CustomerCalendarPage userProfile={user} />
          )
        )}

        {currentPage === 'customers' && isCoach && (
          <CoachDashboard onNavigate={setCurrentPage} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

