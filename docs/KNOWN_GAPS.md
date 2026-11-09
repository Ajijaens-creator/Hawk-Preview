# Known Gaps — MP-HAWK-11/12 (7P Master Financial Control Center)

A gap analysis against the MP-HAWK-11 prompt and MP-HAWK-12 domain update v1.2. Status: **BUILT** = works and is tested · **PARTIAL** = works with stated limits · **NOT BUILT** = not yet in the prototype · **NOT VERIFIED** = needs confirmation from the HAWK team or JAENS.

| # | Requirement | Status | Explanation / next step |
|---|---|---|---|
| G-01 | NV-57 Owner 7P Cockpit (KPIs, 7P table, donut, BU distribution, trend, AI) | BUILT | e2e 7P + screenshot 01 |
| G-02 | NV-16 two-way drill-down to the item level | BUILT | case A/B |
| G-03 | NV-23 item detail, transactions, evidence | BUILT · evidence = SIMULATION | the real document will come from `documents.openAuthorizedEvidence` |
| G-04 | Role views Owner/Finance/HRD/Komersil/Supervisor/Tax/BU Manager | BUILT | RBAC in the browser = DEMO; production must use the server |
| G-05 | Export Excel .xlsx & PDF following permissions + audit | BUILT (client-side) | production: server-side export (`report.export7P`), audit stored on the server |
| G-06 | AI insights with evidence & human approval | BUILT · AI SIMULATION | rule-based over the cube; no external model; read-only |
| G-07 | Tax dimensions (VAT, PPh 21/23/4(2), PBJT, invoice, credit, deductibility) | PARTIAL · SIMULATION | the rates/treatments are general illustrations; **NOT VERIFIED** by Tax Administration / consultant; not automated tax compliance |
| G-08 | **Division Workspaces** (MP-12: dedicated workspace per division HRD/Komersil/Finance) | **NOT BUILT** | for now covered by the HEAD_DIV view in NV-57/16/23 (own mode + steward). A dedicated workspace screen (task inbox, division KPIs) has not been made |
| G-09 | **Tax Workspace** (MP-12: review queue, tax invoices, PPh withholding) | **NOT BUILT** | Idha (TAX_ADMIN) sees tax dimensions per transaction in NV-23; there is no review queue / tax-status update screen |
| G-10 | **Expense / Payment Request** (MP-12) | **NOT BUILT** | the nearest existing flows: Smart Spend (NV-50) and Simple Order. A separate Expense/Payment Request flow linked to budget lines does not exist yet |
| G-11 | Smart Spend journals in BvA actual | PARTIAL | Smart Spend posts DEMO journals but does not yet increase `actual` on the 7P line (avoiding double counting until the HAWK mapping is confirmed) |
| G-12 | Real budget lines (126 lines FY2026) | DEMO | weights/names are illustrations; amounts reconcile with the NV-23 demo budget. Real JAENS lines must come from HAWK |
| G-13 | BGT-2026-OFC (Shared Office) | DEMO | added for the consolidation; numbers are illustrations |
| G-14 | Intercompany IC-2026-01 (312 M / 18 M) | DEMO | elimination values are illustrations; **NOT VERIFIED** |
| G-15 | Per-person payroll detail | intentionally not shown | aggregated per month only (privacy) |
| G-16 | Existing HAWK COA | TO VERIFY | `finance.resolveExistingCOAMapping` |
| G-17 | Production performance (large cube, pagination) | NOT VERIFIED | the prototype computes in the browser over 126 lines; production needs a cube/aggregation on the server |
| G-18 | Vercel preview of the review branch | protected by Vercel Authentication (401) | testing is done locally via Playwright; the live preview changes only after merging to main with the Owner's approval |
