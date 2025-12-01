import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import "./GachaBanner.css";
import GACHA_ART, { DEFAULT_ART } from "../GachaArt";
import pomBanner from "../../../assets/gacha/banners/Pomeranian_Banner.png";
import pomBannerBackground from "../../../assets/gacha/banners/Pomeranian_banner_background.jpg";

export default function GachaBanner({ setResults, setShowOverlay }) {
  const { fetchWithAuth, API_URL } = useAuth();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/points`);
      const data = await response.json();
      setPoints(data.points);
    } catch (error) {
      console.error("Error fetching points:", error);
    }
  };

  const wish = async (count) => {
    if (points < count) {
      alert(
        `Insufficient points! You need ${count} points but only have ${points}.`
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/api/gacha/roll`, {
        method: "POST",
        body: JSON.stringify({ count }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to perform gacha roll");
        return;
      }

      const data = await response.json();

      // Add unique IDs to results
      const resultsWithIds = data.results.map((r, i) => ({
        id: `${Date.now()}-${i}-${r.name}`,
        ...r,
        image: GACHA_ART[r.name] || DEFAULT_ART,
      }));

      setResults(resultsWithIds);
      setShowOverlay(true);
      setPoints(data.remaining_points);
    } catch (error) {
      console.error("Error performing gacha:", error);
      alert("Failed to perform gacha roll");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="banner"
    style={{
        backgroundImage: `url(${pomBannerBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    }}
    >
      {/* Top Bar: Title on Left, Points on Right */}
      <div className="banner-top">
        <div className="banner-titles">
          <h1 className="banner-title">Pomeranian Banner: Fantasy</h1>
          <p className="banner-sub">Featured 5★: King, Angel, Dragon</p>
        </div>

        <div className="points-display">
          <span className="points-icon"></span>
          <span className="points-value">{Math.floor(points)}🐕</span>
          <span className="points-label">Pom Prisms</span>
        </div>
      </div>

      {/* Banner Art - Centered */}
      <div className="banner-inner">
        <div className="banner-art">
          <img
            src={pomBanner}
            alt="Pomeranian Gacha Banner"
            className="banner-art-image"
          />
        </div>
      </div>

      {/* Bottom: Buttons and Warning */}
      <div className="banner-info">
        <p className="warning-text">
          Complete tasks in the calendar to earn more Pom Prisms!
        </p>

        <div className="banner-actions">
          <button
            className="btn primary"
            onClick={() => wish(1)}
            disabled={loading || points < 1}
          >
            Wish x1 <span className="cost">(1 🐶)</span>
          </button>
          <button
            className="ten-btn"
            onClick={() => wish(10)}
            disabled={loading || points < 10}
          >
            Wish x10 <span className="cost">(10 🐶)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
