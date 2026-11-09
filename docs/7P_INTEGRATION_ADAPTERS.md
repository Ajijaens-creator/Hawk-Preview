# 7P Integration Adapters — MP-HAWK-11/12

The prototype runs the adapter `HAWK.P7.adapter` in **DEMO** mode. When the mode is not DEMO, every operation returns `NOT_CONNECTED`. **No HAWK API is claimed to be connected.** Endpoint names below are *logical*, not URLs; the HAWK team decides the real endpoints.

| Logical operation | HAWK source | Status | Input | Output |
|---|---|---|---|---|
| `org.getAuthorizedTree` | Organization | TO VERIFY | `{ asOf? }` | OrgUnit[] + Department[] within access scope |
| `budget.get7PTaxonomy` | Budget / 7P registry | NEW INTEGRATION REQUIRED | `{ asOf? }` | Category `{ p, code, subs[], steward, effectiveFrom }` |
| `budget.getPerformanceCube` | Budget + Finance + Procurement | NEW INTEGRATION REQUIRED | `{ fy, per, bu?, loc?, div?, dept?, p?, sub?, cls?, stream?, page? }` | `{ asOf, totals, rows[] }` |
| `budget.getBudgetLineLineage` | Budget + MRF/PO/GRN/AP/GL/Payroll/Asset | NEW INTEGRATION REQUIRED | `{ id }` | `{ line, txns[] }` (stage ACTUAL / COMMIT / LINEAGE) |
| `finance.getAuthorizedRevenueProfit` | Finance / GL | TO VERIFY | `{ fy, per, bu?, loc? }` | revenue/profit, or N/A + reason |
| `finance.resolveExistingCOAMapping` | Finance / GL (existing COA) | TO VERIFY | `{ transactionLineId }` | `{ coaAccountId, treatment }`. **Does not create a new COA** |
| `tax.getReviewStatus` | Tax Administration | NEW INTEGRATION REQUIRED | `{ transactionLineId }` | VAT, PPh, PBJT, invoice, credit, deductibility, review |
| `documents.openAuthorizedEvidence` | Document service | NEW INTEGRATION REQUIRED | `{ documentId }` | short-lived signed URL from the server; no public URL |
| `report.export7P` | Reporting (server) | NEW INTEGRATION REQUIRED | `{ filters, format: xlsx \| pdf }` | file + audit `EXPORT_7P` |

Contracts registered in `assets/js/core/contracts.js`: `budget.getPerformanceCube`, `budget.getBudgetLineLineage`, `finance.getAuthorizedRevenueProfit` (read) and `report.export7P` (write/audit, roles OWNER, BU_MANAGER, HEAD_DIV, FINANCE).

## Production rules
1. The cube is computed **on the server** from the existing HAWK GL/budget. No second ledger, no duplicate GL.
2. RBAC is enforced on the server. The JavaScript filter in the prototype is a demo only.
3. Export is generated on the server, logged in the audit trail, and respects permissions (row-level + column-level for payroll).
4. Evidence is opened only through server-authorized, short-lived URLs.
5. The COA comes from the existing HAWK mapping (`resolveExistingCOAMapping`). The demo accounts in `HAWK.SPEND.EXP_ACC` only drive the simulated journals.
