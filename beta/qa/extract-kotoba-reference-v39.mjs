import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const modules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if (!modules) throw new Error("CODEX_PRIMARY_RUNTIME_NODE_MODULES is not available");
const sharp = require(path.join(modules, "sharp"));

const source = path.join(root, "qa/fixtures/kotoba-marks-reference.png");
const output = path.join(root, "assets/icons/kotoba-v39");
const icons = [
  ["identity", 70, 355, 125, 125],
  ["notes", 285, 350, 150, 135],
  ["hana", 495, 350, 150, 135],
  ["momo", 705, 352, 140, 128],
  ["ren", 915, 355, 140, 130],
  ["kaito", 1115, 350, 140, 135],
  ["statistics", 70, 575, 120, 120],
  ["understand", 290, 560, 120, 135],
  ["direction", 495, 570, 135, 125],
  ["shuffle", 690, 589, 145, 103],
  ["chapter", 880, 585, 125, 105],
  ["section", 1050, 593, 115, 107],
  ["word-type", 65, 812, 165, 95],
  ["speech", 295, 803, 155, 107],
  ["timer", 545, 803, 120, 107],
  ["guide", 745, 785, 145, 128]
];

function removeConnectedPaper(data, width, height, name) {
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const isPaper = pixel => {
    const offset = pixel * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    return r > 198 && g > 198 && b > 198;
  };
  const add = pixel => {
    if (seen[pixel] || !isPaper(pixel)) return;
    seen[pixel] = 1;
    queue[tail++] = pixel;
  };
  for (let x = 0; x < width; x += 1) {
    add(x);
    add((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    add(y * width);
    add(y * width + width - 1);
  }
  while (head < tail) {
    const pixel = queue[head++];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    if (x > 0) add(pixel - 1);
    if (x + 1 < width) add(pixel + 1);
    if (y > 0) add(pixel - width);
    if (y + 1 < height) add(pixel + width);
  }
  for (let pixel = 0; pixel < seen.length; pixel += 1) {
    if (!seen[pixel]) continue;
    const offset = pixel * 4;
    data[offset] = 0;
    data[offset + 1] = 0;
    data[offset + 2] = 0;
    data[offset + 3] = 0;
  }
  if (name === "guide" || name === "speech") {
    const clearWidth = name === "guide" ? 34 : 22;
    const clearHeight = name === "guide" ? 34 : 22;
    for (let y = 0; y < Math.min(clearHeight, height); y += 1) {
      for (let x = 0; x < Math.min(clearWidth, width); x += 1) {
        const offset = (y * width + x) * 4;
        data[offset] = 0;
        data[offset + 1] = 0;
        data[offset + 2] = 0;
        data[offset + 3] = 0;
      }
    }
  }
  return data;
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const [name, left, top, width, height] of icons) {
  const { data, info } = await sharp(source)
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const transparent = removeConnectedPaper(data, info.width, info.height, name);
  const png = await sharp(transparent, { raw: info })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 2 })
    .resize(440, 440, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: "lanczos3" })
    .extend({ top: 36, bottom: 36, left: 36, right: 36, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  fs.writeFileSync(path.join(output, `${name}.png`), png);
  const encoded = png.toString("base64");
  fs.writeFileSync(path.join(output, `${name}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-hidden="true"><image width="512" height="512" href="data:image/png;base64,${encoded}"/></svg>\n`);
}

fs.writeFileSync(path.join(output, "manifest.json"), JSON.stringify({
  family: "Wikaru Kotoba Marks",
  release: "v39",
  source: "qa/fixtures/kotoba-marks-reference.png",
  method: "reference-exact isolated render",
  size: 512,
  transparent: true,
  icons: icons.map(([name]) => name)
}, null, 2) + "\n");

console.log(`Rendered ${icons.length} exact reference icons into ${path.relative(root, output)}`);
