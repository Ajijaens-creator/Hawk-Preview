# Operational · A. Peta existing dan delta (A03 / A03.1)

Status: draft konsolidasi, 22 November 2026 WITA. Hanya baca kode; tidak ada perubahan backend, database, rumus produksi, merge atau deploy.

## Cara membaca tingkat bukti

| Kode | Arti | Cara diperiksa |
|---|---|---|
| **K** | Kode backend ada di `hawk-backend-erp` (FastAPI). Endpoint, model dan docstring analisa terbaca. | Baca `app/routers/*_controller.py` dan `app/main.py` di repo Hawk-RnD branch `develop` @24f0271. **Tidak dijalankan**: tidak ada database di sesi ini. |
| **P** | UI POS/ERP existing ada di `hawk-frontend-spa` (aplikasi yang dibuka lewat preview.jaens.id/rnd-demo). | Baca `src/routes/*.tsx`. Isi layar belum dibuka ulang, karena domain itu diblokir dari sesi cloud dan butuh login Owner. |
| **D** | UI demo di `hawk-erp-preview/hawk-live` (preview.hawk.jaens.id). Data fixture lokal di browser. | Kode dan uji e2e di repo. |
| **T** | Integrasi teruji end-to-end antara hawk-live dan backend. | **Belum ada satu pun.** |
| **X** | Tidak ditemukan di kode yang diperiksa. | Pencarian nama router, model dan kata kunci. Tidak ditemukan bukan berarti pasti tidak ada di tempat lain. |

Keputusan per baris:
- **REUSE**: pakai apa adanya.
- **EXTEND**: tambah field atau alur pada engine yang sama.
- **INTEGRATE**: buat adapter baca/tulis dari portal Operational ke engine existing.
- **BUILD**: entitas baru yang additive.

Total endpoint yang terdaftar di backend: 2.010 dari sekitar 150 modul router.

## Temuan utama

1. **Banyak kebutuhan A03 sudah punya engine di backend ERP.** Contohnya:
   - appointment dan gantt dengan pencarian terapis/ruang tersedia;
   - feedback per appointment dengan 13 skor, termasuk rata-rata 7P;
   - definisi occupancy dan therapist utilization berbasis waktu;
   - jadwal dan presensi;
   - stock count, adjustment, receiving, consumption, dan bahan per baris invoice treatment;
   - P&L per lokasi, budget variance, target revenue, dan task beserta unggah bukti.
2. **Preview Operational (hawk-live) belum terhubung ke engine itu.** Semua angka di sana masih fixture. Label "otomatis/sudah ada" di katalog lama hanya berarti engine-nya ada, bukan integrasinya. Katalog sudah dikoreksi di build ini.
3. **Yang belum ditemukan di kode:**
   - case Hospitality, checklist harian/5S/grooming, snapshot review online/Tripadvisor;
   - kontrak KPI STRACON/RACE/X-score;
   - readiness/cleaning ruang sebagai status, work order maintenance dengan timestamp;
   - register SOP dengan approval, dan instrumen assessment kompetensi.
4. **Definisi backend berbeda dengan sheet Looker:**
   - Occupancy backend = jam ruang terpakai ÷ (hari × jumlah ruang × jam kerja × 0,75).
   - Sheet 05 = revenue room ÷ "target" Rp.
   - Keduanya harus diberi nama berbeda. Faktor 0,75 butuh pengesahan.

## Matriks kebutuhan → existing

| # | Kebutuhan | Bukti existing (path / route / endpoint) | Bukti | Keputusan | Gap nyata | Fase |
|---|---|---|---|---|---|---|
| 1 | Booking, Appointment Book, availability | `POST /spa-appointment/save`, `GET /spa-appointment/get_all`, `/gantt-therapists`, `/available-therapists`, `/available-rooms`, `PUT /{id}/status`, `PUT /{id}/audit` (39 endpoint, `spa_appointment_controller.py`); UI `/appointment`, `/appointment/gantt-chart`, `/appointment/progress` | K, P | REUSE | Paritas isi POS belum dicek di layar (butuh login Owner). Operational hanya membaca; tidak ada kalender kedua. | F-OP03 |
| 2 | Invoice, pembayaran, revenue service/retail | `/spa-appointment/progress/invoice/*` (payment, discount, settle-ota, payment-link), `POST /spa-home/dashboard/revenue-real-time`, `/revenue-comparison`, `/transactions`, `/average-bill`, `GET /revenue-booked`, `GET /spa-finance/daily-report`; UI `/finance/daily-report`, `/report/payment-invoice` | K, P | INTEGRATE | Adapter baca untuk Revenue Overview. Definisi booked/billed/received dan refund/void disepakati dengan Finance. | F-OP10, F-OP09 |
| 3 | Target revenue per outlet/periode | `/spa-finance/parameter-target/*`, `POST /spa-finance/target-setting/get_data`/`save`, `POST /api/budgetmanager/get_budget_variance` | K | REUSE | Cek apakah distribusi musiman (tahun → bulan → minggu) sudah ada di target-setting. | F-OP09 |
| 4 | Profit & Loss | `POST /api/profitandlost/`, `POST /api/profitandlost/by-location`; UI `/accounts/report/profit-loss` | K, P | INTEGRATE | Bridge ke laba di workbook 02 (selisih belum dijelaskan Finance). Mapping akun → 7P berversi. | F-OP09 |
| 5 | Room occupancy | `POST /spa-home/dashboard/occupancy` (docstring: jam ruang terpakai ÷ hari × ruang × Σ work_hour × 0,75); master `/spa-room`, `/spa-roomtype`, `/spa-roomcategory`, `/spa-work-hour`, `/spa-blocktime-room`, `/spa-treatment-room/matrix` | K | REUSE | Dashboard memakai definisi waktu ini. Room revenue tetap metrik terpisah. Faktor 0,75 perlu disahkan. | F-OP06, F-OP10 |
| 6 | Therapist utilization, treatment per shift | `POST /spa-home/dashboard/therapist-util` (menit treatment status 5/6/7 ÷ terapis aktif × `hom_spa_target_hour`); `/spa-target-hour`, `/spa-employee-treatment/matrix` (skill), `/spa-employee-blocktime` | K | REUSE | Hapus estimasi demo 60 menit saat live. "Treatment per shift" dan "revenue per jam" ditambahkan sebagai metrik terpisah. | F-OP05 |
| 7 | Jadwal, presensi, absensi | `GET /api/employee/data_schedule`, `POST save_data_schedule`, `approve_schedule`, `GET data_attendance`, `POST save_attendance` (+overtime/potential), `/api/shift/*`; UI `/employee/schedule`, `/employee/attendance`; demo HRD F2 | K, P, D | REUSE | Absensi % = hari tidak hadir ÷ hari-orang terjadwal. Pemetaan alasan sakit/ijin perlu dicek ke `/spa-reason`. | F-OP05 |
| 8 | Feedback per kunjungan (7P) | `GET`/`PUT /spa-feedback/{spa_appointment_id}` (satu baris aktif per appointment+customer; 13 skor; rata-rata 7P dari 7 skor), `/spa-feedback/register`, `/customer-review`, `/guest-review-summary`, `/spa-customer/review-summary`; UI `/marketing/7p-feedback`, `/marketing/customer-review` | K, P | REUSE + EXTEND | Saat ini diisi staf dari gantt. Kanal tamu (QR/tautan) dan batas waktu perlu ditambah. Form feedback di hawk-live harus menjadi *read model*, bukan form kedua. | F-OP03, F-OP10 |
| 9 | Review online, Tripadvisor | — | X | BUILD | Entitas snapshot (platform, listing ID, waktu, rating, rank, bukti) atau konektor resmi. | F-OP07, F-OP10 |
| 10 | Customer, returning share, rebooking | `/spa-customer/customer-summary`, `/{id}/treatment-history`, `/{id}/marketing`, `/spa-customer-membership/*`; UI `/marketing/customer-summary`, `/marketing/guest-detail-report` | K, P | INTEGRATE | Definisi rebooking conversion (booking berikutnya dalam window) dan cohort belum ada. CRM Sales di hawk-live masih demo. | F-OP10 |
| 11 | Case Hospitality (keluhan, SLA, recovery) | `/spa-reason/*` hanya master alasan. Demo: Hospitality Case Workbench `#op-cases` (satu store dengan Issue Center; lihat OPERATIONAL-CASE-WORKBENCH.md) | X, D | BUILD | Satu `case_id` tertaut `spa_feedback_id`/appointment; event respons, eskalasi, selesai, verifikasi, reopen. | F-OP07 |
| 12 | Maintenance work order | `PUT /api/assetdepre/update_asset_maintenance`, `/api/groupasset/*` (register aset); `/spa-blocktime-room` untuk downtime ruang | K (sebagian), D | EXTEND + BUILD | Lifecycle work order bertimestamp belum ditemukan. Tautkan ke aset dan blocktime, bukan tiket analytics kedua. | F-OP06 |
| 13 | Readiness dan cleaning ruang | `/spa-blocktime-room`, `/spa-labelblockout`; demo Room & Facility (Ready/Occupied/Cleaning/Maintenance) | K (sebagian), D | BUILD | Status readiness dan event cleaning belum ada di backend. Availability tetap dihitung engine appointment. | F-OP06 |
| 14 | Penerimaan barang | `POST /api/received/add`, `/edit`, `POST /approve/{received_id}`, `GET /register`; demo #op-warehouse (Attendant terima → Supervisor verifikasi) | K, D | REUSE | Perlu dicek apakah `approve` langsung memposting stok. Kalau iya, langkah "verifikasi fisik" dipasang sebelum approve. | F-OP06 |
| 15 | Stock opname dan akurasi | `/api/invcount/*` (`product_by_location`, `register_count`, `invcount_adjustment_list`), `/api/invadjustment/*` + `approve/{id}`; UI `/inventory/transaction/count-inventory`, `/inventory/report/inventory-count-sheet` | K, P | REUSE | Rumus akurasi berbasis item atau nilai dihitung dari baris invcount. Tidak lagi rata-rata persen bulanan. | F-OP06, F-OP10 |
| 16 | Pemakaian BHP, waste | `/api/inventory-consumption/*` + `approve`, bahan per baris invoice `PUT`/`POST /spa-appointment/progress/invoice/{id}/ingredients`, `/api/invadjustment/*` | K | REUSE + EXTEND | Klasifikasi pemakaian normal, berlebih, rusak dan selisih opname. Nilai dari valuasi Inventory. Cegah konsumsi ganda standar vs aktual. | F-OP06 |
| 17 | Order BHP / MRF / PR | `/api/request-inventory/*` + `approve`, `/spa-purchase-request/*` (create-po), `/api/purchase-request/*`; demo Order Sederhana, NV-24 | K, D | REUSE | Adapter dari tombol Order di #op-warehouse. | F-OP06 |
| 18 | Saldo stok per outlet | `GET /api/inventory-summary-stock/list`; UI `/inventory/report/stock-alert` | K, P | INTEGRATE | Ganti fixture Gudang & Stok BHP dengan saldo ini. | F-OP06 |
| 19 | Tugas dan bukti | `/api/group-task/*`, `/api/task_action/*` (calendar, uploadfile), `/api/action-task/*`, `task_action_history` | K | EXTEND (perlu evaluasi) | Modul ini generik/proyek. Cocok tidaknya untuk tugas outlet harian dan action RACE perlu diuji. | F-OP04, F-OP05 |
| 20 | Checklist opening/closing/5S/grooming | — ; demo Daily Operations (checklist, Head review, Supervisor sign-off) | X, D | BUILD | Template berversi, jadwal ekspektasi dari roster, hasil per item (lulus/gagal/N/A). | F-OP04 |
| 21 | Kompetensi dan skill | `/spa-grade/*` (master grade), `/spa-employee-treatment/matrix` (terapis ↔ treatment) | K (sebagian) | EXTEND + BUILD | Matrix skill = applicability. Instrumen assessment per item dan per peran belum ada. | F-OP05 |
| 22 | Program Grading FO | `/api/project/*` (68 endpoint, termasuk RAB) | K (perlu evaluasi) | REUSE atau BUILD | Evaluasi apakah modul project cocok untuk tahapan, bobot dan bukti. Kalau tidak, buat template program kecil. | F-OP05 |
| 23 | Register SOP / bisnis proses | `/api/documenttype/*` (master jenis dokumen saja) | K (sebagian) | BUILD | Versi, approval dan tautan ke tugas yang menjalankannya. | F-OP04, F-OP10 |
| 24 | Master pegawai, outlet, struktur | `/api/employee/*` (51), `/api/location/*`, `/api/location-warehouse/*`, `department`, `job_position`, `divisi`; demo HRD F1 | K, D | REUSE | Pemetaan ID outlet demo (CTR/SHT/TRL/BSM) ke `location` asli. | F-OP01 |
| 25 | Akses, peran, delegasi | `/login-spa/*`, `/spa-role-fitur/matrix` + `toggle`, `/spa-employee-access/*`, `/api/transaction-approval/*`; demo Team & Access | K, D | REUSE + EXTEND | Bukti bahwa scope Supervisor satu outlet ditegakkan di server belum diuji. Konfigurasi verifikasi hybrid Head → Supervisor belum ada. | F-OP01 |
| 26 | STRACON, kontrak KPI, Daily/Weekly/R2RE/Reflection, X-score | — ; demo #op-race, HRD #hrd-race (Race Vegen, e-Deck), Sales "Ambidex & XRace" | X, D | BUILD | Kontrak berversi, cadence, action ID bersama, snapshot periode. | F-OP08 |
| 27 | Biaya People, komisi | `payroll_*`, `/spa-commission-detail/`, `/spa-coefficient/*` | K | REUSE (baca terbatas) | Response API untuk peran di bawah top management hanya persentase. Ekspor dan AI ikut dibatasi. | F-OP09 |
| 28 | HPP treatment | Bahan per invoice (#16), `build_item`/`build_item_report`, layanan avg price (`app/services`), komisi (#27) | K (sebagian) | INTEGRATE + BUILD | Snapshot biaya per treatment-varian-durasi, driver alokasi dan close period milik Finance. | F-OP09 |
| 29 | Communication Hub | — ; demo #op-communication | X, D | BUILD (keputusan) | Percakapan tertaut ke tugas, case, ruang dan KPI. Pengiriman WA tetap di luar scope. | F-OP07 |
| 30 | Dashboard Kinerja 14 laporan | demo #op-analytics (fixture), katalog "Satu sumber entri" | D | EXTEND | Adapter baca per laporan (#2–#18). Status bukti per metrik terlihat. | F-OP10 |
| 31 | Demo Experience Center | demo #ops-dx (11 skenario: 8 A02 + DX-OP09..11 A03) | D | EXTEND | Empat perjalanan A03 (lihat dokumen NB, bagian F). | F-OP11 |

## Yang tidak dibuktikan dokumen ini

- Endpoint belum dipanggil dan perilaku runtime belum diuji, termasuk izin, idempotency dan isi respons.
- Isi layar POS existing (preview.jaens.id/rnd-demo) belum dibuka ulang.
- Binding chart Looker belum dicocokkan per chart.
