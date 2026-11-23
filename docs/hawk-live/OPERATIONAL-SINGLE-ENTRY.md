# HAWK Operational · Satu sumber entri untuk 14 Dashboard Kinerja

Status: frontend demo, **simulasi**. Dikoreksi 22 Nov 2026 (A03) di Hawk-RnD: label status diganti rencana REUSE/INTEGRATE/EXTEND/BUILD plus tingkat bukti K/P/D/X dengan endpoint. **Ini rencana, bukan integrasi live; belum ada integrasi teruji.** Peta lengkap: `OPERATIONAL-A03-EXISTING-MAP.md`.

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
3. **Data induk**, di-set sekali: target, master ruang dan jam kerja, instrumen kompetensi, histori tamu 2015–2025 (legacy aggregate).

Tujuannya: tidak ada spreadsheet entri lagi untuk metrik yang sudah punya sumber live, dan total atau persen tidak diketik manual. Ini target desain; sampai adapter teruji, angka di preview tetap simulasi.

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
  - field demo "target revenue room harian (definisi sheet 05)" dan "jumlah treatment (POS)". Ini field form demo, bukan editor master.
  - kartu **Treatment / terapis / hari**, setara Looker "Utility Terapis". Estimasi 60 menit per treatment bila jumlah treatment kosong adalah **demo saja**, bukan KPI live; live memakai `/spa-home/dashboard/therapist-util`.
- Semua field baru bersifat opsional, sehingga catatan lama tetap valid.
- Uji: `tests/hawk-live/ops-single-entry.e2e.js`, masuk `run-all.sh`.

## Keputusan Owner yang dibutuhkan

1. SLA keluhan online (Google/Tripadvisor/WhatsApp). Offline tetap <24 jam.
2. Rumus akurasi SO: berbasis jumlah item cocok, atau nilai Rp selisih.
3. Occupancy: backend memakai jam ruang terpakai ÷ kapasitas jam × 0,75; sheet 05 memakai revenue room ÷ target Rp. Keduanya ditampilkan dengan nama berbeda; faktor 0,75 perlu disahkan.
4. Grading FO: form demo menerima persen bebas per tahap. Apakah status "proses" dihitung ½ bobot (cara sheet 20) perlu disahkan.

## Kebutuhan backend (di luar mandat frontend)

- Baca invoice POS: revenue per kategori room, terapis yang ditugaskan, customer untuk tamu baru/repeater, dan appointment. Feedback saat ini diisi staf dari gantt (`/spa-feedback/{spa_appointment_id}`); kanal tamu QR/tautan belum ada. Paritas POS masih menunggu login Owner.
- Finance NV-47..52: laporan per akun dan mapping akun ke kategori 7P. Target dibaca dari Budget 7P.
- HRD: presensi/jadwal untuk absensi dan terapis hadir, master karyawan untuk employeeRef, serta riwayat grade.
- Inventory: valuasi item untuk nilai waste, stock opname lewat `/api/invcount` (bukan NV-44, yang merupakan transfer), dan adjustment lewat `/api/invadjustment`.
- Integrasi review: Google Business Profile API dan impor Tripadvisor (akun milik Owner). Nama tamu tidak disimpan.
- Impor sekali data tamu historis 2015–2025.

## Peta per dashboard

Kolom **Rencana** = keputusan REUSE / INTEGRATE / EXTEND / BUILD, bukan status integrasi. Kolom **Bukti** = K (kode backend terbaca, belum dijalankan), P (route UI POS existing), D (demo hawk-live), X (tidak ditemukan). Belum ada integrasi teruji (T).

### 1. Revenue Overview (`revenue`)

- **Spreadsheet sumber Looker:** 01 Revenue (tab per outlet, harian)
- **Cara isi sekarang:** Supervisor/admin mengetik rekap harian dari laporan POS: revenue room, foot chair, salon, retail, jumlah invoice, tamu baru/lama. Target bulanan diketik di tab datahelper.
- **Rumus Looker:** Revenue Service = room + foot chair + salon · Avg sales = revenue ÷ jumlah invoice · % pencapaian = revenue ÷ target bulanan
- **Target / kode ekspektasi:** Target per outlet per bulan (Budget)

| Data | Satu titik entri di HAWK OS | Cara | Rencana | Bukti | Endpoint / route existing |
|---|---|---|---|---|---|
| Transaksi service & retail | POS existing (invoice). Receptionist hanya memproses transaksi di POS. Definisi booked / billed / received dan refund/void disepakati dengan Finance. | Otomatis | INTEGRATE | K,P | `/spa-appointment/progress/invoice/*` · `/spa-home/dashboard/revenue-real-time` · `/average-bill` · `/spa-finance/daily-report` |
| Target bulanan per outlet | Target setting Finance. Target dibaca dari Finance, bukan diketik di Operational. Distribusi musiman belum dicek. | Data induk | REUSE | K | `/spa-finance/target-setting` · `/spa-finance/parameter-target` |

**Sisa gap:** Adapter baca invoice POS → Operational belum dibuat dan belum diuji (T). Paritas isi POS masih menunggu login Owner.

### 2. Profit & Loss (`pnl`)

- **Spreadsheet sumber Looker:** 02 PNL (GabunganPNL, PNLalloutlet, Eficiencyutility)
- **Cara isi sekarang:** Disalin bulanan dari laporan keuangan Finance per akun (income, HPP, laundry, payroll, listrik, iklan, maintenance, dst).
- **Rumus Looker:** Laba bersih = gross sales − total expenses · Efisiensi = expense ÷ revenue (status target 10%)
- **Target / kode ekspektasi:** Target profit per outlet (Budget)

| Data | Satu titik entri di HAWK OS | Cara | Rencana | Bukti | Endpoint / route existing |
|---|---|---|---|---|---|
| Pendapatan, biaya per akun, laba | P&L per lokasi Finance. Operational hanya membaca; tidak ada entri angka keuangan. | Otomatis | INTEGRATE | K,P | `/api/profitandlost/by-location` · `/api/budgetmanager/get_budget_variance` |
| Komponen People | Payroll HRD. Di bawah top management hanya %; berlaku juga untuk ekspor dan AI. Penegakan di API belum diuji. | Otomatis | REUSE | K | `payroll_*` · `/spa-commission-detail` |

**Sisa gap:** Mapping akun GL → kategori 7P berversi dan bridge ke laba workbook 02 perlu kontrak data Finance.

### 3. Capacity & Productivity (`capacity`)

- **Spreadsheet sumber Looker:** 05 Room Utility · 0.55 Room Utility · 08 Utility Terapis · 03 Absensi
- **Cara isi sekarang:** Tiga sheet terpisah diketik: revenue room harian vs kapasitas, rata-rata utility terapis harian, jumlah sakit/ijin harian.
- **Rumus Looker:** Sheet 05 = revenue room ÷ target revenue room harian (target 70%) · Utility terapis = treatment ÷ terapis hadir per hari (target 130/bulan) · Absensi = (sakit + ijin) ÷ hari-orang terjadwal (maks 3%)
- **Target / kode ekspektasi:** Ope-Ope-Room 70% · Ope-Pro-Serv 130 · Ope-Pro-Abse ≤3%

| Data | Satu titik entri di HAWK OS | Cara | Rencana | Bukti | Endpoint / route existing |
|---|---|---|---|---|---|
| Occupancy ruang (waktu) | Engine dashboard backend. Jam ruang terpakai ÷ (hari × ruang × jam kerja × 0,75). Faktor 0,75 perlu disahkan. Berbeda dari sheet 05. | Otomatis | REUSE | K | `/spa-home/dashboard/occupancy` · `/spa-room` · `/spa-work-hour` · `/spa-blocktime-room` |
| Room revenue vs target (sheet 05) | POS invoice per kategori ruang + target Finance. Metrik terpisah dari occupancy dan diberi nama sendiri. Field kapasitas di form ini hanya demo; editor master belum ada. | Otomatis | Keputusan Owner | K,D | `/spa-home/dashboard/revenue-real-time` |
| Utilisasi terapis | Engine dashboard backend. Menit treatment status 5/6/7 ÷ (terapis aktif × target jam). Kartu treatment/terapis di demo memakai estimasi 60 menit: DEMO SAJA, bukan KPI live. | Otomatis | REUSE | K | `/spa-home/dashboard/therapist-util` · `/spa-target-hour` |
| Sakit / ijin | Jadwal + presensi HRD. Dihitung dari jadwal + presensi. Pemetaan alasan sakit/ijin perlu dicek. | Otomatis | REUSE | K,P,D | `/api/employee/data_schedule` · `/api/employee/data_attendance` · `/spa-reason` |

**Sisa gap:** Dua definisi berbeda (waktu vs Rp) harus tampil dengan nama berbeda. Belum ada adapter teruji.

### 4. Waste & Accuracy (`waste`)

- **Spreadsheet sumber Looker:** 14 Waste · 15 Akurasi SO
- **Cara isi sekarang:** Total Rp waste BHP dan retail diketik per bulan; akurasi SO diketik sebagai persen dari file stock opname Inventory.
- **Rumus Looker:** % Waste BHP = waste BHP ÷ revenue service · % Waste retail = waste retail ÷ revenue retail (batas 1%) · Akurasi SO = item cocok ÷ item dihitung (target 100%)
- **Target / kode ekspektasi:** Waste ≤1% · Akurasi SO 100%

| Data | Satu titik entri di HAWK OS | Cara | Rencana | Bukti | Endpoint / route existing |
|---|---|---|---|---|---|
| Waste / pemakaian BHP | Inventory consumption + adjustment. Dicatat sekali per kejadian: item, qty, alasan. Klasifikasi normal / berlebih / rusak perlu ditambah. Nilai Rp dari valuasi Inventory. | Entri sekali per kejadian | EXTEND | K | `/api/inventory-consumption/*` · `/spa-appointment/progress/invoice/{id}/ingredients` · `/api/invadjustment/*` |
| Stock opname | Inventory count existing. Akurasi dihitung dari baris hitung (sistem vs fisik), bukan rata-rata persen bulanan. | Entri sekali per kejadian | REUSE | K,P | `/api/invcount/*` · `/api/invadjustment/approve/{id}` |
| Pembagi revenue | POS invoice. Sama dengan dashboard Revenue. | Otomatis | INTEGRATE | K | `/spa-home/dashboard/revenue-real-time` |

**Sisa gap:** Keputusan Owner: akurasi SO berbasis item cocok, nilai Rp selisih, atau keduanya.

### 5. Customer Review (`reviews`)

- **Spreadsheet sumber Looker:** 06 Offline Feedback · 07 Online Review
- **Cara isi sekarang:** Offline: hitungan kartu feedback 5–1 bintang per hari diketik. Online: setiap review Google/Tripadvisor disalin manual satu per baris.
- **Rumus Looker:** Rata-rata bintang · % bintang 5 · jumlah feedback · feedback ÷ total tamu

| Data | Satu titik entri di HAWK OS | Cara | Rencana | Bukti | Endpoint / route existing |
|---|---|---|---|---|---|
| Feedback per kunjungan | Feedback appointment existing (diisi staf dari gantt). Satu baris aktif per appointment + tamu, 13 skor. Kanal tamu (QR / tautan) belum ada dan perlu ditambah. | Entri sekali per kejadian | EXTEND | K,P | `/spa-feedback/{spa_appointment_id}` · `/spa-feedback/guest-review-summary` |
| Review online | Snapshot review atau konektor resmi. Belum ada entitas di backend. Nama tamu tidak disimpan. | Entri sekali per kejadian | BUILD | X | — |
| Total tamu | POS. Untuk rasio feedback per tamu. | Otomatis | INTEGRATE | K | `/spa-home/dashboard/total-guest` |

**Sisa gap:** Kanal feedback tamu dan entitas review online belum ada. Konektor resmi perlu akun Owner.

### 6. Customer Satisfaction (`satisfaction`)

- **Spreadsheet sumber Looker:** 12 Konversi Offline vs Online
- **Cara isi sekarang:** Disusun ulang manual setiap bulan dari sheet 06 dan 07. Pivot KPI menjumlahkan persen antar outlet (hasil >100%, keliru).
- **Rumus Looker:** % Kepuasan = (bintang 5 + 4) ÷ total review · % Keluhan = (bintang 3 + 2 + 1) ÷ total review

| Data | Satu titik entri di HAWK OS | Cara | Rencana | Bukti | Endpoint / route existing |
|---|---|---|---|---|---|
| Semua angka | Turunan dari feedback per kunjungan + review online. Tanpa entri. Rata-rata antar outlet harus tertimbang jumlah review, bukan dijumlah. | Otomatis | BUILD | D | — |

**Sisa gap:** Bergantung pada review online (belum ada) dan kanal feedback tamu. Pemetaan skor 13 item ke bintang 1–5 perlu disepakati.

### 7. Rebooking Customer (`retention`)

- **Spreadsheet sumber Looker:** 11 Rebooking · 16 Guest 10 Years
- **Cara isi sekarang:** Jumlah tamu, tamu baru dan repeater diketik ulang harian (duplikat sheet 01); histori sejak 2015 diketik bulanan.
- **Rumus Looker:** % Repeater = repeater ÷ total tamu (target 25%) · YoY per bulan
- **Target / kode ekspektasi:** Repeater 25%

| Data | Satu titik entri di HAWK OS | Cara | Rencana | Bukti | Endpoint / route existing |
|---|---|---|---|---|---|
| Tamu baru / repeater | Customer summary POS. Returning share, rebooking conversion dan retention dibedakan. Rebooking conversion belum punya definisi window. | Otomatis | INTEGRATE | K,P | `/spa-customer/customer-summary` · `/spa-customer/{id}/treatment-history` |
| Histori 2015–2025 | Impor sekali (legacy aggregate). Ditandai legacy aggregate, tidak dicampur dengan data live. | Data induk | Keputusan Owner | X | — |

**Sisa gap:** Deduplikasi customer di POS lama perlu dicek saat migrasi.

### 8. Handling Complain (`complaints`)

- **Spreadsheet sumber Looker:** 10 Keluhan 7P · 13 Komplin Minor
- **Cara isi sekarang:** Keluhan dicatat per baris dengan tipe 7P dan karyawan terkait; rekap bulanan <24 jam / >24 jam dan satu angka "waktu handle" diketik terpisah.
- **Rumus Looker:** Jumlah keluhan per 7P per outlet · % ditangani <24 jam · rata-rata jam penanganan
- **Target / kode ekspektasi:** SLA offline <24 jam

| Data | Satu titik entri di HAWK OS | Cara | Rencana | Bukti | Endpoint / route existing |
|---|---|---|---|---|---|
| Case Hospitality | Case tunggal tertaut feedback/appointment. Belum ada di backend. Demo punya dua penghitung (form komplain dan Issue Center) yang harus disatukan. | Entri sekali per kejadian | BUILD | X,D | `/spa-reason (master alasan saja)` |
| Kategori 7P | Field pada case. People, Product, Process, Place, Facility, Promotion, Price. Field sudah ada di form demo. | Entri sekali per kejadian | BUILD | D | — |
| Karyawan terkait & kunjungan | employeeRef (master HRD) + appointment. Field sudah ada di form demo; belum tertaut ke record asli. | Entri sekali per kejadian | BUILD | D | `/api/employee` · `/spa-appointment` |

**Sisa gap:** Keputusan Owner: pemicu case dan SLA (offline dan online).

### 9. Tripadvisor Performance (`tripadvisor`)

- **Spreadsheet sumber Looker:** 09 Tripadvisor
- **Cara isi sekarang:** Snapshot mingguan (tanggal 7/14/21/28) peringkat dan rating per outlet diketik.
- **Rumus Looker:** KPI = rata-rata rating per bulan per outlet · peringkat terakhir

| Data | Satu titik entri di HAWK OS | Cara | Rencana | Bukti | Endpoint / route existing |
|---|---|---|---|---|---|
| Snapshot rank & rating | Tugas mingguan Hospitality atau pengambilan otomatis. Schema demo memuat rank, rating, jumlah review dan URL bukti; backend belum punya entitasnya. | Entri sekali per kejadian | BUILD | X,D | — |

**Sisa gap:** Entitas snapshot perlu dibangun. Pengambilan otomatis hanya bila Tripadvisor menyediakan akses resmi.

### 10. Maintenance Performance (`maintenance`)

- **Spreadsheet sumber Looker:** 04 Maintenance (2025 & 2026)
- **Cara isi sekarang:** Satu baris per pekerjaan: tanggal & jam lapor, jam respon, urgensi, kategori, outlet, status, dikerjakan oleh.
- **Rumus Looker:** Response time = rata-rata (waktu respon − waktu lapor) · jumlah per kategori · % selesai

| Data | Satu titik entri di HAWK OS | Cara | Rencana | Bukti | Endpoint / route existing |
|---|---|---|---|---|---|
| Work order maintenance | Work order bertimestamp (lapor → respons → mulai → selesai → verifikasi). Backend hanya punya update maintenance aset; lifecycle tiket belum ada. | Entri sekali per kejadian | BUILD | K,D | `/api/assetdepre/update_asset_maintenance` |
| Urgensi, dikerjakan oleh, mulai dikerjakan | Field form demo. Ditambahkan di form demo, sama dengan kolom sheet. | Entri sekali per kejadian | BUILD | D | — |
| Kategori lengkap | Pilihan kategori disamakan dengan sheet 2026. Infrastruktur/Civil, Plumbing, Preventive ditambahkan di demo. | Entri sekali per kejadian | BUILD | D | — |
| Aset & downtime ruang | Register aset + blocktime ruang. Tiket menaut ke aset dan blocktime, bukan tiket analytics kedua. | Data induk | INTEGRATE | K | `/api/groupasset/*` · `/spa-blocktime-room` |

**Sisa gap:** Lifecycle work order perlu dibangun di backend.

### 11. Grading FO (`grading`)

- **Spreadsheet sumber Looker:** 20 Grading FO
- **Cara isi sekarang:** Tracker 32 tahapan program (modul, SOP, evaluasi 3/6/12 bulan) dengan bobot, PIC dan status selesai/proses.
- **Rumus Looker:** Progress = bobot jika selesai, ½ bobot jika proses · total = Σ progress ÷ Σ bobot
- **Target / kode ekspektasi:** 100% program

| Data | Satu titik entri di HAWK OS | Cara | Rencana | Bukti | Endpoint / route existing |
|---|---|---|---|---|---|
| Tahapan program | Modul project existing atau template program. Form demo saat ini menerima persen bebas per tahap; aturan "proses = ½ bobot" belum diterapkan dan belum disahkan. | Entri sekali per kejadian | Keputusan Owner | K,D | `/api/project/* (perlu evaluasi)` |
| Hasil grade per FO | Assessment kompetensi + HRD. Grade per karyawan disimpan di HRD sebagai riwayat. | Entri sekali per kejadian | BUILD | K | `/spa-grade/*` |

**Sisa gap:** Progress proyek FO dibedakan dari kompetensi individu. Bobot tahap perlu kontrak.

### 12. Team Competency (`competency`)

- **Spreadsheet sumber Looker:** 19 Kesiapan SDM (per outlet)
- **Cara isi sekarang:** Matrix 0/1 per karyawan: ±24 skill treatment terapis, 15 item system knowledge FO, 2 item basic attendant.
- **Rumus Looker:** Skor = item tercapai ÷ item dinilai per karyawan · kesiapan outlet = rata-rata skor per departemen

| Data | Satu titik entri di HAWK OS | Cara | Rencana | Bukti | Endpoint / route existing |
|---|---|---|---|---|---|
| Assessment per karyawan | Instrumen assessment per peran. achieved ÷ possible per instrumen. Instrumen belum ada di backend. | Entri sekali per kejadian | BUILD | D | — |
| Skill terapis ↔ treatment | Matrix existing. Matrix menentukan applicability, bukan hasil assessment. | Data induk | REUSE | K | `/spa-employee-treatment/matrix` |
| Data karyawan | Master karyawan HRD. Tidak ada ketik ulang nama/jabatan. | Otomatis | REUSE | K,D | `/api/employee/*` |

**Sisa gap:** Master item per departemen perlu disusun dari matrix yang ada.

### 13. Grooming Karyawan (`grooming`)

- **Spreadsheet sumber Looker:** 18 Grooming · 17 Daily Ceklist 5S
- **Cara isi sekarang:** Per outlet per hari hanya 1/0 "sudah dicek / checklist terisi". Pola 0/1 kedua sheet identik (indikasi disalin).
- **Rumus Looker:** % kepatuhan = hari dengan cek tersubmit ÷ hari operasional
- **Target / kode ekspektasi:** 100% kepatuhan

| Data | Satu titik entri di HAWK OS | Cara | Rencana | Bukti | Endpoint / route existing |
|---|---|---|---|---|---|
| Grooming per karyawan | Checklist grooming saat briefing. Hasil Sesuai / Perlu perbaikan per employeeRef. | Entri sekali per kejadian | BUILD | D | — |
| Checklist 5S harian | Template checklist berversi (Daily Operations). Coverage (checklist terkirim) dan pass rate (item lulus) dilaporkan terpisah. | Entri sekali per kejadian | BUILD | X,D | — |

**Sisa gap:** Template checklist dan jadwal ekspektasi dari roster perlu dibangun di backend.

### 14. Bisnis Proses (`process`)

- **Spreadsheet sumber Looker:** 21 Bisnis Proses
- **Cara isi sekarang:** Register 44 bisnis proses/SOP: tahun, approved 100%/0%, status tercapai, prioritas per peran FO/Therapist/Attendant/SPV.
- **Rumus Looker:** % bisnis proses approved = SOP approved ÷ total SOP
- **Target / kode ekspektasi:** 100% approved

| Data | Satu titik entri di HAWK OS | Cara | Rencana | Bukti | Endpoint / route existing |
|---|---|---|---|---|---|
| Dokumen bisnis proses | Register SOP + alur persetujuan. Backend hanya punya master jenis dokumen. Approval dokumen dibedakan dari kepatuhan eksekusi SOP. | Entri sekali per kejadian | BUILD | K | `/api/documenttype/*` |
| Peran terkait | Field departemen pemilik. SOP tertaut ke checklist / tugas peran terkait. | Entri sekali per kejadian | BUILD | D | — |

**Sisa gap:** Register SOP berversi perlu dibangun.
