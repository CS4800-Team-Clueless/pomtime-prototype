import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./PointsCounter.css";

export default function PointsCounter() {
  const { fetchWithAuth, API_URL } = useAuth();
  const [dailyPoints, setDailyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const DAILY_LIMIT = 50;

  useEffect(() => {
    fetchDailyPoints();

    // Poll for updates every 30 seconds to catch points earned from other tabs/sessions
    const interval = setInterval(fetchDailyPoints, 30000);

    return () => clearInterval(interval);
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

  // Calculate percentage for progress bar
  const percentage = Math.min((dailyPoints / DAILY_LIMIT) * 100, 100);

  // Determine status message
  const getStatusMessage = () => {
    if (dailyPoints >= DAILY_LIMIT) {
      return "Daily limit reached!";
    } else if (dailyPoints >= DAILY_LIMIT * 0.75) {
      return "Almost there!";
    } else if (dailyPoints > 0) {
      return "Keep going!";
    }
    return "Start earning today!";
  };

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

      <div className="points-status">{getStatusMessage()}</div>
    </div>
  );
}