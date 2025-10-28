import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthForm from './components/AuthForm';
import CoachDashboard from './components/Dashboard/CoachDashboard';
import CustomerDashboard from './components/Dashboard/CustomerDashboard';
import CoachCalendarPage from './components/Calendar/CoachCalendarPage';
import CustomerCalendarPage from './components/Calendar/CustomerCalendarPage';
import AcceptInvitePage from './pages/AcceptInvitePage';

// Wrapper component for CoachDashboard with navigation
function CoachDashboardWrapper() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (page) => {
    if (page === 'calendar') {
      navigate('/coach/calendar');
    } else if (page === 'dashboard') {
      navigate('/coach/dashboard');
    } else if (page === 'customers') {
      navigate('/coach/customers');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return <CoachDashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />;
}

// Wrapper component for CustomerDashboard with navigation
function CustomerDashboardWrapper() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (page) => {
    if (page === 'calendar') {
      navigate('/customer/calendar');
    } else if (page === 'dashboard') {
      navigate('/customer/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return <CustomerDashboard userProfile={user} onNavigate={handleNavigate} onLogout={handleLogout} />;
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
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          user ? 
            <Navigate to={user.role === 'coach' ? '/coach/dashboard' : '/customer/dashboard'} replace /> 
            : <AuthForm />
        } 
      />
      <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />

      {/* Coach Routes */}
      <Route
        path="/coach/dashboard"
        element={
          <ProtectedRoute allowedRole="coach">
            <CoachDashboardWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coach/calendar"
        element={
          <ProtectedRoute allowedRole="coach">
            <CoachCalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coach/customers"
        element={
          <ProtectedRoute allowedRole="coach">
            <CoachDashboardWrapper />
          </ProtectedRoute>
        }
      />

      {/* Customer Routes */}
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute allowedRole="customer">
            <CustomerDashboardWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/calendar"
        element={
          <ProtectedRoute allowedRole="customer">
            <CustomerCalendarPage userProfile={user} />
          </ProtectedRoute>
        }
      />

      {/* Default Routes */}
      <Route 
        path="/" 
        element={
          user ? 
            <Navigate to={user.role === 'coach' ? '/coach/dashboard' : '/customer/dashboard'} replace /> 
            : <Navigate to="/login" replace />
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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

