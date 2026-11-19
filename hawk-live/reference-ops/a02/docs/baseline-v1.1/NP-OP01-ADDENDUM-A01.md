> **Riwayat baseline v1.1.** Perubahan dashboard, sumber SER, akun Jro Okta dan Demo Center mengikuti Addendum A02. Status lama bukan bukti pengujian A02.

# NP-OP01 — ADDENDUM A01

## Frontend First, Demo Experience Center, dan POS Existing

**19 November 2026 · Arahan tambahan Owner untuk Claude / HAWK Development**  
Baseline yang sudah diberikan: HAWK-Operational-Prototype.html dan NP-OP01.md.  
Acuan interface terbaru: **prototype v1.1.0** dan **NP-FE-OP01.md**.

## 1. Kedudukan addendum

Lanjutkan dari dua file yang sudah diterima dan pekerjaan frontend yang sudah tersedia. Addendum ini memperbarui mandat serta keputusan yang disebut di bawah. Bagian lain pada baseline tetap berlaku. Bila ada perbedaan, gunakan keputusan Owner terbaru dalam addendum ini untuk scope yang bersangkutan, lalu catat perbedaannya.

Prioritas pekerjaan sekarang adalah **membangun dan menyempurnakan interface UI/UX Operational Portal existing**. Lakukan mapping awal source, route, dan komponen sebelum mengubah bagian terkait, lalu lanjutkan pekerjaan frontend dalam scope. Kalimat “reference review only” pada NP lama tidak dimaksudkan menghentikan pekerjaan prototype/frontend yang sudah diotorisasi Owner. Batas itu tetap berlaku pada backend, schema, transaksi, formula production dan perubahan di luar mandat frontend.

Scope ini tidak mengotorisasi merge, deployment, migrasi database, perubahan autentikasi production, atau transaksi nyata. Pekerjaan UI rutin dalam scope tidak perlu meminta izin ulang pada setiap fase. Jika ada hambatan tertentu, jelaskan bukti dan dampaknya, lalu lanjutkan bagian frontend yang dapat diselesaikan.

## 2. Langkah pertama Claude setelah menerima paket

1. Cocokkan dua file yang telah diterima dengan paket v1.1. Periksa versi prototype, menu Demo Experience Center, dan tujuan link POS & Receptionist. Catat delta yang diperlukan.
2. Baca addendum ini, NP-FE-OP01.md, NB/NV, feature manifest, dan POS-Existing-Parity-Checklist.md. Gunakan source modular dalam paket sebagai referensi perilaku, bukan alasan mengganti struktur aplikasi existing.
3. Catat repository/branch/commit/environment serta komponen yang akan dipakai ulang. Cocokkan dengan codebase HAWK yang benar-benar tersedia. Audit backend NP-OP00 tetap PARTIAL sampai ada bukti tambahan.
4. Sampaikan ringkasan mapping dan urutan kerja secara singkat, kemudian mulai Gelombang 1 frontend. Hindari berhenti hanya untuk meminta Owner mengirim dua belas prompt terpisah.

Jika prototype sebelumnya telah diadaptasi, terapkan perubahan yang diperlukan pada implementasi tersebut. Pertahankan pekerjaan dan fitur existing yang benar.

## 3. Keputusan wajib: POS & Receptionist

**Menu POS & Receptionist membuka https://preview.jaens.id/rnd-demo.** Pertahankan seluruh isi POS existing, termasuk Dashboard POS, Appointment Book, menu/submenu, dialog, filter, ikon/status, tindakan, permission, formula dan integrasinya.

Untuk prototype v1.1, menu utama membuka URL canonical di tab baru. Route lokal #pos adalah gateway/keterangan integrasi. Login, sesi serta kewenangan tetap mengikuti aplikasi POS existing; prototype tidak meneruskan akun demo atau mengklaim single sign-on.

Claude menggunakan source POS yang sudah dimiliki untuk memeriksa kesamaan. Isi POS-P01–POS-P16 dengan bukti file/fungsi/commit dan perbandingan UI/perilaku. Bedakan tiga status: **tautan tersedia**, **parity isi terverifikasi**, dan **integrasi data terbukti**. Isi POS setelah login belum diverifikasi dalam pemeriksaan prototype ini.

Sales Reservation Center/CRM tetap menjadi workspace Sales dengan engine POS existing yang sama pada tahap integrasi. Booking/reschedule/cancel mengikuti aturan serta RBAC; refund, price override dan exception membutuhkan izin khusus. Tidak ada pembuatan ulang engine booking, kasir, invoice atau ledger dalam pekerjaan frontend ini.

## 4. Keputusan wajib: Demo Experience Center

Tambahkan entry utama di bagian atas sidebar Operational, mengikuti pola pengalaman Finance dan brand HAWK. Prototype v1.1 sudah menyediakan referensi perilakunya:

- Scenario Test Lab: **7 skenario dan 33 langkah** untuk opening, treatment/turnover, verifikasi tugas kritis, receiving, issue/komunikasi, RACE dan budget.
- Simulator **5 Role**: Manager, Supervisor, Reception, Therapist, Attendant, membaca fixture bersama. Reception memiliki tautan POS existing. Head tetap digunakan pada alur review.
- Pandu Saya pada workspace: peralihan role dinyatakan, langkah sebelumnya/berikutnya, ringkas/tutup, pause/resume dan progres tersimpan.
- Walkthrough Owner **9 langkah** yang terpisah dari tujuh skenario; export laporan sesi dan feed aktivitas outlet.
- Tampilan normal/loading/error/retry untuk review UX; reset progres terpisah dari reset seluruh data demo.

Langkah tindakan dinilai dari record sumber, bukan klik tombol. Langkah baca diberi label review manual. Membuka POS existing tidak meluluskan transaksi atau menyatakan sinkronisasi. Semua data latihan dan chat tetap lokal; tidak mengirim pesan eksternal atau menjalankan transaksi di situs POS.

Demo Center memperluas F-OP00 dan F-OP11. Jumlah fase tetap **12**, dengan **15 route lokal** pada prototype. Register 67 item adalah cakupan desain/handoff dengan tingkat kesiapan berbeda, bukan 67 fitur backend yang sudah selesai.

## 5. Urutan pelaksanaan frontend

Gunakan rincian layar, role, aksi/data, states, acceptance, serta dependency pada NP-FE-OP01.md.

| Gelombang | Fase | Hasil yang disiapkan |
|---|---|---|
| 1 | F-OP00–03 | Shell/brand, role dan outlet, dashboard, akses POS existing |
| 2 | F-OP04–07 | Daily Operations, tugas/Head review, Therapist, readiness, receiving, komunikasi |
| 3 | F-OP08–10 | RACE/KPI, budget 7P dan reports dengan referensi data bersama |
| 4 | F-OP11 | Demo Experience Center lengkap, QA/UAT frontend dan handoff integrasi |

Selesaikan acceptance per fase dan perbaiki temuan yang relevan. Setelah suatu fase memenuhi acceptance frontend, lanjutkan fase berikutnya dalam scope. Bukti backend yang belum tersedia tetap dicatat terpisah dan tidak dilabeli sebagai fitur live.

## 6. Aturan data dan role yang tetap berlaku

- Supervisor hanya satu outlet; Manager Operational Eni Restini dan Assistant Tika dapat konsolidasi. Empat Supervisor demo: Ubud, Shanti, Triloka, Bisma.
- HRD tetap master orang/struktur; pengaturan akses portal mengikuti batas delegasi. Checkbox demo bukan keamanan server.
- Verifikasi tugas hybrid: PIC mengerjakan, Head meninjau sesuai kebijakan, Supervisor memberi assurance akhir pada tugas kritis/pengecualian. Completed dan verified disimpan terpisah.
- Attendant mencatat penerimaan fisik, Supervisor memverifikasi, Inventory existing melakukan posting. Verified tidak mengubah stok atau membuat ledger kedua.
- Finance memiliki alokasi budget, revisi dan actual. Operational membaca alokasi/mengusulkan kebutuhan; People hanya persen pada prototype. P7 Profit adalah hasil.
- KPI, bobot, target, agregasi dan X-Score resmi mengikuti workbook SER serta referensi yang diverifikasi. Pending tidak diisi angka resmi rekaan.
- Gunakan ID bersama untuk booking, tugas, ruang, issue, receipt dan sesi. Dashboard, RACE, reports serta kebutuhan HRD merujuk data yang sama tanpa input ulang.

## 7. Batas frontend dan hasil yang dilaporkan

Bangun form, tabel, filter, drawer/dialog, validasi, state transitions, responsive layout, dan shared demo adapter yang diperlukan. Setiap aksi harus memiliki hasil yang terlihat. Rancangan API berisi domain pemilik, ID/field, operasi baca/tulis, status dan error; endpoint live hanya dicatat bila ditemukan dan diverifikasi di source.

Pada akhir tiap gelombang laporkan komponen/route yang berubah, Feature ID, screenshot desktop/mobile, hasil acceptance, serta kebutuhan backend. Bedakan frontend siap ditinjau dari integrasi terverifikasi. Temuan yang perlu keputusan Owner harus konkret; pekerjaan UI yang sudah diotorisasi tetap diteruskan.

Paket prototype saat ini mempunyai **47/47 uji logika lokal lulus** dan pemeriksaan browser terarah. Hasil ini menjadi bukti prototype, bukan sertifikasi untuk perubahan source Claude. Jalankan pemeriksaan yang relevan pada hasil adaptasi masing-masing.

## 8. Pesan pembuka siap dikirim bersama paket

> Lanjutkan dari HAWK-Operational-Prototype.html dan NP-OP01.md yang sudah saya kirim. Terapkan NP-OP01-ADDENDUM-A01.md serta rincian NP-FE-OP01.md dalam paket terbaru. Prioritas sekarang frontend UI/UX Operational existing, dilaksanakan dalam empat gelombang untuk dua belas fase. Peta komponen/source dahulu, lalu lanjutkan frontend dalam scope. Pertahankan seluruh POS existing di https://preview.jaens.id/rnd-demo termasuk Dashboard POS dan Appointment Book, lalu buktikan kesesuaiannya melalui checklist parity. Tambahkan Demo Experience Center mengikuti prototype v1.1. Gunakan fixture bersama serta kontrak data yang jelas; catat kebutuhan backend untuk integrasi berikutnya. Sampaikan hasil tiap gelombang beserta bukti, tanpa mengubah backend, formula production, merge atau deploy dalam mandat frontend ini.
