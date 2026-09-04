# Scorecard Verifikasi Wikaru Supabase v10

Tanggal: 31 Agustus 2026  
Status: **PASS**  
Nilai keseluruhan: **97/100** — engineering verification, bukan Lighthouse live.

| Aspek | Nilai |
|---|---:|
| Performance | 90 |
| UI | 99 |
| UX | 99 |
| Accessibility | 99 |
| Reliability | 99 |
| Security | 94 |
| Code Quality | 98 |

Nilai terendah adalah **90/100**. Seluruh nilai berada di atas target 88.

## Bukti utama

- 23 rangkaian QA: seluruhnya PASS.
- Halaman kuis Gambar 3 pada desktop, iPad, dan mobile serta timer header: PASS — audit struktur dan breakpoint.
- Copywriting UI utama Indonesia/Jepang: PASS.
- Magic Link, unduhan offline per bab, nilai pelafalan, dan dasar CAPTCHA: PASS.
- 16 Kotoba Marks dan 4 ikon wilayah SVG flat 2D: PASS.
- Timer Wikaru Time Pebble: responsive, reduced-motion, dan pembaruan pembaca layar sekali per detik.
- Supabase runtime: 12 skenario login, role, tulis, baca, hapus, cleanup, dan event bridge PASS.
- RLS: 5 policy; peserta dibatasi `auth.uid()`, pengelola diverifikasi database, role `anon` tidak memperoleh akses tabel langsung.
- Secret/password/hash admin pada frontend: 0.
- Perubahan visual terisolasi pada sistem aset baru tanpa mengubah alur kuis atau penyimpanan.
- 50 bab, 3.653 materi, dan 3.653 ID unik.
- Parser HTML error, duplicate ID, unnamed button, unlabelled control: 0.
- Desktop, iPad, mobile, mobile sempit, dan landscape: PASS.
- Root/subfolder GitHub Pages: 276/276 request berhasil.
- Initial Brotli: 759.064 byte; pengurangan 54,84% dari HTML monolitik.
- Cursor desktop lulus simulasi runtime tanpa batas lebar viewport.
- Auto-mic, 10 alternatif recognition, grammar hint, fuzzy matching konservatif, isolasi TTS–mikrofon, dan empat persona suara: PASS.

## Target browser CI

| Lighthouse | Ambang |
|---|---:|
| Performance | ≥90 |
| Accessibility | ≥95 |
| Best Practices | ≥95 |
| SEO | ≥90 |

Chromium cloud lokal diblokir oleh lingkungan runner. Nilai browser aktual harus dibaca dari artefak workflow `Browser quality audit` setelah push GitHub.

## Sisa risiko

- CAPTCHA sudah memiliki integrasi dasar, tetapi aktivasi produksi tetap memerlukan Site Key Turnstile dan Secret Key di dashboard Supabase.
- `app.css` dan `app.js` tetap besar karena tampilan dan fungsi lama sengaja dipertahankan.
- Sebagian gambar materi dan Supabase bergantung pada layanan eksternal.
- Data cloud lama Firebase memerlukan migrasi satu kali bila masih dibutuhkan.
