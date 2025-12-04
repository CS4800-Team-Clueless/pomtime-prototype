import { useEffect, useRef, useState } from 'react';
import GachaBanner from '../../components/Gacha/GachaBanner/GachaBanner.jsx';
import GachaOverlay from '../../components/Gacha/GachaOverlay/GachaOverlay.jsx';
import './GachaPage.css';
import sparkleSfx from '../../assets/sound_effects/pull_sparkle_effect.wav';
import greatSparkleSfx from "../../assets/sound_effects/great_pull_sparkle.wav";

export default function GachaPage() {
  const [results, setResults] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);

  //audio instance and use sparkle effect
  const sparkleAudioRef = useRef(null);
  const greatSparkleAudioRef = useRef(null);
  useEffect(() => {
    sparkleAudioRef.current = new Audio(sparkleSfx);
    greatSparkleAudioRef.current = new Audio(greatSparkleSfx);
  }, []
  );
  useEffect(() => { //reset sound effect for next pull
    if(!showOverlay || results.length === 0) return;

    const maxStars = Math.max(...results.map((r) => r.stars || r.star || 0));

    const play = async (audio) => {
      if(!audio) return;
      audio.currentTime = 0;
      try{
        await audio.play();
      }catch(err){
        console.error('Error playing sfx', err);
      }
    };

    if(maxStars === 3){
      play(sparkleAudioRef.current);
    }else if(maxStars >= 4){
      play(greatSparkleAudioRef.current);
    }
    
  }, [showOverlay,results]
  );

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