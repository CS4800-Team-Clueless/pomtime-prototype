import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings, gradients } from '../../contexts/SettingsContext';
import './Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, uploadBackgroundImage, toggleDarkMode } = useSettings();
  const [selectedGradient, setSelectedGradient] = useState(settings.background_value);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleGradientSelect = async (gradientKey) => {
    setSelectedGradient(gradientKey);
    const success = await updateSettings({
      background_type: 'gradient',
      background_value: gradientKey
    });
    if (success) {
      // Success feedback
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    const success = await uploadBackgroundImage(file);
    setUploading(false);

    if (success) {
      setSelectedGradient('custom-image');
    } else {
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <button onClick={handleBack} className="settings-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <h1 className="settings-title">⚙️ Settings</h1>

        <div className="settings-card">
          {/* Dark Mode Section */}
          <div className="settings-section">
            <h2 className="settings-section-title">Appearance</h2>
            <div className="dark-mode-toggle">
              <div className="toggle-info">
                <h3 className="toggle-label">Dark Mode</h3>
                <p className="toggle-desc">Switch between light and dark themes</p>
              </div>
              <button
                className={`toggle-switch ${settings.dark_mode ? 'active' : ''}`}
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
              >
                <span className="toggle-slider"></span>
              </button>
            </div>
          </div>

          <div className="settings-divider"></div>

          <div className="settings-section">
            <h2 className="settings-section-title">Background Customization</h2>
            <p className="settings-section-desc">
              Choose a preset gradient or upload your own image
            </p>

            {/* Preset Gradients */}
            <div className="gradients-grid">
              {Object.entries(gradients).map(([key, style]) => (
                <button
                  key={key}
                  className={`gradient-option ${selectedGradient === key ? 'selected' : ''}`}
                  style={style}
                  onClick={() => handleGradientSelect(key)}
                >
                  {selectedGradient === key && (
                    <div className="gradient-checkmark">✓</div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Image Upload */}
            <div className="upload-section">
              <h3 className="upload-title">Custom Background Image</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <button
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload Image
                  </>
                )}
              </button>
              <p className="upload-hint">
                Supported formats: PNG, JPG, GIF, WEBP (Max 5MB)
              </p>

              {settings.background_type === 'image' && (
                <div className="current-image-preview">
                  <p className="preview-label">Current Background:</p>
                  <div
                    className="preview-thumbnail"
                    style={{
                      backgroundImage: `url(${settings.background_value})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="preview-overlay">Custom Image</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}