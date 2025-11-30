import { Modal, Button } from "react-bootstrap";
import "./GachaOverlay.css";

// pulls: Array<{ name: string, stars: number }>
export default function GachaOverlay({ show, pulls = [], onClose }) {
  const isSingle = pulls.length === 1;

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="lg"
      contentClassName="gacha-modal"
    >
      <Modal.Header className="gacha-header border-0">
        <Modal.Title>
          {isSingle ? "Wish x1 Result" : `Wish x${pulls.length} Results`}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className={isSingle ? "single-pull" : "grid-pull"}>
        {pulls.map((pull) => (
          <div key={pull.id} className={`character-card stars-${pull.stars}`}>
            <div className="character-image-wrapper">
              <img
                src={pull.image}
                alt={pull.name}
                className="character-image"
              />
            </div>
            <div className="name">{pull.name}</div>
            <div className="stars">{"★".repeat(pull.stars)}</div>
          </div>
        ))}
      </Modal.Body>

      <Modal.Footer className="gacha-footer border-0">
        <Button variant="light" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
