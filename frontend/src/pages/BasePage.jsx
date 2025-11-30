import { Outlet } from "react-router-dom";
import Header from "../components/Header/Header";
import { Container } from "react-bootstrap";
import Footer from "../components/Footer/Footer";
import { useSettings } from "../contexts/SettingsContext";

export default function BasePage() {
  const { getBackgroundStyle } = useSettings();

  return (
    <div style={getBackgroundStyle()}>
      <Container fluid className="p-0 min-vh-100 d-flex flex-column">
        <Header />
        <div className="flex-grow-1">
          <Outlet />
        </div>
        <Footer />
      </Container>
    </div>
  );
}