# HAWK Operational · UAT frontend per role (prototype v1.1)

Tujuan: Owner/tim mencoba portal Operational dengan akun demo, tanpa login production. Semua data **DEMO / SIMULASI**, tersimpan di browser. Hasil UAT ini **bukan** uji backend atau izin release.

Buka `/hawk-live/operational`, ganti akun lewat chip nama di bar konteks (atau Demo Center → Pandu Saya). Reset data demo: tombol **Reset Demo Data** di kaki sidebar (dengan konfirmasi).

| # | Role (akun demo) | Langkah UAT | Hasil yang diharapkan | Otomatis |
|---|---|---|---|---|
| 1 | Operational Manager · Eni Restini | Command Center, ganti outlet (Semua → Triloka), buka Budget 7P, Reports → Ekspor | Angka mengikuti outlet; People hanya %; ekspor JSON tanpa payroll | w1, w3 |
| 2 | Assistant Operational Manager · Tika | Sama seperti Manager, lintas outlet | Menu sama; ekspor diizinkan | w4 |
| 3 | Supervisor · Mila (Ubud) / Tina (Shanti) / Dewik (Triloka) / Wahyudi (Bisma) | Daily → sahkan opening setelah review Head; verifikasi tugas kritis; verifikasi receiving; release maintenance | Outlet terkunci; sign-off ditolak sebelum review Head; stok tidak naik saat verified | w2, w4 |
| 4 | Head departemen (Attendant/Reception/Therapist) | Review checklist departemen; review hasil tugas | Head tidak bisa sign-off outlet; tugas kritis lanjut ke Supervisor | w2 |
| 5 | Receptionist | POS & Receptionist (tab baru ke POS existing), Daily, Room | Tidak ada menu Budget/Settings/Inventory | w4 |
| 6 | Therapist | Therapist Workspace → Focus Mode → Finish treatment → konfirmasi | Booking Completed, ruang Cleaning, satu turnover task | w2 |
| 7 | Attendant | Kerjakan turnover → ruang Ready dengan pemeriksaan; catat penerimaan fisik | Ready butuh checklist + catatan; maintenance tidak bisa dilepas | w2 |
| 8 | Security | Daily, Team & Tasks | Tidak ada Room/Inventory/Budget | w4 |
| 9 | Owner | Demo Center → Owner walkthrough (9 langkah); 7 skenario (33 langkah) di Scenario Test Lab; Simulator 5 Role | Klik Next saja tidak meluluskan langkah mutasi; reload mempertahankan progres; reset progres tidak menghapus pekerjaan | w4 |

Catatan terbuka untuk Owner:
- **Receiving**: prototype v1.1 membatasi pencatatan fisik ke Attendant/Head Attendant (+ Supervisor ke atas). Aturan 60-NV (2026-11-08) membolehkan semua user outlet. Pilih salah satu sebelum integrasi.
- **Parity POS** POS-P01–P16: BLOCKED sampai checklist parity dan akses isi POS existing tersedia.
