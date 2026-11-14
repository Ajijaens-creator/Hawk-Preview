# HAWK HRD · F3 Planner & Workplace · Laporan

DATA DEMO / SIMULASI. Menu **Tugas** menjadi ruang kerja HRD Operations dan Human Growth. File: `hawk-live/hrd-f3-model.js` (global `HR3`, dirantai ke `HR.EXT`) dan `hawk-live/hrd-f3.js`.

## Rute → NV
| NV | Rute | Sidebar |
|---|---|---|
| F3-NV01 Workplace | `#hrd-tasks?ws=HRD/HG` | Tugas |
| F3-NV02 Board | `#hrd-board` | Tugas › Board |
| F3-NV03 Calendar | `#hrd-calendar` | Tugas › Calendar |
| F3-NV04 List | `#hrd-list?only=nopic/overdue/review/blocked` | Tugas › List |
| F3-NV05 Library | `#hrd-library`, `?id=TPL-ONB` | Tugas › Library |
| F3-NV06 My Tasks | `#hrd-mytasks` | Tugas › My Tasks |
| F3-NV07 My Day | `#hrd-myday` | Tugas › My Day |
| F3-NV08 Detail Kartu | `#hrd-task?id=TSK-xxxx&tab=preview/files/discussion/checklist/history` | dari semua tampilan |

## Perilaku kunci
- Satu objek kartu (Task ID) dibaca Workplace, Board, Calendar, List, My Tasks, My Day dan Detail. Perubahan langsung terlihat di semua tampilan.
- Board: drag-and-drop HTML5 dan menu "Pindahkan ke" memakai aksi dan validasi yang sama (Workplan ke atas butuh PIC dan tenggat; Selesai butuh checklist lengkap dan, bila wajib, keputusan reviewer). Setiap perpindahan tercatat: aktor, waktu WITA, asal, tujuan, "via drag/menu".
- Ganti PIC/reviewer, tenggat, jadwal sesi, diskusi, bukti, checklist dan blocker adalah event terpisah di Activity & History. Versi kartu mendeteksi konflik dua perubahan.
- Temuan → kartu: Workplace menampilkan temuan utility (Ubud 106%, Shanti 66%) dengan tombol "Tandai sebagai Issue/Ide". Penandaan ulang untuk sumber+temuan yang sama membuka kartu yang sudah ada.
- Library: template versi aktif (Onboarding administratif v2, Verifikasi kompetensi v1, Respons utility v1, SOP kebersihan v3). Terapkan → 1 kartu induk + subtugas HRD/HG/Supervisor dengan tenggat relatif; versi baru berlaku pada penerapan berikutnya.
- My Day: menambah/melepas fokus tidak mengubah tenggat, PIC atau status. Penugasan ulang melepas fokus PIC lama.
- Akses: Staf HRD hanya workplace HRD (plus kartu di mana ia PIC/reviewer/kontributor), HG Lead hanya HG, Supervisor Ubud kartu Ubud dan kartu atas namanya, kartu bersumber payroll hanya Manager HRD, Finance Manager ditolak.

## Uji
- `node tests/hawk-live/hrd-f3-model.test.js`: 30/30.
- `node tests/hawk-live/hrd-f3.e2e.js`: 40/40 (empat jalur review NB F3 termasuk drag-and-drop nyata, konflik, filter kosong, akses lintas workplace, mobile 390 px).
- Semua uji: `tests/hawk-live/run-all.sh`.

## Asumsi
- Integrasi Google Calendar/Meet untuk agenda: NEW INTEGRATION REQUIRED; preview memakai jadwal sesi pada kartu.
- Penyimpanan file bukti: NEW INTEGRATION REQUIRED; preview mencatat nama file saja.
- Notifikasi kartu: UI-ONLY SIMULATION.
