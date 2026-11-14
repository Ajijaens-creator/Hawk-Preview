# HAWK HRD · F6 Human Growth & Kinerja · Laporan

DATA DEMO / SIMULASI. File: `hawk-live/hrd-f6-model.js` (global `HR6`) dan `hawk-live/hrd-f6.js` (layar). Formula XScore adalah simulasi (bobot demo Utility 50% / Produktivitas 30% / Learning 20%); formula resmi AJi Creator OS belum terverifikasi.

## Rute → NV
| NV | Rute | Sidebar |
|---|---|---|
| F6-NV01 Dashboard Human Growth | `#hrd-kpi` (`p=2610`/`2611`, `outlet=`) | Kinerja & KPI |
| F6-NV02 Stakeholder Expectations & SER | `#hrd-ser?id=EXP-…` | Stakeholder Expectations |
| F6-NV03 KPI Library | `#hrd-kpi-lib?id=MET-…` | KPI Library |
| F6-NV04 Kontrak KPI & Review Periode | `#hrd-kpi-contract?id=CTR-…` | Kontrak KPI |
| F6-NV05 XScore | `#hrd-xscore?emp=` | XScore |
| F6-NV06 People Performance & Profil Kompetensi | `#hrd-people-perf?outlet=&emp=` | People Performance |
| F6-NV07 9-Box Talent | `#hrd-ninebox?box=&emp=` | 9-Box Talent |
| F6-NV08 Rencana Pengembangan & Coaching | `#hrd-dev?id=PLAN-…` | Rencana Pengembangan |
| F6-NV09 Pelatihan, Kesiapan & Talent Pipeline | `#hrd-training?tab=prog/eff/qoh/pipe` | Pelatihan & Talent |

## Data demo yang saling tertaut
- SER 15 ekspektasi dari workbook (3 Executive Summary, 3 Collaboration Group, 9 Human Growth). Rasio salary hanya Manager HRD. Absenteeism: realisasi kosong, arah "perlu konfirmasi".
- KPI Library 19 metrik berversi (Therapist, Receptionist, HRD/HG, Executive, Finance, Production).
- Kontrak: CTR-2610-THR (ditutup), CTR-2611-THR (aktif), CTR-2611-UBD (tim), CTR-2612-RCP (draf, bobot 90%).
- XScore Oktober dari utility outlet F1 ± variasi per therapist, tamu aktual/target, jam pelatihan. Contoh: EMP-0004 learning kosong (cakupan 80%, provisional), EMP-0041 learning nol terverifikasi. November memakai jam POS F5 Minggu 46.
- Pelatihan: PRG-HOT-2611 (hadir vs praktik terpisah), PRG-HYG-2610, PRG-ONB-2611 (cohort otomatis dari karyawan baru F4).

## Alur yang teruji
1. Dashboard → filter Spa Ubud → kartu XScore → EMP-0001 → bukti utility membuka baris POS F5 → profil kompetensi → 9-Box (pindah kotak dengan alasan, validasi HG + Supervisor = Final) → Workplan coaching F3 (ulang = rencana sama) → bukti coaching tampil di profil.
2. Pelatihan → Supervisor meluluskan praktik → kompetensi Hot Stone & KPI Learning November memakai Evidence ID yang sama → definisi MET-TRAIN → efektivitas dengan cakupan verifikasi → QoH dengan 2 review tertunda.
3. SER (15) → Absenteeism belum terverifikasi → Staf HRD tidak melihat rasio salary → MET-UTIL v2 (kontrak aktif tetap v1) → kontrak 90% ditolak → bobot 100% → aktif → tutup periode (butuh konfirmasi bukti belum lengkap) → snapshot → therapist mengajukan koreksi → HG menerima.
4. Supervisor hanya Ubud; profil Shanti ditolak; Owner tanpa skor personal; Finance ditolak; filter bukti belum lengkap; Belum Dinilai dengan alasan; keyboard; mobile 390 px.

## Uji
- `node tests/hawk-live/hrd-f6-model.test.js`: 42/42.
- `node tests/hawk-live/hrd-f6.e2e.js`: 52/52.

## Status integrasi
Formula XScore resmi (AJi Creator OS): TO VERIFY. Data tamu/produktivitas: simulasi POS. Revenue & rasio biaya: Finance TO VERIFY (agregat dari F7). LMS: NEW INTEGRATION REQUIRED.

## Asumsi / perlu konfirmasi
- Bobot XScore therapist 50/30/20, target utility 85%, target learning 10 jam/bulan (November 4 jam karena periode berjalan).
- Band performa 9-Box: ≥ 90 tinggi, 75–90 menengah, < 75 rendah. Potensi dari asesmen HG (L/M/H).
- Skor dihitung dari bobot terukur saja bila ada bukti kosong; cakupan ditampilkan di samping skor.
- Owner tidak diberi skor personal (mengikuti HAWK Performance Brief).
- Absenteeism: definisi, arah, denominator menunggu keputusan (SER vs Race Vegen berbeda).
- Quality of Hire = proporsi review 90 hari "Baik" pada cohort Jul–Okt 2025.
