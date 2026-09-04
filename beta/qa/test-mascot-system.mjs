import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const html = read("index.html");
const css = read("assets/css/mascot.css");
const js = read("assets/js/mascot.js");
const app = read("assets/js/app.js");
const sw = read("sw.js");

const assets = [
  "seal-welcome-v38.png",
  "seal-sad-week-v38.png",
  "seal-sad-month-v38.png",
  "seal-sad-year-v38.png",
  "seal-pass-kkm-v38.png",
  "seal-perfect-v38.png",
  "seal-streak-v38.png",
  "seal-rest-angry-v38.png"
];

assert(html.includes('./assets/css/mascot.css'), "Stylesheet maskot belum dimuat");
assert(html.includes('./assets/js/mascot.js'), "Modul maskot belum dimuat");
assert(/id="mascotGuideBtn"/.test(html), "Tombol membuka ulang panduan hilang");
assert(/id="mascotEyeReminderBtn"[^>]+role="menuitemcheckbox"[^>]+aria-checked="false"/.test(html), "Kontrol pengingat mata opsional hilang");
assert((app.match(/wikaru:quiz-finished/g) || []).length >= 2, "Semua jalur hasil kuis belum mengirim event maskot");

for (const name of assets) {
  const relative = `assets/mascot/v38/${name}`;
  const absolute = path.join(root, relative);
  assert(fs.existsSync(absolute), `Aset maskot hilang: ${name}`);
  const size = fs.statSync(absolute).size;
  assert(size > 2000 && size < 400000, `Ukuran aset tidak wajar: ${name}`);
  const bytes=fs.readFileSync(absolute);
  assert(bytes.subarray(1,4).toString()==="PNG"&&bytes.readUInt32BE(16)===512&&bytes.readUInt32BE(20)===512&&bytes[25]===6,`Maskot bukan PNG transparan 512px: ${name}`);
}
assert(sw.includes("MASCOT_EXPRESSIONS")&&sw.includes("assets/mascot/v38/seal-${expression}-v38.png"),"Service worker belum menyimpan keluarga maskot v38");

assert(/CLOSE_DELAY_MS\s*=\s*5000/.test(js), "Kunci penutupan 5 detik berubah");
assert(/wk-mascot-close[^`]+disabled/s.test(js), "Tombol tutup tidak terkunci saat notifikasi muncul");
assert(!/setTimeout\([^)]*close\s*\(/s.test(js), "Notifikasi tidak boleh ditutup otomatis");
assert(/TWENTY_MINUTES_MS\s*=\s*20\s*\*\s*60\s*\*\s*1000/.test(js), "Interval 20-20-20 berubah");
assert(/ONE_HOUR_MS\s*=\s*60\s*\*\s*60\s*\*\s*1000/.test(js), "Pengingat satu jam berubah");
assert(/TWO_HOURS_MS\s*=\s*2\s*\*\s*60\s*\*\s*60\s*\*\s*1000/.test(js), "Pengingat dua jam berubah");
assert(/Tinggalkan layar selama 5 menit/.test(js) && /画面から5分離れましょう/.test(js), "Pesan jeda lima menit belum bilingual");
assert(/minimal 10 menit/.test(js) && /少なくとも10分間/.test(js), "Pesan jeda sepuluh menit belum bilingual");
assert(/Aturan 20-20-20/.test(js) && /20-20-20ルール/.test(js), "Pesan 20-20-20 belum bilingual");
assert(/refreshActiveNoticeLanguage/.test(js) && /MutationObserver\(syncLanguage\)/.test(js), "Notifikasi aktif belum mengikuti pergantian bahasa");
assert(/eyeReminderEnabled/.test(js) && /aria-checked/.test(js), "Pengingat mata belum dapat diaktifkan secara opsional");
assert(/elapsedDays\s*>=\s*365/.test(js) && /elapsedDays\s*>=\s*30/.test(js) && /elapsedDays\s*>=\s*7/.test(js), "Ambang rindu 1 minggu/1 bulan/1 tahun tidak lengkap");
assert(/\[365,\s*100,\s*60,\s*30,\s*14,\s*7,\s*3\]/.test(js), "Milestone streak tidak lengkap");
assert(/score\s*===\s*100/.test(js), "Pemicu nilai sempurna hilang");
assert(/kkmStatus/.test(js), "Pemicu lulus KKM hilang");
assert(/visibilityState\s*===\s*"visible"/.test(js), "Timer istirahat harus menghitung tab aktif saja");
assert(/onboarding_completed/.test(js), "Status onboarding sekali tampil hilang");
assert(/spotlight/.test(js) && /Sorotan berikutnya menunjukkan bagian asli Wikaru/.test(js), "Panduan tampilan asli belum lengkap");
for(const preview of ["wikaru-desktop.webp","wikaru-ipad.webp","wikaru-mobile.webp"]){
  assert(fs.existsSync(path.join(root,"assets/onboarding",preview)),`Screenshot panduan asli hilang: ${preview}`);
  assert(sw.includes(`assets/onboarding/${preview}`),`Screenshot panduan belum tersedia offline: ${preview}`);
}
assert(/aria-modal/.test(js) && /trapGuideFocus/.test(js), "Aksesibilitas dialog panduan tidak lengkap");
assert(/@media \(min-width:768px\) and \(max-width:1180px\)/.test(css), "Layout iPad maskot hilang");
assert(/@media \(max-width:767px\)/.test(css), "Layout mobile maskot hilang");
assert(/prefers-reduced-motion:reduce/.test(css), "Reduced motion maskot hilang");
assert(/safe-area-inset-bottom/.test(css), "Safe area maskot hilang");
assert(js.includes('GUIDE_ASSET = "./assets/generated/seal-guide-clean-v39u1.png?v=20260903-v39u1"'), "Panduan awal belum memakai maskot transparan v38");
assert(/\.wk-mascot-art img\s*\{[^}]*object-fit:contain/s.test(css), "Gambar ekspresi maskot masih dapat terpotong");
assert(sw.includes("wikaru-static-v39u1-20260903"), "Versi cache maskot, cursor, voice, dan continuity belum dinaikkan");

console.log("Mascot system: PASS — 8 ekspresi, 9 kelompok pemicu, jeda 1/2 jam, opsi 20-20-20, sinkron bahasa langsung, kunci manual 5 detik, dan cache offline terverifikasi.");
