# ROLE & PERMISSION MATRIX

_Dibuat otomatis dari `registry.js` (akses layar) dan `contracts.js` (izin operasi)._

> Permission di prototipe hanya **simulasi tampilan**. Backend HAWK wajib menegakkan aturan yang sama di server.

Role: `OWNER` = Owner / Eksekutif · `BU_MANAGER` = BU Manager · `HEAD_DIV` = Head of Division · `SUPERVISOR` = Supervisor Outlet · `STAFF` = Staff / Therapist / Housekeeping · `PURCHASING` = Purchasing · `WAREHOUSE` = Gudang / Receiving · `FINANCE` = Finance / Accounting · `ASSET` = Asset / Facility PIC · `ADMIN` = System Administrator

## Akses layar (✓ = boleh membuka)

| Kode | Nama | OWNER | BU_MANAGER | HEAD_DIV | SUPERVISOR | STAFF | PURCHASING | WAREHOUSE | FINANCE | ASSET | ADMIN |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| NV-01 | Role-Based Dashboard / Home | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| NV-02 | My Tasks & Approval Inbox | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| NV-03 | Notifications & Activity Center | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| NV-04 | Global Search & Quick Actions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| NV-05 | Organization & Business Unit Tree | ✓ | ✓ |  |  |  |  |  | ✓ |  | ✓ |
| NV-06 | Branch, Office & Division Management | ✓ |  |  |  |  |  |  |  |  | ✓ |
| NV-07 | Cost Center & Shared Office Allocation | ✓ | ✓ |  |  |  |  |  | ✓ |  | ✓ |
| NV-08 | User, Role & Access Management | ✓ |  |  |  |  |  |  |  |  | ✓ |
| NV-09 | Approval Matrix & Rules Configuration | ✓ |  |  |  |  |  |  |  |  | ✓ |
| NV-10 | Annual Target Planning: Spa & Essence | ✓ | ✓ | ✓ |  |  |  |  | ✓ |  |  |
| NV-11 | BU Business Driver Tree & KPI Targets | ✓ | ✓ | ✓ |  |  |  |  |  |  |  |
| NV-12 | Operational vs Innovation Portfolio | ✓ | ✓ | ✓ |  |  |  |  |  |  |  |
| NV-13 | Strategic Project & Investment Proposal | ✓ | ✓ | ✓ |  |  |  |  |  |  |  |
| NV-14 | Investment Approval, Milestone & Progress | ✓ | ✓ |  |  |  |  |  |  |  |  |
| NV-15 | Annual Budget Creation | ✓ | ✓ | ✓ |  |  |  |  | ✓ |  |  |
| NV-16 | 7P Budget Allocation Overview | ✓ | ✓ | ✓ |  |  |  |  | ✓ |  |  |
| NV-17 | Routine Item / BHP Budget Planning | ✓ | ✓ | ✓ | ✓ |  |  |  | ✓ |  |  |
| NV-18 | Non-Routine & Exceptional Budget | ✓ | ✓ | ✓ |  |  |  |  | ✓ |  |  |
| NV-19 | OPEX, CAPEX & Other Spending Classification | ✓ | ✓ |  |  |  |  |  | ✓ |  |  |
| NV-20 | Quarterly & Monthly Budget Distribution | ✓ | ✓ | ✓ |  |  |  |  | ✓ |  |  |
| NV-21 | Budget Submission & Approval | ✓ | ✓ |  |  |  |  |  | ✓ |  |  |
| NV-22 | Budget Revision & Quarterly Reforecast | ✓ | ✓ | ✓ |  |  |  |  | ✓ |  |  |
| NV-23 | Budget vs Actual vs Commitment vs Forecast | ✓ | ✓ | ✓ | ✓ |  |  |  | ✓ |  |  |
| NV-24 | Staff Material Request Home | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |  |  |  |
| NV-25 | Item Catalog / Search / Barcode Scan | ✓ |  |  | ✓ | ✓ | ✓ | ✓ |  |  |  |
| NV-26 | Create Material Request | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |  | ✓ |  |
| NV-27 | My Requests & Status Tracking | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |  | ✓ |  |
| NV-28 | MRF Detail & Fulfillment Tracking | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| NV-29 | Supervisor Approval Queue | ✓ | ✓ | ✓ | ✓ |  |  |  |  |  |  |
| NV-30 | MRF Budget Impact & Exception Review | ✓ | ✓ | ✓ | ✓ |  |  |  | ✓ |  |  |
| NV-31 | Purchasing Dashboard / Workbench | ✓ | ✓ |  |  |  | ✓ |  |  |  |  |
| NV-32 | Consolidated MRF & Purchasing Planning | ✓ |  |  |  |  | ✓ |  |  |  |  |
| NV-33 | Supplier Master & Directory | ✓ | ✓ |  |  |  | ✓ |  | ✓ |  |  |
| NV-34 | Supplier Quotation & Price Comparison | ✓ | ✓ |  |  |  | ✓ |  | ✓ |  |  |
| NV-35 | Purchase Order Creation & Editing | ✓ |  |  |  |  | ✓ |  |  |  |  |
| NV-36 | PO Register, Detail & Approval | ✓ | ✓ | ✓ |  |  | ✓ | ✓ | ✓ |  |  |
| NV-37 | Emergency Purchase Workflow | ✓ | ✓ |  | ✓ |  | ✓ |  |  |  |  |
| NV-38 | Inventory Control Dashboard | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ | ✓ |  |  |
| NV-39 | Warehouse, Storage, Rack & Bin Management | ✓ |  |  |  |  |  | ✓ |  |  | ✓ |
| NV-40 | Stock Balance, Item Details & Ledger | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| NV-41 | Incoming Deliveries / Receiving Queue | ✓ |  |  | ✓ |  | ✓ | ✓ |  |  |  |
| NV-42 | PO Receiving, Item Checklist & Document Scan | ✓ |  |  |  |  |  | ✓ |  |  |  |
| NV-43 | Put-Away / QR Storage Confirmation | ✓ |  |  |  |  |  | ✓ |  |  |  |
| NV-44 | Inter-Branch Stock Transfer | ✓ |  |  | ✓ |  |  | ✓ |  |  |  |
| NV-45 | Stock Issue, Usage & Return | ✓ |  |  | ✓ |  |  | ✓ |  |  |  |
| NV-46 | Stock Opname, Adjustment & Discrepancy | ✓ | ✓ |  |  |  |  | ✓ | ✓ |  |  |
| NV-47 | Finance Control Dashboard | ✓ | ✓ |  |  |  |  |  | ✓ |  |  |
| NV-48 | AI Invoice & Receipt Capture | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |
| NV-49 | PO–Receipt–Invoice Three-Way Matching | ✓ |  |  |  |  | ✓ |  | ✓ |  |  |
| NV-50 | Accounts Payable & Payment Control | ✓ | ✓ |  |  |  |  |  | ✓ |  |  |
| NV-51 | GL Posting, Accounting & Exception Review | ✓ |  |  |  |  |  |  | ✓ |  |  |
| NV-52 | Cost Allocation & Inter-BU Reconciliation | ✓ | ✓ |  |  |  |  |  | ✓ |  |  |
| NV-53 | Asset Register & Asset Inventory | ✓ | ✓ |  |  |  |  |  | ✓ | ✓ |  |
| NV-54 | Asset Detail, Location & Lifecycle | ✓ | ✓ |  |  |  |  |  | ✓ | ✓ |  |
| NV-55 | Maintenance Request & Work Order | ✓ | ✓ |  | ✓ | ✓ |  |  |  | ✓ |  |
| NV-56 | Asset Capitalization, Depreciation & Disposal | ✓ |  |  |  |  |  |  | ✓ | ✓ |  |
| NV-57 | Executive & BU AI Intelligence Dashboard | ✓ | ✓ | ✓ |  |  |  |  | ✓ |  |  |
| NV-58 | Division / Supervisor AI Insights | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ |  | ✓ |  |
| NV-59 | 7P Productivity, Efficiency & Effectiveness Analytics | ✓ | ✓ | ✓ |  |  |  |  | ✓ |  |  |
| NV-60 | AI Scenario Forecast & Evidence Drill-Down | ✓ | ✓ |  |  |  |  |  | ✓ |  |  |

## Izin operasi (E = eksekusi tulis, B = baca)

| Kode | Nama | OWNER | BU_MANAGER | HEAD_DIV | SUPERVISOR | STAFF | PURCHASING | WAREHOUSE | FINANCE | ASSET | ADMIN |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `org.upsertUnit` | tulis |  |  |  |  |  |  |  |  |  | E |
| `org.setStatus` | tulis |  |  |  |  |  |  |  |  |  | E |
| `cc.updateAllocation` | tulis |  |  |  |  |  |  |  | E |  | E |
| `user.assignRole` | tulis |  |  |  |  |  |  |  |  |  | E |
| `approval.updateRule` | tulis |  |  |  |  |  |  |  |  |  | E |
| `approval.publishRule` | tulis | E |  |  |  |  |  |  |  |  |  |
| `target.save` | tulis | E | E |  |  |  |  |  |  |  |  |
| `target.submit` | tulis | E | E |  |  |  |  |  |  |  |  |
| `target.approve` | tulis | E |  |  |  |  |  |  |  |  |  |
| `project.propose` | tulis | E | E | E |  |  |  |  |  |  |  |
| `project.decide` | tulis | E |  |  |  |  |  |  |  |  |  |
| `project.milestone` | tulis | E | E |  |  |  |  |  |  |  |  |
| `budget.updateLine` | tulis | E | E | E |  |  |  |  | E |  |  |
| `budget.submit` | tulis | E | E |  |  |  |  |  | E |  |  |
| `budget.approve` | tulis | E | E | E |  |  |  |  | E |  |  |
| `budget.upsertPlanLine` | tulis | E | E | E |  |  |  |  | E |  |  |
| `budget.setWeights` | tulis | E | E | E |  |  |  |  | E |  |  |
| `nonroutine.create` | tulis | E | E | E | E |  |  |  | E |  |  |
| `nonroutine.decide` | tulis | E | E | E |  |  |  |  | E |  |  |
| `budget.requestRevision` | tulis |  | E | E |  |  |  |  | E |  |  |
| `budget.decideRevision` | tulis | E |  |  |  |  |  |  |  |  |  |
| `budget.checkItem` | baca | B | B | B | B | B | B | B | B | B | B |
| `item.search` | baca | B | B | B | B | B | B | B | B | B | B |
| `mrf.create` | tulis |  | E | E | E | E |  |  |  | E | E |
| `mrf.submitDraft` | tulis |  | E | E | E | E |  |  |  | E |  |
| `mrf.decide` | tulis | E | E | E | E |  |  |  |  |  |  |
| `mrf.planFulfillment` | tulis | E | E | E | E |  |  | E |  |  |  |
| `mrf.issue` | tulis |  |  |  | E |  |  | E |  |  |  |
| `mrf.cancel` | tulis |  |  |  | E | E |  |  |  |  | E |
| `supplier.list` | baca | B | B | B | B | B | B | B | B | B | B |
| `quotation.compare` | baca | B | B |  |  |  | B |  | B |  |  |
| `po.createFromMrf` | tulis |  |  |  |  |  | E |  |  |  |  |
| `po.update` | tulis |  |  |  |  |  | E |  |  |  |  |
| `po.submit` | tulis |  |  |  |  |  | E |  |  |  |  |
| `po.decide` | tulis | E | E |  |  |  | E |  |  |  |  |
| `po.send` | tulis |  |  |  |  |  | E |  |  |  |  |
| `po.emergency` | tulis |  |  |  | E |  | E |  |  |  |  |
| `po.postApprove` | tulis |  | E |  |  |  |  |  |  |  |  |
| `stock.query` | baca | B | B | B | B | B | B | B | B | B | B |
| `transfer.create` | tulis |  |  |  | E |  |  | E |  |  |  |
| `transfer.dispatch` | tulis |  |  |  |  |  |  | E |  |  |  |
| `transfer.receive` | tulis |  |  |  | E |  |  | E |  |  |  |
| `grn.receive` | tulis |  |  |  |  |  |  | E |  |  |  |
| `grn.post` | tulis |  |  |  |  |  |  | E | E |  |  |
| `grn.putaway` | tulis |  |  |  |  |  |  | E |  |  |  |
| `bin.add` | tulis |  |  |  |  |  |  | E |  |  | E |
| `stock.issueDirect` | tulis |  |  |  | E |  |  | E |  |  |  |
| `stock.return` | tulis |  |  |  | E |  |  | E |  |  |  |
| `opname.start` | tulis |  |  |  |  |  |  | E |  |  |  |
| `opname.submit` | tulis |  |  |  |  |  |  | E |  |  |  |
| `opname.approve` | tulis |  | E |  |  |  |  |  | E |  |  |
| `doc.capture` | tulis |  |  |  |  |  |  |  | E |  |  |
| `doc.match` | tulis |  |  |  |  |  |  |  | E |  |  |
| `doc.verify` | tulis |  |  |  |  |  |  |  | E |  |  |
| `bill.approve` | tulis |  | E |  |  |  |  |  | E |  |  |
| `bill.pay` | tulis |  |  |  |  |  |  |  | E |  |  |
| `gl.post` | tulis |  |  |  |  |  |  |  | E |  |  |
| `spend.capture` | tulis | E | E | E | E | E | E | E | E | E |  |
| `spend.update` | tulis | E | E | E | E | E | E | E | E | E |  |
| `spend.submit` | tulis | E | E | E | E | E | E | E | E | E |  |
| `spend.approve` | tulis | E | E | E | E |  |  |  |  |  |  |
| `spend.receive` | tulis |  |  |  |  |  |  | E |  |  |  |
| `spend.verify` | tulis |  |  |  |  |  |  |  | E |  |  |
| `spend.settle` | tulis |  |  |  |  |  |  |  | E |  |  |
| `spend.cancel` | tulis | E | E | E | E | E | E | E | E | E |  |
| `mt.create` | tulis |  |  |  | E | E |  |  |  | E |  |
| `mt.review` | tulis |  |  |  | E |  |  |  |  | E |  |
| `wo.create` | tulis |  |  |  |  |  |  |  |  | E |  |
| `wo.requestPart` | tulis |  |  |  |  |  |  |  |  | E |  |
| `wo.complete` | tulis |  |  |  |  |  |  |  |  | E |  |
| `asset.capitalize` | tulis |  |  |  |  |  |  |  | E | E |  |
| `asset.dispose` | tulis | E |  |  |  |  |  |  | E | E |  |
| `ai.insights` | baca | B | B | B | B | B | B | B | B | B | B |
| `ai.scenario` | baca | B | B |  |  |  |  |  | B |  |  |
| `insight.act` | tulis | E | E | E | E |  | E | E | E | E |  |
| `audit.list` | baca | B |  |  |  |  |  |  | B |  | B |
| `search.global` | baca | B | B | B | B | B | B | B | B | B | B |

## Segregation of duties yang diuji (tests/workflow.test.js)

- Staff tidak dapat menyetujui MRF; Supervisor hanya cabangnya sendiri.
- Purchasing tidak dapat capture faktur; Owner tidak dapat membayar.
- Verifikator tagihan ≠ penyetuju; pengaju non-rutin ≠ pemutus; pembuat draft aturan approval ≠ penerbit.
