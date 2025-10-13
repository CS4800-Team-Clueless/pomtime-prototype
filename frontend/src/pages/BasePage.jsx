import { Outlet } from "react-router-dom";
import Header from "../components/Header/Header";
import { Container } from "react-bootstrap";
import Footer from "../components/Footer/Footer";

export default function BasePage() {
  return (
    <Container fluid className="p-0 min-vh-100 d-flex flex-column">
      <Header />
      <Outlet />
      <Footer />
    </Container>
  );
}
