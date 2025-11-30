import { useState } from 'react';
import GachaBanner from '../../components/Gacha/GachaBanner/GachaBanner.jsx';
import GachaOverlay from '../../components/Gacha/GachaOverlay/GachaOverlay.jsx';
import './GachaPage.css';

export default function GachaPage() {
  const [results, setResults] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);

  const handleClose = () => {
    setShowOverlay(false);
    setResults([]);
  };

  return (
    <div className="gacha-page">
      <GachaBanner setResults={setResults} setShowOverlay={setShowOverlay} />
      <GachaOverlay
        show={showOverlay}
        pulls={results}
        onClose={handleClose}
      />
    </div>
  );
}