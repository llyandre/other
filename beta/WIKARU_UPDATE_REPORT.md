# WIKARU UPDATE REPORT — v39u1

Build marker: `20260903-v39u1`  
Target: audit → perbaikan asset → penyamaan desain referensi → optimasi → testing  
Project source: `Wikaru_Final_v39_GitHub_Pages(4).zip`

## Audit awal

- Arsitektur: static **HTML + CSS + vanilla JavaScript**, PWA/service worker, siap GitHub Pages.
- Integrasi data/auth: Supabase + local-first fallback.
- Build/QA: Node.js; `npm run build` menjalankan rangkaian QA project.
- Dependency NPM aplikasi: tidak ada dependency runtime eksternal di `package.json`; `npm install` mengaudit 1 package metadata dan 0 vulnerability.
- Folder asset aktif: `assets/`. Folder konvensional `/images`, `/icons`, `/public`, dan `/src/assets` tidak ada dan tidak dibuat secara paksa agar struktur existing tidak berubah.
- Backup penuh dibuat **sebelum edit** di working environment sebagai `Wikaru_Backup_Original`.
- Branding existing (navy/cream, typography, ilustrasi, mascot, struktur UX) dipertahankan. Tidak dilakukan redesign total.

## 1. Asset diperbaiki

- **Maskot anjing laut panduan kuis**: source existing terbukti memiliki alpha/transparency valid. Dibuat copy bersih `assets/generated/seal-guide-clean-v39u1.png`, pixel alpha sangat rendah dinormalisasi, dan CSS legacy backplate/pseudo-element dinetralkan agar tidak muncul kotak krem/artefak di belakang mascot.
- **Icon wilayah**: mapping dikunci sesuai referensi: Jembrana = banteng Bali, Singaraja = lumba-lumba, Badung = pura/tebing, Umum = tiga orang. Shell lingkaran/backplate lama dihilangkan dari tampilan produksi tanpa mengubah ilustrasi aslinya.
- **Icon system Wikaru**: 16 semantic marks dipindahkan ke canonical runtime path `assets/icons/wikaru/` dan dipakai pada kontrol yang sesuai.
- **Cache asset**: service worker/cache-busting dinaikkan ke `wikaru-static-v39u1-20260903` agar browser tidak terus menampilkan asset v39 lama.

## 2. Asset baru dibuat

- `assets/generated/seal-guide-clean-v39u1.png` — 512×512 RGBA transparan.
- `assets/region-icons/` — 12 PNG transparan: 4 region × 128/64/32 px.
- `assets/icons/wikaru/` — 16 SVG, 16 PNG 64 px, 16 PNG 32 px, plus `manifest.json`.
- SVG dipertahankan sebagai format export yang tersedia dari source reference; runtime sengaja memakai PNG 64 px yang lebih efisien.

## 3. Component / modul baru atau diperbarui

Karena project bukan React/Vue, tidak dibuat component framework baru yang menumpuk kode lama. Perubahan dilakukan pada modul existing:

- `question-page-final.js/css`: komposisi kuis referensi dipertahankan dan dihubungkan ke mascot clean.
- `wikaru-icons.js`: canonical 16-icon runtime 64 px.
- `quiz-guide.js`: semantic mapping icon Wikaru pada langkah petunjuk dan tip.
- `app.js` + `deploy-v35.js`: region renderer memakai responsive `src/srcset` 64/128 px.
- `sw.js` + `sw-v35.js` + `cache-reset-v35.js`: cache migration dan network-first untuk asset visual v39u1.
- `qa/test-reference-viewports-v39u1.mjs`: QA khusus target 1440 / 820 / 390 px.
- `qa/test-v39-visual-assets.mjs`: validator PNG dibuat dependency-free dengan Node `zlib`, sehingga tidak lagi bergantung pada environment `sharp` khusus.

## 4. File dihapus

- **Tidak ada source/master asset yang dihapus.** Audit menemukan beberapa source 512 px dan master yang tidak lagi menjadi runtime utama, tetapi masih berguna untuk rollback/regenerasi dan dokumentasi. Sesuai aturan “jangan menghapus sebelum pasti tidak digunakan”, semuanya dipertahankan.
- Tidak ada fitur existing yang dihapus.

## 5. Optimasi

- Runtime 16 icon berubah dari source PNG 512 px total ~1.58 MB menjadi PNG 64 px total ~0.09 MB: **sekitar 94.5% lebih ringan untuk family icon runtime**.
- Region source lama 512 px total ~0.55 MB; runtime kini dapat memilih 128 px (~0.064 MB total) atau 64 px (~0.023 MB total): **sekitar 88–96% lebih ringan tergantung density/viewport**.
- Maskot guide clean turun dari ~344 KB menjadi ~291 KB: **sekitar 15.4% lebih kecil**.
- Service worker hanya pre-cache variant visual yang benar-benar dibutuhkan runtime, bukan semua master/export.
- Cache lama diputus agar masalah “asset sudah diganti tetapi UI masih menampilkan versi lama” tidak berulang.

## 6. Testing

- `npm install`: **PASS**, 0 vulnerability.
- `npm run build`: **PASS**.
- Total rangkaian QA dalam build: **31 test scripts PASS**.
- Seluruh 20 file runtime JavaScript diperiksa dengan `node --check`: **PASS**.
- HTTP asset/routing smoke test: **446 request PASS**, mencakup root path dan GitHub Pages subfolder path.
- 50 bab / 3.653 item data tervalidasi, ID unik, parser HTML bersih, tidak ada duplicate ID, local path tidak hilang.
- Target responsive reference: **1440 desktop, 820 tablet, 390 mobile — PASS** melalui QA struktur/layout deterministik.
- 16 icon × PNG 64/32 + SVG, 4 region × 128/64/32, mascot guide, mascot expressions, dan 8 cursor diverifikasi dimensinya/transparency-nya.
- Browser Chromium di sandbox eksekusi ini memblokir navigasi `localhost` maupun `file://` dengan `ERR_BLOCKED_BY_ADMINISTRATOR`; karena itu screenshot/DevTools-console live tidak dijadikan kriteria PASS. Ini keterbatasan environment pengujian, bukan error project. Sebagai gantinya, syntax/runtime/static/HTTP QA dijalankan penuh.

## 7. Build result

**PASS — `npm run build` selesai dengan exit code 0.**

Release final:

- `version.json.release`: `v39u1`
- build: `20260903-v39u1`
- service worker cache: `wikaru-static-v39u1-20260903`
- GitHub Actions post-deploy verifier juga diperbaiki untuk mencari release `v39u1`, bukan `v39` lama.

## 8. Error ditemukan

- QA visual lama bergantung pada environment variable `CODEX_PRIMARY_RUNTIME_NODE_MODULES` + `sharp`, sehingga build normal gagal meski asset benar.
- Beberapa QA masih hard-code path/icon/release v39 lama.
- GitHub Actions post-deploy check masih mengharapkan `"release":"v39"` sehingga akan gagal setelah release dinaikkan ke `v39u1`.
- Runtime visual masih mempunyai jalur cache lama yang berpotensi membuat mascot/region terlihat belum ter-update.
- Runtime menggunakan PNG icon 512 px untuk kontrol kecil, menghasilkan transfer asset berlebihan.
- Region shell lama dapat memberikan tampilan badge/circle yang tidak sama dengan referensi terbuka/transparan.

## 9. Solusi

- Mengganti QA visual dengan PNG decoder berbasis Node `zlib`, tanpa dependency tambahan.
- Memigrasikan seluruh QA expectation ke canonical v39u1 asset paths.
- Memperbaiki GitHub Actions verification ke `v39u1`.
- Membersihkan mascot guide alpha + menambahkan CSS hard reset backplate.
- Membuat responsive region exports 128/64/32 dan `srcset` runtime.
- Membuat canonical 16-icon package SVG/64/32 dan memakai 64 px untuk runtime.
- Mengganti cache/service-worker release dan menerapkan network-first pada asset visual baru.
- Menjaga layout kuis referensi pada desktop/tablet/mobile tanpa membuat stack component duplikat.

## Asset Audit Report

Audit lengkap 212 asset tersedia di:

- `ASSET_AUDIT_REPORT.csv` — nama file, ukuran, lokasi, digunakan dimana, status.
- `ASSET_AUDIT_REPORT.md` — ringkasan folder/status asset.

## Kesimpulan

Project final mempertahankan branding dan fitur Wikaru, memakai asset visual sesuai referensi yang diberikan, memiliki icon/region runtime yang lebih ringan, mascot guide tanpa backplate legacy, layout kuis responsif 1440/820/390, cache release baru, dan **build penuh PASS**.
