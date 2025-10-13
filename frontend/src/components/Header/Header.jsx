import { NavLink } from "react-router-dom";
import "./Header.css";

export default function Header() {
  return (
    <header className="pt-header">
      <div className="pt-header-inner">
        <NavLink to="/" className="pt-brand">
          PomTime
        </NavLink>
        <nav className="pt-nav">
          <NavLink to="/calendar" className="pt-link">
            Calendar
          </NavLink>
          <NavLink to="/gacha" className="pt-link">
            Gacha
          </NavLink>
          <NavLink to="/timer" className="pt-link">
            Timer
          </NavLink>
          <NavLink to="/profile" className="pt-link">
            Profile
          </NavLink>
          <NavLink to="/settings" className="pt-link">
            Settings
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
