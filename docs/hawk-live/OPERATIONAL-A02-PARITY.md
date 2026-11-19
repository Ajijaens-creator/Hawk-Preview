# HAWK Operational · Matriks paritas A02 (14 Dashboard Kinerja)

Tanggal 19 November 2026 WITA. Sumber: `hawk-live/reference-ops/a02/docs/DASHBOARD-PARITY-MATRIX.csv` (paket Owner) dicocokkan dengan branch `claude/project-thread-nbqj53`.

Status kolom:
- **Repo frontend**: MATCH = view paket terpasang di shell hawk-live `#op-analytics` (komponen `hawk-live/ops/ops-analytics*.js`), uji browser `tests/hawk-live/ops-a02.e2e.js` lulus desktop/tablet/mobile.
- **Paritas visual Looker**: PARTIAL = susunan blok mengikuti paket; perbandingan piksel terhadap Looker/screenshot Owner belum dilakukan (Looker tidak dapat dibuka dari environment ini).
- **Backend/kontrak**: BLOCKED/NOT VERIFIED = endpoint, calculated field Looker dan formula resmi belum diaudit; data sintetis lokal.

| ID | Halaman sumber | View (`analyticsId`) | Kelompok sumber | Mode sumber | Entry | Verifikasi | Arah | Repo frontend | Paritas visual Looker | Backend/kontrak |
|---|---|---|---|---|---|---|---|---|---|---|
| OP-D01 | [Revenue Overview](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/Bp6AG) | `revenue` | revenue | Existing read-only | Reception/POS; Finance target | Finance reconciliation | higher / composition neutral | MATCH | PARTIAL | NOT VERIFIED |
| OP-D02 | [Profit and Loss](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_mugwu1ga8d) | `pnl` | finance | Existing read-only | Finance/Accounting | Finance approval | profit higher; expense contextual | MATCH | PARTIAL | NOT VERIFIED |
| OP-D03 | [Capacity & Capability](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_3zil2g8a8d) | `capacity` | capacity | Existing read-only | POS + HRD; readiness dari Ops | Supervisor / HRD | utilization range; absence contextual | MATCH | PARTIAL | NOT VERIFIED |
| OP-D04 | [Waste and Accuracy](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_2ar2th8a8d) | `waste` | waste | Manual physical record | Attendant / Inventory outlet | Head lalu Supervisor; posting Inventory | waste lower; accuracy higher | MATCH | PARTIAL | NOT VERIFIED |
| OP-D05 | [Customer Review & Satisfaction](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_kc5n4w7b8d) | `reviews` | feedback | Manual/shared | Reception / Hospitality | Head Reception / Supervisor / Hospitality | rating higher; volume contextual | MATCH | PARTIAL | NOT VERIFIED |
| OP-D06 | [Customer Satisfaction & Complaints](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_d78u20gg8d) | `satisfaction` | feedback | Manual/shared | Record feedback yang sama dengan reviews | Review sumber yang sama | satisfaction higher; complaint lower | MATCH | PARTIAL | NOT VERIFIED |
| OP-D07 | [Complain Handling Performance](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_e45tnvdc8d) | `retention` | customer | Existing read-only | POS + Sales/CRM | Sales / Hospitality | repeat higher; rebooking definition pending | MATCH | PARTIAL | NOT VERIFIED |
| OP-D08 | [Rebooking & Customer Retention](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_kpp28ibc8d) | `complaints` | complaints | Manual case | Reception / Hospitality | Head/Hospitality lalu Supervisor | resolution time lower; SLA higher | MATCH | PARTIAL | NOT VERIFIED |
| OP-D09 | [Tripadvisor Performance](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_5bco89cd8d) | `tripadvisor` | tripadvisor | Manual snapshot | Hospitality / Commercial | Reviewer berwenang, berbeda pembuat | rank lower; rating higher | MATCH | PARTIAL | NOT VERIFIED |
| OP-D10 | [Maintenance Performance](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_72qja4ee8d) | `maintenance` | maintenance | Manual ticket | Attendant / Maintenance | Head lalu Supervisor | response lower; completion higher | MATCH | PARTIAL | NOT VERIFIED |
| OP-D11 | [Grading FO](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_io3sb5ge8d) | `grading` | grading | Manual program | Head Reception / Hospitality | Supervisor / Hospitality / HRD | progress higher, bobot sesuai rubric | MATCH | PARTIAL | NOT VERIFIED |
| OP-D12 | [Team Competency & Readyness Bisma](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_7k7n43fe8d) | `competency` | competency | Manual assessment | Head departemen / Hospitality / HRD | Reviewer assessor berbeda | rubric higher; denominator/bobot jelas | MATCH | PARTIAL | NOT VERIFIED |
| OP-D13 | [Tracking Grooming](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_sbv7cmff8d) | `grooming` | grooming | Manual check | Tim / Head departemen | Head / Supervisor / Hospitality | coverage dan compliance berbeda | MATCH | PARTIAL | NOT VERIFIED |
| OP-D14 | [Bisnis Proses](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_lw56eqbd8d) | `process` | process | Manual document | Head / Supervisor / Hospitality | Review awal lalu assurance sesuai policy | approval higher; jumlah deskriptif | MATCH | PARTIAL | NOT VERIFIED |

## Komponen dan route

| Bagian | File di repo | Catatan |
|---|---|---|
| Definisi, schema 13 sumber, fixture, agregasi, guard scope | `hawk-live/ops/ops-analytics-data.js` | dari `src/analytics-data.js` paket |
| Entry, review, drilldown, insight, standar, tindak lanjut | `hawk-live/ops/ops-analytics-interactions.js` | self-approval ditolak; data kritis butuh final assurance Supervisor |
| Tampilan 14 dashboard, filter tanggal/periode, CSV | `hawk-live/ops/ops-analytics.js` | outlet mengikuti pemilih outlet di bar konteks hawk-live |
| Katalog SER (23 Vegen, 4 siklus/77 Beacon, 17 dimensi/209 RSF) | `hawk-live/ops/ops-ser.js` | katalog, bukan engine formula |
| Akun Jro Okta (Hospitality Manager) | `hawk-live/ops/ops-core.js` | 4 outlet demo; tanpa settings.manage, verifikasi stok/tugas, POS |
| Generator | `tools/ops-from-prototype.py hawk-live/reference-ops/a02` | regenerasi `hawk-live/ops/*` dari paket |
| Tambahan repo (bukan dari paket) | `hawk-live/ops-shell.js`, `ops-warehouse.js`, `ops-shell.css` | review Head sebelum sign-off, Gudang & Stok BHP, semua user outlet boleh menerima barang |

## Gap yang tersisa

1. Paritas piksel terhadap Looker/screenshot Owner belum diuji (perlu screenshot Owner di sesi ini atau akses Looker).
2. Calculated field Looker, formula/normalisasi X-Score, temuan SER (#REF! Beacon BB345, agregasi Vegen BB55 4 dari 6, arah absensi, unit rank Tripadvisor, bobot per siklus, PIC/ID outlet/tanggal siklus) masih keputusan Owner/Finance/HRD.
3. Adapter POS/Finance/HRD/CRM belum tersambung; Revenue/Finance/Capacity/Retention memakai fixture sintetis read-only.
4. Parity POS existing (POS-P01–P16): checklist sekarang ada di `docs/hawk-live/POS-Existing-Parity-Checklist.md`, tetapi isi POS setelah login belum diperiksa.
5. Insight = aturan simulasi, belum memanggil model AI.
