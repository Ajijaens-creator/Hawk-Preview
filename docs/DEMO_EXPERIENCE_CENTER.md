# Demo Experience Center (MP-HAWK-09)

Status: **DEMO / UI-ONLY SIMULATION** di atas aplikasi HAWK prototipe yang sama (62 NV). Bukan aplikasi kedua, bukan engine ERP kedua, dan tidak terhubung ke HAWK produksi. Semua data sintetis.

Buka lewat menu samping **Demo Experience Center** atau alamat `#/dx`. Butuh alamat http(s) (Vercel atau `npm run preview`), karena layar role dibuka sebagai frame dari origin yang sama. Lewat `file://` halaman tetap terbuka tetapi layar role tidak dapat dikendalikan (pesan jelas ditampilkan).

## 1. Dua mode

| Mode | Isi |
|---|---|
| **Option 1 · Scenario Test Lab** | Satu layar besar. Login role DEMO satu klik (8 role: 5 utama + Gudang, Asset PIC, Owner), ganti device (desktop / iPad / mobile), tutor langkah demi langkah di kanan. |
| **Option 2 · Simulator 5 Layar** | Lima dashboard asli berdampingan: Finance (desktop), Purchasing (desktop), BU Manager (desktop), Supervisor (iPad), Staff (mobile). Plus satu layar "peran pendukung" yang muncul otomatis bila langkah dijalankan Gudang / Asset PIC / Owner. Setiap layar: pilih device, Beranda, maksimalkan (⤢), layar penuh (⛶). Feed aktivitas bersama di bawah. |

Setiap layar adalah **aplikasi HAWK yang sebenarnya** (`index.html?embed=1&as=U-XXX#/nv/N`), bukan gambar. Semua layar membaca satu sandbox `localStorage` yang sama (`hawk-jaens-demo-state-v3`). Satu aksi di satu layar langsung terlihat di layar lain lewat event `storage` + `store.sync()` (cek `meta.rev`). `store.exec` selalu sinkron dulu sebelum menulis, jadi dua jendela tidak saling menimpa (diuji di T11).

## 2. Tutor (Smart Tutor)

- Pilih skenario → sandbox **di-reset** lalu disiapkan dengan operasi asli (`DX.start`).
- Tiap langkah menampilkan: role, layar (NV), **Target ID**, apa yang terjadi, status, bukti.
- **Buka layar & sorot tombol**: membuka layar NV sebagai user langkah itu dan menyorot kontrol asli (`.dx-hl`, atribut `data-dx-target="<Target ID>"`, tooltip).
- Dua cara menyelesaikan langkah:
  1. tekan tombol asli di layar role → tutor **mendeteksi** dari data (`DX.detect`, `via: UI`), atau
  2. **Jalankan Langkah Ini** → menjalankan operasi yang sama dengan tombolnya lewat `HAWK.api.call` (cek role + audit, `via: TUTOR`).
- Langkah tinjauan (dashboard / laporan) ditandai **Sudah ditinjau**.
- **BLOCKED** wajib catatan (mis. "tombol tidak ada"). Langkah yang tombolnya tidak ditemukan tidak pernah dianggap lulus.
- Sebelumnya / Berikutnya hanya untuk melihat; transaksi yang sudah jalan tidak di-rollback (pakai **Mulai ulang**).
- Hasil uji **PASS / FAIL / BLOCKED** (FAIL/BLOCKED wajib catatan) dan **Export JSON** laporan UAT: langkah, role, layar, Target ID, hasil, cara (UI/TUTOR), waktu, bukti dokumen, disclaimer sintetis.
- State tutor ada di `state.dx` dan hanya ditulis lewat operasi kontrak `dx.start`, `dx.step`, `dx.verdict` (UI-ONLY SIMULATION).

## 3. Enam skenario (45 langkah)

| ID | Skenario | Langkah | Role yang terlibat |
|---|---|---|---|
| MRF | 10 botol Massage Oil Shanti → 4 lokal / 3 transfer / 3 PO → supplier kirim 2 → lewat SLA → eskalasi → ETA revisi → 10/10 → faktur (3-way match) → AP disetujui → **pembayaran** → review BU | 16 | Staff, Supervisor, Gudang, Purchasing, BU Manager, Finance |
| NOTA | Nota tulisan tangan → koreksi OCR (simulasi) → kirim → Supervisor setuju → Finance verifikasi (jurnal) → settle | 6 | Staff, Supervisor, Finance |
| SLA | PO terkirim → jam demo +120 jam → isu terbuka → Supervisor minta update → BU Manager eskalasi → Purchasing ETA revisi → diterima → isu selesai | 5 | Supervisor, BU Manager, Purchasing, Gudang |
| BUDGET | Tinjau 7P → bobot bulanan budget 2027 → BHP outlet → revisi Q4 (Promotion −15 jt / Product +15 jt) → Owner setuju → budget vs actual | 6 | BU Manager, Supervisor, Owner, Finance |
| ASSET | Lapor AC rusak → review → work order + permintaan suku cadang → approval MRF → PO → WO selesai (biaya 350 rb) → Finance posting jurnal | 8 | Staff, Supervisor, Asset PIC, BU Manager, Purchasing, Finance |
| OFFICE | Finance ubah porsi biaya Shared Office 60/40 → BU Spa setuju → BU Essence setuju (Owner, karena data demo belum punya BU Manager Essence) → Finance **kunci periode** | 4 | Finance, BU Manager, Owner |

Penerimaan barang, posting persediaan, faktur, AP (hutang disetujui) dan **pembayaran aktual** adalah langkah terpisah dengan dokumen sendiri. Tidak ada posting ganda (diuji: 1 faktur, ≤ 1 jurnal pengakuan, 1 pembayaran, 2 GRN).

## 4. Kontrak Target ID (stabil)

Tooltip tidak menunjuk posisi layar, tetapi **Target ID** yang dipetakan ke selector atribut data yang sudah dipakai handler tombolnya (`data-a`, `data-p`, ...). Daftar lengkap: `HAWK.dx.TARGETS` di `assets/js/core/dx.js` (36 target). Contoh:

| Target ID | NV | Selector |
|---|---|---|
| dx-mrf-approve | 29 | `[data-a="decide"][data-d="APPROVE"][data-m="{mrf}"]` |
| dx-po-create | 32 | `[data-a="create"]` |
| dx-grn-receive | 42 | `[data-a="receive"]` |
| dx-bill-pay | 50 | `[data-a="pay"][data-p="{bill}"]` |
| dx-alloc-lock | 7 | `[data-a="lockAlloc"][data-pool="CC-OFC-FIN"]` |

`{mrf}`, `{bill}` dst. diisi dari variabel skenario yang terikat ke dokumen nyata. Bila HAWK produksi mengganti markup, cukup ubah selector di tabel ini. Uji: setiap langkah dari 6 skenario menemukan targetnya di layar asli role-nya (`tests/e2e-demo-center.js` bagian E).

## 5. Navigasi sesuai porsi role

Dashboard tiap role mendapat kartu **Aksi cepat** di atas (NV-47 Finance, NV-31 Purchasing, NV-01 BU Manager, NV-29 Supervisor, NV-24 Staff), disaring oleh hak akses yang sama (`HAWK.canSee`):

- **Finance**: ruang kerja lengkap lintas modul (budget, capture, matching, AP, jurnal, aset, alokasi), dengan catatan bahwa ini referensi DEMO dan backend HAWK tetap menegakkan RBAC.
- **Purchasing / BU Manager**: daftar tugas inti yang ringkas.
- **Supervisor**: tombol besar ramah sentuh (iPad).
- **Staff**: ikon besar, tanpa istilah keuangan (Pesan barang, Foto nota, Status permintaan, Lapor kerusakan).

Menu samping tetap mengikuti matriks hak akses yang sudah ada (diuji: menu Staff jauh lebih ringkas dari Finance).

## 6. Fitur baru di engine (dipakai skenario OFFICE)

| Operasi | Role | Status integrasi | Aturan |
|---|---|---|---|
| `cc.reviewAllocation` | BU Manager (scope sendiri), Owner | NEW INTEGRATION REQUIRED | AGREE / DISPUTE; DISPUTE wajib alasan ≥ 5 karakter |
| `cc.lockAllocation` | Finance | NEW INTEGRATION REQUIRED | Hanya bila semua BU dengan porsi > 0 sudah review tanpa DISPUTE |
| `cc.updateAllocation` (diubah) | Finance | — | Ditolak bila sudah dikunci; perubahan porsi mereset review BU; riwayat tersimpan |

UI di NV-07: kartu "Review BU & kunci periode".

## 7. Login demo: yang ada sekarang vs yang dibutuhkan staging

**Sekarang (prototipe):** pergantian role di frontend, hanya untuk data sintetis di browser. Ini **bukan** keamanan. Tidak ada password, tidak ada kredensial di kode.

**Kontrak untuk staging (NEW INTEGRATION REQUIRED, belum dibangun):** sesi demo harus dibuat di server:

1. `POST /demo/sessions` (hanya untuk pengguna yang sudah login dan diberi hak "demo operator") → server membuat tenant/sandbox sintetis + sesi sementara (mis. TTL 2 jam) untuk tiap role yang diminta. Respon: id sesi, daftar role, waktu kedaluwarsa. Tidak ada password bersama.
2. Token sesi role disimpan sebagai cookie `HttpOnly; Secure; SameSite=Strict` yang **terikat ke sandbox sintetis** itu; RBAC backend HAWK yang sama berlaku.
3. Sesi demo tidak pernah dapat membaca/menulis data produksi (tenant terpisah, ditolak di server).
4. `POST /demo/sessions/{id}/reset` mengulang seed sintetis; `DELETE` mengakhiri semua sesi role.
5. Semua aksi demo diaudit dengan penanda `demo_session_id`.

Nama endpoint di atas adalah **usulan**, bukan API HAWK yang ada.

## 8. Konflik desain & batasan

- **Siapa yang menerima barang.** Brief menyebut Supervisor; di aplikasi saat ini penerimaan (GRN, put-away, kirim transfer) dilakukan role **Gudang**. Skenario memakai Gudang sebagai peran pendukung (layar ke-6) agar kontrol yang sudah ada tidak dilonggarkan. Perlu keputusan Owner bila Supervisor outlet harus bisa menerima langsung.
- **BU Manager Essence** belum ada di data demo; review BU Essence di skenario OFFICE dijalankan Owner.
- Header keamanan diubah dari `frame-ancestors 'none'` / `X-Frame-Options: DENY` menjadi `'self'` / `SAMEORIGIN` agar aplikasi bisa membingkai dirinya sendiri. Situs lain tetap tidak bisa membingkai HAWK.
- Sandbox ada di `localStorage` browser: hilang bila data situs dihapus, tidak dibagi antar perangkat atau antar orang, dan **bukan** penyimpanan permanen.
- Layar penuh (⛶) bergantung izin browser; Safari iOS tidak mendukung layar penuh untuk elemen (gunakan ⤢).
- AI di semua skenario adalah simulasi berbasis aturan.

## 9. Berkas

| Berkas | Isi |
|---|---|
| `assets/js/core/dx.js` | Definisi role, device, Target ID, 6 skenario, runner (start / detect / runStep / review / block / report) |
| `assets/js/screens/x-demo.js` | Halaman `#/dx`: dua mode, frame, tutor, feed, export; kartu Aksi cepat per role |
| `assets/js/ui/shell.js` | Mode embed (`?embed=1&as=`), route `#/dx`, sinkron antar jendela, `HAWK.dxFocus/dxClear` |
| `assets/js/core/store.js` | `meta.rev`, `store.sync()`, operasi review/kunci alokasi, operasi `dx.*` |
| `tests/workflow.test.js` T11 | 6 skenario di engine, tanpa posting ganda, state bersama |
| `tests/e2e-demo-center.js` | 35 cek di Chromium: 5 layar, klik asli lintas layar, 6 skenario lewat tutor, device, reset, export |
