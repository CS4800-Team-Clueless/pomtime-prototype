import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './DailyCheckIn.css';

export default function DailyCheckIn() {
    const { fetchWithAuth, API_URL } = useAuth();
    const [checkInData, setCheckInData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(null);

    useEffect(() => {
        fetchCheckInStatus();
    }, []);

    // Update countdown timer every second
    useEffect(() => {
        if (!checkInData?.can_check_in && checkInData?.hours_remaining > 0) {
            const interval = setInterval(() => {
                fetchCheckInStatus();
            }, 60000); // Refresh every minute

            // Update display every second
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev && prev > 0) {
                        return prev - 1;
                    }
                    return 0;
                });
            }, 1000);

            return () => {
                clearInterval(interval);
                clearInterval(timer);
            };
        }
    }, [checkInData]);

    const fetchCheckInStatus = async () => {
        try {
            const response = await fetchWithAuth(`${API_URL}/api/checkin/status`);
            const data = await response.json();
            setCheckInData(data);

            // Set initial time remaining in seconds
            if (data.hours_remaining) {
                setTimeRemaining(Math.floor(data.hours_remaining * 3600));
            }
        } catch (error) {
            console.error('Error fetching check-in status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (checkInData?.can_check_in === false) return;

        setChecking(true);
        try {
            const response = await fetchWithAuth(`${API_URL}/api/checkin`, {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                setCheckInData({
                    can_check_in: false,
                    already_checked_in: true,
                    points_earned: data.points_earned,
                    total_points: data.total_points,
                    hours_remaining: 24
                });
                setTimeRemaining(24 * 3600); // 24 hours in seconds
            }
        } catch (error) {
            console.error('Error checking in:', error);
            alert('Failed to check in. Please try again.');
        } finally {
            setChecking(false);
        }
    };

    const formatTimeRemaining = (seconds) => {
        if (!seconds || seconds <= 0) return 'Available now!';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
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
                            <span className="checkin-icon">🎁</span>
                            Daily Gift (<span className="points-value">+5🦴</span>)
                        </>
                    )}
                </button>
            ) : (
                <div className="checkin-completed">
                    <span className="checkin-icon">🐶</span>
                    <div className="checkin-text">
                        <div className="checkin-status">Daily Gift Claimed!</div>
                        {timeRemaining > 0 && (
                            <div className="checkin-timer">
                                Next gift in: <strong>{formatTimeRemaining(timeRemaining)}</strong>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}