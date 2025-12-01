import { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import GACHA_ART, { DEFAULT_ART } from '../../components/Gacha/GachaArt';
import './InventoryPage.css';

// Character rarity mapping
const CHARACTER_RARITY = {
  // 5-star
  'King': 5,
  'Angel': 5,
  'Dragon': 5,
  // 4-star
  'Snow': 4,
  'Prince': 4,
  'Moon': 4,
  'Autumn': 4,
  // 3-star
  'White': 3,
  'Brown': 3,
  'Orange': 3,
  'Black': 3,
  'Cream': 3,
  'Gray': 3,
  'Tan': 3,
  'Beige': 3
};

export default function Inventory() {
  const { fetchWithAuth, API_URL } = useAuth();
  const [collection, setCollection] = useState({});
  const [profileStats, setProfileStats] = useState({
    level: 1,
    experience: 0,
    xp_in_current_level: 0,
    xp_needed_for_next: 100
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [releasingChar, setReleasingChar] = useState(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [releaseCount, setReleaseCount] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching collection and stats...');

      const collectionRes = await fetchWithAuth(`${API_URL}/api/collection`);
      const collectionData = await collectionRes.json();
      console.log('Collection data:', collectionData);

      const statsRes = await fetchWithAuth(`${API_URL}/api/profile/stats`);
      const statsData = await statsRes.json();
      console.log('Stats data:', statsData);

      setCollection(collectionData.collection || {});
      setProfileStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      // If stats endpoint fails, at least try to show collection
      try {
        const collectionRes = await fetchWithAuth(`${API_URL}/api/collection`);
        const collectionData = await collectionRes.json();
        setCollection(collectionData.collection || {});
        // Set default stats if stats endpoint fails
        setProfileStats({
          level: 1,
          experience: 0,
          xp_in_current_level: 0,
          xp_needed_for_next: 100
        });
      } catch (collectionError) {
        console.error('Failed to fetch collection:', collectionError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (charName, stars, maxCount) => {
    setSelectedCharacter({ name: charName, stars, maxCount });
    setReleaseCount(1);
    setShowReleaseModal(true);
  };

  const confirmRelease = async () => {
    if (!selectedCharacter) return;

    const { name: charName, stars } = selectedCharacter;
    setReleasingChar(charName);
    setShowReleaseModal(false);

    try {
      const response = await fetchWithAuth(`${API_URL}/api/collection/release`, {
        method: 'POST',
        body: JSON.stringify({
          character: charName,
          count: releaseCount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to release character');
      }

      const data = await response.json();

      if (data.success) {
        setCollection(data.collection);
        setProfileStats({
          level: data.level,
          experience: data.total_xp,
          xp_in_current_level: data.xp_in_current_level,
          xp_needed_for_next: data.xp_needed_for_next
        });

        if (data.leveled_up) {
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error releasing character:', error);
      alert(`Failed to release character: ${error.message}`);
    } finally {
      setReleasingChar(null);
      setSelectedCharacter(null);
    }
  };

  const getXPForRarity = (stars) => {
    const xpMap = { 3: 25, 4: 75, 5: 200 };
    return xpMap[stars] || 25;
  };

  // Group characters by rarity
  const groupedCharacters = () => {
    const groups = { 5: [], 4: [], 3: [] };

    Object.entries(CHARACTER_RARITY).forEach(([name, stars]) => {
      const count = collection[name] || 0;
      groups[stars].push({ name, stars, count });
    });

    Object.keys(groups).forEach(rarity => {
      groups[rarity].sort((a, b) => b.count - a.count);
    });

    return groups;
  };

  const filteredCharacters = () => {
    const groups = groupedCharacters();

    if (filter === 'all') {
      return [...groups[5], ...groups[4], ...groups[3]];
    }

    return groups[filter];
  };

  const totalCharacters = Object.values(collection).reduce((sum, count) => sum + count, 0);
  const uniqueCharacters = Object.keys(collection).length;
  const progressPercentage = (profileStats.xp_in_current_level / profileStats.xp_needed_for_next) * 100;

  if (loading) {
    return (
      <div className="inventory-page">
        <div className="loading">Loading collection...</div>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <div className="inventory-container">
        {/* Level Up Notification */}
        {showLevelUp && (
          <div className="level-up-notification">
            🎉 Level Up! You are now Level {profileStats.level}! 🎉
          </div>
        )}

        <header className="inventory-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 className="inventory-title">🐕 My Collection</h1>
            <button
              onClick={fetchData}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              🔄 Refresh Inventory
            </button>
          </div>

          {/* Level and XP Bar */}
          <div className="level-section">
            <div className="level-display">
              <span className="level-label">Level</span>
              <span className="level-number">{profileStats.level}</span>
            </div>
            <div className="xp-bar-container">
              <div className="xp-bar-bg">
                <div
                  className="xp-bar-fill"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="xp-text">
                {profileStats.xp_in_current_level} / {profileStats.xp_needed_for_next} XP
              </div>
            </div>
          </div>

          <div className="inventory-stats">
            <div className="stat-card">
              <div className="points-value">{totalCharacters}</div>
              <div className="stat-label">Total Pomeranians</div>
            </div>
            <div className="stat-card">
              <div className="points-value">{uniqueCharacters}</div>
              <div className="stat-label">Unique Pomeranians</div>
            </div>
            <div className="stat-card">
              <div className="points-value">{Object.keys(CHARACTER_RARITY).length}</div>
              <div className="stat-label">Total Available</div>
            </div>
          </div>
        </header>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${filter === '5' ? 'active' : ''}`}
            onClick={() => setFilter('5')}
          >
            ★★★★★
          </button>
          <button
            className={`filter-tab ${filter === '4' ? 'active' : ''}`}
            onClick={() => setFilter('4')}
          >
            ★★★★
          </button>
          <button
            className={`filter-tab ${filter === '3' ? 'active' : ''}`}
            onClick={() => setFilter('3')}
          >
            ★★★
          </button>
        </div>

        <div className="collection-grid">
          {filteredCharacters().map(char => (
            <div
              key={char.name}
              className={`character-card rarity-${char.stars} ${char.count === 0 ? 'not-owned' : ''}`}
            >
              <div className="character-image">
                <img
                  src={GACHA_ART[char.name] || DEFAULT_ART}
                  alt={char.name}
                  className="character-artwork"
                />
              </div>
              <div className="character-info">
                <div className="character-name">{char.name}</div>
                <div className="character-stars">{'★'.repeat(char.stars)}</div>
                <div className="character-count">
                  {char.count > 0 ? `×${char.count}` : 'Not Obtained'}
                </div>

                {char.count > 0 && (
                  <button
                    className="release-btn"
                    onClick={() => handleRelease(char.name, char.stars, char.count)}
                    disabled={releasingChar === char.name}
                  >
                    {releasingChar === char.name ? 'Releasing...' : `Release (+${getXPForRarity(char.stars)} XP)`}
                  </button>
                )}
              </div>
              {char.count === 0 && <div className="locked-overlay">🔒</div>}
            </div>
          ))}
        </div>

        {totalCharacters === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>Your collection is empty!</h3>
            <p>Complete tasks to earn points and roll the gacha to start collecting Pomeranians.</p>
          </div>
        )}
      </div>

      {/* Release Confirmation Modal */}
      <Modal show={showReleaseModal} onHide={() => setShowReleaseModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}>
          <Modal.Title>Release Pomeranian?</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ textAlign: 'center', padding: '2rem' }}>
          {selectedCharacter && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <img
                  src={GACHA_ART[selectedCharacter.name] || DEFAULT_ART}
                  alt={selectedCharacter.name}
                  style={{ width: '120px', height: '120px', objectFit: 'contain' }}
                />
              </div>
              <h4 style={{ marginBottom: '1rem' }}>{selectedCharacter.name}</h4>
              <div style={{ fontSize: '1.5rem', color: '#fbbf24', marginBottom: '1rem' }}>
                {'★'.repeat(selectedCharacter.stars)}
              </div>

              {selectedCharacter.maxCount > 1 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Release Count: (You own {selectedCharacter.maxCount})
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <button
                      onClick={() => setReleaseCount(Math.max(1, releaseCount - 1))}
                      style={{
                        width: '40px',
                        height: '40px',
                        fontSize: '1.5rem',
                        border: '2px solid #d1d5db',
                        borderRadius: '0.5rem',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selectedCharacter.maxCount}
                      value={releaseCount}
                      onChange={(e) => setReleaseCount(Math.min(selectedCharacter.maxCount, Math.max(1, parseInt(e.target.value) || 1)))}
                      style={{
                        width: '80px',
                        padding: '0.5rem',
                        fontSize: '1.25rem',
                        textAlign: 'center',
                        border: '2px solid #d1d5db',
                        borderRadius: '0.5rem'
                      }}
                    />
                    <button
                      onClick={() => setReleaseCount(Math.min(selectedCharacter.maxCount, releaseCount + 1))}
                      style={{
                        width: '40px',
                        height: '40px',
                        fontSize: '1.5rem',
                        border: '2px solid #d1d5db',
                        borderRadius: '0.5rem',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                Release {releaseCount} {selectedCharacter.name} Pomeranian{releaseCount > 1 ? 's' : ''} to gain:
              </p>
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#3b82f6',
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                padding: '1rem',
                borderRadius: '0.75rem',
                marginTop: '1rem'
              }}>
                +{getXPForRarity(selectedCharacter.stars) * releaseCount} XP
              </div>
              <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                This action cannot be undone.
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReleaseModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmRelease}>
            Release
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}