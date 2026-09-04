# Laporan QA — Cursor Maskot dan Panduan Kuis Wikaru

Tanggal audit: 31 Agustus 2026  
Status: **PASS**  
Cache produksi terbaru: `wikaru-static-cloud-home-20260902-v33`

## Ruang lingkup

Pembaruan ini menambahkan cursor maskot khusus desktop, memperbaiki latar maskot pada panduan pengguna pertama, dan menambahkan instruksi first-use untuk seluruh keluarga kuis. Modul dibuat terisolasi dan tidak mengubah struktur halaman, data materi, perhitungan nilai, KKM, urutan soal, audio, penyimpanan, bahasa, tema, atau tampilan responsif yang sudah ada.

## Keputusan desain

- Delapan ekspresi cursor dipakai: normal, hover, klik, memuat, mengetik, berhasil, nonaktif, dan istirahat.
- Tidak ditambahkan ekspresi dekoratif lain. Delapan state sudah mencakup seluruh makna interaksi dan menjaga cursor tetap terbaca, ringan, serta tidak berubah tanpa alasan.
- Cursor aktif pada desktop yang memiliki mouse presisi (`any-hover:hover` dan `any-pointer:fine`) tanpa syarat lebar viewport. Deteksi OS touch-first tetap mencegah cursor mengganti pointer pada mobile/iPad.
- Preferensi memakai kunci v3 dengan default aktif, sehingga nilai lama yang pernah mematikan cursor karena bug path atau viewport tidak terbawa.
- Pointer asli baru disembunyikan setelah sprite berhasil dimuat; jika aset gagal, cursor browser tetap terlihat.
- Aset cursor adalah satu sprite SVG transparan 5.814 byte; tidak ada raster besar atau background kotak.
- Gerak cursor tidak memakai `setInterval`; pembaruan posisi digabungkan melalui `requestAnimationFrame`.
- Pengguna dapat mematikan cursor dari menu profil. Pilihan disimpan lokal.

## Pemulihan maskot dan panduan perangkat

Panduan onboarding, kartu soal, dan panduan kuis sekarang memakai `seal-question-approved.png`, yaitu maskot tegak/melambai transparan dari desain halaman soal yang disetujui. Karakter tidak lagi berada di dalam kotak latar dan seluruh gambar maskot memakai `object-fit: contain`, sehingga kepala, sirip, perut, dan ekor tidak terpotong. Tiga tangkapan layar perangkat tersedia untuk desktop, iPad, dan mobile.

Tombol `Cara bermain` tidak lagi memakai `position:fixed`. Tombol ditempatkan pada slot khusus di dalam halaman kuis sehingga tidak dapat menutup tombol jawaban, mikrofon, atau navigasi bawah.

## Panduan seluruh jenis kuis

Panduan tersedia dalam bahasa Indonesia dan Jepang untuk delapan keluarga kuis:

1. Belajar/flashcard.
2. Listening atau Dengar & Tebak.
3. Shadowing/pelafalan.
4. Speed quiz.
5. Angka.
6. Penanda waktu.
7. Durasi.
8. Counter/kata bantu bilangan.

Setiap panduan berisi tujuan singkat, tiga langkah, satu tip kontekstual, tombol batal, dan tombol mulai. Panduan muncul sebelum percobaan pertama untuk kombinasi pengguna dan jenis kuis, bukan setiap kali. Tombol bantuan tetap tersedia untuk membuka ulang panduan. Dialog memiliki focus trap, `Escape`, target sentuh 48 px, scroll aman, safe area mobile, dark mode, serta reduced-motion.

## Hasil regresi

| Pemeriksaan | Hasil |
|---|---:|
| Static HTML shell | Hash cocok |
| Blok CSS sumber | 121/121 dipertahankan |
| Enhancement JavaScript | 48/48 dipertahankan |
| Bab | 50/50 |
| Materi dan ID unik | 3.653/3.653 |
| Duplicate static ID | 0 |
| Tombol tanpa nama aksesibel | 0 |
| Form tanpa label | 0 |
| Ikon profil | 32/32 |
| Ekspresi cursor | 8/8 |
| Jenis panduan kuis | 8/8 |
| Cursor pada layar sentuh | Dinonaktifkan |
| Polling cursor | 0 interval |
| Desktop/iPad/mobile/layar sempit/landscape | PASS |
| Light/dark dan pergantian bahasa langsung | PASS |
| Kuis 5/10/20/50/semua | PASS |
| Audio, speech, riwayat, favorit, storage | PASS |
| Root dan subfolder GitHub Pages | PASS |
| HTTP paket produksi terbaru | 276 request, semuanya berhasil |
| Service worker v30 dan aset offline | PASS |
| Simulasi runtime mouse desktop | Cursor terlihat dan mengikuti pointer |
| Desktop dengan jendela <1181 px | PASS — cursor tetap aktif |
| Maskot panduan sama dengan desain awal | PASS |
| Screenshot asli per perangkat | 3/3 |
| Tombol bantuan menghalangi kontrol | 0 |

## Ukuran initial load

| Format | HTML monolitik | Paket initial | Pengurangan |
|---|---:|---:|---:|
| Raw | 10.482.789 B | 4.478.589 B | 57,28% |
| Gzip | 2.144.514 B | 984.767 B | 54,08% |
| Brotli | 1.680.991 B | 759.064 B | 54,84% |

Screenshot panduan menambah sekitar 60 KB terkompresi, tetapi hanya tiga aset kecil WebP dan seluruh bab selain bab awal tetap dimuat sesuai kebutuhan.

## Engineering audit estimate

Nilai berikut adalah audit teknik berbasis parser, invariant, ukuran transfer, simulasi runtime, responsive rules, accessibility statis, dan HTTP deployment. Nilai ini bukan hasil Lighthouse browser.

| Aspek | Skor | Dasar |
|---|---:|---|
| Performance | **90/100** | Initial Brotli 759 KB; sprite SVG kecil; tanpa polling; data bab tetap lazy |
| UI | **98/100** | Aset transparan konsisten, state cursor jelas, dialog responsif dan tidak memotong konten |
| UX | **98/100** | Panduan muncul sekali per pengguna/jenis kuis dan dapat dibuka ulang |
| Accessibility | **98/100** | Keyboard, focus trap, Escape, label, target 48 px, reduced motion, touch fallback |
| Reliability | **99/100** | Seluruh invariant, runtime cursor, 50 data bab, dan 276 request root/subfolder lulus |
| Code Quality | **97/100** | Modul terisolasi, cache versioned, validator khusus, tanpa interval cursor |

Rata-rata: **97/100**. Skor terendah: **90/100** pada Performance.

Skor 100 tidak diklaim karena CSS dan JavaScript warisan masih besar, beberapa gambar materi serta Supabase bergantung pada layanan luar, dan runner ini tidak menyediakan browser live yang dapat membuka alamat lokal. Pengujian final memakai parser, simulasi runtime, static responsive audit, serta server HTTP root/subfolder sebagai pengganti yang dapat direproduksi.

## Menjalankan ulang

```bash
npm test
node qa/measure.mjs '/path/to/Wikaru_Minna_Bab50_Final(2)(3)(1).html'
```

GitHub Actions menjalankan regresi sebelum deployment dan menghentikan publikasi bila validator gagal.
