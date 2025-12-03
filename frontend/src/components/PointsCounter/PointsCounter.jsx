import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./PointsCounter.css";

import pomTreatsIcon from "../../assets/icons/Pom_Treats_Icon.png";

export default function PointsCounter() {
  const { fetchWithAuth, API_URL } = useAuth();
  const [dailyPoints, setDailyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const DAILY_LIMIT = 50;

  useEffect(() => {
    fetchDailyPoints();

    // Poll for updates every 5 seconds for live updates
    const interval = setInterval(fetchDailyPoints, 5000);

    return () => {
      clearInterval(interval);
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
        <span className="points-counter-icon">
          <img src={pomTreatsIcon} alt="Pom Treats Icon" />
        </span>
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