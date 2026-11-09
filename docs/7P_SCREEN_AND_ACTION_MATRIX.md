# 7P Screen & Action Matrix — MP-HAWK-11/12

Status: **DEMO / SIMULATION**. Every number comes from `HAWK.P7` (`assets/js/core/p7.js`). That is a cube over the existing budgets (`s.budgets`) and session transactions. It is **not** a second ledger. UI: `assets/js/screens/d-7p.js`.

All three screens share one filter state (`ui.local._p7`), so context carries over between NV-57 → NV-16 → NV-23. Deep links use the query `?p7=1&fy=&per=&bu=&loc=&div=&dept=&p=&sub=&line=&cls=&stream=&view=&mode=&tab=`.

| Screen | Area | Users | Actions (click) | Logical op | Status |
|---|---|---|---|---|---|
| **NV-57** Owner 7P Cockpit (top of NV-57) | Hero (budget, actual, available, consolidated revenue & profit) | Owner, Finance, BU Manager, Head Div, Supervisor (own scope) | KPI → NV-16 with filter | `budget.getPerformanceCube`, `finance.getAuthorizedRevenueProfit` | NEW INTEGRATION REQUIRED / TO VERIFY |
| | 7P table P1–P6 + P7 outcome row | same | Category name → NV-16 (7P → org mode) | `budget.getPerformanceCube` | NEW INTEGRATION REQUIRED |
| | Donut + tiles, BU distribution, Office memo, cumulative trend | same | BU → NV-16 (org → 7P mode) | same | — |
| | AI 7P insights (finding, source, as-of, evidence, impact, recommendation, owner, human approval) | same | Evidence button → NV-23 line / NV-16 filter | read-only | AI SIMULATION |
| | Filters (FY, period, BU, outlet, division, department, 7P, subcategory, fund type, stream, viewpoint) | same | Change filter, chips ✕, Back (undo), Reset | — | UI |
| | Export | Owner, Finance, BU Manager, Head Div | Excel .xlsx, PDF/Print | `report.export7P` (audit EXPORT_7P) | NEW INTEGRATION REQUIRED (server-side in production) |
| **NV-16** tab "7P Master Drill-Down" (default) | Mode 7P → Organization (`p,bu,loc,div,dept,sub,line`) and Organization → 7P (`bu,loc,div,dept,p,sub,line`) | same | Name = focus (breadcrumb grows), ▸ = expand in place, sort per column, search, "See all 7P for this unit", Close hierarchy | `budget.getPerformanceCube` | NEW INTEGRATION REQUIRED |
| | Selection panel: revised/original/actual/committed/available/forecast/variance, % revenue target (N/A when no denominator), steward vs budget owner, reconciliation check | same | → NV-23 transactions & evidence, NV-15/20/22, NV-17/61 (Product) | — | — |
| | Line item drawer | same | "Open detail, transactions & evidence" → NV-23 | `budget.getBudgetLineLineage` | NEW INTEGRATION REQUIRED |
| | tab "Allocation per budget" | — | the old NV-16 view (unchanged) | existing | — |
| **NV-23** tab "Per budget line, transactions & evidence" | Line detail: path breadcrumb (each level clickable back to NV-16), KPIs, dimensions, owner/steward, COA treatment (TO VERIFY), monthly bars, transaction table (ACTUAL / COMMIT / LINEAGE not counted) | same | Simulated document → evidence modal (tax: VAT, PPh, PBJT, tax invoice, VAT credit, deductibility, review); real session documents → open the original document | `documents.openAuthorizedEvidence`, `tax.getReviewStatus`, `finance.resolveExistingCOAMapping` | NEW INTEGRATION REQUIRED / TO VERIFY |
| | tab "7P register (per budget)" | — | the old NV-23 view (unchanged) | existing | — |
| **#/dx** Demo Center | Scenario 7 **SEVENP** (8 steps P7-01..P7-08) | Owner, Finance, HRD, Komersil, Supervisor, Tax | guided tutor across the three screens above | same | DEMO |
