# HAWK Operational · Matriks paritas A02 (14 Dashboard Kinerja)

Tanggal 19 November 2026 WITA. Sumber: `hawk-live/reference-ops/a02/docs/DASHBOARD-PARITY-MATRIX.csv` (paket Owner) dicocokkan dengan branch `claude/project-thread-nbqj53`.

Catatan: CSV paket menukar nama halaman OP-D07/OP-D08 dengan view-nya. Di Looker `p_kpp28ibc8d` = Rebooking & Customer Retention dan `p_e45tnvdc8d` = Complain Handling Performance; tabel di bawah sudah dikoreksi (urutan mengikuti sidebar Looker).

Status kolom:
- **Repo frontend**: MATCH = view paket terpasang di shell hawk-live `#op-analytics` (komponen `hawk-live/ops/ops-analytics*.js`), uji browser `tests/hawk-live/ops-a02.e2e.js` lulus desktop/tablet/mobile.
- **Paritas visual Looker**: MATCH (struktur) = 19 Nov 2026 ke-14 halaman laporan Looker "Operational Report New" dibuka hanya-baca dan dibandingkan per blok (judul, kartu KPI, diagram, tabel, filter outlet/tanggal, navigasi 14 halaman). Warna mengikuti palet HAWK, bukan tema krem Looker; angka tetap demo. Bukan uji piksel.
- **Backend/kontrak**: BLOCKED/NOT VERIFIED = endpoint, calculated field Looker dan formula resmi belum diaudit; data sintetis lokal.

| ID | Halaman sumber | View (`analyticsId`) | Kelompok sumber | Mode sumber | Entry | Verifikasi | Arah | Repo frontend | Paritas visual Looker | Backend/kontrak |
|---|---|---|---|---|---|---|---|---|---|---|
| OP-D01 | [Revenue Overview](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/Bp6AG) | `revenue` | revenue | Existing read-only | Reception/POS; Finance target | Finance reconciliation | higher / composition neutral | MATCH | MATCH (struktur) | NOT VERIFIED |
| OP-D02 | [Profit and Loss](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_mugwu1ga8d) | `pnl` | finance | Existing read-only | Finance/Accounting | Finance approval | profit higher; expense contextual | MATCH | MATCH (struktur) | NOT VERIFIED |
| OP-D03 | [Capacity & Capability](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_3zil2g8a8d) | `capacity` | capacity | Existing read-only | POS + HRD; readiness dari Ops | Supervisor / HRD | utilization range; absence contextual | MATCH | MATCH (struktur) | NOT VERIFIED |
| OP-D04 | [Waste and Accuracy](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_2ar2th8a8d) | `waste` | waste | Manual physical record | Attendant / Inventory outlet | Head lalu Supervisor; posting Inventory | waste lower; accuracy higher | MATCH | MATCH (struktur) | NOT VERIFIED |
| OP-D05 | [Customer Review & Satisfaction](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_kc5n4w7b8d) | `reviews` | feedback | Manual/shared | Reception / Hospitality | Head Reception / Supervisor / Hospitality | rating higher; volume contextual | MATCH | MATCH (struktur) | NOT VERIFIED |
| OP-D06 | [Customer Satisfaction & Complaints](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_d78u20gg8d) | `satisfaction` | feedback | Manual/shared | Record feedback yang sama dengan reviews | Review sumber yang sama | satisfaction higher; complaint lower | MATCH | MATCH (struktur) | NOT VERIFIED |
| OP-D07 | [Rebooking & Customer Retention](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_kpp28ibc8d) | `retention` | customer | Existing read-only | POS + Sales/CRM | Sales / Hospitality | repeat higher; rebooking definition pending | MATCH | MATCH (struktur) | NOT VERIFIED |
| OP-D08 | [Complain Handling Performance](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_e45tnvdc8d) | `complaints` | complaints | Manual case | Reception / Hospitality | Head/Hospitality lalu Supervisor | resolution time lower; SLA higher | MATCH | MATCH (struktur) | NOT VERIFIED |
| OP-D09 | [Tripadvisor Performance](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_5bco89cd8d) | `tripadvisor` | tripadvisor | Manual snapshot | Hospitality / Commercial | Reviewer berwenang, berbeda pembuat | rank lower; rating higher | MATCH | MATCH (struktur) | NOT VERIFIED |
| OP-D10 | [Maintenance Performance](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_72qja4ee8d) | `maintenance` | maintenance | Manual ticket | Attendant / Maintenance | Head lalu Supervisor | response lower; completion higher | MATCH | MATCH (struktur) | NOT VERIFIED |
| OP-D11 | [Grading FO](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_io3sb5ge8d) | `grading` | grading | Manual program | Head Reception / Hospitality | Supervisor / Hospitality / HRD | progress higher, bobot sesuai rubric | MATCH | MATCH (struktur) | NOT VERIFIED |
| OP-D12 | [Team Competency & Readyness Bisma](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_7k7n43fe8d) | `competency` | competency | Manual assessment | Head departemen / Hospitality / HRD | Reviewer assessor berbeda | rubric higher; denominator/bobot jelas | MATCH | MATCH (struktur) | NOT VERIFIED |
| OP-D13 | [Tracking Grooming](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_sbv7cmff8d) | `grooming` | grooming | Manual check | Tim / Head departemen | Head / Supervisor / Hospitality | coverage dan compliance berbeda | MATCH | MATCH (struktur) | NOT VERIFIED |
| OP-D14 | [Bisnis Proses](https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414/page/p_lw56eqbd8d) | `process` | process | Manual document | Head / Supervisor / Hospitality | Review awal lalu assurance sesuai policy | approval higher; jumlah deskriptif | MATCH | MATCH (struktur) | NOT VERIFIED |

## Perbandingan dengan Looker (19 Nov 2026, hanya baca)

| ID | Blok Looker | Di HAWK | Selisih yang disengaja / catatan |
|---|---|---|---|
| D01 | 4 KPI + %Δ, tren service, komposisi, revenue by outlet, 4 kartu outlet vs target | sama + tabel detail | — |
| D02 | 4 KPI + %Δ, profit contribution, profit by outlet, tren laba bersih, PNL summary table, expense by outlet | sama | Kolom Payroll Looker berupa nominal per outlet; HAWK menampilkan People sebagai **persentase** (aturan Budget 7P, nominal payroll hanya Manager HRD) |
| D03 | Room revenue, avg utility/day, avg utility/person, absensi; 4 diagram | sama | — |
| D04 | 4 KPI, waste trend, waste % YTD, tracking waste table, accuracy stock opname table | sama | Kartu Looker "Accuracy target" = 986,6 (kemungkinan SUM persentase 10 bulan); HAWK menghitung rasio baris cocok |
| D05 | Online/offline review, offline satisfaction, tren feedback, 2 donut online/offline, rating, source, complain offline | sama | — |
| D06 | 4 KPI, star achievement by outlet, satisfy vs complain, outlet contribution | sama | Looker: Ubud 95,34% puas dan 80,96% keluhan (jumlah >100%), perlu cek rumus |
| D07 | 4 KPI, customer count by outlet, contribution rebooking, outlet rebooking summary | sama | — |
| D08 | 4 KPI, handling by outlet, contribution, by source, detail complaint table | sama | Tabel HAWK per kasus (bisa ditelusuri); Looker agregat per outlet/bulan dengan "Tercapai/Tidak Tercapai" |
| D09 | Avg rank + %Δ, average rating, contribution, outlet ranking table, rank by outlet | sama | Diagram Looker berjudul "rank" tetapi isinya star rate; HAWK memisahkan rank (lebih kecil lebih baik) dan rating |
| D10 | Total maintenance, response time, status contribution, by outlet, issue by category & month | sama + open/reschedule & completion | Looker memuat unit ke-5 "Tress Laundry" dan bulan terurut alfabet; HAWK hanya 4 outlet Spa, bulan kronologis |
| D11 | Progress program, status, progress per tahapan, tabel 32 tahapan (PIC Okta) | sama | — |
| D12 | 5 kartu (total karyawan, indeks, score therapist/FO/attendant), tabel profil kompetensi | sama + 2 diagram | Looker menampilkan nama karyawan asli dan skor desimal mentah; HAWK memakai Employee ID demo dan persen. Subjudul Looker tersalin dari Maintenance |
| D13 | Grooming check, not executed, tren harian, by outlet, outlet compliance rate | sama + compliance & coverage | Di Looker kedua kartu dan donut compliance kosong saat dicek |
| D14 | Total document, approved rate, processed, list of business process, contribution, completion by role | sama | "Approved rate" Looker berupa jumlah (40), HAWK persen |

Ditambahkan setelah perbandingan: **perubahan vs periode lalu** di setiap kartu KPI (▲/▼, hijau/merah mengikuti arah metrik, pp untuk persen). Pembanding = jumlah bulan penuh yang sama sebelumnya (Okt → Sep), selain itu rentang hari yang sama tepat sebelumnya. Jika periode lalu tidak punya data terverifikasi, badge tidak muncul (tidak dikarang). Kode: `H.prevPeriod`, pembungkus `OPX.analytics.model` dan `H.kpiChange` di `hawk-live/ops-shell.js`; sisipan template lewat `tools/ops-from-prototype.py`; uji di `ops-a02.e2e.js`.

Catatan privasi: laporan Looker terbuka tanpa login dan memuat nama karyawan serta biaya payroll per outlet. Perlu keputusan Owner apakah tautan publik itu disengaja.

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

1. Paritas struktur dengan Looker sudah dicek (lihat bagian di atas). Uji piksel tidak dilakukan karena tema warna sengaja mengikuti HAWK.
2. Calculated field Looker, formula/normalisasi X-Score, temuan SER (#REF! Beacon BB345, agregasi Vegen BB55 4 dari 6, arah absensi, unit rank Tripadvisor, bobot per siklus, PIC/ID outlet/tanggal siklus) masih keputusan Owner/Finance/HRD.
3. Adapter POS/Finance/HRD/CRM belum tersambung; Revenue/Finance/Capacity/Retention memakai fixture sintetis read-only.
4. Parity POS existing (POS-P01–P16): checklist sekarang ada di `docs/hawk-live/POS-Existing-Parity-Checklist.md`, tetapi isi POS setelah login belum diperiksa.
5. Insight = aturan simulasi, belum memanggil model AI.
