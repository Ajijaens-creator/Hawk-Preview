# HAWK Operational - Register visual Fase 1

**Review 19 November 2026 WITA. Basis: prototype v1.1 lokal, bukan verifikasi implementasi Claude.**

## Jumlah yang tepat

- F-OP01 Team & Access: **1 route**, **3 tab + 1 popup akun = 4 tampilan review**.
- Gelombang 1 F-OP00-03: **4 route utama**, disusun sebagai **10 tampilan review** (8 tampilan halaman/tab/role + 2 popup).
- Route yang masuk galeri: `#dashboard`, `#settings`, `#pos`, `#demo`.
- `#roadmap` teknis tidak dimasukkan. UI internal POS existing tidak dihitung karena belum diverifikasi dalam review ini.
- ID G1-V01 sampai G1-V10 adalah nomor review yang dibuat untuk laporan ini; bukan ID NV resmi yang sudah ada.

| ID review | Tampilan | Jenis | Fase | Route / entry |
|---|---|---|---|---|
| G1-V01 | Command Center - Manager | Varian dashboard | F-OP02 | `#dashboard` |
| G1-V02 | Command Center - Supervisor | Varian dashboard | F-OP02 | `#dashboard` |
| G1-V03 | Roles & permissions | Tab workspace | F-OP01 | `#settings` |
| G1-V04 | Aturan verifikasi | Tab workspace | F-OP01 | `#settings` |
| G1-V05 | Tim & organisasi | Tab workspace | F-OP01 | `#settings` |
| G1-V06 | Pilih akun demo | Popup bersama | F-OP00 / F-OP01 | `Header: Ganti akun demo` |
| G1-V07 | HAWK - Portal workspace | Popup bersama | F-OP00 | `Logo HAWK` |
| G1-V08 | POS & Receptionist - gateway | Halaman integrasi | F-OP03 | `#pos` |
| G1-V09 | Demo Center - Scenario Test Lab | Mode halaman | F-OP00 / F-OP11 | `#demo` |
| G1-V10 | Demo Center - Simulator 5 Role | Mode halaman | F-OP00 / F-OP11 | `#demo` |

## Catatan penerapan

Empat outlet tidak berarti empat desain dashboard. Tika memakai pola konsolidasi Manager; Supervisor memakai template yang sama dengan scope satu outlet. Desktop, tablet dan mobile merupakan variasi responsif, bukan route baru.

F-OP01 menyediakan matriks izin menu, kebijakan verifikasi, daftar tim dan pemilih persona. Editor hierarki, CRUD karyawan/role, undangan akun, izin individual/per tindakan serta enforcement backend belum menjadi fitur lengkap. Efek akses diperlihatkan lewat pergantian akun.

Popup portal memperlihatkan konteks integrasi. POS & Receptionist mengarah ke POS existing; galeri ini tidak mengganti atau mengklaim telah memverifikasi Dashboard POS dan Appointment Book di dalam aplikasi existing.

Demo Center adalah komponen bersama F-OP00/F-OP11. Keberadaannya pada galeri fondasi tidak berarti seluruh pengujian F-OP11 sudah selesai pada Gelombang 1.

Screenshot menangkap viewport. Baris atau panel di bawah area layar tetap memerlukan scroll pada prototype. Tanggal UI 18 Nov 2026 adalah tanggal fixture; laporan direview 19 Nov 2026 WITA.

## Sumber

- `hawk-operational/docs/NP-FE-OP01.md`
- `hawk-operational/src/governance.js`
- `hawk-operational/src/core.js`
- `hawk-operational/src/pos-existing.js`
- `hawk-operational/src/demo-experience.js`
- Screenshot browser aktual diambil dalam pemeriksaan read-only prototype. Tidak ada kode aplikasi atau konfigurasi production yang diubah.
