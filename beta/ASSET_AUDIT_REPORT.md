# WIKARU — ASSET AUDIT REPORT

Total asset diaudit: **212 file** di `assets/`.

## Folder audit wajib

- `/assets`: **ADA**
- `/images`: **TIDAK ADA**
- `/icons`: **TIDAK ADA**
- `/public`: **TIDAK ADA**
- `/src/assets`: **TIDAK ADA**

Project ini menggunakan folder `assets/` sebagai pusat asset; folder konvensional lain yang tidak ada tidak dibuat secara paksa agar struktur existing tetap terjaga.

## Ringkasan status

| Status | File | Total ukuran |
|---|---:|---:|
| EXPORT_VARIANT | 36 | 2.15 MB |
| MASTER_RETAINED | 11 | 13.44 MB |
| QA_ONLY_OR_SOURCE | 1 | 0.34 MB |
| RETAINED_UNRESOLVED | 42 | 0.31 MB |
| RUNTIME_CURRENT | 25 | 0.46 MB |
| RUNTIME_METADATA | 1 | 0.00 MB |
| SOURCE_RETAINED | 37 | 4.24 MB |
| USED_RUNTIME_OR_BUILD | 59 | 6.31 MB |

## Asset utama v39u1

- Maskot panduan: `assets/generated/seal-guide-clean-v39u1.png` — alpha/transparency dibersihkan, backplate legacy dinetralkan lewat CSS.
- Region: `assets/region-icons/` — Jembrana banteng, Singaraja lumba-lumba, Badung pura/tebing, Umum tiga orang; tersedia 128/64/32 px.
- Icon system: `assets/icons/wikaru/` — 16 mark, SVG + PNG 64/32; runtime memakai PNG 64 agar payload lebih kecil.
- Source lama 512 px dan master dipertahankan sebagai rollback/regeneration source; tidak dihapus tanpa bukti aman.

## Detail lengkap

Detail per file ada di `ASSET_AUDIT_REPORT.csv` dengan kolom: Nama file, Ukuran, Lokasi, Digunakan dimana, Status.
