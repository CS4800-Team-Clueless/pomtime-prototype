import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import GACHA_ART, { DEFAULT_ART } from "../../components/Gacha/GachaArt";
import CharacterDisplayOverlay from "../../components/ProfileSettings/CharacterDisplayOverlay/CharacterDisplayOverlay";
import "./ProfileSettings.css";

import pomIcon from "../../assets/icons/PomIcon.png";

const MAX_DISPLAY_LIMIT = 6;

// Character rarity mapping
const CHARACTER_RARITY = {
  // 5-star
  King: 5,
  Angel: 5,
  Dragon: 5,
  // 4-star
  Snow: 4,
  Prince: 4,
  Moon: 4,
  Autumn: 4,
  // 3-star
  White: 3,
  Brown: 3,
  Orange: 3,
  Black: 3,
  Cream: 3,
  Gray: 3,
  Tan: 3,
  Beige: 3,
};

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
    level: 0,
  });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollection();
    fetchDisplayedCharacters();
    fetchPomodoroSessions();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/profile/stats`);
      const data = await response.json();

      setStats((prev) => ({
        ...prev,
        level: data.level,
      }));
    } catch (e) {
      console.error("Error fetching user:", e);
    }
  };

  const fetchCollection = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/collection`);
      const data = await response.json();

      const rawCollection = data.collection || {};

      const enhancedCollection = Object.fromEntries(
        Object.entries(rawCollection).map(([name, count]) => [
          name,
          {
            count,
            rarity: CHARACTER_RARITY[name] || 3, // default 3-star
          },
        ])
      );

      const total_characters = Object.values(rawCollection).reduce(
        (sum, val) => sum + val,
        0
      );
      const unique_character = Object.keys(rawCollection).length;

      setCollection(enhancedCollection);
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
    } finally {
      setLoading(false);
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
    } finally {
      setLoading(false);
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
    } finally {
      setLoading(false);
    }
  };

  const getCharacterRarity = (name) => {
    return CHARACTER_RARITY[name] || 3; // Default to 3-star if not found
  };

  return (
    <div className="profile-settings">
      <div className="profile-settings__container">
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
            <div className="statistics-header">
              <h2 className="profile-settings__section-title">Statistics</h2>
              <p className="statistics-level">Level: {stats.level}</p>
            </div>

            <div className="profile-stats-grid">
              <div className="profile-stat-card">
                <div className="profile-stat-card__icon">🍅</div>
                <p className="profile-stat-card__value">
                  {stats.total_sessions}
                </p>
                <p className="profile-stat-card__label">Pomodoro Sessions</p>
              </div>

              <div className="profile-stat-card">
                <div className="profile-stat-card__icon">
                  <img src={pomIcon} alt="Pomeranian Icon" />
                </div>
                <p className="profile-stat-card__value">
                  {stats.total_characters}
                </p>
                <p className="profile-stat-card__label">Total Pomeranians</p>
              </div>

              <div className="profile-stat-card">
                <div className="profile-stat-card__icon">✨</div>
                <p className="profile-stat-card__value">
                  {stats.unique_character}
                </p>
                <p className="profile-stat-card__label">Unique Collected</p>
              </div>
            </div>
          </div>

          <div className="profile-settings__divider"></div>

          {/* Displayed Characters Section */}
          <div className="profile-settings__section">
            <div className="displayed-header">
              <h2 className="profile-settings__section-title">
                Displayed Pomeranians
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

            {displayedCharacters.length > 0 ? (
              <div className="displayed-grid">
                {displayedCharacters.map((name) => {
                  const rarity = getCharacterRarity(name);
                  return (
                    <div
                      key={name}
                      className={`displayed-character-card rarity-${rarity}`}
                    >
                      <img
                        src={GACHA_ART[name] || DEFAULT_ART}
                        alt={name}
                        className="displayed-character-image"
                      />
                      <p className="displayed-character-name">{name}</p>
                      <p className={`displayed-character-stars`}>
                        {"★".repeat(rarity)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="displayed-empty">
                <p>No characters displayed yet.</p>
              </div>
            )}

            <p className="displayed-count">
              {displayedCharacters.length} / {MAX_DISPLAY_LIMIT} selected
            </p>
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
