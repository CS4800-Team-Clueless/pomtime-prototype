import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./DailyCheckIn.css";

import dailyGiftIcon from "../../assets/icons/Daily_Gift_Icon.png";
import claimSound from '../../assets/sound_effects/treat_bark.wav'

export default function DailyCheckIn() {
  const { fetchWithAuth, API_URL } = useAuth();
  const [checkInData, setCheckInData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const claimSoundRef = useRef(null);
  useEffect(() => {
    claimSoundRef.current = new Audio(claimSound);
  }, []);

  useEffect(() => {
    fetchCheckInStatus();
  }, []);

  const fetchCheckInStatus = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/checkin`);
      const data = await response.json();
      setCheckInData(data);
    } catch (error) {
      console.error("Error fetching check-in status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (checkInData?.can_check_in === false) return;

    setChecking(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/api/checkin`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {

        if(claimSoundRef.current){
          claimSoundRef.current.currentTime = 0;
          claimSoundRef.current.play();
        }

        setCheckInData({
          can_check_in: false,
          already_checked_in: true,
          points_earned: data.points_earned,
          total_points: data.total_points,
        });
      }
    } catch (error) {
      console.error("Error checking in:", error);
      alert("Failed to check in. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="daily-checkin loading">
        <div className="checkin-spinner"></div>
      </div>
    );
  }

  return (
    <div className="daily-checkin">
      {checkInData?.can_check_in ? (
        <button
          className="checkin-button available"
          onClick={handleCheckIn}
          disabled={checking}
        >
          {checking ? (
            <>
              <span className="checkin-spinner small"></span>
              Checking in...
            </>
          ) : (
            <>
              <div className="checkin-icon">
                <img src={dailyGiftIcon} alt="Daily Gift" />
              </div>
              Daily Gift (<span className="points-value">+5🦴</span>)
            </>
          )}
        </button>
      ) : (
        <div className="checkin-completed">
          <div className="checkin-icon">
            <img src={dailyGiftIcon} alt="Daily Gift" />
          </div>
          <div className="checkin-text">
            <div className="checkin-status">Daily Gift Claimed!</div>
            <div className="checkin-reset-info">
              Resets at 12:00 AM PST
            </div>
          </div>
        </div>
      )}
    </div>
  );
}