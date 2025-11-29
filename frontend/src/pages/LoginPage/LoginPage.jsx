import LoginButton from '../../components/LoginButton/LoginButton';
import './LoginPage.css';

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Welcome to PomTime</h1>
        <p>Please sign in with your Google account to continue</p>
        <LoginButton />
      </div>
    </div>
  );
}