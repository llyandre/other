# Wikaru v39u1 — GitHub Pages

Build ini adalah aplikasi statis HTML/CSS/JavaScript yang siap ditempatkan di root repository GitHub Pages. Mesin login, Supabase, kuis, audio, progress, data 50 bab, PWA, dan routing internal dipertahankan.

## Perubahan visual v39

- Halaman kuis mengikuti komposisi referensi pada desktop 1440 px, iPad portrait 820 px, dan mobile 390 px.
- Kartu soal menampilkan hierarki Jepang, romaji, arti, badge arah, tombol dengarkan, dan maskot kecil di dalam area kartu.
- Panel suara memakai empat persona: Hana Onee-san, Momo Kawaii, Ren Ikebo, dan Kaito Dandy.
- Empat ilustrasi wilayah memakai source existing yang sama dan runtime responsif 128/64 px, dengan export 32 px di `assets/region-icons/`.
- Enam belas Wikaru Kotoba Marks tersedia sebagai SVG serta PNG transparan 64×64 dan 32×32 di `assets/icons/wikaru/`; runtime memakai PNG 64 px untuk mengurangi payload.
- Runtime, service worker, dan cache-busting memakai icon system `assets/icons/wikaru/`; source 512 px lama dipertahankan hanya untuk rollback/regenerasi.
- Keluarga maskot baru tersedia sebagai sembilan PNG transparan 512×512 di `assets/mascot/v38/`.
- Cursor maskot memiliki delapan ekspresi PNG transparan 56×56: normal, happy, hover, click, loading, typing, success, dan sleep.
- Cursor hanya aktif pada mouse/trackpad dengan `pointer: fine`; perangkat touch-first, ponsel, dan tablet memakai cursor/perilaku sistem.
- Header panduan memakai kolom maskot dan teks yang terpisah sehingga gambar tidak dapat menutupi judul.

## Menjalankan lokal

```bash
npm run dev
```

Buka `http://localhost:4173`. Jangan membuka `index.html` melalui `file://` karena data bab dimuat dengan `fetch()`.

## QA

```bash
npm test
```

Rangkaian QA memeriksa:

- parser HTML, duplicate ID, label kontrol, dan seluruh asset path;
- 50 bab dan 3.653 item unik;
- login Supabase, sesi, RLS, local-first fallback, dan tidak adanya secret frontend;
- quiz engine, TTS, mikrofon, empat persona, progress, history, dan favorite;
- breakpoint desktop/iPad/mobile serta fallback touch;
- 16 icon, sembilan maskot, delapan cursor, dan empat region PNG dengan alpha transparan;
- service worker/cache v39, root URL, dan subfolder GitHub Pages.

Laporan update terbaru tersedia di `WIKARU_UPDATE_REPORT.md`; audit asset lengkap ada di `ASSET_AUDIT_REPORT.csv`.

## Deploy GitHub Pages

1. Upload seluruh isi folder ini ke root repository.
2. Pilih **Settings → Pages → GitHub Actions**.
3. Push ke branch `main`; workflow menjalankan QA sebelum deploy.
4. Jika browser pernah membuka build lama, buka sekali `refresh-v35.html`. Nama file dipertahankan untuk kompatibilitas link lama, tetapi halaman tersebut memasang release v39u1.

Build marker: `20260903-v39u1`. Semua path asset bersifat relatif dan aman untuk `https://username.github.io/nama-repository/`.
