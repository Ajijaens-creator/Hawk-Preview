# ORDER SEDERHANA — pesan · terima · bayar (permintaan Owner 8 Nov 2026)

**Tujuan:** kebutuhan manusia hanya ada di tiga titik: **saat memesan**, **saat barang diterima**, dan **saat konfirmasi sudah dibayar**. Semua langkah di antaranya dijalankan **aturan tetap AR-13** (bukan AI) memakai engine yang sama dengan alur lengkap. Tampilan dibuat untuk ponsel dan tim yang tidak terbiasa dengan aplikasi.

Tidak ada NV baru: layar staf ada di **NV-24**, konfirmasi bayar dan pengaturan di **NV-50**, pengaturan juga di **NV-09**.

## 1. Alur

| # | Siapa | Tombol | Yang terjadi otomatis (aktor `SYS-RULE`) |
|---|---|---|---|
| 1 | Staf | **Pesan sekarang** | Cek budget item 7P bulan berjalan + batas nilai. Lolos → MRF disetujui, stok lokal direservasi, transfer dari outlet lain dikirim, sisanya dibuatkan **PO per supplier default**, disetujui, dan dikirim (SENT). Tidak lolos → masuk rantai approval biasa (Supervisor / HoD / BU Manager) dengan alasan dalam bahasa sederhana. |
| 2 | Finance | **Sudah dibayar** | Tagihan yang sudah ada dibayar. Bila barang belum datang, dicatat sebagai **uang muka** (Dr 1160 / Cr 1110). Satu PO tidak bisa dibayar dua kali. |
| 3 | Staf | **Barang sudah diterima** (atau *Ada yang kurang atau rusak?*) | Transfer diterima; GRN dibuat, diposting (Dr 1140 / Cr 2120 GRNI), disimpan ke rak; **tagihan otomatis** = harga PO × qty diterima (Dr 2120 + PPN / Cr 2110); uang muka dikompensasi (Dr 2110 / Cr 1160); barang langsung diserahkan ke pemesan (Dr beban 7P / Cr 1140). Kekurangan tetap ditunggu sebagai backorder; barang rusak tidak ditagih. |

Urutan 2 dan 3 bebas: bayar dulu atau terima dulu, hasil akuntansinya sama dan saldo uang muka kembali 0.

## 2. Aturan AR-13 (NV-09 / NV-50)

Otomatis bila **semua** terpenuhi:

- barang rutin dan punya supplier default,
- budget item 7P unit untuk bulan berjalan tidak terlampaui (status OK/WARN; OVER atau tanpa budget → manual),
- nilai pesanan ≤ **Rp5.000.000** (pilihan Owner 8 Nov 2026, DEMO),
- aturan aktif.

**Yang boleh mengubah:** Finance, Super Admin (ADMIN), dan Owner. Alasan wajib, rentang Rp0–25 jt, berlaku untuk pesanan baru, dan setiap perubahan disimpan (before/after, siapa, kapan) serta masuk audit `autoOrder.update`.

## 3. Kontrol yang tetap dijaga

- Pembayaran selalu konfirmasi manusia (AR-11). Sistem dan AI tidak pernah membayar.
- Semua aksi otomatis tercatat di audit dan riwayat dokumen sebagai `SYS-RULE` dengan nomor aturan.
- Budget: pesanan berjalan = komitmen; barang diterima = realisasi (tidak dihitung dua kali).
- Staf hanya bisa mengonfirmasi pesanan miliknya atau unitnya. Finance tidak bisa memesan; staf tidak bisa membayar atau mengubah aturan.
- Batasan yang perlu diketahui ada di `KNOWN_LIMITATIONS.md §H` dan `DESIGN_CONFLICTS.md #14–15`.

## 4. Kontrak (semua di `assets/js/core/contracts.js`)

| Operasi | Role | Status |
|---|---|---|
| `order.quick` | Staf, Supervisor, HoD, BU Manager, Asset, Admin | NEW INTEGRATION REQUIRED |
| `order.receive` | Staf (unitnya), Supervisor, Gudang, HoD, BU Manager, Asset, Admin | NEW INTEGRATION REQUIRED |
| `order.pay` | Finance | TO VERIFY |
| `autoOrder.update` | Finance, Admin, Owner | NEW INTEGRATION REQUIRED |

## 5. Uji (8 Nov 2026)

- `node tests/workflow.test.js` T9: 3 jenis barang (lokal + transfer + beli), bayar sebelum terima, terima sebagian lalu sisa, barang rusak, lewat budget, tanpa budget, ubah batas oleh Finance/Owner/Admin, cek saldo 1160 = 0, utang = 0, semua jurnal seimbang.
- `node tests/e2e-simple-order.js`: 33 cek dengan klik sungguhan di 390 px, termasuk 20 dashboard (NV-01, 02, 03, 23, 30, 32, 36, 38–41, 44, 47, 49–52, 57, 59, 60) tanpa error, plus screenshot di `docs/screenshots/simple-order/`.
