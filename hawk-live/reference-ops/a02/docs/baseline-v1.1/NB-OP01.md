> **Riwayat baseline v1.1.** Perubahan dashboard, sumber SER, akun Jro Okta dan Demo Center mengikuti Addendum A02. Status lama bukan bukti pengujian A02.

# NB-OP01 — HAWK Operational Business Blueprint

Versi 1.1 · 18 November 2026 · Asia/Makassar  
Status: **DRAFT UNTUK PROTOTYPE DAN REVIEW** · Belum merupakan persetujuan implementasi backend atau deployment.

## 1. Hasil yang ingin dicapai

Memperluas Operational Portal HAWK yang sudah ada menjadi tempat kerja bagi Manager Operational, Assistant Spa Manager, Supervisor, Head Departemen, Receptionist, Therapist, Attendant, dan Security. POS menjadi workspace di dalam Operational, dengan akses ke POS existing pada https://preview.jaens.id/rnd-demo. Seluruh Dashboard POS, Appointment Book dan fungsi existing dipertahankan. Sales memiliki CRM serta Reservation Center sendiri dan memakai engine appointment yang sama.

Prototype HTML memperlihatkan struktur antarmuka, hak akses simulasi, perjalanan pengguna, dan hubungan antar-data. Ia bukan backend ERP, bukan sistem login aman, dan tidak melakukan transaksi nyata. Implementasi final mengikuti struktur aplikasi existing setelah audit kontrak.

**Satu input bisnis, satu sumber kebenaran per domain, banyak tampilan sesuai kewenangan.** Semua operasi lintas portal merujuk identitas transaksi yang sama. Salinan untuk analitik boleh ada dengan asal data dan versi yang jelas; tidak menjadi penulis transaksi tandingan.

## 2. Bukti dan batas pengetahuan

- NP-OP00 Report 01, Report 05 v1.1, dan Report 10 diberikan Owner dalam percakapan. Audit tersebut berstatus PARTIAL dan tidak membuktikan perilaku production terkini.
- Angka 245 router, sekitar 2.020 endpoint, dan rekap 17 kapabilitas Supervisor berasal dari laporan Claude, bukan penghitungan ulang dalam paket ini.
- Rekap Supervisor: 1 tersedia, 3 perlu integrasi, 4 parsial, 9 perlu dibangun. Kategori ini hanya berlaku pada 17 item di Report 05, bukan total fitur semua portal.
- Temuan portal mock tanpa panggilan API berlaku pada halaman/deployment yang diamati saat audit. Jangan digeneralisasi ke seluruh domain atau versi terbaru.
- Workbook SER ditautkan Owner, tetapi pembacaan lengkap beserta bukti cell/formula tidak tersedia dalam paket ini. Sepuluh indikator yang ditampilkan adalah usulan/contoh mapping untuk diskusi; bukan hasil ekstraksi workbook yang sudah diverifikasi.
- Inspeksi UI pada pekerjaan ini menemukan P1 People, P2 Product, P3 Promotion, P4 Process, P5 Place, P6 Facility; P7 Profit ditampilkan sebagai **hasil**, bukan kategori pengeluaran. Ini membuktikan rancangan frontend, bukan mapping COA atau formula backend Finance.
- Aturan X-Score, ambang Health Score, mapping accounting 7P, dan definisi KPI yang belum disetujui tetap **pending verification**. Contoh atau usulan asisten sebelumnya bukan bukti persetujuan Owner.

Referensi lengkap dan statusnya ada pada `reference-register.md`.

## 3. Keputusan yang sudah ditetapkan Owner

| ID | Keputusan bisnis/arsitektur |
|---|---|
| D1 | Isolasi outlet wajib di backend; Supervisor hanya satu outlet aktif. |
| D2 | Manager dan Assistant lintas outlet; Supervisor satu outlet; tim mengikuti peran, tugas, dan penugasan. |
| D3 | Relasi organisasi operasional additive, mereferensikan master HRD; tidak menduplikasi karyawan. |
| D4 | Interface baru memanfaatkan backend ERP existing melalui kontrak yang diverifikasi. |
| D5 | Tambahan backend `ops_*` bila diperlukan; engine, kontrak, histori, dan formula existing dipertahankan. |
| D6 | Polling terukur untuk tahap awal; interval ditentukan kapasitas dan kebutuhan. |
| OP-ADR-07 | POS workspace di Operational; Sales CRM/Reservation Center menggunakan engine POS yang sama. |
| OP-ADR-08 | Sales Reservation Agent boleh booking final, reschedule, cancel sesuai kebijakan dan RBAC. Refund, price override, pengecualian butuh izin khusus. |
| OP-ADR-09 | Attendant mencatat penerimaan fisik; Supervisor memverifikasi; Inventory melakukan posting sesuai engine existing. |
| OP-ADR-10 | Verifikasi hybrid, dapat didelegasikan ke Head; Supervisor memberi assurance dan menangani critical/exception. Manager/Assistant mengatur kebijakan sesuai delegasi. |
| OP-ADR-11 | Satu governance akses enterprise; HRD mengatur identitas/organisasi, manager portal mengelola izin tim dalam batas delegasinya. |

Persetujuan desain di atas tidak memberikan izin melakukan migration, mengubah production, mengirim pesan, menggabungkan PR, atau melakukan deployment.

## 4. Struktur orang, akun, dan navigasi

| Nama demo | Peran | Cakupan |
|---|---|---|
| Eni Restini | Manager Operational / Spa Manager | Empat outlet |
| Tika | Assistant Spa Manager | Empat outlet |
| Supervisor Ubud | Supervisor | Jaens Spa Ubud Center |
| Supervisor Shanti | Supervisor | Jaens Spa Shanti |
| Supervisor Triloka | Supervisor | Jaens Spa Triloka |
| Supervisor Bisma | Supervisor | Jaens Spa Bisma |
| Head Reception / Therapist / Attendant + nama outlet | Head Departemen | Departemen pada satu outlet |
| Receptionist / Therapist / Attendant / Security | Pelaksana | Tugas dan data yang relevan |

Nama Supervisor adalah label demo. Implementasi memakai akun personal dan ID HRD yang sah. Penambahan outlet tidak memerlukan hardcoding menu atau agregasi. Mutasi Supervisor mengganti satu penugasan aktif, bukan menambah outlet kedua; histori tetap mengikuti lokasi saat kejadian.

Sidebar hanya menampilkan menu Operational. Perpindahan portal melalui popup logo HAWK sesuai RBAC. Sales, Finance, HRD, dan Commercial pada popup merupakan konteks integrasi; prototype ini tidak mengklaim membangun seluruh portal tersebut.

## 5. Dua belas fase

| Fase | Fokus | Hasil utama | Dependensi |
|---|---|---|---|
| F-OP00 | Foundation & Existing Mapping | Brand, route, komponen, register bukti dan data contract | Referensi Owner |
| F-OP01 | Organization & Access | Demo akun, outlet scope, Settings roles/permissions | OP00 |
| F-OP02 | Management Dashboard | Manager, Assistant, Supervisor, status operasional | OP01 + data sumber |
| F-OP03 | POS & Reception existing | Gateway ke POS canonical; parity seluruh dashboard, Appointment Book, menu, action dan integrasi | OP01 + kontrak POS + parity checklist |
| F-OP04 | Daily Operations | Opening, briefing, handover, closing, EOD | OP01 + kebijakan |
| F-OP05 | Workforce, Tasks & Therapist | Tugas, Head review, Supervisor assurance, workspace mobile | OP03–04 + HRD |
| F-OP06 | Room, Facility & Inventory | Turnover, readiness, maintenance, receiving dan request | OP03–05 + Inventory |
| F-OP07 | Communication & Issues | Channel, thread tugas, issue, SLA/escalation | OP01 + OP04–06 |
| F-OP08 | SER, Ambidex & RACE | Kontrak KPI, Daily/Weekly/R2Re/Reflection/STRACON, struktur X-Score | Workbook + OP03–07 |
| F-OP09 | Finance Budget Interface | Alokasi, actual, commitments, usulan aktivitas, privacy People | Kontrak Finance + OP01 |
| F-OP10 | Reports & Analytics | EOD, kualitas, kinerja, distribusi outlet, source lineage | OP02–09 |
| F-OP11 | Integration Readiness & UAT | Contract mapping, security, regression, UAT, handoff | Semua fase sebelumnya |

Tepat 12 fase. Penomoran ini tidak mengganti NP-OP00 audit dan tidak mengganti fase proyek JAENS Enterprises atau Holywing MOS. Tabel ini adalah cakupan tujuan. Status yang benar-benar tersedia pada HTML ada di `prototype-coverage.md` dan `feature-manifest.json`: 67 item scope, bukan 67 fitur production selesai.

## 6. Menu dan sumber data

| Menu | Pemilik sumber data | Yang dibangun/diperluas |
|---|---|---|
| Dashboard | Read model dari POS, HRD, Inventory, Operational, Performance | Agregasi dan tampilan berdasarkan role |
| POS & Reception | POS existing https://preview.jaens.id/rnd-demo | Akses dari Operational; isi, fungsi, formula dan integrasi existing tetap sama |
| Daily Operations | Operational | Template, checklist runs, briefing, handover, EOD sign-off |
| Team & Tasks | Operational; identitas/shift dari HRD | Task, policy review, assignment, histori |
| Therapist Workspace | POS + HRD + Operational | Jadwal, fokus treatment simulasi, tugas, feedback |
| Room & Facility | Room master POS; kesiapan fisik Operational | Cleaning/readiness/maintenance dengan histori |
| Inventory Coordination | Inventory & Purchasing di Finance | Penerimaan fisik, verifikasi, material request; referensi ledger |
| Communication & Issues | Shared Communication + Operational Issues | Thread pekerjaan, channel, notifikasi, eskalasi |
| Ambidex & RACE | Performance contract; actual dari domain terkait | Kontrak berversi, cadence, evidence, review, score snapshot |
| Budget | Finance | Tampilan alokasi/realization dan pengajuan; tidak membuat budget engine lokal |
| Reports | Read model dari domain sumber | Laporan terukur dengan periode, definisi, coverage, freshness |
| Settings | Shared IAM/HRD + policy Operational | Akses efektif, permission matrix, aturan verifikasi |

## 7. Workflow utama

### 7.1 Reservasi sampai pelayanan

1. Sales/Customer Portal menerima permintaan; CRM menyimpan lead dan komunikasi.
2. Availability dibaca dari engine POS dengan outlet, jadwal, durasi, pax, ruangan, skill dan kondisi yang sesuai.
3. Saat konfirmasi, backend memvalidasi ulang slot, harga, izin, dan bentrok secara atomik. Hasil pencarian bukan jaminan reservasi.
4. Satu appointment ID dipakai Receptionist, Supervisor, Therapist, dan Sales. Sales hanya menyimpan referensi dan atribusi yang diizinkan.
5. Operational menyiapkan ruang, tim, linen, dan kebutuhan tamu. Treatment completion tidak otomatis berarti ruangan sudah bersih.
6. Payment/invoice/refund mengikuti engine serta kewenangan existing. Cancel booking tidak sama dengan refund pembayaran.
7. Finance, HRD Performance, Sales analytics dan SER membaca actual dengan sumber dan definisi yang sama.

### 7.2 Opening sampai closing

Template area → checklist PIC → Head review bila diwajibkan → Supervisor sign-off → briefing/assignment → monitor layanan → handover → closing → EOD.

Item kritis yang gagal memicu issue; tidak boleh disembunyikan oleh persentase checklist tinggi. Handover menyimpan pekerjaan terbuka dan penerima. Closing operasional berbeda dari tutup kasir atau posting accounting.

### 7.3 Task dan verifikasi hybrid

Status usulan: `assigned → in_progress → submitted → head_review → supervisor_review → completed`; jalur `rework`, `blocked`, `cancelled` tersedia sesuai izin.

- Routine dapat selesai langsung jika aturan template mengizinkan dan evidence lengkap.
- Department review memakai Head yang ditugaskan; Head tidak otomatis memiliki seluruh hak Supervisor.
- Critical, failed, atau exception memerlukan Supervisor. Escalation di atas Supervisor mengikuti kebijakan.
- Manager/Assistant dapat mengubah kebijakan sesuai delegasi; versi lama tetap melekat pada tugas yang sudah berjalan/ditutup.
- Reviewer tidak boleh diam-diam menghapus evidence atau mengganti PIC historis. Self-approval perlu kebijakan eksplisit; default demo tidak memodelkannya sebagai akses bebas.

### 7.4 Room lifecycle

Room master dan okupansi booking berasal dari POS. Operational menulis status fisik dan pemeriksaan: needs-cleaning, cleaning, awaiting-check, ready, maintenance/closed. Read model menampilkan status efektif dari dua dimensi tersebut.

Occupied tidak diubah oleh tombol cleaning. Ready fisik tidak membatalkan booking. Maintenance/readiness harus diperhitungkan dalam layanan availability melalui kontrak resmi, bukan perubahan ad hoc pada tabel POS.

### 7.5 Receiving dan stok

Dokumen PO/transfer existing → Attendant hitung fisik/kondisi → catat selisih/evidence → Supervisor verifikasi → Inventory posting sesuai aturan → ledger reference tampil pada Operational.

Penerimaan parsial dan selisih harus punya status jelas. Verifikasi Supervisor bukan bukti posting stok berhasil. Request material tidak otomatis menjadi purchase order. Actual cost tidak dihitung dua kali dari penerimaan dan invoice.

### 7.6 Communication Hub

Channel outlet/departemen, thread task/issue, pengumuman dan handover menggunakan identitas enterprise. Menulis komentar tidak otomatis menyelesaikan task. Tautan objek selalu memeriksa izin baca objek. Cross-portal escalation hanya membagikan informasi yang diperlukan; Supervisor tidak mendapatkan akses outlet lain.

Dalam prototype, pesan hanya disimpan lokal. Tidak ada WhatsApp, email, SMS, atau pengiriman kepada orang sungguhan.

## 8. SER, RACE, Ambidex dan X-Score

Nama kerja yang dirujuk dalam perencanaan adalah SER, Race Vegen, Race Beacon dan Race Success Factors. Ejaan, judul lengkap sheet dan relasinya harus dicocokkan langsung dengan workbook pada F-OP08. Label yang pernah disebut dalam percakapan tidak menjadi bukti bahwa seluruh workbook telah diekstrak.

Prototype menampilkan sepuluh **usulan/contoh indikator operasional** untuk mendiskusikan struktur data dan layar. Nama, jumlah, target, bobot, unit, PIC serta formula belum boleh dipakai sebagai kontrak KPI resmi. Seluruhnya perlu dicocokkan dengan workbook Owner; tambah, gabung, atau hapus contoh sesuai bukti sumber.

Kontrak per indikator minimal: ID, sumber sheet/range, definisi, role/PIC, outlet/departemen, unit, target, actual source, arah pencapaian, bobot, periode, versi, evidence, reviewer, missing-data rule, dan aggregation rule.

Daily RACE, Weekly RACE/R2Re, Monthly Reflection, STRACON tersedia sebagai struktur workflow. Field rinci dan perilaku referensi AJI Creator diperiksa dalam fase OP08, tidak dianggap sudah diaudit.

Empat tingkat keluaran: individu → departemen → outlet → seluruh Operational. Skor parent tidak dihitung dengan menjumlah persentase child. Aggregation memerlukan definisi tersendiri; persentase biasanya perlu pembilang/penyebut atau bobot yang disetujui. Coverage data ditampilkan terpisah dari score.

Prototype menampilkan **formula pending / belum dihitung** untuk X-Score resmi. Contoh achievement indikator diberi label simulasi dan tidak menentukan gaji atau penilaian ketenagakerjaan.

## 9. Finance budget dan akses People

Finance memegang target revenue, anggaran tahunan, revisi, distribusi periode, OPEX/CAPEX, dan realisasi accounting. Operational fokus Process, Facility dan Place/maintenance sesuai klasifikasi Finance yang akan diverifikasi.

Alokasi bulanan mengikuti bobot seasonality yang dapat disetel Finance; anggaran mingguan/triwulan adalah turunan atau tampilan periode, bukan anggaran tambahan. Jumlah alokasi harus cocok dengan sumber dan versi yang disetujui. Sisa budget harus menggunakan definisi Finance untuk actual serta commitment yang belum terealisasi agar tidak terhitung ganda.

UI referensi Finance NV-16 mengonfirmasi P1 People, P2 Product, P3 Promotion, P4 Process, P5 Place, P6 Facility; **P7 Profit adalah hasil**, sehingga tidak dialokasikan sebagai pos belanja. Pemetaan COA, master canonical dan formula backend belum diverifikasi. UI prototype mengikuti label tersebut dengan status mapping Finance pending.

**People:** bawah top management hanya persentase relevan. Manager Operational dan Assistant tidak otomatis memperoleh nominal People. Receptionist dan staff tidak mengelola budget. Nilai payroll/nominal People tidak dimasukkan ke payload demo; menyembunyikan kolom saja tidak cukup. Hindari kebocoran melalui ekspor, tooltip, denominator, detail KPI, atau formula balik.

## 10. Settings → Team & Access

Checkbox tindakan `view/create/edit/approve/export/configure` dipadukan dengan scope `self/department/outlet/authorized_outlets`. Sebelum simpan tampilkan akses efektif dan perubahan izin.

HRD mengatur employee, status kerja dan struktur; IAM menegakkan policy; portal manager hanya dapat mendelegasikan izin yang ia boleh kelola. Tidak ada privilege escalation. Supervisor tetap satu outlet walaupun checkbox diubah. Template role adalah titik awal; explicit deny dan restriction wajib tetap berlaku.

Demo role switcher hanya untuk meninjau UX; bukan autentikasi. Implementasi backend wajib menerapkan seluruh aturan pada request, search, export, object ID, attachment, polling dan event subscriptions.

## 11. Kriteria prototype selesai

- Dua belas fase tercantum dengan status demo dan status backend terpisah.
- Pergantian role mengubah menu dan scope; Supervisor tidak menampilkan outlet lain.
- Setidaknya alur task/review, receiving/verify, room readiness, pesan lokal, checklist, dan budget filtering dapat diperagakan dengan data demo.
- Dashboard tidak menyebut mock sebagai live; waktu pembaruan dan kondisi data kosong terlihat.
- KPI/X-Score resmi tidak direkayasa; People nominal tidak ditampilkan.
- Tampilan desktop dan mobile tetap terbaca; navigasi keyboard dan fokus dialog tersedia.
- Handoff menjelaskan mana yang dapat digunakan kembali, diperluas, diintegrasikan, dan dibangun setelah audit.

## 12. Keputusan yang masih terbuka

Definisi K1–K14 pada Report 10, rumus/bobot KPI dan X-Score, master 7P, SLA/threshold, versi release production, mapping ID HRD/location, autentikasi bersama, payload API existing, integrasi event, retensi komunikasi/evidence, serta izin khusus keuangan. Item tersebut tidak menghalangi prototype berlabel demo, tetapi menghalangi klaim integrasi atau perhitungan production selesai.

## 13. Tambahan Owner — Demo Experience Center

Owner meminta pusat pengalaman demo mengikuti pola Finance. Tujuannya agar tim dapat menjalankan proses melalui peran masing-masing dan memahami dampak satu perubahan pada workspace lain. Detailnya ditetapkan pada `Demo-Experience-Center.md` sebagai perluasan F-OP00/F-OP11; struktur tetap 12 fase.

Demo Center mempunyai Test Lab berbasis skenario dan lima panel sudut pandang role. Katalog mencakup opening, treatment/turnover, verifikasi tugas kritis, receiving, issue/communication, RACE dan budget. Tugas, booking, ruang, receipt, issue dan audit tetap menggunakan sumber fixture yang sama.

Aturan bisnis tambahan:

- Peralihan role adalah simulasi eksplisit dan tidak menambah hak akses akun production.
- Scope outlet skenario harus diketahui sebelum aksi; Supervisor tetap tepat satu outlet.
- Progress panduan tidak boleh dianggap bukti penerimaan implementasi. Hasil pemeriksaan record dan tinjauan manual ditampilkan berbeda.
- Penyelesaian tindakan harus ditentukan dari record yang benar, bukan dari klik tombol.
- Mulai, lanjut, jeda, atau tutup panduan tidak menghapus pekerjaan yang sudah tercatat. Reset fixture meminta konfirmasi yang jelas.
- Receiving terverifikasi tetap menunggu Inventory; waktu completed dan verified tetap berbeda; nominal People dan formula X-Score resmi tetap tidak disediakan.

Acceptance Demo Center melengkapi acceptance prototype sebelumnya dan tidak mengubah keputusan pemilik data atau arsitektur integrasi.

## 14. Keputusan tambahan — pertahankan POS existing secara utuh

Acuan canonical dari Owner adalah https://preview.jaens.id/rnd-demo. Tim Claude memiliki source untuk melakukan pemeriksaan. Menambahkan Operational Portal tidak mengotorisasi penggantian POS dengan mock sederhana, perubahan Dashboard POS, pengurangan Appointment Book, perubahan navigasi, formula, permission, API, atau fungsi Inventory existing.

Dalam prototype v1.1, POS & Reception membuka aplikasi existing, sementara `#pos` adalah gateway. Fixture treatment/booking untuk latihan internal Operational tetap berlabel demo dan tidak dianggap data dari POS canonical. Parity source/UI dan kontrak integrasi harus dibuktikan menggunakan `POS-Existing-Parity-Checklist.md`; tidak boleh dinyatakan selesai hanya karena tautan berhasil dibuka.
