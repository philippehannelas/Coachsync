import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthForm from './components/AuthForm';
import CoachDashboard from './components/Dashboard/CoachDashboard';
import CustomerDashboard from './components/Dashboard/CustomerDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard'; // NEW: Admin Dashboard Component
import CoachCalendarPage from './components/Calendar/CoachCalendarPage';
import CustomerCalendarPage from './components/Calendar/CustomerCalendarPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import TrainingPlansPage from './components/TrainingPlans/TrainingPlansPage';
import CustomerTrainingPlans from './components/TrainingPlans/CustomerTrainingPlans';

// NEW IMPORTS - Customer Portal Pages
import StartWorkoutPage from './components/Customer/StartWorkoutPage';
import WorkoutViewerPage from './components/Customer/WorkoutViewerPage';
import ProgressDashboardPage from './components/Customer/ProgressDashboardPage';
import WorkoutHistoryPage from './components/Customer/WorkoutHistoryPage';
import CustomerProfilePage from './components/Customer/CustomerProfilePage';

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
    } else if (page === 'training-plans') {
      navigate('/coach/training-plans');
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
    } else if (page === 'training-plans') {
      navigate('/customer/training-plans');
    } else if (page === 'start-workout') {  // NEW
      navigate('/customer/start-workout');
    } else if (page === 'progress') {  // NEW
      navigate('/customer/progress');
    } else if (page === 'workout-history') {  // NEW
      navigate('/customer/workout-history');
    } else if (page === 'profile') {  // NEW
      navigate('/customer/profile');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return <CustomerDashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />;
}

// Protected Route Component
function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    // Handle redirection based on the actual role
    if (user.role === 'coach') return <Navigate to="/coach/dashboard" replace />;
    if (user.role === 'customer') return <Navigate to="/customer/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />; // Fallback
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
            <Navigate to={
              user.role === 'coach' ? '/coach/dashboard' : 
              user.role === 'customer' ? '/customer/dashboard' :
              user.role === 'admin' ? '/admin/dashboard' :
              '/login'
            } replace /> 
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
      <Route
        path="/coach/training-plans"
        element={
          <ProtectedRoute allowedRole="coach">
            <TrainingPlansPage userProfile={user} />
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
      <Route
        path="/customer/training-plans"
        element={
          <ProtectedRoute allowedRole="customer">
            <CustomerTrainingPlans userProfile={user} />
          </ProtectedRoute>
        }
      />

      {/* NEW CUSTOMER ROUTES - Mobile-Optimized Workout Features */}
      <Route
        path="/customer/start-workout"
        element={
          <ProtectedRoute allowedRole="customer">
            <StartWorkoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/workout/:planId/:dayNumber"
        element={
          <ProtectedRoute allowedRole="customer">
            <WorkoutViewerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/progress"
        element={
          <ProtectedRoute allowedRole="customer">
            <ProgressDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/workout-history"
        element={
          <ProtectedRoute allowedRole="customer">
            <WorkoutHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/profile"
        element={
          <ProtectedRoute allowedRole="customer">
            <CustomerProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Default Routes */}
      <Route 
        path="/" 
        element={
          user ? 
            <Navigate to={
              user.role === 'coach' ? '/coach/dashboard' : 
              user.role === 'customer' ? '/customer/dashboard' :
              user.role === 'admin' ? '/admin/dashboard' :
              '/login'
            } replace /> 
            : <Navigate to="/login" replace />
        } 
      />
      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
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

