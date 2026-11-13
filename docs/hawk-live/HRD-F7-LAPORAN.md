# HAWK HRD · F7 Payroll & People Budgeting · Laporan

DATA DEMO / SIMULASI (R&D). File: `hawk-live/hrd-f7-model.js` (global `HR7`) dan `hawk-live/hrd-f7.js` (layar). Nominal, slip, jurnal, laporan dan ekspor sintetis. Tarif PPh 21 (TER) dan BPJS adalah versi aturan simulasi, bukan tarif resmi.

## Rute → NV
| NV | Rute | Sidebar |
|---|---|---|
| F7-NV01 Dashboard Payroll | `#hrd-payroll?period=2610/2611&scope=` | Payroll |
| F7-NV02 Komponen & Aturan Payroll | `#hrd-pay-rules?id=RUL-…` | Komponen & Aturan |
| F7-NV03 Rekonsiliasi Komisi POS | `#hrd-pay-commission?outlet=&emp=&view=four/adj` | Komisi POS |
| F7-NV04 Proses Payroll Periode | `#hrd-pay-process?period=` | Proses Payroll |
| F7-NV05 Slip Gaji & Status Pembayaran | `#hrd-pay-slip?period=&emp=&pay=` | Slip & Pembayaran |
| F7-NV06 Kasbon & Reimburse | `#hrd-finance?tab=ksb/rmb/ledger`, `#hrd-cash`, `#hrd-reimburse` | Keuangan › Kasbon, Reimburse |
| F7-NV07 Laporan Payroll, Pajak & BPJS | `#hrd-reports?group=&item=` | Laporan |
| F7-NV08 Handoff Finance & Accounting | `#hrd-pay-handoff?period=` | Handoff Finance |
| F7-NV09 Dashboard People Budgeting | `#hrd-budget?year=&scope=` | People Budgeting |
| F7-NV10 Rencana Anggaran & Alokasi Divisi | `#hrd-bud-plan` | Rencana Anggaran |
| F7-NV11 Simulasi Rekrutmen & Outlet Baru | `#hrd-bud-sim?id=` | Simulasi Rekrutmen |
| F7-NV12 Tren Bulanan & Kurva S | `#hrd-bud-trend` | Tren & Kurva S |

## Fixture nominal
- Oktober 2026 = kalibrasi: komponen diturunkan sehingga THP setiap slip = THP roster F1 (total Rp557.750.000, 158 slip). Batch PAY-2610-01 terkunci, dibayar (1 Gagal, 1 Sebagian), jurnal JRN-PAY-2610-01 diterima Finance.
- Komponen: gaji pokok (kalibrasi), tunjangan Rp700rb / Rp1,2 jt (supervisor & manager), komisi Rp5.000 per jam layanan (RUL-KOM v1), lembur 1,5 × gaji pokok/173, reimburse, potongan BPJS karyawan 4%, PPh 21 TER simulasi, cicilan kasbon. Biaya perusahaan menambah BPJS perusahaan 10,24%.
- November 2026 provisional: komisi dari baris POS F5 Minggu 46 (Service Line ID), kasbon KSB-2611-001 cicilan C1, reimburse RMB-2611-001 via payroll, RMB-2611-002 selesai di kas kecil.
- Revenue outlet Oktober (simulasi): Ubud Rp850 jt, Santi Rp480 jt, Triloka Rp650 jt, Bhisma Rp570 jt, pola musiman bulanan; pagu = 25% revenue rencana (BUD-2026-v1).

## Alur yang teruji
1. Komisi Spa Ubud (bantuan Santi dibayar di outlet aktual, Four Hands dibagi) → replay POS tanpa komisi ganda → generate draf PAY-2611-01 → regenerasi batch sama (v2) → review → kunci (snapshot) → slip rekonsiliasi → status bayar butuh referensi BANK-… (gagal tercatat) → refund setelah kunci menghasilkan ADJ-RFD-… ke Desember merujuk baris asal → jurnal seimbang = snapshot → handoff gagal → retry kunci sama → Finance menerima.
2. Aturan di periode terkunci ditolak; versi v2 efektif Desember, Oktober tetap v1 → cicilan kasbon dipakai tepat sekali, ledger saldo Rp1 jt → reimburse kas kecil tidak dibayar dua kali → 19 laporan, Ringkasan Gaji merekonsiliasi batch, PPh menampilkan versi aturan simulasi.
3. Budget: definisi pembilang/penyebut, filter terbawa ke rencana, 12 bulan = total tahun, alokasi Office 100%, simulasi tambah 2 therapist (tahun berjalan vs setahun penuh, wajib Requisition ID F4), kurva S akhir = total tahun, pembanding 2025.
4. Staf HRD/Therapist ditolak (termasuk URL langsung), Owner agregat tanpa slip, Finance agregat + jurnal, filter status Gagal, keadaan kosong, keyboard, mobile 390 px.

## Uji
- `node tests/hawk-live/hrd-f7-model.test.js`: 52/52.
- `node tests/hawk-live/hrd-f7.e2e.js`: 47/47.

## Status integrasi
POS: UI-ONLY SIMULATION (F5). Bank/pembayaran, pajak (PPh 21/26, Coretax), BPJS, endpoint jurnal Finance: NEW INTEGRATION REQUIRED. Pemetaan COA: TO VERIFY dengan Finance.

## Asumsi / perlu konfirmasi
- Komponen Salary Ratio (bruto gaji) dan Total People Cost (bruto + BPJS perusahaan + alokasi Office); koridor 25–30%.
- Aturan komisi therapist (Rp per jam layanan selesai; refund membalik komisi; bantuan dibayar di outlet aktual).
- Tarif PPh 21 TER dan BPJS resmi + tanggal berlaku; template Coretax.
- Pemetaan COA (6101–6106, 2101–2103, 1104) dan cost center.
- Akses Finance ke nominal/artefak pembayaran individu (preview: agregat saja). Slip ESS untuk karyawan sendiri belum dibuka (mandat: nominal personal hanya Manager HRD).
- Dasar alokasi Office ke outlet (preview: porsi revenue Oktober).
- Gaji pokok dummy hasil kalibrasi THP, bukan acuan UMK.
