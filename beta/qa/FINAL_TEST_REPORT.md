# Laporan QA Final — Wikaru v32 Home-Preserved

Tanggal audit: 1 September 2026  
Sumber: `Wikaru_Minna_Bab50_Final(2)(3)(1).html`  
SHA-256 sumber: `fe362a27d0b72fdea673c841a3c9c81a116d3d5dd5353b4b0a7376fee6995dc1`

## Kesimpulan

Status: **PASS**. Data, logika kuis, penilaian, penyimpanan, bahasa, tema, dan alur belajar tetap dipertahankan. Halaman kuis mengikuti komposisi Gambar 3 pada desktop, iPad, dan mobile; timer berada di header. Enam belas ikon `Wikaru Kotoba Marks` dari Gambar 1, empat ikon wilayah Gambar 2, cursor maskot, dan cutout maskot transparan telah diterapkan. Mode listening dan shadowing tetap menyalakan mikrofon otomatis setelah audio contoh selesai; speech recognition memakai 10 alternatif, grammar hint, serta pencocokan toleran konservatif.

Seluruh **26 rangkaian QA** lulus. Pengujian meliputi parser dan syntax, kunci hash beranda v30, 50 data bab, copywriting UI Indonesia/Jepang, layout halaman kuis, polish profesional non-beranda, Magic Link, unduhan offline, skor pelafalan, dasar CAPTCHA, simulasi runtime Supabase, RLS statis, fungsi kuis, responsive layout, motion, profil, wilayah, Kotoba Marks dan timer, maskot, cursor statis dan simulasi runtime, persona suara statis dan simulasi TTS, laporan PDF, backup, pusat belajar, dan HTTP root/subfolder GitHub Pages.

## Verifikasi Supabase

| Pemeriksaan | Hasil |
|---|---:|
| Project URL dan Publishable Key | PASS |
| Secret/service-role pada frontend | 0 |
| Peserta anonymous sign-in | PASS — simulasi runtime |
| Login pengelola dengan password Supabase | PASS — simulasi runtime |
| Verifikasi UID pengelola melalui database | PASS |
| Tulis/baca/hapus hasil | PASS |
| Diagnostic round trip dan cleanup | PASS |
| Penyimpanan lokal sebelum sinkronisasi | PASS |
| Antrean ketika cloud gagal | PASS |
| Logout dan pembersihan sesi pengelola | PASS |
| RLS peserta berdasarkan `auth.uid()` | PASS |
| Policy pengelola melalui `is_wikaru_admin()` | PASS |
| Hak langsung role `anon` | Dicabut |
| Jumlah policy RLS | 5 |

Catatan: simulasi runtime memakai implementasi klien asli dengan backend Supabase tiruan yang ketat agar hasil dapat direproduksi tanpa menulis data produksi. Setup dashboard telah dilakukan pemilik proyek. Uji koneksi produksi akhir tetap tersedia lewat tombol indikator Cloud setelah GitHub Pages dideploy.

## Preservasi tampilan dan fungsi

| Pemeriksaan | Hasil |
|---|---:|
| File visual baru/berubah | 9 — Kotoba Marks, wilayah, dan timer yang disetujui |
| Kotoba Marks | 16/16, SVG flat 2D |
| Ikon wilayah baru | 4/4, SVG flat 2D |
| Blok CSS sumber | 121/121 |
| Blok enhancement | 48/48 dengan adaptasi cloud yang disetujui |
| Struktur beranda baseline v30 | PASS — hash terkunci |
| Selector beranda pada CSS profesional | 0 |
| Halaman inti | 4/4 |
| Desktop bermouse presisi pada lebar apa pun | PASS |
| iPad 768–1180 px | PASS |
| Mobile ≤767 px | PASS |
| Mobile sempit ≤389 px | PASS |
| Landscape pendek | PASS |
| Overflow kuis/modal | PASS |
| Light/dark dan reduced motion | PASS |
| Profil mobile dan area aman avatar | PASS |
| Audio, speech, tema, bahasa, favorit, riwayat | PASS |
| Auto-mic listening/shadowing setelah audio | PASS |
| Persona suara Jepang Hana/Momo/Ren/Kaito | PASS |
| Pilihan soal 5/10/20/50/semua | PASS |

## Integritas data dan aksesibilitas

| Pemeriksaan | Hasil |
|---|---:|
| Bab | 50/50 |
| Materi | 3.653/3.653 |
| ID materi unik | 3.653 |
| Aset tertanam | 9/9, hash cocok |
| HTML parser error | 0 |
| Duplicate static ID | 0 |
| Tombol tanpa nama | 0 |
| Form tanpa label | 0 |
| Tombol tanpa `type` | 0 |
| Gambar tanpa `alt` | 0 |
| Link tab baru tanpa `noopener` | 0 |

## Deployment dan cache

| Pemeriksaan | Hasil |
|---|---:|
| Root domain | PASS |
| Subfolder GitHub Pages | PASS |
| HTTP request | 284/284 berhasil |
| Service worker | `wikaru-static-cloud-home-20260902-v33` |
| Screenshot panduan desktop/iPad/mobile | 3/3 tersedia offline |
| Klien Supabase dalam cache shell | PASS |
| Workflow QA sebelum deploy | PASS — konfigurasi |
| Playwright viewport | Desktop, iPad, mobile |
| Target Lighthouse minimum | Performance 90, Accessibility 95, Best Practices 95, SEO 90 |

Browser cloud menolak alamat lokal dengan `ERR_BLOCKED_BY_CLIENT`. Karena itu angka Lighthouse tidak diklaim sebagai hasil live runner ini. Workflow `Browser quality audit` akan menjalankan Chromium, Playwright, dan Lighthouse pada GitHub Actions setelah push.

## Ukuran initial load

| Format | HTML monolitik | Paket initial | Pengurangan |
|---|---:|---:|---:|
| Raw | 10.482.789 B | 4.478.589 B | 57,28% |
| Gzip | 2.144.514 B | 984.767 B | 54,08% |
| Brotli | 1.680.991 B | 759.064 B | 54,84% |

Initial load menghitung shell, CSS/JS, klien Supabase, manifest, referensi, maskot yang dipakai, dan Bab 31. Bab lain serta avatar yang belum dipakai tetap dimuat sesuai kebutuhan.

## Engineering verification score

Nilai berikut merupakan audit teknik berbasis bukti otomatis, bukan hasil Lighthouse langsung.

| Aspek | Skor | Dasar |
|---|---:|---|
| Performance | **90/100** | Initial Brotli 759 KB termasuk screenshot dan cutout maskot; data bab tetap lazy |
| UI | **99/100** | Beranda terkunci, halaman non-beranda dipoles, halaman kuis Gambar 3, 16 Kotoba Marks, 4 wilayah, timer header, dan seluruh breakpoint lulus audit statis |
| UX | **99/100** | Cursor runtime, petunjuk, Magic Link, offline bab, nilai pelafalan, auto-mic, dan isolasi TTS–mikrofon lulus |
| Accessibility | **99/100** | 0 kontrol tanpa nama/label; timer tidak mengumumkan nilai berulang |
| Reliability | **99/100** | 50 bab, 3.653 ID, 26 rangkaian QA, dan 284 request lulus |
| Security | **94/100** | Supabase Auth + 5 policy RLS; tanpa password/secret frontend; CAPTCHA masih perlu diaktifkan sebelum publikasi luas |
| Code Quality | **98/100** | Aset semantik terisolasi, satu observer tanpa polling, schema idempotent, cache versioned |

Rata-rata: **97/100**. Skor terendah: **90/100**.

## Batas klaim dan tindakan pemilik

- Dasar CAPTCHA dan pemuatan Turnstile telah tersedia. Aktifkan konfigurasi final dengan Site Key publik di `assets/js/runtime-config.js` dan Secret Key hanya di dashboard Supabase.
- Data lokal browser tetap dipertahankan. Riwayat yang hanya berada di Firebase lama tidak berpindah otomatis.
- Publishable Key boleh berada di aplikasi GitHub Pages. Secret key, `service_role`, password, dan token tidak boleh dimasukkan ke repository.
- Setelah deploy, klik indikator Cloud sekali sebagai uji produksi tulis–baca–hapus, lalu login pengelola dan pastikan hasil peserta muncul.

## Menjalankan ulang

```bash
npm test
node qa/measure.mjs '../upload/Wikaru_Minna_Bab50_Final(2)(3)(1).html'
```

GitHub Actions menjalankan QA sebelum deployment dan menyimpan laporan Playwright/Lighthouse sebagai artefak.
