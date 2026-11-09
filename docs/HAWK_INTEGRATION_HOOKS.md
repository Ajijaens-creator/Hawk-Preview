# HAWK INTEGRATION HOOKS

_Dibuat otomatis dari `contracts.js`. Ringkasan untuk developer; detail lengkap per operasi ada di INTEGRATION_CONTRACTS.md._

> **Belum ada API HAWK yang terhubung atau terverifikasi.** Adapter "HAWK API" di prototipe sengaja mengembalikan `NOT_CONNECTED`. Tidak ada endpoint/URL produksi di source code. Status **CONFIRMED EXISTING** = 0.

## Titik sambung

Semua aksi tulis melewati satu fungsi: `HAWK.api.call(op, payload, user)` di `assets/js/core/adapter.js`. Untuk integrasi, buat adapter baru yang memetakan setiap `op` di bawah ke endpoint HAWK yang sudah diverifikasi, lalu pilih adapter itu di selector Adapter. Layar tidak perlu diubah.

| Status | Jumlah |
|---|---|
| TO VERIFY | 52 |
| NEW INTEGRATION REQUIRED | 41 |
| UI-ONLY SIMULATION | 9 |

| Operasi | Jenis | Modul HAWK existing (perkiraan) | Hook paket Owner (placeholder) | Status | Diuji di engine |
|---|---|---|---|---|---|
| `org.upsertUnit` | tulis | Settings / Locations (ikon ⚙) — lokasi muncul di dropdown Source/Request Location PR | `organization.manageUnit` | TO VERIFY | ya |
| `org.setStatus` | tulis | Settings / Locations | `organization.manageUnit` | TO VERIFY | ya |
| `cc.updateAllocation` | tulis | Accounts (job/cost center — kolom JOB[+] di PR/PO) | — | NEW INTEGRATION REQUIRED | ya |
| `cc.reviewAllocation` | tulis | — (alur review alokasi bersama belum terlihat di HAWK v2.11.6) | — | NEW INTEGRATION REQUIRED | ya |
| `cc.lockAllocation` | tulis | — (tutup periode alokasi — TO VERIFY dengan HAWK Finance) | — | NEW INTEGRATION REQUIRED | ya |
| `user.assignRole` | tulis | User/Privilege (header menampilkan PRIVILEGE: Super Admin) | `permissions.canAccess` | TO VERIFY | ya |
| `approval.updateRule` | tulis | Approval di PR/PO (field APPROVE STATUS / APPROVED BY) | — | TO VERIFY | ya |
| `approval.publishRule` | tulis | Approval di PR/PO | — | NEW INTEGRATION REQUIRED | ya |
| `target.save` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `target.submit` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `target.approve` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `project.propose` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `project.decide` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `project.milestone` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `budget.updateLine` | tulis | Finance (budget?) — tidak terlihat di screenshot | — | NEW INTEGRATION REQUIRED | ya |
| `budget.submit` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `budget.approve` | tulis | — (ref. Modul D handoff: approval.review; budget.lock — TO VERIFY) | — | NEW INTEGRATION REQUIRED | ya |
| `budget.upsertPlanLine` | tulis | — (ref. Modul D handoff: budgetLine.upsert — TO VERIFY) | `budget.getLines` | NEW INTEGRATION REQUIRED | ya |
| `budget.setWeights` | tulis | — (ref. Modul D handoff: budget.periodAllocation.update — TO VERIFY) | — | NEW INTEGRATION REQUIRED | ya |
| `nonroutine.create` | tulis | — (ref. Modul D handoff: budget.exception.create — TO VERIFY) | — | NEW INTEGRATION REQUIRED | ya |
| `nonroutine.decide` | tulis | — (ref. Modul D handoff: approval.request — TO VERIFY) | — | NEW INTEGRATION REQUIRED | ya |
| `budget.requestRevision` | tulis | — | `budget.submitRevision` | NEW INTEGRATION REQUIRED | ya |
| `budget.decideRevision` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `budget.checkItem` | baca | — | `budget.validateRequest` | NEW INTEGRATION REQUIRED | — (baca) |
| `item.search` | baca | Inventory / Cards — kolom BARCODE & ITEM di PR entry | — | TO VERIFY | — (baca) |
| `mrf.create` | tulis | Purchases › Transaction › DATA ENTRY \| PURCHASE REQUEST (ID PR20261100001) | `mrf.create` | TO VERIFY | ya |
| `mrf.submitDraft` | tulis | Purchase Request (STATUS OPEN) | — | TO VERIFY | ya |
| `mrf.decide` | tulis | Purchase Request — APPROVE STATUS / APPROVE BY | `mrf.approve` | TO VERIFY | ya |
| `mrf.planFulfillment` | tulis | PO Request register — tombol TRANSFER dan PO, kolom TRANSFER ID / PO ID | — | TO VERIFY | ya |
| `mrf.issue` | tulis | Inventory — pengeluaran stok (belum terlihat di screenshot) | `mrf.getFulfillment / inventory.issue` | TO VERIFY | ya |
| `mrf.confirmHandover` | tulis | — (serah terima barang gudang → pemohon belum terlihat di HAWK v2.11.6) | — | NEW INTEGRATION REQUIRED | ya |
| `mrf.cancel` | tulis | Purchase Request — CANCEL | — | TO VERIFY | ya |
| `autoOrder.update` | tulis | — (pengaturan aturan baru) | — | NEW INTEGRATION REQUIRED | ya |
| `order.quick` | tulis | Purchase Request → Purchase Order (engine yang sama, dipicu aturan) | — | NEW INTEGRATION REQUIRED | ya |
| `order.receive` | tulis | Receiving + Inventory issue (engine yang sama) | — | NEW INTEGRATION REQUIRED | ya |
| `order.pay` | tulis | Finance (pembayaran) — belum terverifikasi | — | TO VERIFY | ya |
| `supplier.list` | baca | Cards (master supplier/card — kolom CARD di PR) | — | TO VERIFY | — (baca) |
| `quotation.compare` | baca | PRICE LEVEL di PO entry | — | NEW INTEGRATION REQUIRED | — (baca) |
| `po.createFromMrf` | tulis | Purchases › DATA ENTRY \| PURCHASE ORDER (ID PO20261100001) + tombol PO di PO Request register | `purchasing.createPO` | TO VERIFY | ya |
| `po.update` | tulis | PO entry (PRICE, DISC, FREIGHT, PROMISED DATE, MEMO) | — | TO VERIFY | ya |
| `po.submit` | tulis | PO STATUS / APPROVED BY | — | TO VERIFY | ya |
| `po.decide` | tulis | PO APPROVED BY | `purchasing.approvePO` | TO VERIFY | ya |
| `po.send` | tulis | PO — kirim ke vendor (mekanisme belum diketahui) | `purchasing.getPO` | TO VERIFY | ya |
| `po.emergency` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `po.postApprove` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `stock.query` | baca | Inventory + kolom SOURCE SOH / REQUEST SOH di PR entry | `inventory.getStock` | TO VERIFY | — (baca) |
| `transfer.create` | tulis | PO Request register — tombol TRANSFER & kolom TRANSFER ID | `inventory.transfer` | TO VERIFY | ya |
| `transfer.dispatch` | tulis | Inventory transfer | `inventory.transfer` | TO VERIFY | ya |
| `transfer.receive` | tulis | Inventory transfer | `inventory.transfer` | TO VERIFY | ya |
| `grn.receive` | tulis | PO entry kolom RECEIVED / BACKORDER, DELIVERY STATUS | `inventory.receive` | TO VERIFY | ya |
| `grn.post` | tulis | Purchases › RECEIVED REJECTED tab; Inventory posting | `inventory.receive` | TO VERIFY | ya |
| `grn.putaway` | tulis | — (bin/rak tidak terlihat di HAWK v2.11.6) | — | NEW INTEGRATION REQUIRED | ya |
| `bin.add` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `stock.issueDirect` | tulis | Inventory issue | — | TO VERIFY | ya |
| `stock.return` | tulis | Inventory return | — | TO VERIFY | ya |
| `opname.start` | tulis | Inventory (stock take — belum terverifikasi) | — | TO VERIFY | ya |
| `opname.submit` | tulis | Inventory stock take | `inventory.count` | TO VERIFY | ya |
| `opname.approve` | tulis | Inventory adjustment | `inventory.count` | TO VERIFY | ya |
| `doc.capture` | tulis | — | `invoice.extractDraft` | UI-ONLY SIMULATION | ya |
| `doc.match` | tulis | Purchases › BILLS ITEM (tagihan) — logika matching belum terlihat | `finance.matchThreeWay` | NEW INTEGRATION REQUIRED | ya |
| `doc.verify` | tulis | Purchases › BILLS ITEM / BILLS SERVICE | `finance.verifyPayable` | TO VERIFY | ya |
| `bill.approve` | tulis | Purchases › BILLS / AGED PAYABLE; Journal | — | TO VERIFY | ya |
| `bill.pay` | tulis | Finance (pembayaran) — belum terverifikasi | — | TO VERIFY | ya |
| `gl.post` | tulis | Purchases › JOURNAL tab / Accounts | `finance.postApprovedJournal` | TO VERIFY | ya |
| `spend.capture` | tulis | Penyimpanan dokumen + OCR/AI — tidak ada di HAWK v2.11.6 yang terlihat | — | UI-ONLY SIMULATION | ya |
| `spend.update` | tulis | Spend Money draft (TO VERIFY) | — | TO VERIFY | ya |
| `spend.submit` | tulis | Spend Money / Bills / Purchases › Bills (TO VERIFY) | — | TO VERIFY | ya |
| `spend.approve` | tulis | Approval engine HAWK (TO VERIFY) | — | TO VERIFY | ya |
| `spend.receive` | tulis | Inventory receiving (TO VERIFY) | — | TO VERIFY | ya |
| `spend.verify` | tulis | Purchases › Bills / tab JOURNAL (TO VERIFY) | — | TO VERIFY | ya |
| `spend.settle` | tulis | Payment / rekonsiliasi kas (TO VERIFY) | — | TO VERIFY | ya |
| `spend.cancel` | tulis | — | — | TO VERIFY | ya |
| `mt.create` | tulis | Asset Management (menu utama HAWK) | — | TO VERIFY | ya |
| `mt.review` | tulis | Asset Management | — | TO VERIFY | ya |
| `wo.create` | tulis | Purchases register tab WORK ORDER | `asset.createWorkOrder` | TO VERIFY | ya |
| `wo.requestPart` | tulis | Work Order → Purchase Request | — | TO VERIFY | ya |
| `wo.complete` | tulis | Work Order | — | TO VERIFY | ya |
| `asset.capitalize` | tulis | Asset Management | `asset.register` | TO VERIFY | ya |
| `asset.dispose` | tulis | Asset Management | — | TO VERIFY | ya |
| `ai.insights` | baca | Analytics (menu utama HAWK) — sumber data saja | `intelligence.getSourceLinkedInsights` | UI-ONLY SIMULATION | — (baca) |
| `ai.scenario` | baca | — | — | UI-ONLY SIMULATION | — (baca) |
| `insight.act` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `flow.sync` | tulis | Riwayat status dokumen PR/PO/Transfer/Receiving (TO VERIFY — perlu event/timestamp per tahap) | — | TO VERIFY | ya |
| `flow.review` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `flow.assign` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `flow.requestUpdate` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `flow.escalate` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `flow.recordReason` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `flow.changeEta` | tulis | Purchase Order — field tanggal kirim (TO VERIFY apakah HAWK menyimpan riwayat revisi) | — | TO VERIFY | ya |
| `flow.resolve` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `flow.updateSla` | tulis | — | — | NEW INTEGRATION REQUIRED | ya |
| `flow.setWeights` | tulis | — | — | UI-ONLY SIMULATION | ya |
| `dx.start` | tulis | — (Demo Experience Center — hanya sandbox demo) | — | UI-ONLY SIMULATION | ya |
| `dx.step` | tulis | — (hasil uji demo, bukan transaksi HAWK) | — | UI-ONLY SIMULATION | ya |
| `dx.verdict` | tulis | — (laporan UAT demo) | — | UI-ONLY SIMULATION | ya |
| `demo.advanceClock` | tulis | — (hanya demo) | — | UI-ONLY SIMULATION | ya |
| `budget.getPerformanceCube` | baca | Budget 7P + GL/AP + MRF/PO + Inventory (agregasi baca) — belum ada di HAWK v2.11.6 | — | NEW INTEGRATION REQUIRED | — (baca) |
| `budget.getBudgetLineLineage` | baca | PR/PO/GRN/AP/GL/Payroll/Asset — TO VERIFY per dokumen | — | NEW INTEGRATION REQUIRED | — (baca) |
| `finance.getAuthorizedRevenueProfit` | baca | GL pendapatan & laba — TO VERIFY | — | TO VERIFY | — (baca) |
| `report.export7P` | tulis | — (export server dengan logging) | — | NEW INTEGRATION REQUIRED | belum |
| `audit.list` | baca | Riwayat (ikon jam di toolbar HAWK) | — | TO VERIFY | — (baca) |
| `search.global` | baca | Purchases › FIND tab | — | TO VERIFY | — (baca) |

## Syarat sebelum status boleh naik ke CONFIRMED EXISTING

Endpoint & method terdokumentasi oleh tim HAWK, skema request/response, permission di server, idempotency key untuk operasi tulis, error terstruktur (`code`, `message`, `retryable`), audit event, dan bukti tes terhadap lingkungan HAWK non-produksi.
