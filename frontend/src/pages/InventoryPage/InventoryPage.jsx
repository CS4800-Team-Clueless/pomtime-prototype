import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, 5, 4, 3

  useEffect(() => {
    fetchCollection();
  }, []);

  const fetchCollection = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/collection`);
      const data = await response.json();
      setCollection(data.collection || {});
    } catch (error) {
      console.error('Error fetching collection:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group characters by rarity
  const groupedCharacters = () => {
    const groups = { 5: [], 4: [], 3: [] };

    Object.entries(CHARACTER_RARITY).forEach(([name, stars]) => {
      const count = collection[name] || 0;
      groups[stars].push({ name, stars, count });
    });

    // Sort by count (descending) within each group
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
        <header className="inventory-header">
          <h1 className="inventory-title">🐕 My Collection</h1>
          <div className="inventory-stats">
            <div className="stat-card">
              <div className="points-value">{totalCharacters}</div>
              <div className="stat-label">Total Pomeranians</div>
            </div>
            <div className="stat-card">
              <div className="points-value">{uniqueCharacters}</div>
              <div className="stat-label">Unique Characters</div>
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
                <div className="character-icon">🐕</div>
              </div>
              <div className="character-info">
                <div className="character-name">{char.name}</div>
                <div className="character-stars">{'★'.repeat(char.stars)}</div>
                <div className="character-count">
                  {char.count > 0 ? `×${char.count}` : 'Not Obtained'}
                </div>
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
    </div>
  );
}