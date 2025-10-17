import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import BasePage from "./pages/BasePage";
import { Calendar } from "react-big-calendar";
import Gacha from "./pages/GachaPage/GachaPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<BasePage />}>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/gacha" element={<Gacha />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
