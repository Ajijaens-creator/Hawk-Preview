# Audit paket MP-HAWK-03 (ZIP A–E dan F–J)

Tanggal audit: 8 November 2026. Kedua ZIP diekstrak ke folder terpisah sebagai data referensi (tidak ada kode dari paket yang dijalankan di aplikasi). Paket berisi: README_FIRST, README bagian 1/2, MODULE_STATUS.csv, SCREEN_MATRIX_60NV.csv, DEVELOPER_INTEGRATION_NOTES.md, README per modul, prototipe HTML A, B, D, visual board J, PNG referensi, dan 3 screenshot HAWK v2.11.6.

## 1. Inventaris paket vs aplikasi ini

| Modul | NV | Di paket Owner | Di aplikasi ini |
|---|---|---|---|
| A Navigation & Role Workspace | 01–04 | HTML demo + poster | Interaktif; tugas & notifikasi diturunkan dari state nyata |
| B Organization, Office & Access | 05–09 | HTML demo (64 KB JS) + 5 PNG NV | Interaktif; aturan validasi paket diadopsi (lihat §3) |
| C Strategic Target & Ambidex | 10–14 | Visual saja (10 PNG) | Interaktif: target per BU, driver tree, portofolio, proposal, keputusan & milestone |
| D Annual & Monthly 7P Budget | 15–23 | HTML demo + Developer Handoff + Visual Board | Interaktif; model plan line, jenis dana, approval, revisi dari handoff D diadopsi |
| E MRF & Supervisor Approval | 24–30 | Visual saja (1 PNG) | Interaktif, mobile-first untuk Staff/Supervisor |
| F Purchasing & Supplier | 31–37 | Visual saja | Interaktif: konsolidasi, quotation, PO, approval, darurat |
| G Warehouse & Inventory | 38–46 | Visual saja | Interaktif: bin, ledger, receiving, put-away scan, transfer, issue/return, opname |
| H Finance & Accounting | 47–52 | Visual saja | Interaktif: capture AI (simulasi), three-way match, AP/SoD, GL review, alokasi |
| I Asset & Facility | 53–56 | Visual saja | Interaktif: register, detail, MT/WO, kapitalisasi/depresiasi/disposal |
| J AI Intelligence & Reporting | 57–60 | Visual board HTML statis + PNG | Interaktif: insight 6 langkah, aksi manusia, produktivitas 7P, skenario |

Kesimpulan: paket Owner memiliki **3 prototipe interaktif (A, B, D)** dan **7 modul visual saja**. Aplikasi ini menutup ke-60 NV dalam satu engine, sesuai peringatan README_FIRST: "Jangan menganggap 60 layar sudah terimplementasi sebagai HTML interaktif."

## 2. Penomoran & penamaan

- `SCREEN_MATRIX_60NV.csv` dijadikan acuan resmi. Salinannya ada di `docs/reference/NB_SCREEN_MATRIX_60NV.csv`, dan tes otomatis memastikan ke-60 nomor dan nama di aplikasi **identik** dengan file itu.
- Dua perbedaan ditemukan dan diperbaiki: nama NV-06 (aplikasi menambahkan "(Add/Edit/Archive)") dan nama Modul D ("7P Budget Management" → "Annual & Monthly 7P Budget").
- README paket menyebut beberapa gambar generatif lama memuat nomor layar atau scope yang keliru. Nomor pada gambar tidak dipakai; NB yang berlaku.

## 3. Yang diadopsi dari paket (tanpa mendesain ulang)

| Sumber | Diadopsi | Lokasi |
|---|---|---|
| Prototipe B — `saveUnit` | Kode unit unik, parent wajib aktif, tolak hierarki melingkar, cost center otomatis untuk unit baru | `store.js` `org.upsertUnit`; NV-06 kini dapat memindah induk |
| Prototipe B — `confirmArchive` | Arsip ditolak bila ada transaksi terbuka (MRF, PO) atau sub-unit aktif; ID historis dipertahankan; aktivasi butuh induk aktif | `org.setStatus` |
| Prototipe B — `saveRule` | Edit aturan approval tidak langsung berlaku: tersimpan sebagai draft revisi, versi ACTIVE tetap berlaku sampai diterbitkan (Owner, maker ≠ checker), histori before/after | `approval.updateRule`, `approval.publishRule` (baru), NV-09 |
| Prototipe B — `simulateApproval` | Simulasi rute approval dengan nilai & flag over-budget; menampilkan "tanpa rute" bila di luar aturan aktif | `S.routeSim`, NV-09 |
| Prototipe B — `safeAction` | Pesan "frontend hanya simulasi; backend wajib enforce RBAC" | Halaman akses dibatasi & dokumentasi |
| Prototipe B — aturan darurat DRAFT | Catatan kebijakan pada AR-08 (limit belum disetujui Owner) | `seed.js`, NV-09, DESIGN_CONFLICTS |
| Handoff D (ZIP sebelumnya) | Plan line, jenis dana, Operasional/Inovasi, bobot bulanan, Head → Finance → Owner → Locked, revisi per line, non-rutin + SoD | Modul D (lihat memori proyek) |
| DEVELOPER_INTEGRATION_NOTES — hook names | Dipetakan ke operasi adapter sebagai referensi (bukan endpoint) | Kolom "Hook paket Owner" di INTEGRATION_CONTRACTS.md |
| DEVELOPER_INTEGRATION_NOTES — critical guards | Semua tercakup: qty+nilai item rutin, non-rutin terpisah, original/revised/actual/commitment/forecast terpisah, Profit = hasil, transfer bukan pendapatan, MRF/PO bukan biaya, multi-source fulfillment, AI hanya draft, no hard delete | Lihat WORKFLOW_MAP.md & tes T1–T6 |
| Visual board J | Struktur "Temuan → Rekomendasi → Source → As-of → Owner action", lensa Budget → Spending → Productivity → Outcome | Rantai insight 6 langkah, NV-59 |
| Palet Black & Deep Gold | Sudah dipakai sejak MP-HAWK-02 | `hawk.css` |

## 4. Komponen yang dapat dipakai ulang (di aplikasi ini)

Shell (sidebar modul, top bar BU/cabang, role switcher, inbox tugas, notifikasi, pencarian global), `ui.table`, `ui.tabs`, `ui.stepper`, KPI tile, badge status & 7P, drawer jejak transaksi (klik ID mana pun), modal, toast dengan op · status integrasi · mode, rantai insight AI, panel kontrak developer, state loading/error/empty, walkthrough terpandu.

## 5. Kesenjangan yang ditemukan

Lihat `KNOWN_LIMITATIONS.md` (kebijakan Owner yang belum final, data sumber yang belum terverifikasi) dan `DESIGN_CONFLICTS.md` (keputusan saat referensi berbeda).
