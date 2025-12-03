import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './DailyCheckIn.css';

export default function DailyCheckIn() {
    const { fetchWithAuth, API_URL } = useAuth();
    const [checkInData, setCheckInData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const nextCheckinTimeRef = useRef(null);

    useEffect(() => {
        fetchCheckInStatus();
    }, []);

    // Update countdown timer every second
    useEffect(() => {
        if (nextCheckinTimeRef.current) {
            const timer = setInterval(() => {
                const now = new Date();
                const diff = nextCheckinTimeRef.current - now;

                if (diff <= 0) {
                    setTimeRemaining(0);
                    // Refresh status when time runs out
                    fetchCheckInStatus();
                } else {
                    setTimeRemaining(Math.floor(diff / 1000));
                }
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [checkInData]);

    const fetchCheckInStatus = async () => {
        try {
            const response = await fetchWithAuth(`${API_URL}/api/checkin/status`);
            const data = await response.json();
            setCheckInData(data);

            // Store the absolute next check-in time
            if (data.next_checkin_time) {
                nextCheckinTimeRef.current = new Date(data.next_checkin_time);
                const now = new Date();
                const diff = nextCheckinTimeRef.current - now;
                setTimeRemaining(Math.floor(diff / 1000));
            } else {
                nextCheckinTimeRef.current = null;
                setTimeRemaining(null);
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
                // Use the next_checkin_time from server response
                const nextTime = data.next_checkin_time ? new Date(data.next_checkin_time) : new Date(Date.now() + 24 * 60 * 60 * 1000);
                nextCheckinTimeRef.current = nextTime;

                const now = new Date();
                const diff = nextTime - now;

                setCheckInData({
                    can_check_in: false,
                    already_checked_in: true,
                    points_earned: data.points_earned,
                    total_points: data.total_points,
                    next_checkin_time: nextTime.toISOString()
                });
                setTimeRemaining(Math.floor(diff / 1000));
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
                    <span className="checkin-icon">✨</span>
                    <div className="checkin-text">
                        <div className="checkin-status">Daily Gift Claimed!</div>
                        {timeRemaining !== null && timeRemaining > 0 && (
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