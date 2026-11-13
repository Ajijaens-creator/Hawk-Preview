# HAWK HRD · F2 Operasi HRD & Direktori · Laporan

DATA DEMO / SIMULASI. Dibangun di atas F1 (dataset 158 orang yang sama, cakupan peran F1, audit F1). File: `hawk-live/hrd-f2-model.js` (model, global `HR2`, memperluas `HR.EXT`) dan `hawk-live/hrd-f2.js` (layar).

## Rute → NV
| NV | Rute | Sidebar |
|---|---|---|
| F2-NV01 Direktori Karyawan | `#hrd-roster` (+ `#hrd-employee-new`) | Karyawan |
| F2-NV02 Detail Karyawan | `#hrd-roster?emp=EMP-xxxx&dtab=pribadi/kontak/kepegawaian/dokumen/jadwal/ess` | dari Direktori |
| F2-NV03 Jadwal Kerja | `#hrd-schedule` | Kehadiran › Jadwal Kerja |
| F2-NV04 Presensi | `#hrd-presence?tab=daily/summary` | Kehadiran › Presensi |
| F2-NV05 Approval Presensi | `#hrd-att-approval` | Kehadiran › Approval Presensi |
| F2-NV06 Izin & Cuti | `#hrd-leave?tab=balance/request/calendar/history/policy` | Kehadiran › Izin & Cuti |
| F2-NV07 Approval | `#hrd-approval` (detail `?id=`) | Approval |
| F2-NV08 Kunjungan Klien | `#hrd-visit` | Kehadiran › Kunjungan Klien |
| F2-NV09 Pelacakan Lokasi | `#hrd-tracking` | Pelacakan Lokasi |
| F2-NV10 Klien | `#hrd-clients` | Klien |
| F2-NV11 Timeline | `#hrd-timeline` | Timeline |
| F2-NV12 Impor Karyawan | `#hrd-import?step=file/map/preview/result` | Karyawan › Impor Karyawan |

## Perilaku kunci
- Satu Request ID dibaca modul asal (Presensi/Izin & Cuti) dan inbox Approval. Approval bertingkat mengikuti kebijakan F1 (APR-LEAVE: Supervisor → Manager HRD; APR-ATT: Supervisor). Hanya PIC tahap aktif yang bisa memutuskan; keputusan final tidak bisa diulang.
- Koreksi presensi yang menunggu tampil provisional; nilai baru dipakai Harian dan Ringkasan setelah disetujui.
- Saldo cuti dari ledger: hanya pengajuan disetujui yang mengurangi saldo; pengajuan bertabrakan dan saldo kurang ditolak.
- Shift dan penempatan memakai tanggal efektif (minimal besok); jadwal/penempatan lama dipertahankan sampai sehari sebelumnya. Penugasan tambahan yang tumpang tindih ditolak dengan alasan.
- Impor: pemetaan kolom otomatis dari judul (koma atau titik koma), pratinjau validasi per baris, hasil per baris. Batch yang sama diimpor ulang = semua baris dilewati. Karyawan dengan tanggal mulai di masa depan tampil sebagai "akan bergabung" dan belum dihitung di total hari ini.
- Therapist ESS (izin `ess`) bisa membuka Presensi, Jadwal, Izin & Cuti, Approval dan Timeline untuk dirinya sendiri, termasuk mengajukan cuti.
- Peta pelacakan memakai koordinat sintetis tanpa layanan peta eksternal; titik di luar cakupan = akses ditolak; GPS tidak tersedia ditandai.

## Status integrasi
Mesin presensi/selfie dan GPS: NEW INTEGRATION REQUIRED (preview: UI-ONLY SIMULATION). Penyimpanan dokumen & tanda tangan: NEW INTEGRATION REQUIRED. Akun ESS HAWK: TO VERIFY.

## Uji
- `node tests/hawk-live/hrd-f2-model.test.js`: 22/22.
- `node tests/hawk-live/hrd-f2.e2e.js`: 45/45 (empat jalur review NB F2, akses ditolak, filter kosong, mobile 390 px, tanpa error console).
- Regresi: hrd-model 30, hrd-f1 e2e 42, model 104, browser 45, fase2 30, budget2027 20, design-lock 17.

## Asumsi
- Karyawan baru hasil impor masuk dengan status Probation dan THP awal posisi.
- Kunjungan klien dan klien adalah contoh untuk therapist home-service (GajiHub punya modul ini); perlu konfirmasi apakah JAENS memakai layanan kunjungan.
