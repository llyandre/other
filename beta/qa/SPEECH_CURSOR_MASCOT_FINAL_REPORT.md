# Laporan Final — Suara, Cursor, dan Maskot Wikaru

Tanggal: 31 Agustus 2026  
Status: **PASS**

## Perbaikan yang diterapkan

### Cursor desktop

- Batas lebar viewport 1181 px dihapus. Desktop berjendela sempit tetap memperoleh cursor selama browser mendeteksi mouse presisi.
- iPad, iPhone, dan Android touch-first tidak memakai custom cursor.
- Preferensi dipindahkan ke `wikaru_mascot_cursor_enabled_v2` dengan default aktif.
- Pointer browser baru disembunyikan setelah sprite SVG berhasil dimuat. Jika aset gagal, pointer asli tetap tersedia.
- Posisi sprite memakai nilai piksel eksplisit agar kompatibel dengan browser yang belum mendukung perkalian `calc()`.
- Simulasi runtime membuktikan cursor dibuat, terlihat setelah `pointermove`, mengikuti koordinat mouse, dan tetap mati pada iPad.

### Maskot

- `seal-question-approved.png` merupakan maskot tegak/melambai transparan dari desain halaman soal yang disetujui.
- Onboarding dan seluruh dialog `Cara bermain` memakai cutout tersebut.
- Semua gambar notifikasi maskot memakai `object-fit: contain`, sehingga tidak ada bagian karakter yang dipotong.
- Aset baru berukuran 21.904 byte, 640×640, WebP dengan alpha, dan tersedia offline.

### Jawaban suara

- Mode `Dengar & Tebak` dan `Shadowing` mengaktifkan mikrofon otomatis.
- Mikrofon berhenti selama audio contoh berjalan dan mulai 240 ms setelah audio selesai, sehingga suara speaker tidak dianggap sebagai jawaban pengguna.
- Fallback 4,2 detik tersedia untuk mesin TTS yang tidak mengirim event selesai.
- Recognition utama memakai `interimResults`, 10 alternatif, locale `ja-JP`/`id-ID`, JSGF grammar hint jika tersedia, serta pencocokan kana/romaji/arti yang toleran tetapi konservatif.
- Kuis kata kerja, angka, penanda waktu, durasi, dan counter juga memakai maksimal 10 alternatif. Perilaku auto-start lama tetap dipertahankan.

### Persona audio Jepang

| Persona | Karakter | Rate kosakata/contoh | Pitch |
|---|---|---:|---:|
| Hana Onee-san | Perempuan dewasa, lembut, hangat, keibuan | 0,84 / 0,89 | 0,96 |
| Momo Kawaii | Remaja Jepang ceria dan ekspresif | 0,96 / 1,01 | 1,12 |
| Ren Ikebo | Remaja Jepang tenang, cool, pendiam | 0,88 / 0,91 | 0,84 |
| Kaito Dandy | Pria dewasa matang, tenang, berat | 0,78 / 0,84 | 0,72 |

Sistem memprioritaskan voice `ja-JP`, lalu voice Natural/Neural/Enhanced dan nama voice yang paling cocok untuk setiap persona. Hasil akhir tetap bergantung pada voice Jepang yang terpasang di perangkat. GitHub Pages tidak dapat menyimpan kredensial neural TTS privat dengan aman; karena itu tidak diklaim bahwa semua perangkat akan menghasilkan suara identik.

## Hasil QA

| Pemeriksaan | Hasil |
|---|---:|
| Rangkaian QA | 20/20 PASS |
| Bab/materi/ID unik | 50 / 3.653 / 3.653 |
| Cursor runtime desktop | PASS |
| Cursor desktop <1181 px | PASS |
| Touch-first fallback | PASS |
| Maskot panduan transparan/tidak terpotong | PASS |
| Auto-mic listening/shadowing | PASS |
| TTS–microphone isolation | PASS |
| Speech alternatives | 10 |
| Voice persona | 4/4 |
| JavaScript syntax | PASS |
| Root/subfolder GitHub Pages | PASS |
| HTTP | 276/276 |
| Service worker | v30 |

## Batas verifikasi

Chromium lokal tidak terpasang pada runner ini, sehingga screenshot live dari build final tidak diklaim. Sebagai gantinya, cursor diuji melalui simulasi runtime DOM/mouse; alur suara diuji melalui invariant kode dan lifecycle event; seluruh aset dan path diuji lewat HTTP root serta subfolder GitHub Pages. Workflow browser di repository tetap menjadi pemeriksaan visual perangkat setelah push.
