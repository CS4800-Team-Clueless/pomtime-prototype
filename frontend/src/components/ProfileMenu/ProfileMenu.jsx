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

  const handleThemeSettings = () => {
    navigate('/settings');
    setIsOpen(false);
  }

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
              <i className="bi bi-gear profile-menu__icon"></i>
              <span>Profile Settings</span>
            </button>

            <div className="profile-menu__divider"></div>

            <button
              onClick={handleThemeSettings}
              className="profile-menu__item"
            >
              <i className="bi bi-palette profile-menu__icon"></i>
              <span>Themes</span>
            </button>

            <div className="profile-menu__divider"></div>

            <button
              onClick={handleSignOut}
              className="profile-menu__item profile-menu__item--danger"
            >
              <i className="bi bi-box-arrow-right profile-menu__icon"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}