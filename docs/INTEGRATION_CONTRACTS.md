# INTEGRATION CONTRACTS — HAWK Integration Adapter

_Dibuat otomatis oleh `node tools/gen-docs.js` dari `assets/js/core/contracts.js`. Jangan edit manual._

**Tidak ada endpoint produksi di dokumen ini.** Kolom "Operasi" adalah nama deskriptif untuk adapter, bukan URL. Kolom "Hook paket Owner" memetakan ke nama placeholder di DEVELOPER_INTEGRATION_NOTES.md (juga belum terkonfirmasi).

| Status | Jumlah | Arti |
|---|---|---|
| CONFIRMED EXISTING | 0 | Hanya dengan dokumentasi/verifikasi engine — belum ada |
| TO VERIFY | 51 | UI HAWK v2.11.6 menunjukkan kemampuan terkait (screenshot 7 Nov 2026), API belum terdokumentasi |
| NEW INTEGRATION REQUIRED | 37 | Tidak ada bukti di engine; butuh pekerjaan backend/konfigurasi |
| UI-ONLY SIMULATION | 9 | Hanya prototipe (AI/OCR/skenario); tidak boleh disajikan sebagai live |

Setiap operasi yang diimplementasikan wajib punya: endpoint/method terverifikasi, skema request/response, permission di server, state workflow, audit event, **idempotency key** untuk operasi tulis, error terstruktur (`code`, `message`, `retryable`), dan bukti tes.

## Modul B

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `org.upsertUnit` | `organization.manageUnit` | Settings / Locations (ikon ⚙) — lokasi muncul di dropdown Source/Request Location PR | **TO VERIFY** | System Administrator | `{ id?, type: BRANCH\|DIVISION\|BU, name, code, parent, location, createWarehouse? }` | OrgUnit { id, type, code, name, parent, status } | — → ACTIVE (otomatis buat cost center & gudang untuk cabang) | Kode unik; parent wajib & aktif; tanpa hierarki melingkar; nama wajib | ORG_UNIT_UPSERT (before/after) |
| `org.setStatus` | `organization.manageUnit` | Settings / Locations | **TO VERIFY** | System Administrator | `{ id, status: ACTIVE\|ARCHIVED }` | OrgUnit | ACTIVE ⇄ ARCHIVED | Tolak arsip bila ada MRF/PO terbuka atau sub-unit aktif; aktivasi butuh parent aktif; tanpa hard delete | ORG_UNIT_STATUS |
| `cc.updateAllocation` | — | Accounts (job/cost center — kolom JOB[+] di PR/PO) | **NEW INTEGRATION REQUIRED** | System Administrator, Finance / Accounting | `{ pool, basis, splits: {buId: ratio} }` | SharedAllocation | Formula alokasi baru berlaku periode berikutnya | Total = 100% | COST_ALLOC_RULE_CHANGE |
| `user.assignRole` | `permissions.canAccess` | User/Privilege (header menampilkan PRIVILEGE: Super Admin) | **TO VERIFY** | System Administrator | `{ id, role, scope[] }` | User | Role berubah, sesi aktif harus di-refresh | Role terdaftar; scope ≥ 1 unit | USER_ROLE_CHANGE (keamanan — wajib) |
| `approval.updateRule` | — | Approval di PR/PO (field APPROVE STATUS / APPROVED BY) | **TO VERIFY** | System Administrator | `{ id, min?, max?, chain?, active?, slaHours?, note? }` | ApprovalRule (+pending draft) | ACTIVE v(n) tetap berlaku → DRAFT revisi menunggu terbit | min ≥ 0; max > min; SLA > 0; rantai ≥ 1 role; harus ada perubahan | APPROVAL_RULE_DRAFT |
| `approval.publishRule` | — | Approval di PR/PO | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif | `{ id, decision: APPROVE\|REJECT }` | ApprovalRule v(n+1) | DRAFT → ACTIVE v(n+1) \| dibuang | Maker ≠ checker (SoD); dokumen berjalan tetap pakai rantai saat diajukan | APPROVAL_RULE_PUBLISH (before/after) |

## Modul B/H

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `cc.reviewAllocation` | — | — (alur review alokasi bersama belum terlihat di HAWK v2.11.6) | **NEW INTEGRATION REQUIRED** | BU Manager, Owner / Eksekutif | `{ pool, bu?, decision AGREE\|DISPUTE, note }` | SharedAllocation.reviews[bu] | Tiap BU memberi persetujuan / keberatan | BU Manager hanya untuk BU-nya; keberatan wajib alasan; tidak bisa setelah dikunci | COST_ALLOC_REVIEW |
| `cc.lockAllocation` | — | — (tutup periode alokasi — TO VERIFY dengan HAWK Finance) | **NEW INTEGRATION REQUIRED** | Finance / Accounting | `{ pool, period? }` | SharedAllocation.locked | REVIEWED → LOCKED (formula tidak bisa diubah lagi) | Semua BU sudah review, tidak ada keberatan | COST_ALLOC_LOCK |
| `autoOrder.update` | — | — (pengaturan aturan baru) | **NEW INTEGRATION REQUIRED** | Finance / Accounting, System Administrator, Owner / Eksekutif | `{ active?, max?, note }` | ApprovalRule AR-13 v(n+1) | Berlaku untuk pesanan BARU; pesanan berjalan tidak berubah | Role Finance / Super Admin / Owner; batas Rp0–25 jt; alasan wajib; harus ada perubahan | AUTO_ORDER_RULE_CHANGE (before/after, alasan) |

## Modul C

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `target.save` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager | `{ id, revenue, profit }` | Target | DRAFT (tetap) | profit < revenue; hanya draft | TARGET_EDIT |
| `target.submit` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager | `{ id }` | Target | DRAFT → SUBMITTED | — | TARGET_SUBMIT |
| `target.approve` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif | `{ id, decision }` | Target | SUBMITTED → APPROVED \| DRAFT | Hanya Owner | TARGET_DECISION |
| `project.propose` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager, Head of Division | `{ name, bu, type: OPERATIONAL\|INNOVATION, capex, opex, payback, irr }` | Project | — → PROPOSED | Nama & capex wajib | PROJECT_PROPOSE |
| `project.decide` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif | `{ id, decision }` | Project | PROPOSED → APPROVED \| REJECTED | Hanya Owner | PROJECT_DECISION |
| `project.milestone` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager | `{ id, index, progress }` | Project | APPROVED → IN_PROGRESS → COMPLETED | 0 ≤ progress ≤ 1 | PROJECT_PROGRESS |

## Modul D

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `budget.updateLine` | — | Finance (budget?) — tidak terlihat di screenshot | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting | `{ id, index, amount }` | Budget | DRAFT (tetap) | Hanya DRAFT; nilai ≥ 0; LOCKED ditolak | BUDGET_LINE_EDIT |
| `budget.submit` | — | — | **NEW INTEGRATION REQUIRED** | BU Manager, Finance / Accounting, Owner / Eksekutif | `{ id }` | Budget | DRAFT → SUBMITTED | Belanja < target revenue | BUDGET_SUBMIT |
| `budget.approve` | — | — (ref. Modul D handoff: approval.review; budget.lock — TO VERIFY) | **NEW INTEGRATION REQUIRED** | Head of Division, BU Manager, Finance / Accounting, Owner / Eksekutif | `{ id, decision APPROVE\|REJECT, note }` | Budget | SUBMITTED: Head Review (Head Div / BU Manager) → Finance Review → Owner Review → LOCKED; REJECT → DRAFT | Urutan rantai AR-09; role tahap; alasan wajib saat dikembalikan | BUDGET_DECISION (actor, waktu, tahap, catatan) |
| `budget.upsertPlanLine` | `budget.getLines` | — (ref. Modul D handoff: budgetLine.upsert — TO VERIFY) | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting | `{ id, line?, unit, p, name, item?, qty, price, kind OPEX\|INVENTORY\|CAPEX\|WORKING_CAPITAL\|DEPOSIT\|FIN_INVESTMENT\|PERFORMANCE, stream OPERATIONAL\|INNOVATION, routine, kpi }` | BudgetPlanLine (agregat 7P dihitung ulang) | DRAFT (tetap) | Hanya DRAFT; qty > 0; Profit ⇔ PERFORMANCE; unit milik BU; unit & 7P baris existing tidak dapat diubah | BUDGET_LINE_UPSERT (before/after) |
| `budget.setWeights` | — | — (ref. Modul D handoff: budget.periodAllocation.update — TO VERIFY) | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting | `{ id, line, weights[12] }` | BudgetPlanLine | DRAFT (tetap) | Hanya DRAFT; 12 nilai ≥ 0; Σ = 100% (±0,1) | BUDGET_PERIOD_ALLOCATION |
| `nonroutine.create` | — | — (ref. Modul D handoff: budget.exception.create — TO VERIFY) | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting, Supervisor Outlet | `{ unit, p, name, amount, kind, reason }` | NonRoutineBudget NRB-* | — → SUBMITTED | Nilai > 0; alasan wajib; bukan Profit; tidak mengubah baseline BHP rutin | NONROUTINE_CREATE |
| `nonroutine.decide` | — | — (ref. Modul D handoff: approval.request — TO VERIFY) | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting | `{ id, decision, note }` | NonRoutineBudget | SUBMITTED → APPROVED \| REJECTED | Pengaju ≠ pemutus (SoD); alasan wajib saat tolak | NONROUTINE_DECISION |
| `budget.requestRevision` | `budget.submitRevision` | — | **NEW INTEGRATION REQUIRED** | BU Manager, Finance / Accounting, Head of Division | `{ id, quarter, reason, changes:[{p, delta}] \| [{line, newAmount}] }` | BudgetRevision | — → SUBMITTED | Budget LOCKED; alasan wajib; realokasi antar-7P net nol; usulan baris tidak mengubah Revised sebelum disetujui | BUDGET_REVISION_REQUEST |
| `budget.decideRevision` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif | `{ id, decision }` | BudgetRevision | SUBMITTED → APPROVED (Revised += delta, version+1) \| REJECTED | Original tidak pernah diubah | BUDGET_REVISION_DECISION |

## Modul D/E

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `budget.checkItem` (baca) | `budget.validateRequest` | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `{ branch, item, period, qty }` | { budgetQty, budgetValue, actualQty, commitQty, projectedQty, ratio, status OK\|WARN\|OVER } | Read-only | — | — (read) |

## Modul E

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `item.search` (baca) | — | Inventory / Cards — kolom BARCODE & ITEM di PR entry | **TO VERIFY** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `{ q \| barcode, location }` | Item[] { id, barcode, name, unit, p7, routine, sourceSOH, requestSOH } | Read-only | — | — |
| `mrf.create` | `mrf.create` | Purchases › Transaction › DATA ENTRY \| PURCHASE REQUEST (ID PR20261100001) | **TO VERIFY** | Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, BU Manager, Asset / Facility PIC, System Administrator | `{ branch (REQUEST LOCATION), type ROUTINE\|NON_ROUTINE, memo (MEMO), purpose, lines:[{item, qty (REQUEST), reason (REASON)}], draft? }  — EMPLOYEE & DATE diisi dari sesi` | MRF = PR { id PRyyyymm#####, status OPEN/SUBMITTED, chain[] } | — → DRAFT \| SUBMITTED | Qty bulat 1–9999; unit aktif; ≥1 item | PR_CREATE (source: MRF UI) |
| `mrf.submitDraft` | — | Purchase Request (STATUS OPEN) | **TO VERIFY** | Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, BU Manager, Asset / Facility PIC | `{ id, lines? }` | MRF | DRAFT\|REVISION → SUBMITTED | — | PR_SUBMIT |
| `mrf.decide` | `mrf.approve` | Purchase Request — APPROVE STATUS / APPROVE BY | **TO VERIFY** | Supervisor Outlet, Head of Division, BU Manager, Owner / Eksekutif | `{ id, decision APPROVE\|REJECT\|REVISION\|ESCALATE, note }` | MRF | SUBMITTED → (rantai) → APPROVED → IN_FULFILLMENT \| REJECTED \| REVISION \| ESCALATED | Hanya approver langkah aktif; catatan wajib untuk non-approve; supervisor hanya unitnya | PR_APPROVAL_DECISION (with budget snapshot) |
| `mrf.cancel` | — | Purchase Request — CANCEL | **TO VERIFY** | Staff / Therapist / Housekeeping, Supervisor Outlet, System Administrator | `{ id, note }` | MRF | DRAFT\|SUBMITTED\|REVISION → CANCELLED | Hanya pemohon | PR_CANCEL |

## Modul E/G

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `mrf.planFulfillment` | — | PO Request register — tombol TRANSFER dan PO, kolom TRANSFER ID / PO ID | **TO VERIFY** | Supervisor Outlet, Head of Division, BU Manager, Owner / Eksekutif, Gudang / Receiving | `{ id }` | MRF.lines[].alloc[] { path LOCAL\|TRANSFER\|PURCHASE, qty, ref } | APPROVED → IN_FULFILLMENT (+ reservasi stok, + Transfer REQUESTED) | Σ alloc.qty = qty diminta (invarian) | PR_FULFILLMENT_PLAN |
| `mrf.issue` | `mrf.getFulfillment / inventory.issue` | Inventory — pengeluaran stok (belum terlihat di screenshot) | **TO VERIFY** | Gudang / Receiving, Supervisor Outlet | `{ id }` | MRF + StockLedger ISSUE + Journal CONSUMPTION | IN_FULFILLMENT → FULFILLED saat issued = requested | onHand & reserved cukup | STOCK_ISSUE |
| `order.receive` | — | Receiving + Inventory issue (engine yang sama) | **NEW INTEGRATION REQUIRED** | Staff / Therapist / Housekeeping, Supervisor Outlet, Gudang / Receiving, Head of Division, BU Manager, Asset / Facility PIC, System Administrator | `{ id (MRF), lines?:[{item, received, damaged}], note? }` | MRF (+ GRN POSTED/STORED, transfer RECEIVED, tagihan otomatis, issue) | Transfer IN_TRANSIT → RECEIVED; PO SENT → PARTIAL\|RECEIVED; GRN RECEIVED → POSTED → STORED (SYS-RULE); tagihan APPROVED; MRF → FULFILLED bila lengkap | Hanya pemesan/staf unit; qty ≤ sisa; rusak ≤ diterima; harus ada barang yang ditunggu | GOODS_PHYSICAL_RECEIPT (manusia) + POST/PUTAWAY/AUTO_BILL/ISSUE (SYS-RULE) |

## Modul E/F

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `order.quick` | — | Purchase Request → Purchase Order (engine yang sama, dipicu aturan) | **NEW INTEGRATION REQUIRED** | Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, BU Manager, Asset / Facility PIC, System Administrator | `{ branch, lines:[{item, qty}], memo? }` | MRF { simple:true, autoCheck{ok, why[]}, status IN_FULFILLMENT \| SUBMITTED } | Lolos AR-13 → APPROVED (SYS-RULE) → fulfillment → transfer dikirim → PO DRAFT→APPROVED→SENT otomatis; tidak lolos → SUBMITTED ke rantai manual | Rutin; supplier default; budget item 7P tidak OVER/NO_BUDGET; nilai ≤ batas AR-13; validasi MRF biasa | PR_CREATE + AUTO_APPROVE / AUTO_CHECK (aktor SYS-RULE, bukan AI) |

## Modul H

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `order.pay` | — | Finance (pembayaran) — belum terverifikasi | **TO VERIFY** | Finance / Accounting | `{ po, confirm: true }` | PO (+ Payment, Journal) | Tagihan APPROVED → PAID; sisa PO belum diterima → uang muka (Dr 1160 / Cr 1110), dikompensasi otomatis saat barang diterima | Konfirmasi eksplisit manusia; PO sudah dikirim; tidak boleh lunas dua kali; AI/sistem tidak pernah memanggil operasi ini | PAYMENT_CONFIRMED |
| `doc.capture` | `invoice.extractDraft` | — | **UI-ONLY SIMULATION** | Finance / Accounting | `{ file \| photo }  (prototype: { sample })` | CapturedDoc { fields, lines, confidence } | — → EXTRACTED | Format gambar/PDF | DOC_CAPTURED (AI model id + version wajib di produksi) |
| `doc.match` | `finance.matchThreeWay` | Purchases › BILLS ITEM (tagihan) — logika matching belum terlihat | **NEW INTEGRATION REQUIRED** | Finance / Accounting | `{ id }` | Match { checks[supplier, po, grn, dup, qty, price], lines[] } | EXTRACTED → MATCHED \| MISMATCH | — | THREE_WAY_MATCH_RUN |
| `doc.verify` | `finance.verifyPayable` | Purchases › BILLS ITEM / BILLS SERVICE | **TO VERIFY** | Finance / Accounting | `{ id, decision, note }` | Bill { id BL…, status DRAFT } | MATCHED\|MISMATCH → VERIFIED (+AP draft) \| REJECTED | Duplikat ditolak; selisih butuh catatan ≥10 karakter; verifikasi oleh manusia | HUMAN_VERIFICATION |
| `bill.approve` | — | Purchases › BILLS / AGED PAYABLE; Journal | **TO VERIFY** | Finance / Accounting, BU Manager | `{ id }` | Bill APPROVED + Journal Dr GRNI, Dr PPN Masukan / Cr Utang Usaha | DRAFT → APPROVED | Pemisahan tugas verifikator ≠ penyetuju | AP_APPROVE |
| `bill.pay` | — | Finance (pembayaran) — belum terverifikasi | **TO VERIFY** | Finance / Accounting | `{ id, confirm: true }` | Payment + Journal Dr Utang / Cr Bank | APPROVED → PAID | Konfirmasi eksplisit manusia; AI tidak pernah memanggil operasi ini | PAYMENT_EXECUTED |
| `gl.post` | `finance.postApprovedJournal` | Purchases › JOURNAL tab / Accounts | **TO VERIFY** | Finance / Accounting | `{ id }` | Journal POSTED (oleh engine HAWK — bukan buku besar kedua) | PENDING_REVIEW → POSTED | Debit = kredit | GL_POST |
| `spend.capture` | — | Penyimpanan dokumen + OCR/AI — tidak ada di HAWK v2.11.6 yang terlihat | **UI-ONLY SIMULATION** | Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, BU Manager, Owner / Eksekutif | `{ branch, scenario \| upload{name,dataUrl} \| manual, pages, rotation }` | SpendMoney SM… (DRAFT) + Evidence EV… (file asli tidak diubah) | — → DRAFT | Outlet dalam cakupan; AI tidak mengisi angka yang tidak terbaca | RECEIPT_UPLOADED, AI_EXTRACTED |
| `spend.update` | — | Spend Money draft (TO VERIFY) | **TO VERIFY** | Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, BU Manager, Owner / Eksekutif | `{ id, fields{}, lines[], confirm[], cls{p,type,routine,branch,asset,project}, emergency{reason}, draft }` | SpendMoney (koreksi disimpan terpisah dari hasil AI) | DRAFT\|RETURNED → sama | Hanya pengaju; 7P ∈ 6 kategori belanja (Profit bukan belanja) | EXTRACTION_CORRECTED |
| `spend.submit` | — | Spend Money / Bills / Purchases › Bills (TO VERIFY) | **TO VERIFY** | Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, BU Manager, Owner / Eksekutif | `{ id }` | SpendMoney SUBMITTED + rute approval; flow PO → Document DC… ke three-way match | DRAFT → SUBMITTED \| IN_MATCHING | Field wajib, aritmetika cocok, field ragu dikonfirmasi, tidak duplikat, batas darurat AR-08, SKU untuk persediaan | SPEND_SUBMITTED (konfirmasi data ≠ persetujuan) |
| `spend.approve` | — | Approval engine HAWK (TO VERIFY) | **TO VERIFY** | Supervisor Outlet, Head of Division, BU Manager, Owner / Eksekutif | `{ id, decision APPROVE\|RETURN\|REJECT, note }` | SpendMoney | SUBMITTED → APPROVED \| RETURNED \| REJECTED | Pengaju ≠ penyetuju; Supervisor hanya outletnya; over budget → + BU Manager; darurat → approval susulan BU Manager | SPEND_APPROVAL |
| `spend.verify` | — | Purchases › Bills / tab JOURNAL (TO VERIFY) | **TO VERIFY** | Finance / Accounting | `{ id, decision?, cls{p,type}?, note }` | SpendMoney VERIFIED + Journal (PENDING_REVIEW, diposting via gl.post) | APPROVED\|GOODS_CONFIRMED → VERIFIED \| RETURNED \| REJECTED | Finance menetapkan OPEX/CAPEX/Persediaan; tidak mengubah persediaan ↔ beban setelah barang diterima | SPEND_FINANCE_VERIFIED |
| `spend.settle` | — | Payment / rekonsiliasi kas (TO VERIFY) | **TO VERIFY** | Finance / Accounting | `{ id, confirm: true }` | Payment PY… + Journal pembayaran | VERIFIED → SETTLED | Konfirmasi eksplisit; satu nota hanya sekali dibayar/direimburse | SPEND_SETTLED |
| `spend.cancel` | — | — | **TO VERIFY** | Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, BU Manager, Owner / Eksekutif | `{ id, note }` | SpendMoney CANCELLED | DRAFT\|RETURNED → CANCELLED | Hanya pengaju | SPEND_CANCELLED |

## Modul F

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `supplier.list` (baca) | — | Cards (master supplier/card — kolom CARD di PR) | **TO VERIFY** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `{ q, category }` | Supplier[] { id, name, term (TRADING TERM), priceLevel } | Read-only | — | — |
| `quotation.compare` (baca) | — | PRICE LEVEL di PO entry | **NEW INTEGRATION REQUIRED** | Purchasing, BU Manager, Owner / Eksekutif, Finance / Accounting | `{ item }` | Quotation[] { supplier, price, leadDays, validUntil, moq } | Read-only | — | — |
| `po.createFromMrf` | `purchasing.createPO` | Purchases › DATA ENTRY \| PURCHASE ORDER (ID PO20261100001) + tombol PO di PO Request register | **TO VERIFY** | Purchasing | `{ picks:[{mrf, line, alloc}], supplier, prices?, promised, freight, memo }` | PO { id, status DRAFT, lines[{item, qty, price, mrfRefs[]}] } | MRF purchase alloc.ref = PO; PO — → DRAFT | Satu Deliver To per PO; kebutuhan belum ber-PO | PO_CREATE (links PR IDs) |
| `po.update` | — | PO entry (PRICE, DISC, FREIGHT, PROMISED DATE, MEMO) | **TO VERIFY** | Purchasing | `{ id, lines[{price}], freight, promised, memo }` | PO | DRAFT | Hanya DRAFT | PO_EDIT |
| `po.submit` | — | PO STATUS / APPROVED BY | **TO VERIFY** | Purchasing | `{ id }` | PO | DRAFT → PENDING_APPROVAL | — | PO_SUBMIT |
| `po.decide` | `purchasing.approvePO` | PO APPROVED BY | **TO VERIFY** | Purchasing, BU Manager, Owner / Eksekutif | `{ id, decision, note }` | PO | PENDING_APPROVAL → APPROVED \| DRAFT | Rantai AR-06/07 berdasar total | PO_DECISION |
| `po.send` | `purchasing.getPO` | PO — kirim ke vendor (mekanisme belum diketahui) | **TO VERIFY** | Purchasing | `{ id }` | PO | APPROVED → SENT | — | PO_SENT |
| `po.emergency` | — | — | **NEW INTEGRATION REQUIRED** | Supervisor Outlet, Purchasing | `{ item, qty, supplier, wh, price, reason }` | PO (emergency=true, SENT, postApproval PENDING) | — → SENT, approval susulan ≤ 24 jam | Total ≤ batas AR-08; alasan ≥ 10 karakter | EMERGENCY_PURCHASE |
| `po.postApprove` | — | — | **NEW INTEGRATION REQUIRED** | BU Manager | `{ id, decision, note }` | PO | postApproval PENDING → APPROVED \| REJECTED | — | EMERGENCY_POST_APPROVAL |

## Modul G

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `stock.query` (baca) | `inventory.getStock` | Inventory + kolom SOURCE SOH / REQUEST SOH di PR entry | **TO VERIFY** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `{ wh?, item? }` | StockBalance[] { wh, item, onHand, reserved, available, min, max, bin } | Read-only | — | — |
| `transfer.create` | `inventory.transfer` | PO Request register — tombol TRANSFER & kolom TRANSFER ID | **TO VERIFY** | Gudang / Receiving, Supervisor Outlet | `{ from, to, lines[{item, qty}], memo }` | Transfer { id TR…, status REQUESTED } | — → REQUESTED (+reservasi asal) | Stok tersedia cukup; asal ≠ tujuan | TRANSFER_CREATE |
| `transfer.dispatch` | `inventory.transfer` | Inventory transfer | **TO VERIFY** | Gudang / Receiving | `{ id }` | Transfer | REQUESTED → IN_TRANSIT (stok asal −) | onHand cukup | TRANSFER_DISPATCH |
| `transfer.receive` | `inventory.transfer` | Inventory transfer | **TO VERIFY** | Gudang / Receiving, Supervisor Outlet, Staff / Therapist / Housekeeping | `{ id }` | Transfer | IN_TRANSIT → RECEIVED (stok tujuan +, reservasi MRF) | — | TRANSFER_RECEIVE |
| `grn.receive` | `inventory.receive` | PO entry kolom RECEIVED / BACKORDER, DELIVERY STATUS | **TO VERIFY** | Gudang / Receiving | `{ po, lines[{received, damaged, note}], docs[] }` | GRN { id GR…, status RECEIVED } | Penerimaan fisik saja — stok belum berubah | received ≤ sisa PO; damaged ≤ received | GOODS_PHYSICAL_RECEIPT |
| `grn.putaway` | — | — (bin/rak tidak terlihat di HAWK v2.11.6) | **NEW INTEGRATION REQUIRED** | Gudang / Receiving | `{ id, bins: {lineIndex: binCode} }` | GRN STORED; MRF purchase alloc.readyQty + | POSTED → STORED | Bin terdaftar di gudang tujuan (scan QR) | PUTAWAY_CONFIRMED |
| `bin.add` | — | — | **NEW INTEGRATION REQUIRED** | Gudang / Receiving, System Administrator | `{ wh, bin }` | Warehouse | — | Format KOD-R-NN unik | BIN_CREATE |
| `stock.issueDirect` | — | Inventory issue | **TO VERIFY** | Gudang / Receiving, Supervisor Outlet | `{ wh, item, qty, note }` | Ledger ISSUE + Journal CONSUMPTION | onHand − | Tersedia cukup | STOCK_ISSUE_DIRECT |
| `stock.return` | — | Inventory return | **TO VERIFY** | Gudang / Receiving, Supervisor Outlet | `{ wh, item, qty, note }` | Ledger RETURN + Journal | onHand + | qty > 0 | STOCK_RETURN |
| `opname.start` | — | Inventory (stock take — belum terverifikasi) | **TO VERIFY** | Gudang / Receiving | `{ wh }` | Opname COUNTING (snapshot sistem) | — → COUNTING | Satu opname aktif per gudang | OPNAME_START |
| `opname.submit` | `inventory.count` | Inventory stock take | **TO VERIFY** | Gudang / Receiving | `{ id, counts[], note }` | Opname SUBMITTED | COUNTING → SUBMITTED | Semua dihitung; selisih wajib dijelaskan | OPNAME_SUBMIT |
| `opname.approve` | `inventory.count` | Inventory adjustment | **TO VERIFY** | Finance / Accounting, BU Manager | `{ id }` | Ledger ADJUST + Journal selisih | SUBMITTED → APPROVED | Stok tidak boleh < reservasi | STOCK_ADJUSTMENT |

## Modul G/H

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `grn.post` | `inventory.receive` | Purchases › RECEIVED REJECTED tab; Inventory posting | **TO VERIFY** | Gudang / Receiving, Finance / Accounting | `{ id }` | GRN POSTED + ledger RECEIPT + Journal Dr Persediaan / Cr GRNI | RECEIVED → POSTED; PO → PARTIAL \| RECEIVED | Sekali posting | GOODS_RECEIPT_POSTED |
| `spend.receive` | — | Inventory receiving (TO VERIFY) | **TO VERIFY** | Gudang / Receiving | `{ id, qty[] }` | SpendMoney GOODS_CONFIRMED + StockLedger RECEIPT | APPROVED → GOODS_CONFIRMED | Hanya jenis Persediaan; qty fisik = nota | GOODS_CONFIRMED |

## Modul I

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `mt.create` | — | Asset Management (menu utama HAWK) | **TO VERIFY** | Staff / Therapist / Housekeeping, Supervisor Outlet, Asset / Facility PIC | `{ asset, issue, priority }` | MaintenanceRequest MT… | — → SUBMITTED | Aset aktif; uraian wajib | MAINT_REQUEST |
| `mt.review` | — | Asset Management | **TO VERIFY** | Supervisor Outlet, Asset / Facility PIC | `{ id, decision, note }` | MaintenanceRequest | SUBMITTED → APPROVED \| REJECTED | Supervisor hanya unitnya | MAINT_REVIEW |
| `wo.create` | `asset.createWorkOrder` | Purchases register tab WORK ORDER | **TO VERIFY** | Asset / Facility PIC | `{ mt, assignee, labor }` | WorkOrder WO… | APPROVED MT → IN_PROGRESS; WO OPEN | MT disetujui | WO_CREATE |
| `wo.complete` | — | Work Order | **TO VERIFY** | Asset / Facility PIC | `{ id, notes, cost }` | WO COMPLETED + Asset.history + Journal beban pemeliharaan | OPEN\|WAITING_PARTS → COMPLETED | Catatan wajib | WO_COMPLETE |

## Modul I/E

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `wo.requestPart` | — | Work Order → Purchase Request | **TO VERIFY** | Asset / Facility PIC | `{ id, item, qty }` | { wo, mrf } | WO → WAITING_PARTS; MRF NON_ROUTINE SUBMITTED | — | WO_PART_REQUEST |

## Modul I/H

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `asset.capitalize` | `asset.register` | Asset Management | **TO VERIFY** | Finance / Accounting, Asset / Facility PIC | `{ name, cat, org, cost, life, source }` | Asset + Journal kapitalisasi | — → ACTIVE | Nilai > batas kapitalisasi (kebijakan) | ASSET_CAPITALIZE |
| `asset.dispose` | — | Asset Management | **TO VERIFY** | Asset / Facility PIC, Finance / Accounting, Owner / Eksekutif | `{ id, step REQUEST\|APPROVE, reason }` | Asset + Journal disposal | ACTIVE → PENDING_DISPOSAL → DISPOSED | Approve oleh Finance/Owner | ASSET_DISPOSAL |

## Modul J

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `ai.insights` (baca) | `intelligence.getSourceLinkedInsights` | Analytics (menu utama HAWK) — sumber data saja | **UI-ONLY SIMULATION** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `{ scope, role, asOf }` | Insight[] { kind FACT\|METRIC\|FORECAST\|HYPOTHESIS\|RECOMMENDATION, finding, evidence[], source, asOf, impact, recommendation, owner } | Read-only | — | AI_INSIGHT_VIEWED (opsional) |
| `ai.scenario` (baca) | — | — | **UI-ONLY SIMULATION** | Owner / Eksekutif, BU Manager, Finance / Accounting | `{ drivers{} }` | Forecast[] | Read-only | — | — |
| `insight.act` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC | `{ id, action ACKNOWLEDGE\|ASSIGN\|DONE\|DISMISS, note, owner }` | InsightState | OPEN → ACKNOWLEDGED → ASSIGNED → DONE \| DISMISSED | Alasan wajib untuk DISMISS; AI tidak mengeksekusi aksi | AI_RECOMMENDATION_ACTION |

## Modul K

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `flow.sync` | — | Riwayat status dokumen PR/PO/Transfer/Receiving (TO VERIFY — perlu event/timestamp per tahap) | **TO VERIFY** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `{ }` | FlowIssue[] (SLA dievaluasi ulang) | Otomatis setelah setiap operasi | Satu isu per masalah (kunci MRF\|dokumen\|tahap); jatuh tempo asli tidak pernah ditimpa | FLOW_ISSUE_OPENED / AUTO_RESOLVE |
| `flow.review` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `{ id, note? }` | FlowIssue | Status tetap; tercatat ditinjau | — | FLOW_REVIEW |
| `flow.assign` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager, Head of Division, Purchasing, Gudang / Receiving, Finance / Accounting, Supervisor Outlet, Asset / Facility PIC | `{ id, user }` | FlowIssue | OPEN → IN_PROGRESS | Manajer atau PIC tahap | FLOW_ASSIGN |
| `flow.requestUpdate` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting | `{ id, note }` | FlowIssue | → IN_PROGRESS | Pesan wajib | FLOW_REQUEST_UPDATE |
| `flow.escalate` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting | `{ id, note }` | FlowIssue | → ESCALATED (tingkat +1 sesuai kebijakan SLA) | Alasan wajib; maksimum tingkat kebijakan | FLOW_ESCALATE |
| `flow.recordReason` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `{ id, code, note, evidence? }` | FlowIssue | Alasan tercatat (bukan penilaian individu) | Kategori dari daftar; penjelasan ≥ 5 karakter; PIC atau manajer | FLOW_DELAY_REASON |
| `flow.changeEta` | — | Purchase Order — field tanggal kirim (TO VERIFY apakah HAWK menyimpan riwayat revisi) | **TO VERIFY** | Purchasing, Owner / Eksekutif, BU Manager, Head of Division | `{ po, eta, reason, code? }` | PO (eta + etaHistory; promised tetap) | Isu terkait → MONITORING | PO SENT/PARTIAL; ETA ≥ hari ini; alasan wajib; tanggal janji asli tidak diubah | PO_ETA_REVISED |
| `flow.resolve` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `{ id, note }` | FlowIssue RESOLVED | → RESOLVED (riwayat SLA tetap) | Alasan wajib bila tidak otomatis; catatan penyelesaian | FLOW_RESOLVE |
| `flow.updateSla` | — | — | **NEW INTEGRATION REQUIRED** | Owner / Eksekutif, System Administrator, BU Manager | `{ id, hours?, warn?, active?, note }` | SlaPolicy v(n+1) | Versi baru berlaku untuk evaluasi berikutnya; jatuh tempo isu lama tidak ditimpa | Jam 1–720; ambang 0–1; alasan wajib | SLA_POLICY_CHANGE (before/after) |
| `flow.setWeights` | — | — | **UI-ONLY SIMULATION** | Owner / Eksekutif, System Administrator | `{ weights{onTime,activeSla,p90,data}, note }` | FlowConfig v(n+1) | — | Total 100%; alasan wajib | PFHI_WEIGHTS_CHANGE |
| `demo.advanceClock` | — | — (hanya demo) | **UI-ONLY SIMULATION** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `{ hours }` | { now } | Jam demo maju | 1–240 jam | DEMO_CLOCK |

## Modul DX

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `dx.start` | — | — (Demo Experience Center — hanya sandbox demo) | **UI-ONLY SIMULATION** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `{ scenario }` | state.dx | Mulai skenario terpandu pada data demo yang baru di-reset | ID skenario terdaftar | DX_START |
| `dx.step` | — | — (hasil uji demo, bukan transaksi HAWK) | **UI-ONLY SIMULATION** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `{ step, result DONE\|REVIEWED\|BLOCKED, note? }` | state.dx.steps[step] | Catat hasil langkah tutorial | Langkah ada di skenario aktif | DX_STEP |
| `dx.verdict` | — | — (laporan UAT demo) | **UI-ONLY SIMULATION** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `{ verdict PASS\|FAIL\|BLOCKED, note }` | state.dx.verdict | Catat hasil uji skenario | FAIL/BLOCKED wajib catatan | DX_VERDICT |

## Modul A/B

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `audit.list` (baca) | — | Riwayat (ikon jam di toolbar HAWK) | **TO VERIFY** | System Administrator, Owner / Eksekutif, Finance / Accounting | `{ ref?, user?, from?, to? }` | AuditEvent[] | Read-only | — | — |

## Modul A

| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |
|---|---|---|---|---|---|---|---|---|---|
| `search.global` (baca) | — | Purchases › FIND tab | **TO VERIFY** | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `{ q }` | SearchHit[] { type, id, title, status } | Read-only | Hasil difilter hak akses di server | — |

