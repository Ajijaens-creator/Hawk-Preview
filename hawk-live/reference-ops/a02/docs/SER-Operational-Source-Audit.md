# Audit sumber SER Operasional — Oktober 2026

**Mode: baca saja.** Workbook asli diperiksa melalui struktur XML, formula, dan nilai hasil yang tersimpan. Tidak ada perubahan, ekspor ulang, atau perhitungan ulang workbook. Status implementasi ERP/portal tidak diaudit di dokumen ini. Audit sumber ini melengkapi pemeriksaan antarmuka yang dikerjakan terpisah.

[Workbook sumber](https://docs.google.com/spreadsheets/d/1TqR4c8TzVNawN2W7xtBvAoHgey4JDuV2/edit?gid=419957531#gid=419957531), nama asli `10. Oktober 2026.xlsx`. Tahun berasal dari nama file; kolom periode di dalam workbook menulis “Oktober”. Ejaan sumber `Race Vegen` dipertahankan; istilah “RAISE Wagon” dalam diskusi perlu dipetakan sebagai alias, bukan mengganti nama sumber tanpa konfirmasi.

## 1. Kesimpulan untuk gap dashboard

Workbook sendiri mengikat kebutuhan ini ke Looker: `1.1. SER!C17` memuat URL laporan yang diberikan Owner, dan `1.1. SER!AO65` menyatakan “Memastikan semua ekspetasi stake holder tertuang dalam system looker”. Karena itu dashboard operasional tidak cukup dengan kartu revenue, task, room readiness, atau beberapa indikator demo. Harus ada keterlacakan ekspektasi → indikator bulanan → pengukuran tiap Race → bukti dan penilaian → laporan.

Hitungan yang dapat dipertanggungjawabkan adalah **23 indikator bulanan** pada 7 domain Vegen; **77 baris pengukuran** pada empat siklus Beacon (19/19/19/20); serta **17 dimensi dan 209 butir** bank instrumen RSF. Empat siklus Beacon bukan empat outlet. Jangan menjumlahkan 23 dan77 sebagai100 KPI unik: banyak indikator sama diukur kembali dalam siklus berbeda.

## 2. Tab dan hitungan

| Tab persis pada sumber | Bagian yang dihitung | Jumlah / lokasi |
| --- | --- | --- |
| 1.1. SER | Ekspektasi dan spesifikasi | 3 kelompok /12 ekspektasi (C21:BB37);14 kategori /22 fitur (C44:AO65) |
| 1-2. Race Vegen | Indikator bulanan | 7 domain /23 indikator (C26:BD62) |
| 3-5 Race Beacon UnitSmall Team | Indikator tiap siklus | RACE1:19;RACE2:19;RACE3:19;RACE4:20 =77 pengukuran |
| 1-99a. Race Success Factors (RF | Bank penilaian RSF | 17 dimensi /209 butir bernomor (C3:AU254) |

Detail tambahan: 23 label Beacon berbeda setelah menghapus nomor dan spasi berlebih, tetapi ini bukan pembuktian23 KPI unik secara bisnis; label dapat berubah antarperiode. Vegen memakai ringkasan21 butir RSF dari17 dimensi; Beacon memakai6 aspek Race Performance per siklus. Bagian strategi, taktik, work plan, dan pengulangan formula tidak dihitung lagi sebagai KPI utama baru.

## 3. SER: harapan stakeholder

**Statement (`1.1. SER!C16`):** Memastikan operasional bisnis berjalan efisien, andal, dan berkelanjutan melalui pengendalian biaya, kesiapan fasilitas, disiplin eksekusi layanan, serta pengelolaan aset dan SDM yang produktif, guna mendukung pengalaman pelanggan yang konsisten, meningkatkan loyalitas, dan memperkuat kesiapan bisnis untuk berkembang.

| Kelompok | Ekspektasi | Sumber |
| --- | --- | --- |
| Executive Summary | Financial Overview | '1.1. SER'!D22 |
| Collaboration Group | Asset & Inventory Integrity | '1.1. SER'!D25 |
| Collaboration Group | Frontline Execution & Service Discipline | '1.1. SER'!D26 |
| Collaboration Group | Hawk Integerasi & POS System | '1.1. SER'!D27 |
| Collaboration Group | Net Profit masing-masing Outlet | '1.1. SER'!D28 |
| Operational Expectations | Customer Value Experience | '1.1. SER'!D31 |
| Operational Expectations | Service Delivery Excellence | '1.1. SER'!D32 |
| Operational Expectations | Absensi Karyawan | '1.1. SER'!D33 |
| Operational Expectations | Terapis Productivity | '1.1. SER'!D34 |
| Operational Expectations | Infrastructure Health | '1.1. SER'!D35 |
| Operational Expectations | Dokumen Bisnis Proses | '1.1. SER'!D36 |
| Operational Expectations | Looker Operasional | '1.1. SER'!D37 |

### Spesifikasi fitur SER

| Kategori | Fitur yang tertulis | Satuan | Sumber |
| --- | --- | --- | --- |
| Financial Sustainability | Revenue operasional Jaens Spa | rupiah | '1.1. SER'!P44 |
| Profit Protection | Proses efisiensi operasional | persentase | '1.1. SER'!P45 |
| Asset & Inventory Integrity | Stock rate BHP & Retail | persentase | '1.1. SER'!P46 |
| Asset & Inventory Integrity | Waste BHP dan Retail | persentase | '1.1. SER'!P47 |
| Asset & Inventory Integrity | Akurasi Stock Opname | persentase | '1.1. SER'!P48 |
| Customer Value Experience | Management Kepuasan Pelanggan (online & offline) | rate | '1.1. SER'!P49 |
| Customer Value Experience | Management penekanan Keluhan Pelanggan | persentase | '1.1. SER'!P50 |
| Customer Value Experience | Percepatan penanganan terhadap komplin minor (< 24 jam) | jam | '1.1. SER'!P51 |
| Customer Value Experience | Menaikkan Reebooking Pelanggan | persentase | '1.1. SER'!P52 |
| Customer Value Experience | Masuk urutan Top 10 TripAdvisor | percentage | '1.1. SER'!P53 |
| Integrasi sistem Hawk | POS System | system | '1.1. SER'!P54 |
| Infrastructure Health | Kecepatan respon maintenance | menit | '1.1. SER'!P55 |
| Infrastructure Health | Penyelesaian project maintenance | persentase | '1.1. SER'!P56 |
| Infrastructure Health | Progress GO Jaens Spa Bisma | persentase | '1.1. SER'!P57 |
| Frontline Execution | Sistem grading Front Office | system | '1.1. SER'!P58 |
| Service Discipline | Ketertiban grooming karyawan | persentase | '1.1. SER'!P59 |
| Operational Readiness | Persentase utility room yang tinggi | persentase | '1.1. SER'!P60 |
| Absensi Karyawan | Seluruh divisi karyawan disetiap outlet | persentase | '1.1. SER'!P61 |
| Terapis Productivity | Produktivitas terapis dalam pengambilan treatment | Jam | '1.1. SER'!P62 |
| Kesiapan SDM Ekspansi | Semua divisi staff | persentase | '1.1. SER'!P63 |
| Bisnis Proses | Alur kerja dan SOP | dokumen | '1.1. SER'!P64 |
| Looker Operasional | Tracking Ekspetasi Stake Holder | persentase | '1.1. SER'!P65 |

Catatan: “Net Profit masing-masing Outlet” sudah disebut di SER!D28, tetapi pengisian angka persentase pada SER tidak membuktikan adanya kalkulasi net profit yang terintegrasi dengan Finance. Demikian juga “Looker Operasional” adalah kebutuhan pelaporan, bukan bukti semua data portal sudah tersambung.

## 4. Vegen: 23 indikator bulanan yang wajib dipetakan

**Race Goal (`1-2. Race Vegen!C21`):** Mendorong pertumbuhan bisnis yang berkelanjutan melalui pencapaian revenue yang sehat, penciptaan nilai dan pengalaman pelanggan yang konsisten, pengendalian biaya serta perlindungan aset yang disiplin, dengan dukungan keunggulan delivery layanan, kesiapan SDM, keandalan operasional, dan kematangan sistem bisnis sebagai fondasi ekspansi dan kemitraan.

| Domain | Bobot sumber | Indikator | Satuan | Baris sumber |
| --- | --- | --- | --- | --- |
| Financial Sustainability | 20% | Revenue Service all Outlet | rupiah | '1-2. Race Vegen'!D27 |
| Financial Sustainability | 20% | Revenue Product all Outlet | rupiah | '1-2. Race Vegen'!D28 |
| Customer Value & Experience | 15% | Management Kepuasan Pelanggan (online & offline) | rate | '1-2. Race Vegen'!D31 |
| Customer Value & Experience | 15% | Management penekanan Keluhan Pelanggan | percentage | '1-2. Race Vegen'!D32 |
| Customer Value & Experience | 15% | Percepatan penanganan terhadap komplin minor (< 24 jam) | jam | '1-2. Race Vegen'!D33 |
| Customer Value & Experience | 15% | Menaikkan Reebooking Pelanggan | percentage | '1-2. Race Vegen'!D34 |
| Customer Value & Experience | 15% | Pembuatan sistem Grading FO | percentage | '1-2. Race Vegen'!D35 |
| Customer Value & Experience | 15% | Masuk urutan Top 10 TripAdvisor | percentage | '1-2. Race Vegen'!D36 |
| Service Delivery Excellence | 14% | Room Utility | percentage | '1-2. Race Vegen'!D39 |
| Service Delivery Excellence | 14% | Grooming Karyawan | percentage | '1-2. Race Vegen'!D40 |
| Asset Integrity & Risk Control | 14% | Waste BHP dan Retail | percentage | '1-2. Race Vegen'!D43 |
| Asset Integrity & Risk Control | 14% | Akurasi Stock Opname | percentage | '1-2. Race Vegen'!D44 |
| Operational Efficiency & Infrastructure Health | 14% | Maintenance Response Time (Emergensi) | menit | '1-2. Race Vegen'!D47 |
| Operational Efficiency & Infrastructure Health | 14% | Controllable Cost Efficiency (Profit Protection) | percentage | '1-2. Race Vegen'!D48 |
| Human Capital Productivity | 13% | Theraphis Utility | jam | '1-2. Race Vegen'!D51 |
| Human Capital Productivity | 13% | Absensi Karyawan (di luar cuti/libur) | percentage | '1-2. Race Vegen'!D52 |
| Human Capital Productivity | 13% | Kesiapan SDM untuk Ekspansi & Mitra | percentage | '1-2. Race Vegen'!D53 |
| Business System Maturity | 10% | Identifikasi Kebutuhan dan Alur Bisnis Proses | percentage | '1-2. Race Vegen'!D56 |
| Business System Maturity | 10% | Penyusunan Bisnis Proses | percentage | '1-2. Race Vegen'!D57 |
| Business System Maturity | 10% | Pengesahan dan Dokumentasi Final Bisnis Proses | doc | '1-2. Race Vegen'!D58 |
| Business System Maturity | 10% | Collect data kebutuhan looker | percentage | '1-2. Race Vegen'!D59 |
| Business System Maturity | 10% | Integrasi data ke looker | percentage | '1-2. Race Vegen'!D60 |
| Business System Maturity | 10% | Penyusunan KPI Asesment Operasional | doc | '1-2. Race Vegen'!D61 |

Setiap baris mempunyai satuan diAN, target diAR, realisasi diAW, achievement diBB, dan flag arah diBD. Bobot disimpan per domain diS pada baris Bobot. Nilai financial target/actual tidak disalin ke laporan ini; seluruh binding sel tersedia di JSON pendamping.

**PIC dan goal mapping:** AI berisi tim “Operasional/Operational” pada baris domain, bukan PIC individual per indikator. S/AA yang diberi header Business Goal/Objective-Milestone tidak berisi mapping indikator. Race Leader dan Stratect terdapat pada metadata umum. Itu belum cukup untuk menyatakan kontrak KPI per individu/department/outlet sudah lengkap.

## 5. Beacon: siklus, bobot, dan variasi indikator

| Siklus | Range utama | Baris indikator | Bobot domain berurutan (%) | Status |
| --- | --- | --- | --- | --- |
| RACE 1 | '3-5 Race Beacon UnitSmall Team'!C26:BD58 | 19 | 20, 20, 15, 10, 10, 15, 10 | 5. Active |
| RACE 2 | '3-5 Race Beacon UnitSmall Team'!C331:BD363 | 19 | 20, 15, 15, 10, 15, 15, 10 | 5. Active |
| RACE 3 | '3-5 Race Beacon UnitSmall Team'!C644:BD676 | 19 | 20, 20, 15, 10, 10, 15, 10 | 5. Active |
| RACE 4 | '3-5 Race Beacon UnitSmall Team'!C928:BD960 | 20 | 20, 15, 15, 15, 10, 15, 10 | 5. Active |

Urutan7 domain Beacon adalah Revenue; Customer Satisfaction; Operational People & Productivity; Loss Prevention; Infrastructure Health; Human Capital; System Maturity & Data Governance. Label domain tersebut mempunyai mapping eksplisit pada domain Vegen di kolomS pada baris judul domain.

| Label indikator Beacon | Muncul di | Referensi sel |
| --- | --- | --- |
| Revenue Service | R1, R2, R3, R4 | D27, D332, D645, D929 |
| Revenue Product | R1, R2, R3, R4 | D28, D333, D646, D930 |
| Management Kepuasan Pelanggan (online & offline) | R1, R2, R3, R4 | D31, D336, D649, D933 |
| Management penekanan Keluhan Pelanggan | R1, R2, R3, R4 | D32, D337, D650, D934 |
| Percepatan terhadap komplin minor (24 jam) | R1, R2, R3, R4 | D33, D338, D651, D935 |
| Menaikkan Reebooking Pelanggan | R1, R2, R3, R4 | D34, D339, D652, D936 |
| Pembuatan sistem Grading FO | R1, R2, R3, R4 | D35, D340, D653, D937 |
| Masuk urutan Top 10 TripAdvisor | R1, R2, R3, R4 | D36, D341, D654, D938 |
| Persentase Room Utility | R1, R2, R3, R4 | D39, D344, D657, D941 |
| Ketertiban Grooming Karyawan | R1, R2, R3, R4 | D40, D345, D658, D942 |
| Penekanan Waste BHP dan Retail | R1, R2, R3, R4 | D43, D348, D661, D945 |
| Kecepatan respon maintenance | R1, R2, R3, R4 | D46, D351, D664, D948 |
| Penyelesaian project maintenance | R1, R2, R3, R4 | D47, D352, D665, D949 |
| Progress GO Jaens Spa Bisma | R1, R2, R3, R4 | D48, D353, D666, D950 |
| Produktivitas Theraphis Utility | R1, R2, R3, R4 | D51, D356, D669, D953 |
| Absensi Karyawan (di luar cuti/libur) | R1, R2, R3, R4 | D52, D357, D670, D954 |
| Kesiapan SDM untuk Ekspansi & Mitra | R1, R2, R3, R4 | D53, D358, D671, D955 |
| Identifikasi Kebutuhan dan Alur Bisnis Proses | R1, R2, R3 | D56, D361, D674 |
| Looker Studio | R1 | D57 |
| Collect data kebutuhan looker | R2, R3 | D362, D675 |
| Analisa Top 10 Expanses Operational | R4 | D946 |
| Pengajuan acc dan Peninjauan Bisnis Proses | R4 | D958 |
| Integrasi data ke looker | R4 | D959 |

Semua referensi sel pada tabel di atas berada di `3-5 Race Beacon UnitSmall Team`. Indikator tambahan “Analisa Top10 Expanses Operational” pada Race4 berada di baris946 yang juga menampung label dan nilai Bobot. Label bisnis proses/Looker berubah antarRace; model data perlu menyimpan identitas indikator dan versi label, bukan memakai teks sebagai kunci permanen.

### Tiga scorecard sumber berbeda

| Scorecard | Vegen bulanan | Beacon per siklus | Implikasi |
| --- | --- | --- | --- |
| Race Goal | AH7: jumlah achievement domain × bobot | AH7/AH312/AH625/AH909 | Bobot harus dipertahankan per periode dan versi. |
| Key Metrics | AN7: rerata rentang strategi AW118:AX135 | AN7/AN312/AN625/AN909: rerata rentang taktik | Jangan mengganti dengan Race Goal atau menghitung ulang indikator yang sama dua kali. |
| RSF | AT7: rerata17 dimensi; skor sel berupa rasio standar | AT7/AT312/AT625/AT909: rerata6 aspek Race Performance | Skala dan konteks berbeda; perlu kontrak normalisasi sebelum X-Score. |

Tidak ditemukan formula final X-Score individu → departemen → outlet → semua outlet. Hierarki tersebut merupakan kebutuhan Owner untuk pengembangan; jangan menampilkan angka gabungan seolah-olah rumusnya berasal dari workbook.

## 6. Bank Race Success Factors

| Dimensi | Jumlah butir | Sumber |
| --- | --- | --- |
| Kualitas dan Efektivitas Race Objective | 14 | '1-99a. Race Success Factors (RF'!C3 |
| Keselarasan dengan Bisnis | 10 | '1-99a. Race Success Factors (RF'!C19 |
| Efektivitas Tim | 10 | '1-99a. Race Success Factors (RF'!C31 |
| Kinerja Individu | 10 | '1-99a. Race Success Factors (RF'!C43 |
| Efisiensi Proses | 10 | '1-99a. Race Success Factors (RF'!C55 |
| Kualitas Output (Hasil) | 10 | '1-99a. Race Success Factors (RF'!C67 |
| Kepuasan Stakeholders | 10 | '1-99a. Race Success Factors (RF'!C79 |
| Learning and Growth | 10 | '1-99a. Race Success Factors (RF'!C91 |
| Adaptabilitas dan Fleksibilitas | 10 | '1-99a. Race Success Factors (RF'!C103 |
| Manajemen Risiko | 10 | '1-99a. Race Success Factors (RF'!C115 |
| Pengelolaan Peluang | 10 | '1-99a. Race Success Factors (RF'!C127 |
| Ambidexterity | 10 | '1-99a. Race Success Factors (RF'!C139 |
| Implementasi Xtrous Race | 10 | '1-99a. Race Success Factors (RF'!C151 |
| Peranan Subject Matter Expert (SME) | 10 | '1-99a. Race Success Factors (RF'!C163 |
| Peranan Race Contributors | 40 | '1-99a. Race Success Factors (RF'!C175 |
| Spiritualitas dan Kesadaran | 15 | '1-99a. Race Success Factors (RF'!C227 |
| Dampak dan Keberlangsungan | 10 | '1-99a. Race Success Factors (RF'!C244 |

Total209:169 pertanyaan pada kolomD dan40 pada kolomE. Dimensi15 berisi5 peran (Maven, Stakeholders, Leader, Stratect, Creanovators), masing-masing8 butir. D32 memakai tanda koma setelah nomor1; penghitungan yang hanya menerima titik akan keliru menjadi208. KolomAL/AO/AR memuat standar, penilaian, dan rasio; jangan otomatis menyatakan bank ini sebagai209 KPI operasional harian.

## 7. Temuan kualitas sumber sebelum kontrak KPI dibekukan

| ID | Temuan | Bukti sel |
| --- | --- | --- |
| SRC-01 | Latent invalid reference in inactive formula branch. Cached value is 1; this is not proof formula is valid. | '3-5 Race Beacon UnitSmall Team'!BB345 |
| SRC-02 | Business System Maturity category average covers only first four of six populated monthly indicators; Looker integration and KPI assessment are outside aggregation range. | '1-2. Race Vegen'!BB55; '1-2. Race Vegen'!D56:BB61 |
| SRC-03 | Achievement direction differs for same absenteeism label across SER, Vegen, and Beacon cycles. Negative achievement and actual/target over100% occur in cached cells. | '1.1. SER'!AR33:BB33; '1-2. Race Vegen'!BB52:BD52; '3-5 Race Beacon UnitSmall Team'!BB52:BD52; '3-5 Race Beacon UnitSmall Team'!BB357:BD357; '3-5 Race Beacon UnitSmall Team'!BB670:BD670; '3-5 Race Beacon UnitSmall Team'!BB954:BD954 |
| SRC-04 | TripAdvisor uses percentage unit despite ranking wording and changes direction in Race4; minor complaint turnaround direction differs monthly versus Beacon. | '1-2. Race Vegen'!D33:BD36; '3-5 Race Beacon UnitSmall Team'!D33:BD36; '3-5 Race Beacon UnitSmall Team'!D938:BD938 |
| SRC-05 | Absence description in SER includes sickness; Beacon tactic description excludes sickness as well as leave/holidays. | '1.1. SER'!AO61; '3-5 Race Beacon UnitSmall Team'!AC90 |
| SRC-06 | Race4 indicator row946 also contains Bobot and its value; importer cannot discard every Bobot row. | '3-5 Race Beacon UnitSmall Team'!D946:S946 |
| SRC-07 | Main Vegen Business Goal and Objective/Milestone columns have no indicator mappings; separate business-goal paragraph references electronic self-certification and requires context review. | '1-2. Race Vegen'!S26:AH61; '1-2. Race Vegen'!C142:Y142 |
| SRC-08 | Tactic parent-label mappings disagree with main table for TripAdvisor, maintenance response, therapist productivity, and process mapping. | '3-5 Race Beacon UnitSmall Team'!U82:BA82; '3-5 Race Beacon UnitSmall Team'!U86:BA86; '3-5 Race Beacon UnitSmall Team'!U89:BA89; '3-5 Race Beacon UnitSmall Team'!U92:BA92 |
| SRC-09 | Race3 and Race4 Key Stage text still says Race2. | '3-5 Race Beacon UnitSmall Team'!C684; '3-5 Race Beacon UnitSmall Team'!C968 |
| SRC-10 | Category weights vary per cycle, and monthly weights differ from Beacon weights; retain version and period, never impose one fixed set silently. | '1-2. Race Vegen'!S29:S62; '3-5 Race Beacon UnitSmall Team'!S29:S58; '3-5 Race Beacon UnitSmall Team'!S334:S363; '3-5 Race Beacon UnitSmall Team'!S647:S676; '3-5 Race Beacon UnitSmall Team'!S931:S960 |
| SRC-11 | Main tables have targets/actuals/units/achievements, but no structured per-indicator individual PIC, outlet ID, department ID, or exact cycle dates; Race1–4 must not be treated as the four outlets. | '1-2. Race Vegen'!C24:BD62; '3-5 Race Beacon UnitSmall Team'!C24:BD58 |
| SRC-12 | SER and monthly Vegen are marked Inactived, all four Beacon blocks Active; distinguish source workflow status from availability of data. | '1.1. SER'!E9; '1-2. Race Vegen'!E9; '3-5 Race Beacon UnitSmall Team'!E10; '3-5 Race Beacon UnitSmall Team'!E315; '3-5 Race Beacon UnitSmall Team'!E628; '3-5 Race Beacon UnitSmall Team'!E912 |
| SRC-13 | Workbook scorecards Race Goal, Key Metrics and RSF use different constructs and scales. No final cross-level X-Score aggregation contract was found. | '1-2. Race Vegen'!AH6:AT7; '3-5 Race Beacon UnitSmall Team'!AH6:AT7; '3-5 Race Beacon UnitSmall Team'!C216:AV223 |
| SRC-14 | All23 Vegen actual cells are stored numeric values rather than source-link formulas; workbook alone does not prove POS/HRD/Finance API lineage. | '1-2. Race Vegen'!AW27:AW61 |

Contoh cached value yang memperjelas risiko: absensi SER BB33=1,28333; Vegen BB52≈0,77922; Beacon Race1 BB52≈−1,16667; Race2 BB357≈−0,33333; Race3 BB670≈0,96333; Race4 BB954≈−0,07533. Nilai tersebut tidak dihitung ulang dalam audit. Karena rumus dan flag arah berbeda, persentase tersebut belum bisa diperlakukan sebagai satu definisi achievement yang konsisten.

Tidak ditemukan cached cell bertipe error, tetapi tetap ditemukan `#REF!` dalam formula BB345. Pemeriksaan formula penting karena error laten tidak selalu tampak sebagai error pada hasil saat ini.

## 8. Usulan integrasi untuk developer — bukan bukti endpoint sudah tersedia

| Keluarga indikator | Calon sumber transaksi/aktivitas | Data tambahan / keputusan |
| --- | --- | --- |
| Revenue service/product, biaya, profit | Engine POS existing + Finance | Definisi revenue/refund/tax/service, posting dan periode; gunakan ID transaksi existing. |
| Kepuasan, komplain, rebooking | Feedback existing + booking POS + Sales/CRM + issue operasional | Guest ID, complaint lifecycle, denominator, waktu response/resolution, bukti review. |
| Room Utility, therapist hours | Appointment/treatment + ruang + presensi/roster | Jam tersedia yang sah, downtime/maintenance, pembatalan, kapasitas serta utilisasi tidak boleh dirata-rata tanpa denominator. |
| Waste/stock opname | Inventory existing; penerimaan fisik Attendant → verifikasi Supervisor → posting Inventory | Qty unit, valuation, consumption/adjustment reasons; actual tidak diketik ulang di KPI jika transaksi tersedia. |
| Grooming/FO grading/service discipline | Checklist, verifikasi hybrid, penilaian HRD | Task evidence, approver dan rubric version; KPI individual berasal dari assignment yang sah. |
| Maintenance/project/Bisma readiness | Issue/task/project operasional | Reported/responded/resolved timestamps; work order; evidence; approval. |
| Absensi/ekspansi/SDM | HRD existing + rencana kebutuhan karyawan | Aturan sick/leave, hari kerja dan headcount historis; persentase People budget sesuai akses. |
| Bisnis proses, Looker/data governance, KPI assessment | Document/evidence register + workflow approval + import ledger | Versi dokumen, target deliverable, completion proof, owner dan approval. |
| TripAdvisor | Input bukti atau integrasi eksternal yang diizinkan | Tentukan apakah ranking, percentile, atau percentage; timestamp dan sumber harus jelas. |
| RSF/Race Performance/X-Score | Penilaian berizin + registry formula versi | Pertahankan perbedaan skala; formula roll-up lintas individu/dept/outlet harus disepakati sebelum aktif. |

Kontrak minimal yang diusulkan: `indicator_id`, `definition_version`, `ser_expectation_id`, `domain_id`, `goal_id`, `objective_id`, `period_id`, `race_id`, `outlet_id`, `department_id`, `assignee_id`, `unit`, `direction`, `target`, `actual`, `numerator`, `denominator`, `achievement_formula_version`, `weight`, `source_system`, `source_record_id`, `evidence_id`, `verified_by`, `verified_at`, `approval_state`, `as_of`. Ini usulan desain, bukan nama tabel/endpoint yang sudah ditemukan di ERP.

### Urutan penutupan gap

1. Jadikan inventaris sumber ini baseline traceability untuk layar/dashboard; gunakan status data demo/menunggu sumber secara jujur.
2. Cocokkan tiap halaman, chart, filter, dan definisi pada Looker secara terpisah. Workbook saja tidak membuktikan kesetaraan tampilan Looker.
3. Tutup perbedaan formula dan definisi dengan daftar keputusan per indikator; simpan versi sumber dan versi yang disetujui.
4. Mapping23 indikator bulanan dan seluruh77 pengukuran Beacon ke kontrak data, termasuk bukti dan siapa memverifikasi; jangan memasukkan209 RSF sebagai209 KPI harian.
5. Tambahkan assignment outlet/department/individual dan rentang periode; Supervisor dibatasi tepat1outlet sesuai keputusan Owner.
6. Integrasikan source adapters ke engine existing; data operasional manual hanya untuk hal yang memang belum ada sumber transaksinya.
7. Baru aktifkan roll-up dan X-Score setelah denominator, bobot, arah, skala, dan approval tervalidasi.

## 9. Batas audit

Audit ini tidak menyatakan tampilan Looker sudah dibuka, tidak menyatakan semua KPI sudah live, tidak menguji engine POS/Finance/HRD, dan tidak memperbaiki rumus. Status Inactived/Active dilaporkan persis dari sumber. Daftar kemampuan ERP pada NP-OP00 yang diberikan Owner tetap merupakan laporan audit pihak sebelumnya, bukan validasi ulang oleh audit workbook ini. Data sumber cukup untuk menetapkan bahwa requirement asli jauh lebih luas daripada indikator demo sederhana; detail per halaman Looker dan integrasi runtime tetap harus dibuktikan tersendiri.
