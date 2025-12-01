import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import GACHA_ART, { DEFAULT_ART } from "../../components/Gacha/GachaArt";
import CharacterDisplayOverlay from "../../components/ProfileSettings/CharacterDisplayOverlay/CharacterDisplayOverlay";
import "./ProfileSettings.css";
import { set } from "date-fns";

const MAX_DISPLAY_LIMIT = 6;

export default function ProfileSettings() {
  const { user, fetchWithAuth, API_URL } = useAuth();

  const navigate = useNavigate();
  const [collection, setCollection] = useState([]);
  const [showCharacterOverlay, setShowCharacterOverlay] = useState(false);
  const [displayedCharacters, setDisplayedCharacters] = useState([]);
  const [stats, setStats] = useState({
    total_characters: 0,
    unique_character: 0,
    total_sessions: 0,
  });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollection();
    fetchDisplayedCharacters();
    fetchPomodoroSessions();
  }, []);

  const fetchCollection = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/collection`);
      const data = await response.json();

      const collection = data.collection || {};

      const total_characters = Object.values(collection).reduce(
        (sum, val) => sum + val,

        0
      );
      const unique_character = Object.keys(collection).length;

      setCollection(data.collection || {});
      setStats((prev) => ({
        ...prev,

        total_characters,

        unique_character,
      }));
    } catch (error) {
      console.error("Error fetching collection:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPomodoroSessions = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/pomodoro/sessions`);
      const data = await response.json();

      setSessions(data.sessions || {});
      setStats((prev) => ({
        ...prev,

        total_sessions: data.sessions.length,
      }));
    } catch (error) {
      console.error("Error fetching points:", error);
    }
  };

  const fetchDisplayedCharacters = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/api/user/displayed-characters`
      );
      const data = await response.json();
      setDisplayedCharacters(data.displayed_characters || []);
    } catch (error) {
      console.error("Error fetching displayed characters:", error);
    }
  };

  const handleSaveDisplayed = async (newSelected) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/api/user/displayed-characters`,
        {
          method: "PUT",
          body: JSON.stringify({ displayed_characters: newSelected }),
        }
      );

      if (response.ok) {
        setDisplayedCharacters(newSelected);
        setShowCharacterOverlay(false);
      } else {
        alert("Failed to update displayed characters.");
      }
    } catch (err) {
      console.error("Error updating displayed characters:", err);
      alert("Failed to update displayed characters.");
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  // Helper to get rarity from character pools
  const FIVE_STAR_POOL = ["King", "Angel", "Dragon"];
  const FOUR_STAR_POOL = ["Snow", "Prince", "Moon", "Autumn"];

  const getCharacterRarity = (name) => {
    if (FIVE_STAR_POOL.includes(name)) return 5;
    if (FOUR_STAR_POOL.includes(name)) return 4;
    return 3;
  };

  const getRarityClass = (rarity) => {
    if (rarity === 5) return "character-card__rarity--5star";
    if (rarity === 4) return "character-card__rarity--4star";
    if (rarity === 3) return "character-card__rarity--3star";
    return "";
  };

  const getRarityStars = (rarity) => {
    return "★".repeat(rarity);
  };

  return (
    <div className="profile-settings">
      <div className="profile-settings__container">
        <button onClick={handleBack} className="profile-settings__back">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="profile-settings__title">Profile Settings</h1>

        <div className="profile-settings__card">
          {/* Profile Information */}
          <div className="profile-settings__section">
            <h2 className="profile-settings__section-title">
              Profile Information
            </h2>

            <div className="profile-settings__avatar-section">
              <img
                src={
                  user?.picture ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || user?.email
                  )}&size=128&background=6366f1&color=fff`
                }
                alt={user?.name}
                className="profile-settings__avatar"
              />
              <div>
                <h3 className="profile-settings__name">
                  {user?.name || "User"}
                </h3>
                <p className="profile-settings__email">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="profile-settings__divider"></div>

          {/* Stats Section */}
          <div className="profile-settings__section">
            <h2 className="profile-settings__section-title">Statistics</h2>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card__icon">🍅</div>
                <p className="stat-card__value">{stats.total_sessions}</p>
                <p className="stat-card__label">Pomodoro Sessions</p>
              </div>

              <div className="stat-card">
                <div className="stat-card__icon">🐕</div>
                <p className="stat-card__value">{stats.total_characters}</p>
                <p className="stat-card__label">Total Pomeranians</p>
              </div>

              <div className="stat-card">
                <div className="stat-card__icon">✨</div>
                <p className="stat-card__value">{stats.unique_character}</p>
                <p className="stat-card__label">Unique Collected</p>
              </div>
            </div>
          </div>

          <div className="profile-settings__divider"></div>

          {/* Displayed Characters Section */}
          <div className="profile-settings__section">
            <div className="displayed-header">
              <h2 className="profile-settings__section-title">
                Displayed Characters
              </h2>
              <button
                type="button"
                className="display-edit-button"
                onClick={() => setShowCharacterOverlay(true)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            </div>

            <p className="displayed-count">
              {displayedCharacters.length} / {MAX_DISPLAY_LIMIT} selected
            </p>

            {displayedCharacters.length > 0 ? (
              <div className="displayed-grid">
                {displayedCharacters.map((name, index) => {
                  const rarity = getCharacterRarity(name);
                  return (
                    <div key={`${name}-${index}`} className="displayed-card">
                      <img
                        src={GACHA_ART[name] || DEFAULT_ART}
                        alt={name}
                        className="displayed-card__image"
                      />
                      <p className="displayed-card__name">{name}</p>
                      <p
                        className={`displayed-card__rarity ${getRarityClass(
                          rarity
                        )}`}
                      >
                        {getRarityStars(rarity)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="displayed-empty">
                <p>No characters displayed yet.</p>
                <button
                  className="displayed-empty-button"
                  onClick={() => setShowCharacterOverlay(true)}
                >
                  Select Characters to Display
                </button>
              </div>
            )}
          </div>

          <div className="profile-settings__divider"></div>

          {/* Account Details */}
          <div className="profile-settings__section">
            <h2 className="profile-settings__section-title">Account Details</h2>

            <div className="profile-settings__field">
              <label className="profile-settings__label">Name</label>
              <input
                type="text"
                value={user?.name || ""}
                className="profile-settings__input"
                disabled
              />
            </div>

            <div className="profile-settings__field">
              <label className="profile-settings__label">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                className="profile-settings__input"
                disabled
              />
            </div>

            <p className="profile-settings__note">
              Profile information is managed through your Google account.
            </p>
          </div>
        </div>
      </div>

      {/* Character Selection Modal */}
      <CharacterDisplayOverlay
        show={showCharacterOverlay}
        onClose={() => setShowCharacterOverlay(false)}
        collection={collection}
        initialSelected={displayedCharacters}
        maxSelected={MAX_DISPLAY_LIMIT}
        onSave={handleSaveDisplayed}
      />
    </div>
  );
}
