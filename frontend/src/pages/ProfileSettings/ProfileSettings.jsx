import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './ProfileSettings.css';

export default function ProfileSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="profile-settings">
      <div className="profile-settings__container">
        <button onClick={handleBack} className="profile-settings__back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <h1 className="profile-settings__title">Profile Settings</h1>

        <div className="profile-settings__card">
          <div className="profile-settings__section">
            <h2 className="profile-settings__section-title">Profile Information</h2>

            <div className="profile-settings__avatar-section">
              <img
                src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email)}&size=128&background=6366f1&color=fff`}
                alt={user?.name}
                className="profile-settings__avatar"
              />
              <div>
                <h3 className="profile-settings__name">{user?.name || 'User'}</h3>
                <p className="profile-settings__email">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="profile-settings__divider"></div>

          <div className="profile-settings__section">
            <h2 className="profile-settings__section-title">Account Details</h2>

            <div className="profile-settings__field">
              <label className="profile-settings__label">Name</label>
              <input
                type="text"
                value={user?.name || ''}
                className="profile-settings__input"
                disabled
              />
            </div>

            <div className="profile-settings__field">
              <label className="profile-settings__label">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                className="profile-settings__input"
                disabled
              />
            </div>

            <p className="profile-settings__note">
              Profile information is managed through your Google account.
            </p>
          </div>

          <div className="profile-settings__divider"></div>

          <div className="profile-settings__section">
            <h2 className="profile-settings__section-title">Preferences</h2>
            <p className="profile-settings__coming-soon">
              Additional settings coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}