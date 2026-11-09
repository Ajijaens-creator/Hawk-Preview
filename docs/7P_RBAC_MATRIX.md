# 7P RBAC Matrix — MP-HAWK-11/12

`P7.access(s, user)` → `{ ok, label, pred, export, modes[], tax, steward }`. DEMO: in production this must be enforced on the server.

| Account (demo) | Role | Visible scope | Lines FY2026 | Viewpoints | Export | Note |
|---|---|---|---|---|---|---|
| Aji Jaens | OWNER | Spa + Essence + Office consolidation | 126 | All units | ✓ | revenue & profit consolidated with eliminations |
| Niken | OWNER + `superAdmin` (Super Admin) | identical to Owner: all units, all BU & division budgets | 126 | All units | ✓ | Owner request 9 Nov 2026. Keeps Super Admin functions (org, users, approval rules). Maker-checker still applies: an approval-rule draft by Niken must be published by someone else (Aji) |
| Asri | FINANCE | all units | 126 | All units | ✓ | financial control & reconciliation |
| Idha | FINANCE · `TAX_ADMIN` | all units + tax dimensions | 126 | Cross-unit tax review | ✓ | tax decisions remain human; SIMULATION |
| Eni Restini | BU_MANAGER Spa | BU JAENS Spa | 96 | My BU's budget | ✓ | |
| Gek Niken | BU_MANAGER Essence | BU JAENS Essence | 15 | My BU's budget | ✓ | |
| Made Gunarsa | HEAD_DIV HRD | own division (6) + **People steward across units** | 6 / all P1 | My division · People stewardship | ✓ | the steward sees People cost in other divisions; the cost stays with the cost-centre owner |
| Dedik | HEAD_DIV Komersil | own division (4) + **Promotion steward across units** | 4 / all P3 | My division · Promotion stewardship | ✓ | Komersil team payroll = P1 People: owner Dedik, steward HRD, **counted once** |
| Tika | HEAD_DIV (Assistant OM) | Operasional Spa | 96 | My division's budget | ✓ | |
| Mila / Tina / Dewik / Wahyudi | SUPERVISOR | own outlet only | 23–24 | My outlet's budget | ✗ | export through the API → `FORBIDDEN` |
| Staff, Purchasing, Warehouse, Asset, Admin | — | no access to the 7P cube | 0 | — | ✗ | |

Restricted data: payroll is shown only **aggregated per month** (SIM-PY), with no per-person detail. Export contains only the rows in the user's scope (tested: a Supervisor's export contains no other outlets).
