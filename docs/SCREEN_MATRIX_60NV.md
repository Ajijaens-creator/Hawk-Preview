# SCREEN MATRIX — 60 NV (NB-HAWK-01)

_Dibuat otomatis oleh `node tools/gen-docs.js`. Status uji dihitung dari isi file tes, bukan ditulis tangan._

**Arti status implementasi**

- **E2E** — layar dibuka dan dioperasikan lewat klik UI nyata di `tests/e2e-walkthrough.js` atau `tests/e2e-smart-spend.js`.
- **Engine** — semua operasi tulis layar ini dipanggil di `tests/workflow.test.js` (aturan, transisi, jurnal, rollback); tombol UI-nya diperiksa punya handler, tetapi tidak semuanya diklik.
- **Sebagian** — layar interaktif; sebagian operasi tulis belum punya tes otomatis (dicantumkan).
- **Render** — layar baca/navigasi; diuji render untuk 12 pengguna dan 3 ukuran layar.
- **BELUM** — tidak ada view. Bila muncul di tabel ini, layar itu belum diimplementasikan.

Semua layar yang memiliki view juga lulus `browser-all.js` (12 pengguna × 60 NV, 0 error, 0 tombol tanpa handler) dan `responsive.js` (1440/834/390 px).

**Ringkasan:** 60 layar · E2E 22 · Engine 20 · Sebagian 0 · Render 18 · BELUM 0

## Modul A — Navigation & Role Workspace

| NV | Mod | Nama resmi | Role akses | Operasi tulis | Status integrasi terendah | Status implementasi & uji |
|---|---|---|---|---|---|---|
| NV-01 | A | Role-Based Dashboard / Home | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | — (baca) | UI-ONLY SIMULATION | E2E |
| NV-02 | A | My Tasks & Approval Inbox | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `mrf.decide`, `po.decide`, `budget.approve` | NEW INTEGRATION REQUIRED | E2E |
| NV-03 | A | Notifications & Activity Center | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | — (baca) | TO VERIFY | E2E |
| NV-04 | A | Global Search & Quick Actions | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | — (baca) | TO VERIFY | Render |

## Modul B — Organization, Office & Access

| NV | Mod | Nama resmi | Role akses | Operasi tulis | Status integrasi terendah | Status implementasi & uji |
|---|---|---|---|---|---|---|
| NV-05 | B | Organization & Business Unit Tree | Owner / Eksekutif, BU Manager, System Administrator, Finance / Accounting | `org.upsertUnit` | TO VERIFY | Engine |
| NV-06 | B | Branch, Office & Division Management | System Administrator, Owner / Eksekutif | `org.upsertUnit`, `org.setStatus` | TO VERIFY | Engine |
| NV-07 | B | Cost Center & Shared Office Allocation | System Administrator, Finance / Accounting, Owner / Eksekutif, BU Manager | `cc.updateAllocation` | NEW INTEGRATION REQUIRED | Engine |
| NV-08 | B | User, Role & Access Management | System Administrator | `user.assignRole` | TO VERIFY | Engine |
| NV-09 | B | Approval Matrix & Rules Configuration | System Administrator, Owner / Eksekutif, Finance / Accounting | `approval.updateRule`, `autoOrder.update` | NEW INTEGRATION REQUIRED | E2E |

## Modul C — Strategic Target & Ambidex

| NV | Mod | Nama resmi | Role akses | Operasi tulis | Status integrasi terendah | Status implementasi & uji |
|---|---|---|---|---|---|---|
| NV-10 | C | Annual Target Planning: Spa & Essence | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting | `target.save`, `target.submit`, `target.approve` | NEW INTEGRATION REQUIRED | Engine |
| NV-11 | C | BU Business Driver Tree & KPI Targets | Owner / Eksekutif, BU Manager, Head of Division | — (baca) | — | Render |
| NV-12 | C | Operational vs Innovation Portfolio | Owner / Eksekutif, BU Manager, Head of Division | — (baca) | — | Render |
| NV-13 | C | Strategic Project & Investment Proposal | Owner / Eksekutif, BU Manager, Head of Division | `project.propose` | NEW INTEGRATION REQUIRED | Engine |
| NV-14 | C | Investment Approval, Milestone & Progress | Owner / Eksekutif, BU Manager | `project.decide`, `project.milestone` | NEW INTEGRATION REQUIRED | Engine |

## Modul D — Annual & Monthly 7P Budget

| NV | Mod | Nama resmi | Role akses | Operasi tulis | Status integrasi terendah | Status implementasi & uji |
|---|---|---|---|---|---|---|
| NV-15 | D | Annual Budget Creation | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting | `budget.updateLine`, `budget.submit` | NEW INTEGRATION REQUIRED | Engine |
| NV-16 | D | 7P Budget Allocation Overview | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting | — (baca) | — | Render |
| NV-17 | D | Routine Item / BHP Budget Planning | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting, Supervisor Outlet | — (baca) | NEW INTEGRATION REQUIRED | Render |
| NV-18 | D | Non-Routine & Exceptional Budget | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting | — (baca) | — | Render |
| NV-19 | D | OPEX, CAPEX & Other Spending Classification | Owner / Eksekutif, BU Manager, Finance / Accounting | — (baca) | — | Render |
| NV-20 | D | Quarterly & Monthly Budget Distribution | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting | — (baca) | — | Render |
| NV-21 | D | Budget Submission & Approval | Owner / Eksekutif, BU Manager, Finance / Accounting | `budget.submit`, `budget.approve` | NEW INTEGRATION REQUIRED | Engine |
| NV-22 | D | Budget Revision & Quarterly Reforecast | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting | `budget.requestRevision`, `budget.decideRevision` | NEW INTEGRATION REQUIRED | Engine |
| NV-23 | D | Budget vs Actual vs Commitment vs Forecast | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting, Supervisor Outlet | — (baca) | — | E2E |

## Modul E — MRF & Supervisor Approval

| NV | Mod | Nama resmi | Role akses | Operasi tulis | Status integrasi terendah | Status implementasi & uji |
|---|---|---|---|---|---|---|
| NV-24 | E | Staff Material Request Home | Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, BU Manager, Owner / Eksekutif | `order.quick`, `order.receive` | NEW INTEGRATION REQUIRED | E2E |
| NV-25 | E | Item Catalog / Search / Barcode Scan | Staff / Therapist / Housekeeping, Supervisor Outlet, Purchasing, Gudang / Receiving, Owner / Eksekutif | — (baca) | TO VERIFY | Render |
| NV-26 | E | Create Material Request | Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, BU Manager, Asset / Facility PIC, Owner / Eksekutif | `mrf.create` | NEW INTEGRATION REQUIRED | E2E |
| NV-27 | E | My Requests & Status Tracking | Staff / Therapist / Housekeeping, Supervisor Outlet, Asset / Facility PIC, Head of Division, BU Manager, Owner / Eksekutif | `mrf.cancel`, `mrf.submitDraft` | TO VERIFY | E2E |
| NV-28 | E | MRF Detail & Fulfillment Tracking | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | `mrf.issue`, `transfer.dispatch`, `transfer.receive` | TO VERIFY | E2E |
| NV-29 | E | Supervisor Approval Queue | Supervisor Outlet, Head of Division, BU Manager, Owner / Eksekutif | `mrf.decide` | TO VERIFY | E2E |
| NV-30 | E | MRF Budget Impact & Exception Review | Supervisor Outlet, Head of Division, BU Manager, Owner / Eksekutif, Finance / Accounting | `mrf.decide` | NEW INTEGRATION REQUIRED | E2E |

## Modul F — Purchasing & Supplier

| NV | Mod | Nama resmi | Role akses | Operasi tulis | Status integrasi terendah | Status implementasi & uji |
|---|---|---|---|---|---|---|
| NV-31 | F | Purchasing Dashboard / Workbench | Purchasing, BU Manager, Owner / Eksekutif | — (baca) | — | Render |
| NV-32 | F | Consolidated MRF & Purchasing Planning | Purchasing | `po.createFromMrf` | TO VERIFY | E2E |
| NV-33 | F | Supplier Master & Directory | Purchasing, Finance / Accounting, BU Manager, Owner / Eksekutif | — (baca) | TO VERIFY | Render |
| NV-34 | F | Supplier Quotation & Price Comparison | Purchasing, BU Manager, Owner / Eksekutif, Finance / Accounting | — (baca) | NEW INTEGRATION REQUIRED | Render |
| NV-35 | F | Purchase Order Creation & Editing | Purchasing | `po.update`, `po.submit` | TO VERIFY | E2E |
| NV-36 | F | PO Register, Detail & Approval | Purchasing, BU Manager, Owner / Eksekutif, Gudang / Receiving, Finance / Accounting, Head of Division | `po.decide`, `po.send` | TO VERIFY | E2E |
| NV-37 | F | Emergency Purchase Workflow | Purchasing, Supervisor Outlet, BU Manager, Owner / Eksekutif | `po.emergency`, `po.postApprove` | NEW INTEGRATION REQUIRED | Engine |

## Modul G — Warehouse & Inventory

| NV | Mod | Nama resmi | Role akses | Operasi tulis | Status integrasi terendah | Status implementasi & uji |
|---|---|---|---|---|---|---|
| NV-38 | G | Inventory Control Dashboard | Gudang / Receiving, Purchasing, Finance / Accounting, BU Manager, Owner / Eksekutif, Supervisor Outlet, Head of Division | — (baca) | TO VERIFY | Render |
| NV-39 | G | Warehouse, Storage, Rack & Bin Management | Gudang / Receiving, System Administrator, Owner / Eksekutif | `bin.add` | NEW INTEGRATION REQUIRED | Engine |
| NV-40 | G | Stock Balance, Item Details & Ledger | Owner / Eksekutif, BU Manager, Head of Division, Supervisor Outlet, Staff / Therapist / Housekeeping, Purchasing, Gudang / Receiving, Finance / Accounting, Asset / Facility PIC, System Administrator | — (baca) | TO VERIFY | Render |
| NV-41 | G | Incoming Deliveries / Receiving Queue | Gudang / Receiving, Purchasing, Supervisor Outlet, Owner / Eksekutif | `transfer.receive` | TO VERIFY | Engine |
| NV-42 | G | PO Receiving, Item Checklist & Document Scan | Gudang / Receiving, Owner / Eksekutif | `grn.receive`, `grn.post` | TO VERIFY | E2E |
| NV-43 | G | Put-Away / QR Storage Confirmation | Gudang / Receiving | `grn.putaway` | NEW INTEGRATION REQUIRED | E2E |
| NV-44 | G | Inter-Branch Stock Transfer | Gudang / Receiving, Supervisor Outlet, Owner / Eksekutif | `transfer.create`, `transfer.dispatch`, `transfer.receive` | TO VERIFY | Engine |
| NV-45 | G | Stock Issue, Usage & Return | Gudang / Receiving, Supervisor Outlet, Owner / Eksekutif | `mrf.issue`, `stock.issueDirect`, `stock.return` | TO VERIFY | E2E |
| NV-46 | G | Stock Opname, Adjustment & Discrepancy | Gudang / Receiving, Finance / Accounting, BU Manager, Owner / Eksekutif | `opname.start`, `opname.submit`, `opname.approve` | TO VERIFY | Engine |

## Modul H — Finance & Accounting

| NV | Mod | Nama resmi | Role akses | Operasi tulis | Status integrasi terendah | Status implementasi & uji |
|---|---|---|---|---|---|---|
| NV-47 | H | Finance Control Dashboard | Finance / Accounting, Owner / Eksekutif, BU Manager | — (baca) | — | Render |
| NV-48 | H | AI Invoice & Receipt Capture | Staff / Therapist / Housekeeping, Supervisor Outlet, Head of Division, Purchasing, Gudang / Receiving, BU Manager, Finance / Accounting, Asset / Facility PIC, Owner / Eksekutif | `spend.capture`, `spend.update`, `spend.submit`, `spend.approve`, `spend.receive`, `spend.verify`, `spend.settle`, `spend.cancel`, `doc.capture`, `doc.match` | UI-ONLY SIMULATION | E2E |
| NV-49 | H | PO–Receipt–Invoice Three-Way Matching | Finance / Accounting, Purchasing | `doc.match`, `doc.verify` | NEW INTEGRATION REQUIRED | E2E |
| NV-50 | H | Accounts Payable & Payment Control | Finance / Accounting, Owner / Eksekutif, BU Manager | `order.pay`, `autoOrder.update`, `bill.approve`, `bill.pay` | NEW INTEGRATION REQUIRED | E2E |
| NV-51 | H | GL Posting, Accounting & Exception Review | Finance / Accounting, Owner / Eksekutif | `gl.post` | TO VERIFY | E2E |
| NV-52 | H | Cost Allocation & Inter-BU Reconciliation | Finance / Accounting, Owner / Eksekutif, BU Manager | `cc.updateAllocation` | NEW INTEGRATION REQUIRED | Engine |

## Modul I — Asset & Facility Management

| NV | Mod | Nama resmi | Role akses | Operasi tulis | Status integrasi terendah | Status implementasi & uji |
|---|---|---|---|---|---|---|
| NV-53 | I | Asset Register & Asset Inventory | Asset / Facility PIC, Finance / Accounting, Owner / Eksekutif, BU Manager | — (baca) | — | Render |
| NV-54 | I | Asset Detail, Location & Lifecycle | Asset / Facility PIC, Finance / Accounting, Owner / Eksekutif, BU Manager | `mt.create` | TO VERIFY | Engine |
| NV-55 | I | Maintenance Request & Work Order | Asset / Facility PIC, Supervisor Outlet, Staff / Therapist / Housekeeping, BU Manager, Owner / Eksekutif | `mt.create`, `mt.review`, `wo.create`, `wo.requestPart`, `wo.complete` | TO VERIFY | Engine |
| NV-56 | I | Asset Capitalization, Depreciation & Disposal | Finance / Accounting, Asset / Facility PIC, Owner / Eksekutif | `asset.capitalize`, `asset.dispose` | TO VERIFY | Engine |

## Modul J — AI Intelligence & Reporting

| NV | Mod | Nama resmi | Role akses | Operasi tulis | Status integrasi terendah | Status implementasi & uji |
|---|---|---|---|---|---|---|
| NV-57 | J | Executive & BU AI Intelligence Dashboard | Owner / Eksekutif, BU Manager, Finance / Accounting, Head of Division | `insight.act` | UI-ONLY SIMULATION | E2E |
| NV-58 | J | Division / Supervisor AI Insights | Supervisor Outlet, Head of Division, BU Manager, Purchasing, Gudang / Receiving, Asset / Facility PIC, Owner / Eksekutif | `insight.act` | UI-ONLY SIMULATION | Engine |
| NV-59 | J | 7P Productivity, Efficiency & Effectiveness Analytics | Owner / Eksekutif, BU Manager, Head of Division, Finance / Accounting | — (baca) | UI-ONLY SIMULATION | Render |
| NV-60 | J | AI Scenario Forecast & Evidence Drill-Down | Owner / Eksekutif, BU Manager, Finance / Accounting | — (baca) | UI-ONLY SIMULATION | Render |

