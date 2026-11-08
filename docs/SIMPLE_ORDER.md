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

## Penerimaan oleh akun outlet & identitas otomatis (keputusan Owner 8 Nov 2026)

- Di outlet tidak ada orang gudang standby. **Supervisor, therapist, receptionist, dan attendant** outlet itu boleh menekan **Barang sudah diterima** untuk pesanan outletnya, termasuk pesanan lewat alur lengkap (MRF → PO), bukan hanya Order Sederhana.
- Akun dari outlet lain ditolak (FORBIDDEN). Penerimaan tidak bisa dilakukan dua kali.
- **Tidak perlu mengisi ulang identitas.** Saat memesan atau menerima, sistem mengisi dari penugasan akun: nama, jabatan, outlet, divisi, BU (`S.assignment`). Disimpan di `mrf.requestedBy`, `grn.receivedBy`, `transfer.receivedBy`, dan `mrf.receipts[]`. Akun outlet tidak bisa memesan atas nama outlet lain.
- Di produksi, identitas ini wajib diambil server dari akun login (bukan dari isian form).
- Akun demo baru: Yuli (Receptionist), Dewa (Attendant), Nengah Budi (Security) di Spa Shanti; Tika (Asisten Operational Manager).

### Struktur Divisi Operasional Spa (Owner, 8 Nov 2026)

```
BU JAENS Spa
└─ Divisi Operasional Spa — Operational Manager (Eni Restini)
   └─ Asisten Operational Manager (Tika) — membawahi Supervisor outlet
      └─ Outlet (Ubud, Shanti, Triloka, Bisma) — dipimpin Supervisor outlet
         └─ Departemen: Receptionist · Spa Therapist · Attendant · Security
```

- Outlet sekarang berada di bawah node organisasi **Divisi Operasional Spa** (`DV-SPA-OPS`), bukan langsung di bawah BU. Budget, cost center, dan laporan per BU tetap sama karena BU dicari dengan menelusuri ke atas.
- Departemen disimpan di profil akun (`dept`) dan atasan langsung di `reportsTo`. Keduanya ikut tercatat otomatis saat memesan dan menerima barang.
- Asisten Operational Manager memakai role Head of Division dengan posisi `ASST_OM` dan cakupan Divisi Operasional Spa.

### Approval MRF lewat Asisten Operational Manager (Owner, 8 Nov 2026)

| Nilai MRF (aturan NV-09) | Rantai untuk outlet Spa |
|---|---|
| ≤ Rp 1 jt (AR-01) | Supervisor outlet |
| Rp 1–5 jt (AR-02) | Supervisor → **Asisten Manager Operasional** → Manager BU Operasional |
| Rp 5–25 jt (AR-03) | Supervisor → **Asisten Manager Operasional** → Manager BU Operasional |
| > Rp 25 jt (AR-04) | Supervisor → **Asisten Manager Operasional** → Manager BU Operasional → Owner |

- Langkah Asisten OM disisipkan otomatis bila ada akun Asisten OM yang mencakup unit MRF itu (dibaca dari struktur organisasi, tidak di-hardcode). Unit Essence / Office tidak berubah.
- Operational Manager tidak bisa melompati Asisten OM; Asisten OM tidak bisa menyetujui lagi sebagai Operational Manager; satu orang tidak bisa menyetujui dua langkah di MRF yang sama.
- Eskalasi dari Supervisor outlet naik ke Asisten OM.
- Asisten OM tidak ikut Head Review budget tahunan (tetap Operational Manager / BU Manager).
- Di HAWK produksi: perlu "posisi" pada akun atau langkah approval per jabatan (TO VERIFY / NEW INTEGRATION REQUIRED bila HAWK hanya mendukung approval per role).

### Akun demo (nama tim JAENS, permintaan Owner 8 Nov 2026)

| Jabatan | Nama | Role sistem |
|---|---|---|
| Owner | Aji Jaens | OWNER |
| Manager BU Operasional (JAENS Spa) | Eni Restini | BU_MANAGER |
| Asisten Manager Operasional | Tika | HEAD_DIV + posisi ASST_OM |
| Supervisor Outlet | Mila | SUPERVISOR |
| Receptionist / Therapist / Attendant | Yuli / Indah / Dewa | STAFF |
| Finance Manager | Asri | FINANCE |
| General Accounting Supervisor | Meli | FINANCE |
| Tax Administration | Idha | FINANCE |
| Purchasing | Etya | PURCHASING |
| Inventory & Aset | Diana | ASSET |
| Warehouse Officer | Supri | WAREHOUSE |
| Super Admin Sistem | Niken | ADMIN |
| IT Developer | Dewa & Tim HAWK | ADMIN |
| Manager Divisi HRD | Made Gunarsa | HEAD_DIV (Divisi HRD) |
| Manager Divisi Komersil | Dedik | HEAD_DIV (Divisi Komersil) |
| Manager BU JAENS Essence | Gek Niken | BU_MANAGER (BU Essence) |

Akun pendukung yang tidak ada di daftar Owner tetap memakai nama fiktif: Komang Ayu (Attendant Ubud), Ni Luh Sari (Supervisor Ubud), Nengah Budi (Security Shanti).

**Rantai approval MRF outlet Spa sekarang:** Supervisor outlet → Asisten Manager Operasional → Manager BU Operasional (→ Owner untuk > Rp 25 jt). Karena di Spa tidak ada manager divisi terpisah di atas Asisten, level "Head of Division" ditandatangani Manager BU Operasional; satu orang tidak menyetujui dua kali. Unit Office tetap memakai manager divisinya (Komersil, HRD).
