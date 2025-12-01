import { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import GACHA_ART, { DEFAULT_ART } from "../../Gacha/GachaArt"; // <-- fix this path
import "./CharacterDisplayOverlay.css";

export default function CharacterDisplayOverlay({
  show,
  onClose,
  collection = {}, // { Beige: { count: 26, rarity: 3 }, Snow: { count: 3, rarity: 4 }, ... }
  initialSelected = [], // ["Snow", "Beige", ...]
  maxSelected,
  onSave, // function(newSelectedNames: string[])
}) {
  const [selected, setSelected] = useState(initialSelected);
  const [rarityFilter, setRarityFilter] = useState("all");

  useEffect(() => {
    if (show) {
      setSelected(initialSelected || []);
    }
  }, [show, initialSelected]);

  const allEntries = Object.entries(collection); // [ [name, { count, rarity }], ... ]

  const filteredEntries = allEntries
    .filter(([name, info]) => {
      const rarity = info?.rarity || 3;
      if (rarityFilter === "all") return true;
      return rarity === Number(rarityFilter);
    })
    .sort(([nameA, infoA], [nameB, infoB]) => {
      const rarityA = infoA?.rarity || 3;
      const rarityB = infoB?.rarity || 3;

      // Sort primarily by rarity (5 → 4 → 3), then by name
      if (rarityFilter === "all" && rarityA !== rarityB) {
        return rarityB - rarityA; // higher rarity first
      }
      return nameA.localeCompare(nameB);
    });

  const toggleSelect = (name) => {
    const isSelected = selected.includes(name);

    if (isSelected) {
      setSelected(selected.filter((n) => n !== name));
    } else {
      if (selected.length >= maxSelected) {
        return;
      }
      setSelected([...selected, name]);
    }
  };

  const handleSave = () => {
    if (onSave) onSave(selected);
    onClose();
  };

  const rarityOrder = [5, 4, 3];

  const groupedByRarity = rarityOrder.reduce((acc, rarity) => {
    acc[rarity] = [];
    return acc;
  }, {});

  Object.entries(collection).forEach(([name, info]) => {
    const rarity = info?.rarity || 3;
    if (!groupedByRarity[rarity]) {
      groupedByRarity[rarity] = [];
    }
    groupedByRarity[rarity].push([name, info]);
  });

  // Sort each group by name
  rarityOrder.forEach((rarity) => {
    groupedByRarity[rarity].sort(([nameA], [nameB]) =>
      nameA.localeCompare(nameB)
    );
  });

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="lg"
      centered
      contentClassName="character-overlay-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Select Characters to Display</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="character-overlay__topbar">
          <p className="character-overlay__info">
            Selected: {selected.length} / {maxSelected}
          </p>

          <div className="character-overlay__toolbar">
            <span className="character-overlay__toolbar-label">
              Filter by rarity:
            </span>
            <select
              className="character-overlay__select"
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="5">5★</option>
              <option value="4">4★</option>
              <option value="3">3★</option>
            </select>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <p>You don’t have any characters in this rarity (yet).</p>
        ) : (
          <div className="character-overlay__grid">
            {filteredEntries.map(([name, info]) => {
              const { count, rarity = 3 } = info || {};
              const index = selected.indexOf(name);
              const isSelected = index !== -1;
              const imageSrc = GACHA_ART[name] || DEFAULT_ART;

              return (
                <button
                  key={name}
                  type="button"
                  className={`character-overlay__card rarity-${rarity} ${
                    isSelected ? "character-overlay__card--selected" : ""
                  }`}
                  onClick={() => toggleSelect(name)}
                >
                  <div className="character-overlay__image-wrapper">
                    <img
                      src={imageSrc}
                      alt={name}
                      className="character-overlay__image"
                    />
                    {isSelected && (
                      <div className="character-overlay__check">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  <div className="character-overlay__name">{name}</div>
                  <div className="character-overlay__stars">
                    {"★".repeat(rarity)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Selection
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
