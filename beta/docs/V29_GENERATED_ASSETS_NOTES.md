# Wikaru v29 — Generated Assets Match

Perubahan v29 memusatkan koreksi visual pada halaman kuis dan aset yang benar-benar dipakai oleh runtime.

- Maskot anjing laut kecil dipulihkan pada footer halaman kuis desktop, di sisi kanan bawah area **Cara Bermain**.
- Dekorasi footer tersebut tidak ditampilkan pada breakpoint iPad dan mobile.
- Enam belas Kotoba Marks dibuat ulang dari referensi dan disimpan sebagai WebP transparan di `assets/icons/generated-v29/`.
- Runtime ikon memakai elemen `<img>` dengan ukuran eksplisit, teks alternatif kosong untuk ikon dekoratif, dan fallback semantik yang tetap dibaca pembaca layar dari label kontrol.
- Cursor desktop dibuat ulang menjadi sprite PNG transparan delapan state yang konsisten dengan maskot utama.
- Cursor tetap nonaktif secara default dan tidak menggantikan cursor sistem pada perangkat sentuh.
- Semua entry point menggunakan versi `20260902-final33` dan service worker memakai cache `v32-home-preserved`.

Preview final tersedia di `output/previews/Wikaru_v29_Before_After.png`, `Wikaru_Icons_v29_Preview.png`, dan `Wikaru_Cursor_v29_Preview.png`.
