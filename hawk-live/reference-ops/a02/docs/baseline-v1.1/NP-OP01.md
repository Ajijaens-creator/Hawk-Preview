> **Riwayat baseline v1.1.** Perubahan dashboard, sumber SER, akun Jro Okta dan Demo Center mengikuti Addendum A02. Status lama bukan bukti pengujian A02.

# NP-OP01 — Claude Developer Handoff

HAWK Operational Master Prototype v1.1 · 18 November 2026  
Status: **ACUAN REVIEW EXISTING/BACKEND DAN INTEGRASI**

**Arahan Frontend First — 19 November 2026:** gunakan `NP-FE-OP01.md` untuk pekerjaan interface UI/UX saat ini. Pemeriksaan existing menjadi langkah awal sebelum mengedit frontend terkait. Pembatasan implementasi di bawah berlaku pada backend, transaksi, migrasi serta perubahan di luar scope frontend; tidak membatalkan pekerjaan prototype/frontend yang sudah diotorisasi Owner.

## 1. Mandat

Gunakan prototype HTML dan dokumen paket ini untuk memperluas Operational Portal yang sudah ada di HAWK. Pertahankan shell, pola UI/UX yang tervalidasi, navigasi global, integrasi, transaksi, formula, dan histori existing. POS tetap workspace khusus dalam Operational dan membuka aplikasi existing pada https://preview.jaens.id/rnd-demo. Pertahankan seluruh isi Dashboard POS, Appointment Book, menu/submenu, action, permission, formula dan integrasinya. Jangan menggantinya dengan mock sederhana. Sales, Finance, HRD, dan Commercial menggunakan domain sumber yang sama sesuai kewenangan.

Paket ini adalah acuan bisnis, visual dan perilaku. Jangan menempelkan satu HTML besar langsung ke production. Pecah ke komponen, route, state, dan adapter sesuai pola repository existing setelah pemeriksaan.

## 2. Pemeriksaan awal sebelum mengubah bagian terkait

1. Baca `NB-OP01.md`, `reference-register.md`, `prototype-coverage.md`, `feature-manifest.json`, `data-contracts.json`, NV dan QA yang tersedia di paket. Bedakan 67 item scope prototype dari 17 kapabilitas Supervisor pada audit Claude.
2. Baca instruksi repository/AGENTS dan catat branch, commit, environment, serta batas akses.
3. Cocokkan source evidence dengan NP-OP00. Jangan menaikkan audit PARTIAL menjadi COMPLETE tanpa bukti baru.
4. Jalankan prototype offline dengan data demo. Catat fidelity dan workflow yang sudah diperagakan.
5. Hasilkan readiness note per fase: compatible, needs-adapter, missing-backend, unknown, serta kontrak yang harus diperiksa.
6. Kerjakan fase frontend dalam scope `NP-FE-OP01.md` yang diotorisasi. Untuk backend/integrasi yang belum diotorisasi, keluarkan rancangan dan gap terlebih dahulu. Persetujuan interface bukan izin migration, merge atau deploy.

Jangan menuntut semua audit lintas portal selesai untuk membuat UI demo; sertakan pemeriksaan referensi di fase yang membutuhkannya.

## 3. Referensi yang diperiksa pada fase terkait

| Fase | Referensi | Yang harus diperiksa |
|---|---|---|
| OP00 | https://preview.hawk.jaens.id/#/nv/47 | Brand HAWK dan versi guideline; warna, font, spacing, shell, states |
| OP00–03 | https://preview.hawk.jaens.id/hawk-live/portal#pos | Referensi shell Operational/sidebar/adapters; bukan pengganti POS canonical |
| OP03 | https://preview.jaens.id/rnd-demo | POS canonical dari Owner: seluruh Dashboard POS, Appointment Book, menu/submenu, behavior dan integrasi harus sama |
| OP01/08 | https://preview.hawk.jaens.id/hawk-live/portal#hrd-race | Hierarki, permission, workflow RACE, contract UI |
| OP08 | https://aji-creator.jaens.id/performance | Daily, Weekly/R2Re, Reflection, STRACON, formula yang benar-benar ditemukan |
| OP08 | Workbook SER dan Looker pada reference register | Semua sheet, formula, bobot, PIC, actual source, lineage dashboard |
| OP09 | Finance/HRD melalui https://preview.hawk.jaens.id/ | Master 7P, budget allocation, privacy People, actual/commitment |

Gunakan sesi browser resmi Owner. Jika login diperlukan, Owner memasukkan kredensial langsung. Jangan meminta password di chat, bypass login, atau menyalin token. Di sesi review jangan submit form, kirim pesan, menjalankan transaksi, atau mengubah konfigurasi. Jika perlu menulis data untuk menguji, usulkan akun dan dataset non-production yang terisolasi dalam readiness note.

URL production `https://spa.hawknusantara.com/jaensspa` hanya konteks sistem. Jangan login production, mengambil data sensitif, atau melakukan transaksi production tanpa mandat terpisah.

## 4. Invarian bisnis

- Supervisor hanya satu outlet aktif; pembatasan enforced server-side untuk semua akses data.
- Eni Restini = demo Manager Operational, Tika = demo Assistant. Empat Supervisor demo sesuai outlet.
- HRD menjadi master employee/structure; IAM mengatur permission; manager portal mendelegasikan dalam batasnya.
- Sales Reservation Agent boleh booking/reschedule/cancel sesuai policy. Refund, price override dan exception perlu izin khusus. Cancel bukan refund.
- Booking, appointment, room/therapist assignment, invoice/payment tetap memakai engine existing.
- Attendant physical receive → Supervisor verification → Inventory posting. Tidak ada stock ledger kedua.
- Head review dan Supervisor assurance mengikuti policy hybrid berversi.
- People nominal hanya melalui kebijakan top-management/HRD-Finance yang eksplisit; default Operational hanya persen yang diizinkan.
- X-Score/Health Score dan master 7P tidak disahkan oleh mock data. Jangan mengarang formula.
- Sidebar berisi menu portal sendiri. Portal switch melalui logo HAWK sesuai permission.

## 5. Pola kerja setiap fase

**Inspect → Map → Prototype/Implement sesuai mandat → Verify → Owner review.**

1. Inspect referensi dan source code yang relevan secara read-only.
2. Map feature ID → route/component → API/service → table/view → business owner → permission.
3. Putuskan REUSE, INTEGRATE, EXTEND atau BUILD dengan bukti. Unknown tidak otomatis berarti missing.
4. Pisahkan perubahan skin UI, fitur baru dan perbaikan engine; jangan memasukkan refactor tambahan di fase UI.
5. Gunakan adapter typed untuk demo/live. Mode demo tidak pernah mengarah ke host production.
6. Verifikasi acceptance yang menyelesaikan risiko fase. Catat hasil pass/fail/block; jangan mengklaim test yang tidak dijalankan.
7. Kirim ringkasan perubahan, bukti visual, kontrak, risiko tersisa dan permintaan release jika memang perlu. Tidak auto-merge/deploy.

## 6. Scope per fase

### F-OP00 — Foundation & Existing Portal Mapping

Inventaris komponen dan route, bandingkan guideline NV/47 dengan screenshot Owner, periksa dependency, design tokens, responsive layout dan existing portal switch. Hasil: mapping sumber, baseline screenshot yang aman, rencana route dan component tree. Jangan mengubah branding global lintas portal secara sepihak.

### F-OP01 — Organization, Outlet Scope & Settings

Audit HRD employee/location, role SPA dan authentication existing. Spesifikasikan scope per action, deny rules, delegation ceiling, active assignment, effective permission preview, audit dan revocation. UI checkbox tidak menjadi security boundary. Verifikasi penolakan request untuk outlet yang tidak diizinkan menggunakan data uji terisolasi, saat telah diotorisasi.

### F-OP02 — Manager, Assistant & Supervisor Dashboard

Mapping widget ke payload yang sah. Pisahkan booking value, actual revenue, guest count, utilization, occupancy dan quality sesuai definisi existing. Tampilkan source/freshness/coverage. Widget Health Score/BEP/Profit yang belum memiliki formula valid harus menampilkan pending/unavailable, bukan angka live.

### F-OP03 — POS & Reception

Gunakan source POS existing yang dimiliki tim Claude dan acuan canonical https://preview.jaens.id/rnd-demo. Isi seluruh `POS-Existing-Parity-Checklist.md` (POS-P01–POS-P16) sebelum menghubungkan lebih lanjut. Pertahankan Dashboard POS, Appointment Book, seluruh menu/submenu, filter, ikon/status, dialog, action, role/permission, API, formula dan fungsi Inventory existing. Prototype lokal `#pos` hanya gateway; jangan membangun ulang POS menggunakan mock sederhana.

Audit appointment/Gantt/availability/invoice/payment/retail dan status mappings sesuai source existing. Gunakan ID yang sama saat kontrak integrasi diimplementasikan. Validasi ulang booking di server, conflict handling, refund/override dan endpoint lama mengikuti engine serta kewenangan existing. Kebutuhan perubahan otorisasi harus dicatat sebagai perubahan kompatibel yang terpisah; tidak diselesaikan dengan filter frontend atau bypass.

### F-OP04 — Daily Operations

Template dan run terpisah, versi SOP, opening/closing sign-off, head checklist, handover, briefing dan EOD. Definisikan critical item, evidence, rework dan exception. Closing operasional tidak mem-posting kas/jurnal.

### F-OP05 — Workforce, Tasks & Therapist

Gunakan shift/attendance HRD dan treatment POS. Implementasikan assignment serta policy review sebagai domain Operational. Head menjadi reviewer departemen; Supervisor final assurance sesuai policy. Tidak menganggap seluruh aktivitas otomatis sebagai skor HRD. Focus timer hanya tampilan; treatment status authoritative di server.

### F-OP06 — Room, Facility & Inventory

Pisahkan status okupansi dan readiness. Hindari treatment complete → ready tanpa cleaning/check. Physical receipt referensi dokumen Inventory; discrepancy/evidence/sign-off; posting satu kali dengan idempotency. Replenishment/material request memakai transaksi Inventory/Purchasing existing yang sesuai.

### F-OP07 — Communication Hub & Issues

Thread memiliki context type/id, outlet, participants dan permission. Issue memiliki severity, PIC, deadline, resolution/evidence dan state log. Chat bukan penulis status transaksi. Retry notifikasi tidak menggandakan pesan bisnis. Outbound WhatsApp/email di luar fase UI kecuali diotorisasi terpisah.

### F-OP08 — SER, Ambidex, RACE & X-Score

Sepuluh indikator dalam prototype adalah usulan/contoh mapping; bukan hasil ekstraksi resmi workbook. Periksa workbook seluruh sheet dan referensi AJI Creator sebelum final model. Buat formula register dengan cell/formula, numerator/denominator, polarity, weight, periode, approver, version dan aggregation. Unknown tidak menjadi nol. Weekly-to-monthly dan hierarchy aggregation tidak boleh menjumlah persentase. Freeze snapshot period; koreksi menghasilkan revision yang dapat ditelusuri. Uji golden examples setelah definisi disetujui.

### F-OP09 — Budget & Finance Integration

Verifikasi master 7P asli dan pemetaan COA/cost center/activity. Finance pemilik annual allocation, reforecast dan seasonality; Operational membaca jatah dan mengajukan kebutuhan. Pastikan commitments yang sudah menjadi actual tidak dikurangkan dua kali. People nominal tidak masuk response untuk role yang hanya boleh melihat persen. API/export/tooltip dan breakdown tunduk pada aturan yang sama.

### F-OP10 — Reports & Analytics

Bangun report dari read models yang memiliki source, as-of time, period, formula version dan data coverage. HRD memakai hasil kinerja yang sama, bukan input baru. Ekspor hanya kolom dan outlet yang diizinkan. Insights awal berbasis aturan dilabeli sebagai aturan, bukan kemampuan AI yang belum dibangun.

### F-OP11 — Integration Validation & Release Readiness

Jalankan regression yang diperlukan: booking conflict, payment totals, refund effects, inventory duplicates, access isolation, task verification, budget masking dan source consistency. Lakukan UAT per role dengan data sintetis. Sediakan rollback dan deployment plan bila diminta. Owner approval tetap final sebelum merge/deploy; readiness bukan deployment.

## 7. Kontrak integrasi

`data-contracts.json` berisi model **usulan** untuk diskusi. Tidak ada endpoint di dalamnya yang boleh dianggap sudah tersedia. Update dengan endpoint/fungsi terverifikasi, commit, bukti respons, field mapping, error handling, pagination, timezone, idempotency dan concurrency.

Prioritas: gunakan API/service existing. Additive extension bukan berarti bebas menambah tabel tanpa review. Bila isolasi outlet tidak bisa dijamin tanpa perubahan auth pada endpoint lama, catat konflik D1/D5 dan ajukan desain kompatibel; jangan menyelesaikannya dengan filter frontend.

## 8. Deliverable tiap fase

- Register feature ID dengan FE dan BE status terpisah.
- Bukti source file/function/endpoint atau halaman yang diperiksa, beserta waktu/commit.
- Diff ruang lingkup, keputusan data contract dan daftar unresolved.
- Preview dengan label demo/live yang benar.
- Hasil tes yang benar-benar dijalankan; blocked evidence tetap terbuka.
- Ringkasan untuk Owner: apa berubah, mengapa, apa dipertahankan, batas hasil.

## 9. Batas audit dan implementasi

Jangan membuat akun production, migrasi, mengubah endpoint/formula, mem-posting jurnal/stok, mengirim pesan, merge, deploy, atau mengeksekusi pekerjaan di luar mandat fase. Tidak perlu meminta persetujuan ulang untuk pekerjaan read-only atau prototype lokal yang memang sudah diotorisasi. Jika approval yang dibutuhkan belum ada, selesaikan dahulu desain dan hasil review yang konkret, lalu jelaskan keputusan yang diperlukan.

**Instruksi saat paket pertama diterima:** lakukan mapping awal lalu lanjutkan frontend sesuai `NP-FE-OP01.md`. Readiness note backend dan integrasi dikembangkan pada fase yang memerlukannya; gap backend tidak menghentikan pembuatan UI demo yang dapat dilakukan dalam scope.

## 10. Tambahan v1.1 — Demo Experience Center Operational

Baca `Demo-Experience-Center.md` dan inspect `src/demo-experience.js` / `src/demo-experience.css`. Owner meminta pola pengalaman seperti [Finance Demo Center](https://preview.hawk.jaens.id/#/dx), diterapkan pada Operational. Tambahan ini termasuk F-OP00 dan F-OP11, bukan fase baru.

Saat mencocokkan dengan repository existing:

1. Temukan sidebar, routing, demo adapter, role switcher, audit state dan workspace Operational yang sudah ada. Cocokkan entry point Demo Center dengan pola Finance tanpa mengubah modul Finance.
2. Pisahkan katalog skenario, progress panduan, fixture dan record bisnis. Simpan progress secara konsisten; jangan membuat transaksi baru hanya untuk menggerakkan animasi/simulator.
3. Gunakan aksi workspace existing untuk menjalankan langkah. Pemeriksa hasil mengacu pada ID dan status record, scope outlet serta evidence. Mencatat klik tombol tidak cukup sebagai bukti keberhasilan.
4. Pisahkan hasil pemeriksaan state dari tinjauan manual, dan pisahkan keduanya dari automated test/acceptance backend.
5. Pertahankan aturan Supervisor satu outlet, Head review/Supervisor assurance, Inventory sebagai pemilik posting, People persen, dan X-Score pending.
6. Role switch, fixture reset dan kondisi jaringan simulasi hanya tersedia di lingkungan demo. Jangan menyediakan bypass otorisasi atau endpoint production melalui mode ini.
7. Implementasikan reset dengan konfirmasi yang menjelaskan dampak. Mulai/resume/pause tidak boleh mereset seluruh dataset tanpa tindakan pengguna.
8. Catat pengujian v1.1 yang benar-benar dijalankan. Hasil v1.0 tidak otomatis menjadi bukti fitur baru telah lulus.

Deliverable review: pemetaan tujuh skenario ke route/handler existing, daftar pemeriksa hasil, daftar langkah manual, scope role/outlet, rencana persistensi progress, dan gap yang menghambat demonstrasi. Implementasi atau deploy berikutnya tetap mengikuti mandat fase yang berlaku; permintaan prototype lokal ini tidak mengotorisasi perubahan production.

## 11. Gate khusus POS existing

Sebelum menyatakan akses POS di Operational selesai, bedakan tiga status: tautan/gateway tersedia, parity isi/UI terverifikasi, dan kontrak data terintegrasi. Keberhasilan membuka POS tidak membuktikan dua status terakhir.

Deliverable wajib: inventaris seluruh menu/submenu existing, bukti Dashboard POS dan Appointment Book, source commit, mapping handler/API, serta matriks POS-P01–POS-P16 dengan MATCH/GAP/BLOCKED/NOT VERIFIED. Jangan mengubah fitur Inventory existing atau formula untuk menyesuaikan contoh data Demo Center. Semua latihan lokal tetap berlabel fixture yang belum tersinkron.
