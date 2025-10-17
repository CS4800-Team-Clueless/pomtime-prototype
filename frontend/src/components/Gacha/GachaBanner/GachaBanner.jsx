import "./GachaBanner.css";

// maybe keep in mongo?
const fiveStarPool = ["King", "Angel", "Dragon"];

const fourStarPool = ["Snow", "Prince", "Moon", "Autumn"];

const threeStarPool = [
  "White",
  "Brown",
  "Orange",
  "Black",
  "Cream",
  "Gray",
  "Tan",
  "Beige",
];

// maybe move to backend
function randomRoll() {
  const roll = Math.random();
  if (roll < 0.006) {
    return {
      name: fiveStarPool[Math.floor(Math.random() * fiveStarPool.length)],
      stars: 5,
    };
  } else if (roll < 0.056) {
    return {
      name: fourStarPool[Math.floor(Math.random() * fourStarPool.length)],
      stars: 4,
    };
  } else {
    return {
      name: threeStarPool[Math.floor(Math.random() * threeStarPool.length)],
      stars: 3,
    };
  }
}

export default function GachaBanner({ setResults, setShowOverlay }) {
  const wish = (count) => {
    const pulls = [];
    for (let i = 0; i < count; i++) {
      const r = randomRoll();
      pulls.push({
        id: `${Date.now()}-${i}-${r.name}`,
        ...r,
        image: undefined,
      });
    }
    setResults(pulls);
    setShowOverlay(true);
  };

  return (
    <div className="banner">
      <h1 className="banner-title">Pomeranian Banner</h1>
      <p className="banner-sub">Featured 5★: King, Angel, Dragon</p>
      <div className="banner-actions">
        <button className="btn primary" onClick={() => wish(1)}>
          Wish x1
        </button>
        <button className="ten-btn" onClick={() => wish(10)}>
          Wish x10
        </button>
      </div>
    </div>
  );
}
