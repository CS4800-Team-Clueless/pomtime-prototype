import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./PointsCounter.css";

export default function PointsCounter() {
  const { fetchWithAuth, API_URL } = useAuth();
  const [dailyPoints, setDailyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeUntilReset, setTimeUntilReset] = useState("");
  const DAILY_LIMIT = 50;

  useEffect(() => {
    fetchDailyPoints();

    // Poll for updates every 3 seconds to catch points earned from other tabs/sessions
    const interval = setInterval(fetchDailyPoints, 3000);

    // Update countdown every second
    const countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial call

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, []);

  const fetchDailyPoints = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/user/daily-points`);
      const data = await response.json();

      if (data.daily_points !== undefined) {
        setDailyPoints(data.daily_points);
      }
    } catch (error) {
      console.error("Error fetching daily points:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCountdown = () => {
    // Calculate time until midnight PST (UTC-8)
    const now = new Date();
    const pstOffset = -8 * 60; // PST is UTC-8
    const localOffset = now.getTimezoneOffset();
    const pstTime = new Date(now.getTime() + (localOffset + pstOffset) * 60000);

    // Get midnight PST
    const midnight = new Date(pstTime);
    midnight.setHours(24, 0, 0, 0);

    // Calculate difference
    const diff = midnight - pstTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
  };

  // Calculate percentage for progress bar
  const percentage = Math.min((dailyPoints / DAILY_LIMIT) * 100, 100);


  if (loading) {
    return (
      <div className="points-counter">
        <div className="points-counter-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="points-counter">
      <div className="points-counter-header">
        <span className="points-counter-icon"></span>
        <div className="points-counter-text">
          <div className="points-counter-label">Daily Pom Treats</div>
          <div className="points-counter-value">
            <span className="points-current">{dailyPoints}</span>
            <span className="points-separator">/</span>
            <span className="points-max">{DAILY_LIMIT}</span>
          </div>
        </div>
      </div>

      <div className="points-progress-bar">
        <div
          className="points-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="points-status">Daily reset at 12:00 AM PST</div>
    </div>
  );
}