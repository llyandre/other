# Wikaru v28 — Reference Match

## Perubahan utama

- Halaman kuis desktop, iPad, dan mobile dirapikan mengikuti komposisi referensi: header, progres, timer, kartu, pilihan suara, status, fungsi bicara, dan tombol jawaban.
- Maskot dekoratif tambahan di bawah halaman kuis dihapus. Maskot utama tetap satu kali di dalam kartu soal; maskot panduan dan notifikasi tetap fungsional.
- Cursor maskot menjadi opt-in agar tampilan desktop tidak ramai secara default.
- Enam belas Wikaru Kotoba Marks tetap menjadi sistem ikon utama.
- Aset Jembrana, Singaraja, dan Umum diganti dengan ilustrasi transparan yang mengikuti referensi; nilai grup dan kompatibilitas data lama tidak berubah.
- Copy mikrofon diseragamkan menjadi “Fungsi Bicara”. Status `aria-pressed` kini mengikuti keadaan sakelar aktual.
- Cache GitHub Pages dinaikkan ke `20260902-final33` / `v32-home-preserved`.

## Preview

- `output/previews/Wikaru_Quiz_Before.png`
- `output/previews/Wikaru_Quiz_After.png`
- `output/previews/Wikaru_Before_After_Comparison.png`
- `output/previews/Wikaru_Final_Assets_Production_Preview.png`

## Verifikasi

Seluruh QA lokal lulus, mencakup preservasi 3.653 materi, 50 bab, HTML/accessibility statis, responsive desktop/iPad/mobile, path root dan subfolder GitHub Pages, service worker/offline, ikon, wilayah, maskot, cursor, fitur suara, Supabase, PDF, dan learning hub.

## Deploy GitHub Pages

1. Ekstrak ZIP ke root repository.
2. Push seluruh file ke branch `main`.
3. Di GitHub pilih **Settings → Pages → GitHub Actions**.
4. Tunggu workflow QA dan deploy selesai.
