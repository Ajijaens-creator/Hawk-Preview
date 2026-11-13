# HAWK HRD · F5 Manpower Planning & POS · Laporan

DATA DEMO / SIMULASI. File: `hawk-live/hrd-f5-model.js` (global `HR5`) dan `hawk-live/hrd-f5.js` (layar). Baris layanan POS dibangkitkan deterministik dari fixture mingguan (tidak disimpan). Yang disimpan hanya batch replay, refund, koreksi, skenario dan handoff.

## Rute → NV
| NV | Rute | Sidebar |
|---|---|---|
| F5-NV01 Dashboard Manpower | `#hrd-manpower` (periode `p=W46` / `p=2610`) | Manpower Planning |
| F5-NV02 Kapasitas Outlet & Shift | `#hrd-mp-capacity?outlet=&shift=` | Kapasitas Outlet & Shift |
| F5-NV03 Therapist Utility | `#hrd-mp-utility?outlet=` | Therapist Utility |
| F5-NV04 Coverage Reception | `#hrd-mp-reception` | Coverage Reception |
| F5-NV05 Beban Kerja Divisi Office | `#hrd-mp-division` | Beban Kerja Office |
| F5-NV06 Data Layanan POS | `#hrd-mp-pos?outlet=&shift=&emp=&tx=&line=` | Data Layanan POS |
| F5-NV07 Simulasi Kebutuhan & Temuan | `#hrd-mp-sim?outlet=` / `?id=SIM-…` | Simulasi Kebutuhan |
| F5-NV08 Handoff Rekrutmen | `#hrd-mp-handoff?id=` | Handoff Rekrutmen |

## Angka demo (Minggu 46, 7–13 Nov 2026, provisional)
| Outlet | Pagi | Sore | Total | Status |
|---|---|---|---|---|
| Spa Ubud | 216/200 = 108% | 198/190 | 414/390 = 106,2% | Di atas kapasitas (lembur 10 jam + bantuan Santi 6 jam, 23 booking gagal) |
| Spa Santi | 140/200 = 70% (Pantau) | 118/190 | 258/390 = 66,2% | Di bawah 70% (14 batal) |
| Spa Triloka | 172/200 | 156/190 | 84,1% | Sehat |
| Spa Bhisma | 158/200 | 146/190 | 77,9% | Sehat |

Oktober 2026 (ditutup) memakai angka Beranda F1: 25 therapist × 8 jam × 26 hari = 5200 jam penyebut.

## Alur yang teruji
Dashboard → klik Spa Ubud → Kapasitas → klik shift Pagi (anggota + 2 therapist bantuan dari Spa Santi) → Utility (216 ÷ 200 = 108%, kelebihan 16 jam = lembur 10 + bantuan 6) → klik pembilang → baris POS (Transaction ID, Service Line ID, Four Hands dua baris) → refund (utility tetap) → koreksi durasi (pembilang turun, audit sebelum/sesudah) → replay batch (0 baris baru) → Simulasi 3 opsi → simpan skenario formasi → Tandai Issue (kartu F3 yang sama dengan tombol di Utility/Beranda) → Staf HRD tidak bisa menyetujui → Manager HRD setuju → Handoff ke F4 (retry tidak menggandakan) → permintaan F4 membawa sumber, Task ID, outlet, formasi, tanggal butuh → progres posisi terbuka 2. Santi: temuan TSK-0002 yang sudah ada ditampilkan (tanpa kartu ganda), naik ke Issue di Planner, status sama tampil di Utility. Reception: hanya Ubud & Bhisma Sore 17–21 kurang coverage. Divisi: Production "data belum lengkap", PC & Commercial "headcount belum ditetapkan".

## Uji
- `node tests/hawk-live/hrd-f5-model.test.js`: 34/34.
- `node tests/hawk-live/hrd-f5.e2e.js`: 45/45 (empat jalur review NB F5, periode Oktober, akses Supervisor/Finance/Therapist, mobile 390 px).

## Status integrasi
POS (baris layanan, refund, koreksi, batch): UI-ONLY SIMULATION; endpoint produksi NEW INTEGRATION REQUIRED. Data divisi Finance & Production: TO VERIFY. Reservasi/check-in reception: simulasi.

## Asumsi / perlu konfirmasi
- Kapasitas reguler mingguan per shift (200/190 jam) adalah sampel dummy sesuai contoh NB (216 vs 200). Rumus produksi: jam bookable terjadwal setelah istirahat, cuti dan jam tidak tersedia — perlu definisi resmi dari Operational.
- Ambang Pantau 70–75% dan 95–100% (NB menyebut 70% dan 100% sebagai batas; lebar pita Pantau adalah pilihan preview).
- Pembagian shift Oktober diestimasi 52/48 karena data Oktober hanya tingkat outlet.
- Target reception 6 check-in per staf per jam dan tunggu ≤ 10 menit.
- Simulasi formasi: 7 jam bookable × 6 hari × ramp-up 80% per therapist baru; booking gagal dihitung 1,5 jam permintaan.
- Refund tidak mengurangi jam treatment (layanan tetap dilakukan); komisi dikoreksi di F7.
