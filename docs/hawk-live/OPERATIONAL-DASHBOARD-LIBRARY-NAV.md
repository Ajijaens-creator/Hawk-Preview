# Operational · Dashboard Library sebagai submenu sidebar (NP-OP01 UI Navigation Amendment)

Permintaan Owner (Aji, 23 Nov 2026). Lingkupnya hanya frontend UI/UX. Backend, database, API, rumus dan deployment tidak berubah.

## Yang berubah
| Sebelum | Sesudah |
|---|---|
| Sidebar memuat satu menu "Dashboard Kinerja". 14 laporan dipilih lewat panel krem di sisi kiri area konten. | "Dashboard Library" menjadi menu expandable di sidebar utama, dengan 14 dashboard sebagai submenu langsung. |
| Rute tunggal `#op-analytics`. | Satu rute per dashboard: `#op-analytics-<id>` (revenue, pnl, capacity, waste, reviews, satisfaction, retention, complaints, tripadvisor, maintenance, grading, competency, grooming, process). |
| Panel krem selebar 170–218 px. | Panel krem dihapus. Kartu KPI, diagram dan tabel memakai lebar penuh area konten. |

## Perilaku
- **Membuka dashboard.** Satu klik pada submenu membuka dashboard di area konten utama. Judul dan deskripsi dashboard tampil di header halaman.
- **Submenu aktif.** Ditandai dengan highlight gold sesuai HAWK Brand Guideline: teks champagne, garis gold di kiri dan `aria-current="page"`.
- **RBAC.** Sidebar hanya menampilkan dashboard yang lolos `OPX.analytics.canViewDashboard`. Hasil per akun demo:
  - Manager, Assistant, Hospitality dan Supervisor melihat 14 dashboard.
  - Reception melihat 7 dashboard.
  - Attendant melihat 3 dashboard.

  Supervisor tetap terkunci pada satu outlet. Membuka rute dashboard di luar akses memunculkan halaman "Tidak berwenang", bukan dashboard lain.
- **Fitur yang tetap.** Seluruh fitur halaman Dashboard Kinerja tetap bekerja seperti sebelumnya:
  - filter outlet dan periode, pilihan role;
  - tab Dashboard / Data & verifikasi, input data, verifikasi;
  - Sumber data, Standar, AI Insight per diagram, interaksi diagram, CSV demo.

  Filter periode tetap berlaku saat pindah submenu.
- **Kompatibilitas rute lama.** `#op-analytics` tetap berfungsi dan menandai submenu dashboard yang aktif. Navigasi internal, misalnya Pandu Saya atau `goPage('analytics')`, memakai rute submenu.
- **Mobile.** Sidebar terbuka sebagai drawer. Memilih submenu menutup drawer dan membuka dashboard. Ke-14 dashboard tampil tanpa scroll horizontal pada lebar 390 px.

## Implementasi
- `hawk-live/ops-shell.js` mengatur:
  - item sidebar dan rute `#op-analytics-<id>`;
  - RBAC sidebar di `syncNav`;
  - highlight submenu;
  - halaman penolakan;
  - `goPage` dan aksi `analytics-open`.
- `tools/ops-from-prototype.py` menghapus `<aside class="an-report-nav">` dari modul analytics yang di-generate.
- `hawk-live/ops-shell.css` mengatur grid satu kolom dan garis gold pada submenu aktif.
- Tes: `tests/hawk-live/ops-dashlib.e2e.js` berisi 25 pemeriksaan. Pemeriksaan sidebar di `ops-a02.e2e.js` sudah disesuaikan dengan amandemen ini.
