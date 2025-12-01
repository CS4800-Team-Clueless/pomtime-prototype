import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { fetchWithAuth, API_URL, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState({
    background_type: 'gradient',
    background_value: 'gradient-1',
    dark_mode: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Apply dark mode class to body
  useEffect(() => {
    if (settings.dark_mode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [settings.dark_mode]);

  const fetchSettings = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/settings`);
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    const newSettings = {
      ...settings,
      dark_mode: !settings.dark_mode
    };
    const success = await updateSettings(newSettings);
    if (!success) {
      // Revert on failure
      setSettings(settings);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/settings`, {
        method: 'PUT',
        body: JSON.stringify({ settings: newSettings })
      });
      const data = await response.json();
      setSettings(data.settings);
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  };

  const uploadBackgroundImage = async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_URL}/api/settings/background-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setSettings({
        background_type: 'image',
        background_value: data.image_url
      });
      return true;
    } catch (error) {
      console.error('Error uploading image:', error);
      return false;
    }
  };

  const getBackgroundStyle = () => {
    if (settings.background_type === 'gradient') {
      return gradients[settings.background_value] || gradients['gradient-1'];
    } else if (settings.background_type === 'image') {
      return {
        backgroundImage: `url(${settings.background_value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      };
    }
    return gradients['gradient-1'];
  };

  const value = {
    settings,
    loading,
    updateSettings,
    uploadBackgroundImage,
    getBackgroundStyle,
    toggleDarkMode
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Predefined gradients
export const gradients = {
  'gradient-1': {
    background: 'linear-gradient(135deg, #667eea 0%, #2d1b69 100%)',
    color: '#f9fafb'
  },
  'gradient-2': {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#f9fafb'
  },
  'gradient-3': {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#1f2937'
  },
  'gradient-4': {
    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    color: '#1f2937'
  },
  'gradient-5': {
    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: '#1f2937'
  },
  'gradient-6': {
    background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    color: '#f9fafb'
  },
  'gradient-7': {
    background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
    color: '#1f2937'
  },
  'gradient-8': {
    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    color: '#1f2937'
  },
  'gradient-9': {
    background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    color: '#1f2937'
  },
  'gradient-10': {
    background: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    color: '#1f2937'
  },
  'gradient-11': {
    background: 'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
    color: '#1f2937'
  },
  'gradient-12': {
    background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
    color: '#f9fafb'
  },
  'gradient-13': {
    background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
    color: '#f9fafb'
  },
  'gradient-14': {
    background: 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)',
    color: '#f9fafb'
  },
  'gradient-15': {
    background: 'linear-gradient(135deg, #4568dc 0%, #b06ab3 100%)',
    color: '#f9fafb'
  }
};