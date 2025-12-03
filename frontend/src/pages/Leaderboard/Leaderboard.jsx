import { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import GACHA_ART, { DEFAULT_ART } from "../../components/Gacha/GachaArt";
import "./Leaderboard.css";

import trophyIcon from "../../assets/icons/Trophy_Icon.png";
import friendsIcon from "../../assets/icons/Friends_Icon.png";
import pomIcon from "../../assets/icons/PomIcon.png";
import tomatoIcon from "../../assets/icons/Tomato_Icon.png";
import uniqueIcon from "../../assets/icons/Unique_Icon.png";

// Character rarity mapping
const CHARACTER_RARITY = {
  King: 5,
  Angel: 5,
  Dragon: 5,
  Snow: 4,
  Prince: 4,
  Moon: 4,
  Autumn: 4,
  White: 3,
  Brown: 3,
  Orange: 3,
  Black: 3,
  Cream: 3,
  Gray: 3,
  Tan: 3,
  Beige: 3,
};

export default function Leaderboard() {
  const { fetchWithAuth, API_URL, user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState(false);

  // Load friends and leaderboard on mount
  useEffect(() => {
    loadFriendsAndLeaderboard();
  }, []);

  const loadFriendsAndLeaderboard = async () => {
    setLoading(true);
    try {
      // Get friends list from backend
      const friendsResponse = await fetchWithAuth(`${API_URL}/api/friends`);
      const friendsData = await friendsResponse.json();
      setFriends(friendsData.friends || []);

      // Get friends leaderboard
      const leaderboardResponse = await fetchWithAuth(
        `${API_URL}/api/friends/leaderboard`
      );
      const leaderboardData = await leaderboardResponse.json();
      setLeaderboard(leaderboardData.leaderboard || []);
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    const email = searchEmail.trim().toLowerCase();

    setAddingFriend(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/api/friends`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setSearchEmail("");

        // Reload friends and leaderboard
        await loadFriendsAndLeaderboard();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add friend");
      }
    } catch (error) {
      console.error("Error adding friend:", error);
      alert("Failed to add friend");
    } finally {
      setAddingFriend(false);
    }
  };

  const handleRemoveFriend = async (email) => {
    if (!confirm(`Remove ${email} from your leaderboard?`)) return;

    try {
      const response = await fetchWithAuth(
        `${API_URL}/api/friends/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Reload friends and leaderboard
        await loadFriendsAndLeaderboard();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to remove friend");
      }
    } catch (error) {
      console.error("Error removing friend:", error);
      alert("Failed to remove friend");
    }
  };

  const handleViewProfile = async (email) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/api/user/public-profile`,
        {
          method: "POST",
          body: JSON.stringify({ email }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedProfile(data.profile);
        setShowProfileModal(true);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to load profile");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      alert("Failed to load profile");
    }
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
  };

  const getRankEmoji = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        <h1 className="leaderboard-title">
          <div className="leaderboard-icon">
            <img src={trophyIcon} alt="Trophy Icon" />
          </div>
          Friends Leaderboard
          <div className="leaderboard-icon">
            <img src={trophyIcon} alt="Trophy Icon" />
          </div>
        </h1>

        {/* Add Friend Section */}
        <div className="search-section">
          <h2 className="search-title">Add Friend to Leaderboard</h2>
          <div className="search-form">
            <input
              type="email"
              placeholder="Enter Gmail address"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddFriend(e)}
              className="search-input"
            />
            <button
              onClick={handleAddFriend}
              className="search-button"
              disabled={addingFriend}
            >
              {addingFriend ? "Adding..." : "Add Friend"}
            </button>
          </div>
          <p className="search-hint">
            Add friends by their Gmail to compare stats and see who's leading!
          </p>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="loading">Loading leaderboard...</div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-leaderboard">
            <div className="empty-icon">
              <img src={friendsIcon} alt="Friends Icon" />
            </div>
            <h3>No Friends Added Yet</h3>
            <p>Add friends using their Gmail address to start competing!</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            <div className="list-header">
              <h2 className="list-title">
                Your Friends ({leaderboard.length})
              </h2>
            </div>
            {leaderboard.map((player, index) => (
              <div
                key={player.email_display}
                className={`leaderboard-item ${
                  player.email_display === user?.email ? "current-user" : ""
                } ${
                  index === 0
                    ? "rank-1"
                    : index === 1
                    ? "rank-2"
                    : index === 2
                    ? "rank-3"
                    : ""
                }`}
              >
                <div className="rank">{getRankEmoji(index)}</div>
                <div
                  className="player-clickable"
                  onClick={() => handleViewProfile(player.email_display)}
                >
                  <img
                    src={
                      player.picture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        player.name
                      )}&size=64&background=6366f1&color=fff`
                    }
                    alt={player.name}
                    className="player-avatar"
                  />
                  <div className="player-info">
                    <div className="player-name">{player.name}</div>
                    <div className="player-email">{player.email_display}</div>
                  </div>
                </div>
                <div className="player-stats">
                  <div className="stat-badge level-badge">
                    Lv. {player.level}
                  </div>
                  <div className="stat-badge xp-badge">
                    {player.experience} XP
                  </div>
                </div>
                <button
                  className="remove-friend-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFriend(player.email_display);
                  }}
                  title="Remove friend"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <Modal
        show={showProfileModal}
        onHide={closeProfileModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedProfile?.name}'s Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProfile && (
            <div className="profile-modal-content">
              <div className="profile-header">
                <img
                  src={
                    selectedProfile.picture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      selectedProfile.name
                    )}&size=128&background=6366f1&color=fff`
                  }
                  alt={selectedProfile.name}
                  className="profile-avatar"
                />
                <div className="profile-details">
                  <h3>{selectedProfile.name}</h3>
                  <p className="profile-email">
                    {selectedProfile.email_display}
                  </p>
                  <div className="profile-level">
                    <span className="level-badge-large">
                      Level {selectedProfile.level}
                    </span>
                    <span className="xp-text">
                      {selectedProfile.experience} XP
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-stats-grid">
                <div className="profile-stat-card">
                  <div className="profile-stat-card__icon">
                    <img src={tomatoIcon} alt="Tomato Icon" />
                  </div>
                  <p className="profile-stat-card__value">
                    {selectedProfile.stats.total_sessions}
                  </p>
                  <p className="profile-stat-card__label">Pomodoro Sessions</p>
                </div>
                <div className="profile-stat-card">
                  <div className="profile-stat-card__icon">
                    <img src={pomIcon} alt="Pomeranian Icon" />
                  </div>
                  <div className="stat-value">
                    {selectedProfile.stats.total_pomeranians}
                  </div>
                  <div className="stat-label">Total Pomeranians</div>
                </div>
                <div className="profile-stat-card">
                  <div className="profile-stat-card__icon">
                    <img src={uniqueIcon} alt="Unique Icon" />
                  </div>
                  <div className="stat-value">
                    {selectedProfile.stats.unique_pomeranians}
                  </div>
                  <div className="stat-label">Unique Collected</div>
                </div>
              </div>

              {selectedProfile.displayed_characters &&
                selectedProfile.displayed_characters.length > 0 && (
                  <div className="displayed-section">
                    <h4>Displayed Pomeranians</h4>
                    <div className="displayed-grid">
                      {selectedProfile.displayed_characters.map((charName) => {
                        const rarity = CHARACTER_RARITY[charName] || 3;
                        return (
                          <div
                            key={charName}
                            className={`displayed-char rarity-${rarity}`}
                          >
                            <img
                              src={GACHA_ART[charName] || DEFAULT_ART}
                              alt={charName}
                              className="displayed-char-img"
                            />
                            <div className="displayed-char-name">
                              {charName}
                            </div>
                            <div className="displayed-char-stars">
                              {"★".repeat(rarity)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeProfileModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
