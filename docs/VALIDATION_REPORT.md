# VALIDATION REPORT — HAWK × JAENS prototipe terintegrasi

Tanggal: 8 November 2026 · Lingkungan: Chromium (Playwright) + Node.js 22 · Data: DEMO, direset sebelum setiap tes.

## Ringkasan

| Area (MP-HAWK-03 bagian D) | Tes | Hasil |
|---|---|---|
| Alur engine end-to-end (MRF → PO → Inventory → Finance → Budget → AI), budget 7P, receiving parsial, aset, organisasi, integritas | `node tests/workflow.test.js` | **284 lulus, 0 gagal** (termasuk T8 Smart Spend dan T9 Order Sederhana); setiap operasi tulis di kontrak punya tes engine |
| Walkthrough Owner 14 langkah lewat **klik UI nyata** (role switcher, tombol, form) | `node tests/e2e-walkthrough.js` | **21 lulus, 0 gagal**; 14/14 langkah tercentang |
| **Smart Spend 15 langkah penerimaan MP-HAWK-06** lewat klik UI nyata di 390 px (Staff Shanti → nota tulisan tangan → koreksi → klasifikasi → budget → kirim → Supervisor → Finance buka bukti → verifikasi → bayar → tidak ada posting ganda) | `node tests/e2e-smart-spend.js` | **26 lulus, 0 gagal**; screenshot M1–M6 di `docs/screenshots/smart-spend/` |
| **Order Sederhana** (8 Nov 2026): 3 jenis barang, qty & nilai berbeda, cek budget 7P, otomatis AR-13, lewat budget → Supervisor, Finance "Sudah dibayar" sebelum barang datang, terima sebagian lalu sisa, pengaturan oleh Finance/Admin/Owner, 20 dashboard dicek setelahnya | `node tests/e2e-simple-order.js` | **33 lulus, 0 gagal** di 390 px; screenshot di `docs/screenshots/simple-order/` |
| Navigasi semua layar × semua role, error runtime, tombol tanpa handler | `node tests/browser-all.js` | **720 kunjungan** (12 pengguna × 60 NV), 419 akses dibatasi sesuai role, **3.738 kontrol** diperiksa, **0 error**, **0 tombol tanpa handler** |
| Responsif mobile / tablet / desktop | `node tests/responsive.js` | 60/60 layar tanpa overflow horizontal di **1440 px, 834 px, 390 px**; 0 error |
| Kesiapan deploy (build `dist/`, paket Vercel tanpa GitHub, login Cloudflare & Vercel, CSP ketat, refresh di `#/nv/23`, aset lengkap, desktop/iPad/mobile di build terlindungi) | `node tests/deploy.test.js` | **31 lulus, 0 gagal** (domain preview.hawk.jaens.id — status live lihat docs/DEPLOY_VERCEL.md §5) |
| Paket Vercel dibangun dengan Vercel CLI 65.12.1 (`vercel build --prod`, lokal) | manual, 8 Nov 2026 | Build sukses; middleware terkompilasi (runtime Node.js) menjawab 503 tanpa password, 401 tanpa login, lanjut bila login benar. **Belum diuji di server Vercel.** |
| Penomoran NV | bagian dari workflow.test.js | Nama & nomor 60 NV **identik** dengan `SCREEN_MATRIX_60NV.csv` paket Owner |
| Status integrasi jujur | bagian dari workflow.test.js | 0 kontrak CONFIRMED EXISTING tanpa bukti; adapter HAWK API mengembalikan NOT_CONNECTED |

Hasil mentah ada di `tests/workflow-results.json`, `tests/e2e-results.json`, `tests/browser-all-results.json`, dan `tests/responsive-results.json`. Screenshot ada di `docs/screenshots/`.

## Pemeriksaan kunci

**Konsistensi data, tanpa double counting**
- Contoh Spa Shanti: alokasi 4 lokal + 3 transfer + 3 beli = 10. Stok Shanti akhir = 4 − 4 + 3 − 3 + 3 − 3 = 0, reservasi 0. Stok Ubud akhir 6.
- Perubahan stok sama dengan jumlah mutasi ledger, baik di tes engine maupun di tes UI.
- Komitmen 7P tidak dobel saat PO dibuat, karena komitmen berasal dari MRF.
- Actual 7P Product naik tepat 10 × Rp85.000 + 3 × Rp62.000. Body scrub dari MRF lain ikut terpenuhi lewat PO yang sama.
- Semua jurnal seimbang. PO tidak membuat jurnal. GRN: Dr Persediaan / Cr GRNI. Tagihan: Dr GRNI + PPN / Cr Utang. Profit tidak dihitung sebagai belanja.

**Kontrol & permission**
- Staff tidak dapat menyetujui MRF.
- Supervisor Ubud tidak dapat menyetujui MRF Shanti.
- Purchasing tidak dapat melakukan capture faktur.
- Owner tidak dapat membayar.
- SoD: verifikator tagihan ≠ penyetuju, pengaju non-rutin ≠ pemutus, pembuat draft aturan approval ≠ penerbit.
- Tolak, kembalikan, atau abaikan tanpa alasan ditolak.
- Budget LOCKED tidak dapat diedit; revisi tidak mengubah Original.
- Transfer melebihi stok ditolak dan state dikembalikan utuh (rollback).
- Operasi tanpa kontrak ditolak.

**Eksepsi**
- Penerimaan parsial + barang rusak menghasilkan backorder.
- Qty faktur > qty diterima menghasilkan MISMATCH.
- Faktur duplikat terdeteksi dan tidak dapat dibuatkan AP.
- MRF melebihi budget menambah BU Manager ke rantai.
- Alur minta revisi dan eskalasi berjalan.

**Organisasi dinamis**
- Cabang baru dibuat tanpa mengubah kode dan langsung dapat membuat MRF; gudang & cost center dibuat otomatis.
- Kode unit duplikat dan hierarki melingkar ditolak.
- Arsip unit dengan transaksi terbuka atau sub-unit aktif ditolak.
- Arsip/aktivasi ulang menjaga histori.

**State UI**
- Loading (skeleton) dan error (NETWORK_ERROR, tombol Coba lagi / Kembalikan ke Normal) diverifikasi lewat selector Kondisi.
- Empty state ada di tabel kosong dan budget di luar scope.
- Success ditampilkan lewat toast yang menyebut operasi, status integrasi, dan mode adapter.

## MP-HAWK-04 — perbaikan dari tes tambahan

| Temuan | Perbaikan |
|---|---|
| `user.assignRole` menerima role/scope apa pun (kontrak menyebut role terdaftar, scope ≥ 1) | Validasi role & scope di handler |
| `asset.dispose`: Finance dapat mengusulkan dan menyetujui disposal sendiri | SoD: pengusul ≠ penyetuju (kode `SOD`) |
| 19 operasi tulis belum punya tes otomatis | Ditambah blok T7 (54 cek) |

Cakupan per layar (E2E / Engine / Render) ada di `SCREEN_MATRIX_60NV.md`.

## Bug yang ditemukan dan diperbaiki dalam putaran MP-HAWK-03

| Bug | Ditemukan oleh | Perbaikan |
|---|---|---|
| NV-23 (dan layar D lain) crash untuk Supervisor berscope cabang | browser-all (sweep role) | Budget BU induk ikut terlihat; empty state bila tidak ada budget |
| NV-35 error setelah "Ajukan approval" (variabel `q` tertimpa) | e2e-walkthrough (klik UI) | Variabel query diganti nama |
| Overflow horizontal di 390 px pada NV-18, 44, 55, 58 | responsive | `min-width: 0` untuk anak grid/stack |
| Hero NV-01 mengulang label role | review screenshot | Jabatan hanya ditampilkan bila berbeda dari role |

## Definition of Done (MP-HAWK-03)

| # | Kriteria | Status |
|---|---|---|
| 1 | Satu aplikasi terintegrasi, 60 NV sesuai NB | ✓ |
| 2 | Semua tombol berfungsi atau terdokumentasi | ✓ (0 kontrol tanpa handler) |
| 3 | Alur end-to-end MRF → … → AI berjalan dengan ID konsisten | ✓ |
| 4 | Budget 7P: Original, Revised, Commitment, Actual, Forecast, review kuartalan, penyesuaian bulanan, histori approval & audit | ✓ |
| 5 | Pemisahan Operasional/Inovasi, OPEX, CAPEX, persediaan, modal lain | ✓ |
| 6 | Organisasi/cost center/aturan approval: tambah, ubah, aktif/nonaktif, arsip | ✓ |
| 7 | AI 10 kemampuan dengan struktur 6 langkah, keputusan manusia | ✓ (simulasi, berlabel) |
| 8 | Kontrak developer per layar/aksi + status integrasi | ✓ |
| 9 | Mobile/tablet/desktop + state loading/error/empty/success | ✓ |
| 10 | Tidak ada error runtime; dokumentasi & ZIP | ✓ |

Batas yang tetap berlaku ada di `KNOWN_LIMITATIONS.md`: tanpa backend, permission simulasi, dan AI/OCR simulasi.
