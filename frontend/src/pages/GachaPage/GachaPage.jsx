import { useState } from "react";
import "./GachaPage.css";
import { Container } from "react-bootstrap";
import GachaBanner from "../../components/Gacha/GachaBanner/GachaBanner";
import GachaOverlay from "../../components/Gacha/GachaOverlay/GachaOverlay";

export default function GachaTemp() {
  const [results, setResults] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <Container className="gacha">
      <GachaBanner setResults={setResults} setShowOverlay={setShowOverlay} />

      <GachaOverlay
        show={showOverlay}
        pulls={results}
        onClose={() => setShowOverlay(false)}
      />
    </Container>
  );
}
