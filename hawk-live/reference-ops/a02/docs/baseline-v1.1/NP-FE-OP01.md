> **Riwayat baseline v1.1.** Perubahan dashboard, sumber SER, akun Jro Okta dan Demo Center mengikuti Addendum A02. Status lama bukan bukti pengujian A02.

# NP-FE-OP01 — Frontend First: Operational Portal

**19 November 2026 · Master execution brief untuk Claude / tim frontend HAWK**  
Basis: prototype v1.1, keputusan Owner, NB/NV/NP-OP01 dan feature manifest. Audit backend tetap **PARTIAL**.

Baca NP-OP01-ADDENDUM-A01.md untuk perubahan mandat terhadap dua file baseline yang telah diterima. Dokumen ini memberi rincian pelaksanaan frontend per fase.

## 1. Mandat utama — berikan sekali kepada Claude

Lanjutkan interface **Operational Portal existing**, memakai prototype yang sudah selesai sebagai acuan perilaku, visual, dan data demo bersama. Implementasikan komponen mengikuti framework serta struktur repository HAWK yang ditemukan. Pertahankan pekerjaan yang sudah tersedia; tentukan REUSE, EXTEND, INTEGRATE, atau BUILD berdasarkan source yang diperiksa. Jangan memulai ulang aplikasi hanya untuk menyamakan struktur prototype.

Kerjakan **frontend terlebih dahulu dalam empat gelombang**, dengan acceptance per fase. Dua belas kartu di bawah adalah satu backlog pelaksanaan, sehingga Owner tidak perlu menulis dua belas prompt atau mengizinkan ulang pekerjaan UI rutin yang sudah berada dalam mandat. Selesaikan pemeriksaan, implementasi lokal, dan bukti visual secara berurutan; laporkan keputusan yang benar-benar membutuhkan Owner.

Brief ini melengkapi NP-OP01 khusus pekerjaan UI lokal/development yang telah diotorisasi. Ia tidak memberikan izin otomatis untuk perubahan backend, migration, transaksi nyata, merge, atau deploy. Jika repository memiliki batas yang relevan, jelaskan batas dan bagian yang terdampak; lanjutkan pekerjaan UI yang tetap dapat diselesaikan. Kebutuhan API yang belum terverifikasi dicatat sebagai dependency integrasi, bukan alasan mengosongkan seluruh interface.

## 2. Cara kerja dan paket acuan

Baca `README.md`, `NB-OP01.md`, `NV-OP01.md`, `NP-OP01.md`, `feature-manifest.json`, `data-contracts.json`, `Demo-Experience-Center.md`, serta `POS-Existing-Parity-Checklist.md`. Jalankan HTML prototype dan identifikasi komponen existing sebelum mengubah source. Catat repository, branch, commit, environment, dan file yang akan disentuh. Gunakan 67 item manifest sebagai cakupan desain/handoff; jumlah itu bukan 67 backend baru atau bukti fitur production selesai.

Pertahankan brand dari [HAWK NV-47](https://preview.hawk.jaens.id/#/nv/47): shell gelap, canvas ivory, kartu putih, aksen gold, tipografi serta pola spacing yang konsisten. Gunakan token dan komponen existing bila cocok. Sidebar berisi menu Operational; perpindahan portal melalui logo HAWK. Siapkan desktop, tablet, dan mobile dengan focus keyboard, label form, dialog yang jelas, serta keadaan loading, kosong, error, tidak berwenang, dan berhasil.

Gunakan satu adapter fixture untuk seluruh halaman, dengan ID objek yang sama. Pisahkan data pekerjaan dari progres panduan. Penyimpanan demo harus mempertahankan data lama saat versi berubah; reset membutuhkan tindakan eksplisit. Jangan menyalin record tugas ke RACE atau membuat stok kedua untuk kebutuhan visual. Setiap tombol memiliki hasil yang terlihat; fitur yang belum tersedia memakai penjelasan keadaan, bukan tombol tanpa perilaku.

Kontrak masa depan berisi pemilik data, ID, field, kebutuhan baca/tulis, dan error yang harus ditangani. **Nama endpoint aktual harus ditemukan dalam source; jangan diciptakan atau dianggap tersedia.** Field usulan dalam `data-contracts.json` dibedakan dari field fixture saat ini. Mode demo tidak mengirim request transaksi ke production.

### Empat gelombang pelaksanaan

| Gelombang | Fase | Hasil review |
|---|---|---|
| 1 — Fondasi | F-OP00–03 | Shell, akun/scope, dashboard, akses POS existing dan register parity |
| 2 — Pekerjaan outlet | F-OP04–07 | Checklist, tugas hybrid, Therapist, readiness, receiving, komunikasi |
| 3 — Kendali kinerja | F-OP08–10 | RACE, KPI pending yang jujur, budget, dan laporan dari sumber yang sama |
| 4 — Pengalaman utuh | F-OP11 | Demo Center lengkap, UAT per role, regresi, dan paket handoff integrasi |

Urutan dalam gelombang mengikuti dependency kartu. Setelah acceptance UI terpenuhi, lanjutkan fase berikutnya dalam mandat. Bukti backend yang belum tersedia tetap dicatat **BLOCKED / NOT VERIFIED** secara terpisah. Jadwal dapat dipercepat dengan komponen paralel setelah shell dan kontrak fixture disepakati; penyatuan workflow tetap diuji berurutan.

## 3. Dua belas kartu fase

ID mengikuti manifest; judul lengkap mengikuti NP-OP01. Field di bawah menjelaskan fixture/kontrak UI, bukan janji schema atau endpoint backend.

### F-OP00 — Foundation & Existing Portal Mapping

- **Layar/komponen:** shell Operational, sidebar, portal switch, banner demo, token desain, adapter, entry Demo Experience Center.
- **Role/scope:** semua akun demo; menu mengikuti role dan outlet terpilih.
- **Aksi/data bersama:** navigasi, pilih akun, pilih outlet; `accountId`, `outletId`, `page`, ID fixture dan `demoExperience` tetap konsisten.
- **States:** aktif, menu dibatasi, loading, kosong, error; demo/live dibedakan secara terlihat.
- **Bukti acceptance:** component map, screenshot tiga ukuran, navigasi tanpa halaman buntu, data demo bertahan setelah reload. Entry Demo Center memakai pola Finance tanpa mengubah Finance.
- **Dependency:** tidak ada; audit shell dan guideline existing menjadi baseline fase berikutnya.

### F-OP01 — Organization, Outlet Scope & Settings

- **Layar/komponen:** pemilih akun, struktur tim, matriks checkbox permission, kebijakan review hybrid, preview akses efektif.
- **Role/scope:** Eni Restini dan Tika lintas outlet; Supervisor Ubud, Shanti, Triloka, Bisma masing-masing satu outlet; Head dan staf sesuai departemen/penugasan.
- **Aksi/data bersama:** atur delegasi demo memakai akun `id`, `role`, `dept`, `outlet`, permissions dan policies. HRD tetap master organisasi.
- **States:** boleh, ditolak, di luar outlet, perubahan belum disimpan/disimpan; akses frontend tidak diklaim sebagai keamanan backend.
- **Bukti acceptance:** pergantian akun memperbarui menu/data; Supervisor tidak dapat melihat outlet lain melalui kontrol UI; delegasi tidak melampaui batas role.
- **Dependency:** F-OP00.

### F-OP02 — Manager, Assistant & Supervisor Dashboard

- **Layar/komponen:** Command Center, ringkasan empat outlet, kartu kesiapan, antrean review, issue, booking dan stock alert.
- **Role/scope:** Manager/Assistant dapat konsolidasi; Supervisor terkunci outlet sendiri.
- **Aksi/data bersama:** filter/fokus outlet dan buka record sumber; gunakan `outlet`, room/booking/task IDs, status, timestamp, source dan coverage yang tersedia.
- **States:** demo, data belum ada, source belum terhubung, loading/error; Health Score, BEP, profit atau formula belum sah tampil pending.
- **Bukti acceptance:** perubahan task/readiness terlihat di dashboard tanpa input ulang; filter konsisten; angka demo berlabel dan tidak dinyatakan live.
- **Dependency:** F-OP01; kontrak sumber yang belum diverifikasi masuk register integrasi.

### F-OP03 — POS & Reception

- **Layar/komponen:** menu POS & Receptionist membuka [POS existing](https://preview.jaens.id/rnd-demo); `#pos` menjadi gateway/konteks integrasi.
- **Role/scope:** Reception dan role berwenang; autentikasi serta izin aplikasi POS tetap mengikuti sistem existing.
- **Aksi/data bersama:** pertahankan seluruh Dashboard POS, Appointment Book, menu/submenu, filter, action dan formula. Petakan ID appointment/room/therapist/invoice melalui source; jangan menggantinya dengan mock POS baru.
- **States:** tautan tersedia, parity terverifikasi, integrasi belum tersedia—tiga status berbeda.
- **Bukti acceptance:** isi checklist POS-P01–P16 dengan source commit dan screenshot. Membuka tautan tidak membuktikan parity atau sinkronisasi data.
- **Dependency:** F-OP01; kontrak Sales booking/reschedule/cancel mengikuti engine existing, dengan refund/override berizin khusus.

### F-OP04 — Daily Operations

- **Layar/komponen:** opening, briefing, handover, closing, EOD, checklist dan dialog sign-off.
- **Role/scope:** staf memeriksa area tugas, Head meninjau departemen, Supervisor memberi assurance akhir.
- **Aksi/data bersama:** centang pemeriksaan, catat evidence, review, sign-off; simpan outlet, jenis checklist, item ID, actor/time, `openingSigned`/`closingSigned`, serta issue carryover.
- **States:** belum selesai, siap review, perlu perbaikan, disahkan/terkunci; closing tertahan bila layanan masih aktif.
- **Bukti acceptance:** opening mengikuti alur Attendant → Head → Supervisor; issue tidak hilang setelah sign-off; closing tidak mem-posting kas atau jurnal.
- **Dependency:** F-OP01 dan F-OP03; gunakan fixture terlabel saat integrasi POS belum siap.

### F-OP05 — Workforce, Tasks & Therapist

- **Layar/komponen:** tim/shift, board dan daftar tugas, detail evidence, review, Therapist mobile serta Focus Mode.
- **Role/scope:** PIC mengerjakan; Head memeriksa departemen; Supervisor assurance tugas kritis; Manager/Assistant mengatur kebijakan.
- **Aksi/data bersama:** mulai, submit, return, review, verify; `taskId`, `assignee`, `dept`, `critical`, `completedAt`, `verifiedAt`, evidence dan `bookingId` tetap tertaut.
- **States:** todo, doing, Head review, Supervisor review, selesai; self-completion dibedakan dari verifikasi reviewer.
- **Bukti acceptance:** tugas kritis tidak selesai hanya karena PIC submit; finish treatment perlu konfirmasi dan menghasilkan satu turnover task. Timer tidak mengakhiri layanan otomatis.
- **Dependency:** F-OP01, F-OP03, F-OP04; shift/presensi tetap milik HRD.

### F-OP06 — Room, Facility & Inventory

- **Layar/komponen:** room board, inspeksi/readiness, maintenance, stok outlet, material request, receiving/discrepancy.
- **Role/scope:** Attendant mencatat kondisi dan penerimaan fisik; Supervisor memverifikasi; Inventory dalam Finance memegang posting.
- **Aksi/data bersama:** periksa ruang, catat jumlah/evidence, verifikasi dokumen; gunakan `roomId`, `taskId`, receipt ID/reference, expected/received, unit, status dan actor.
- **States:** occupied, cleaning, ready, maintenance; receiving belum diperiksa, selisih, perlu verifikasi, menunggu posting.
- **Bukti acceptance:** selesai treatment tidak langsung Ready; readiness tidak menghapus okupansi; receiving verified tidak menaikkan stok fixture; request tidak membuat ledger kedua.
- **Dependency:** F-OP03–05; item/master/dokumen tetap mengacu Inventory existing.

### F-OP07 — Communication Hub & Issues

- **Layar/komponen:** channel outlet/departemen, percakapan terkait task, Issue Center, detail resolusi dan log aktivitas.
- **Role/scope:** peserta sesuai outlet/departemen; Supervisor mengoordinasi exception dan tindak lanjut.
- **Aksi/data bersama:** tulis pesan lokal, tautkan tugas, buat tugas penanganan, catat resolusi; gunakan `messageId`, channel, author, outlet, `taskId`, `issueId`, severity dan evidence.
- **States:** kosong, terkirim lokal, issue terbuka/terselesaikan, konteks tidak berwenang, simulasi gagal/retry.
- **Bukti acceptance:** satu issue tertaut ke tugas yang sama; pesan tidak mengubah approval; penyelesaian issue tidak otomatis melepaskan maintenance. Tidak ada WhatsApp/email/pesan eksternal yang dikirim.
- **Dependency:** F-OP01, F-OP04–06.

### F-OP08 — SER, Ambidex, RACE & X-Score

- **Layar/komponen:** kontrak/indikator, Vegen/Wagon dan Beacon sesuai verifikasi istilah, Daily, Weekly/R2Re, Monthly Reflection, STRACON, X-Score.
- **Role/scope:** individu, Head/departemen, Supervisor/outlet, Manager sebagai race leader konsolidasi.
- **Aksi/data bersama:** baca Task ID sumber, simpan sesi/draf pembelajaran; `type`, outlet, period, `sourceTaskIds`, title, summary, blocker dan commitment.
- **States:** draft, review yang diusulkan, evidence tersedia, formula/target/bobot belum diverifikasi; unknown tidak menjadi nol.
- **Bukti acceptance:** perubahan tugas terlihat di Daily tanpa input ulang. Kontrak KPI dan X-Score resmi tetap pending workbook; contoh indikator tidak diklaim hasil ekstraksi resmi.
- **Dependency:** F-OP03–07; pelajari workbook SER, Looker, HRD RACE dan Aji Creator pada fase ini.

### F-OP09 — Budget & Finance Integration

- **Layar/komponen:** budget tahunan/triwulan/bulanan/mingguan, distribusi musiman, actual/komitmen/sisa, usulan aktivitas, People persen.
- **Role/scope:** Manager/Assistant/Supervisor sesuai izin; Finance pemilik alokasi, revisi dan actual; People nominal tidak disediakan pada prototype Operational.
- **Aksi/data bersama:** pilih periode, buka rincian, simpan usulan; outlet, kategori P, activity, amount, period, version dan `committed=false` untuk draf.
- **States:** alokasi demo, tersedia, usulan draft, sumber belum tersambung; P7 Profit tampil sebagai hasil, bukan belanja.
- **Bukti acceptance:** usulan tidak mengurangi saldo atau membuat PO/jurnal; tooltip/export tidak membocorkan nominal People; subtotal kategori dinyatakan jelas.
- **Dependency:** F-OP01, F-OP06; periksa master 7P Finance/HRD sebelum mapping final.

### F-OP10 — Reports & Analytics

- **Layar/komponen:** ringkasan, bukti/review, Operational log, filter periode/outlet/departemen dan ekspor yang diizinkan.
- **Role/scope:** Manager konsolidasi, Supervisor satu outlet, Head/staf mengikuti akses efektif.
- **Aksi/data bersama:** telusuri hasil ke record sumber; gunakan object ID, outlet, actor, waktu, periode, coverage dan status verifikasi.
- **States:** ada data, kosong, cakupan terbatas, sumber pending; insight berbasis aturan dilabeli sesuai kemampuan sebenarnya.
- **Bukti acceptance:** angka/daftar konsisten dengan dashboard dan tugas; export mematuhi kolom serta outlet yang diizinkan; hasil yang dibutuhkan HRD memakai referensi kinerja yang sama.
- **Dependency:** F-OP02, F-OP04, F-OP08, F-OP09.

### F-OP11 — Integration Validation & Release Readiness

- **Layar/komponen:** Demo Experience Center, Scenario Test Lab, Simulator 5 Role, dock Pandu Saya dan Validation Lab.
- **Role/scope:** role/outlet demo dinyatakan sebelum berpindah; lima panel memakai satu fixture, bukan lima aplikasi remote.
- **Aksi/data bersama:** start, pause, resume, previous/next, close, export dan reset terkonfirmasi; progres menyimpan scenario, outlet, step, baseline dan referensi record.
- **States:** menunggu tindakan, bukti state terpenuhi, ditinjau manual, paused, selesai, fixture berubah, loading/error/retry.
- **Bukti acceptance:** tujuh skenario/33 langkah; Owner tour sembilan langkah terpisah. Klik saja tidak meluluskan mutasi; reload mempertahankan progres; reset progres tidak menghapus pekerjaan.
- **Dependency:** F-OP00–10; hasil UAT frontend tidak diklaim sebagai uji backend atau izin release.

## 4. Bukti selesai dan handoff berikutnya

Pada akhir setiap gelombang, kirim ringkasan singkat: komponen/route yang berubah, feature ID terkait, screenshot desktop/mobile, satu rekaman atau rangkaian screenshot workflow utama, hasil acceptance PASS/FAIL/BLOCKED, dan dependency integrasi. Sertakan diff serta cara menjalankan preview lokal. Jangan melabeli fitur sebagai production-ready hanya karena UI sudah berfungsi.

Pertahankan dua status terpisah: **frontend siap ditinjau** dan **backend/kontrak terverifikasi**. Untuk dependency, catat domain pemilik, field/ID, operasi yang diperlukan, sumber yang sudah diperiksa, dan bukti yang masih kurang. Tim backend dapat mengikuti urutan yang sama tanpa mengubah arti data atau membuat entry ganda.

Selesaikan UI yang dapat diuji dengan fixture, tangani temuan regresi yang relevan, lalu siapkan review Owner. Perubahan engine, formula resmi, integrasi live, merge dan deployment tetap merupakan langkah tersendiri dengan hasil konkret yang dapat ditinjau.
