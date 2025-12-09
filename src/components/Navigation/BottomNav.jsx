import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, FileText, Calendar, MoreHorizontal, Settings, LogOut, Palette, User } from 'lucide-react';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const navItems = [
    { path: '/coach/dashboard', icon: Home, label: 'Home' },
    { path: '/coach/customers', icon: Users, label: 'Clients' },
    { path: '/coach/training-plans', icon: FileText, label: 'Plans' },
    { path: '/coach/calendar', icon: Calendar, label: 'Calendar' },
    { action: 'more', icon: MoreHorizontal, label: 'More' },
  ];

  const handleNavClick = (item) => {
    // Handle More menu
    if (item.action === 'more') {
      setShowMoreMenu(!showMoreMenu);
      return;
    }

    // Navigate to path
    if (item.path) {
      navigate(item.path);
    }

    // Scroll to section if specified
    if (item.scrollTo) {
      setTimeout(() => {
        // Try to find the section by ID or class
        let element = document.getElementById(item.scrollTo);
        
        // If not found by ID, try to find customer list section
        if (!element && item.scrollTo === 'customer-section') {
          // Look for the customer list heading or container
          const headings = document.querySelectorAll('h2, h3');
          for (const heading of headings) {
            if (heading.textContent.includes('Customer') || heading.textContent.includes('Client')) {
              element = heading.parentElement;
              break;
            }
          }
        }
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
    }
  };

  const isActive = (item) => {
    if (item.section) {
      return location.pathname === item.path;
    }
    return location.pathname === item.path;
  };

  return (
    <>
      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div 
          className="mobile-more-menu-overlay"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className="mobile-more-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-more-menu-header">
              <h3>More Options</h3>
              <button onClick={() => setShowMoreMenu(false)}>✕</button>
            </div>
            <div className="mobile-more-menu-items">
              <button 
                className="mobile-more-menu-item"
                onClick={() => {
                  navigate('/coach/branding');
                  setShowMoreMenu(false);
                }}
              >
                <Palette size={20} />
                <span>Branding</span>
              </button>
              <button 
                className="mobile-more-menu-item"
                onClick={() => {
                  navigate('/coach/profile');
                  setShowMoreMenu(false);
                }}
              >
                <User size={20} />
                <span>Profile</span>
              </button>
              <button 
                className="mobile-more-menu-item"
                onClick={() => {
                  navigate('/coach/settings');
                  setShowMoreMenu(false);
                }}
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
              <button 
                className="mobile-more-menu-item mobile-more-menu-item-danger"
                onClick={() => {
                  if (window.confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('coachsync_token');
                    navigate('/login');
                  }
                  setShowMoreMenu(false);
                }}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav bottom-nav-dark">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = item.path ? isActive(item) : showMoreMenu;
          
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
    </>
  );
};

export default BottomNav;
