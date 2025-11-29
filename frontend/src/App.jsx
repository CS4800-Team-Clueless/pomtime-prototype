import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home/Home";
import BasePage from "./pages/BasePage";
import Gacha from "./pages/GachaPage/GachaPage";
import CalendarPage from "./pages/Calendar/Calendar";
import LoginPage from "./pages/LoginPage/LoginPage";
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
        <Route path="/" element={<Home />} />
        <Route path="/gacha" element={<Gacha />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;