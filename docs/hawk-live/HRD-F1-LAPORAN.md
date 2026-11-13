# HAWK HRD · F1 Fondasi dan Beranda · Laporan

Portal kelima HAWK ERP (HRD & Human Growth). DATA DEMO / SIMULASI. Desain dikunci ke `assets/css/hawk.css` (sama dengan preview.hawk.jaens.id, mis. NV-38).

## Membuka
- Source: `hawk-live/hrd.html`, atau pilih **HRD** dari logo HAWK di `hawk-live/index.html`. Butuh server statis: `python3 -m http.server 8811`.
- Offline satu file: `hawk-live/preview-hrd.html`.

## Rute → NV
| NV | Rute | Sidebar |
|---|---|---|
| F1-NV01 Beranda HRD | `#hrd-home` | Beranda |
| F1-NV02 Struktur Organisasi | `#hrd-org?node=…` | Pengaturan › Struktur Organisasi |
| F1-NV03 Roster & Penempatan | `#hrd-roster`, detail `#hrd-roster?emp=EMP-xxxx` | Karyawan |
| F1-NV04 Akun, Role & Akses | `#hrd-access` | Pengaturan › Akun, Role & Akses |
| F1-NV05 Pengaturan Perusahaan | `#hrd-company?tab=identity/calendar/approval/numbering/templates/catalog` | Pengaturan › Pengaturan Perusahaan |
| F1-NV06 Pengaturan Sistem | `#hrd-system?tab=notifications/integrations/tasks/faq`, `#hrd-faq` | Pengaturan › Pengaturan Sistem, FAQ |
| F1-NV07 Audit Aktivitas | `#hrd-audit`, detail `#hrd-audit?id=AUD-xxxx` | Pengaturan › Audit Aktivitas |
| F1-NV08 Kelola Data Demo R&D | `#hrd-demo` | Pengaturan › Kelola Data Demo R&D |

Sidebar mengikuti urutan GajiHub (`reference-hrd/hrd-rnd/REFERENSI.md`, `menu.js`): Beranda sampai FAQ, lalu tambahan HAWK (Kinerja & KPI, AmbideX & Race, Manpower Planning, 9-Box Talent, People Budgeting). Menu F2–F8 menampilkan status fase dan akses. Layar F1 yang tidak punya entri GajiHub ditempatkan sebagai submenu Pengaturan.

## File
- `hawk-live/hrd-model.js`: organisasi (ID outlet sama dengan SER/POS), fixture 158 orang, penempatan efektif dan histori, atasan, akun, peran/izin/cakupan, pengaturan, audit, dataset demo.
- `hawk-live/hrd.js`: layar NV01–NV08, sidebar, akses ditolak.
- `hawk-live/reference-hrd/`: paket NB-HRD dan preview R&D dari Owner (13 Nov 2026), disimpan apa adanya.

## Peran demo
Manager HRD (payroll detail, ubah pengaturan/akses, hapus dummy) · Staf HRD (roster dan operasional, tanpa payroll/laporan/template export) · Human Growth Lead · Operational Manager (Divisi Operational) · Supervisor Spa Ubud (tim Ubud) · Therapist ESS (data sendiri, F2) · Finance Manager dan role non-HRD (akses ditolak).

## Asumsi yang perlu dikonfirmasi
- Empat Supervisor Outlet + OM + AOM + 2 staf = 8 Operations di Office. Karena itu filter Spa Ubud = 30 (25 Therapist + 5 Receptionist), sesuai kriteria.
- Akun role demo memakai nama tim HAWK yang sudah ada (Made Gunarsa, Eni Restini, Tika, Mila, Tina, Dewik, Wahyudi, Asri); lainnya nama samaran.
- Nama outlet mengikuti NB (Spa Ubud/Santi/Triloka/Bhisma) dengan ID yang sama seperti SER (Jaens Spa Center/Shanti/Triloka/Bisma).
- Status integrasi: Org/akun HAWK, POS, Finance, GajiHub = TO VERIFY; Google Calendar/Meet, dokumen & tanda tangan, BPJS/PPh/Coretax = NEW INTEGRATION REQUIRED; Task Planner dan notifikasi = UI-ONLY SIMULATION.

## Uji
- `node tests/hawk-live/hrd-model.test.js`: 30/30 (rekonsiliasi 158, Ubud 30, Bhisma Receptionist 5, cakupan peran, audit sebelum/sesudah, hapus dummy menjaga record non-demo).
- `node tests/hawk-live/hrd-f1.e2e.js`: 42/42 (urutan review NB F1, akses langsung, batal/simpan, mobile 390 px, tanpa error console).
- Uji empat portal tetap lulus: model 104, browser 45, fase2 30, budget2027 20, design-lock 17.
