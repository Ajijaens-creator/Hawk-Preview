# HAWK HRD · F8 AmbideX, Reporting & Reflection · Laporan

DATA DEMO / SIMULASI (R&D). File: `hawk-live/hrd-f8-model.js` (global `HR8`) dan `hawk-live/hrd-f8.js` (layar). Skor Race, metrik workbook, snapshot dan laporan sintetis. Metrik yang punya sumber di F4–F7 dibaca langsung (utility F5, rekrutmen F4/F5, readiness & pelatihan F6, rasio biaya F7); metrik lain memakai fixture workbook berlabel "Workbook SER/Race (fixture)".

## Rute → NV
| NV | Rute | Sidebar |
|---|---|---|
| F8-NV01 Race Vegen | `#hrd-race?ind=IND-…&tab=ver` | AmbideX & Race |
| F8-NV02 Race Beacon & Success Factors | `#hrd-race-beacon?id=BCN-…&tab=sf` | Race Beacon |
| F8-NV03 Daily Race | `#hrd-race-daily?emp=` | Daily Race |
| F8-NV04 Weekly Race | `#hrd-race-weekly?ws=HRD/HG` | Weekly Race |
| F8-NV05 Monthly Reflection | `#hrd-race-reflection?period=2610/2611&sec=` | Monthly Reflection |
| F8-NV06 STRACON | `#hrd-race-stracon?id=DEC-…` / `?new=1&ckey=&task=&finding=` | STRACON |
| F8-NV07 e-Deck Reflection HRD | `#hrd-race-deck?period=&scope=&page=0–7&snap=SNP-…` | e-Deck Reflection |
| F8-NV08 Pusat Laporan & Jejak Bukti | `#hrd-report-center?id=RPT-…&ev=&period=&unit=&outlet=` | Pusat Laporan & Bukti |

## Isi utama
- Race RACE-HG-2611 v1: 6 indikator 20/10/20/20/20/10. Versi baru dibuat sebagai draf. Draf hanya bisa diaktifkan bila total bobot tepat 100%, dan versi lama diarsipkan dengan definisi utuh.
- Skor Race dihitung sebagai Σ bobot × capaian ÷ bobot terukur. Capaian dibatasi 100%, dan arah "max" memakai target ÷ aktual. Data yang belum tersedia ditandai gap, bukan dihitung nol.
- Beacon BCN-CTR-2611 v1 berbobot 15/25/25/20/15 dengan kontrak tersendiri. Setiap Beacon menaut ke indikator induk dan ke Task ID F3. Rubric Success Factors RF v1 punya 6 kriteria berskala 1–4, dan wajib diisi alasan serta bukti.
- Daily dan Weekly Race membaca kartu, peristiwa dan My Day dari F3, sehingga Task ID-nya sama. Waktu selesai dan waktu verifikasi tampil sebagai dua field berbeda. Pekerjaan terbawa menampilkan tenggat asal yang diambil dari histori. Tindakan berikutnya otomatis menjadi Workplan F3 dengan PIC dan tenggat.
- Monthly Reflection merekonsiliasi:
  - utility dari F5 (Oktober = Beranda F1, November = Minggu 46)
  - XScore, pelatihan, readiness dan SER dari F6
  - posisi terbuka dari F4/F5
  - biaya dari batch F7 periode yang sama (khusus Manager HRD)

  Temuan bisa ditandai Ide, Issue atau Workplan, dan menandai ulang membuka kartu yang sama. Untuk utility, kartunya sama dengan temuan F5 (Santi → TSK-0002).
- STRACON menyimpan keputusan beserta alternatif, alasan, pemilik, tenggat dan kriteria evaluasi. Dari keputusan bisa dibuat Workplan (sekali saja). Evaluasi membandingkan hasil periode terkait dengan kriteria yang dicatat saat keputusan dibuat. Seed: DEC-2610-001 (shift split Santi) dievaluasi pada November dan belum tercapai.
- e-Deck punya 8 halaman dengan periode dan scope yang konsisten, dan setiap angka bisa diklik sampai ke sumber atau bukti. Snapshot menyimpan versi metrik, versi Race, scope, periode, kelengkapan dan tanda sensitif. Koreksi menghasilkan versi -v2 yang merujuk v1, sementara v1 tetap tidak berubah. Ekspor snapshot sensitif ditolak untuk selain Manager HRD, dan hak akses diperiksa ulang setiap kali dibuka.
- Pusat Laporan menelusuri laporan → versi formula → perhitungan → bukti → sumber → tanggal pembaruan → tindak lanjut. Status yang tersedia: Lengkap, Provisional, Bukti kosong (Absenteeism), Kedaluwarsa (Exit Interview), Dikoreksi, dan Akses ditolak (payroll). Refresh berulang hanya menambah hitungan refresh, tanpa menggandakan baris atau kartu. Kegagalan sumber bisa disimulasikan.

## Alur yang teruji
1. Race: bobot 99% dan 101% tetap draf, tambah indikator, 100% bisa diaktifkan, v1 diarsipkan. Dari goal ke Beacon BCN-02. Review Success Factors tersimpan dengan bukti TSK-0004.
2. Daily: TSK-0001 dari My Day diberi blocker, dan blocker yang sama terlihat di kartu Planner. Sesi Daily disimpan. Weekly: tugas terbawa dengan tenggat asal, lalu tindakan berikutnya menjadi Workplan F3 (dicoba ulang tanpa duplikat).
3. Utility Ubud >100% → Issue F3 (FND-UTIL-UBD-2611) → keputusan DEC-2611-xxx → Workplan → evaluasi belum tercapai. Santi <70% bertaut ke TSK-0002.
4. e-Deck 8 halaman → snapshot → koreksi v2 → Pusat Laporan: status Bukti kosong, Kedaluwarsa dan Dikoreksi tampil; refresh ×3 tanpa duplikat.
5. Akses diuji untuk setiap peran:
   - Owner hanya melihat agregat; biaya terbatas, laporan payroll ditolak, ekspor snapshot sensitif ditolak.
   - Supervisor Ubud hanya melihat outletnya.
   - Therapist dan Finance ditolak, termasuk lewat URL langsung.

   Selain itu: keyboard, mobile 390 px untuk 8 layar, dan hapus dataset demo (snapshot, catatan, keputusan dan tindak lanjut demo ikut terhapus).

## Uji perjalanan lintas fase (F1–F8)
`tests/hawk-live/hrd-journey-steps.js` dipakai bersama oleh uji node dan uji browser. Alurnya:

1. Skenario formasi Ubud dibuat dan ditandai Workplan F3 (TSK-1001), lalu disetujui.
2. Handoff menghasilkan REQ-HR-2611-011, disetujui OM dan HRD, lalu VAC-2611-011 dipublikasikan.
3. Lamaran APP-2611-0101 masuk (retry dengan kunci sama tetap lamaran yang sama).
4. Screening dijalankan, interview 14 Nov (GCAL-EVT, simulasi), rubric Supervisor diisi, kandidat diterima.
5. Kontrak menghasilkan EMP-0159 (tanda tangan ulang tidak membuat profil kedua). Onboarding memakai TPL-ONB, penempatan Spa Ubud terjadwal 16 Nov.
6. Draf payroll November memuat slip prorata hire baru.
7. Rantai POS → komisi → slip → XScore diverifikasi pada therapist Ubud aktif (EMP-0002).
8. Reflection membuka kartu Workplan yang sama (TSK-1001). Posisi terbuka bertambah 2. Tindak lanjut coaching 30 hari dibuat (HG).
9. Peringatan Santi <70% tampil di F5, F8 dan STRACON.

Hasil: `hrd-journey.test.js` 29/29, `hrd-journey.e2e.js` 19/19 (16 layar).

## Uji
- `node tests/hawk-live/hrd-f8-model.test.js`: 49/49.
- `node tests/hawk-live/hrd-f8.e2e.js`: 54/54.
- `node tests/hawk-live/hrd-journey.test.js`: 29/29.
- `node tests/hawk-live/hrd-journey.e2e.js`: 19/19.

## Status integrasi
Looker Studio (e-Deck), ekspor PDF dan penyimpanan snapshot: UI-ONLY SIMULATION. Workbook SER/Race sebagai sumber metrik non-HRIS: TO VERIFY. Kalender rapat Daily/Weekly: NEW INTEGRATION REQUIRED.

## Asumsi / perlu konfirmasi
- Pemetaan key metric ke indikator Vegen dan target/aktual workbook (fixture). Revenue per Employee, Development HAWK dan Partnership HWC masih nilai contoh.
- Metrik Beacon diturunkan dari indikator Vegen; satu metrik bisa mendukung beberapa inisiatif lewat Task ID. Perlu dipastikan apakah skor Beacon ikut menyumbang ke skor Race atau hanya dipakai untuk review.
- Skala rubric Success Factors 1–4 (RF v1).
- Laporan dianggap kedaluwarsa bila bukti lebih dari 30 hari.
- Tanggal demo dibekukan pada 13 Nov 2026 dan simulator POS hanya mencakup Minggu 46. Karena itu hire baru (mulai 16 Nov) belum punya baris POS; komisi dan KPI-nya muncul saat batch POS minggu berikutnya tersedia.
