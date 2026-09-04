# Checklist Produksi Wikaru v33

Paket ini sudah siap untuk GitHub Pages. Dua hal berikut membutuhkan data milik pemilik situs dan sengaja tidak diisi di dalam ZIP.

## 1. Aktifkan Cloudflare Turnstile

1. Buat widget Turnstile untuk domain produksi dan domain GitHub Pages.
2. Salin **Site Key** ke `assets/js/runtime-config.js` pada `turnstileSiteKey`.
3. Masukkan **Secret Key** hanya di dashboard Supabase pada pengaturan CAPTCHA. Jangan simpan Secret Key di GitHub.
4. Uji pembuatan akun anonim, Magic Link, pembatalan, token kedaluwarsa, dan koneksi lambat.

Tanpa Site Key, aplikasi tetap berjalan dan menampilkan status “Siap isi”; perlindungan CAPTCHA belum aktif.

## 2. Hubungkan custom domain

1. Tambahkan custom domain dari Settings → Pages di repository GitHub.
2. Atur DNS sesuai petunjuk GitHub Pages.
3. Setelah HTTPS aktif, isi `productionOrigin` pada `assets/js/runtime-config.js`, misalnya `https://belajar.example.id`.
4. Ganti nilai Open Graph/Twitter image menjadi URL absolut bila platform sosial yang digunakan tidak menerima URL relatif.
5. Aktifkan **Enforce HTTPS**.

## 3. Pemeriksaan rilis

- Jalankan `npm test` sebelum mengunggah.
- Pastikan service worker berganti ke cache `wikaru-static-github-deploy-v36`.
- Uji tombol **Pasang aplikasi Wikaru** di Chrome/Edge dan **Tambahkan ke Layar Utama** di Safari iOS.
- Uji paket offline minimal pada satu bab, lalu buka kembali saat jaringan dimatikan.
- Jalankan pengujian keyboard: skip link, tab belajar, modal, menu profil, dan fokus kembali setelah modal ditutup.
- Lakukan pembacaan manual dengan NVDA/VoiceOver sebelum peluncuran publik.

## 4. Privasi

Diagnostik v33 bersifat `local-only`: tidak ada analitik pihak ketiga dan tidak ada data yang dikirim otomatis. Ekspor diagnostik hanya terjadi setelah pengguna menekan tombol ekspor. Nama peserta, jawaban, email, dan kata sandi tidak disertakan.
