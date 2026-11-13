# HAWK four-portal · Laporan revisi Fase 1 dan Fase 2 Commercial

Tanggal: 11 November 2026 · Branch: `claude/project-thread-gcon14` · Status: **siap ditinjau, belum di-merge ke main**. preview.hawk.jaens.id tidak disentuh.

Preview publik (tanpa login, noindex): https://hawk-jaens-preview-git-claude-proj-45c2b2-jaens-enterprises-pro.vercel.app/hawk-live

Semua angka adalah **DATA DEMO / SIMULASI**. Tidak ada akun yang dihubungkan, pesan yang dikirim, komisi yang dibayar, atau deployment produksi. Integrasi, peran, dan AI ditandai simulasi.

## Keputusan dan asumsi

- **Palet.** Prompt menyebut #191919 dan gradasi #F3DB9D → #AD7D36. Instruksi Owner yang lebih baru mengunci desain ke HAWK Brand & UI (`assets/css/hawk.css`, #0B0B0B / #C99A2E). Kunci desain itu tetap dipakai; `tests/hawk-live/design-lock.test.js` menjaga aturannya.
- **Sidebar Commercial.** Commercial Budget diletakkan tepat setelah Executive Summary, sesuai paket NB.
- **Empat outlet.** Fixture memakai Jaens Spa Center (Ubud), Shanti, Triloka, dan Bisma. Bisma buka April 2026 dan belum punya target Juli. September berstatus "periode belum ditutup".
- **Tanggal operasional demo** untuk Content Studio dan KOL adalah 22 Agustus 2026. Laporan SER Agustus memakai bulan penuh.
- **Sumber angka.** Budget MRF tetap di sandbox HAWK dan dipakai bersama Finance. Catatan Commercial (campaign, konten, brand, KOL, inbox, eksperimen) disimpan di `state.cx`. Revenue terverifikasi selalu berasal dari transaksi POS. Angka platform hanyalah snapshot demo dan diberi label.

## Revisi F1-02 (NB Commercial dan audit KPI)

Agustus, semua outlet: revenue Rp4.130 jt, target Rp4.550 jt, 4.990 order, 4.885 pelanggan unik, 5.574 tamu.

- KPI yang tadinya bercampur kini dipisah. **Revenue Target Attainment** = revenue ÷ target, dihitung hanya atas outlet yang punya target. Outlet tanpa target tampil "Belum ditetapkan". **Country Forecast Accuracy** = 1 − WAPE, ditampilkan bersama biasnya.
- **AOV** = revenue ÷ order, dan **revenue per guest** ditampilkan sebagai KPI terpisah. ROMI warisan SER (revenue ÷ biaya) dipisah dari ROMI kontribusi. Coverage atribusi juga ditampilkan.
- **Tren tahunan** mencakup 2023–2026. Bulan tanpa data bernilai null, bukan nol.
- **Lost reason** memakai 12 kode SER. Inquiry lost dan booking batal dipisah.
- **Executive Insight** berbentuk tabel temuan → hipotesis → tindakan → PIC → tanggal review. Tombol "Buat tindakan" membuat satu tugas per temuan, dan menekannya lagi tidak membuat tugas ganda.

## Fase 2A

| Kode | Layar | Isi utama |
|---|---|---|
| F2-09 | Commercial Budget | Overview per pos 7P, outlet, dan campaign (sisa = pagu − komitmen − aktual). Pengajuan masuk ke antrean Finance; Finance dapat menolak dengan alasan. Tersedia timeline approval dan rekonsiliasi baris budget ↔ MRF ↔ ledger ↔ spend platform. |
| F2-02 | Campaign Planner | Tampilan overview, board status, kalender Gantt Jul–Sep, list, dan template. Campaign dibuat dari brief; kode UTM yang bentrok di outlet yang sama ditolak. |
| F2-03 | Campaign Detail | Brief dan tracking link, metrik, funnel, kreatif, budget dan MRF, tugas, histori. Pause wajib alasan, close wajib retrospektif. |
| F2-04 | Content Studio | Lima tampilan sesuai kontrak NB: Board 12 tahap, Calendar (tenggat atau jadwal), List, Library, My Tasks. Panel detail berisi Brief, Checklist, Aset & Versi, Review, Publikasi, Analytics, dan Log. Konten yang belum di-approve tidak bisa dijadwalkan. Mengganti aset setelah approval mengembalikan konten ke Review. Satu aset bisa dipakai untuk beberapa publikasi, dan jadwal yang bentrok ditolak. |
| F2-01 | Brand & Communications | Progress brand foundation dihitung dari bobot elemen yang sudah disetujui. Juga berisi visibilitas offline, aset berversi, kalender komunikasi, dan message library. |

## Fase 2B

| Kode | Layar | Isi utama |
|---|---|---|
| F2-05 | Digital Marketing | Tab Funnel (spend vs booking per hari), Paid Ads (platform → campaign → creative), SEO, Experiment Board, dan Data Quality. Tiga jenis hasil dipisah: konversi platform, lead WhatsApp (proxy), dan booking dibayar POS. CTR/CPC/CPM/CPL/ROAS memakai denominator yang sesuai; denominator nol tampil "—". Acuan audit (CTR 8,46%, ROAS legacy 17,05×) ditampilkan dengan label definisi. Impor ulang snapshot tidak menggandakan data. Mapping UTM bisa dikerjakan dari layar ini. |
| F2-06 | Social Media | Publishing Calendar per akun, Inbox & Moderation, Analytics, dan Unit Business Growth. ER dihitung per periode (bukan jumlah ER harian), dan reach tidak dianggap unik lintas platform. DM reservasi bisa dialihkan ke Sales menjadi lead yang membawa ringkasan dan asal campaign; mengulang aksi ini tetap memakai lead yang sama. |
| F2-07 | Media Partner & KOL | Direktori, Pipeline (Shortlist sampai Review), Deliverables, Profil, dan Performance. Kode KOL dimasukkan di form booking Sales B2C. Kode kedaluwarsa dan kode tidak dikenal ditolak. Booking yang dibayar di POS hanya menambah partner pemilik kode. |
| F2-08 | Audience & Attribution (F7-02 Jejak Booking) | Coverage dan unknown di bagian atas. Tab Channel Journey (source → contact → konfirmasi → POS, jejak per ID dengan contoh B2C, B2B, referral, dan refund), Audience negara × outlet, Cohort (tanggal lead vs tanggal bayar), Coverage, dan Exceptions. Exceptions berupa antrean koreksi yang wajib disertai bukti dan menyimpan histori; total revenue tidak berubah. Atribusi memakai model v1 berversi. |
| F2-10 | AI Marketing Mentor | Tab Brief Harian (domain Komunikasi, Branding, Marketing, Sales Handoff), Tanyakan Data, Usulan Eksperimen, dan Follow-up. Setiap usulan dapat diterima menjadi tugas (tanpa dobel), diubah (versi naik), atau ditolak dengan alasan. Pertanyaan di luar metric registry dijawab "gap". Mentor tidak mengubah budget. |

## Jalur ujung ke ujung yang diuji di browser

Alurnya: Campaign CMP-001 → konten terbit (PUB-001) → DM Instagram CONV-001 → dialihkan ke Sales menjadi lead → booking → check-in, selesai, bayar di POS → jejak atribusi menampilkan Campaign, Percakapan, Lead, Booking, POS, dan Finance dengan revenue dihitung satu kali → Campaign Detail ikut bertambah (370 → 371 booking) → AI Mentor → tugas.

## Tes

| Tes | Hasil |
|---|---|
| `node tests/hawk-live/model.test.js` | 81/81 |
| `tests/hawk-live/browser.e2e.js` (Fase 1, Playwright) | 45/45 |
| `tests/hawk-live/fase2.e2e.js` (Fase 2A + 2B, jalur ujung ke ujung, 390 px, console) | 30/30 |
| `tests/hawk-live/design-lock.test.js` | 15/15 |
| `npm test` | 27/27 |

Untuk browser test, jalankan dulu `python3 -m http.server 8811` dari root repo, lalu `BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/fase2.e2e.js`.

## Belum dikerjakan

- Fase 3 sampai 6: Finance/Operational lanjutan, Sales B2C/B2B/Referral penuh, dan Kinerja Tim (F6). Kinerja Tim masih placeholder bertanda Fase 6.
- Integrasi sungguhan (Meta, Google Ads, GSC, GA4, TikTok, WhatsApp) masih berstatus NEW INTEGRATION REQUIRED dan hanya disimulasikan di sini.

## Tambahan: NB 03 · Master Marketing Budget 2027 (F2-09)

Rute: `#budget-2027`. Di sidebar, layar ini ada tepat di bawah Commercial Budget. Statusnya simulasi: target dan pagu 2027 resmi belum ada, sehingga Rp40 miliar × 6% hanya skenario.

### Yang sudah tersedia

- **Dashboard.** Menampilkan Envelope Commercial (porsi non-People), Budget, Open commitment, Actual (ledger), Amount Left tersedia (budget − komitmen − actual) dan versi historis workbook (budget − actual), serta Forecast.
- **Tabel tiga bulanan.** Setiap kuartal ditampilkan sebagai Bulan 1 + 2 + 3. Ada juga tabel skenario rasio 5/6/8% dan form asumsi; setiap perubahan disimpan sebagai versi baru.
- **Tree budget.** Susunannya 7P › kategori › sub › detail, lengkap dengan category_id, cost center, dan GL demo. Bisa difilter per periode (tahun, kuartal, bulan), kategori, unit/outlet, dan tim.
- **Alokasi kategori.** Total wajib 100%. Preset workbook 2025 tersedia dalam dua versi: Master B7:B11 dan catatan baris 34–56, diterapkan pada porsi non-People. Referensi persentase Digital per channel juga disimpan dalam dua versi. Alokasi yang lebih kecil dari rencana baris ditolak, dan setiap perubahan tercatat di histori.
- **Budget lines dan MRF.**
  - Draft bisa ditambah dan diedit: qty × biaya satuan, IDR atau USD dengan kurs, recurring, referensi pekerjaan, dan target hasil.
  - Alurnya: Ajukan MRF → Finance menyetujui (cek pagu baris dan alokasi kategori), mengembalikan, atau menolak → posting penuh.
  - Draft belum mengurangi sisa. Approve mengurangi sisa. Posting penuh memindahkan komitmen ke actual tanpa mengubah sisa.
  - Approval kedua dan posting ulang ditolak. Jejak tiap baris menampilkan MRF, posting, dan historinya.
- **Efektivitas.** Hasil dibaca dari modul asal:
  - Campaign: *pending evidence* sampai ada transaksi POS 2027.
  - Konten: tahap dan biaya per aset.
  - Brand: milestone.
  - KOL: deliverable yang sudah diterima.
- **People Cost.**
  - Commercial Manager hanya melihat persentase, termasuk saat membuka lewat deep link.
  - HRD mengirim batch agregat ke Finance; mengirim ulang tidak menggandakan biaya.
  - Finance merekonsiliasi dan memposting batch ke 7P People. Batch yang sudah diposting tidak bisa ditimpa.
  - Role demo baru di switcher: Finance Manager dan HRD.
- **Screening workbook.** Berisi sepuluh tab dan turunannya di HAWK, ditambah daftar temuan yang masih perlu keputusan mapping. Workbook tidak diimpor.

### Tes

- `model.test.js`: 104/104, termasuk acceptance 1–2, FX, versi target, dan akses People.
- `budget2027.e2e.js`: 20/20.

### Belum dikerjakan (fase integrasi)

- Posting parsial dan reversal.
- Dua approval bersamaan di server.
- Scope manager/approver dan penyaringan People di server, API, dan ekspor. Di preview ini penyaringan masih di klien.
- CRUD taxonomy oleh Finance.
- Impor workbook.
