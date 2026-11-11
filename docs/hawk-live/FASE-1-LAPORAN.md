# HAWK four-portal · Laporan Fase 1

Tanggal: 11 November 2026 · Branch: `claude/project-thread-gcon14` · Status: **siap ditinjau, belum di-merge ke main**.

## Link preview (publik, tanpa login, noindex)

Branch preview: https://hawk-jaens-preview-git-claude-proj-45c2b2-jaens-enterprises-pro.vercel.app/hawk-live/  
Dibuka publik atas keputusan Owner 11 Nov 2026 (env `PREVIEW_PUBLIC` khusus branch ini + Vercel Authentication dimatikan). Untuk mengunci lagi: hapus env tersebut lalu redeploy.

## Desain dikunci ke HAWK Brand & UI (11 Nov 2026)

Atas permintaan Owner, tampilan diulang agar sama dengan HAWK ERP live (https://preview.hawk.jaens.id/, NV-01): preview kini memakai `assets/css/hawk.css` yang sama (sidebar hitam bermodul F/O/C/S, topbar charcoal, role chip, banner DEMO, kode layar emas, hero gelap-emas, KPI gradien, tabel header hitam). `style.css` hanya komponen tambahan tanpa token sendiri. Aturan lengkap: `hawk-live/DESIGN-LOCK.md`; penjaga: `tests/hawk-live/design-lock.test.js` (15/15).

## Layar Fase 1

| Kode | Layar | Rute | Status |
|---|---|---|---|
| F1-01 | Pemilih Portal | `/hawk-live/#picker` (atau klik logo) | Selesai. Empat opsi berurutan, Portal aktif bertanda gold + teks, fokus tetap di dialog, Escape/×/klik backdrop menutup, fokus kembali ke logo. Mobile: logo di top bar + tombol Menu. |
| F1-02 | Commercial Executive Summary | `/hawk-live/#commercial` | Selesai. Filter periode (Jul/Agu 2026) + outlet (Ubud, Shanti, Bisma tanpa data), Kondisi data (normal/loading/error simulasi), ringkasan peran, 4 KPI SER, baris Annual/Budget/ROMI, baris Channel/Country/Cancellation, Executive Insight (aturan deterministik). |
| F1-03 | Drill-down Executive Summary | `/hawk-live/#commercial-drill?metric=revenue&period=2026-08&outlet=all` | Selesai. 10 metrik (tab), definisi + pembilang/penyebut, periode pembanding (bulan lalu + YoY), rincian per outlet, tabel transaksi POS dengan detail ID (booking, lead, pelanggan, kanal, jalur konfirmasi, metode, partner/kode), pencarian ID, paginasi. Filter induk terbawa saat masuk dan kembali. |
| F1-04 | Beranda Sales | `/hawk-live/#sales-home` | Selesai. Sidebar Sales sesuai urutan brief + grup Kinerja Tim, role switcher demo, revenue B2C/B2B/Referral dari dataset yang sama, status tiap layar dan fasenya. |
| F7-01 | Peta Preview (dikerjakan lebih awal) | `/hawk-live/#screens` | 41 kode layar, status, fase, role, link langsung, instruksi reset dan skenario. |

Entry terpisah per portal: `finance.html`, `operational.html`, `commercial.html`, `sales.html`. File mandiri offline: `preview*.html`.

## Dataset SER dan sumber bersama

- Transaksi POS sintetis Jun–Agu 2026 untuk Giant Spa Ubud dan Shanti (9.176 baris termasuk refund), pelanggan anonim per outlet, lead, booking batal, dan baris budget marketing per outlet-bulan. Generator deterministik: Reset Demo selalu memberi angka yang sama.
- Rekonsiliasi dengan `visual/F1-02-spec.md` cocok sampai rupiah: Agu semua outlet Rp2.820 jt revenue, Rp3.190 jt target, 3.195 pelanggan, 3.260 order; Agu Ubud Rp1.680 jt, 1.880 pelanggan, pagu Rp120 jt, realisasi Rp63 jt.
- Sandbox tersambung: booking sandbox yang dibayar menjadi transaksi POS Giant Spa Ubud Agustus 2026 (tanggal 31 Agu). BK-001 adalah salah satu transaksi fixture Agustus. Commercial Budget CMP-001 adalah baris `BGL-UBD-2608-01` di budget marketing Ubud Agustus (pagu Rp25 jt; komitmen dan realisasi dibaca langsung dari sandbox).
- Dimensi terpisah: sumber akuisisi, kanal kontak, jalur konfirmasi, metode jual (B2C/B2B/Referral), kode referral, campaign, partner. Sumber kosong = "Tidak diketahui".
- ID stabil: `OUT-*`, `CUS-*`, `LEAD-*`, `BK-*`, `POS-*`, `CMP-*`, `PTN-*`/`DRV-*`, `KTR-*`, `MBR-*`, `BGL-*`, `MRF-*`.

## Definisi metrik (tampil di layar)

| Metrik | Rumus demo | Penyebut |
|---|---|---|
| Total Revenue | Σ transaksi POS dibayar | — (refund dan pembatalan dikecualikan; pipeline/kontrak tidak masuk) |
| Total Customers | ID pelanggan unik dengan ≥1 transaksi dibayar | — |
| Effective Target Rate | revenue aktual ÷ target revenue | target periode × outlet |
| AOV | revenue ÷ order dibayar | order, bukan pelanggan |
| Budget Realization | realisasi ÷ pagu; sisa = pagu − komitmen − realisasi | pagu marketing |
| ROMI | (kontribusi teratribusi − biaya marketing) ÷ biaya marketing | biaya marketing |
| ROAS | revenue grup Paid ÷ realisasi baris iklan | spend iklan |
| CAC | biaya marketing ÷ pelanggan baru | pelanggan baru |

Kontribusi teratribusi = revenue transaksi ber-campaign − biaya langsung (34% demo) − komisi. Denominator nol → "—".

## Uji yang dijalankan (semua lulus)

- `tests/hawk-live/model.test.js`: **37/37**. Delapan uji terima dari brief (budget awal, pengajuan→aktual, pagu tidak cukup, campaign→revenue + ROAS 0,14×, bentrok/aksi ulang, referral Rp75.000 + payout kedua ditolak, refund dua kasus, kinerja tim), 15 uji rekonsiliasi SER, 5 uji koneksi sandbox→SER.
- `tests/hawk-live/browser.e2e.js`: **43/43** di Chromium (Playwright), 1440 px dan 390 px: dialog logo, keyboard, Escape, focus return, deep link `#picker`, browser back, filter + URL, reset filter, fallback tanpa data, loading/error, drill-down dan kembali, klik bar ke baris pendukung, alur sandbox lewat UI (MRF → approve → posting → booking LEAD-001 → POS) yang mengubah KPI, Reset Demo, entry per portal, tanpa scroll horizontal di 10 rute pada 390 px, Menu mobile, 0 console error.
- File mandiri `preview-commercial.html` dibuka dari `file://` dengan semua jaringan diblokir: tampil normal.
- Regresi aplikasi 62-NV: `npm test` 442 + 27 lulus.

## Bagian SER yang diperiksa dan asumsi terbuka

- Laporan Data Studio SER belum dapat saya lihat langsung. Susunan F1-02 mengikuti `visual/F1-02-commercial-summary.html` dan `F1-02-spec.md` dari paket (label panel SER yang sudah diverifikasi). Validasi visual halaman SER lain (Brand Foundation, Brand Visibility Growth, Marketing Funnel, Ads, SEO, Social Media, Sales & Partnership) belum dilakukan; dibutuhkan tangkapan layar atau akses baca laporan.
- Nama outlet "Giant Spa Ubud/Shanti" mengikuti wireframe. "Giant Spa Bisma" adalah outlet contoh tanpa data untuk uji fallback.
- Jan–Mei 2026 dan seluruh 2025 tetap agregat histori (tanpa baris transaksi). Jun–Agu 2026 dari transaksi.
- Pelanggan dianggap berbeda antar-outlet (sesuai spec F1-02).
- Biaya langsung 34% dan komisi partner 10–15% adalah angka demo.

## Keputusan arsitektur yang masih terbuka

1. Rumus resmi Effective Target Rate, ROMI, margin/kontribusi, dan klasifikasi biaya iklan (untuk ROAS) bersama Finance.
2. Rute resmi Finance dan Operational di HAWK ERP. Saat ini keduanya rute sandbox, dengan tautan ke modul 62-NV yang sudah live (NV-16, 23, 29, 31, 38, 50).
3. Penempatan hosting: preview ini disajikan di `/hawk-live/` pada deployment yang sama dengan prototipe 62-NV. Alternatif: subdomain sendiri.
4. Source ERP PHP belum tersedia, jadi adapter mock vs adapter HAWK, skema, dan izin server per tindakan belum dapat diverifikasi (sesuai brief, menunggu review source).
