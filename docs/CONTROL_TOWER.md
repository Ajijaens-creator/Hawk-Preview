# Flow Intelligence & Management Control Tower (MP-HAWK-08)

Layar baru (diotorisasi Owner 8 Nov 2026): **NV-61 Procurement Flow Control Tower** dan **NV-62 Order Journey & Delay Investigation**, modul **K**. Aplikasi kini 62 NV. Semua angka DEMO / SIMULASI. Integrasi HAWK belum diverifikasi (lihat `PROCESS_EVENT_ADAPTER.md`).

## 1. Di mana melihatnya

| Peran | Layar | Yang tampil |
|---|---|---|
| Owner / CEO | NV-57 (widget), NV-61 | PFHI provisional, tepat waktu, P90, lewat SLA, isu P0/P1 |
| CFO / Finance | NV-47 (widget), NV-61, NV-62 tab Keuangan | Nilai PO menunggu barang, nilai PO lewat janji, isu Finance, cek pengakuan tidak dobel |
| Purchasing | NV-31 (widget), NV-61, NV-62 | Isu untuk Purchasing + aksi (alasan, ubah ETA, eskalasi, selesaikan) |
| Head of Division | NV-58 (widget) | Pesanan berjalan, lewat SLA, bottleneck |
| Supervisor | NV-01 & NV-58 (widget), NV-61, NV-62 | Semua isu di unitnya, tugas persetujuan yang lewat SLA |
| Gudang | NV-38 & NV-41 (widget) | Isu gudang, PO sebagian (backorder), barang siap diserahkan |
| Staff | NV-27 (widget) → NV-62 versi sederhana | "Kapan datang?" Tidak ada tombol aksi atau istilah teknis. NV-62 tidak muncul di menu staff |

Setiap MRF di drawer dokumen kini punya tombol **Lacak perjalanan (NV-62)**.

## 2. Timeline 12 tahap

1 MRF diajukan · 2 Validasi budget · 3 Persetujuan · 4 Alokasi · 5 Stok lokal / transfer / beli · 6 Approval PO & vendor · 7 Supplier kirim · 8 Barang tiba · 9 Penerimaan · 10 Put-away · 11 Serah ke pemohon · 12 Selesai.

Warna: hijau = selesai, biru = berjalan/sebagian, kuning = berisiko, merah = lewat SLA/terlambat, abu putus-putus = tidak dipakai (mis. tidak ada PO). Perjalanan keuangan (komitmen → GRNI → faktur → AP → bayar) ditampilkan terpisah di tab Keuangan. Prabayar (uang muka 1160) dan bayar setelah barang sama-sama didukung.

## 3. Kebijakan SLA (DEMO, dapat diubah, berversi)

| ID | Tahap | Target | Dasar | PIC tahap | Eskalasi |
|---|---|---|---|---|---|
| SLA-APR | Persetujuan | 8 jam | jam kerja | Supervisor | Head of Division → BU Manager |
| SLA-PUR | Proses Purchasing (MRF → PO terkirim) | 16 jam | jam kerja | Purchasing | BU Manager |
| SLA-POA | Approval PO & konfirmasi vendor | 4 jam | jam kerja | Purchasing | BU Manager |
| SLA-VND | Persiapan & pengiriman supplier | tanggal janji PO | tanggal | Purchasing | BU Manager → Owner |
| SLA-TRF | Transfer antar-cabang | 24 jam | kalender | Gudang | BU Manager |
| SLA-RCV | Penerimaan barang (posting) | 4 jam | jam kerja | Gudang | BU Manager |
| SLA-PUT | Put-away | 4 jam | jam kerja | Gudang | BU Manager |
| SLA-ISS | Serah ke pemohon | 8 jam | jam kerja | Gudang | Supervisor |
| SLA-FUL | Pemenuhan selesai (end-to-end) | 96 jam | kalender | Purchasing | BU Manager → Owner |
| SLA-FIN | Verifikasi & persetujuan tagihan | 16 jam | jam kerja | Finance | BU Manager |

- **Berisiko** bila waktu berjalan ≥ 80% target (dapat diubah per kebijakan). **Lewat SLA** bila melewati jatuh tempo.
- Waktu **kalender** dan **jam kerja** dicatat terpisah (kalender kerja 08–17, Senin–Sabtu, hari libur DEMO).
- Ubah kebijakan: Owner, BU Manager, Super Admin, dengan alasan wajib. Setiap perubahan menjadi versi baru dengan before/after. Jatuh tempo pada isu yang sudah ada **tidak ditimpa**.

## 4. KPI

| KPI | Definisi |
|---|---|
| Selesai tepat waktu | Pesanan selesai dalam ≤ 96 jam kalender ÷ pesanan selesai (live + riwayat DEMO Agt–Okt) |
| P90 waktu siklus | 90% pesanan selesai dalam waktu ini (jam kalender, MRF diajukan → semua diserahkan) |
| Lewat SLA (overdue) | Pesanan aktif dengan ≥ 1 tahap aktif lewat jatuh tempo, atau total siklus > 96 jam |
| Berisiko | Pesanan aktif, tidak overdue, dengan tahap ≥ ambang peringatan |
| Kritis P0 | Isu lewat SLA ≥ 24 jam atau saat total siklus juga lewat. **Ditampilkan terpisah, tidak tertutup oleh PFHI** |
| Rata-rata waktu per tahap | Rata-rata jam kalender per tahap (live selesai + berjalan + riwayat DEMO) |
| Performa supplier | Tepat janji (% kiriman lengkap ≤ tanggal janji), lead time aktual vs janji, backorder, skor DEMO = 70% tepat janji + 20% lead time + 10% kelengkapan |
| Kelengkapan data event | Event yang punya waktu dan pelaku ÷ semua event |

## 5. PFHI: Procurement Flow Health Index (PROVISIONAL)

`PFHI = Σ(bobot × skor komponen) ÷ Σ bobot komponen yang punya data`, skala 0–100.

| Komponen | Bobot awal | Skor |
|---|---|---|
| Selesai tepat waktu | 40% | rasio tepat waktu |
| Pesanan aktif dalam SLA | 25% | aktif tanpa tahap lewat SLA ÷ aktif |
| Kinerja waktu siklus P90 | 20% | min(1, target 96 jam ÷ P90) |
| Kelengkapan data event | 15% | rasio event lengkap |

PFHI **bukan skor tervalidasi**. Bobot hanya dapat diubah Owner/Super Admin (total 100%, alasan wajib, versi baru). Komponen dan bobotnya selalu ditampilkan.

## 6. Isu & eskalasi

- **Satu isu per masalah**, dengan kunci `MRF | dokumen | tahap`. Sinkron berulang tidak membuat duplikat.
- Isi isu: ID, ref, prioritas P0–P3, status SLA, dampak, PIC (role tahap), tenggat SLA asli, bukti, rekomendasi (AI SIMULATION), alasan, dan riwayat.
- Alasan diisi **otomatis** bila bisa dibuktikan dari data (mis. supplier kirim 2/3 → `SUPPLIER_SHORT`). Jika tidak, alasan **wajib** dicatat PIC sebelum isu bisa diselesaikan manual.
- Aksi (cek role + audit): Tinjau, Tugaskan, Minta update, Eskalasi (naik sesuai kebijakan), Catat alasan, Ubah ETA (hanya isu PO; Purchasing/manajer), Selesaikan.
- Isu tertutup **otomatis** saat tahapnya selesai (mis. botol terakhir diterima). Riwayat tetap tersimpan, tidak dihapus.
- Status: Baru → Ditangani → Dipantau (ETA revisi) / Dieskalasi → Selesai.

## 7. AI (SIMULATION, deterministik)

NV-61 dan NV-62 menampilkan **FAKTA** (dihitung dari dokumen), **HIPOTESIS** (dengan tingkat keyakinan, belum terbukti), dan **REKOMENDASI**. AI tidak mengubah budget, tidak membuat PO, tidak menyetujui atau membayar, dan tidak menyalahkan karyawan. Kategori alasan menjelaskan proses, bukan individu.

## 8. Skenario uji penerimaan (lulus)

Spa Shanti meminta 10 Massage Oil (BHP-001): 4 dari stok lokal, 3 transfer dari Ubud, 3 lewat PO. Supplier mengirim 2. Botol terakhir lewat janji, lalu Control Tower membuka 1 isu P0 untuk Purchasing. Supervisor Shanti melihatnya dan mengeskalasi. AI merekomendasikan konfirmasi ETA atau transfer alternatif. Purchasing mencatat ETA revisi + alasan (tanggal janji asli tetap). Botol terakhir diterima dan diserahkan (10/10), isu tertutup otomatis, dan tahap supplier tercatat TERLAMBAT. Finance memproses faktur dengan maksimal 1 jurnal pengakuan per tagihan.

- Engine: `tests/workflow.test.js` T10.
- Klik UI: `tests/e2e-control-tower.js` (32 cek). Screenshot di `docs/screenshots/control-tower/`.

## 9. Mencoba di aplikasi

1. Sebagai Owner buka **Control Tower › NV-61**. Tekan **⏩ Simulasi +24 jam** (DEMO) untuk melihat SLA berubah tanpa menunggu.
2. Klik KPI, baris tahap, sel heatmap, atau baris supplier untuk drill-down. Tekan **Perjalanan ›** untuk membuka NV-62.
3. Ganti role ke Purchasing (Etya) lalu tekan **Ubah ETA** atau **Catat alasan** di isu.
