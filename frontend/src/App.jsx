import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { pageview } from "./analytics";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import Home from "./pages/Home/Home";
import BasePage from "./pages/BasePage";
import Gacha from "./pages/GachaPage/GachaPage";
import CalendarPage from "./pages/Calendar/Calendar";
import LoginPage from "./pages/LoginPage/LoginPage";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import ProfileSettings from "./pages/ProfileSettings/ProfileSettings";
import Inventory from "./pages/InventoryPage/InventoryPage";
import PomodoroPage from "./pages/PomodoroPage/PomodoroPage";
import Settings from "./pages/Settings/Settings";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <BasePage />
        </ProtectedRoute>
      }>
        <Route index element={<Home />} />
        <Route path="gacha" element={<Gacha />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="pomodoro" element={<PomodoroPage />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile-settings" element={<ProfileSettings />} />
        <Route path="leaderboard" element={<Leaderboard />} />
      </Route>
    </Routes>
  );
}

function App() {const location = useLocation(); // <-- ADD THIS
  useEffect(() => {
    // Fire GA pageview on every route change
    pageview(location.pathname + location.search);
  }, [location]);

  return (
    <AuthProvider>
      <SettingsProvider>
        <AppRoutes />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;