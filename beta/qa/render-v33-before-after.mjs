import fs from "node:fs/promises";
import path from "node:path";
import sharp from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs";

const root = path.resolve(import.meta.dirname, "..");
const previews = path.join(root, "output", "previews");
const beforeFile = path.join(previews, "Wikaru_v30_Quiz_After.png");
const afterFile = path.join(previews, "v33", "Wikaru_v33_Quiz_Final_Preview.jpg");
const outputFile = path.join(previews, "v33", "Wikaru_v30_vs_v33_Quiz_Before_After.jpg");

await Promise.all([fs.access(beforeFile), fs.access(afterFile)]);

const before = await sharp(beforeFile)
  .resize({ width: 820, height: 488, fit: "contain", background: "#F5F8FC" })
  .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
  .toBuffer();
const after = await sharp(afterFile)
  .resize({ width: 820, height: 488, fit: "contain", background: "#F5F8FC" })
  .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
  .toBuffer();

const beforeDetail = await sharp(beforeFile)
  .extract({ left: 820, top: 810, width: 330, height: 260 })
  .resize({ width: 520, height: 300, fit: "cover" })
  .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
  .toBuffer();
const afterDetail = await sharp(afterFile)
  .extract({ left: 820, top: 810, width: 330, height: 260 })
  .resize({ width: 520, height: 300, fit: "cover" })
  .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
  .toBuffer();

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
}[char]));
const label = (x, y, value, size = 22, fill = "#172747", anchor = "start") =>
  `<text x="${x}" y="${y}" font-family="'DejaVu Sans',Arial,sans-serif" font-size="${size}" font-weight="800" fill="${fill}" text-anchor="${anchor}">${esc(value)}</text>`;

const shell = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1120" viewBox="0 0 1800 1120">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F7F9FC"/><stop offset="1" stop-color="#EAF1FA"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#233E70" flood-opacity=".12"/></filter>
  </defs>
  <rect width="1800" height="1120" fill="url(#bg)"/>
  <rect x="42" y="30" width="1716" height="96" rx="26" fill="#fff" filter="url(#shadow)"/>
  <rect x="70" y="50" width="56" height="56" rx="18" fill="#284787"/>
  ${label(98, 89, "W", 30, "#FFF1C9", "middle")}
  ${label(150, 72, "Before vs After · Halaman Kuis Wikaru", 29)}
  ${label(150, 102, "Perbaikan utama: maskot desktop mengikuti crop referensi; iPad dan mobile tetap bersih.", 14, "#687791")}
  <rect x="42" y="152" width="852" height="560" rx="26" fill="#fff" filter="url(#shadow)"/>
  <rect x="906" y="152" width="852" height="560" rx="26" fill="#fff" filter="url(#shadow)"/>
  <rect x="62" y="172" width="156" height="40" rx="20" fill="#FFF0EE"/>
  ${label(140, 199, "SEBELUM · v30", 15, "#B33A35", "middle")}
  <rect x="926" y="172" width="160" height="40" rx="20" fill="#EAF5ED"/>
  ${label(1006, 199, "SESUDAH · v33", 15, "#367349", "middle")}
  ${label(450, 694, "Maskot keluar penuh dari panel desktop", 14, "#8A5960", "middle")}
  ${label(1332, 694, "Maskot mengintip rapi dari tepi panel", 14, "#47735A", "middle")}
  <rect x="126" y="758" width="608" height="326" rx="24" fill="#fff" filter="url(#shadow)"/>
  <rect x="1066" y="758" width="608" height="326" rx="24" fill="#fff" filter="url(#shadow)"/>
  ${label(430, 790, "Detail sebelum", 16, "#8A5960", "middle")}
  ${label(1370, 790, "Detail sesudah", 16, "#47735A", "middle")}
  <path d="M830 922h140m-28-28 28 28-28 28" fill="none" stroke="#284787" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  ${label(900, 1008, "crop sesuai referensi", 13, "#284787", "middle")}
</svg>`);

await sharp(shell)
  .composite([
    { input: before, left: 58, top: 218 },
    { input: after, left: 922, top: 218 },
    { input: beforeDetail, left: 170, top: 806 },
    { input: afterDetail, left: 1110, top: 806 }
  ])
  .flatten({ background: "#F3F7FC" })
  .jpeg({ quality: 93, chromaSubsampling: "4:4:4" })
  .toFile(outputFile);

console.log(JSON.stringify({ status: "PASS", outputFile }));
