# DATA DICTIONARY — state prototipe HAWK × JAENS

Semua nilai DEMO. Struktur di bawah adalah model **logis** untuk pemetaan ke tabel HAWK. Ini bukan skema database baru. Kolom "HAWK" menunjukkan padanan yang terlihat di HAWK v2.11.6 (status TO VERIFY) atau "baru" bila tidak ada bukti.

## Format ID

| Entitas | Format | Contoh | Catatan |
|---|---|---|---|
| MRF (Purchase Request) | `PR` + YYYYMM + 5 digit | PR20261100006 | Mengikuti nomor PR HAWK |
| Purchase Order | `PO` + YYYYMM + 5 | PO20261100002 | |
| Transfer | `TR` + YYYYMM + 5 | TR20261100002 | |
| Goods Receipt | `GR` + YYYYMM + 5 | GR20261100001 | |
| Tagihan AP | `BL` + YYYYMM + 5 | BL20261100002 | |
| Jurnal | `JV` + YYYYMM + 5 | JV20261100004 | Diposting oleh engine HAWK |
| Dokumen tangkapan AI | `DC` + YYYYMM + 5 | DC20261100001 | |
| Maintenance / Work order | `MT…`, `WO…` | MT20261100003 | |
| Pembayaran | `PY-2611-nnnn` | PY-2611-0002 | |
| Plan line budget | `BL27-nnn` | BL27-001 | FY2027 |
| Revisi | `REV-…`; Proyek `PRJ-YYYY-nn`; Aset `AST-<cabang>-nnnn`; Insight `AI-…`; Non-rutin `NRB-YYYY-nn`; Audit `AU-nnnnn` | | |

## Organisasi & akses (Modul B)

| Entitas | Field utama | Aturan |
|---|---|---|
| `org` (unit) | id, type GROUP/BU/OFFICE/BRANCH/DIVISION/FACILITY, code, name, parent, status ACTIVE/ARCHIVED, scope IN/OUT, location | Kode unik; parent wajib & aktif; tidak boleh melingkar; arsip ditolak bila ada MRF/PO terbuka atau sub-unit aktif; tidak ada hard delete |
| `costCenters` | id `CC-<code>-OPS`, name, org | Dibuat otomatis untuk unit baru |
| `sharedAllocations` | pool, basis, splits {buId: rasio}, monthlyCost | Total rasio = 100% |
| `users` | id, name, role (10 role), title, scope[] (unit) | Demo saja, tanpa password |
| `approvalRules` | id, doc, name, condition, min, max, chain[], postApproval, escalateTo, slaHours, active, version, pending{changes,by,ts}, history[] | Edit = draft; terbit oleh Owner (maker ≠ checker) |
| `audit` | id, ts, user, role, op, ref, detail | Ditulis oleh setiap operasi tulis |

## Target & strategi (Modul C)

| Entitas | Field | Aturan |
|---|---|---|
| `targets` | id, fy, bu, revenue, profit, status, version | Per BU Spa / Essence; **tanpa** target grup Rp125 M |
| `drivers` | bu, id, name, unit, target, actual | Driver tree KPI |
| `projects` | id PRJ-, name, bu, type OPERATIONAL/INNOVATION, capex, opex, status, owner, payback, irr, milestones[] | Ambidexterity portfolio |

## Budget 7P (Modul D)

| Entitas | Field | Aturan |
|---|---|---|
| `budgets` | id BGT-FY-BU, fy, bu, status DRAFT/SUBMITTED/LOCKED, version, approvals[], history[], lines[], plan[] | Stage dihitung: Draft → Head Review → Finance Review → Owner Review → Locked |
| `budgets.plan[]` (FY2027) | id BL27-, unit, p (7P), name, item, qty, price, kind, stream OPERATIONAL/INNOVATION, routine, kpi, original, revised, weights[12], project | p = PROFIT ⇔ kind = PERFORMANCE; Σ weights = 100 (±0,11); unit harus di BU budget |
| `kind` (jenis dana) | OPEX, INVENTORY, CAPEX, WORKING_CAPITAL, DEPOSIT, FIN_INVESTMENT, PERFORMANCE | Memisahkan OPEX, CAPEX, investasi persediaan, kebutuhan modal lain |
| `budgets.lines[]` (agregat per 7P × kelas) | p, cls, original, revised, baseActual, baseCommit | Untuk FY2027 diturunkan dari plan; FY2026 seed |
| `itemBudgets` | period YYYY-MM, branch, item, qty, value, baseActualQty | Budget BHP bulanan per cabang × item |
| `budgetRevisions` | id REV-, budget, quarter, reason, changes[{line?,p,old?,newAmount?,delta}], status, by | Original tidak pernah berubah |
| `nonRoutine` | id NRB-, name, bu, unit, p, kind, amount, used, status, reason, by, decidedBy | Terpisah dari BHP rutin; SoD |

**Angka turunan (tidak disimpan):** Actual = seed actual + penyerahan ISSUE baru + WO selesai (FACILITY). Commitment = qty MRF disetujui yang belum diserahkan × harga. Forecast = maks(actual + commitment, actual + run-rate × sisa bulan).

## MRF, pembelian, gudang (Modul E–G)

| Entitas | Field | Aturan |
|---|---|---|
| `items` | id, barcode, name, unit, p (7P), routine, price, supplier, cat | |
| `mrfs` | id PR…, date, requester, branch, wh, cc, type ROUTINE/NON_ROUTINE, status, memo, chain[], approvals[], lines[], history[] | Rantai dibekukan saat diajukan |
| `mrfs.lines[].alloc[]` | path LOCAL/TRANSFER/PURCHASE, qty, fromWh, ref (TR/PO), readyQty, issuedQty | Σ alloc.qty = qty diminta; issuedQty ≤ readyQty ≤ qty |
| `suppliers`, `quotations`, `priceHistory` | rating, onTime, term, leadDays; harga, MOQ, berlaku s/d | Perbandingan NV-34 |
| `pos` | id, supplier, deliverTo, status, emergency, term, freight, taxRate, chain, approvals, lines[{item, qty, received, price, disc, mrfRefs[]}] | PO = komitmen, tanpa jurnal |
| `transfers` | id TR…, from, to, status, mrf, lines | Tidak membuat pendapatan/biaya |
| `warehouses` | id WH-, org, racks[], bins[] | |
| `stock` | wh, item, onHand, reserved, min, max, bin | available = onHand − reserved |
| `ledger` | id, ts, type ISSUE/TRANSFER_OUT/TRANSFER_IN/RECEIPT/RETURN/ADJUST/NON_ROUTINE, wh, item, qty (±), ref, cc, by, note | Setiap mutasi stok = 1 baris |
| `grns` | id GR…, po, wh, status RECEIVED/POSTED/STORED, lines[{expected, received, damaged, bin}], docs, receiver, journal | Fisik ≠ posting |
| `opnames` | id, wh, status, lines[{item, system, counted}] | Penyesuaian setelah disetujui |

## Finance & aset (Modul H–I)

| Entitas | Field | Aturan |
|---|---|---|
| `docs` | id DC…, sample, fields{supplier, invoiceNo, poText, lines, subtotal, tax, total}, confidence, status, checks[] | Hasil AI = draft; manusia verifikasi |
| `bills` | id BL…, supplier, invoiceNo, po, grn, subtotal, tax, total, status, due, matchStatus, verifiedBy, approvedBy, journal | verifiedBy ≠ approvedBy |
| `payments` | id PY-, bill, amount, date, method, status, by | Konfirmasi eksplisit |
| `journals` | id JV…, ts, source, kind, status PENDING_REVIEW/POSTED, memo, lines[{acc, cc, dr, cr}] | Σ dr = Σ cr; diposting via engine HAWK |
| `assets` | id AST-, name, cat, org, location, acquired, cost, life, method, status, condition, lastService, serviceIntervalDays, source, history[] | |
| `maintenance` / `workOrders` | MT: asset, reporter, issue, priority, status; WO: mt, assignee, parts, cost, notes | WO dapat meminta part via MRF |

## AI (Modul J)

| Entitas | Field |
|---|---|
| Insight (dihitung, tidak disimpan) | id, area, p, severity, title, finding, statements[{kind FACT/METRIC/FORECAST/HYPOTHESIS/RECOMMENDATION, text}], evidence[{label, value, ref?, nav?}], source, asOf, impact, owner (role), workflow |
| `insightState` | {insightId: {status, by, ts, note, owner}} — keputusan manusia |
