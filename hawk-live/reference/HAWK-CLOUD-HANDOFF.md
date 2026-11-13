# HAWK ERP · Master Brief dan Cloud Developer Handoff

## Mulai di sini

Buka `hawk-live/preview.html`. Gunakan logo HAWK untuk memilih Finance, Operational, Commercial, atau Sales. Peta layar membuka semua ruang yang ada dalam preview. Reset Demo ada di Peta alur HAWK. Tampilan F1-01 dan F1-02 tersedia di `visual/`.

1. Baca `AGENTS.md` dan `HAWK-BRAND-GUIDELINES.md` untuk standar HAWK.
2. Baca `HAWK-CLAUDE-UI-UX-PROMPT.md` untuk instruksi eksekusi tujuh fase dan katalog 41 layar.
3. Baca `HAWK-PERFORMANCE-BRIEF.md` untuk Ambidex, XRace, KPI dan Status Tim.
4. Baca spesifikasi visual di `visual/` dan jalankan skenario di bawah.
5. Review source HAWK ERP asli sebelum memilih framework PHP, rute, skema, integrasi atau strategi deployment. Source ERP belum tersedia dalam paket ini.

## Bridge lintas portal

| Alur | Titik awal | Pemilik record resmi yang diusulkan | Dampak di portal lain |
| --- | --- | --- | --- |
| Target dan pagu 7P | Finance | Finance | Commercial membaca pagu dan mengaitkan campaign serta MRF. |
| Pengajuan dan approval | Commercial / MRF | Finance & Purchasing | Approval membentuk komitmen; posting memindahkan komitmen ke aktual. Inventory menampilkan ketersediaan dari Operational. |
| Lead dan handoff | Campaign → channel → Sales Inbox | Commercial untuk campaign; Sales untuk lead | Sumber akuisisi, kanal percakapan dan jalur konfirmasi disimpan terpisah. |
| Reservasi dan fulfillment | Sales B2C, B2B, Driver, Client | Operational untuk availability dan booking; POS untuk transaksi | Sales dan Commercial membaca status dan hasil berdasarkan ID booking. |
| Komisi | Booking referral dibayar | Finance | Partner melihat status komisi berdasarkan perjanjian. |
| Kinerja | Tugas, campaign, akun dan hasil POS | Struktur organisasi HAWK dan sumber KPI terkait | Commercial, Sales dan Owner memakai scope akses yang sesuai. |

## Formula dan uji terima sandbox

| Uji | Langkah | Hasil yang diharapkan |
| --- | --- | --- |
| Budget awal | Reset Demo | Pagu Rp25.000.000, aktual Rp3.500.000, komitmen nol, sisa Rp21.500.000. |
| Pengajuan ke aktual | Commercial Budget ajukan Rp2.000.000, setujui lalu posting di Finance | Setelah setuju komitmen Rp2.000.000 dan sisa Rp19.500.000. Setelah posting komitmen nol, aktual Rp5.500.000, sisa tetap Rp19.500.000. |
| Pagu tidak cukup | Ajukan Rp25.000.000, coba setujui | Ditolak. Komitmen, aktual dan sisa tidak berubah. |
| Campaign ke revenue | Book LEAD-001 di Sales, check-in, selesai, bayar di POS | Revenue total naik dari Rp750.000 menjadi Rp1.500.000. Revenue campaign Rp750.000. ROAS sekitar 0,14× setelah pengajuan Rp2.000.000 direalisasi. |
| Bentrok / aksi ulang | Coba booking slot yang sama atau bayar ulang via model | Ditolak tanpa record atau revenue tambahan. |
| Referral | Setujui perjanjian, aktivasi, booking, check-in, selesai, bayar, catat komisi | Komisi Rp75.000 untuk booking Rp750.000 × 10%. Pembayaran kedua ditolak. |
| Refund | Refund booking yang komisinya belum dibayar | Booking keluar dari revenue dan komisi valid. Refund dengan komisi sudah dibayar memerlukan penyesuaian Finance. |
| Kinerja tim | Verifikasi tugas di Commercial atau Sales | Jumlah selesai dan completion demo berubah di ruang tim terkait. |

Sisa = pagu − komitmen − aktual. Sandbox memakai nominal rupiah bulat dan satu campaign, satu katalog, serta satu daftar slot sederhana. ROAS demo menganggap semua MRF campaign yang sudah diposting sebagai biaya iklan. Implementasi harus memakai klasifikasi biaya iklan resmi. Nilai pipeline dan kontrak harus ditampilkan terpisah dari revenue. Dashboard harus menggunakan transaksi POS unik dengan penyesuaian refund. Finalisasi rumus margin, ROMI, biaya akuisisi, cut-off dan rekonsiliasi Finance bersama pemilik data.

## Kontrak implementasi PHP yang harus diverifikasi

- Buat adapter mock dan adapter HAWK dengan kontrak yang sama. Mulai dengan membaca kontrak, skema, akses, dan mekanisme approval dari ERP yang sudah ada.
- Tetapkan izin server per tindakan dan cakupan org/outlet. Batas akses harus berlaku juga pada filter, ekspor, detail, dan query objek berdasarkan ID. UI role switcher tetap khusus demo.
- Usulkan endpoint untuk membaca budget/campaign, membuat dan memproses MRF, membaca availability, hold/confirm booking, mencatat status POS, dan merekonsiliasi komisi. Beri error terstruktur untuk 403, konflik slot 409, validasi 422, dan retry. Gunakan idempotency key untuk mutasi eksternal.
- Jaga budget dan slot dengan transaksi serta kontrol konkurensi. Approval memeriksa ulang saldo dalam transaksi. Booking memeriksa kombinasi outlet, treatment, durasi, terapis dan ruangan, lalu mengunci kapasitas saat hold/confirm. Expiry melepas hold. Kebijakan produksi menangani reschedule, cancel, refund parsial, void dan reversal.
- Gunakan ID stabil dan audit trail: actor, waktu, perubahan, alasan, referensi transaksi. Komisi menyimpan versi kontrak dan basis perhitungan. Hubungkan ledger Finance untuk payout dan reversal. Validasi data pribadi, retention dan hak akses sebelum memakai data lapangan.
- Konfirmasi integrasi WhatsApp, sosial, email, katalog, POS, Finance, perjanjian digital, status online dan XScore sebelum menjanjikan aktivasi. Chatbot memakai sumber jawaban yang disetujui dan handoff dengan konteks. XScore mengikuti formula yang disetujui serta data gap terpisah.

## Matriks visual dan gap implementasi

| Fase | Visual / sandbox yang tersedia | Pekerjaan lanjutan dari prompt master |
| --- | --- | --- |
| 1 | F1-01 pemilih portal; F1-02 SER Executive Summary; peta bridge dan jejak atribusi | F1-03 drill-down KPI per transaksi, koneksi dataset SER dummy dengan sandbox, dan validasi visual halaman SER lain |
| 2 | Ruang Commercial untuk campaign, brand, studio, digital, sosial, KOL, budget, mentor, dan atribusi | Kalender, workflow konten penuh, approval aset, laporan per kanal dan semua interaksi detail sesuai katalog layar |
| 3 | Ringkasan Sales/Owner, hasil booking, pipeline hotel dan tiga model kerja sama | Forecast, waterfall, drill-down, akses per anggota, detail akun/kontrak dan hasil aktivitas |
| 4 | Lead multi-kanal, handoff, booking desk, Client Portal ringkas dan status POS | Chatbot percakapan, hold expiry, foto, pilihan terapis, membership, reschedule dan dashboard supervisor |
| 5 | Onboarding perjanjian, aktivasi, booking referral dan payout demo | Layout mobile lengkap, katalog PDF, komunikasi, persetujuan dan ledger Finance |
| 6 | Daily Race ringkas, status sesi/shift demo dan completion KPI | Weekly Race, Reflection, STRACON, XScore, KPI Library, scope drill-down dan presence |
| 7 | Peta rute dan uji model lintas portal | Uji browser, aksesibilitas, role, transaksi simultan, UAT lapangan dan deployment |

## Instruksi eksekusi untuk cloud developer

Gunakan dokumen ini sebagai indeks paket dan prompt master sebagai kontrak fitur. Pertahankan identitas HAWK dan gunakan SER untuk hierarki dashboard. Kerjakan fase sesuai urutan, mulai dengan audit repo dan penyelesaian gap Fase 1. Untuk setiap fase, serahkan tautan preview per layar, diff source, fixture, daftar uji yang dijalankan, dan keputusan arsitektur yang masih terbuka. Jalankan UAT dengan data sintetis dan role demo terlebih dahulu. Gunakan lingkungan staging terpisah untuk integrasi HAWK dan uji lapangan. Preview ini adalah sandbox lokal. Ia belum memiliki PHP, akun pengguna sungguhan, layanan API, atau deployment.
