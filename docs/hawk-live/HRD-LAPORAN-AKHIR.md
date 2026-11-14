# HAWK HRD & Human Growth · Laporan Akhir F1–F8

Status per 14 Nov 2026 (WITA). Prototype portal kelima HRD, 77 NV, DATA DEMO / SIMULASI (R&D). Semua fase sudah dibangun dan diuji. Belum ada yang di-merge ke main; checkpoint ada di branch `claude/project-thread-f0itz7`.

## 1. Cara membuka preview
- **Link preview (Artifact privat):** https://claude.ai/artifact/XmCTnZSEjUWKzcMH3R8tr8 — portal HRD lengkap, data tersimpan di browser masing-masing. Tombol unduh/ekspor tidak aktif di dalam viewer Artifact.
- **File mandiri (tanpa server, tanpa login):** `hawk-hrd/final/preview-hrd.html` di Library project. Unduh lalu buka di browser. Halaman karier publik ada di `preview-karier.html`.
- **Dalam repo:** `hawk-live/hrd.html` (portal HRD), `hawk-live/karier.html` (karier publik), `hawk-live/index.html` (picker lima portal).
- **Vercel:** deploy preview untuk branch ini dibuat otomatis oleh Vercel tim jaens-enterprises-pro. Tautannya tidak bisa diverifikasi dari sesi ini, jadi mungkin perlu login Vercel. preview.hawk.jaens.id baru berubah setelah merge ke main dengan persetujuan Aji.
- Role demo bisa diganti di sidebar kiri bawah: Manager HRD, Staf HRD, Lead HG, Owner, Operational Manager, Supervisor Spa Ubud, Therapist, Finance Manager. Tombol Reset Demo Data mengembalikan data ke fixture awal.

## 2. Status fase dan NV (77/77 siap)
| Fase | NV | Isi | Uji model | Uji browser | Checkpoint |
|---|---|---|---|---|---|
| F1 Fondasi & Beranda | 8 | Beranda, org, role & akses, pengaturan, audit, data demo 158 | 30/30 | 42/42 | 32c5ecb |
| F2 Operasi HRD & Direktori | 12 | Direktori, detail, jadwal, presensi, izin/cuti, approval, kunjungan, impor | 22/22 | 45/45 | bbc820b |
| F3 Planner & Workplace | 8 | Workplace, Board drag-and-drop, Calendar, List, Library SOP, My Tasks, My Day, Detail Kartu (PIC, diskusi, checklist, histori) | 30/30 | 40/40 | e3a0a27 |
| F4 Rekrutmen & Karier | 12 | Karier publik, lowongan, kandidat, screening, interview, keputusan, penawaran, kontrak, onboarding, penempatan | 31/31 | 50/50 | e2f49fa |
| F5 Manpower Planning & POS | 8 | Dashboard, kapasitas, utility, reception, divisi, POS, simulasi, handoff rekrutmen | 34/34 | 45/45 | 9316a2c |
| F6 Human Growth & Kinerja | 9 | KPI, SER, KPI Library, kontrak KPI, XScore, People Performance, 9-Box, development, training | 42/42 | 52/52 | 0d4ff40 |
| F7 Payroll & People Budgeting | 12 | Payroll, aturan, komisi POS, proses, slip, kasbon/reimburse, laporan, handoff Finance, budgeting, rencana, simulasi, kurva S | 52/52 | 47/47 | 1a7d026 |
| F8 AmbideX, Reporting & Reflection | 8 | Race Vegen, Beacon & Success Factors, Daily, Weekly, Monthly Reflection, STRACON, e-Deck 8 halaman, Pusat Laporan | 49/49 | 54/54 | dd38a93 |
| Lintas fase F1–F8 | — | Perjalanan Ubud dan peringatan Shanti | 29/29 | 19/19 | dd38a93 |

Regresi penuh (`bash tests/hawk-live/run-all.sh`) lulus semua, termasuk uji empat portal lama: model 104, design-lock 17, browser 45, fase2 30, budget2027 20. Screenshot desktop dan mobile 390 px tiap fase ada di Library: `hawk-hrd/f1` … `hawk-hrd/f8`. Laporan per fase ada di `docs/hawk-live/HRD-F1-LAPORAN.md` … `HRD-F8-LAPORAN.md`.

## 3. Alur yang berhasil diuji
**Perjalanan utama (uji node + browser, 16 layar):**
1. Utility Spa Ubud >100% (F5).
2. Skenario tambah 2 therapist dibuat, lalu Workplan F3 TSK-1001 dengan PIC dan tenggat.
3. Skenario disetujui Manager HRD dan diteruskan menjadi permintaan REQ-HR-2611-011, disetujui OM lalu HRD.
4. Lowongan VAC-2611-011 dipublikasikan.
5. Lamaran APP-2611-0101 masuk. Retry dengan kunci yang sama tetap menghasilkan lamaran yang sama.
6. Screening dijalankan, interview dijadwalkan (Event ID kalender, simulasi), rubric praktik dinilai Supervisor, kandidat diterima.
7. Penawaran dikirim dan diterima, dokumen diverifikasi, kontrak ditandatangani menjadi EMP-0159. Tanda tangan ulang tidak membuat profil kedua.
8. Onboarding TPL-ONB, lalu penempatan Spa Ubud terjadwal mulai 16 Nov dengan akun ESS.
9. Draf payroll November memuat slip prorata untuk karyawan baru.
10. Rantai POS → komisi per Service Line ID → slip → XScore November diverifikasi pada therapist Ubud aktif.
11. Monthly Reflection membuka kartu Workplan yang sama (tanpa duplikat), dan posisi terbuka naik 2.
12. Tindak lanjut coaching 30 hari dibuat di workspace HG.

**Peringatan Spa Shanti (<70%):** tampil di Beranda F1, Utility F5, Reflection F8 dan pusat laporan, semuanya bertaut ke temuan yang sama (TSK-0002). Keputusan STRACON Oktober (uji shift split) dievaluasi pada November dan hasilnya belum tercapai (66,2% < 70%).

**Per fase (ringkas):**
- F2: approval presensi dan cuti.
- F3: drag-and-drop nyata, konflik versi, akses lintas workplace.
- F4: halaman karier publik dengan consent dan lampiran, klarifikasi screening.
- F5: refund, koreksi dan replay POS tanpa duplikat.
- F6: kontrak KPI berversi, koreksi skor, 9-Box → Workplan coaching, verifikasi pelatihan.
- F7: komisi Four Hands dan bantuan antaroutlet, kunci batch dengan snapshot, refund setelah kunci menjadi penyesuaian Desember, jurnal seimbang, retry handoff dengan Batch ID tetap.
- F8: bobot 99/100/101%, snapshot e-Deck dan koreksi berversi, refresh laporan tanpa duplikat.

**Akses:**
- Payroll, slip dan nominal personal hanya untuk Manager HRD.
- Owner melihat agregat tanpa skor personal.
- Finance melihat agregat dan jurnal.
- Supervisor hanya melihat outletnya.
- Therapist hanya melihat datanya sendiri (ESS).
- URL langsung ke layar terlarang ditolak.

Semua fase diuji juga dengan keyboard, mobile 390 px, filter kosong, sumber gagal, dan hapus dataset demo (dengan konfirmasi "HAPUS DUMMY").

## 4. Fitur yang masih simulasi
| Area | Status |
|---|---|
| POS (baris layanan, refund, koreksi, batch) | UI-ONLY SIMULATION; endpoint produksi NEW INTEGRATION REQUIRED |
| Presensi selfie/GPS, mesin absen | NEW INTEGRATION REQUIRED |
| Google Calendar/Meet, email/WA konfirmasi kandidat | NEW INTEGRATION REQUIRED |
| Penyimpanan dokumen, e-sign kontrak | NEW INTEGRATION REQUIRED |
| AI screening CV | simulasi rule-based; tidak menilai foto, KTP, tulisan tangan atau kepribadian |
| Bank/pembayaran gaji, PPh 21/26, BPJS, Coretax | NEW INTEGRATION REQUIRED; tarif adalah versi aturan simulasi |
| Endpoint jurnal Finance, pemetaan COA | NEW INTEGRATION REQUIRED / TO VERIFY |
| Akun & org HAWK, data divisi Finance/Production | TO VERIFY |
| LMS, Looker Studio, ekspor PDF/CSV | UI-ONLY SIMULATION |
| Notifikasi kartu Planner | UI-ONLY SIMULATION |
| Metrik workbook Race/SER non-HRIS | fixture, TO VERIFY |

## 5. Masalah yang tersisa
- **Tanggal demo dibekukan pada 13 Nov 2026, dan simulator POS hanya mencakup Minggu 46 (7–13 Nov).** Akibatnya karyawan baru dari perjalanan uji (mulai 16 Nov) belum punya baris POS, sehingga komisi dan KPI-nya masih "belum ada data". Interview minimal besok dan tanggal mulai minimal hari ini sesuai aturan F4.
- **Produktivitas therapist per outlet di e-Deck sama (96,8%).** Penyebabnya, jumlah tamu F6 masih fixture berpola. Perlu data tamu POS nyata.
- **Absenteeism belum punya definisi,** sehingga tampil sebagai "Bukti kosong" atau gap di SER, Race dan e-Deck.
- **QR karier hanya pola visual,** belum bisa dipindai. QR yang berfungsi butuh domain karier publik.
- **Tautan Vercel branch belum diverifikasi** dari sesi ini.
- **Belum di-merge ke main,** menunggu persetujuan Aji.

## 6. Checkpoint terakhir dan langkah lanjut
- Branch `claude/project-thread-f0itz7`, commit terakhir dd38a93 (F8 + uji lintas fase + laporan akhir).
- Langkah lanjut yang disarankan:
  1. Aji mereview preview, terutama alur perjalanan di §3.
  2. Aji menjawab daftar konfirmasi di §7.
  3. Setelah disetujui, merge ke main supaya tampil di preview.hawk.jaens.id.
  4. Tim developer memetakan integrasi berstatus NEW INTEGRATION REQUIRED, dimulai dari POS, jurnal Finance dan BPJS/PPh.

## 7. Konfirmasi yang dibutuhkan dari Aji
**Organisasi & akses**
1. Penempatan Supervisor outlet dihitung di Office Operations, sehingga filter Spa Ubud = 30 orang. Apakah benar?
2. Nama outlet: diputuskan Owner (14 Nov 2026) memakai Spa Shanti dan Spa Bisma, sama dengan SER.
3. Apakah Finance boleh melihat nominal atau artefak pembayaran per orang? (Preview: agregat saja.) Apakah slip gaji ESS untuk karyawan sendiri dibuka? (Preview: belum, mengikuti mandat "nominal personal hanya Manager HRD".)

**Operasi & rekrutmen**
4. Apakah JAENS memakai modul Kunjungan Klien (therapist home-service)?
5. Domain karier publik (mis. karier.jaens.id) dan kanal lowongan yang dipakai.
6. Kapasitas shortlist 3 per formasi. Approval permintaan tenaga: OM/manager divisi lalu Manager HRD, tanpa Owner. Benar?
7. Template onboarding: satu untuk semua posisi, atau Office punya template sendiri?

**Manpower & POS**
8. Definisi kapasitas reguler (jam bookable setelah istirahat, cuti dan jam tidak tersedia) beserta angka per shift.
9. Lebar pita Pantau (70–75% dan 95–100%), dan target reception (6 check-in per staf per jam, tunggu ≤ 10 menit).
10. Asumsi simulasi formasi: 7 jam × 6 hari, ramp-up 80%, booking gagal dihitung 1,5 jam.

**Kinerja**
11. Formula XScore resmi (AJi Creator OS). Preview memakai bobot 50/30/20, target utility 85%, learning 10 jam.
12. Definisi, arah dan denominator Absenteeism.
13. Band 9-Box (≥90 / 75–90 / <75) dan sumber penilaian potensi.

**Payroll & budget**
14. Komponen Salary Ratio dan Total People Cost, serta koridor 25–30%.
15. Aturan komisi therapist (Rp per jam layanan selesai, refund membalik komisi, bantuan dibayar di outlet aktual).
16. Tarif resmi PPh 21 TER dan BPJS beserta tanggal berlakunya, dan template Coretax.
17. Pemetaan COA (6101–6106, 2101–2103, 1104), cost center, dan dasar alokasi Office ke outlet.
18. Submenu Keuangan GajiHub: preview mengasumsikan Kasbon dan Reimburse. Benar?

**AmbideX & Race**
19. Pemetaan key metric ke indikator Vegen beserta target/aktual workbook resmi.
20. Apakah skor Beacon ikut menyumbang ke skor Race, atau hanya dipakai untuk review? Skala rubric Success Factors 1–4: sudah tepat?
21. Batas kedaluwarsa bukti laporan (preview: 30 hari).
