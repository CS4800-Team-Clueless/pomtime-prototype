import pomIcon from "../../assets/icons/PomIcon.png";

const modules = import.meta.glob(
  "../../assets/gacha/characters/pomeranian/*.png",
  { eager: true }
);

const GACHA_ART = {};
for (const path in modules) {
  const img = modules[path];
  const name = path.split("/").pop().replace(".png", "");

  GACHA_ART[name] = img.default || img;
}

export default GACHA_ART;
export const DEFAULT_ART = pomIcon;
