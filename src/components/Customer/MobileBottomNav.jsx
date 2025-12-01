import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Dumbbell, BarChart3, History, User } from 'lucide-react';

function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/customer/dashboard',
      activeColor: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'workout',
      label: 'Workout',
      icon: Dumbbell,
      path: '/customer/start-workout',
      activeColor: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: BarChart3,
      path: '/customer/progress',
      activeColor: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      path: '/customer/workout-history',
      activeColor: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/customer/profile',
      activeColor: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20 md:h-0"></div>

      {/* Bottom Navigation - Visible on all devices */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                  active ? 'transform scale-110' : ''
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    active ? `${item.bgColor}` : 'bg-transparent'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 transition-colors duration-200 ${
                      active ? item.activeColor : 'text-gray-400'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs mt-1 font-medium transition-colors duration-200 ${
                    active ? item.activeColor : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default MobileBottomNav;
