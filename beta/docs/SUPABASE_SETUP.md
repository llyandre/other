# Supabase untuk Wikaru

Wikaru telah memakai Supabase Authentication, PostgreSQL, dan Row Level Security (RLS). Konfigurasi browser memakai **Project URL** serta **Publishable Key**. Keduanya memang boleh berada di aplikasi publik; keamanan data ditentukan oleh autentikasi dan RLS.

Jangan pernah memasukkan `service_role`, secret key, password admin, access token, atau refresh token ke repository.

## Konfigurasi yang sudah dipakai

- Project URL: `https://aiystwombsmsbqbjflgb.supabase.co`
- Admin login: `lakssanavisch@gmail.com`
- Tabel hasil: `public.wikaru_quiz_results`
- Daftar admin: `public.wikaru_admins`
- Anonymous sign-in: harus aktif untuk peserta

Nilai publik tersebut berada di `assets/js/supabase-client.js` karena GitHub Pages tidak memiliki environment variable server-side.

## Instalasi database dari awal

1. Buka **Supabase Dashboard → SQL Editor**.
2. Salin seluruh isi `supabase/schema.sql`.
3. Klik **Run**. Pesan `Success. No rows returned` berarti schema berhasil diterapkan.
4. Buka **Authentication → Sign In / Providers → Anonymous** dan aktifkan anonymous sign-ins.
5. Buat akun admin pada **Authentication → Users** memakai email admin.
6. Salin UID akun tersebut, lalu jalankan query berikut dengan UID milik akun Anda:

```sql
insert into public.wikaru_admins (user_id, email)
values ('UID-ADMIN-DI-SINI', 'EMAIL-ADMIN-DI-SINI')
on conflict (user_id) do update set email = excluded.email;
```

7. Untuk memeriksa hasilnya dari SQL Editor:

```sql
select user_id, email, created_at
from public.wikaru_admins;
```

## Pengujian setelah deploy

1. Masuk sebagai peserta, selesaikan satu kuis, lalu tekan indikator Cloud. Uji tulis–baca–hapus harus berhasil.
2. Tutup dan buka kembali aplikasi. Riwayat peserta harus tetap tersedia.
3. Masuk sebagai pengelola dengan password akun Supabase. Panel pengelola harus dapat membaca hasil peserta.
4. Buka **Supabase → Table Editor → wikaru_quiz_results** dan pastikan hasil kuis muncul.

## Magic Link lintas perangkat

1. Buka **Authentication → URL Configuration**.
2. Isi **Site URL** dengan alamat GitHub Pages produksi.
3. Tambahkan alamat produksi yang sama ke **Redirect URLs**. Jika aplikasi berada di subfolder, sertakan path repository sampai garis miring terakhir.
4. Pastikan provider **Email** aktif.
5. Di Wikaru, buka menu profil lalu pilih akun lintas perangkat, masukkan email, dan kirim tautan masuk.

Tautan akan kembali ke halaman Wikaru dan sesi diselesaikan dengan alur PKCE. Jangan memasukkan access token atau refresh token secara manual.

## CAPTCHA untuk peserta anonim

1. Buat widget **Cloudflare Turnstile** untuk domain GitHub Pages.
2. Masukkan Site Key publik ke `assets/js/runtime-config.js` pada `turnstileSiteKey`.
3. Di Supabase, buka **Authentication → Bot and Abuse Protection**, aktifkan CAPTCHA, pilih Turnstile, lalu masukkan Secret Key di dashboard Supabase.
4. Deploy ulang dan uji login peserta anonim dari jendela privat.

Secret Key hanya boleh disimpan di Supabase. Jangan menaruh Secret Key di GitHub, HTML, JavaScript, atau file konfigurasi aplikasi.

Jika internet atau Supabase sedang tidak tersedia, Wikaru tetap menyimpan hasil secara lokal dan memasukkannya ke antrean sinkronisasi. Antrean dicoba kembali ketika koneksi pulih.

## Keamanan sebelum publikasi luas

- Aktifkan CAPTCHA untuk anonymous sign-ins di **Authentication → Bot and Abuse Protection**. Penambahan widget CAPTCHA ke aplikasi membutuhkan site key dari penyedia CAPTCHA.
- Gunakan password admin panjang dan unik serta aktifkan MFA untuk akun pengelola jika tersedia.
- Jangan menonaktifkan RLS dan jangan memberi akses tabel kepada role `anon`.
- Periksa **Authentication Logs** dan **Database Logs** secara berkala.
- Jika Publishable Key dirotasi, perbarui `publishableKey` pada `assets/js/supabase-client.js`, lalu deploy ulang.

## Data lama Firebase

Data lokal browser tetap dipertahankan. Data cloud lama yang hanya tersimpan di Firebase tidak dipindahkan otomatis; ekspor dan migrasi satu kali diperlukan bila riwayat tersebut masih dibutuhkan.
