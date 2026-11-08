# DESIGN CONFLICTS — perbedaan antar referensi dan keputusan

Urutan sumber kebenaran mengikuti paket Owner: (1) keputusan bisnis Owner yang dikonfirmasi, (2) NB-HAWK-01 / SCREEN_MATRIX, (3) kemampuan HAWK yang terverifikasi, (4) visual Black & Deep Gold, (5) demo HTML.

| # | Konflik | Referensi A | Referensi B | Keputusan di prototipe | Butuh keputusan Owner? |
|---|---|---|---|---|---|
| 1 | Nomor/nama layar pada gambar generatif | Beberapa PNG lama | NB-HAWK-01 / SCREEN_MATRIX_60NV.csv | NB berlaku; nama 60 NV identik (diuji otomatis) | Tidak |
| 2 | Limit pembelian darurat | Prototipe B: usulan Rp1 jt/transaksi + Rp3 jt/minggu per outlet, status DRAFT | Board B / MP-HAWK-02: maks Rp3 jt, approval susulan BU Manager ≤ 24 jam | AR-08 tetap aktif Rp3 jt **sebagai DEMO** agar alur NV-37 dapat diuji; ditandai "belum disetujui Owner" di NV-09 | **Ya** |
| 3 | Model matriks approval | Prototipe B: aturan per jenis dokumen dengan nama approver (APR-001…007) | Board B NV-09: tingkat nilai MRF (≤1 jt, 1–5 jt, 5–25 jt, >25 jt) | Tingkat nilai dipertahankan (lebih dapat diuji); pola draft → terbit dari prototipe B diadopsi | Konfirmasi ambang |
| 4 | Rantai approval budget | Prototipe B APR-006: Finance → BU Manager, Owner bila material | Handoff Modul D: Head Review (Head of Division / BU Manager) → Finance → Owner → Locked | Mengikuti Modul D (dokumen developer paling rinci) | Konfirmasi |
| 5 | Rasio alokasi shared office | Prototipe B: Finance 70/30, Komersil 60/40, HRD 65/35 (Spa/Essence) | Seed aplikasi: 75/25, 75/25, 82/18, Purchasing 68/32 | Seed aplikasi tetap (DEMO); dapat diubah di NV-07; total wajib 100% | **Ya** — basis alokasi resmi |
| 6 | Struktur Essence | Prototipe B: "Essence Production" sebagai FACILITY | Aplikasi: Divisi Produksi & Penjualan Essence | Tipe unit dinamis; Essence manufacturing OS tetap independen dan diintegrasikan, tidak digantikan | Konfirmasi |
| 7 | Angka di visual (mis. Revenue YTD Rp18,4 M di board J) | Visual board | Seed DEMO aplikasi | Semua angka DEMO; tidak ada yang dijadikan target atau fakta | Tidak |
| 8 | Target grup Rp125 M | Konteks Enterprise di beberapa visual | NB & MP-HAWK-02 §13 | Tidak dimasukkan ke budget operasional Spa–Essence; NV-10 menyebut pengecualian ini | Tidak |
| 9 | Kode cost center | Prototipe B: CC-UBD, CC-SHN, CC-FIN | Aplikasi: CC-UBD-OPS, CC-OFC-FIN | Format aplikasi dipakai; keduanya contoh. Ikuti kode Job/Account HAWK saat integrasi | TO VERIFY dengan HAWK |
| 10 | Role "Head" | Prototipe B: Head of Commercial / Finance Head | Aplikasi: Head of Division generik + scope unit | Role generik + scope dinamis agar divisi baru tidak butuh role baru | Tidak |
| 11 | Label 7P di papan Smart Spend (MP-HAWK-06) | Papan desain: "P (Procurement)" | NB-HAWK-01: People, Product, Promotion, Process, Place, Facility, Profit | 7P resmi dipakai; pilihan belanja hanya 6 P (Profit = hasil). Tidak ada "Procurement" | Tidak |
| 12 | Nomor jurnal di layar pengaju (papan M5/M6) | Papan menampilkan JV sebelum verifikasi | Aturan MP-HAWK-06: JV hanya tampil bila sudah dibuat | JV muncul setelah verifikasi Finance; sebelumnya tertulis "Belum ada jurnal" | Tidak |
| 13 | Layar mobile Smart Spend | Papan: 6 layar aplikasi terpisah | MP-HAWK-06: jangan buat aplikasi/NV baru | Dijadikan subview NV-M1..M6 di dalam NV-48 | Tidak |
| 14 | Jumlah langkah manusia di pembelian | MP-HAWK-02: rantai MRF → Supervisor → Purchasing → PO approval → Receiving → Put-away → Finance (≥ 8 langkah manusia) | Permintaan Owner 8 Nov 2026: manusia hanya saat order, konfirmasi terbayar, dan diterima; sederhana untuk tim mobile | Order Sederhana (NV-24/NV-50) dengan aturan AR-13; alur lengkap tetap ada untuk pengecualian (lewat budget, > batas, non-rutin, tanpa supplier) | Batas Rp5 jt dipilih Owner; sisanya lihat KNOWN_LIMITATIONS §H |
| 15 | Siapa yang boleh mengubah aturan otomatis | NV-09: Admin menyusun draft, Owner menerbitkan (maker ≠ checker) | Owner 8 Nov 2026: AR-13 dapat diatur Finance, Super Admin, atau Owner | AR-13 diubah langsung oleh tiga role itu, dengan alasan wajib dan jejak before/after; aturan lain tetap draft → terbit | Tidak |
