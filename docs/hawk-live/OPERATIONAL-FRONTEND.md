# HAWK Operational · Frontend (NP-OP01 + Addendum A01 + NP-FE-OP01)

Status: **frontend siap ditinjau, data demo lokal**. Backend/kontrak: **NOT VERIFIED** kecuali disebut lain. Tidak ada merge/deploy tanpa Owner.

## Arsitektur

- Satu shell: `hawk-live/*.html` + `app.js` + `assets/css/hawk.css` + ID/EN (`i18n.js`). Pindah portal hanya lewat logo HAWK.
- Halaman Operational berasal dari prototype Owner v1.1 (`hawk-live/reference-ops/HAWK-Operational-Prototype-v1.1.html`), dipecah oleh `tools/ops-from-prototype.py` menjadi `hawk-live/ops/ops-*.js` (namespace `window.OPX`) dan `hawk-live/ops/ops.css` (di-scope `.opx`, token hawk.css, shell prototype dibuang).
- `hawk-live/ops-shell.js` memasang 15 route ke registry hawk-live: `#op-<halaman>` dan Demo Center `#ops-dx` (kartu besar paling atas sidebar). Akun/outlet demo ada di bar konteks halaman; role chip topbar mengikuti akun Operational.
- Satu fixture lokal `localStorage['hawk-operational-prototype-v1']` untuk semua halaman, ID sama lintas halaman (BK-, TSK-, ISS-, room `CTR-R01`, dst.).
- Menu **POS & Receptionist** → `https://preview.jaens.id/rnd-demo` (tab baru). `#op-pos` = gateway + register parity. POS sandbox lama `#pos` tetap sebagai route tersembunyi untuk skenario Sales/Commercial.
- Nama orang mengikuti master HRD: Eni Restini (Operational Manager), Tika (Assistant Operational Manager), Supervisor Mila (Ubud), Tina (Shanti), Dewik (Triloka), Wahyudi (Bisma).

## Route

| Route | Halaman | Fase |
|---|---|---|
| `#ops-dx` | Demo Experience Center | F-OP00 · F-OP11 |
| `#op-dashboard` | Command Center | F-OP02 |
| POS existing ↗ / `#op-pos` | POS & Receptionist / gateway | F-OP03 |
| `#op-daily` | Daily Operations | F-OP04 |
| `#op-tasks`, `#op-therapist` | Team & Tasks, Therapist Workspace | F-OP05 |
| `#op-rooms`, `#op-inventory` | Room & Facility, Inventory Coordination | F-OP06 |
| `#op-communication` | Communication Hub | F-OP07 |
| `#op-race` | AmbideX & RACE | F-OP08 |
| `#op-budget` | Budget 7P | F-OP09 |
| `#op-reports` | Reports & Analytics | F-OP10 |
| `#op-settings` | Team & Access | F-OP01 |
| `#op-roadmap`, `#op-validation` | Peta 12 Fase, Validation Lab | F-OP00, F-OP11 |

## Uji

`python3 -m http.server 8811` dari root repo, lalu `bash tests/hawk-live/run-all.sh` (termasuk `ops-w1`…`ops-w4.e2e.js` untuk Gelombang 1–4). Skrip UAT manual per role: `docs/hawk-live/OPERATIONAL-UAT.md`. `SHOTS=<folder>` menyimpan screenshot.

## Aturan yang ditambahkan shell (di luar prototype)

- **Opening/closing PIC → Head → Supervisor** (`ops-shell.js`, F-OP04): item checklist yang dicentang staf (Reception, Therapist, Attendant, Security) pada departemen yang memiliki Head wajib direview Head sebelum Supervisor dapat sign-off. Item seed dianggap sudah direview. Dapat dimatikan lewat `policies.headReview=false`.
- **Receiving** mengikuti matriks prototype v1.1: Attendant/Head Attendant mencatat fisik, Supervisor ke atas memverifikasi. Receptionist dan Therapist tidak memiliki menu Inventory di prototype (berbeda dengan aturan 60-NV 2026-11-08 "semua user outlet boleh menerima"; menunggu keputusan Owner).

## Kebutuhan backend (Gelombang 1)

| Domain pemilik | Kebutuhan | ID/field | Operasi | Status |
|---|---|---|---|---|
| HRD + IAM | Scope outlet & izin efektif ditegakkan server | accountId, role, dept, outletId, permissions | baca izin efektif; tolak 403 di luar outlet | NOT VERIFIED (endpoint tidak ditemukan di source) |
| POS existing | Read model dashboard per outlet/hari | bookingId, status, value, roomId, therapistId, paidAt | baca, dengan source/as-of/coverage | NOT VERIFIED |
| Operational | Readiness ruang & tugas | roomId, taskId, status, actor, time | baca/tulis | BUILD (belum ada) |
| POS existing | Parity isi POS-P01–P16, mapping ID appointment/room/therapist/invoice | — | — | BLOCKED: source POS tidak di repo, isi setelah login belum diperiksa, checklist belum diterima |

## Kebutuhan backend (Gelombang 2)

| Domain pemilik | Kebutuhan | ID/field | Operasi | Status |
|---|---|---|---|---|
| Operational | Checklist opening/closing per outlet/hari, review Head, sign-off Supervisor, EOD | outletId, date, itemId, dept, checkedBy, reviewedBy, signedBy, note, carryoverIssueIds | baca/tulis, kunci setelah sign-off, audit | BUILD (belum ada) |
| Operational | Tugas & bukti: status todo → in_progress → head_review → supervisor_review → done, return | taskId, assignee, critical, evidence, reviews[], verifiedBy | baca/tulis + upload bukti | BUILD |
| POS existing | Event selesai treatment (Completed) untuk membuat 1 turnover task | bookingId, roomId, therapistId, completedAt | event/webhook atau polling read model | NOT VERIFIED |
| Operational | Status ruang Ready/Cleaning/Maintenance/Closed + release maintenance oleh Supervisor | roomId, status, note, actor | baca/tulis | BUILD |
| Inventory existing | Receiving fisik + verifikasi; posting stok tetap di Inventory | receiptId (RCV-), expected, received, status | tulis status operasional; posting oleh Inventory | NOT VERIFIED (endpoint receiving tidak ditemukan) |
| MRF engine existing | Draft request material dari outlet | MRF id, outlet, item, qty, reason | buat draft | NOT VERIFIED (pakai engine PR/MRF existing, jangan bangun baru) |
| Operational | Issue ↔ task (1 issue → 1 tugas), resolusi tanpa mengubah ruang/stok | issueId, taskId, resolution | baca/tulis | BUILD |
| Komunikasi | Pesan per channel outlet (lokal, tidak terkirim keluar) | messageId, channel, outlet, taskId | baca/tulis | BUILD; WhatsApp/email eksternal di luar scope |

## Kebutuhan backend (Gelombang 3)

| Domain pemilik | Kebutuhan | ID/field | Operasi | Status |
|---|---|---|---|---|
| HRD RACE / SER | Kontrak KPI, indikator, target, bobot, arah, data kosong, konsolidasi X-Score | indicatorId, contractId, period, weight, formulaVersion | baca kontrak resmi | PENDING workbook SER/Looker/HRD RACE; X-Score resmi tidak dihitung di frontend |
| Operational / HRD | Sesi RACE (daily, weekly R2Re, monthly, STRACON) | id, type, outlet, period, sourceTaskIds, title, summary, blocker, commitment, status=draft | baca/tulis draf | BUILD |
| Finance (Budget 7P) | Alokasi disetujui per outlet/periode, actual, komitmen, sisa; distribusi musiman | outlet, p, period, version, revised, actual, committed | baca saja dari Operational | NOT VERIFIED (pakai engine budget 7P existing) |
| Finance | Usulan aktivitas outlet (draf, committed=false; tidak mengurangi saldo, tidak membuat PO/jurnal) | id, outlet, p, activity, amount, period, version | buat draf | BUILD; People hanya persentase, nominal People/payroll tidak dikirim ke Operational |
| Reports | Read model laporan per outlet/periode/departemen + ekspor sesuai izin (Manager/Assistant) | objectId, outlet, actor, time, period, coverage, verification | baca + ekspor terfilter scope di server | BUILD; ekspor saat ini hanya JSON lokal demo |

## Kebutuhan backend (Gelombang 4)

| Domain pemilik | Kebutuhan | Status |
|---|---|---|
| Demo Center | Tidak butuh backend. Progres panduan disimpan lokal per browser (`state.demoExperience.runs`), satu fixture untuk 5 panel simulator | Selesai di frontend |
| QA / release | UAT lapangan, uji isolasi outlet di server (403/IDOR), concurrency, retry tanpa duplikasi | Di luar mandat frontend; hasil UAT frontend bukan izin release |

## Status per fase

| Fase | Frontend | Uji otomatis | Backend/kontrak |
|---|---|---|---|
| F-OP00–03 | Siap ditinjau | `ops-w1.e2e.js` | NOT VERIFIED; parity POS BLOCKED |
| F-OP04–07 | Siap ditinjau | `ops-w2.e2e.js` | BUILD / NOT VERIFIED |
| F-OP08–10 | Siap ditinjau | `ops-w3.e2e.js` | KPI/X-Score PENDING; Finance NOT VERIFIED |
| F-OP11 | Siap ditinjau | `ops-w4.e2e.js` | n/a (lokal) |
