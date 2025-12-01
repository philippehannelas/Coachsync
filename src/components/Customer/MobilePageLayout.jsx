import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import MobileBottomNav from './MobileBottomNav';
import AthleteHubLogo from '../AthleteHubLogo';

function MobilePageLayout({ 
  children, 
  title, 
  showBack = false, 
  backPath = '/customer/dashboard',
  showBottomNav = true,
  headerRight = null 
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center gap-3">
              {showBack ? (
                <button
                  onClick={() => navigate(backPath)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
              ) : (
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                  <AthleteHubLogo className="h-6 w-auto" color="white" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900">{title}</h1>
              </div>
            </div>

            {/* Right side */}
            <div>
              {headerRight || (
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
                  aria-label="Logout"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}

export default MobilePageLayout;
