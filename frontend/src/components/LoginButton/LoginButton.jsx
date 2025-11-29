import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Get from environment variable or use placeholder
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, API_URL } = useAuth();

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google && GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: 280
          }
        );
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleCredentialResponse = async (response) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await result.json();

      if (result.ok && data.success) {
        login(data.user, data.token);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div style={{ color: 'red', padding: '20px' }}>
        <p>⚠️ Google Client ID not configured</p>
        <p style={{ fontSize: '14px' }}>
          Please add VITE_GOOGLE_CLIENT_ID to your .env file
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '15px'
    }}>
      <div id="googleSignInButton"></div>
      {isLoading && (
        <p style={{ color: '#666', fontSize: '14px' }}>
          Signing you in...
        </p>
      )}
      {error && (
        <p style={{ color: 'red', fontSize: '14px' }}>
          Error: {error}
        </p>
      )}
    </div>
  );
}