# NB Induk · JAENS HRD & Human Growth

Paket rancangan untuk review visual dan penulisan master prompt Cloud Developer per fase. Preview R&D menjadi acuan interaksi. Spesifikasi fase mencakup pengembangan lanjutan dan integrasi yang masih berupa simulasi pada preview.

## Acuan

- [Preview HRD R&D](../hrd-rnd/index.html)
- [Inventaris GajiHub dan sidebar](../hrd-rnd/REFERENSI.md)
- [Pemetaan SER, Race Vegen dan e-Deck](../hrd-rnd/KINERJA-REFERENSI.md)
- [Pola AJi Creator OS yang terdokumentasi](../HAWK-PERFORMANCE-BRIEF.md)
- [JAENS Brand & UI Guidelines](../HAWK-BRAND-GUIDELINES.md)
- [Addendum aplikasi mobile, POS spa dan presensi wajah/lokasi/jam](ADDENDUM-MOBILE-APP-DAN-PRESENSI.md)
- [NV dasar JAENS Mobile · lima layar interaktif](../hrd-rnd/mobile/preview.html) · [Panduan preview mobile](../hrd-rnd/mobile/README.md)
- [Pemetaan M-NV01–05 dan hasil pemeriksaan visual](NV-MOBILE-DASAR.md)

## Model keseluruhan

**HRD Operations** memiliki proses administratif, rekrutmen, penempatan, presensi, kepatuhan dan koordinasi payroll. **Human Growth** memiliki audit profil, kompetensi, coaching, pelatihan, jalur karier, talent pipeline dan kesiapan peran. **Manajer divisi dan supervisor outlet** memberi kebutuhan kapasitas, memverifikasi praktik, dan meninjau hasil sesuai cakupan. Workplace, My Day, tugas dan KPI tersedia sesuai peran serta penempatan efektif.

**Kebutuhan outlet → Workplan → Lowongan → Lamaran → Screening → Interview dan praktik → Kontrak → Onboarding → Penempatan dan akses → Shift dan POS → KPI dan biaya → Reflection → Issue, Ide atau Workplan.**

| Domain | Catatan resmi | Hubungan |
| --- | --- | --- |
| Organisasi dan orang | Entitas, outlet, divisi, posisi, employee ID, penempatan efektif, role dan cakupan | Penempatan menghubungkan jadwal, roster, POS, akses dan histori KPI. |
| Rekrutmen | Lowongan, kandidat, lamaran per posisi, bukti screening, rubric dan keputusan | Permintaan tenaga mengikat outlet, shift dan formasi. Lamaran yang diterima mengarah ke satu profil karyawan. |
| Planner | Satu task ID, sumber, PIC, reviewer, checklist, tenggat dan histori | Reporting, My Day, Race dan workplace membuka kartu yang sama. |
| Kapasitas dan transaksi | Jadwal, presensi, transaksi POS, jam treatment, booking gagal karena kapasitas | Jam dan hasil mengikuti outlet tempat kerja. Refund dan koreksi merujuk transaksi asal. |
| Payroll dan Finance | Periode, komponen, komisi, batch, snapshot, jurnal dan agregat | Manager HRD membuka detail. Finance memakai agregat yang disetujui dan status rekonsiliasi. |
| Kinerja dan pengembangan | Definisi KPI berversi, hasil, bukti, kontrak, asesmen, keputusan dan snapshot | SER, XScore, 9-Box dan e-Deck menautkan definisi serta hasil yang sesuai cakupan. |

## Delapan fase

[NB Fase 1 · Delapan NV](F1-FONDASI-DAN-BERANDA.md)
[NB Fase 2 · Dua belas NV](F2-OPERASI-HRD-DAN-DIREKTORI.md)
[NB Fase 3 · Delapan NV](F3-PLANNER-DAN-WORKPLACE.md)
[NB Fase 4 · Dua belas NV](F4-REKRUTMEN-DAN-PENEMPATAN.md)
[NB Fase 5 · Delapan NV](F5-MANPOWER-PLANNING-DAN-POS.md)
[NB Fase 6 · Sembilan NV](F6-HUMAN-GROWTH-DAN-KINERJA.md)
[NB Fase 7 · Dua belas NV](F7-PAYROLL-DAN-PEOPLE-BUDGETING.md)
[NB Fase 8 · Delapan NV](F8-AMBIDEX-REPORTING-DAN-REFLECTION.md)

Delapan NB fase mencakup **77 NV utama**, dengan jumlah berturut-turut 8, 12, 8, 12, 8, 9, 12 dan 8. Tab, dialog dan halaman e-Deck mengikuti NV induknya. Status implementasi dan bukti verifikasi dilaporkan per fase.

Keputusan mobile 14 November 2026: satu aplikasi terpasang Android/iPhone dengan **Beranda, Pekerjaan, Presensi, Inbox dan Saya**, sesuai peran. Prioritas mencakup presensi wajah, lokasi, jadwal, tugas, chat dan POS operasional spa. Pekerjaan kompleks divisi tetap di desktop. [Addendum mobile](ADDENDUM-MOBILE-APP-DAN-PRESENSI.md) memperluas F1–F8 tanpa mengganti penomoran 77 NV. Jalur pengujian native dan verifikasi nyata terpisah dari preview HTML dummy.







| Fase | Paket visual dan implementasi | Prasyarat |
| --- | --- | --- |
| [F1](FASE.md#f1--fondasi-dan-beranda) | Fondasi, Beranda, organisasi, keamanan peran dan pengaturan | — |
| [F2](FASE.md#f2--operasi-hrd-dan-direktori) | Karyawan, kehadiran, jadwal, izin, approval dan administrasi | F1 |
| [F3](FASE.md#f3--planner-dan-workplace) | Task Planner, workplace, My Day dan kartu lintas modul | F1, F2 |
| [F4](FASE.md#f4--rekrutmen-sampai-penempatan) | Karier publik, form per posisi, screening, interview, kontrak dan onboarding | F1–F3 |
| [F5](FASE.md#f5--manpower-planning-dan-pos) | Staffing outlet/divisi, utility, produktivitas dan transaksi POS | F2–F4 |
| [F6](FASE.md#f6--human-growth-dan-kinerja) | SER, KPI Library, XScore, People Performance dan 9-Box | F2, F3, F5 |
| [F7](FASE.md#f7--payroll-dan-people-budgeting) | Komisi, payroll, Finance & Accounting, anggaran dan kurva S | F1, F2, F4, F5 |
| [F8](FASE.md#f8--ambidex-reporting-dan-validasi-terpadu) | Race Vegen, Daily/Weekly Race, e-Deck, STRACON dan validasi lintas modul | F3, F5–F7 |

Fase menunjukkan urutan implementasi. Navigasi produk mengikuti [inventaris sidebar](../hrd-rnd/REFERENSI.md), termasuk penambahan modul JAENS sesudah menu inti. Definisi sumber data dan izin dikerjakan di F1 agar visual F2–F8 menggunakan kontrak yang sama.

## Roster dan skenario penerimaan bersama

- **158 orang dummy.** Spa Ubud, Spa Santi, Spa Triloka dan Spa Bhisma masing-masing berisi 25 Therapist dan 5 Receptionist. Office berisi 12 Finance & Accounting, 9 Marketing, 4 HRD, 5 Production dan 8 Operations. PC dan Commercial tercatat tanpa tambahan headcount.
- Nama dan profil sintetis. Take-home pay contoh mulai Rp3 juta, dengan manajer sekitar Rp7 juta. Take-home pay dan biaya tenaga kerja merupakan dua nilai yang berbeda dalam perhitungan anggaran.
- Ubud menampilkan contoh utility di atas 100%, Santi di bawah 70%. Gunakan keduanya untuk menelusuri bukti, membuat kartu, dan membandingkan penyesuaian shift dengan pembukaan lowongan.
- Uji perjalanan Therapist dari tautan/QR hingga transaksi treatment, komisi, KPI, Reflection, dan tindak lanjut. Uji Receptionist sebagai pembanding pertanyaan, rubric, POS/front desk, dan KPI.
- Preview lokal memakai fixture. Tombol hapus mengosongkan sesi dummy dengan konfirmasi. Saat implementasi menyimpan data, operasi penghapusan harus membatasi dataset berlabel demo dan diuji dengan data non-demo yang tetap utuh. Pemuatan data asli adalah pekerjaan terpisah saat data diberikan.

## Format paket per fase

1. **NB fase** berisi tujuan, layar dan state, aktor, aksi, data asal, dependensi, serta uji penerimaan.
2. **Visual** berisi satu jalur klik utama dan state kosong, gagal, akses dibatasi, serta tampilan desktop dan mobile. Terapkan palet dan shell JAENS.
3. **Master prompt Cloud Developer** merujuk NB fase dan visual yang sudah direview. Sertakan batas pekerjaan, entitas/ID, aturan izin, integrasi dummy, kontrak data, dan bukti uji.
4. **Review** menelusuri hasil dari aksi ke objek asal dan mengecek efek lintas modul sebelum fase berikutnya.

## Keputusan yang masih perlu dikunci

| Keputusan | Dampak |
| --- | --- |
| Komponen Salary Ratio dan Total People Cost, aturan alokasi divisi, akses artefak pembayaran | F7. Koridor 25–30% tetap usulan. Detail payroll khusus Manager HRD. |
| Rumus resmi XScore, batas/cakupan, definisi Absenteeism | F6 dan F8. Workbook memuat target Absenteeism berbeda. |
| Ambang beban Reception dan divisi, definisi jam tersedia, komisi/refund | F5 dan F7. Ambang Therapist memakai contoh >100% dan <70%. |
| Domain Karier, Google Calendar/Meet, penyimpanan dokumen dan tanda tangan | F4. Pratinjau menggunakan simulasi sampai jalur integrasi tersedia. |
| Submenu Keuangan GajiHub, cakupan PC/Commercial, dan unit usaha tambahan | F1 dan F7. Kasbon/Reimburse merupakan asumsi dari referensi pengaturan. |
