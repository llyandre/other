import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const modules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if (!modules) throw new Error("CODEX_PRIMARY_RUNTIME_NODE_MODULES is not available");
const sharp = require(path.join(modules, "sharp"));

const outputDir = path.join(root, "assets/mascot/v38");
const cursorDir = path.join(root, "assets/cursor/master-v38");
fs.mkdirSync(outputDir, { recursive: true });

const sources = {
  guide: path.join(cursorDir, "seal-cursor-normal-master.png"),
  welcome: path.join(cursorDir, "seal-cursor-happy-master.png"),
  "sad-week": path.join(root, "assets/mascot/master-v38/seal-sad-week-master.png"),
  "sad-month": path.join(root, "assets/mascot/master-v38/seal-sad-deep-master.png"),
  "sad-year": path.join(root, "assets/mascot/master-v38/seal-sad-deep-master.png"),
  "pass-kkm": path.join(cursorDir, "seal-cursor-success-master.png"),
  perfect: path.join(cursorDir, "seal-cursor-success-master.png"),
  streak: path.join(cursorDir, "seal-cursor-happy-master.png"),
  "rest-angry": path.join(root, "assets/mascot/master-v38/seal-rest-angry-master.png")
};

for (const [name, input] of Object.entries(sources)) {
  await sharp(input)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outputDir, `seal-${name}-v38.png`));
}

fs.writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify({
  family: "Wikaru Seal",
  release: "v38",
  size: 512,
  transparent: true,
  expressions: Object.keys(sources)
}, null, 2) + "\n");

console.log(`Rendered ${Object.keys(sources).length} transparent mascot assets in ${path.relative(root, outputDir)}`);
