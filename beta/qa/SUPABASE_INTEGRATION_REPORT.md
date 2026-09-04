# Laporan Integrasi Supabase

Tanggal: 31 Agustus 2026  
Status: **PASS**

## Arsitektur aktif

1. Peserta mengisi nama dan wilayah seperti sebelumnya.
2. Aplikasi membuat sesi anonim Supabase tanpa mengubah antarmuka.
3. Hasil kuis ditulis ke local storage dan antrean terlebih dahulu.
4. Hasil disinkronkan ke `public.wikaru_quiz_results` memakai UID peserta.
5. RLS hanya memperlihatkan baris milik UID tersebut.
6. Pengelola login dengan akun Supabase dan diverifikasi lewat `public.wikaru_admins`.
7. Jika cloud gagal, fungsi belajar tetap berjalan dan antrean dicoba kembali.

## Hasil kontrak runtime

| Skenario | Hasil |
|---|---:|
| Membuat sesi anonim | PASS |
| Menolak akses admin dari peserta | PASS |
| Menyimpan hasil | PASS |
| Membaca hasil peserta | PASS |
| Memisahkan identitas peserta | PASS |
| Health check | PASS |
| Round trip diagnostik | PASS |
| Menghapus diagnostik | PASS |
| Menolak password admin salah | PASS |
| Menerima admin valid | PASS |
| Membaca/menghapus hasil sebagai admin | PASS |
| Logout membersihkan sesi | PASS |

## Keamanan

- Password pengelola tidak disimpan di source atau local storage.
- Aplikasi hanya berisi Publishable Key, bukan secret key atau `service_role`.
- Hak admin tidak ditentukan oleh JavaScript; fungsi database memeriksa UID pada `wikaru_admins`.
- Tabel hasil memakai RLS dan FORCE RLS.
- Role `anon` tidak memperoleh hak langsung ke tabel.
- Upsert unik pada `(owner_id, local_id)` mencegah duplikasi ketika antrean diulang.
- Sesi pengelola lama dibersihkan ketika aplikasi dibuka tanpa sesi pengelola aktif.

CAPTCHA untuk anonymous sign-ins tetap direkomendasikan sebelum publikasi luas. Lihat `docs/SUPABASE_SETUP.md`.

