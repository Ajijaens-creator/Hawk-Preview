# HAWK Operational · Satu sumber entri untuk 14 Dashboard Kinerja

Status: frontend demo (branch `claude/project-thread-nbqj53`), **simulasi**. Belum merge, belum deploy.

## Ringkasan

Semua 14 halaman Looker "Operational Report New" saya telusuri sampai ke spreadsheet sumbernya, hanya baca: 21 file di folder Drive Operational, plus SER/Vegen. Yang dicatat di sini hanya struktur (kolom, rumus, cara isi). Angka asli dan nama karyawan atau tamu tidak disalin.

**Temuan utama:**
- Hampir semua angka dashboard saat ini **diketik ulang** dari sistem lain, berupa rekap harian atau bulanan:
  - POS (revenue, tamu baru/repeater, room, utility terapis)
  - laporan Finance (PNL)
  - presensi (absensi)
  - file stock opname Inventory (akurasi SO)
  - kartu feedback kertas
  - Google/Tripadvisor
- Akibatnya data yang sama diketik di beberapa sheet. Contohnya, kolom tamu baru dan repeater muncul di 01, 11 dan 16.

**Usulan:** di HAWK OS, setiap angka punya satu dari tiga asal:
1. **Otomatis** dari sistem pemilik data (POS, Finance, HRD presensi, Gudang, checklist harian), tanpa entri.
2. **Entri sekali per kejadian**: komplain, waste, tiket maintenance, feedback, assessment, grooming, SOP. Dicatat oleh peran yang mengalami kejadian, lalu diverifikasi Supervisor. KPI dihitung sistem.
3. **Data induk**, di-set sekali: target budget, kapasitas room, instrumen kompetensi, histori tamu 2015–2025.

Dengan model ini tidak ada spreadsheet lagi. Total atau persen juga tidak pernah diketik manual.

Di aplikasi, peta yang sama tersedia lewat tombol **Satu sumber entri** di header Dashboard Kinerja (`#op-analytics`), per dashboard atau "Lihat semua 14". Sumber kode: `hawk-live/ops-single-entry.js`.

## Masalah kualitas data di sheet sekarang (hilang bila entri satu sumber)

- **12 Konversi:** pivot KPI *menjumlahkan* persen kepuasan antar outlet, sehingga hasilnya bisa >100%. HAWK memakai rata-rata tertimbang jumlah review.
- **13 Komplin Minor:** jam penanganan diketik sebagai satu angka. Label "Tercapai" tidak konsisten dengan kolom >24 jam. HAWK menghitungnya dari waktu per kasus.
- **14 Waste:** kolom "1% Waste" rumusnya tidak konsisten dengan %BHP. Nilai Rp juga diketik total tanpa rincian item.
- **17 Daily Ceklist 5S dan 18 Grooming:** pola 0/1 harian identik, indikasi disalin. Keduanya hanya mencatat "sudah dicek" per outlet, bukan per karyawan.
- **16 Guest 10 Years:** ada nilai bulanan yang tampak salah ketik.
- **03 Absensi:** kartu Looker menampilkan jumlah kejadian, sedangkan target di dbFinalReport adalah persen (≤3%).

## Yang ditambahkan di build ini (frontend, simulasi)

- **Form maintenance:**
  - field urgensi respons (RESPON NEEDED), mulai dikerjakan, dan dikerjakan oleh (internal/vendor)
  - kategori ditambah Infrastruktur/Civil, Plumbing dan Preventive, sesuai sheet 04
- **Form komplain:** kategori 7P, karyawan terkait (employeeRef), dan referensi kunjungan POS (visitRef), sesuai sheet 10.
- **Kapasitas:**
  - field master "kapasitas revenue room harian" dan "jumlah treatment (POS)"
  - kartu **Treatment / terapis / hari**, setara Looker "Utility Terapis". Demo memakai estimasi 60 menit per treatment bila jumlah treatment belum ada.
- Semua field baru bersifat opsional, sehingga catatan lama tetap valid.
- Uji: `tests/hawk-live/ops-single-entry.e2e.js`, masuk `run-all.sh`.

## Keputusan Owner yang dibutuhkan

1. SLA keluhan online (Google/Tripadvisor/WhatsApp). Offline tetap <24 jam.
2. Rumus akurasi SO: berbasis jumlah item cocok, atau nilai Rp selisih.
3. Utilitas room resmi: rasio Rp (cara Looker) atau rasio menit/slot.
4. Grading FO: apakah status "proses" dihitung ½ bobot (cara sheet 20).

## Kebutuhan backend (di luar mandat frontend)

- Baca invoice POS: revenue per kategori room, terapis yang ditugaskan, customerRef untuk tamu baru/repeater, dan visitRef. Paritas POS masih menunggu login Owner.
- Finance NV-47..52: laporan per akun dan mapping akun ke kategori 7P. Target dibaca dari Budget 7P.
- HRD: presensi/jadwal untuk absensi dan terapis hadir, master karyawan untuk employeeRef, serta riwayat grade.
- Gudang: harga rata-rata item untuk nilai waste, dan form stock opname outlet.
- Integrasi review: Google Business Profile API dan impor Tripadvisor (akun milik Owner). Nama tamu tidak disimpan.
- Impor sekali data tamu historis 2015–2025.

## Peta per dashboard

### 1. Revenue Overview (`revenue`)

- **Spreadsheet sumber Looker:** 01 Revenue (tab per outlet, harian)
- **Cara isi sekarang:** Supervisor/admin mengetik rekap harian dari laporan POS: revenue room, foot chair, salon, retail, jumlah invoice, tamu baru/lama. Target bulanan diketik di tab datahelper.
- **Rumus Looker:** Revenue Service = room + foot chair + salon · Avg sales = revenue ÷ jumlah invoice · % pencapaian = revenue ÷ target bulanan
- **Target / kode ekspektasi:** Target per outlet per bulan (Budget)

| Data | Satu titik entri di HAWK OS | Cara | Status |
|---|---|---|---|
| Transaksi service & retail | POS existing (invoice lunas). Receptionist hanya memproses transaksi di POS; tidak ada rekap ulang. | Otomatis | Sudah ada |
| Target bulanan per outlet | Budget 7P / Finance (NV-15, NV-16). Target dibaca dari budget yang dikunci, bukan diketik di Operational. | Data induk | Butuh backend |

**Sisa gap:** Integrasi baca invoice POS → Operational (endpoint POS belum tersedia; paritas POS masih menunggu login Owner).

### 2. Profit & Loss (`pnl`)

- **Spreadsheet sumber Looker:** 02 PNL (GabunganPNL, PNLalloutlet, Eficiencyutility)
- **Cara isi sekarang:** Disalin bulanan dari laporan keuangan Finance per akun (income, HPP, laundry, payroll, listrik, iklan, maintenance, dst).
- **Rumus Looker:** Laba bersih = gross sales − total expenses · Efisiensi = expense ÷ revenue (status target 10%)
- **Target / kode ekspektasi:** Target profit per outlet (Budget)

| Data | Satu titik entri di HAWK OS | Cara | Status |
|---|---|---|---|
| Pendapatan, biaya per akun, laba | Finance NV-47..52 (jurnal & laporan). Operational hanya membaca; tidak ada entri angka keuangan. | Otomatis | Butuh backend |
| Komponen People | HRD payroll. Ditampilkan sebagai % saja; nominal hanya untuk Manager HRD. | Otomatis | Sudah ada |

**Sisa gap:** Mapping akun GL → kategori 7P dashboard perlu kontrak data Finance.

### 3. Capacity & Productivity (`capacity`)

- **Spreadsheet sumber Looker:** 05 Room Utility · 0.55 Room Utility · 08 Utility Terapis · 03 Absensi
- **Cara isi sekarang:** Tiga sheet terpisah diketik: revenue room harian vs kapasitas, rata-rata utility terapis harian, jumlah sakit/ijin harian.
- **Rumus Looker:** Utilitas room = revenue room ÷ kapasitas revenue room harian outlet (target 70%) · Utility terapis = treatment ÷ terapis hadir per hari (target 130/bulan) · Absensi = (sakit + ijin) ÷ hari-orang terjadwal (maks 3%)
- **Target / kode ekspektasi:** Ope-Ope-Room 70% · Ope-Pro-Serv 130 · Ope-Pro-Abse ≤3%

| Data | Satu titik entri di HAWK OS | Cara | Status |
|---|---|---|---|
| Revenue per kategori room | POS (roomType pada invoice). Kategori: Single, Couple, Foot Massage, Salon, Beauty Room. | Otomatis | Sudah ada |
| Kapasitas room per outlet | Master ruang Operational (#op-rooms). Ditetapkan sekali per outlet (jumlah room × slot × tarif) dan dipakai sebagai pembagi. | Data induk | Ditambah di build ini |
| Treatment per terapis | POS (terapis yang ditugaskan) + HRD presensi. Kartu "Treatment / terapis / hari" ditambahkan; demo memakai estimasi 60 menit per treatment. | Otomatis | Ditambah di build ini |
| Sakit / ijin | HRD presensi & jadwal (F2). Tidak ada lagi entri jumlah absen; dihitung dari jadwal + presensi. | Otomatis | Sudah ada |

**Sisa gap:** Looker memakai rasio Rp untuk room dan treatment/terapis, HAWK lama memakai menit. Sekarang keduanya ditampilkan; definisi resmi dikonfirmasi Owner.

### 4. Waste & Accuracy (`waste`)

- **Spreadsheet sumber Looker:** 14 Waste · 15 Akurasi SO
- **Cara isi sekarang:** Total Rp waste BHP dan retail diketik per bulan; akurasi SO diketik sebagai persen dari file stock opname Inventory.
- **Rumus Looker:** % Waste BHP = waste BHP ÷ revenue service · % Waste retail = waste retail ÷ revenue retail (batas 1%) · Akurasi SO = item cocok ÷ item dihitung (target 100%)
- **Target / kode ekspektasi:** Waste ≤1% · Akurasi SO 100%

| Data | Satu titik entri di HAWK OS | Cara | Status |
|---|---|---|---|
| Waste per item | Form waste Operational (Attendant/Reception → Supervisor). Dicatat sekali per kejadian: item, qty, alasan. Total Rp dihitung otomatis. | Entri sekali per kejadian | Sudah ada |
| Nilai satuan item | Harga rata-rata Gudang (NV-38..46). Tidak lagi diketik; diambil dari master item Gudang. | Otomatis | Butuh backend |
| Stock opname | Form SO Gudang outlet (#op-warehouse / NV-44). Qty sistem vs fisik per item; akurasi dihitung otomatis. | Entri sekali per kejadian | Sudah ada |
| Pembagi revenue | POS. Sama dengan dashboard Revenue. | Otomatis | Sudah ada |

**Sisa gap:** Keputusan Owner: akurasi SO berbasis jumlah item cocok atau nilai Rp selisih.

### 5. Customer Review (`reviews`)

- **Spreadsheet sumber Looker:** 06 Offline Feedback · 07 Online Review
- **Cara isi sekarang:** Offline: hitungan kartu feedback 5–1 bintang per hari diketik. Online: setiap review Google/Tripadvisor disalin manual satu per baris.
- **Rumus Looker:** Rata-rata bintang · % bintang 5 · jumlah feedback · feedback ÷ total tamu

| Data | Satu titik entri di HAWK OS | Cara | Status |
|---|---|---|---|
| Feedback offline | Form rating per kunjungan (tablet/QR saat checkout POS). Tamu mengisi sendiri; terhubung ke visitRef. Tidak ada rekap harian. | Entri sekali per kejadian | Sudah ada |
| Review online | Google Business Profile API / impor Tripadvisor. Nama tamu tidak disimpan; sebutan nama terapis bisa ditautkan ke employeeRef. | Otomatis | Butuh backend |
| Total tamu | POS. Untuk rasio feedback per tamu. | Otomatis | Sudah ada |

**Sisa gap:** Integrasi API review perlu persetujuan akun Google/Tripadvisor milik Owner.

### 6. Customer Satisfaction (`satisfaction`)

- **Spreadsheet sumber Looker:** 12 Konversi Offline vs Online
- **Cara isi sekarang:** Disusun ulang manual setiap bulan dari sheet 06 dan 07. Pivot KPI menjumlahkan persen antar outlet (hasil >100%, keliru).
- **Rumus Looker:** % Kepuasan = (bintang 5 + 4) ÷ total review · % Keluhan = (bintang 3 + 2 + 1) ÷ total review

| Data | Satu titik entri di HAWK OS | Cara | Status |
|---|---|---|---|
| Semua angka | Turunan dari feedback offline + review online. Tidak ada entri. Rata-rata antar outlet dihitung tertimbang jumlah review. | Otomatis | Sudah ada |

**Sisa gap:** Tidak ada; perbaikan rumus pivot sudah otomatis di HAWK.

### 7. Rebooking Customer (`retention`)

- **Spreadsheet sumber Looker:** 11 Rebooking · 16 Guest 10 Years
- **Cara isi sekarang:** Jumlah tamu, tamu baru dan repeater diketik ulang harian (duplikat sheet 01); histori sejak 2015 diketik bulanan.
- **Rumus Looker:** % Repeater = repeater ÷ total tamu (target 25%) · YoY per bulan
- **Target / kode ekspektasi:** Repeater 25%

| Data | Satu titik entri di HAWK OS | Cara | Status |
|---|---|---|---|
| Tamu baru / repeater | POS + CRM (customerRef unik: no HP/email). Segment ditentukan sistem dari kunjungan pertama. | Otomatis | Sudah ada |
| Histori 2015–2025 | Impor sekali (migrasi saldo awal). Setelah impor, perbandingan YoY otomatis. | Data induk | Butuh backend |

**Sisa gap:** Deduplikasi customer di POS lama perlu dicek saat migrasi.

### 8. Handling Complain (`complaints`)

- **Spreadsheet sumber Looker:** 10 Keluhan 7P · 13 Komplin Minor
- **Cara isi sekarang:** Keluhan dicatat per baris dengan tipe 7P dan karyawan terkait; rekap bulanan <24 jam / >24 jam dan satu angka "waktu handle" diketik terpisah.
- **Rumus Looker:** Jumlah keluhan per 7P per outlet · % ditangani <24 jam · rata-rata jam penanganan
- **Target / kode ekspektasi:** SLA offline <24 jam

| Data | Satu titik entri di HAWK OS | Cara | Status |
|---|---|---|---|
| Kasus komplain | Form komplain Operational (Reception/Hospitality → Supervisor). Waktu diterima, respons dan selesai per kasus; % SLA dan jam penanganan dihitung otomatis. | Entri sekali per kejadian | Sudah ada |
| Kategori 7P | Field "Kategori 7P" pada form komplain. People, Product, Process, Place, Facility, Promotion, Price. | Entri sekali per kejadian | Ditambah di build ini |
| Karyawan terkait & kunjungan | Field employeeRef (master HRD) + visitRef (POS). Keluhan otomatis masuk ke catatan kinerja karyawan terkait. | Entri sekali per kejadian | Ditambah di build ini |

**Sisa gap:** Keputusan Owner: SLA untuk keluhan online (Google/Tripadvisor/WhatsApp).

### 9. Tripadvisor Performance (`tripadvisor`)

- **Spreadsheet sumber Looker:** 09 Tripadvisor
- **Cara isi sekarang:** Snapshot mingguan (tanggal 7/14/21/28) peringkat dan rating per outlet diketik.
- **Rumus Looker:** KPI = rata-rata rating per bulan per outlet · peringkat terakhir

| Data | Satu titik entri di HAWK OS | Cara | Status |
|---|---|---|---|
| Snapshot rank & rating | Tugas mingguan Hospitality (#op-tasks) atau pengambilan otomatis. Schema HAWK sudah memuat rank, rating, jumlah review dan URL bukti. | Entri sekali per kejadian | Sudah ada |

**Sisa gap:** Opsional: ambil otomatis bila Tripadvisor menyediakan akses resmi.

### 10. Maintenance Performance (`maintenance`)

- **Spreadsheet sumber Looker:** 04 Maintenance (2025 & 2026)
- **Cara isi sekarang:** Satu baris per pekerjaan: tanggal & jam lapor, jam respon, urgensi, kategori, outlet, status, dikerjakan oleh.
- **Rumus Looker:** Response time = rata-rata (waktu respon − waktu lapor) · jumlah per kategori · % selesai

| Data | Satu titik entri di HAWK OS | Cara | Status |
|---|---|---|---|
| Tiket maintenance | Form maintenance Operational (Attendant/Security → Supervisor). Waktu lapor, respons, selesai per tiket. | Entri sekali per kejadian | Sudah ada |
| Urgensi, dikerjakan oleh, mulai dikerjakan | Field baru pada form maintenance. Sama dengan kolom RESPON NEEDED, Dikerjakan oleh, Tgl Pengerjaan di sheet. | Entri sekali per kejadian | Ditambah di build ini |
| Kategori lengkap | Pilihan kategori disamakan dengan sheet 2026. Ditambah Infrastruktur/Civil, Plumbing, Preventive. | Entri sekali per kejadian | Ditambah di build ini |
| Aset terkait | Register Aset NV-53..56. Ticket/asset reference menautkan ke aset. | Data induk | Butuh backend |

**Sisa gap:** Tidak ada untuk entri; tautan aset menunggu backend.

### 11. Grading FO (`grading`)

- **Spreadsheet sumber Looker:** 20 Grading FO
- **Cara isi sekarang:** Tracker 32 tahapan program (modul, SOP, evaluasi 3/6/12 bulan) dengan bobot, PIC dan status selesai/proses.
- **Rumus Looker:** Progress = bobot jika selesai, ½ bobot jika proses · total = Σ progress ÷ Σ bobot
- **Target / kode ekspektasi:** 100% program

| Data | Satu titik entri di HAWK OS | Cara | Status |
|---|---|---|---|
| Tahapan program | Form grading (Hospitality Manager). Update status tahapan; progress dihitung otomatis. | Entri sekali per kejadian | Sudah ada |
| Hasil grade per FO | Assessment kompetensi + HRD. Grade C/B per karyawan disimpan di HRD sebagai riwayat. | Entri sekali per kejadian | Butuh backend |

**Sisa gap:** Aturan "proses = ½ bobot" perlu dikonfirmasi Owner.

### 12. Team Competency (`competency`)

- **Spreadsheet sumber Looker:** 19 Kesiapan SDM (per outlet)
- **Cara isi sekarang:** Matrix 0/1 per karyawan: ±24 skill treatment terapis, 15 item system knowledge FO, 2 item basic attendant.
- **Rumus Looker:** Skor = item tercapai ÷ item dinilai per karyawan · kesiapan outlet = rata-rata skor per departemen

| Data | Satu titik entri di HAWK OS | Cara | Status |
|---|---|---|---|
| Assessment per karyawan | Form assessment (Assessor/Head/Hospitality). achieved ÷ possible per instrumen. | Entri sekali per kejadian | Sudah ada |
| Daftar item per departemen | Master instrumen kompetensi. Item treatment/FO/attendant disimpan sekali sebagai versi instrumen. | Data induk | Butuh backend |
| Data karyawan | Master karyawan HRD. Tidak ada ketik ulang nama/jabatan. | Otomatis | Sudah ada |

**Sisa gap:** Master item per departemen perlu disusun dari matrix yang ada.

### 13. Grooming Karyawan (`grooming`)

- **Spreadsheet sumber Looker:** 18 Grooming · 17 Daily Ceklist 5S
- **Cara isi sekarang:** Per outlet per hari hanya 1/0 "sudah dicek / checklist terisi". Pola 0/1 kedua sheet identik (indikasi disalin).
- **Rumus Looker:** % kepatuhan = hari dengan cek tersubmit ÷ hari operasional
- **Target / kode ekspektasi:** 100% kepatuhan

| Data | Satu titik entri di HAWK OS | Cara | Status |
|---|---|---|---|
| Grooming per karyawan | Form grooming (Head/Supervisor saat briefing). Hasil Sesuai / Perlu perbaikan per employeeRef; lebih rinci dari 1/0. | Entri sekali per kejadian | Sudah ada |
| Checklist 5S harian | Daily Operations checklist (#op-daily). Kepatuhan dihitung dari checklist yang ditandatangani Supervisor. | Otomatis | Sudah ada |

**Sisa gap:** Kartu kepatuhan 5S di dashboard dibaca dari checklist harian (rumus sama).

### 14. Bisnis Proses (`process`)

- **Spreadsheet sumber Looker:** 21 Bisnis Proses
- **Cara isi sekarang:** Register 44 bisnis proses/SOP: tahun, approved 100%/0%, status tercapai, prioritas per peran FO/Therapist/Attendant/SPV.
- **Rumus Looker:** % bisnis proses approved = SOP approved ÷ total SOP
- **Target / kode ekspektasi:** 100% approved

| Data | Satu titik entri di HAWK OS | Cara | Status |
|---|---|---|---|
| Dokumen bisnis proses | Register SOP + alur persetujuan. Status draft → review → approved; persentase otomatis. | Entri sekali per kejadian | Sudah ada |
| Peran terkait | Field departemen pemilik. SOP tampil di checklist / tugas peran terkait. | Entri sekali per kejadian | Sudah ada |

**Sisa gap:** Tidak ada.
