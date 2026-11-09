# 7P Test Results — MP-HAWK-11/12

Run date: 2026-11-09, local Chromium (Playwright) over the `index.html` app plus the Node engine. The data is DEMO; nothing touches HAWK production.

## Summary
| Suite | Command | Result |
|---|---|---|
| Engine (including **T13 7P**: reconciliation, two-way drill, P7 not a cost, OPEX/CAPEX/Inventory, MRF→PO counted once, RBAC, steward, export + audit, valid XLSX, AI read-only, adapter TO VERIFY) | `node tests/workflow.test.js` | **410 pass, 0 fail** |
| UI 7P cases A–F + mobile | `node tests/e2e-7p.js` | **30 pass, 0 fail** |
| Demo Experience Center (7 scenarios including SEVENP) | `node tests/e2e-demo-center.js` | 35 pass, 0 fail |
| Smart Spend / Simple Order / Control Tower / Walkthrough | `node tests/e2e-*.js` | 27/27 · 33/33 · 32/32 · 21/21 |
| All screens × all users | `node tests/browser-all.js` | 1364 visits (22 users × 62 screens), 0 errors |
| Responsive | `node tests/responsive.js` | 1440 / 834 / 390 px: 62/62 OK |
| Build & deploy package | `node tests/deploy.test.js` | 33 pass, 0 fail (30 assets) |

Bug found and fixed during testing: NV-15 crashed for HRD/Komersil (their budget = Shared Office, which has no P7 Profit line). `S.budgetView` now returns a zero profit for a cost-centre budget.

## Detail of UI cases (tests/e2e-7p.js)
| Check | Result |
|---|---|
| NV-57: cockpit 7P tampil di atas (#p7-cockpit) dengan 7 KPI, label DEMO & as-of | PASS |
| NV-57: tabel 7P berisi P1–P6, P7 Profit dipisahkan (bukan biaya) | PASS |
| NV-57: insight AI memuat sumber, as-of, bukti, dampak, rekomendasi & persetujuan manusia, berlabel SIMULATION | PASS |
| A1. Klik P4 Process di cockpit → NV-16 drill-down dengan filter 7P = Process | PASS |
| A2. Klik berurutan BU → outlet → divisi → departemen → subkategori (breadcrumb mengikuti) | PASS |
| A3. Panel seleksi: angka = engine kube, rekonsiliasi ✓, steward ditampilkan | PASS |
| A4. Klik item "Software appointment & integrasi" → drawer detail line | PASS |
| A5. Buka NV-23 → detail line BL26-037 (KPI, dimensi, COA TO VERIFY, transaksi) | PASS |
| A6. Klik transaksi → evidence (dokumen simulasi berlabel SIMULASI / DEMO) | PASS |
| A7. Breadcrumb kembali dari NV-23 ke NV-16 pada level outlet (Shanti) tanpa kehilangan filter | PASS |
| B1. Finance: urutan Organisasi → 7P sampai subkategori yang sama | PASS |
| B2. Total org-first = total 7P-first (budget, actual, daftar line identik) | PASS |
| B3. Level teratas: jumlah per BU = jumlah per 7P = total lingkup (tampil di footer tabel) | PASS |
| C1. HRD Made Gunarsa: pilihan tampilan "divisi sendiri" dan "steward People" | PASS |
| C2. Mode steward People: hanya P1 People, lintas BU (Spa, Essence, Office) | PASS |
| C3. Komersil Dedik melihat cockpit dengan lingkup divisi + steward Promotion | PASS |
| C4. Gaji tim Komersil (P1 People) ada di lingkup Dedik sebagai pemilik budget | PASS |
| D1. Supervisor Mila: hanya budget JAENS Spa Center (Ubud) | PASS |
| D2. Supervisor: tombol ekspor tidak tersedia | PASS |
| D3. Supervisor memaksa ekspor lewat API → FORBIDDEN | PASS |
| D4. Staff tidak melihat cockpit 7P (layar tidak diizinkan atau kosong) | PASS |
| E1. Filter periode Q1 + BU Essence: chip aktif tampil, total footer = engine | PASS |
| E2. Undo mengembalikan filter sebelumnya (BU dilepas, Q1 tetap) | PASS |
| E3. Reset menghapus semua filter (kembali ke FY2026 setahun penuh) | PASS |
| E4. Pencarian "software" menemukan item di seluruh hierarki | PASS |
| F1. Ekspor Excel: file .xlsx terunduh, ZIP OOXML valid, 2 sheet (Ringkasan 7P, Detail budget line) | PASS |
| F2. Ekspor tercatat di audit trail (EXPORT_7P) dengan filter aktif | PASS |
| F3. Ekspor PDF: dialog cetak dipanggil, dokumen cetak memuat filter & baris sesuai lingkup | PASS |
| Mobile 390 px: NV-57, NV-16, NV-23 tanpa scroll horizontal halaman | PASS |
| Tanpa error JavaScript / console | PASS |

## Screenshots (`docs/screenshots/7p/`)
01 Owner cockpit · 02 Finance drill case A · 03 evidence · 04 HRD People steward · 05 Komersil cockpit · 06–07 mobile 390 px · `sample-export-process.xlsx` (Excel export, filter P4 Process).

## NOT VERIFIED
- Real HAWK APIs (all adapters DEMO / TO VERIFY / NEW INTEGRATION REQUIRED).
- Server-side RBAC and export (the prototype runs in the browser).
- Tax treatments (SIMULATION, not yet reviewed by Tax Administration).
- PDF: the print dialog is verified to be called with the right content; the PDF file itself is produced by the browser's "Save as PDF" and was not tested automatically.
- The Vercel preview for the review branch (protected, 401) — the live preview changes only after merge.
