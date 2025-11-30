import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const { user, fetchWithAuth, API_URL } = useAuth();
  const [weekTasks, setWeekTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeekTasks();
  }, []);

  const fetchWeekTasks = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/tasks`);
      const data = await response.json();

      // Filter tasks for this week that aren't completed
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const thisWeekTasks = data.tasks
        .filter(task => {
          const taskDate = new Date(task.start);
          return taskDate >= weekStart && taskDate < weekEnd && !task.completed;
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .slice(0, 5); // Show up to 5 upcoming tasks

      setWeekTasks(thisWeekTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getFirstName = (fullName) => {
    if (!fullName) return 'there';
    return fullName.split(' ')[0];
  };

  return (
    <section className="home">
      {/* Original Hero Section with User Greeting */}
      <div className="home-hero">
        <h1>
          Welcome back, <span>{getFirstName(user?.name)}</span>!
        </h1>
        <p>
          Focus hard, rest smart. Track sessions, earn gacha rewards, and
          visualize your progress.
        </p>
        <div className="home-actions">
          <a href="/timer" className="btn-primary">
            Start Timer
          </a>
          <a href="/calendar" className="btn-primary">
            View Calendar
          </a>
        </div>
      </div>



      {/* NEW: Agenda Preview Section */}
      <div className="agenda-section">
        <div className="agenda-header">
          <h2 className="agenda-title">📅 Your Week Ahead</h2>
          <Link to="/calendar" className="view-all-link">
            View Full Calendar →
          </Link>
        </div>

        {loading ? (
          <div className="agenda-loading">Loading your tasks...</div>
        ) : weekTasks.length === 0 ? (
          <div className="empty-agenda">
            <div className="empty-icon">🎉</div>
            <h3>All clear!</h3>
            <p>You have no pending tasks this week. Great job staying on top of things!</p>
            <Link to="/calendar" className="add-task-btn">
              Add New Task
            </Link>
          </div>
        ) : (
          <div className="task-list">
            {weekTasks.map(task => (
              <div key={task._id} className="task-card">
                <div className="task-info">
                  <h3 className="task-title">{task.title}</h3>
                  <p className="task-time">{formatDateTime(task.start)}</p>
                </div>
                <div className="task-meta">
                  <span className="task-points">🐶 {task.points} Pom Prisms</span>
                  {task.recurring && (
                    <span className="task-recurring">🔄 Daily</span>
                  )}
                </div>
              </div>
            ))}
            {weekTasks.length >= 5 && (
              <Link to="/calendar" className="view-more-link">
                View all tasks →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* NEW: Quick Stats */}
      <div className="quick-stats">
        <div className="stat-box">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{weekTasks.length}</div>
            <div className="stat-label">Tasks This Week</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-number">
              {weekTasks.reduce((sum, task) => sum + (task.points || 0), 0)}
            </div>
            <div className="stat-label">Potential Points</div>
          </div>
        </div>
      </div>
    </section>
  );
}