# SCREEN CONTRACTS — 62 NV (NB-HAWK-01 + addendum MP-HAWK-08 NV-61/62)

_Dibuat otomatis dari `assets/js/core/registry.js` + `contracts.js`. Kontrak yang sama tampil di aplikasi lewat toggle "Kontrak developer"._

## Modul A — Navigation & Role Workspace

### NV-01 Role-Based Dashboard / Home

Ringkasan sesuai role: KPI, tugas, insight AI, kinerja unit; titik awal semua alur.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator |
| Komponen | Hero sambutan, KPI tiles (gradien), tren revenue, donut realisasi 7P, panel AI Insight, kartu kinerja unit, aksi cepat |
| Field | Revenue YTD, Profit YTD, Utilisasi budget, Tugas pending (per role) |
| Aksi | Buka tugas → `nav:2`; Lihat insight → `nav:57`; Buat MRF (staff) → `nav:26` |
| Filter | BU / cabang dari topbar |
| Drawer/modal | Drawer detail transaksi |
| Input | — |
| Validasi | — |
| Transisi status | Read-only |
| Approval | — |
| Pengecualian | Data DEMO dilabel |
| Responsif | Grid 4→2→1 kolom |
| Layar terkait | Semua modul |
| Format ID | — |

**Operasi adapter:**

- `ai.insights` — **UI-ONLY SIMULATION** · HAWK: Analytics (menu utama HAWK) — sumber data saja · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ scope, role, asOf }` → Insight[] { kind FACT\|METRIC\|FORECAST\|HYPOTHESIS\|RECOMMENDATION, finding, evidence[], source, asOf, impact, recommendation, owner } · transisi: Read-only · audit: AI_INSIGHT_VIEWED (opsional)
- `search.global` — **TO VERIFY** · HAWK: Purchases › FIND tab · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ q }` → SearchHit[] { type, id, title, status } · transisi: Read-only · audit: —

### NV-02 My Tasks & Approval Inbox

Satu kotak masuk untuk semua dokumen yang menunggu aksi pengguna aktif (MRF, PO, budget, tagihan, transfer, WO).

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator |
| Komponen | Tab per jenis, tabel tugas, tombol aksi inline, drawer detail |
| Field | Jenis, Referensi, Unit, Permintaan, Nilai, Status, Aksi |
| Aksi | Setujui / Tolak (MRF) → `mrf.decide`; Setujui PO → `po.decide`; Buka detail → `ui:drawer` |
| Filter | Jenis dokumen |
| Drawer/modal | Detail dokumen + jejak |
| Input | Catatan keputusan |
| Validasi | Catatan wajib untuk tolak/revisi |
| Transisi status | Sesuai dokumen |
| Approval | Rantai matriks NV-09 |
| Pengecualian | Tugas di luar scope tidak tampil |
| Responsif | Kartu bertumpuk di mobile |
| Layar terkait | MRF, PO, Budget, Bill, Transfer, WO |
| Format ID | PR…, PO…, BGT-…, BL… |

**Operasi adapter:**

- `mrf.decide` — **TO VERIFY** · HAWK: Purchase Request — APPROVE STATUS / APPROVE BY · izin: Supervisor Outlet, Head of Division, BU Manager, Owner / Eksekutif · input `{ id, decision APPROVE\|REJECT\|REVISION\|ESCALATE, note }` → MRF · transisi: SUBMITTED → (rantai) → APPROVED → IN_FULFILLMENT \| REJECTED \| REVISION \| ESCALATED · audit: PR_APPROVAL_DECISION (with budget snapshot)
- `po.decide` — **TO VERIFY** · HAWK: PO APPROVED BY · izin: Purchasing, BU Manager, Owner / Eksekutif · input `{ id, decision, note }` → PO · transisi: PENDING_APPROVAL → APPROVED \| DRAFT · audit: PO_DECISION
- `budget.approve` — **NEW INTEGRATION REQUIRED** · HAWK: — (ref. Modul D handoff: approval.review; budget.lock — TO VERIFY) · izin: Head of Division, BU Manager, Finance / Accounting, Owner / Eksekutif · input `{ id, decision APPROVE\|REJECT, note }` → Budget · transisi: SUBMITTED: Head Review (Head Div / BU Manager) → Finance Review → Owner Review → LOCKED; REJECT → DRAFT · audit: BUDGET_DECISION (actor, waktu, tahap, catatan)

### NV-03 Notifications & Activity Center

Notifikasi turunan dari state (approval, stok menipis, insight AI) dan aktivitas audit pengguna.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator |
| Komponen | Tab kategori, daftar notifikasi, timeline aktivitas |
| Field | Judul, ref, waktu, status baca |
| Aksi | Tandai dibaca → `ui:local`; Buka referensi → `ui:drawer` |
| Filter | Approval / Transaksi / Sistem / AI |
| Drawer/modal | Detail referensi |
| Input | — |
| Validasi | — |
| Transisi status | Read/unread (lokal) |
| Approval | — |
| Pengecualian | — |
| Responsif | Mobile-first (≥360px), target sentuh ≥44px, satu kolom; tablet 2 kolom |
| Layar terkait | Audit log |
| Format ID | AU-… |

**Operasi adapter:**

- `audit.list` — **TO VERIFY** · HAWK: Riwayat (ikon jam di toolbar HAWK) · izin: System Administrator, Owner / Eksekutif, Finance / Accounting · input `{ ref?, user?, from?, to? }` → AuditEvent[] · transisi: Read-only · audit: —

### NV-04 Global Search & Quick Actions

Cari MRF/PO/item/supplier/aset/dokumen lintas modul; aksi cepat sesuai role.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator |
| Komponen | Kotak cari, tab hasil per jenis, grid aksi cepat |
| Field | Query |
| Aksi | Buka hasil → `ui:drawer`; Aksi cepat → `nav:*` |
| Filter | Jenis hasil |
| Drawer/modal | Detail |
| Input | Teks / ID / barcode |
| Validasi | Min 2 karakter |
| Transisi status | — |
| Approval | — |
| Pengecualian | Hasil difilter hak akses (server) |
| Responsif | Mobile-first (≥360px), target sentuh ≥44px, satu kolom; tablet 2 kolom |
| Layar terkait | Semua |
| Format ID | Semua |

**Operasi adapter:**

- `search.global` — **TO VERIFY** · HAWK: Purchases › FIND tab · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ q }` → SearchHit[] { type, id, title, status } · transisi: Read-only · audit: —

## Modul B — Organization, Office & Access

### NV-05 Organization & Business Unit Tree

Struktur dinamis grup → BU → cabang/divisi; menandai unit di luar lingkup & sistem independen.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, System Administrator, Finance / Accounting |
| Komponen | Pohon organisasi, kartu ringkas, tabel unit |
| Field | Kode, nama, tipe, parent, status, lingkup |
| Aksi | Tambah unit → `org.upsertUnit`; Lihat unit → `ui:drawer` |
| Filter | — |
| Drawer/modal | Detail unit |
| Input | — |
| Validasi | — |
| Transisi status | ACTIVE/ARCHIVED |
| Approval | — |
| Pengecualian | BU lain = sistem independen |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | Cost center, gudang |
| Format ID | BU-*, BR-*, DV-* |

**Operasi adapter:**

- `org.upsertUnit` — **TO VERIFY** · HAWK: Settings / Locations (ikon ⚙) — lokasi muncul di dropdown Source/Request Location PR · izin: System Administrator · input `{ id?, type: BRANCH\|DIVISION\|BU, name, code, parent, location, createWarehouse? }` → OrgUnit { id, type, code, name, parent, status } · transisi: — → ACTIVE (otomatis buat cost center & gudang untuk cabang) · audit: ORG_UNIT_UPSERT (before/after)

### NV-06 Branch, Office & Division Management

CRUD cabang/office/divisi tanpa hardcode; cabang baru otomatis mendapat cost center & gudang.

| Aspek | Spesifikasi |
|---|---|
| Role akses | System Administrator, Owner / Eksekutif |
| Komponen | Filter tipe/status, tabel unit, modal tambah/ubah, konfirmasi arsip |
| Field | Tipe, nama, kode, parent, lokasi |
| Aksi | Tambah unit → `org.upsertUnit`; Ubah → `org.upsertUnit`; Arsipkan / Aktifkan → `org.setStatus` |
| Filter | Tipe, status, cari |
| Drawer/modal | Modal form |
| Input | Nama, kode, tipe, parent |
| Validasi | Kode unik; tidak bisa arsip bila ada MRF terbuka |
| Transisi status | ACTIVE ⇄ ARCHIVED |
| Approval | Admin |
| Pengecualian | HAS_OPEN_TX |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | Selector cabang di topbar |
| Format ID | BR-*, DV-* |

**Operasi adapter:**

- `org.upsertUnit` — **TO VERIFY** · HAWK: Settings / Locations (ikon ⚙) — lokasi muncul di dropdown Source/Request Location PR · izin: System Administrator · input `{ id?, type: BRANCH\|DIVISION\|BU, name, code, parent, location, createWarehouse? }` → OrgUnit { id, type, code, name, parent, status } · transisi: — → ACTIVE (otomatis buat cost center & gudang untuk cabang) · audit: ORG_UNIT_UPSERT (before/after)
- `org.setStatus` — **TO VERIFY** · HAWK: Settings / Locations · izin: System Administrator · input `{ id, status: ACTIVE\|ARCHIVED }` → OrgUnit · transisi: ACTIVE ⇄ ARCHIVED · audit: ORG_UNIT_STATUS

### NV-07 Cost Center & Shared Office Allocation

Cost center per unit dan formula alokasi biaya Office/HQ ke BU.

| Aspek | Spesifikasi |
|---|---|
| Role akses | System Administrator, Finance / Accounting, Owner / Eksekutif, BU Manager |
| Komponen | KPI, donut alokasi, tabel rincian, editor formula |
| Field | Pool, basis, persentase per BU |
| Aksi | Ubah formula → `cc.updateAllocation` |
| Filter | Pool |
| Drawer/modal | Modal formula |
| Input | Persentase |
| Validasi | Total 100% |
| Transisi status | Berlaku periode berikut |
| Approval | Finance/Admin |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-52 rekonsiliasi |
| Format ID | CC-* |

**Operasi adapter:**

- `cc.updateAllocation` — **NEW INTEGRATION REQUIRED** · HAWK: Accounts (job/cost center — kolom JOB[+] di PR/PO) · izin: System Administrator, Finance / Accounting · input `{ pool, basis, splits: {buId: ratio} }` → SharedAllocation · transisi: Formula alokasi baru berlaku periode berikutnya · audit: COST_ALLOC_RULE_CHANGE

### NV-08 User, Role & Access Management

Pengguna, role, scope unit, dan matriks hak akses layar.

| Aspek | Spesifikasi |
|---|---|
| Role akses | System Administrator |
| Komponen | Tab Pengguna/Role/Hak akses, tabel, modal ubah role |
| Field | Nama, role, scope, status |
| Aksi | Ubah role → `user.assignRole` |
| Filter | Role, unit |
| Drawer/modal | Modal |
| Input | Role, scope |
| Validasi | Role valid |
| Transisi status | — |
| Approval | Admin |
| Pengecualian | UI bukan keamanan — backend wajib enforce |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | ROLE_PERMISSION_MATRIX.csv |
| Format ID | U-* |

**Operasi adapter:**

- `user.assignRole` — **TO VERIFY** · HAWK: User/Privilege (header menampilkan PRIVILEGE: Super Admin) · izin: System Administrator · input `{ id, role, scope[] }` → User · transisi: Role berubah, sesi aktif harus di-refresh · audit: USER_ROLE_CHANGE (keamanan — wajib)

### NV-09 Approval Matrix & Rules Configuration

Aturan approval per jenis dokumen & nilai (MRF tier Board B, PO, darurat, budget, tagihan, pembayaran).

| Aspek | Spesifikasi |
|---|---|
| Role akses | System Administrator, Owner / Eksekutif, Finance / Accounting |
| Komponen | Menu jenis dokumen, tabel aturan, visual rantai, toggle aktif |
| Field | Min, max, rantai, eskalasi, SLA |
| Aksi | Ubah batas/aktif → `approval.updateRule` |
| Filter | Jenis dokumen |
| Drawer/modal | Modal aturan |
| Input | Nilai |
| Validasi | Rentang tidak tumpang tindih |
| Transisi status | Versi aturan |
| Approval | Admin/Owner |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | MRF, PO, Budget |
| Format ID | AR-* |

**Operasi adapter:**

- `approval.updateRule` — **TO VERIFY** · HAWK: Approval di PR/PO (field APPROVE STATUS / APPROVED BY) · izin: System Administrator · input `{ id, min?, max?, chain?, active?, slaHours?, note? }` → ApprovalRule (+pending draft) · transisi: ACTIVE v(n) tetap berlaku → DRAFT revisi menunggu terbit · audit: APPROVAL_RULE_DRAFT
- `autoOrder.update` — **NEW INTEGRATION REQUIRED** · HAWK: — (pengaturan aturan baru) · izin: Finance / Accounting, System Administrator, Owner / Eksekutif · input `{ active?, max?, note }` → ApprovalRule AR-13 v(n+1) · transisi: Berlaku untuk pesanan BARU; pesanan berjalan tidak berubah · audit: AUTO_ORDER_RULE_CHANGE (before/after, alasan)

## Modul C — Strategic Target & Ambidex

### NV-10 Annual Target Planning: Spa & Essence

Target revenue & profit tahunan per BU (Spa–Essence saja; target grup di luar lingkup).

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting |
| Komponen | Pilih tahun, KPI target, grafik proyeksi bulanan, kontribusi per cabang, form target |
| Field | Revenue, profit, margin |
| Aksi | Simpan → `target.save`; Ajukan → `target.submit`; Setujui (Owner) → `target.approve` |
| Filter | Tahun, BU |
| Drawer/modal | — |
| Input | Revenue, profit |
| Validasi | profit < revenue |
| Transisi status | DRAFT → SUBMITTED → APPROVED |
| Approval | Owner |
| Pengecualian | Rp125 M grup ditolak di lingkup ini |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-15 budget |
| Format ID | TGT-yyyy-BU |

**Operasi adapter:**

- `target.save` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager · input `{ id, revenue, profit }` → Target · transisi: DRAFT (tetap) · audit: TARGET_EDIT
- `target.submit` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager · input `{ id }` → Target · transisi: DRAFT → SUBMITTED · audit: TARGET_SUBMIT
- `target.approve` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif · input `{ id, decision }` → Target · transisi: SUBMITTED → APPROVED \| DRAFT · audit: TARGET_DECISION

### NV-11 BU Business Driver Tree & KPI Targets

Pohon driver revenue/profit dan KPI target vs realisasi.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division |
| Komponen | Pohon driver, tabel KPI, capaian |
| Field | Driver, target, aktual, capaian |
| Aksi | Drill ke 7P analytics → `nav:59` |
| Filter | BU |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | Read |
| Approval | — |
| Pengecualian | Aktual DEMO |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-59 |
| Format ID | D* |

**Operasi adapter:**


### NV-12 Operational vs Innovation Portfolio

Keseimbangan sumber daya operasional (core) vs inovasi (growth).

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division |
| Komponen | Kartu 2 mesin, donut portofolio, daftar inisiatif |
| Field | Tipe, capex, opex |
| Aksi | Buka proyek → `ui:drawer` |
| Filter | Tahun |
| Drawer/modal | Detail proyek |
| Input | — |
| Validasi | — |
| Transisi status | Read |
| Approval | — |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-13/14 |
| Format ID | PRJ-* |

**Operasi adapter:**


### NV-13 Strategic Project & Investment Proposal

Usulan proyek strategis/investasi dengan business case ringkas.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division |
| Komponen | KPI status, tabel proyek, form usulan |
| Field | Nama, BU, tipe, capex, opex, payback, IRR |
| Aksi | Ajukan proyek → `project.propose` |
| Filter | Status |
| Drawer/modal | Modal usulan |
| Input | Form usulan |
| Validasi | Nama & capex wajib |
| Transisi status | — → PROPOSED |
| Approval | Owner (NV-14) |
| Pengecualian | Nilai belum disetujui = DEMO |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-14, NV-56 |
| Format ID | PRJ-yyyy-nn |

**Operasi adapter:**

- `project.propose` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division · input `{ name, bu, type: OPERATIONAL\|INNOVATION, capex, opex, payback, irr }` → Project · transisi: — → PROPOSED · audit: PROJECT_PROPOSE

### NV-14 Investment Approval, Milestone & Progress

Keputusan investasi, milestone, progres & realisasi.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager |
| Komponen | Stepper tahapan, daftar milestone, slider progres |
| Field | Milestone, due, progres |
| Aksi | Setujui / Tolak → `project.decide`; Update progres → `project.milestone` |
| Filter | Proyek |
| Drawer/modal | — |
| Input | Keputusan, progres |
| Validasi | 0–100% |
| Transisi status | PROPOSED → APPROVED → IN_PROGRESS → COMPLETED |
| Approval | Owner |
| Pengecualian | At-risk ditandai |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-56 kapitalisasi |
| Format ID | PRJ-* |

**Operasi adapter:**

- `project.decide` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif · input `{ id, decision }` → Project · transisi: PROPOSED → APPROVED \| REJECTED · audit: PROJECT_DECISION
- `project.milestone` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager · input `{ id, index, progress }` → Project · transisi: APPROVED → IN_PROGRESS → COMPLETED · audit: PROJECT_PROGRESS

## Modul D — Annual & Monthly 7P Budget

### NV-15 Annual Budget Creation

Menyusun budget tahunan per BU dalam struktur 7P (draft FY2027).

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting |
| Komponen | Pilih budget, tabel baris 7P × kelas, total vs target |
| Field | 7P, kelas OPEX/CAPEX, nilai |
| Aksi | Ubah nilai → `budget.updateLine`; Ajukan → `budget.submit` |
| Filter | FY, BU |
| Drawer/modal | — |
| Input | Nilai per baris |
| Validasi | Hanya DRAFT; belanja < target revenue |
| Transisi status | DRAFT → SUBMITTED |
| Approval | NV-21 |
| Pengecualian | LOCKED tidak bisa diubah |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-10 |
| Format ID | BGT-yyyy-BU |

**Operasi adapter:**

- `budget.updateLine` — **NEW INTEGRATION REQUIRED** · HAWK: Finance (budget?) — tidak terlihat di screenshot · izin: Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting · input `{ id, index, amount }` → Budget · transisi: DRAFT (tetap) · audit: BUDGET_LINE_EDIT
- `budget.submit` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: BU Manager, Finance / Accounting, Owner / Eksekutif · input `{ id }` → Budget · transisi: DRAFT → SUBMITTED · audit: BUDGET_SUBMIT

### NV-16 7P Budget Allocation Overview

Alokasi 7P per BU & cabang; Profit sebagai hasil, bukan belanja.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting |
| Komponen | Kartu 7P berwarna, bar alokasi cabang, tabel |
| Field | Original, revised per P |
| Aksi | Drill ke BvA → `nav:23` |
| Filter | Budget |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | Read |
| Approval | — |
| Pengecualian | Profit tidak dijumlah ke belanja |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-23 |
| Format ID | BGT-* |

**Operasi adapter:**


### NV-17 Routine Item / BHP Budget Planning

Budget BHP rutin per cabang per item per bulan (qty & nilai) — dasar validasi MRF.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting, Supervisor Outlet |
| Komponen | Pilih cabang, tabel item budget, bar utilisasi |
| Field | Qty budget, nilai, aktual, komitmen, sisa |
| Aksi | Lihat MRF terkait → `nav:27` |
| Filter | Cabang, periode |
| Drawer/modal | Detail item |
| Input | — |
| Validasi | — |
| Transisi status | Read (edit via revisi) |
| Approval | — |
| Pengecualian | ≥90% kuning, >100% merah |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-26, NV-30 |
| Format ID | — |

**Operasi adapter:**

- `budget.checkItem` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ branch, item, period, qty }` → { budgetQty, budgetValue, actualQty, commitQty, projectedQty, ratio, status OK\|WARN\|OVER } · transisi: Read-only · audit: — (read)

### NV-18 Non-Routine & Exceptional Budget

Budget non-rutin/pengecualian yang dilacak terpisah dari BHP rutin.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting |
| Komponen | Tabel pos non-rutin, progress pemakaian |
| Field | Nama, P, nilai, terpakai, status |
| Aksi | Lihat → `ui:drawer` |
| Filter | Status |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | SUBMITTED/APPROVED |
| Approval | Owner |
| Pengecualian | MRF non-rutin → rantai pengecualian AR-05 |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-30 |
| Format ID | NRB-* |

**Operasi adapter:**


### NV-19 OPEX, CAPEX & Other Spending Classification

Klasifikasi belanja OPEX/CAPEX/lainnya dan aturan perlakuan akuntansi.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Finance / Accounting |
| Komponen | Kartu kelas, tabel aturan klasifikasi, tabel per 7P |
| Field | Kelas, contoh, akun, perlakuan |
| Aksi | — → `ui:none` |
| Filter | Budget |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | Read |
| Approval | — |
| Pengecualian | PO ≠ beban; BHP dibebankan saat dipakai |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-51 |
| Format ID | — |

**Operasi adapter:**


### NV-20 Quarterly & Monthly Budget Distribution

Distribusi budget tahunan ke bulan/kuartal (pola musiman DEMO).

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting |
| Komponen | Heatmap 7P × bulan, total kuartal |
| Field | Nilai per bulan |
| Aksi | Ganti budget → `ui:filter` |
| Filter | Budget |
| Drawer/modal | — |
| Input | — |
| Validasi | Σ bulan = tahunan |
| Transisi status | Read |
| Approval | — |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-23 |
| Format ID | BGT-* |

**Operasi adapter:**


### NV-21 Budget Submission & Approval

Status pengajuan budget & keputusan berjenjang BU Manager → Owner.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Finance / Accounting |
| Komponen | Daftar budget, stepper rantai, tombol keputusan |
| Field | Status, approval |
| Aksi | Ajukan → `budget.submit`; Setujui / Tolak → `budget.approve` |
| Filter | FY |
| Drawer/modal | — |
| Input | Keputusan |
| Validasi | Urutan rantai |
| Transisi status | DRAFT → SUBMITTED → LOCKED |
| Approval | AR-09 |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-15 |
| Format ID | BGT-* |

**Operasi adapter:**

- `budget.submit` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: BU Manager, Finance / Accounting, Owner / Eksekutif · input `{ id }` → Budget · transisi: DRAFT → SUBMITTED · audit: BUDGET_SUBMIT
- `budget.approve` — **NEW INTEGRATION REQUIRED** · HAWK: — (ref. Modul D handoff: approval.review; budget.lock — TO VERIFY) · izin: Head of Division, BU Manager, Finance / Accounting, Owner / Eksekutif · input `{ id, decision APPROVE\|REJECT, note }` → Budget · transisi: SUBMITTED: Head Review (Head Div / BU Manager) → Finance Review → Owner Review → LOCKED; REJECT → DRAFT · audit: BUDGET_DECISION (actor, waktu, tahap, catatan)

### NV-22 Budget Revision & Quarterly Reforecast

Revisi budget terkunci (Original tetap, Revised berubah) & reforecast kuartalan.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting |
| Komponen | Daftar revisi, form realokasi antar-P, tabel reforecast |
| Field | P, delta, alasan |
| Aksi | Ajukan revisi → `budget.requestRevision`; Putuskan (Owner) → `budget.decideRevision` |
| Filter | Budget |
| Drawer/modal | Modal revisi |
| Input | Delta, alasan |
| Validasi | Alasan wajib; hanya budget LOCKED |
| Transisi status | SUBMITTED → APPROVED/REJECTED |
| Approval | Owner |
| Pengecualian | AI tidak dapat mengubah budget terkunci |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-23 |
| Format ID | REV-* |

**Operasi adapter:**

- `budget.requestRevision` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: BU Manager, Finance / Accounting, Head of Division · input `{ id, quarter, reason, changes:[{p, delta}] \| [{line, newAmount}] }` → BudgetRevision · transisi: — → SUBMITTED · audit: BUDGET_REVISION_REQUEST
- `budget.decideRevision` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif · input `{ id, decision }` → BudgetRevision · transisi: SUBMITTED → APPROVED (Revised += delta, version+1) \| REJECTED · audit: BUDGET_REVISION_DECISION

### NV-23 Budget vs Actual vs Commitment vs Forecast

Original, Revised, Actual, Commitment, Forecast per 7P — bergerak dengan transaksi.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting, Supervisor Outlet |
| Komponen | KPI, bar bertumpuk per P, tabel 5 kolom, legenda definisi |
| Field | Original, Revised, Actual, Commitment, Forecast, sisa |
| Aksi | Drill ke transaksi → `ui:drawer` |
| Filter | Budget |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | Read |
| Approval | — |
| Pengecualian | Forecast = estimasi |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | MRF, ledger |
| Format ID | BGT-* |

**Operasi adapter:**


## Modul E — MRF & Supervisor Approval

### NV-24 Staff Material Request Home

Order Sederhana untuk staff (mobile): pilih barang + jumlah → Pesan sekarang. Cek budget 7P otomatis; lolos aturan AR-13 → approval, PO & kirim supplier otomatis. Staff hanya menekan "Barang sudah diterima".

| Aspek | Spesifikasi |
|---|---|
| Role akses | Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, BU Manager, Owner / Eksekutif |
| Komponen | Daftar barang besar (+/−), bar ringkasan dengan status budget, kartu pesanan 3 langkah, tombol besar Barang sudah diterima, modal kurang/rusak |
| Field | Barang, jumlah, sisa budget, status pesanan |
| Aksi | Pesan sekarang → `order.quick`; Barang sudah diterima → `order.receive`; Form lengkap → `nav:26` |
| Filter | — |
| Drawer/modal | Detail MRF |
| Input | — |
| Validasi | — |
| Transisi status | Read |
| Approval | — |
| Pengecualian | — |
| Responsif | Mobile-first (≥360px), target sentuh ≥44px, satu kolom; tablet 2 kolom |
| Layar terkait | NV-27 |
| Format ID | PR… |

**Operasi adapter:**

- `order.quick` — **NEW INTEGRATION REQUIRED** · HAWK: Purchase Request → Purchase Order (engine yang sama, dipicu aturan) · izin: Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, BU Manager, Asset / Facility PIC, System Administrator · input `{ branch, lines:[{item, qty}], memo? }` → MRF { simple:true, autoCheck{ok, why[]}, status IN_FULFILLMENT \| SUBMITTED } · transisi: Lolos AR-13 → APPROVED (SYS-RULE) → fulfillment → transfer dikirim → PO DRAFT→APPROVED→SENT otomatis; tidak lolos → SUBMITTED ke rantai manual · audit: PR_CREATE + AUTO_APPROVE / AUTO_CHECK (aktor SYS-RULE, bukan AI)
- `order.receive` — **NEW INTEGRATION REQUIRED** · HAWK: Receiving + Inventory issue (engine yang sama) · izin: Staff / Therapist / Housekeeping, Supervisor Outlet, Gudang / Receiving, Head of Division, BU Manager, Asset / Facility PIC, System Administrator · input `{ id (MRF), lines?:[{item, received, damaged}], note? }` → MRF (+ GRN POSTED/STORED, transfer RECEIVED, tagihan otomatis, issue) · transisi: Transfer IN_TRANSIT → RECEIVED; PO SENT → PARTIAL\|RECEIVED; GRN RECEIVED → POSTED → STORED (SYS-RULE); tagihan APPROVED; MRF → FULFILLED bila lengkap · audit: GOODS_PHYSICAL_RECEIPT (manusia) + POST/PUTAWAY/AUTO_BILL/ISSUE (SYS-RULE)
- `item.search` — **TO VERIFY** · HAWK: Inventory / Cards — kolom BARCODE & ITEM di PR entry · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ q \| barcode, location }` → Item[] { id, barcode, name, unit, p7, routine, sourceSOH, requestSOH } · transisi: Read-only · audit: —

### NV-25 Item Catalog / Search / Barcode Scan

Katalog item dengan stok lokal (Request SOH) & scan barcode simulasi.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Staff / Therapist / Housekeeping, Supervisor Outlet, Purchasing, Gudang / Receiving, Owner / Eksekutif |
| Komponen | Pencarian, chip kategori, kartu item, simulasi scan |
| Field | Barcode, item, unit, 7P, stok |
| Aksi | Tambah ke MRF → `ui:cart`; Scan → `ui:scan` |
| Filter | Kategori, 7P |
| Drawer/modal | Detail item |
| Input | Query / barcode |
| Validasi | Barcode 13 digit |
| Transisi status | — |
| Approval | — |
| Pengecualian | Barcode tak dikenal |
| Responsif | Mobile-first (≥360px), target sentuh ≥44px, satu kolom; tablet 2 kolom |
| Layar terkait | NV-26 |
| Format ID | BHP-* |

**Operasi adapter:**

- `item.search` — **TO VERIFY** · HAWK: Inventory / Cards — kolom BARCODE & ITEM di PR entry · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ q \| barcode, location }` → Item[] { id, barcode, name, unit, p7, routine, sourceSOH, requestSOH } · transisi: Read-only · audit: —
- `stock.query` — **TO VERIFY** · HAWK: Inventory + kolom SOURCE SOH / REQUEST SOH di PR entry · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ wh?, item? }` → StockBalance[] { wh, item, onHand, reserved, available, min, max, bin } · transisi: Read-only · audit: —

### NV-26 Create Material Request

Wizard 3 langkah: detail → item & cek stok/budget → ringkasan & kirim. Org, lokasi, cost center otomatis.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, BU Manager, Asset / Facility PIC, Owner / Eksekutif |
| Komponen | Stepper, info otomatis, keranjang item, panel cek budget 7P, ringkasan |
| Field | Unit, jenis, kebutuhan, memo, item, qty, alasan |
| Aksi | Simpan draft → `mrf.create`; Kirim permintaan → `mrf.create` |
| Filter | — |
| Drawer/modal | Katalog item |
| Input | Item + qty |
| Validasi | Qty bulat 1–9999; ≥1 item |
| Transisi status | — → SUBMITTED |
| Approval | Rantai dihitung otomatis |
| Pengecualian | Melebihi budget → BU Manager ditambahkan |
| Responsif | Mobile-first (≥360px), target sentuh ≥44px, satu kolom; tablet 2 kolom |
| Layar terkait | NV-29 |
| Format ID | PR… |

**Operasi adapter:**

- `mrf.create` — **TO VERIFY** · HAWK: Purchases › Transaction › DATA ENTRY \| PURCHASE REQUEST (ID PR20261100001) · izin: Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, BU Manager, Asset / Facility PIC, System Administrator · input `{ branch (REQUEST LOCATION), type ROUTINE\|NON_ROUTINE, memo (MEMO), purpose, lines:[{item, qty (REQUEST), reason (REASON)}], draft? }  — EMPLOYEE & DATE diisi dari sesi` → MRF = PR { id PRyyyymm#####, status OPEN/SUBMITTED, chain[] } · transisi: — → DRAFT \| SUBMITTED · audit: PR_CREATE (source: MRF UI)
- `budget.checkItem` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ branch, item, period, qty }` → { budgetQty, budgetValue, actualQty, commitQty, projectedQty, ratio, status OK\|WARN\|OVER } · transisi: Read-only · audit: — (read)

### NV-27 My Requests & Status Tracking

Daftar permintaan dengan status & progres fulfillment.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Staff / Therapist / Housekeeping, Supervisor Outlet, Asset / Facility PIC, Head of Division, BU Manager, Owner / Eksekutif |
| Komponen | Tab status, tabel/kartu, progress fulfillment |
| Field | No, tanggal, item, status, fulfilled |
| Aksi | Detail → `nav:28`; Batalkan → `mrf.cancel`; Kirim ulang revisi → `mrf.submitDraft` |
| Filter | Status, unit |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | Semua |
| Approval | — |
| Pengecualian | — |
| Responsif | Mobile-first (≥360px), target sentuh ≥44px, satu kolom; tablet 2 kolom |
| Layar terkait | NV-28 |
| Format ID | PR… |

**Operasi adapter:**

- `mrf.cancel` — **TO VERIFY** · HAWK: Purchase Request — CANCEL · izin: Staff / Therapist / Housekeeping, Supervisor Outlet, System Administrator · input `{ id, note }` → MRF · transisi: DRAFT\|SUBMITTED\|REVISION → CANCELLED · audit: PR_CANCEL
- `mrf.submitDraft` — **TO VERIFY** · HAWK: Purchase Request (STATUS OPEN) · izin: Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, BU Manager, Asset / Facility PIC · input `{ id, lines? }` → MRF · transisi: DRAFT\|REVISION → SUBMITTED · audit: PR_SUBMIT

### NV-28 MRF Detail & Fulfillment Tracking

Satu halaman jejak MRF: approval, cek budget, jalur fulfillment (lokal/transfer/beli), dokumen terkait.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator |
| Komponen | Header status, timeline, kartu jalur fulfillment, tabel alokasi, jejak dokumen |
| Field | Alokasi per jalur: qty, siap, diserahkan |
| Aksi | Serahkan ke pemohon → `mrf.issue`; Kirim / terima transfer → `transfer.dispatch`; Buka PO/GRN/Tagihan → `ui:drawer` |
| Filter | — |
| Drawer/modal | Dokumen terkait |
| Input | — |
| Validasi | Invarian Σ alokasi = diminta |
| Transisi status | IN_FULFILLMENT → FULFILLED |
| Approval | — |
| Pengecualian | Kekurangan stok → jalur beli |
| Responsif | Mobile-first (≥360px), target sentuh ≥44px, satu kolom; tablet 2 kolom |
| Layar terkait | TR, PO, GR, BL |
| Format ID | PR…, TR…, PO… |

**Operasi adapter:**

- `mrf.issue` — **TO VERIFY** · HAWK: Inventory — pengeluaran stok (belum terlihat di screenshot) · izin: Gudang / Receiving, Supervisor Outlet · input `{ id }` → MRF + StockLedger ISSUE + Journal CONSUMPTION · transisi: IN_FULFILLMENT → FULFILLED saat issued = requested · audit: STOCK_ISSUE
- `transfer.dispatch` — **TO VERIFY** · HAWK: Inventory transfer · izin: Gudang / Receiving · input `{ id }` → Transfer · transisi: REQUESTED → IN_TRANSIT (stok asal −) · audit: TRANSFER_DISPATCH
- `transfer.receive` — **TO VERIFY** · HAWK: Inventory transfer · izin: Gudang / Receiving, Supervisor Outlet, Staff / Therapist / Housekeeping · input `{ id }` → Transfer · transisi: IN_TRANSIT → RECEIVED (stok tujuan +, reservasi MRF) · audit: TRANSFER_RECEIVE

### NV-29 Supervisor Approval Queue

Antrian approval dengan stok & dampak budget sebelum keputusan.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Supervisor Outlet, Head of Division, BU Manager, Owner / Eksekutif |
| Komponen | Daftar antrian, panel detail, kartu budget, tombol Setujui/Tolak/Revisi/Eskalasi |
| Field | Item, qty, nilai, budget |
| Aksi | Setujui → `mrf.decide`; Tolak → `mrf.decide`; Minta revisi → `mrf.decide`; Eskalasi → `mrf.decide` |
| Filter | Status |
| Drawer/modal | — |
| Input | Catatan |
| Validasi | Catatan wajib non-approve |
| Transisi status | SUBMITTED → APPROVED/REJECTED/REVISION/ESCALATED |
| Approval | Langkah aktif saja |
| Pengecualian | Supervisor hanya unitnya |
| Responsif | Tablet-first, mobile satu kolom |
| Layar terkait | NV-30 |
| Format ID | PR… |

**Operasi adapter:**

- `mrf.decide` — **TO VERIFY** · HAWK: Purchase Request — APPROVE STATUS / APPROVE BY · izin: Supervisor Outlet, Head of Division, BU Manager, Owner / Eksekutif · input `{ id, decision APPROVE\|REJECT\|REVISION\|ESCALATE, note }` → MRF · transisi: SUBMITTED → (rantai) → APPROVED → IN_FULFILLMENT \| REJECTED \| REVISION \| ESCALATED · audit: PR_APPROVAL_DECISION (with budget snapshot)

### NV-30 MRF Budget Impact & Exception Review

Analisis dampak budget per MRF (qty, nilai, aktual, komitmen, proyeksi) + AI assist.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Supervisor Outlet, Head of Division, BU Manager, Owner / Eksekutif, Finance / Accounting |
| Komponen | Gauge budget, tabel dampak, riwayat pemakaian, AI rekomendasi |
| Field | Budget qty/nilai, aktual, komitmen, proyeksi |
| Aksi | Putuskan pengecualian → `mrf.decide` |
| Filter | MRF |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | — |
| Approval | AR-05 |
| Pengecualian | Non-rutin dilacak terpisah |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-17 |
| Format ID | PR… |

**Operasi adapter:**

- `budget.checkItem` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ branch, item, period, qty }` → { budgetQty, budgetValue, actualQty, commitQty, projectedQty, ratio, status OK\|WARN\|OVER } · transisi: Read-only · audit: — (read)
- `mrf.decide` — **TO VERIFY** · HAWK: Purchase Request — APPROVE STATUS / APPROVE BY · izin: Supervisor Outlet, Head of Division, BU Manager, Owner / Eksekutif · input `{ id, decision APPROVE\|REJECT\|REVISION\|ESCALATE, note }` → MRF · transisi: SUBMITTED → (rantai) → APPROVED → IN_FULFILLMENT \| REJECTED \| REVISION \| ESCALATED · audit: PR_APPROVAL_DECISION (with budget snapshot)

## Modul F — Purchasing & Supplier

### NV-31 Purchasing Dashboard / Workbench

Meja kerja purchasing: kebutuhan tanpa PO, PO per status, nilai pembelian.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Purchasing, BU Manager, Owner / Eksekutif |
| Komponen | KPI, daftar kerja, tren, komposisi |
| Field | Kebutuhan, PO, nilai |
| Aksi | Konsolidasi → `nav:32`; Buka PO → `nav:36` |
| Filter | Periode |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | Read |
| Approval | — |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-32..37 |
| Format ID | PO… |

**Operasi adapter:**


### NV-32 Consolidated MRF & Purchasing Planning

Gabungkan kebutuhan pembelian dari MRF disetujui per supplier & lokasi kirim → buat PO.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Purchasing |
| Komponen | Tabel kebutuhan dengan checkbox, grup per supplier/lokasi, panel PO |
| Field | MRF, item, qty, lokasi, supplier |
| Aksi | Buat PO dari pilihan → `po.createFromMrf` |
| Filter | Supplier, lokasi |
| Drawer/modal | — |
| Input | Pilihan baris, supplier |
| Validasi | Satu Deliver To per PO |
| Transisi status | alloc.ref = PO |
| Approval | NV-36 |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-34/35 |
| Format ID | PR… → PO… |

**Operasi adapter:**

- `po.createFromMrf` — **TO VERIFY** · HAWK: Purchases › DATA ENTRY \| PURCHASE ORDER (ID PO20261100001) + tombol PO di PO Request register · izin: Purchasing · input `{ picks:[{mrf, line, alloc}], supplier, prices?, promised, freight, memo }` → PO { id, status DRAFT, lines[{item, qty, price, mrfRefs[]}] } · transisi: MRF purchase alloc.ref = PO; PO — → DRAFT · audit: PO_CREATE (links PR IDs)

### NV-33 Supplier Master & Directory

Direktori supplier, kinerja & term.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Purchasing, Finance / Accounting, BU Manager, Owner / Eksekutif |
| Komponen | Pencarian, tabel, kartu kinerja |
| Field | Nama, kategori, term, rating, on-time |
| Aksi | Detail → `ui:drawer` |
| Filter | Kategori |
| Drawer/modal | Detail supplier |
| Input | — |
| Validasi | — |
| Transisi status | — |
| Approval | — |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | Cards (HAWK) |
| Format ID | SUP-* |

**Operasi adapter:**

- `supplier.list` — **TO VERIFY** · HAWK: Cards (master supplier/card — kolom CARD di PR) · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ q, category }` → Supplier[] { id, name, term (TRADING TERM), priceLevel } · transisi: Read-only · audit: —

### NV-34 Supplier Quotation & Price Comparison

Perbandingan penawaran (harga, lead time, MOQ) & riwayat harga.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Purchasing, BU Manager, Owner / Eksekutif, Finance / Accounting |
| Komponen | Pilih item, tabel perbandingan, grafik riwayat |
| Field | Supplier, harga, lead, MOQ, berlaku |
| Aksi | Pilih untuk PO → `ui:select` |
| Filter | Item |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | — |
| Approval | — |
| Pengecualian | Harga terendah ≠ otomatis terpilih |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-35 |
| Format ID | QT-* |

**Operasi adapter:**

- `quotation.compare` — **NEW INTEGRATION REQUIRED** · HAWK: PRICE LEVEL di PO entry · izin: Purchasing, BU Manager, Owner / Eksekutif, Finance / Accounting · input `{ item }` → Quotation[] { supplier, price, leadDays, validUntil, moq } · transisi: Read-only · audit: —

### NV-35 Purchase Order Creation & Editing

Edit draft PO (mengikuti field HAWK PO entry) lalu ajukan approval.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Purchasing |
| Komponen | Header supplier/term, deliver to, tanggal, tabel baris, total, tombol |
| Field | Supplier, trading term, deliver to, promised date, memo, item, order, price, disc, tax, freight |
| Aksi | Simpan → `po.update`; Ajukan approval → `po.submit` |
| Filter | — |
| Drawer/modal | — |
| Input | Harga, freight, tanggal |
| Validasi | Hanya DRAFT |
| Transisi status | DRAFT → PENDING_APPROVAL |
| Approval | AR-06/07 |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-36 |
| Format ID | PO… |

**Operasi adapter:**

- `po.update` — **TO VERIFY** · HAWK: PO entry (PRICE, DISC, FREIGHT, PROMISED DATE, MEMO) · izin: Purchasing · input `{ id, lines[{price}], freight, promised, memo }` → PO · transisi: DRAFT · audit: PO_EDIT
- `po.submit` — **TO VERIFY** · HAWK: PO STATUS / APPROVED BY · izin: Purchasing · input `{ id }` → PO · transisi: DRAFT → PENDING_APPROVAL · audit: PO_SUBMIT

### NV-36 PO Register, Detail & Approval

Register PO (setara HAWK PO register) + detail + approval + kirim ke vendor.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Purchasing, BU Manager, Owner / Eksekutif, Gudang / Receiving, Finance / Accounting, Head of Division |
| Komponen | Filter, tabel PO, drawer detail dengan rantai & jejak |
| Field | PO, supplier, nilai, status, received/backorder |
| Aksi | Setujui / Tolak → `po.decide`; Kirim ke vendor → `po.send` |
| Filter | Status, supplier |
| Drawer/modal | Detail PO |
| Input | Keputusan |
| Validasi | Rantai |
| Transisi status | PENDING_APPROVAL → APPROVED → SENT → PARTIAL/RECEIVED |
| Approval | AR-06/07 |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-41 |
| Format ID | PO… |

**Operasi adapter:**

- `po.decide` — **TO VERIFY** · HAWK: PO APPROVED BY · izin: Purchasing, BU Manager, Owner / Eksekutif · input `{ id, decision, note }` → PO · transisi: PENDING_APPROVAL → APPROVED \| DRAFT · audit: PO_DECISION
- `po.send` — **TO VERIFY** · HAWK: PO — kirim ke vendor (mekanisme belum diketahui) · izin: Purchasing · input `{ id }` → PO · transisi: APPROVED → SENT · audit: PO_SENT

### NV-37 Emergency Purchase Workflow

Pembelian darurat dengan batas & approval susulan.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Purchasing, Supervisor Outlet, BU Manager, Owner / Eksekutif |
| Komponen | Banner aturan, form darurat, daftar PO darurat |
| Field | Item, qty, supplier, lokasi, alasan |
| Aksi | Buat PO darurat → `po.emergency`; Approval susulan → `po.postApprove` |
| Filter | — |
| Drawer/modal | — |
| Input | Form |
| Validasi | ≤ batas AR-08; alasan ≥10 karakter |
| Transisi status | — → SENT; postApproval PENDING → APPROVED |
| Approval | BU Manager ≤24 jam |
| Pengecualian | Melebihi batas → PO standar |
| Responsif | Mobile-first (≥360px), target sentuh ≥44px, satu kolom; tablet 2 kolom |
| Layar terkait | NV-41 |
| Format ID | PO… |

**Operasi adapter:**

- `po.emergency` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Supervisor Outlet, Purchasing · input `{ item, qty, supplier, wh, price, reason }` → PO (emergency=true, SENT, postApproval PENDING) · transisi: — → SENT, approval susulan ≤ 24 jam · audit: EMERGENCY_PURCHASE
- `po.postApprove` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: BU Manager · input `{ id, decision, note }` → PO · transisi: postApproval PENDING → APPROVED \| REJECTED · audit: EMERGENCY_POST_APPROVAL

## Modul G — Warehouse & Inventory

### NV-38 Inventory Control Dashboard

Nilai stok, low/out of stock, komposisi & pergerakan.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Gudang / Receiving, Purchasing, Finance / Accounting, BU Manager, Owner / Eksekutif, Supervisor Outlet, Head of Division |
| Komponen | KPI, donut komposisi, daftar low stock, mutasi terakhir |
| Field | Nilai, item, low, out |
| Aksi | Buka saldo → `nav:40` |
| Filter | Gudang |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | Read |
| Approval | — |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-40 |
| Format ID | — |

**Operasi adapter:**

- `stock.query` — **TO VERIFY** · HAWK: Inventory + kolom SOURCE SOH / REQUEST SOH di PR entry · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ wh?, item? }` → StockBalance[] { wh, item, onHand, reserved, available, min, max, bin } · transisi: Read-only · audit: —

### NV-39 Warehouse, Storage, Rack & Bin Management

Daftar gudang dinamis, rak & bin (QR) dan kapasitas.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Gudang / Receiving, System Administrator, Owner / Eksekutif |
| Komponen | Daftar gudang, peta rak/bin, form bin |
| Field | Gudang, rak, bin |
| Aksi | Tambah bin → `bin.add` |
| Filter | Gudang |
| Drawer/modal | — |
| Input | Kode bin |
| Validasi | Format KOD-R-NN |
| Transisi status | — |
| Approval | — |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-43 |
| Format ID | WH-*, bin |

**Operasi adapter:**

- `bin.add` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Gudang / Receiving, System Administrator · input `{ wh, bin }` → Warehouse · transisi: — · audit: BIN_CREATE

### NV-40 Stock Balance, Item Details & Ledger

Saldo per gudang (fisik, reservasi, tersedia) dan mutasi (ledger).

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator |
| Komponen | Cari item, tabel saldo, kartu item, ledger |
| Field | Fisik, reservasi, tersedia, min, max, bin |
| Aksi | Lihat ledger → `ui:tab` |
| Filter | Item, gudang |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | Read |
| Approval | — |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | Semua mutasi |
| Format ID | LG-* |

**Operasi adapter:**

- `stock.query` — **TO VERIFY** · HAWK: Inventory + kolom SOURCE SOH / REQUEST SOH di PR entry · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ wh?, item? }` → StockBalance[] { wh, item, onHand, reserved, available, min, max, bin } · transisi: Read-only · audit: —

### NV-41 Incoming Deliveries / Receiving Queue

PO yang dikirim ke vendor & transfer masuk yang menunggu diterima.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Gudang / Receiving, Purchasing, Supervisor Outlet, Owner / Eksekutif |
| Komponen | KPI, tabel antrean, tombol terima |
| Field | PO, supplier, ETA, nilai, status |
| Aksi | Terima (checklist) → `nav:42`; Terima transfer → `transfer.receive` |
| Filter | Gudang |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | SENT/PARTIAL |
| Approval | — |
| Pengecualian | Terlambat ditandai |
| Responsif | Tablet-first |
| Layar terkait | NV-42 |
| Format ID | PO…, TR… |

**Operasi adapter:**

- `transfer.receive` — **TO VERIFY** · HAWK: Inventory transfer · izin: Gudang / Receiving, Supervisor Outlet, Staff / Therapist / Housekeeping · input `{ id }` → Transfer · transisi: IN_TRANSIT → RECEIVED (stok tujuan +, reservasi MRF) · audit: TRANSFER_RECEIVE

### NV-42 PO Receiving, Item Checklist & Document Scan

Buka PO → cek item aktual → catat kurang/rusak → posting GRN. Fisik ≠ posting.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Gudang / Receiving, Owner / Eksekutif |
| Komponen | Stepper 4 langkah, checklist qty, scan dokumen, ringkasan backorder |
| Field | Expected, diterima, rusak, catatan |
| Aksi | Konfirmasi penerimaan fisik → `grn.receive`; Posting ke inventory → `grn.post` |
| Filter | PO |
| Drawer/modal | — |
| Input | Qty aktual |
| Validasi | Diterima ≤ sisa PO; rusak ≤ diterima |
| Transisi status | RECEIVED → POSTED |
| Approval | — |
| Pengecualian | Partial → backorder; rusak → received rejected |
| Responsif | Tablet-first, sentuh besar |
| Layar terkait | NV-43 |
| Format ID | GR… |

**Operasi adapter:**

- `grn.receive` — **TO VERIFY** · HAWK: PO entry kolom RECEIVED / BACKORDER, DELIVERY STATUS · izin: Gudang / Receiving · input `{ po, lines[{received, damaged, note}], docs[] }` → GRN { id GR…, status RECEIVED } · transisi: Penerimaan fisik saja — stok belum berubah · audit: GOODS_PHYSICAL_RECEIPT
- `grn.post` — **TO VERIFY** · HAWK: Purchases › RECEIVED REJECTED tab; Inventory posting · izin: Gudang / Receiving, Finance / Accounting · input `{ id }` → GRN POSTED + ledger RECEIPT + Journal Dr Persediaan / Cr GRNI · transisi: RECEIVED → POSTED; PO → PARTIAL \| RECEIVED · audit: GOODS_RECEIPT_POSTED

### NV-43 Put-Away / QR Storage Confirmation

Scan QR bin untuk menyimpan barang yang sudah diposting; melepaskan stok ke MRF.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Gudang / Receiving |
| Komponen | Daftar tugas put-away, scan bin (simulasi), konfirmasi |
| Field | Item, qty, bin |
| Aksi | Konfirmasi simpan → `grn.putaway` |
| Filter | — |
| Drawer/modal | — |
| Input | Kode bin |
| Validasi | Bin terdaftar |
| Transisi status | POSTED → STORED |
| Approval | — |
| Pengecualian | Bin salah ditolak |
| Responsif | Mobile-first (≥360px), target sentuh ≥44px, satu kolom; tablet 2 kolom |
| Layar terkait | NV-28 |
| Format ID | GR… |

**Operasi adapter:**

- `grn.putaway` — **NEW INTEGRATION REQUIRED** · HAWK: — (bin/rak tidak terlihat di HAWK v2.11.6) · izin: Gudang / Receiving · input `{ id, bins: {lineIndex: binCode} }` → GRN STORED; MRF purchase alloc.readyQty + · transisi: POSTED → STORED · audit: PUTAWAY_CONFIRMED

### NV-44 Inter-Branch Stock Transfer

Transfer antar gudang (otomatis dari MRF atau manual).

| Aspek | Spesifikasi |
|---|---|
| Role akses | Gudang / Receiving, Supervisor Outlet, Owner / Eksekutif |
| Komponen | Form transfer, daftar masuk/keluar |
| Field | Dari, ke, item, qty |
| Aksi | Ajukan transfer → `transfer.create`; Kirim → `transfer.dispatch`; Terima → `transfer.receive` |
| Filter | Arah |
| Drawer/modal | — |
| Input | Form |
| Validasi | Stok tersedia; asal ≠ tujuan |
| Transisi status | REQUESTED → IN_TRANSIT → RECEIVED |
| Approval | — |
| Pengecualian | — |
| Responsif | Tablet-first |
| Layar terkait | NV-28 |
| Format ID | TR… |

**Operasi adapter:**

- `transfer.create` — **TO VERIFY** · HAWK: PO Request register — tombol TRANSFER & kolom TRANSFER ID · izin: Gudang / Receiving, Supervisor Outlet · input `{ from, to, lines[{item, qty}], memo }` → Transfer { id TR…, status REQUESTED } · transisi: — → REQUESTED (+reservasi asal) · audit: TRANSFER_CREATE
- `transfer.dispatch` — **TO VERIFY** · HAWK: Inventory transfer · izin: Gudang / Receiving · input `{ id }` → Transfer · transisi: REQUESTED → IN_TRANSIT (stok asal −) · audit: TRANSFER_DISPATCH
- `transfer.receive` — **TO VERIFY** · HAWK: Inventory transfer · izin: Gudang / Receiving, Supervisor Outlet, Staff / Therapist / Housekeeping · input `{ id }` → Transfer · transisi: IN_TRANSIT → RECEIVED (stok tujuan +, reservasi MRF) · audit: TRANSFER_RECEIVE

### NV-45 Stock Issue, Usage & Return

Penyerahan ke pemohon MRF, pemakaian langsung, dan retur.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Gudang / Receiving, Supervisor Outlet, Owner / Eksekutif |
| Komponen | MRF siap diserahkan, form pemakaian, form retur |
| Field | Item, qty, gudang |
| Aksi | Serahkan MRF → `mrf.issue`; Pemakaian langsung → `stock.issueDirect`; Retur → `stock.return` |
| Filter | Gudang |
| Drawer/modal | — |
| Input | Qty |
| Validasi | Tersedia cukup |
| Transisi status | Ledger ISSUE/RETURN |
| Approval | — |
| Pengecualian | — |
| Responsif | Tablet-first |
| Layar terkait | NV-23 (aktual) |
| Format ID | LG-* |

**Operasi adapter:**

- `mrf.issue` — **TO VERIFY** · HAWK: Inventory — pengeluaran stok (belum terlihat di screenshot) · izin: Gudang / Receiving, Supervisor Outlet · input `{ id }` → MRF + StockLedger ISSUE + Journal CONSUMPTION · transisi: IN_FULFILLMENT → FULFILLED saat issued = requested · audit: STOCK_ISSUE
- `stock.issueDirect` — **TO VERIFY** · HAWK: Inventory issue · izin: Gudang / Receiving, Supervisor Outlet · input `{ wh, item, qty, note }` → Ledger ISSUE + Journal CONSUMPTION · transisi: onHand − · audit: STOCK_ISSUE_DIRECT
- `stock.return` — **TO VERIFY** · HAWK: Inventory return · izin: Gudang / Receiving, Supervisor Outlet · input `{ wh, item, qty, note }` → Ledger RETURN + Journal · transisi: onHand + · audit: STOCK_RETURN

### NV-46 Stock Opname, Adjustment & Discrepancy

Hitung fisik, selisih, persetujuan & penyesuaian.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Gudang / Receiving, Finance / Accounting, BU Manager, Owner / Eksekutif |
| Komponen | Mulai sesi, tabel hitung, ringkasan selisih |
| Field | Sistem, fisik, selisih, nilai |
| Aksi | Mulai opname → `opname.start`; Ajukan hasil → `opname.submit`; Setujui penyesuaian → `opname.approve` |
| Filter | Gudang |
| Drawer/modal | — |
| Input | Qty fisik |
| Validasi | Semua dihitung; selisih dijelaskan |
| Transisi status | COUNTING → SUBMITTED → APPROVED |
| Approval | Finance/BU Manager |
| Pengecualian | Stok < reservasi ditolak |
| Responsif | Tablet-first |
| Layar terkait | NV-51 |
| Format ID | OP-* |

**Operasi adapter:**

- `opname.start` — **TO VERIFY** · HAWK: Inventory (stock take — belum terverifikasi) · izin: Gudang / Receiving · input `{ wh }` → Opname COUNTING (snapshot sistem) · transisi: — → COUNTING · audit: OPNAME_START
- `opname.submit` — **TO VERIFY** · HAWK: Inventory stock take · izin: Gudang / Receiving · input `{ id, counts[], note }` → Opname SUBMITTED · transisi: COUNTING → SUBMITTED · audit: OPNAME_SUBMIT
- `opname.approve` — **TO VERIFY** · HAWK: Inventory adjustment · izin: Finance / Accounting, BU Manager · input `{ id }` → Ledger ADJUST + Journal selisih · transisi: SUBMITTED → APPROVED · audit: STOCK_ADJUSTMENT

## Modul H — Finance & Accounting

### NV-47 Finance Control Dashboard

Kontrol AP, GRNI, jurnal menunggu review, budget & eksepsi.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Finance / Accounting, Owner / Eksekutif, BU Manager |
| Komponen | KPI, antrean kerja, aged payable |
| Field | AP, GRNI, jatuh tempo |
| Aksi | Buka antrean → `nav:49` |
| Filter | — |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | Read |
| Approval | — |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-48..52 |
| Format ID | BL… |

**Operasi adapter:**


### NV-48 AI Invoice & Receipt Capture

Smart Spend Money: foto nota/faktur → ekstraksi AI SIMULASI → koreksi & konfirmasi manusia → klasifikasi 7P/akun → cek budget → approval → gudang/Finance → bukti digital tersimpan. Termasuk tangkapan faktur PO (doc.capture) untuk three-way matching.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, Purchasing, Gudang / Receiving, BU Manager, Finance / Accounting, Asset / Facility PIC, Owner / Eksekutif |
| Komponen | Tab Scan Nota / Review Hasil AI / Riwayat & Bukti; subview mobile NV-M1 Beranda & aksi cepat, M2 Kamera, M3 Review AI, M4 Klasifikasi & budget, M5 Konfirmasi & approval, M6 Detail transaksi (Detail / Bukti Nota / Audit Trail); panel faktur PO (Finance) |
| Field | Supplier, no nota, tanggal, baris (qty × harga, diskon), pajak, total, metode bayar, cabang, cost center, 7P, OPEX/CAPEX/Inventory, akun GL, aset/proyek |
| Aksi | Scan / unggah nota (simulasi) → `spend.capture`; Koreksi & konfirmasi field → `spend.update`; Kirim → `spend.submit`; Setujui / kembalikan / tolak → `spend.approve`; Konfirmasi barang diterima → `spend.receive`; Verifikasi Finance → `spend.verify`; Catat pembayaran → `spend.settle`; Batalkan draft → `spend.cancel`; Ekstrak faktur PO (simulasi) → `doc.capture`; Lanjut ke matching → `doc.match` |
| Filter | Status, alur (lunas / belum dibayar / reimburse / PO) |
| Drawer/modal | Modal bukti nota asli (cek izin) |
| Input | Foto/file, koreksi field, klasifikasi, metode & tanggal bayar |
| Validasi | Field confidence < 85% wajib dikonfirmasi; aritmetika Σ baris − diskon + pajak = total (toleransi Rp1); duplikat diblok; limit darurat AR-08 |
| Transisi status | DRAFT → SUBMITTED → APPROVED → GOODS_CONFIRMED → VERIFIED → SETTLED (RETURNED/REJECTED/CANCELLED) |
| Approval | Supervisor/Kepala Divisi; BU Manager bila melampaui budget atau darurat (post-approval) |
| Pengecualian | AI tidak menyetujui, tidak memposting, tidak mengisi angka yang tidak terbaca; pemverifikasi ≠ approver ≠ PIC gudang ≠ Finance verifikasi ≠ Finance bayar |
| Responsif | Mobile-first (kamera), target sentuh ≥48px, bottom nav ≤5; desktop: frame ponsel + panel kontrol |
| Layar terkait | NV-23, 27, 37, 42, 49, 50, 51 |
| Format ID | SM…, EV…, DC… |

**Operasi adapter:**

- `spend.capture` — **UI-ONLY SIMULATION** · HAWK: Penyimpanan dokumen + OCR/AI — tidak ada di HAWK v2.11.6 yang terlihat · izin: Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, BU Manager, Owner / Eksekutif · input `{ branch, scenario \| upload{name,dataUrl} \| manual, pages, rotation }` → SpendMoney SM… (DRAFT) + Evidence EV… (file asli tidak diubah) · transisi: — → DRAFT · audit: RECEIPT_UPLOADED, AI_EXTRACTED
- `spend.update` — **TO VERIFY** · HAWK: Spend Money draft (TO VERIFY) · izin: Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, BU Manager, Owner / Eksekutif · input `{ id, fields{}, lines[], confirm[], cls{p,type,routine,branch,asset,project}, emergency{reason}, draft }` → SpendMoney (koreksi disimpan terpisah dari hasil AI) · transisi: DRAFT\|RETURNED → sama · audit: EXTRACTION_CORRECTED
- `spend.submit` — **TO VERIFY** · HAWK: Spend Money / Bills / Purchases › Bills (TO VERIFY) · izin: Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, BU Manager, Owner / Eksekutif · input `{ id }` → SpendMoney SUBMITTED + rute approval; flow PO → Document DC… ke three-way match · transisi: DRAFT → SUBMITTED \| IN_MATCHING · audit: SPEND_SUBMITTED (konfirmasi data ≠ persetujuan)
- `spend.approve` — **TO VERIFY** · HAWK: Approval engine HAWK (TO VERIFY) · izin: Supervisor Outlet, Head of Division, BU Manager, Owner / Eksekutif · input `{ id, decision APPROVE\|RETURN\|REJECT, note }` → SpendMoney · transisi: SUBMITTED → APPROVED \| RETURNED \| REJECTED · audit: SPEND_APPROVAL
- `spend.receive` — **TO VERIFY** · HAWK: Inventory receiving (TO VERIFY) · izin: Gudang / Receiving · input `{ id, qty[] }` → SpendMoney GOODS_CONFIRMED + StockLedger RECEIPT · transisi: APPROVED → GOODS_CONFIRMED · audit: GOODS_CONFIRMED
- `spend.verify` — **TO VERIFY** · HAWK: Purchases › Bills / tab JOURNAL (TO VERIFY) · izin: Finance / Accounting · input `{ id, decision?, cls{p,type}?, note }` → SpendMoney VERIFIED + Journal (PENDING_REVIEW, diposting via gl.post) · transisi: APPROVED\|GOODS_CONFIRMED → VERIFIED \| RETURNED \| REJECTED · audit: SPEND_FINANCE_VERIFIED
- `spend.settle` — **TO VERIFY** · HAWK: Payment / rekonsiliasi kas (TO VERIFY) · izin: Finance / Accounting · input `{ id, confirm: true }` → Payment PY… + Journal pembayaran · transisi: VERIFIED → SETTLED · audit: SPEND_SETTLED
- `spend.cancel` — **TO VERIFY** · HAWK: — · izin: Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, BU Manager, Owner / Eksekutif · input `{ id, note }` → SpendMoney CANCELLED · transisi: DRAFT\|RETURNED → CANCELLED · audit: SPEND_CANCELLED
- `doc.capture` — **UI-ONLY SIMULATION** · HAWK: — · izin: Finance / Accounting · input `{ file \| photo }  (prototype: { sample })` → CapturedDoc { fields, lines, confidence } · transisi: — → EXTRACTED · audit: DOC_CAPTURED (AI model id + version wajib di produksi)
- `doc.match` — **NEW INTEGRATION REQUIRED** · HAWK: Purchases › BILLS ITEM (tagihan) — logika matching belum terlihat · izin: Finance / Accounting · input `{ id }` → Match { checks[supplier, po, grn, dup, qty, price], lines[] } · transisi: EXTRACTED → MATCHED \| MISMATCH · audit: THREE_WAY_MATCH_RUN

### NV-49 PO–Receipt–Invoice Three-Way Matching

Cocokkan PO, GRN, faktur; selisih jelas; verifikasi manusia → AP draft.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Finance / Accounting, Purchasing |
| Komponen | Daftar dokumen, checklist 6 cek, tabel baris 3 kolom, form verifikasi |
| Field | Qty PO/terima/faktur, harga PO/faktur |
| Aksi | Jalankan matching → `doc.match`; Verifikasi & buat AP draft → `doc.verify`; Tolak → `doc.verify` |
| Filter | Status |
| Drawer/modal | — |
| Input | Catatan |
| Validasi | Duplikat ditolak; selisih butuh penjelasan |
| Transisi status | MATCHED/MISMATCH → VERIFIED |
| Approval | Manusia |
| Pengecualian | AI tidak menyetujui |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-50 |
| Format ID | DC…, BL… |

**Operasi adapter:**

- `doc.match` — **NEW INTEGRATION REQUIRED** · HAWK: Purchases › BILLS ITEM (tagihan) — logika matching belum terlihat · izin: Finance / Accounting · input `{ id }` → Match { checks[supplier, po, grn, dup, qty, price], lines[] } · transisi: EXTRACTED → MATCHED \| MISMATCH · audit: THREE_WAY_MATCH_RUN
- `doc.verify` — **TO VERIFY** · HAWK: Purchases › BILLS ITEM / BILLS SERVICE · izin: Finance / Accounting · input `{ id, decision, note }` → Bill { id BL…, status DRAFT } · transisi: MATCHED\|MISMATCH → VERIFIED (+AP draft) \| REJECTED · audit: HUMAN_VERIFICATION

### NV-50 Accounts Payable & Payment Control

Tagihan AP, persetujuan (SoD), jadwal & pembayaran dengan konfirmasi.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Finance / Accounting, Owner / Eksekutif, BU Manager |
| Komponen | Tab status, tabel tagihan, aging, modal konfirmasi bayar |
| Field | Tagihan, supplier, jatuh tempo, nilai, status |
| Aksi | Sudah dibayar (order otomatis) → `order.pay`; Atur order otomatis AR-13 → `autoOrder.update`; Setujui tagihan → `bill.approve`; Bayar (konfirmasi) → `bill.pay`; Telusuri ke MRF → `ui:trace` |
| Filter | Status |
| Drawer/modal | Detail + jejak |
| Input | Konfirmasi |
| Validasi | SoD; konfirmasi eksplisit |
| Transisi status | DRAFT → APPROVED → PAID |
| Approval | AR-10/11 |
| Pengecualian | AI tidak bisa membayar |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-51 |
| Format ID | BL…, PY-* |

**Operasi adapter:**

- `order.pay` — **TO VERIFY** · HAWK: Finance (pembayaran) — belum terverifikasi · izin: Finance / Accounting · input `{ po, confirm: true }` → PO (+ Payment, Journal) · transisi: Tagihan APPROVED → PAID; sisa PO belum diterima → uang muka (Dr 1160 / Cr 1110), dikompensasi otomatis saat barang diterima · audit: PAYMENT_CONFIRMED
- `autoOrder.update` — **NEW INTEGRATION REQUIRED** · HAWK: — (pengaturan aturan baru) · izin: Finance / Accounting, System Administrator, Owner / Eksekutif · input `{ active?, max?, note }` → ApprovalRule AR-13 v(n+1) · transisi: Berlaku untuk pesanan BARU; pesanan berjalan tidak berubah · audit: AUTO_ORDER_RULE_CHANGE (before/after, alasan)
- `bill.approve` — **TO VERIFY** · HAWK: Purchases › BILLS / AGED PAYABLE; Journal · izin: Finance / Accounting, BU Manager · input `{ id }` → Bill APPROVED + Journal Dr GRNI, Dr PPN Masukan / Cr Utang Usaha · transisi: DRAFT → APPROVED · audit: AP_APPROVE
- `bill.pay` — **TO VERIFY** · HAWK: Finance (pembayaran) — belum terverifikasi · izin: Finance / Accounting · input `{ id, confirm: true }` → Payment + Journal Dr Utang / Cr Bank · transisi: APPROVED → PAID · audit: PAYMENT_EXECUTED

### NV-51 GL Posting, Accounting & Exception Review

Review jurnal usulan (receipt, konsumsi, faktur, bayar) sebelum diposting oleh engine HAWK.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Finance / Accounting, Owner / Eksekutif |
| Komponen | Filter jenis, tabel jurnal, detail debit/kredit, peta perlakuan |
| Field | Akun, CC, debit, kredit |
| Aksi | Posting ke HAWK Finance → `gl.post` |
| Filter | Jenis, status |
| Drawer/modal | Detail jurnal |
| Input | — |
| Validasi | Seimbang |
| Transisi status | PENDING_REVIEW → POSTED |
| Approval | Finance |
| Pengecualian | Bukan buku besar kedua |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | Sumber dokumen |
| Format ID | JV… |

**Operasi adapter:**

- `gl.post` — **TO VERIFY** · HAWK: Purchases › JOURNAL tab / Accounts · izin: Finance / Accounting · input `{ id }` → Journal POSTED (oleh engine HAWK — bukan buku besar kedua) · transisi: PENDING_REVIEW → POSTED · audit: GL_POST

### NV-52 Cost Allocation & Inter-BU Reconciliation

Alokasi biaya shared office & rekonsiliasi antar-BU.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Finance / Accounting, Owner / Eksekutif, BU Manager |
| Komponen | Tabel alokasi per pool, ringkasan per BU, status rekonsiliasi |
| Field | Pool, biaya, basis, alokasi |
| Aksi | Ubah formula (NV-07) → `nav:7` |
| Filter | Periode |
| Drawer/modal | — |
| Input | — |
| Validasi | Σ = 100% |
| Transisi status | Read |
| Approval | — |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-07 |
| Format ID | CC-* |

**Operasi adapter:**

- `cc.updateAllocation` — **NEW INTEGRATION REQUIRED** · HAWK: Accounts (job/cost center — kolom JOB[+] di PR/PO) · izin: System Administrator, Finance / Accounting · input `{ pool, basis, splits: {buId: ratio} }` → SharedAllocation · transisi: Formula alokasi baru berlaku periode berikutnya · audit: COST_ALLOC_RULE_CHANGE

## Modul I — Asset & Facility Management

### NV-53 Asset Register & Asset Inventory

Register aset, nilai perolehan & buku, status.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Asset / Facility PIC, Finance / Accounting, Owner / Eksekutif, BU Manager |
| Komponen | KPI, donut kategori, tabel |
| Field | Kode, nama, lokasi, nilai, buku, status |
| Aksi | Detail → `nav:54` |
| Filter | Unit, kategori |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | Read |
| Approval | — |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-54 |
| Format ID | AST-* |

**Operasi adapter:**


### NV-54 Asset Detail, Location & Lifecycle

Detail aset, lokasi, siklus hidup, jadwal & riwayat.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Asset / Facility PIC, Finance / Accounting, Owner / Eksekutif, BU Manager |
| Komponen | Kartu aset + QR, lifecycle, jadwal, riwayat |
| Field | Spesifikasi, lokasi, depresiasi |
| Aksi | Laporkan kerusakan → `mt.create` |
| Filter | Aset |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | — |
| Approval | — |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-55 |
| Format ID | AST-* |

**Operasi adapter:**

- `mt.create` — **TO VERIFY** · HAWK: Asset Management (menu utama HAWK) · izin: Staff / Therapist / Housekeeping, Supervisor Outlet, Asset / Facility PIC · input `{ asset, issue, priority }` → MaintenanceRequest MT… · transisi: — → SUBMITTED · audit: MAINT_REQUEST

### NV-55 Maintenance Request & Work Order

Request → review supervisor → WO → suku cadang (MRF) → selesai → histori aset.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Asset / Facility PIC, Supervisor Outlet, Staff / Therapist / Housekeeping, BU Manager, Owner / Eksekutif |
| Komponen | KPI, daftar MR, daftar WO, aksi berjenjang |
| Field | Aset, masalah, prioritas, status |
| Aksi | Lapor → `mt.create`; Tinjau → `mt.review`; Buat WO → `wo.create`; Minta suku cadang → `wo.requestPart`; Selesaikan → `wo.complete` |
| Filter | Status |
| Drawer/modal | — |
| Input | Form |
| Validasi | Uraian wajib |
| Transisi status | SUBMITTED → APPROVED → IN_PROGRESS → COMPLETED |
| Approval | Supervisor |
| Pengecualian | — |
| Responsif | Mobile-first (≥360px), target sentuh ≥44px, satu kolom; tablet 2 kolom |
| Layar terkait | MRF, NV-54 |
| Format ID | MT…, WO… |

**Operasi adapter:**

- `mt.create` — **TO VERIFY** · HAWK: Asset Management (menu utama HAWK) · izin: Staff / Therapist / Housekeeping, Supervisor Outlet, Asset / Facility PIC · input `{ asset, issue, priority }` → MaintenanceRequest MT… · transisi: — → SUBMITTED · audit: MAINT_REQUEST
- `mt.review` — **TO VERIFY** · HAWK: Asset Management · izin: Supervisor Outlet, Asset / Facility PIC · input `{ id, decision, note }` → MaintenanceRequest · transisi: SUBMITTED → APPROVED \| REJECTED · audit: MAINT_REVIEW
- `wo.create` — **TO VERIFY** · HAWK: Purchases register tab WORK ORDER · izin: Asset / Facility PIC · input `{ mt, assignee, labor }` → WorkOrder WO… · transisi: APPROVED MT → IN_PROGRESS; WO OPEN · audit: WO_CREATE
- `wo.requestPart` — **TO VERIFY** · HAWK: Work Order → Purchase Request · izin: Asset / Facility PIC · input `{ id, item, qty }` → { wo, mrf } · transisi: WO → WAITING_PARTS; MRF NON_ROUTINE SUBMITTED · audit: WO_PART_REQUEST
- `wo.complete` — **TO VERIFY** · HAWK: Work Order · izin: Asset / Facility PIC · input `{ id, notes, cost }` → WO COMPLETED + Asset.history + Journal beban pemeliharaan · transisi: OPEN\|WAITING_PARTS → COMPLETED · audit: WO_COMPLETE

### NV-56 Asset Capitalization, Depreciation & Disposal

Kapitalisasi, jadwal depresiasi garis lurus, disposal.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Finance / Accounting, Asset / Facility PIC, Owner / Eksekutif |
| Komponen | KPI, tabel depresiasi, form kapitalisasi, daftar disposal |
| Field | Nilai, umur, akumulasi, buku |
| Aksi | Kapitalisasi → `asset.capitalize`; Usul disposal → `asset.dispose`; Setujui disposal → `asset.dispose` |
| Filter | — |
| Drawer/modal | — |
| Input | Form |
| Validasi | Nilai & umur > 0 |
| Transisi status | ACTIVE → PENDING_DISPOSAL → DISPOSED |
| Approval | Finance/Owner |
| Pengecualian | — |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-51 |
| Format ID | AST-* |

**Operasi adapter:**

- `asset.capitalize` — **TO VERIFY** · HAWK: Asset Management · izin: Finance / Accounting, Asset / Facility PIC · input `{ name, cat, org, cost, life, source }` → Asset + Journal kapitalisasi · transisi: — → ACTIVE · audit: ASSET_CAPITALIZE
- `asset.dispose` — **TO VERIFY** · HAWK: Asset Management · izin: Asset / Facility PIC, Finance / Accounting, Owner / Eksekutif · input `{ id, step REQUEST\|APPROVE, reason }` → Asset + Journal disposal · transisi: ACTIVE → PENDING_DISPOSAL → DISPOSED · audit: ASSET_DISPOSAL

## Modul J — AI Intelligence & Reporting

### NV-57 Executive & BU AI Intelligence Dashboard

Ringkasan eksekutif Spa–Essence + insight AI berprioritas (tanpa konsolidasi grup).

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Finance / Accounting, Head of Division |
| Komponen | KPI, donut BU, tren, panel insight |
| Field | Revenue, profit, OPEX |
| Aksi | Buka insight → `ui:drawer`; Tindak lanjut → `insight.act` |
| Filter | Periode |
| Drawer/modal | Insight + bukti |
| Input | — |
| Validasi | — |
| Transisi status | Read |
| Approval | — |
| Pengecualian | Grup di luar lingkup |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-60 |
| Format ID | AI-* |

**Operasi adapter:**

- `ai.insights` — **UI-ONLY SIMULATION** · HAWK: Analytics (menu utama HAWK) — sumber data saja · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ scope, role, asOf }` → Insight[] { kind FACT\|METRIC\|FORECAST\|HYPOTHESIS\|RECOMMENDATION, finding, evidence[], source, asOf, impact, recommendation, owner } · transisi: Read-only · audit: AI_INSIGHT_VIEWED (opsional)
- `insight.act` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC · input `{ id, action ACKNOWLEDGE\|ASSIGN\|DONE\|DISMISS, note, owner }` → InsightState · transisi: OPEN → ACKNOWLEDGED → ASSIGNED → DONE \| DISMISSED · audit: AI_RECOMMENDATION_ACTION

### NV-58 Division / Supervisor AI Insights

Insight sesuai role/unit dengan bukti & alur tindak lanjut.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Supervisor Outlet, Head of Division, BU Manager, Purchasing, Gudang / Receiving, Asset / Facility PIC, Owner / Eksekutif |
| Komponen | Filter area, kartu insight, drawer bukti |
| Field | Finding, bukti, sumber, as-of, dampak, rekomendasi, owner |
| Aksi | Akui → `insight.act`; Tugaskan → `insight.act`; Selesai → `insight.act`; Abaikan → `insight.act` |
| Filter | Area, severitas |
| Drawer/modal | Bukti |
| Input | Catatan |
| Validasi | Alasan wajib untuk abaikan |
| Transisi status | OPEN → ACK → ASSIGN → DONE |
| Approval | Manusia |
| Pengecualian | AI tidak mengeksekusi |
| Responsif | Mobile-first (≥360px), target sentuh ≥44px, satu kolom; tablet 2 kolom |
| Layar terkait | Semua |
| Format ID | AI-* |

**Operasi adapter:**

- `ai.insights` — **UI-ONLY SIMULATION** · HAWK: Analytics (menu utama HAWK) — sumber data saja · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ scope, role, asOf }` → Insight[] { kind FACT\|METRIC\|FORECAST\|HYPOTHESIS\|RECOMMENDATION, finding, evidence[], source, asOf, impact, recommendation, owner } · transisi: Read-only · audit: AI_INSIGHT_VIEWED (opsional)
- `insight.act` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC · input `{ id, action ACKNOWLEDGE\|ASSIGN\|DONE\|DISMISS, note, owner }` → InsightState · transisi: OPEN → ACKNOWLEDGED → ASSIGNED → DONE \| DISMISSED · audit: AI_RECOMMENDATION_ACTION

### NV-59 7P Productivity, Efficiency & Effectiveness Analytics

Produktivitas (revenue/biaya), efisiensi (aktual vs waktu), efektivitas (KPI) per 7P.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting |
| Komponen | Indeks 7P, tabel skor, matriks efisiensi-efektivitas |
| Field | Skor per P |
| Aksi | Drill → `nav:23` |
| Filter | BU |
| Drawer/modal | — |
| Input | — |
| Validasi | — |
| Transisi status | Read |
| Approval | — |
| Pengecualian | Skor = metrik terhitung DEMO |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-23 |
| Format ID | — |

**Operasi adapter:**

- `ai.insights` — **UI-ONLY SIMULATION** · HAWK: Analytics (menu utama HAWK) — sumber data saja · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ scope, role, asOf }` → Insight[] { kind FACT\|METRIC\|FORECAST\|HYPOTHESIS\|RECOMMENDATION, finding, evidence[], source, asOf, impact, recommendation, owner } · transisi: Read-only · audit: AI_INSIGHT_VIEWED (opsional)

### NV-60 AI Scenario Forecast & Evidence Drill-Down

Skenario what-if (tamu, harga, biaya, cabang baru) + bukti asumsi.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Finance / Accounting |
| Komponen | Slider driver, tabel skenario, grafik, daftar asumsi |
| Field | Revenue, profit, margin, capex |
| Aksi | Hitung ulang → `ai.scenario` |
| Filter | Horizon 12 bulan |
| Drawer/modal | Asumsi |
| Input | Driver |
| Validasi | Rentang slider |
| Transisi status | Read |
| Approval | — |
| Pengecualian | ESTIMASI — bukan fakta |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile |
| Layar terkait | NV-10 |
| Format ID | — |

**Operasi adapter:**

- `ai.scenario` — **UI-ONLY SIMULATION** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Finance / Accounting · input `{ drivers{} }` → Forecast[] · transisi: Read-only · audit: —

## Modul K — Flow Intelligence & Control Tower

### NV-61 Procurement Flow Control Tower

Satu menara kendali alur pengadaan: PFHI (provisional), tepat waktu, P90, overdue, bottleneck, supplier, heatmap SLA, pusat aksi & eskalasi, insight AI — semua bisa di-drill ke pesanan.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting, Purchasing, Gudang / Receiving, Supervisor Outlet, System Administrator |
| Komponen | Hero + Source/As-of/DEMO, filter (periode, BU, cabang, divisi, supplier, kategori, PIC, prioritas, status), KPI warna, PFHI + komponen, rata-rata waktu per tahap, heatmap aging×tahap, Action & Escalation Center, performa supplier, alasan keterlambatan, tren, kartu AI frosted, kebijakan SLA berversi, tabel drill-down |
| Field | PFHI, % tepat waktu, P90 siklus (jam), overdue, kritis (P0), berisiko, rata-rata jam/tahap, OTD supplier, lead time, isu (ref, prioritas, dampak, PIC, tenggat, bukti, rekomendasi, status) |
| Aksi | Tinjau → `flow.review`; Tugaskan → `flow.assign`; Minta update → `flow.requestUpdate`; Eskalasi → `flow.escalate`; Catat alasan → `flow.recordReason`; Ubah ETA → `flow.changeEta`; Selesaikan isu → `flow.resolve`; Ubah SLA → `flow.updateSla`; Ubah bobot PFHI → `flow.setWeights`; Simulasi waktu (DEMO) → `demo.advanceClock`; Buka perjalanan → `nav:62` |
| Filter | Periode, BU, cabang, divisi, supplier, kategori, PIC, prioritas, status |
| Drawer/modal | Modal aksi isu; drill-down ke NV-62 |
| Input | Alasan, catatan, ETA, bobot, jam SLA |
| Validasi | Alasan wajib; bobot = 100%; ETA ≥ hari ini; jatuh tempo asli tidak ditimpa |
| Transisi status | Isu: OPEN → IN_PROGRESS → MONITORING/ESCALATED → RESOLVED |
| Approval | — |
| Pengecualian | PFHI provisional, bukan skor tervalidasi; riwayat Agt–Okt = DEMO |
| Responsif | Desktop/tablet data-rich; tabel scroll horizontal di mobile; drawer layar penuh di mobile; KPI 2 kolom & tombol besar di mobile |
| Layar terkait | NV-62, NV-31, NV-41, NV-57, NV-58 |
| Format ID | IS-…, SLA-…, PR…, PO…, TR… |

**Operasi adapter:**

- `flow.sync` — **TO VERIFY** · HAWK: Riwayat status dokumen PR/PO/Transfer/Receiving (TO VERIFY — perlu event/timestamp per tahap) · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ }` → FlowIssue[] (SLA dievaluasi ulang) · transisi: Otomatis setelah setiap operasi · audit: FLOW_ISSUE_OPENED / AUTO_RESOLVE
- `flow.review` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ id, note? }` → FlowIssue · transisi: Status tetap; tercatat ditinjau · audit: FLOW_REVIEW
- `flow.assign` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Purchasing, Gudang / Receiving, Finance / Accounting, Supervisor Outlet, Asset / Facility PIC · input `{ id, user }` → FlowIssue · transisi: OPEN → IN_PROGRESS · audit: FLOW_ASSIGN
- `flow.requestUpdate` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting · input `{ id, note }` → FlowIssue · transisi: → IN_PROGRESS · audit: FLOW_REQUEST_UPDATE
- `flow.escalate` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting · input `{ id, note }` → FlowIssue · transisi: → ESCALATED (tingkat +1 sesuai kebijakan SLA) · audit: FLOW_ESCALATE
- `flow.recordReason` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ id, code, note, evidence? }` → FlowIssue · transisi: Alasan tercatat (bukan penilaian individu) · audit: FLOW_DELAY_REASON
- `flow.changeEta` — **TO VERIFY** · HAWK: Purchase Order — field tanggal kirim (TO VERIFY apakah HAWK menyimpan riwayat revisi) · izin: Purchasing, Owner / Eksekutif, BU Manager, Head of Division · input `{ po, eta, reason, code? }` → PO (eta + etaHistory; promised tetap) · transisi: Isu terkait → MONITORING · audit: PO_ETA_REVISED
- `flow.resolve` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ id, note }` → FlowIssue RESOLVED · transisi: → RESOLVED (riwayat SLA tetap) · audit: FLOW_RESOLVE
- `flow.updateSla` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, System Administrator, BU Manager · input `{ id, hours?, warn?, active?, note }` → SlaPolicy v(n+1) · transisi: Versi baru berlaku untuk evaluasi berikutnya; jatuh tempo isu lama tidak ditimpa · audit: SLA_POLICY_CHANGE (before/after)
- `flow.setWeights` — **UI-ONLY SIMULATION** · HAWK: — · izin: Owner / Eksekutif, System Administrator · input `{ weights{onTime,activeSla,p90,data}, note }` → FlowConfig v(n+1) · transisi: — · audit: PFHI_WEIGHTS_CHANGE
- `demo.advanceClock` — **UI-ONLY SIMULATION** · HAWK: — (hanya demo) · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ hours }` → { now } · transisi: Jam demo maju · audit: DEMO_CLOCK

### NV-62 Order Journey & Delay Investigation

Perjalanan satu pesanan dari MRF sampai selesai: 12 tahap, waktu & SLA per tahap, pemenuhan lokal/transfer/PO, keterlambatan & bukti, ETA revisi, keuangan terkait, analisis akar masalah AI.

| Aspek | Spesifikasi |
|---|---|
| Role akses | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator |
| Komponen | Pemilih MRF, header progres, timeline 12 tahap (klik), kartu jalur lokal/transfer/PO, tab Detail / Analisis Keterlambatan / Dokumen & Bukti / Keuangan, aksi isu, AI fakta vs hipotesis |
| Field | MRF, pemohon, barang & qty, dokumen terkait, qty terpenuhi, waktu mulai/selesai/tunggu (kalender & jam kerja), jatuh tempo SLA, PIC, aksi berikut, alasan, ETA revisi + riwayat, penerimaan sebagian/backorder, ketergantungan pembayaran |
| Aksi | Catat alasan → `flow.recordReason`; Ubah ETA → `flow.changeEta`; Eskalasi → `flow.escalate`; Minta update → `flow.requestUpdate`; Selesaikan isu → `flow.resolve`; Buka dokumen → `ui:drawer` |
| Filter | Pilih MRF (sesuai scope) |
| Drawer/modal | Drawer dokumen (MRF/PO/TR/GRN/BL/PY) |
| Input | Alasan, ETA |
| Validasi | Sama seperti NV-61 |
| Transisi status | Status MRF + status SLA per tahap |
| Approval | — |
| Pengecualian | Staff hanya melihat pesanannya sendiri/cabangnya; event dari riwayat dokumen = TO VERIFY di HAWK |
| Responsif | Mobile-first (≥360px), target sentuh ≥44px, satu kolom; tablet 2 kolom; timeline scroll horizontal |
| Layar terkait | NV-61, NV-27, NV-36, NV-41, NV-49 |
| Format ID | PR…, PO…, TR…, GR…, BL…, PY…, EV-… |

**Operasi adapter:**

- `flow.recordReason` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ id, code, note, evidence? }` → FlowIssue · transisi: Alasan tercatat (bukan penilaian individu) · audit: FLOW_DELAY_REASON
- `flow.changeEta` — **TO VERIFY** · HAWK: Purchase Order — field tanggal kirim (TO VERIFY apakah HAWK menyimpan riwayat revisi) · izin: Purchasing, Owner / Eksekutif, BU Manager, Head of Division · input `{ po, eta, reason, code? }` → PO (eta + etaHistory; promised tetap) · transisi: Isu terkait → MONITORING · audit: PO_ETA_REVISED
- `flow.escalate` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting · input `{ id, note }` → FlowIssue · transisi: → ESCALATED (tingkat +1 sesuai kebijakan SLA) · audit: FLOW_ESCALATE
- `flow.requestUpdate` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting · input `{ id, note }` → FlowIssue · transisi: → IN_PROGRESS · audit: FLOW_REQUEST_UPDATE
- `flow.resolve` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ id, note }` → FlowIssue RESOLVED · transisi: → RESOLVED (riwayat SLA tetap) · audit: FLOW_RESOLVE
- `flow.review` — **NEW INTEGRATION REQUIRED** · HAWK: — · izin: Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator · input `{ id, note? }` → FlowIssue · transisi: Status tetap; tercatat ditinjau · audit: FLOW_REVIEW

