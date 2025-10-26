import React from 'react';
import { useAuth } from './hooks/useAuth.jsx';
import AuthForm from './components/AuthForm.jsx';
import CoachDashboard from './components/Dashboard/CoachDashboard.jsx';
import CustomerDashboard from './components/Dashboard/CustomerDashboard.jsx';
import './App.css';

function App() {
  const { user, loading, logout, isCoach, isCustomer } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication form if not logged in
  if (!user) {
    return (
      <div className="App">
        <AuthForm />
      </div>
    );
  }

  // Show appropriate dashboard based on user role
  return (
    <div className="App">
      {isCoach && <CoachDashboard user={user} onLogout={logout} />}
      {isCustomer && <CustomerDashboard user={user} onLogout={logout} />}
      {!isCoach && !isCustomer && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-red-600 mb-4">Invalid user role</p>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

