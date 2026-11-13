# HAWK HRD · F4 Rekrutmen sampai Penempatan · Laporan

DATA DEMO / SIMULASI. File: `hawk-live/hrd-f4-model.js` (global `HR4`), `hawk-live/hrd-f4-career.js` (renderer halaman karier publik), `hawk-live/hrd-f4.js` (layar internal), `hawk-live/karier.html` + `karier.js` (halaman publik tanpa login internal), offline `preview-karier.html`.

## Rute → NV
| NV | Rute | Sidebar |
|---|---|---|
| F4-NV01 Landing Karier | publik `karier.html`; pratinjau `#hrd-rec-profile` | Rekrutmen › Profil · Karier |
| F4-NV02 Detail Lowongan | `karier.html#job=VAC-…&ch=IG`; `#hrd-career-job?id=` | dari Landing / Lowongan |
| F4-NV03 Formulir Lamaran | `karier.html#apply=VAC-…`; `#hrd-career-apply?id=` | dari Detail |
| F4-NV04 Permintaan Tenaga & Kelola Lowongan | `#hrd-rec-manage`, `#hrd-rec-jobs` | Manajemen Rekrutmen, Lowongan Pekerjaan |
| F4-NV05 Pipeline Kandidat | `#hrd-rec-candidates`, `#hrd-recruit` | Rekrutmen, Kandidat |
| F4-NV06 Detail Kandidat & AI Screening | `#hrd-rec-candidates?id=APP-…` | dari Pipeline |
| F4-NV07 Jadwal Interview | `#hrd-rec-schedule` | Jadwal Interview |
| F4-NV08 Interview & Uji Praktik | `#hrd-rec-interview` | Interview & Praktik |
| F4-NV09 Keputusan & Penawaran | `#hrd-rec-offer` | Keputusan & Penawaran |
| F4-NV10 Kontrak & Verifikasi Dokumen | `#hrd-rec-contract` | Kontrak & Dokumen |
| F4-NV11 Onboarding HRD & HG | `#hrd-rec-onboard` | Onboarding |
| F4-NV12 Penempatan, Akun & Role | `#hrd-rec-place` | Penempatan & Akun |

## Alur yang teruji
Permintaan Therapist Spa Ubud (Operational Manager → Manager HRD) → publikasi lowongan (formasi & outlet disetujui) → halaman publik (kanal IG) → formulir Therapist (tinjau sebelum kirim, lampiran divalidasi, retry tidak menggandakan) → pipeline → AI screening simulasi (bukti per kriteria; foto/KTP/tulisan tangan/kepribadian dikecualikan; gagal + retry) → kartu klarifikasi F3 (satu kartu) → shortlist → interview (bentrok ditolak, jadwal ulang & sinkron ulang memakai Event ID sama) → rubric praktik → keputusan (perubahan tercatat) → penawaran → kontrak (verifikasi KTP/foto, tanda tangan simulasi) → Employee ID F2 → paket onboarding F3 (HRD/HG/Supervisor, tidak ganda) → penempatan & akun ESS → roster Spa Ubud 31, audit tercatat.

## Uji
- `node tests/hawk-live/hrd-f4-model.test.js`: 31/31.
- `node tests/hawk-live/hrd-f4.e2e.js`: 50/50 (empat jalur NB F4, Receptionist, akses ditolak, filter kosong, mobile 390 px internal & publik).

## Status integrasi
AI screening, Google Calendar/Meet, email/WA konfirmasi, penyimpanan dokumen & e-sign: simulasi (NEW INTEGRATION REQUIRED). Provisioning akun HAWK: TO VERIFY. QR pada preview adalah pola visual, bukan QR yang bisa dipindai; QR publik butuh domain karier.

## Asumsi / perlu konfirmasi
- Domain karier publik (mis. karier.jaens.id) dan kanal (WEB/IG/QR/REF/WA).
- Kapasitas shortlist = 3 kandidat per formasi.
- Approval permintaan: Operational Manager/Manager divisi → Manager HRD (Owner tidak diwajibkan pada preview).
- Template onboarding yang sama untuk semua posisi (TPL-ONB); posisi Office mungkin perlu template sendiri.
