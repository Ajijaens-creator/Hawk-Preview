# Prompt untuk Claude — HAWK ERP Commercial & Sales

## Mandat dan cara kerja

Bertindak sebagai product designer, frontend engineer, dan QA untuk prototipe HAWK ERP. Bangun prototipe HTML/CSS/JS yang dapat diklik dengan fixture lokal, dimulai dari **Fase 1**. Gunakan fase berikutnya sebagai kontrak scope. Jika saya meminta beberapa fase sekaligus, kerjakan berurutan dan validasi setiap fase. Sebelum mengedit, baca AGENTS.md, HAWK-BRAND-GUIDELINES.md, HAWK-PERFORMANCE-BRIEF.md, serta source dan preview di commercial/. Pertahankan rute dan interaksi yang masih berlaku. Jika hanya menerima prompt ini, gunakan spesifikasi berikut dan catat asumsi.

Referensi visual:
- SER [AUGUST 2026] Monthly Report Komersial — https://datastudio.google.com/reporting/c16a30db-9223-40d0-8fb7-9a4b911ebf25
- HAWK ERP NV-01 — https://preview.hawk.jaens.id/#/nv/1
- Aji Creator OS — tangkapan layar Kinerja & KPI serta Ambidex & Race, jika disertakan.

Replikasi dulu susunan halaman, grid, hierarki, ukuran relatif, tipe chart, legenda, dan pemakaian warna semantik SER. Terapkan HAWK untuk shell, tipografi, warna permukaan, kontrol, badge, dan navigasi. Gunakan charcoal #191919, teks #1B1B18, canvas #F5F4F0, card #FFFEFB, garis #E3E0D7, gold #F3DB9D → #AD7D36. Gunakan gold untuk brand dan seri utama, hijau untuk hasil positif, merah untuk penurunan atau exception, dan warna kategori tambahan bila membantu. Semua indikator punya label dan angka. Ikuti NV-01 untuk konteks halaman → judul → ringkasan peran → KPI → panel detail. Jangan meniru toolbar Google Data Studio. Jangan pakai iframe laporan sebagai dashboard.

Gunakan SER sebagai referensi dimensi dan metrik. Buat angka sintetis yang realistis dengan baseline Juli–Agustus 2026 dan perbandingan tahun. Tampilkan label DATA DEMO / SIMULASI di layar. Hindari menyalin data pelanggan, kontak, biaya, dan nilai transaksi asli dari laporan. Jika panel SER belum dapat dilihat, pertahankan label yang sudah terverifikasi dan dokumentasikan desain asumsi.

Gunakan HTML semantik, CSS responsif, JS terpisah, chart SVG/CSS dengan tabel alternatif, dan fixture tanpa ketergantungan jaringan. Sediakan entry source terpisah per portal dan preview HTML mandiri. Aksi demo boleh menyimpan state lokal dan punya Reset Demo. Sediakan status kosong, error, loading simulasi bila relevan, fokus keyboard, kontras teks, filter aktif yang jelas, dan scroll tabel pada layar kecil. Jangan menghubungkan akun, mengirim pesan, membayar komisi, atau melakukan deployment. Semua integrasi, autentikasi peran, dan AI ditandai simulasi.

## Fase 1 — Shell, fixture dan Executive Summary SER

1. Logo HAWK ERP membuka pemilih **Finance → Operational → Commercial → Sales**. Commercial dan Sales punya entry dan sidebar sendiri. Pakai tautan Finance/Operational yang telah diverifikasi atau beri status rute demo. Pada mobile, pemilih tetap terlihat dan sidebar bisa dibuka lewat tombol Menu. Dukung deep link dan browser back.
2. Commercial Command Center mengikuti SER: judul Executive Performance Summary, filter periode dan outlet, empat kartu **Total Revenue, Total Customers, Effective Target Rate, Average Order Value**. Pakai gauge untuk pencapaian target. Baris kedua **Annual Revenue Comparison, Budget Realization, ROMI**. Baris ketiga **Tracking by Channel Group, Tracking by Country, Cancellation Reason by Branch**. Di bawahnya **Executive Insight**, dengan perubahan periode dan tindakan yang disarankan.
3. Seed outlet, bulan, target, campaign, lead, pelanggan anonim, aktivitas, booking, POS, budget, dan histori tahunan. Buat agregat dari fixture. Uji filter periode/outlet, reset, fallback tanpa data, dan kecocokan KPI, grafik, serta tabel. Definisikan Effective Target Rate untuk demo sebagai actual revenue ÷ target revenue dan tampilkan definisinya. Gunakan revenue per order untuk AOV, pelanggan unik untuk Total Customers, dan jelaskan denominator tiap metrik.
4. Tentukan model sumber bersama. Gunakan ID lead, campaign, customer, partner, kontrak, booking, POS, anggota dan outlet yang stabil. Simpan sumber akuisisi, kanal percakapan, jalur konfirmasi, metode sales dan kode referral sebagai dimensi terpisah. Untuk fixture, pakai transaksi POS sintetis sebagai dasar revenue, status refund, serta treatment selesai. Pisahkan nilai kontrak/pipeline dan revenue terealisasi. ROAS = revenue teratribusi iklan ÷ ad spend. ROMI demo = (kontribusi teratribusi sebelum biaya marketing − biaya marketing) ÷ biaya marketing. CAC = biaya akuisisi ÷ pelanggan baru. Denominator nol menampilkan “—”.

## Fase 2 — Commercial: Brand, Marketing & Communications

- **Brand & Communications**: pedoman merek, pesan utama, aset, kalender komunikasi dan antrean approval. Tampilkan PIC, versi dan status aset. Bentuk laporan SER: Brand Foundation dan Brand Visibility Growth.
- **Campaign Planner**: daftar dan detail campaign, tujuan, audiens, penawaran, outlet, target, channel, kalender, PIC, biaya dan referensi Budget 7P. Buat brief demo dan tautan pelacakan. Detail menampilkan aktivitas, creative, funnel dan hasil.
- **Content Studio**: papan Brief → Produksi → Review → Approved → Terjadwal → Terbit. Kartu memuat campaign, PIC, aset, tenggat dan status. Sediakan perpindahan status dengan tombol keyboard, review note dan versi aset. Kaitkan eksperimen dengan R&D Project Execution.
- **Digital Marketing**: buat tampilan Marketing Funnel Overview, Ads Performance & Profitability dan SEO Performance & Execution. Funnel lead → booking → treatment selesai, persentase antar tahap, tabel paid/organic, spend, revenue, ROAS dan CAC; SEO menampilkan traffic, conversion dan status eksekusi. Klik chart membuka baris pendukung sesuai filter.
- **Social Media Admin**: kalender publikasi, komentar/DM demo, Social Media Performance Overview dan Unit Business Social Growth per unit/outlet. Simulasikan handoff percakapan ke Sales B2C beserta campaign dan konteks.
- **Media Partner & KOL**: profil, brief, deliverable, tenggat, biaya, tracking code dan hasil campaign. Kerja sama yang menghasilkan booking melalui kontrak properti muncul pada Sales B2B.
- **Audience & Attribution**: tampilkan segmentasi, negara bila diketahui, campaign, first source, kanal kontak, jalur konfirmasi, first visit/repeat. Rekonsiliasi funnel dengan booking dan POS. Sediakan “Tidak diketahui” untuk sumber yang kosong.
- **Commercial Budget**: pagu, komitmen, realisasi dan sisa; rujukan simulasi Budget 7P, MRF/Purchasing, Inventory dan approval. Tunjukkan ID permintaan dan histori status. Gunakan fixture Finance sebagai sumber bersama.
- **AI Marketing Mentor & Commercial Advisor**: tab Komunikasi, Branding, Marketing dan Sales Handoff. Tiap saran memuat angka periode yang dipilih, tindakan, hipotesis dan KPI evaluasi. Contoh uji CTA jika chat tinggi dan booking rendah. Gunakan aturan JS deterministik dengan label simulasi dan fallback data tidak cukup.
- Uji jalur Campaign → Content → Handoff Sales → Attribution → Budget. Pertahankan konteks filter saat drill-down.

## Fase 3 — Sales Manager, Owner Eagle Eye dan B2B

- Sidebar Sales: **Sales Manager, Sales B2C & Reservasi, Sales B2B, Driver & Referral, Client Portal**, lalu grup Kinerja Tim. Owner Eagle Eye dan My Workspace adalah tampilan sesuai role. Gunakan role switcher demo.
- **Owner Eagle Eye**: revenue treatment selesai vs target, forecast bulan, kontribusi setelah biaya langsung dan komisi, B2C/B2B/referral, tren outlet, partner concentration, membership/repeat, dan permintaan tidak terlayani karena slot penuh. Buat drill-down ke booking/partner. Bedakan nilai pipeline, booking terkonfirmasi, dan revenue aktual.
- **Sales Manager**: pipeline waterfall baru/naik/turun/menang/kalah/geser, funnel dan aging, forecast commit/best case, overdue next step, renewal, partner aktif tanpa booking, serta perbandingan anggota tim. Filter periode, outlet, tim, anggota, partner, platform dan metode. Tampilkan efektivitas dari aktivitas, meeting, proposal, kontrak, booking selesai sampai kontribusi, dengan denominator dan jumlah sampel.
- **My Workspace**: tugas hari ini, akun saya, follow-up, target, aktivitas dan hasil. Setiap anggota memiliki akun demo sendiri. Riwayat tersimpan di akun partner/pelanggan ketika PIC berubah.
- **Sales B2B**: daftar hotel/villa/restoran, profil partner, kontak, lokasi, peluang, proposal, kontrak, aktivasi, booking pertama, repeat dan renewal. Pipeline prospek → kontak → kualifikasi → proposal/pilot → negosiasi → menang/kalah. Setelah menang, tampilkan jalur onboarding → aktif → booking pertama → renewal. Dukungan tiga penawaran pada satu partner: Guest Referral ke Giant Spa, On-site Treatment di properti, Spa Partnership jangka panjang. Tampilkan nilai, model biaya/komisi, kapasitas, dan penanggung jawab masing-masing. Adaptasi laporan Sales & Partnership Development SER ke Sales.
- Uji satu akun hotel dengan tiga peluang dan satu booking pertama. Aksi pindah tahap memperbarui KPI, tanpa mengubah revenue sampai transaksi demo selesai.

## Fase 4 — Sales B2C, reservasi hybrid dan Client Portal

- **Inbox reservasi**: daftar percakapan WhatsApp, sosial, email dan entri manual telepon/walk-in, filter kanal/status/penugasan, profil anonim, sumber campaign, histori, catatan dan CTA booking. Simulasikan bot menjawab dari katalog yang disetujui, memilih outlet/treatment/waktu, menawarkan alternatif dan mengalihkan ke staf dengan alasan dan konteks. Staf dapat mengambil alih, membuat booking, reschedule dan membatalkan.
- **Availability mock Operational & POS**: cek outlet, durasi, kompetensi/jam kerja terapis, kapasitas dan ruangan. Tampilkan foto tipe ruangan dan jumlah slot yang benar-benar dapat dipesan. Tampilkan nama terapis hanya saat request spesifik. Simulasikan tahan slot, kedaluwarsa, konflik slot saat konfirmasi, check-in, selesai, bayar dan refund. Seluruh kanal menggunakan satu state booking dan satu ID. Gunakan foto demo yang boleh dipakai atau placeholder yang diberi label.
- **Client Portal mobile**: Book a Treatment, My Bookings, My Visits, My Membership, Profile. Alur pilih outlet/treatment/jumlah tamu/tanggal/slot, lihat foto ruangan, request terapis, ringkasan, konfirmasi. Tambahkan reschedule/pembatalan sesuai aturan dummy, booking ulang, tier atau paket kunjungan, saldo dan masa berlaku. Kurangi saldo demo saat treatment selesai.
- **Reservation Supervisor**: antrean, waktu respons, lead ke booking, booking tanpa staf, alasan handoff, no-show, cancellation dan slot gagal. Tampilkan draft jawaban/aturan dari kasus berulang dengan status review supervisor. Uji Instagram → WhatsApp → booking online → POS → atribusi serta skenario slot terisi dan handoff.

## Fase 5 — Driver & Referral

- **Internal Sales**: daftar partner, profil, verifikasi, perjanjian berversi, kode, booking, komisi, filter status dan histori.
- **Portal mobile partner**: onboarding, status persetujuan, katalog menu/harga/durasi/foto, unduh PDF katalog demo berversi, reservasi, pesan terkait booking dan status komisi. Gunakan satu sumber katalog. Akses booking aktif setelah verifikasi/perjanjian.
- Booking telepon oleh staf dan booking mobile partner masuk ke fixture yang sama. Rekam kode dan ID partner. Tampilkan estimasi → menunggu verifikasi → disetujui → dibayar simulasi. Validasi setelah treatment selesai dan pembayaran tercatat. Pembatalan/refund menyesuaikan status. Tautkan Finance sebagai sumber approval dan payout.
- Uji driver aktif → katalog → booking → selesai → komisi. Uji driver belum aktif, pembatalan dan kode referral ganda.

## Fase 6 — Ambidex, XRace, Kinerja & KPI dan Status Tim

Implementasikan komponen bersama dengan scope Commercial/Sales dan Owner lintas departemen. Ikuti alur Aji Creator OS dengan tema HAWK. Periksa titik integrasi Target & Ambidex yang sudah terlihat pada ERP.
- **Ambidex & XRace**: Daily Race menampilkan planned, done, overdue, blocked, unplanned, verified, tracked time, workload dan issues. Weekly Race menampilkan komitmen, kapasitas, bottleneck dan eskalasi. Monthly Reflection menampilkan hasil dan pembelajaran. STRACON menyimpan keputusan, alasan, PIC, tenggat dan hasil evaluasi. Pisahkan aktivitas rutin dan eksperimen. Tugas bertaut ke campaign, booking atau akun asal.
- **Kinerja & KPI**: Overview, XScore, KPI Library dan People Performance. Tampilkan team score target bersama, rata-rata XScore personal, kontrak aktif/menunggu, dispute, data gaps. Kontrak draft → approved → activated → closed. Tampilkan target, satuan, bobot, sumber bukti, periode dan status provisional/final. Jelaskan formula demo yang dipakai, cakupan yang terukur, dan perlakuan data hilang. Owner membaca ringkasan tanpa skor pribadi. Sediakan drill-down departemen → tim → grup → individu.
- **Status Tim**: Online/Offline/Tidak diketahui dan waktu pembaruan, terpisah dari Dalam shift/Istirahat/Cuti/Di luar shift. Buat contoh anggota offline yang bekerja di lapangan. Produktivitas berasal dari bukti hasil. Role manager bisa melihat tim dan mengalihkan antrean dalam simulasi.
- Uji filter scope, bukti KPI, kontrak provisional, data belum tersedia, perbedaan skor tim dengan rata-rata individu, serta aturan akses demo.

## Fase 7 — Verifikasi lintas portal dan serah terima

- Jalankan skenario campaign → lead → chatbot/staf → booking → treatment → POS → Finance → dashboard Commercial/Sales. Jalankan B2B hotel dan driver referral, termasuk pembatalan/refund. Buktikan revenue dihitung sekali per transaksi. Cocokkan denominators, filter outlet, periode, state reset, label simulasi, dan deep link.
- Periksa desktop 1440 px dan mobile 390 px, fokus keyboard, kontras, scroll tabel, dialog logo, menu dan tooltip. Uji console error dan preview offline.
- Berikan source HTML/CSS/JS, fixture, preview HTML mandiri tiap portal, instruksi buka/reset, daftar uji yang benar-benar dijalankan, dan daftar integrasi yang masih mock. Sebutkan bagian SER yang telah diperiksa dan asumsi yang masih terbuka. Jangan klaim layar atau fase selesai jika belum bisa diverifikasi.

## Lampiran — Daftar layar yang harus dibuat per fase

Gunakan kode layar ini pada peta preview dan laporan QA. Satu kode boleh diwujudkan sebagai halaman, tab, atau panel detail sesuai jenisnya. Layar desktop harus tetap terbaca pada mobile. Tampilan bertanda **mobile** harus dirancang mobile-first. Tampilkan kondisi kosong, loading, konflik, atau error di layar asal melalui kontrol demo. Untuk tiap fase, sediakan link langsung ke layarnya serta satu jalur demo yang dapat diulang setelah Reset Demo.

### Fase 1 · Fondasi dan Executive Summary

| ID | Layar | Susunan dan interaksi |
| --- | --- | --- |
| F1-01 | Pemilih Portal | Dialog dari logo HAWK. Empat opsi berurutan, tanda portal aktif, fokus keyboard, tutup dan kembali. |
| F1-02 | Commercial Executive Summary | Filter periode/outlet di atas. Empat KPI SER, baris Annual Revenue/Budget/ROMI, baris channel/negara/pembatalan, lalu insight. |
| F1-03 | Drill-down Executive Summary | Buka kartu atau chart ke transaksi demo, definisi, periode pembanding, dan tabel data. Filter induk terbawa. |
| F1-04 | Beranda Sales | Shell, role switcher, dan rute Sales. Layar fitur yang menunggu fase berikutnya diberi status yang jelas. |

### Fase 2 · Commercial

| ID | Layar | Susunan dan interaksi |
| --- | --- | --- |
| F2-01 | Brand & Communications | Tab Foundation, Visibility, Aset, dan Kalender. Buka detail pesan, versi aset, dan status persetujuan. |
| F2-02 | Campaign Planner | Daftar dan kalender dengan filter. Buka brief campaign dan PIC dari keduanya. |
| F2-03 | Campaign Detail | Brief, penawaran, target, funnel, creative, channel dan biaya. Tautkan ke studio, atribusi, dan budget. |
| F2-04 | Content Studio | Papan status, filter PIC, kartu aset, panel review, dan perpindahan tahap. |
| F2-05 | Digital Marketing | Tab Funnel, Ads, dan SEO. Buka seri chart ke creative atau aktivitas pendukung. |
| F2-06 | Social Media | Tab kalender, inbox, dan performa unit. Demo serahkan lead ke Sales dengan konteks. |
| F2-07 | Media & KOL | Daftar partner, detail deliverable, jadwal publikasi, tracking code dan hasil. |
| F2-08 | Audience & Attribution | Funnel, segmentasi, negara dan tabel jejak source → contact → booking → POS. |
| F2-09 | Commercial Budget | Pagu/komitmen/realisasi/sisa dan detail MRF, stok, serta jejak approval. |
| F2-10 | AI Mentor | Panel di dashboard dengan empat tab, angka pendukung, tindakan, metrik evaluasi, dan label simulasi. |

### Fase 3 · Sales Manager dan B2B

| ID | Layar | Susunan dan interaksi |
| --- | --- | --- |
| F3-01 | Owner Eagle Eye | KPI target dan kontribusi, tren outlet, bauran B2C/B2B/referral, partner teratas dan detail booking. |
| F3-02 | Sales Manager Command Center | Pipeline waterfall, forecast, aging, daftar risiko dan performa tim. Klik risiko ke deal. |
| F3-03 | Channel & Method Effectiveness | Bandingkan platform dan cara jual sampai treatment/revenue, dengan jumlah sampel dan filter tim. |
| F3-04 | My Workspace | Tugas, akun saya, target, follow-up dan hasil per anggota demo. |
| F3-05 | B2B Pipeline & Accounts | Papan pipeline dan direktori hotel/villa/restoran. Filter jenis partner dan PIC. |
| F3-06 | Partner & Opportunity Detail | Kontak, aktivitas, tiga model kerja sama, proposal, kontrak, aktivasi, booking pertama, dan renewal. |

### Fase 4 · B2C, reservasi dan Client Portal

| ID | Layar | Susunan dan interaksi |
| --- | --- | --- |
| F4-01 | Reservation Supervisor | KPI antrean, handoff, respons, conversion, no-show, dan daftar masalah; buka percakapan dari KPI. |
| F4-02 | Omnichannel Inbox | Antrean, chat, kartu lead. Uji bot → handoff → ambil alih, serta tambah lead telepon. |
| F4-03 | Booking Desk | Treatment, slot HAWK, tipe ruang, request terapis, ringkasan, hold dan konfirmasi. Uji slot bentrok. |
| F4-04 | Client Booking **mobile** | Alur outlet/treatment → tanggal/slot → foto ruangan/request → konfirmasi. |
| F4-05 | My Bookings & My Visits **mobile** | Kartu status, detail, reschedule, pembatalan dan booking ulang. |
| F4-06 | My Membership & Profile **mobile** | Manfaat, saldo, masa berlaku, riwayat penggunaan dan preferensi. |
| F4-07 | Operational & POS Mock | Layar demo check-in, selesai, bayar/refund. Perubahan muncul pada booking dan dashboard. |

### Fase 5 · Driver & Referral

| ID | Layar | Susunan dan interaksi |
| --- | --- | --- |
| F5-01 | Driver & Referral Manager | Daftar partner, profil, perjanjian, status verifikasi, kode dan booking teratribusi. |
| F5-02 | Commission Review | Daftar estimasi, validasi, approval dan payout. Drill-down ke booking, POS dan aturan kontrak. |
| F5-03 | Onboarding Driver **mobile** | Profil, perjanjian, persetujuan dan status verifikasi. |
| F5-04 | Katalog & Reservasi Driver **mobile** | Foto, harga, durasi, unduh PDF, pilih slot, konfirmasi dan riwayat. |
| F5-05 | Komisi & Pesan Driver **mobile** | Status booking/komisi dan percakapan terkait booking. |

### Fase 6 · Kinerja tim

| ID | Layar | Susunan dan interaksi |
| --- | --- | --- |
| F6-01 | Daily Race | Ringkasan rencana/selesai/terlambat/terblokir, tabel individu, workload, bottleneck, dan eskalasi. |
| F6-02 | Weekly Race | Komitmen per tim, kapasitas, tren, hambatan dan tindak lanjut. |
| F6-03 | Monthly Reflection & STRACON | Tab refleksi dan keputusan, dengan bukti, PIC, tenggat, serta evaluasi. |
| F6-04 | Kinerja & KPI Overview | Team score, rata-rata XScore, kontrak, sengketa, data gaps dan filter periode/scope. |
| F6-05 | XScore & People Performance | Drill-down departemen → tim → grup → individu, scorecard dan bukti. |
| F6-06 | KPI Library & Kontrak | Definisi, target, bobot, versi, approval, aktivasi dan penutupan. |
| F6-07 | Status Tim | Status sesi, waktu pembaruan, status shift dan aksi alihkan antrean. Tampilkan contoh kerja lapangan. |

### Fase 7 · Review lintas portal

| ID | Layar | Susunan dan interaksi |
| --- | --- | --- |
| F7-01 | Peta Preview | Daftar layar yang tersedia per fase, link langsung, label role, instruksi reset dan skenario demo. |
| F7-02 | Jejak Booking | Satu timeline campaign → percakapan → booking → treatment → POS → Finance, dengan ID yang sama di semua portal. Sertakan contoh B2B, referral dan refund. |
