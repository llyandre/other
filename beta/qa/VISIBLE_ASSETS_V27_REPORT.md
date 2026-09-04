# Wikaru Visible Assets v27 — Final Verification

Tanggal verifikasi: 1 September 2026

## Akar masalah yang ditemukan

Preview terdahulu tidak membuktikan implementasi karena dirender dari komposisi terpisah. Di runtime aktif, halaman soal dan panduan masih memanggil `seal-guide-original.webp`, yaitu maskot rebah lama. Selain itu, URL CSS/JavaScript tidak mempunyai versi build sehingga service worker GitHub Pages dapat terus menyajikan aset lama.

## Perbaikan produksi

- Maskot soal, maskot panduan kuis, dan maskot onboarding sekarang memakai `assets/mascot/seal-question-approved.png`.
- Aset baru diekstrak persis dari konsep halaman soal yang disetujui, memiliki latar transparan, berukuran 224×228 px, dan tidak terpotong.
- Tidak ada kode halaman aktif yang masih memanggil maskot rebah lama.
- Semua CSS dan JavaScript pada `index.html` memakai versi `20260902-final33`.
- Sprite cursor, 16 Kotoba Marks, dan empat ikon wilayah memakai versi aset yang sama.
- Service worker dinaikkan ke `v32-home-preserved` dan melayani URL versioned secara aman.
- Cursor mendeteksi mouse utama maupun mouse presisi sekunder, tetap tidak menggantikan pointer pada iPad/mobile, dan aktif secara default kecuali dimatikan pengguna.

## Hasil pengujian

- Seluruh 23 berkas pengujian: PASS.
- Validator utama: PASS.
- 50 bab dan 3.653 materi unik: PASS.
- JavaScript, CSS, HTML parser, path root, dan subfolder GitHub Pages: PASS.
- Duplicate ID, tombol tanpa nama, dan kontrol tanpa label: 0.
- Empat ikon wilayah terhubung ke alur login: PASS.
- Enam belas Kotoba Marks terhubung ke kontrol semantik: PASS.
- Delapan state cursor: PASS.
- Timer kuis pada desktop, iPad, dan mobile: PASS.
- Maskot tegak transparan pada soal dan panduan: PASS.
- Referensi aktif ke maskot rebah lama: 0.
- Migrasi cache aset lama: PASS.

Preview di `output/previews/` merupakan render dari aset produksi dalam paket ini. Preview tersebut bukan tangkapan layar browser live. Tangkapan layar live baru dapat dibuat setelah paket ini diunggah ke GitHub Pages dan URL publik tersedia.
