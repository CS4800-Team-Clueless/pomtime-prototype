import { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import GACHA_ART, { DEFAULT_ART } from "../../Gacha/GachaArt"; // <-- fix this path

const DEFAULT_MAX = 6;

export default function CharacterDisplayOverlay({
  show,
  onClose,
  collection = {}, // { Beige: 26, Snow: 3, ... }
  initialSelected = [], // ["Snow", "Beige", ...]
  maxSelected = DEFAULT_MAX,
  onSave, // function(newSelectedNames: string[])
}) {
  const [selected, setSelected] = useState(initialSelected);

  // When the modal opens or initialSelected changes, sync local state
  useEffect(() => {
    if (show) {
      setSelected(initialSelected || []);
    }
  }, [show, initialSelected]);

  // Turn { name: count } into [["Beige", 26], ["Snow", 3], ...]
  const entries = Object.entries(collection);

  const toggleSelect = (name) => {
    const isSelected = selected.includes(name);

    if (isSelected) {
      setSelected(selected.filter((n) => n !== name));
    } else {
      if (selected.length >= maxSelected) {
        alert(`You can only display up to ${maxSelected} characters.`);
        return;
      }
      setSelected([...selected, name]);
    }
  };

  const handleSave = () => {
    if (onSave) onSave(selected);
    onClose();
  };

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
        <p className="character-overlay__info">
          Choose up to <strong>{maxSelected}</strong> Pomeranians to feature on
          your profile.
        </p>
        <p className="character-overlay__info">
          Selected: {selected.length} / {maxSelected}
        </p>

        {entries.length === 0 ? (
          <p>You don’t have any characters in your collection yet.</p>
        ) : (
          <div className="character-overlay__grid">
            {entries.map(([name, count]) => {
              const isSelected = selected.includes(name);
              const imageSrc = GACHA_ART[name] || DEFAULT_ART;

              return (
                <button
                  key={name}
                  type="button"
                  className={`character-overlay__card ${
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
                      <div className="character-overlay__check">✓</div>
                    )}
                  </div>
                  <div className="character-overlay__name">{name}</div>
                  <div className="character-overlay__count">x{count}</div>
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
