import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import BasePage from "./pages/BasePage";
import Gacha from "./pages/GachaPage/GachaPage";
import CalendarPage from "./pages/Calendar/Calendar";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<BasePage />}>
          <Route path="/" element={<Home />} />
          <Route path="/gacha" element={<Gacha />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
