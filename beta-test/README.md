# Wikaru — versi GitHub Pages

Versi ini adalah hasil pemisahan aplikasi monolitik menjadi aset statis yang lebih ringan. Tidak ada build step, server aplikasi, atau database lokal yang wajib dijalankan.

## Struktur penting

- `index.html` — shell aplikasi.
- `assets/css/app.css` — seluruh style aplikasi.
- `assets/js/app.js` — logika utama.
- `assets/js/data-loader.js` — lazy loader Bab 1–50.
- `data/bab-01.json` sampai `data/bab-50.json` — data per bab.
- `sw.js` — cache aset untuk kunjungan berikutnya.

## Menjalankan secara lokal

Karena data dimuat dengan `fetch()`, jangan membuka `index.html` memakai alamat `file://`. Jalankan web server sederhana dari folder ini:

```bash
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080`.

Jalankan pemeriksaan otomatis kapan pun data atau kode diubah:

```bash
node qa/validate.mjs
```

## Deploy ke GitHub Pages

1. Buat repository GitHub baru.
2. Upload seluruh isi folder ini ke root repository (jangan hanya `index.html`).
3. Buka **Settings → Pages**.
4. Pilih **GitHub Actions** sebagai source. Workflow `.github/workflows/deploy-pages.yml` akan memublikasikan aplikasi otomatis setiap push ke branch `main`.

Semua URL memakai path relatif, sehingga aplikasi tetap bekerja pada alamat berbentuk `https://username.github.io/nama-repository/`.

## Cara kerja optimasi Bab 1–50

- Saat aplikasi dibuka, hanya Bab 31 (default) dan bab terakhir yang dipilih pengguna yang dimuat.
- Pilihan rentang seperti Bab 1–50 menampilkan satu bab pada satu waktu lewat navigator bab.
- Kuis mengambil data bab tambahan hanya sampai jumlah soal yang diminta terpenuhi. Opsi "semua soal" memang akan memuat semua bab terpilih karena seluruh datanya benar-benar diperlukan.
- Data yang sudah dibuka disimpan dalam cache browser untuk kunjungan berikutnya.
