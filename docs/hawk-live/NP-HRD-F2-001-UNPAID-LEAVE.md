# NP-HRD-F2-001 · ESS Unpaid Leave & Payroll Integration (prototipe)

**DATA DEMO / SIMULASI.** Perubahan hanya pada prototipe Hawk-Preview (`hawk-live/`). Tidak ada perubahan pada Hawk-RnD, database, API, atau production.

Referensi: audit NP-HRD-F2-001 (21 Nov 2026) dan jawaban bisnis PIC (23 Nov 2026).

## Aturan yang diterapkan

| No. | Aturan | Implementasi |
|---|---|---|
| 1 | Cut-off payroll 1–akhir bulan | `HR7.PERIODS` / `periodRange()` (sudah 1–akhir bulan) |
| 2 | Saldo tidak cukup → dibagi otomatis | `leave-request`: `paidDays` = sisa saldo, sisanya `unpaidDays` |
| 3 | Karyawan memilih unpaid, atau sistem menawarkan konversi dengan persetujuan karyawan | Tanpa centang "Setujui sisa hari sebagai Cuti Tidak Dibayar" sistem mengembalikan tawaran (`NEED_UNPAID_CONSENT`), tidak membuat penolakan. Dengan centang, pengajuan dibuat dan `consent` dicatat. Kategori "Cuti Tidak Dibayar" tetap bisa dipilih langsung. |
| 4 | Presisi penuh, dibulatkan sekali pada total; 0,5 ke atas | `unpaidOf()`: `Math.round(gaji pokok × hari unpaid ÷ hari kerja)` satu kali per karyawan per periode |
| 5 | Dasar = gaji pokok (+ komponen tetap yang sah) | Prototipe memakai gaji pokok kontrak (`baseOf`). Tunjangan transport & makan tidak ikut (bukan komponen tetap). **TO VERIFY** daftar komponen tetap. |
| 6 | Hari dihitung dari hari kerja terjadwal | `HR2.workdays()`: jadwal tetap efektif per tanggal + penugasan tambahan, tanpa libur jadwal dan kalender libur perusahaan. Berlaku untuk semua kategori cuti. |
| 7 | PPh 21 dan BPJS diperlakukan berbeda | Potongan menurunkan bruto, jadi PPh 21 (simulasi) ikut turun. Dasar BPJS tetap gaji pokok kontrak. **TO VERIFY** dengan Finance/Tax. |
| 12 | Koreksi setelah kunci lewat periode berikut | `adjustments()`: unpaid disetujui setelah batch dikunci menjadi `ADJ-UNP-<Request ID>-<periode>` ke periode berikut. Snapshot menyimpan `unpaid` (Request ID + tanggal) sebagai kunci anti-ganda. |

Approval tetap `APR-LEAVE`: Supervisor Outlet / atasan langsung → Manager HRD. Unpaid dicatat di ledger `LV-UNP` dan tidak mengurangi saldo berbayar.

Belum diubah (di luar scope atau menunggu keputusan): delegasi Operational Manager pada tahap Supervisor (jawaban no. 8, perubahan RBAC), aturan kasus khusus (sakit, melahirkan, karyawan baru, resign), dan akun jurnal Finance. Di jurnal prototipe, potongan mengurangi 6101 Beban Gaji (**TO VERIFY** Finance).

## File

- `hawk-live/hrd-f2-model.js`: `isWorkday`, `workdays`, `unpaidDates`, `leave-request`, ledger saat final.
- `hawk-live/hrd-f2.js`: centang konversi di form Ajukan, rincian dibayar/tidak dibayar di Approval dan Riwayat.
- `hawk-live/hrd-f7-model.js`: aturan `RUL-UNP` v1, `unpaidOf`, `nextPeriod`, baris slip "Potongan cuti tidak dibayar", snapshot `unpaid`, penyesuaian, jurnal.
- `tests/hawk-live/hrd-unpaid-leave.test.js`: 29 uji (normal, saldo habis, split, ditolak, lintas periode, perubahan jadwal, pembulatan, payroll terkunci, anti-ganda, jurnal, role).

## Kesiapan backend Hawk-RnD (hawk-backend-erp)

| Kebutuhan | Kondisi di Hawk-RnD | Yang perlu dibangun (butuh izin terpisah) |
|---|---|---|
| Pengajuan cuti ESS + approval 2 tahap | Tidak ada modul cuti | Tabel jenis cuti, pengajuan, tahap approval, ledger saldo; endpoint ESS submit, decide per tahap, saldo |
| Hari kerja terjadwal | Ada `hrd_shift_schedule_detail` (per karyawan per tanggal) dan `hrd_mr_shift` | Query hari kerja per periode; sumber kalender libur perusahaan perlu dipastikan |
| Gaji pokok | `hrd_payroll_base_salary` (per karyawan × komponen × periode) | Penanda komponen yang menjadi dasar potongan |
| Periode & cut-off | `hrd_payroll_periode` tanpa tanggal; rentang diisi per transaksi `hrd_payroll_create_salary` | Kolom tanggal mulai/akhir atau aturan cut-off |
| Perhitungan potongan | Tidak ada mesin hitung; nominal dikirim frontend | Komponen potongan `payroll_type = 2` + perhitungan (server atau frontend) |
| Jurnal | Komponen deduction dijurnal kredit ke COA komponen saat pembayaran di-approve | Mapping COA potongan unpaid dari Finance |
| Kunci & adjustment | `approve_status = 4`; endpoint update/delete create salary tidak terlihat mengecek status approved | Guard status + tabel adjustment dengan referensi Request ID |
| RBAC | Endpoint payroll `scopes=[]`; role/fitur payroll ada di tabel | Pengecekan fitur di endpoint; role Supervisor/Manager HRD untuk approval cuti |

## Uji yang dijalankan

`node tests/hawk-live/hrd-unpaid-leave.test.js` (29/29) dan seluruh uji model `tests/hawk-live/*.test.js` lulus, serta e2e browser `hrd-f1`, `hrd-f2`, `hrd-f7`, `hrd-dx` lulus.
