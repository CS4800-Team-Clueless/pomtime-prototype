import { NavLink } from "react-router-dom";
import ProfileMenu from "../ProfileMenu/ProfileMenu";
import "./Header.css";
import pomLogo from "../../assets/icons/PomIcon.png";

export default function Header() {
  return (
    <header className="pt-header">
      <div className="pt-header-inner">
        <NavLink to="/" className="pt-brand">
          <img src={pomLogo} alt="PomTime Logo" className="pt-logo" />
          <span className="pt-logo-text">PomTime!</span>
        </NavLink>
        <nav className="pt-nav">
          <NavLink to="/calendar" className="pt-link">
            Calendar
          </NavLink>
          <NavLink to="/pomodoro" className="pt-link">
            Timer
          </NavLink>
          <NavLink to="/gacha" className="pt-link">
            Gacha
          </NavLink>
          <NavLink to="/inventory" className="pt-link">
            Inventory
          </NavLink>
          <NavLink to="/leaderboard" className="pt-link">
            Leaderboard
          </NavLink>
        </nav>
        {/* Profile Menu in top right */}
        <div className="pt-profile-menu">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
