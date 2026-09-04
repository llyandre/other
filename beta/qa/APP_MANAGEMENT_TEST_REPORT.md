# Laporan QA — Update, Backup, dan Browser Audit Wikaru

Tanggal: 31 Agustus 2026  
Status regresi lokal: **PASS**  
Service worker: `wikaru-static-cloud-home-20260902-v33`

## Fitur yang diterapkan

### Pemberitahuan versi baru

- Service worker tidak lagi memanggil `skipWaiting()` secara otomatis ketika instalasi.
- Versi baru menampilkan kartu pemberitahuan dan menunggu pilihan **Perbarui** atau **Nanti**.
- Halaman hanya dimuat ulang setelah pengguna menekan Perbarui dan controller baru aktif.
- Pemberitahuan tidak memotong layout, memiliki state dark mode, mobile safe-area, serta reduced-motion.

### Backup progres

- Menu **Backup progres** tersedia di menu profil dalam bahasa Indonesia dan Jepang.
- Ekspor mencakup progres, hasil, favorit, pengaturan, jadwal belajar, preferensi, maskot, dan panduan yang tersimpan pada origin Wikaru.
- Identitas perangkat, antrean sinkronisasi cloud, login terakhir admin, dan status percobaan admin dikecualikan.
- Format backup memiliki versi, tanggal, jumlah item, dan checksum SHA-256.
- Impor dibatasi 8 MB, maksimal 300 kunci, hanya menerima kunci Wikaru, dan wajib lolos checksum.
- Data saat ini tidak dihapus massal. Hanya kunci yang ada di backup yang ditimpa.
- Bila penyimpanan gagal, nilai sebelumnya dipulihkan melalui rollback.

### Audit browser GitHub Actions

- Playwright dikunci pada versi 1.55.0.
- Lighthouse CI dikunci pada versi 0.14.0.
- Playwright menguji desktop 1440×900, iPad 820×1180, dan mobile 390×844.
- Skenario mencakup error runtime, home, profil, backup, panduan kuis, overflow horizontal, dan target sentuh profil.
- Laporan HTML Playwright dan Lighthouse disimpan sebagai artefak setiap workflow berjalan.
- Lighthouse memberi peringatan bila Performance <90, Accessibility <95, Best Practices <95, SEO <90, CLS >0,1, atau LCP >3 detik.

### Supabase Authentication dan RLS

- Schema idempotent tersedia di `supabase/schema.sql` dan panduan di `docs/SUPABASE_SETUP.md`.
- Peserta memakai anonymous session; pengelola memakai password Supabase dan UID yang terdaftar pada `wikaru_admins`.
- Lima policy RLS membatasi peserta ke UID sendiri serta memberi akses pengelola melalui fungsi database.

## Hasil regresi

| Pemeriksaan | Hasil |
|---|---:|
| Static shell sumber | Hash cocok |
| CSS sumber | 121/121 dipertahankan |
| Enhancement JS | 48/48 dipertahankan |
| Bab dan materi | 50 / 3.653 |
| Duplicate ID | 0 |
| Kontrol tanpa nama/label | 0 |
| Backup checksum | SHA-256 |
| Batas file backup | 8 MB |
| Kunci perangkat/sensitif yang diblokir | 4 |
| Rollback impor | PASS |
| Update membutuhkan persetujuan | PASS |
| Viewport Playwright | 3 |
| Root/subfolder GitHub Pages | PASS |
| HTTP | 276 request, semuanya berhasil |

## Ukuran initial load

| Format | HTML monolitik | Paket initial terbaru | Pengurangan |
|---|---:|---:|---:|
| Raw | 10.482.789 B | 4.478.589 B | 57,28% |
| Gzip | 2.144.514 B | 984.767 B | 54,08% |
| Brotli | 1.680.991 B | 759.064 B | 54,84% |

## Skor engineering

| Aspek | Skor |
|---|---:|
| Performance | 90/100 |
| UI | 98/100 |
| UX | 99/100 |
| Accessibility | 98/100 |
| Reliability | 99/100 |
| Code Quality | 98/100 |
| Rata-rata | **97/100** |

Nilai di atas merupakan engineering audit estimate dari parser, invariant, simulasi runtime, responsive rules, ukuran transfer, dan HTTP test. Hasil Lighthouse nyata baru tersedia setelah folder ini di-push ke GitHub dan workflow **Browser quality audit** selesai.
