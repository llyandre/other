import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const modules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if (!modules) throw new Error("CODEX_PRIMARY_RUNTIME_NODE_MODULES is not available");
const sharp = require(path.join(modules, "sharp"));
const states = ["normal", "happy", "hover", "click", "loading", "typing", "success", "sleep"];
const masterDir = path.join(root, "assets/cursor/master-v38");
const outputDir = path.join(root, "assets/cursor");

function clearNearTransparentPixels(data) {
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 8) {
      data[index] = 0;
      data[index + 1] = 0;
      data[index + 2] = 0;
      data[index + 3] = 0;
    }
  }
  return data;
}

for (const state of states) {
  const input = path.join(masterDir, `seal-cursor-${state}-master.png`);
  if (!fs.existsSync(input)) throw new Error(`Missing cursor master: ${input}`);
  const { data, info } = await sharp(input)
    .resize(56, 56, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  await sharp(clearNearTransparentPixels(data), { raw: info })
    .png()
    .toFile(path.join(outputDir, `seal-cursor-${state}-v38.png`));
}

console.log(`Rendered ${states.length} transparent 56×56 desktop cursor assets`);
