import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './DailyCheckIn.css';

export default function DailyCheckIn() {
    const { fetchWithAuth, API_URL } = useAuth();
    const [checkInData, setCheckInData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        fetchCheckInStatus();
    }, []);

    const fetchCheckInStatus = async () => {
        try {
            const response = await fetchWithAuth(`${API_URL}/api/checkin/status`);
            const data = await response.json();
            setCheckInData(data);
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
                    total_points: data.total_points
                });
            }
        } catch (error) {
            console.error('Error checking in:', error);
            alert('Failed to check in. Please try again.');
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
                    </div>
                </div>
            )}
        </div>
    );
}