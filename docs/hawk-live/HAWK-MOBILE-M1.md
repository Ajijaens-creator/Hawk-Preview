# HAWK Mobile · M1 alur mobile R&D

Tanggal 14 November 2026. Sumber: `hawk-live/reference-hrd/NB-HRD/ADDENDUM-MOBILE-APP-DAN-PRESENSI.md`. Semua data dummy R&D.

## Apa yang dibuat

Preview **HTML + simulasi** di portal HRD, menu **HAWK Mobile** (`/hawk-live/hrd#hrd-mobile`). Ini bukan aplikasi Android/iOS terpasang.

| Bagian | Isi | Berkas |
| --- | --- | --- |
| Lima menu | Beranda, Pekerjaan, Presensi, Inbox (Chat · Notifikasi · Approval), Saya | `hawk-live/hrd-mobile.js` |
| Model | Akun peran, presensi, offline/sinkron, pengecualian, chat, POS spa | `hawk-live/hrd-mobile-model.js` (`HRM`) |
| Catatan presensi | Kejadian mobile digabung ke catatan F2 yang sama (`HR.EXT.mobileAtt`), terlihat di Presensi F2, Kontrol shift Supervisor, Beranda HRD dan peta lokasi | `hrd-f2-model.js` |
| Tugas | Task ID F3 yang sama. PIC/kontributor boleh memindahkan & mencentang kartunya sendiri dari mobile | `hrd-f3-model.js` |
| Approval | Pemeriksaan presensi masuk `hr.queue` (kebijakan APR-ATT) dan diputuskan lewat aksi `decide` F2 | `hrd-f2-model.js` |
| Uji | 40 skenario penerimaan §10 | `tests/hawk-live/hrd-mobile.e2e.js` |

## Akun demo (Employee ID fixture 158, tanpa menambah headcount)

| Akun | Employee ID | Peran mobile | Role HAWK |
| --- | --- | --- | --- |
| Ayu Indra | EMP-0008 | Spa Therapist Ubud | therapist (ESS) |
| Ayu Astiti | EMP-0028 | Spa Reception Ubud | therapist (ESS) |
| Gede Ari | EMP-0002 | Spa Attendant (**skenario peran berlabel**, fixture = Therapist) | therapist (ESS) |
| Mila | EMP-0153 | Spa Supervisor Ubud | outlet-spv |
| Made Gunarsa | EMP-0142 | Manager HRD | hrd |
| Ayu | EMP-0143 | Admin HRD | hrd-ops |

## Presensi

Alur: pemberitahuan kamera & lokasi (sekali) → lokasi → kamera (liveness + 1:1) → hasil. Bukti hasil menampilkan jenis aksi, tanggal/jam WITA, outlet, shift, status dan ID presensi.

- Status: **Terverifikasi**, **Menunggu sinkronisasi**, **Perlu pemeriksaan**, **Ditolak** (hanya dari keputusan reviewer).
- Siklus: Belum masuk → Bekerja ↔ Istirahat → Selesai kerja.
- Satu ID sesi per alur: tombol ganda/ulang setelah putus menghasilkan satu kejadian dan satu audit.
- Waktu server, waktu ambil dan waktu HP dicatat terpisah. Offline: waktu HP belum dipercaya; setelah tersambung tetap perlu pemeriksaan dan waktu unggah tidak dianggap waktu kedatangan.
- Wajah tidak cocok, foto/layar, bukti sesi lama, jam HP berubah, di luar radius, lokasi lama, approximate, izin ditolak → Perlu pemeriksaan + alasan + pengajuan ke Supervisor. Tidak ada penolakan, absen, sanksi atau potongan otomatis.
- Jalur **Ajukan presensi dengan pemeriksaan** untuk GPS/kamera/wajah/aksesibilitas.
- Aturan berversi `PRS-RUL v1 (asumsi R&D)`: radius 150 m, umur lokasi ≤ 2 menit, akurasi ≤ 100 m. Nilai harus dikalibrasi di lokasi nyata.
- Mulai treatment, check-in tamu dan check-in kerja punya objek berbeda. Hadir tidak otomatis membuat booking atau treatment. Penyelesaian treatment bukan bukti bayar; POS ditutup oleh Reception (simulasi).
- Payroll tetap khusus Manager HRD. Menu Saya staf tidak menampilkan gaji/slip.

## Status jujur per fitur

| Fitur | Status |
| --- | --- |
| Lima menu, peran, tampilan | Visual HTML + simulasi data dummy |
| Presensi wajah/lokasi/jam | **Simulasi berlabel**. Tidak ada kamera, GPS, liveness atau face matching nyata |
| Catatan presensi bersama F2/Supervisor/HRD | Simulasi di penyimpanan browser (bukan layanan server) |
| Aplikasi Android/iPhone terpasang | Belum. Rekomendasi klien Flutter + layanan server HAWK |
| Verifikasi wajah 1:1 + liveness | Belum. Butuh SDK/penyedia teruji + tata kelola biometrik |
| Push, penyimpanan aman, sinkronisasi server | Belum |
| Uji perangkat nyata | Belum |

## Menjalankan

```
python3 -m http.server 8811      # dari root repo
open http://localhost:8811/hawk-live/hrd.html#hrd-mobile
node tests/hawk-live/hrd-mobile.e2e.js
```

Panel **Simulator R&D** di samping ponsel: ganti akun, kondisi wajah, lokasi, jaringan, jam HP, jam demo, dan reset data HAWK Mobile.

## Checkpoint berikutnya (M2)

Perlu keputusan sebelum build perangkat: daftar HP/OS tester, akun developer & signing, toolchain Flutter, kontrak layanan server (auth, presensi, chat/notifikasi), lokasi resmi + radius + toleransi, serta pemilihan SDK liveness/matching dan tata kelola biometrik.
