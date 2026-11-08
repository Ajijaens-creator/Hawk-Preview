# SMART SPEND MONEY & AI RECEIPT CAPTURE — workflow & catatan integrasi (MP-HAWK-05 / MP-HAWK-06)

**Prinsip:** Photo first · AI assisted · Human confirmed · Budget controlled · Finance verified · Fully traceable.

> **AI SIMULATION.** Di prototipe ini, "pembacaan AI" adalah hasil **deterministik** dari 9 nota contoh sintetis (`assets/img/receipts/*.svg`). Tidak ada OCR/AI sungguhan, tidak ada API key di browser, dan foto pengguna tidak dikirim ke mana pun. Foto asli yang diunggah hanya disimpan sebagai bukti di penyimpanan lokal browser (DEMO). Field-nya diisi manual.

## 1. Letak di aplikasi (tidak ada NV baru)

Semua layar ada di **NV-48 AI Invoice & Receipt Capture**. Navigasi utama dan 60 NV tidak berubah. Enam layar dari papan desain MP-HAWK-06 menjadi *subview mobile* NV-48:

| Subview | Tab NV-48 | Isi | Terhubung ke |
|---|---|---|---|
| NV-M1 Beranda & aksi cepat | Scan Nota | Sapaan, Scan Nota, Pengeluaran Baru, Riwayat, Persetujuan, Cek Budget, transaksi terakhir, bottom nav (5 item) | NV-23, NV-01 (tombol "Scan Nota") |
| NV-M2 Ambil foto nota | Scan Nota | Kamera (`capture="environment"`), galeri, putar, potong/tepi, multi-halaman, 9 nota contoh DEMO, animasi baca (hormati *reduced motion*) | — |
| NV-M3 Periksa hasil AI | Review Hasil AI › 1 | Field + confidence, status Sesuai / Perlu konfirmasi / Tidak valid, baris item yang bisa diedit, cek aritmetika langsung, deteksi duplikat, alert harga, cocok master supplier | NV-49 (faktur PO) |
| NV-M4 Klasifikasi & budget | Review Hasil AI › 2 | Rekomendasi 7P (hanya rekomendasi), outlet/divisi, cost center otomatis, OPEX/CAPEX/Persediaan/Lainnya, rutin, aset terkait, dampak budget | NV-23 |
| NV-M5 Konfirmasi & approval | Review Hasil AI › 3 | Ringkasan, bukti, darurat tanpa PO (AR-08), rute approval, pernyataan "pengajuan ≠ persetujuan/pembayaran/jurnal" | NV-37 |
| NV-M6 Detail transaksi | Riwayat & Bukti | Tab **Detail / Bukti Nota / Audit Trail**, timeline approval, status akuntansi, tombol aksi sesuai role | NV-42, NV-50, NV-51 |

Di desktop/tablet, subview tampil di dalam bingkai ponsel dengan panel kontrol di samping (kontrol terpisah, empat alur, antrean berjalan, dan antrean faktur PO lama untuk Finance).

## 2. Perjalanan pengguna

Foto/unggah → AI SIMULATION membaca → pengaju memeriksa & mengoreksi → klasifikasi → cek budget → konfirmasi & kirim → approval → (gudang bila persediaan) → verifikasi Finance → pembayaran/rekonsiliasi → bukti tersimpan & dapat ditelusuri.

## 3. Empat alur dokumen

| Metode bayar di nota | Alur | Setelah verifikasi Finance | Pembayaran |
|---|---|---|---|
| Tunai / transfer / QRIS perusahaan | **Spend Money** (sudah dibayar) | Dr beban/persediaan (+ PPN Masukan) · Cr 2155 Kas Kecil — Menunggu Rekonsiliasi | Finance merekonsiliasi: Dr 2155 · Cr 1120 Kas Kecil. **Tidak otomatis**; memilih metode bayar tidak berarti sudah dibayar. |
| Belum dibayar | **Tagihan supplier** | Cr 2110 Utang Usaha | Finance membayar: Dr 2110 · Cr 1110 Bank |
| Dibayar pribadi karyawan | **Reimburse** | Cr 2140 Utang Reimburse Karyawan | Dr 2140 · Cr 1110 Bank. Satu nota hanya bisa direimburse sekali. |
| Faktur ber-PO | **Faktur PO** | Diteruskan ke dokumen `doc` IN_MATCHING → three-way match NV-49 → AP NV-50 (engine yang sudah ada, tidak dibangun ulang) | lewat AP |

Debit: OPEX → akun beban per 7P (People 6140, Product 6100, Promotion 6130, Process 6150, Place 6120, Facility 6210); Persediaan → 1140; CAPEX → 1590 Aset Dalam Penyelesaian. **Nomor akun DEMO dan TO VERIFY** terhadap COA HAWK.

Jurnal dibuat **PENDING_REVIEW** saat Finance memverifikasi dan diposting lewat review GL NV-51. Nomor jurnal **tidak pernah ditampilkan sebelum jurnalnya benar-benar dibuat**. Papan desain menampilkan JV di layar pengaju sebelum verifikasi. Ini dicatat di DESIGN_CONFLICTS.

## 4. Kontrol

- **Pemisahan tugas:** pengaju mengonfirmasi data ≠ approver (Supervisor / Head of Division, + BU Manager bila melewati budget atau darurat) ≠ PIC gudang (persediaan) ≠ Finance verifikasi ≠ Finance bayar. Pengaju tidak dapat memproses pengeluarannya sendiri (`canActSpend`).
- **Field ragu:** confidence < 85% wajib dikonfirmasi atau dikoreksi. Field yang tidak terbaca dibiarkan kosong. **Aplikasi tidak pernah mengarang angka.**
- **Aritmetika:** Σ(qty × harga − diskon baris) − diskon nota + pajak = total (toleransi Rp1). Bila tidak cocok, pengajuan ditolak dan pengguna diminta memeriksa angka yang ragu.
- **Koreksi terpisah:** nilai AI asli tetap disimpan (`ai`), dan setiap koreksi dicatat (`corrections[]`: field, nilai AI, nilai baru, oleh, waktu). Gambar asli tidak diubah.
- **Duplikat:** fingerprint gambar, no. nota + supplier, supplier + tanggal + jumlah, serta no. faktur di tagihan AP. Duplikat diblok saat kirim dan saat bayar.
- **Darurat tanpa PO:** wajib alasan, batas AR-08 (Rp3.000.000 DEMO, keputusan Owner masih terbuka), dan approval susulan BU Manager.
- **Budget:** pengajuan berjalan = komitmen; terverifikasi = realisasi (OPEX). Tidak dihitung dua kali dengan MRF/PO/issue. Melewati budget menambah langkah BU Manager.
- **Gudang:** persediaan tanpa PO harus dikonfirmasi PIC gudang (qty fisik = nota) sebelum diverifikasi Finance. Setelah barang masuk stok, klasifikasinya tidak bisa diubah menjadi beban.
- **AI tidak** menyetujui, membayar, memposting, atau mengubah budget yang terkunci.
- **Akses bukti:** Owner/Finance semua; pengaju miliknya; Supervisor/HoD/BU Manager sesuai scope; gudang hanya persediaan/PO; Purchasing hanya PO/darurat/supplier baru.

## 5. Skenario contoh (DEMO)

| Kunci | Nota | Yang diuji |
|---|---|---|
| PRINTED | Minimarket Sinar Dewata | Struk jelas, semua field Sesuai |
| HANDWRITTEN | Toko Bangunan Sumber Jaya | Tulisan tangan: harga Pasir (55%) & total (62%) ragu. Koreksi 35.000 → 350.000 membuat total cocok |
| BLURRY | Foto buram | Semua kosong, isi manual, tidak ada angka karangan |
| PO_PRICE | PT Minyak Atsiri Nusa | Harga faktur > PO, lalu three-way match |
| DUPLICATE | Toko Sinar Bali TSB-2211 | Sudah pernah diajukan & lunas, sehingga diblok |
| EMERGENCY | CV Teknik Dingin Bali | Darurat tanpa PO, approval susulan |
| UNPAID | PT Bali Hama Bersih | Tagihan + PPN + jatuh tempo, menjadi utang usaha |
| REIMBURSE | Toko Usaha Bali Wangi | Reimburse + alert harga +8% |
| OVERBUDGET | Percetakan Kilat Denpasar | Melewati budget Promotion, jadi + BU Manager |

## 6. Kontrak developer (semua **TO VERIFY**, kecuali capture)

| Operasi | Role | Status integrasi | Catatan backend |
|---|---|---|---|
| `spend.capture` | pengaju | UI-ONLY SIMULATION | Produksi: unggah ke object storage privat, OCR di **server** (kunci API tidak pernah di browser), hash file, simpan asli immutable |
| `spend.update` | pengaju (DRAFT/RETURNED) | TO VERIFY | Simpan koreksi terpisah dari hasil AI |
| `spend.submit` | pengaju | TO VERIFY | Validasi ulang aritmetika, duplikat, AR-08 di server |
| `spend.approve` | SPV/HOD/BUM | TO VERIFY | Matriks approval NV-09 |
| `spend.receive` | WAREHOUSE | TO VERIFY | Engine inventory HAWK yang ada |
| `spend.verify` | FINANCE | TO VERIFY | Jurnal usulan ke GL HAWK, bukan ledger kedua |
| `spend.settle` | FINANCE | TO VERIFY | Konfirmasi eksplisit, satu kali per nota |
| `spend.cancel` | pengaju | TO VERIFY | — |

Detail payload & error ada di `docs/INTEGRATION_CONTRACTS.md` dan panel "Kontrak Developer" di NV-48.

## 7. Bukti di layar lain

Panel "Bukti nota" read-only (thumbnail membuka bukti asli dengan cek izin, ID membuka NV-48): NV-23 (komitmen vs realisasi), NV-27 (pengeluaran saya), NV-37 (darurat), NV-42 (persediaan menunggu gudang), NV-49 (faktur PO), NV-50 (tagihan & reimburse), NV-51 (jurnal bersumber nota). ID `SM…`/`EV…` juga terbuka dari pencarian global dan kotak tugas.

## 8. Koreksi terhadap papan desain

- Papan menulis **"P (Procurement)"**. 7P JAENS adalah People, Product, Promotion, Process, Place, Facility, Profit. Procurement bukan bagian dari 7P, dan Profit adalah hasil, bukan kategori belanja. Pilihan di M4 hanya enam P belanja.
- Papan menampilkan nomor JV sebelum verifikasi Finance. Di prototipe, nomor JV muncul hanya setelah jurnal dibuat.

## 9. Penyimpanan bukti (jujur)

Di pratinjau, gambar dan data disimpan di `localStorage` browser masing-masing pengguna. Penyimpanan ini **bukan** penyimpanan dokumen perusahaan yang permanen atau aman: data hilang bila cache dihapus dan tidak terbagi antar perangkat. Produksi membutuhkan object storage privat dengan retensi, enkripsi, dan audit, yang terhubung ke HAWK (NEW INTEGRATION REQUIRED).

## 10. Verifikasi

- `node tests/workflow.test.js` T8: sekitar 50 cek engine (semua skenario, SoD, duplikat, budget, jurnal, alur PO).
- `node tests/e2e-smart-spend.js`: 15 langkah penerimaan dengan klik sungguhan di 390px, plus screenshot `docs/screenshots/smart-spend/`.
