# 7P Accounting Controls — MP-HAWK-11/12

| # | Control | Implementation | Test |
|---|---|---|---|
| AC-01 | No new COA, no duplicate GL | The cube reads the existing budgets plus session transactions; COA status TO VERIFY | T13 adapter |
| AC-02 | Cube = NV-23 aggregate, to the rupiah | largest-remainder split per BU × 7P × class; FY2026 forecast in `S.budgetView` = sum of line forecasts | T13 reconciliation (revised/actual/commitment) |
| AC-03 | Two-way drill-down, identical totals | 7P-first vs org-first on the same filter → same lines & amounts; children sum to the parent at every level | T13 + e2e A/B |
| AC-04 | P7 Profit is not a cost | PROFIT is excluded from the cube rows; shown as a separate outcome row | T13 |
| AC-05 | OPEX / CAPEX / Inventory separated | `cls` filter; total of the three = overall total | T13 |
| AC-06 | No double counting MRF → PO | approved MRF = commitment; PO from the same MRF = LINEAGE (not counted) | T13 |
| AC-07 | Each fact on one line | ISSUE ledger / WO / MRF → exactly one line (lowest index of the same BU × 7P × class) | T13 reconciliation after live transactions |
| AC-08 | Steward ≠ owner | Steward (HRD for People, Komersil for Promotion) gets a view only; the cost stays with the cost centre | T13 BL26-114 |
| AC-09 | Office has no revenue | revenue/profit for Office, divisions, departments → N/A with a reason | T13 |
| AC-10 | Intercompany eliminations | revenue −312 M, profit −18 M of unrealized margin in the consolidation | T13 |
| AC-11 | Past periods do not carry today's commitments | commitment = 0 when the period ended before the current month | engine |
| AC-12 | Export audited & permission-controlled | `report.export7P` → `EXPORT_7P` in the audit; Supervisor/Staff FORBIDDEN | T13 + e2e D/F |
| AC-13 | AI read-only | insights do not change budgets/journals; labeled AI SIMULATION; every insight carries source, as-of, evidence, human approval | T13 + e2e |
| AC-14 | Tax not automated | tax dimensions are SIMULATION; decided by Tax Administration | doc + UI |
