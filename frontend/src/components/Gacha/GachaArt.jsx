import pomIcon from "../../assets/icons/PomIcon.png";

// Import all pomeranian character images
const modules = import.meta.glob(
  "../../assets/gacha/characters/pomeranian/*.png",
  { eager: true }
);

const GACHA_ART = {};

for (const path in modules) {
  const img = modules[path];

  // Extract file name from path:
  // "../../assets/.../Snow.png" → "Snow"
  const name = path.split("/").pop().replace(".png", "");

  // Store image in the map using the name
  GACHA_ART[name] = img.default || img;
}

export default GACHA_ART;
export const DEFAULT_ART = pomIcon;