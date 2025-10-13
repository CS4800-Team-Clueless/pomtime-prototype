import "./Home.css";

export default function Home() {
  return (
    <section className="home">
      <div className="home-hero">
        <h1>
          Welcome to <span>PomTime</span>
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

      <div className="home-cards">
        <div className="card">
          <h3>Quick Timer</h3>
          <p>25/5 Pomodoro preset, ready to go.</p>
        </div>
        <div className="card">
          <h3>Today’s Plan</h3>
          <p>Line up sessions with your day.</p>
        </div>
        <div className="card">
          <h3>Gacha Rewards</h3>
          <p>Streaks unlock spins and cosmetics.</p>
        </div>
        <div className="card">
          <h3>Progress</h3>
          <p>See trends and milestones at a glance.</p>
        </div>
      </div>
    </section>
  );
}
