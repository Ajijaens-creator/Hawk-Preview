# 7P Financial Data Dictionary — MP-HAWK-11/12

All of this is DEMO data. No JAENS production data, account codes, or tax IDs are invented. Owner FY2026 figures as of 2026-11-08: budget Rp17.84 B, actual Rp13.63 B, open commitments Rp583 M. Consolidated revenue is Rp19.07 B after eliminating Rp312 M of inter-BU sales (target Rp24 B). Consolidated profit is Rp3.56 B after eliminating Rp18 M of unrealized margin, a margin of 18.7%.

## Budget line (`P7.lines(s, fy)`)
| Field | Meaning | Source / rule |
|---|---|---|
| `id` | BL26-xxx (FY2026), BL27-… (FY2027 derived from the NV-15 plan) | `s.p7lines` (126 lines) |
| `budget` | Parent budget ID (BGT-2026-SPA / ESS / **OFC**) | existing budget |
| `p` | PEOPLE…FACILITY (P1–P6). PROFIT (P7) = outcome, **never a cost** | taxonomy `s.p7Taxonomy` |
| `cls` / `kind` | OPEX / CAPEX; `kind` INVENTORY = inventory OPEX | same as NV-23 |
| `bu`, `loc`, `div`, `dept`, `sub` | BU, outlet/office, division, department (`s.departments`), subcategory | org from `s.org` (dynamic, no hardcoded branches) |
| `stream` | OPERATIONAL / INNOVATION (ambidexterity) | — |
| `w` | Line weight inside the aggregate BU × 7P × class | amounts = largest-remainder split of the aggregate → **always reconciles to the rupiah** with `S.budgetView` |
| `original`, `revised` | Original vs revised budget (FY) | budget revision NV-22 |
| `actual` | Baseline actual + live facts (stock ISSUE, completed WOs) | each fact is assigned to **exactly one** line |
| `commitment` | Approved MRFs not yet issued (open qty × price) | PO from the same MRF = lineage, **not added again** |
| `forecast` | Actual + run-rate + commitment | DEMO |
| `mBudget/mActual/mForecast[12]` | Monthly phasing using the seasonality `s.season` | used by periods YTD/Q1–Q4/M01–M12 |

## Calculations
- `available = budget(period) − actual − commitment`. When the selected period ended before this month, commitment = 0 (open commitments do not belong to a past period).
- `utilization = actual / budget`; `variance = actual − budget`.
- Ratios to revenue: computed only for whole BUs, whole outlets, or the consolidation. **Divisions, departments, items, and Office get N/A** (no direct revenue).
- Office: a cost centre. Cost by beneficiary BU (allocation pool `s.sharedAllocations`) is shown as a **memo**, not added to BU totals.
- Consolidation: Spa + Essence revenue minus intercompany IC-2026-01 (`s.intercompany`); profit minus unrealized margin.

## Transactions behind a line (`P7.txns`)
| Type | Stage | ID | Note |
|---|---|---|---|
| PAYROLL_AGG | ACTUAL | SIM-PY-2026MM-xxx | aggregated per month — no per-person payroll detail |
| AP_BILL / ACCRUAL / ASSET_CAP | ACTUAL | SIM-INV-…, SIM-AST-… | SIMULATION |
| PO_OPEN | COMMIT | SIM-PO-… | SIMULATION |
| LIVE_ACTUAL / LIVE_COMMIT | ACTUAL / COMMIT | real IDs (ISS/WO/PR…) | from the session, clickable to the original document |
| PO_LINEAGE | LINEAGE | real PO | shown, **not counted** |

## Tax dimensions (`P7.tax`) — SIMULATION
VAT (input 11% / not relevant), PPh (21 payroll, 23 services, 4(2) rent), PBJT (event venue), tax-invoice status, VAT credit, deductibility, review status. The final decision is made by Tax Administration (Idha) and the tax consultant. **This is not automated tax compliance.**
