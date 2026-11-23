# NP-HR-F2-NV04-SEARCH-001 · Search di Presensi (F2-NV04)

**DATA DEMO / SIMULASI.** Perubahan hanya pada prototipe Hawk-Preview (`hawk-live/`). Tidak ada perubahan schema, API, business logic presensi, perhitungan, approval, role/permission, atau navigasi.

## Perilaku
- Urutan filter: Tanggal → Outlet → Shift → Search → Reset (tab Ringkasan: Outlet → Search → Reset).
- Placeholder `Cari nama / ID / Attendance ID`, ikon kaca pembesar di kiri, tinggi sama dengan dropdown Shift, lebar 340 px di desktop, tanpa tombol cari.
- Real-time dengan debounce 280 ms, case-insensitive, di-trim. Fokus dan kursor tetap di kolom Search; Enter tidak mengirim form.
- Mencocokkan nama, Employee ID, dan Attendance ID pada seluruh data dalam cakupan role (sebelum batas 80 baris tampil).
- Kartu statistik (Hadir, Terlambat, Cuti / sakit / libur, Belum Ada Status) dihitung dari Tanggal + Outlet + Shift saja, tidak berubah karena Search.
- Tidak ditemukan: "Data presensi tidak ditemukan." / "Coba gunakan nama atau ID lainnya."
- Reset mengosongkan Search dan filter lain ke default. Tautan lama `hrd-presence?q=…` tetap bekerja.

## File
- `hawk-live/hrd-f2.js`: `presence()` dan handler debounce Search.
- `hawk-live/style.css`: gaya `.hr-search` (tanpa token baru).
- `tests/hawk-live/hrd-presence-search.e2e.js`: uji T01–T15 (21 cek).

## Kesiapan backend Hawk-RnD (hawk-backend-erp)
| Kebutuhan | Kondisi | Catatan |
|---|---|---|
| Daftar presensi | `GET /data_attendance` (employee_controller.py) memfilter tanggal, lokasi, departemen, jabatan | Tidak ada parameter shift, search, atau paginasi; mengembalikan seluruh baris tanggal tsb |
| Nama & Employee ID | `employee_name`, `employee_code` ada di respons | Search bisa dilakukan di frontend atas seluruh respons tanpa mengubah API |
| Attendance ID | Hanya `schedule_attendance_id` (integer) | Format `ATT-YYYYMMDD-EMP-xxxx` milik prototipe; di RnD perlu sepakat ID mana yang dicari (TO VERIFY) |
| Search sisi server | Tidak ada | Opsional bila data besar: parameter `q` baru (butuh izin terpisah, perubahan API) |
