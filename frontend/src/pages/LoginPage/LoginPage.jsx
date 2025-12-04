import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LoginButton from '../../components/LoginButton/LoginButton';
import pomLogo from "../../assets/icons/PomIcon.png";
import friendsIcon from "../../assets/icons/Friends_Icon.png";
import tomatoIcon from "../../assets/icons/Tomato_Icon.png";
import celebrateIcon from "../../assets/icons/Celebration_Icon.png";
import homeScreen from "../../assets/screenshots/Home_Screen.png";
import homeScreen2 from "../../assets/screenshots/Home_Screen2.png";
import calenderScreen from "../../assets/screenshots/Calendar_Screen.png";
import gachaScreen from "../../assets/screenshots/Gacha_Screen.png";
import inventoryScreen from "../../assets/screenshots/Inventory_Screen.png";
import timerScreen from "../../assets/screenshots/Timer_Screen.png";
import leaderboardScreen from "../../assets/screenshots/Leaderboard_Screen.png";
import profileScreen from "../../assets/screenshots/Profile_Screen.png";
import './LoginPage.css';

export default function LoginPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Replace these with your actual screenshot URLs
  const screenshots = [
    homeScreen,
    homeScreen2,
    calenderScreen,
    gachaScreen,
    inventoryScreen,
    timerScreen,
    leaderboardScreen,
    profileScreen,
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % screenshots.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(timer);
  }, [screenshots.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % screenshots.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  return (
    <div className="landing-page">
      {/* Animated background elements */}
      <div className="bg-circle circle-1"></div>
      <div className="bg-circle circle-2"></div>
      <div className="bg-circle circle-3"></div>

      <div className="content-wrapper">
        {/* Hero Section */}
        <div className="hero-section">
          <img src={pomLogo} alt="PomTime Logo" className="pt-logo" />

          <h1 className="hero-title">
            Welcome to <span className="pomtime-logo">PomTime!</span>
          </h1>

          <p className="hero-subtitle">
            Motivate yourself to become more productive! Set goals and accomplish them on time. Complete tasks for a plethora of rewards!
          </p>

          <div className="login-section">
            <LoginButton />
            <p className="login-hint">Sign in with your Google account to get started!</p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          <div className="feature-card">
            <img src={celebrateIcon} alt="Celebration Icon" className="pt-logo" />
            <h3>Collect and Customize!</h3>
            <p>Collect a wide variety of Pomeranians and customize your profile!</p>
          </div>

          <div className="feature-card">
            <img src={friendsIcon} alt="Friends Icon" className="pt-logo" />
            <h3>Improve yourself!</h3>
            <p>Set goals and accomplish tasks to compete with friends!</p>
          </div>

          <div className="feature-card">
            <img src={tomatoIcon} alt="PomTime Logo" className="pt-logo" />
            <h3>The Pomodoro Technique!</h3>
            <p>Use the Pomodoro timer to stay focused on your tasks!</p>
          </div>
        </div>

        {/* Screenshot Slideshow */}
        <div className="slideshow-section">
          <h2 className="slideshow-title">See <span className="pomtime-logo">PomTime!</span> in Action:</h2>

          <div className="slideshow-container">
            <button className="slide-btn slide-btn-prev" onClick={prevSlide} aria-label="Previous slide">
              <ChevronLeft size={24} />
            </button>

            <div className="slideshow-inner">
              {screenshots.map((screenshot, index) => (
                <div
                  key={index}
                  className={`slide ${index === currentSlide ? 'active' : ''}`}
                >
                  <img
                    src={screenshot}
                    alt={`PomTime screenshot ${index + 1}`}
                    className="slide-image"
                  />
                </div>
              ))}
            </div>

            <button className="slide-btn slide-btn-next" onClick={nextSlide} aria-label="Next slide">
              <ChevronRight size={24} />
            </button>

            {/* Dots Navigation */}
            <div className="slide-dots">
              {screenshots.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}