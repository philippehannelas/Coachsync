import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthForm from './components/AuthForm';
import CoachDashboard from './components/Dashboard/CoachDashboard';
import CustomerDashboard from './components/Dashboard/CustomerDashboard';
import CoachCalendarPage from './components/Calendar/CoachCalendarPage';
import CustomerCalendarPage from './components/Calendar/CustomerCalendarPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import { Calendar, Users, LayoutDashboard, LogOut } from 'lucide-react';

// Navigation Bar Component
function NavigationBar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isCoach = user?.role === 'coach';
  
  const isActive = (path) => location.pathname === path;

  return (
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
              onClick={() => navigate(isCoach ? '/coach/dashboard' : '/customer/dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive(isCoach ? '/coach/dashboard' : '/customer/dashboard')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <button
              onClick={() => navigate(isCoach ? '/coach/calendar' : '/customer/calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive(isCoach ? '/coach/calendar' : '/customer/calendar')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="hidden sm:inline">Calendar</span>
            </button>

            {isCoach && (
              <button
                onClick={() => navigate('/coach/customers')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive('/coach/customers')
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
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Protected Route Component
function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'coach' ? '/coach/dashboard' : '/customer/dashboard'} replace />;
  }
  
  return children;
}

// Main App Content with Routes
function AppContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (page) => {
    const isCoach = user?.role === 'coach';
    const rolePrefix = isCoach ? '/coach' : '/customer';
    
    if (page === 'dashboard') {
      navigate(`${rolePrefix}/dashboard`);
    } else if (page === 'calendar') {
      navigate(`${rolePrefix}/calendar`);
    } else if (page === 'customers' && isCoach) {
      navigate('/coach/customers');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={user ? <Navigate to={user.role === 'coach' ? '/coach/dashboard' : '/customer/dashboard'} replace /> : <AuthForm />} />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />

        {/* Coach Routes */}
        <Route
          path="/coach/dashboard"
          element={
            <ProtectedRoute allowedRole="coach">
              <NavigationBar user={user} onLogout={handleLogout} />
              <CoachDashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/calendar"
          element={
            <ProtectedRoute allowedRole="coach">
              <NavigationBar user={user} onLogout={handleLogout} />
              <CoachCalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/customers"
          element={
            <ProtectedRoute allowedRole="coach">
              <NavigationBar user={user} onLogout={handleLogout} />
              <CoachDashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Customer Routes */}
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRole="customer">
              <NavigationBar user={user} onLogout={handleLogout} />
              <CustomerDashboard userProfile={user} onNavigate={handleNavigate} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/calendar"
          element={
            <ProtectedRoute allowedRole="customer">
              <NavigationBar user={user} onLogout={handleLogout} />
              <CustomerCalendarPage userProfile={user} />
            </ProtectedRoute>
          }
        />

        {/* Default Routes */}
        <Route path="/" element={user ? <Navigate to={user.role === 'coach' ? '/coach/dashboard' : '/customer/dashboard'} replace /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

