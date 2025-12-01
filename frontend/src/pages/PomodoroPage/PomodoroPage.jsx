import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./PomodoroPage.css";

const PomodoroPage = () => {
  const { fetchWithAuth, API_URL } = useAuth();

  // Timer settings
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState("work"); // 'work', 'break', 'longBreak'
  const [sessionsSinceBreak, setSessionsSinceBreak] = useState(0);

  // Stats
  const [totalPoints, setTotalPoints] = useState(0);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState(null);

  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // Load points on mount
  useEffect(() => {
    loadUserPoints();
  }, []);

  // Timer countdown logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleSessionComplete();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, timeLeft]);

  const loadUserPoints = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/points`);
      if (response.ok) {
        const data = await response.json();
        setTotalPoints(data.points);
      }
    } catch (error) {
      console.error("Failed to load points:", error);
    }
  };

  const handleSessionComplete = async () => {
    setIsActive(false);
    playSound();

    const currentSessionType = sessionType;
    const duration = getCurrentDuration();

    // Save completed session to backend (only for work sessions)
    if (currentSessionType === "work") {
      try {
        const response = await fetchWithAuth(
          `${API_URL}/api/pomodoro/complete`,
          {
            method: "POST",
            body: JSON.stringify({
              duration_minutes: duration,
              session_type: currentSessionType,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();

          setSessionsSinceBreak((prev) => prev + 1);

          showNotification(
            `Work session complete! +${Math.floor(data.points_earned)} points`,
            "success"
          );

          // Update points
          setTotalPoints(data.total_points);

          // Auto-switch to break
          if (sessionsSinceBreak >= 3) {
            // 4th session complete
            switchToLongBreak();
          } else {
            switchToBreak();
          }
        }
      } catch (error) {
        console.error("Failed to save session:", error);
        showNotification("Failed to save session", "error");
      }
    } else {
      // Break completed
      showNotification("Break complete! Ready for another session?", "info");
      switchToWork();
    }
  };

  const getCurrentDuration = () => {
    switch (sessionType) {
      case "work":
        return workDuration;
      case "break":
        return breakDuration;
      case "longBreak":
        return longBreakDuration;
      default:
        return workDuration;
    }
  };

  const startTimer = () => {
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(getCurrentDuration() * 60);
  };

  const switchToWork = () => {
    setSessionType("work");
    setTimeLeft(workDuration * 60);
    setIsActive(false);
  };

  const switchToBreak = () => {
    setSessionType("break");
    setTimeLeft(breakDuration * 60);
    setIsActive(false);
  };

  const switchToLongBreak = () => {
    setSessionType("longBreak");
    setTimeLeft(longBreakDuration * 60);
    setSessionsSinceBreak(0);
    setIsActive(false);
  };

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .catch((err) => console.log("Audio play failed:", err));
    }
  };

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getProgress = () => {
    const total = getCurrentDuration() * 60;
    return ((total - timeLeft) / total) * 100;
  };

  const applySettings = () => {
    setTimeLeft(getCurrentDuration() * 60);
    setShowSettings(false);
    resetTimer();
  };

  return (
    <div className="pomodoro-page">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="pomodoro-container">
        {/* Header with stats */}
        <div className="pomodoro-header">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="points-value">{Math.floor(totalPoints)}🦴</div>
              <div className="stat-label">Total Pom Treats</div>
            </div>
          </div>
        </div>

        {/* Main timer */}
        <div className="timer-section">
          <div className="session-type-selector">
            <button
              className={`type-btn ${sessionType === "work" ? "active" : ""}`}
              onClick={switchToWork}
              disabled={isActive}
            >
              Work
            </button>
            <button
              className={`type-btn ${sessionType === "break" ? "active" : ""}`}
              onClick={switchToBreak}
              disabled={isActive}
            >
              Short Break
            </button>
            <button
              className={`type-btn ${
                sessionType === "longBreak" ? "active" : ""
              }`}
              onClick={switchToLongBreak}
              disabled={isActive}
            >
              Long Break
            </button>
          </div>

          <div className={`timer-display ${sessionType}`}>
            <svg className="progress-ring" width="300" height="300">
              <circle className="progress-ring-bg" cx="150" cy="150" r="130" />
              <circle
                className="progress-ring-progress"
                cx="150"
                cy="150"
                r="130"
                strokeDasharray={`${2 * Math.PI * 130}`}
                strokeDashoffset={`${
                  2 * Math.PI * 130 * (1 - getProgress() / 100)
                }`}
              />
            </svg>
            <div className="timer-text">
              <div className="time">{formatTime(timeLeft)}</div>
              <div className="session-label">
                {sessionType === "work"
                  ? "Focus Time"
                  : sessionType === "break"
                  ? "Short Break"
                  : "Long Break"}
              </div>
            </div>
          </div>

          <div className="timer-controls">
            {!isActive ? (
              <button className="control-btn start-btn" onClick={startTimer}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start
              </button>
            ) : (
              <button className="control-btn pause-btn" onClick={pauseTimer}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Pause
              </button>
            )}
            <button className="control-btn reset-btn" onClick={resetTimer}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
              Reset
            </button>
            <button
              className="control-btn settings-btn"
              onClick={() => setShowSettings(!showSettings)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
              Settings
            </button>
          </div>

          {/* Session counter */}
          <div className="session-counter">
            <div className="counter-dots">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`dot ${i < sessionsSinceBreak ? "completed" : ""}`}
                />
              ))}
            </div>
            <div className="counter-text">
              {sessionsSinceBreak}/4 sessions until long break
            </div>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="settings-panel">
            <h3>Timer Settings</h3>
            <div className="settings-form">
              <div className="setting-item">
                <label>Work Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(Number(e.target.value))}
                />
              </div>
              <div className="setting-item">
                <label>Short Break (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(Number(e.target.value))}
                />
              </div>
              <div className="setting-item">
                <label>Long Break (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={longBreakDuration}
                  onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                />
              </div>
              <button className="apply-btn" onClick={applySettings}>
                Apply Settings
              </button>
            </div>
          </div>
        )}

        {/* Info section */}
        <div className="info-section">
          <h3>How it works</h3>
          <ul>
            <li>Complete a 25-minute work session to earn 2 points</li>
            <li>Take a 5-minute break after each work session</li>
            <li>After 4 work sessions, take a longer 15-minute break</li>
            <li>Use your points to roll for characters in the gacha!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PomodoroPage;
