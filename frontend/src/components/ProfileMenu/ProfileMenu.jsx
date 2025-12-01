import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './ProfileMenu.css';
import { useSettings } from "../../contexts/SettingsContext";

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const { getBackgroundStyle } = useSettings();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileSettings = () => {
    navigate('/profile-settings');
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="profile-menu" ref={menuRef}>
      {/* Profile Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="profile-menu__button"
        aria-label="Open profile menu"
      >
        <img
          src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&size=128&background=6366f1&color=fff`}
          alt={user.name}
          className="profile-menu__avatar"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="profile-menu__dropdown">
          {/* User Info Section */}
          <div className="profile-menu__header" style={getBackgroundStyle()}>
            <div className="profile-menu__user-info">
              <img
                src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&size=128&background=6366f1&color=fff`}
                alt={user.name}
                className="profile-menu__avatar-large"
              />
              <div className="profile-menu__user-details">
                <p className="profile-menu__name">{user.name || 'User'}</p>
                <p className="profile-menu__email">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="profile-menu__items">
            <button
              onClick={handleProfileSettings}
              className="profile-menu__item"
            >
              <svg className="profile-menu__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>Profile Settings</span>
            </button>

            <div className="profile-menu__divider"></div>

            <button
              onClick={handleSignOut}
              className="profile-menu__item profile-menu__item--danger"
            >
              <svg className="profile-menu__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}