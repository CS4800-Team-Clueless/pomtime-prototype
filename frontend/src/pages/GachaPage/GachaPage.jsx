import { useEffect, useRef, useState } from 'react';
import GachaBanner from '../../components/Gacha/GachaBanner/GachaBanner.jsx';
import GachaOverlay from '../../components/Gacha/GachaOverlay/GachaOverlay.jsx';
import './GachaPage.css';
//import sparkleSfx from '../../assets/sound_effects/pull_sparkle_effect.wav';

export default function GachaPage() {
  const [results, setResults] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);

  //audio instance and use sparkle effect
/*  const sparkleAudioRef = useRef(null);
  useEffect(() => {
    sparkleAudioRef.current = new Audio(sparkleSfx);
  }, []
  );
  useEffect(() => { //reset sound effect for next pull
    if(showOverlay && results.length > 0 && sparkleAudioRef.current){
      sparkleAudioRef.current.currentTime =0;
      sparkleAudioRef.current.play().catch((err) => {
        console.error('Error playing sfx',err);
      });
    }
  }, [showOverlay,result.length]
  );
*/
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