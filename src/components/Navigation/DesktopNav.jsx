import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Palette, ChevronDown, Package } from 'lucide-react';
import { authAPI } from '../../services/api.jsx';

const DesktopNav = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUser();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('coachsync_token');
      navigate('/login');
    }
  };

  return (
    <div className="desktop-nav-menu" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="desktop-nav-trigger"
      >
        <div className="desktop-nav-avatar">
          {user?.first_name?.[0]}{user?.last_name?.[0]}
        </div>
        <div className="desktop-nav-user-info">
          <span className="desktop-nav-name">
            {user?.first_name} {user?.last_name}
          </span>
          <span className="desktop-nav-role">Coach</span>
        </div>
        <ChevronDown size={18} className={`desktop-nav-chevron ${showDropdown ? 'rotated' : ''}`} />
      </button>

      {showDropdown && (
        <div className="desktop-nav-dropdown">
          <button
            onClick={() => {
              navigate('/coach/profile');
              setShowDropdown(false);
            }}
            className="desktop-nav-dropdown-item"
          >
            <User size={18} />
            <span>Profile</span>
          </button>
          
          <button
            onClick={() => {
              navigate('/coach/settings');
              setShowDropdown(false);
            }}
            className="desktop-nav-dropdown-item"
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          
          <button
            onClick={() => {
              navigate('/coach/branding');
              setShowDropdown(false);
            }}
            className="desktop-nav-dropdown-item"
          >
            <Palette size={18} />
            <span>Branding</span>
          </button>
          
          <button
            onClick={() => {
              navigate('/coach/packages');
              setShowDropdown(false);
            }}
            className="desktop-nav-dropdown-item"
          >
            <Package size={18} />
            <span>Packages</span>
          </button>
          
          <div className="desktop-nav-dropdown-divider"></div>
          
          <button
            onClick={handleLogout}
            className="desktop-nav-dropdown-item desktop-nav-dropdown-item-danger"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DesktopNav;
