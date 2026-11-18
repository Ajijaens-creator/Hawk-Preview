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

`python3 -m http.server 8811` dari root repo, lalu `bash tests/hawk-live/run-all.sh` (termasuk `ops-w1.e2e.js`).

## Kebutuhan backend (Gelombang 1)

| Domain pemilik | Kebutuhan | ID/field | Operasi | Status |
|---|---|---|---|---|
| HRD + IAM | Scope outlet & izin efektif ditegakkan server | accountId, role, dept, outletId, permissions | baca izin efektif; tolak 403 di luar outlet | NOT VERIFIED (endpoint tidak ditemukan di source) |
| POS existing | Read model dashboard per outlet/hari | bookingId, status, value, roomId, therapistId, paidAt | baca, dengan source/as-of/coverage | NOT VERIFIED |
| Operational | Readiness ruang & tugas | roomId, taskId, status, actor, time | baca/tulis | BUILD (belum ada) |
| POS existing | Parity isi POS-P01–P16, mapping ID appointment/room/therapist/invoice | — | — | BLOCKED: source POS tidak di repo, isi setelah login belum diperiksa, checklist belum diterima |
