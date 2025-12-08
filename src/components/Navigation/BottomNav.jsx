import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, FileText, Calendar, MoreHorizontal } from 'lucide-react';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/coach/dashboard', icon: Home, label: 'Home' },
    { path: '/coach/dashboard', icon: Users, label: 'Clients', section: 'customers' },
    { path: '/coach/training-plans', icon: FileText, label: 'Plans' },
    { path: '/coach/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/coach/settings', icon: MoreHorizontal, label: 'More' },
  ];

  const handleNavClick = (item) => {
    navigate(item.path);
    // If there's a specific section to scroll to, handle it
    if (item.section) {
      setTimeout(() => {
        const element = document.getElementById(item.section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const isActive = (item) => {
    if (item.section) {
      return location.pathname === item.path;
    }
    return location.pathname === item.path;
  };

  return (
    <nav className="bottom-nav">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const active = isActive(item);
        
        return (
          <button
            key={index}
            onClick={() => handleNavClick(item)}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            aria-label={item.label}
          >
            <Icon className="bottom-nav-icon" size={24} />
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
