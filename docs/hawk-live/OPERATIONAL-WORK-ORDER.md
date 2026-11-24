# Operational · Issue fasilitas → work order → Maintenance (A03 kontrak #13)

Frontend demo dengan data sintetis. Mengisi BUILD #12/#13 pada [peta A03](OPERATIONAL-A03-EXISTING-MAP.md) tanpa menambah modul baru: issue fasilitas yang sudah ada di Communication Hub / Room & Facility dipakai sebagai work order.

## Alur
1. **Lapor.** Attendant atau Head membuat issue fasilitas sekali: outlet, departemen, ruang dan temuan.
2. **Respons pertama.** Supervisor menekan "Buat tugas penanganan". Tugas tertaut dibuat, dan `respondedAt` dicatat pada issue.
3. **Penyelesaian.** Supervisor menekan "Catat penyelesaian", memilih **kategori maintenance sekali**, lalu menulis hasil pengecekan.
4. **Catatan Maintenance otomatis.** Satu catatan berstatus `submitted` dibuat dari issue yang sama dengan isi berikut:
   - `ticketRef` = ID issue · ruang
   - waktu lapor, respons dan selesai diambil dari issue/tugas, tidak diketik ulang
   - status `Done`
   - deskripsi = hasil penyelesaian
   - bukti = issue dan tugas

   Resolusi ulang tidak menggandakan catatan.
5. **Verifikasi.** Lead lain (Manager/Assistant) memverifikasi catatan tersebut. Pencatat tidak dapat memverifikasi catatannya sendiri.
6. **Dashboard.** Maintenance Performance (total, response time, completion rate) membaca catatan terverifikasi yang sama.

Status ruang **tidak** berubah otomatis. Readiness tetap diperiksa di Room & Facility. Drawer issue menampilkan catatan Maintenance yang tertaut beserta status verifikasinya.

## Demo Experience Center
- **DX-OP12 "Issue fasilitas → work order → Maintenance".** Alurnya Attendant → Supervisor → Manager, dalam 5 langkah: 4 langkah dibuktikan dari data dan 1 langkah review manual.
- **Total Demo Center** sekarang 12 skenario dan 60 langkah.

## Implementasi & uji
- **Modul.** `hawk-live/ops-workorders.js` membungkus aksi/form issue yang sudah ada (`issue-task`, `issue-resolve`, `issueResolve`, `issue-open`) dan memakai `OPX.analytics.addRecord` yang sama dengan form entri.
- **Uji.** `tests/hawk-live/ops-workorders.e2e.js` berisi 14 pemeriksaan. Jumlah skenario DX pada ops-a02, ops-w4 dan ops-cases sudah disesuaikan menjadi 12/60.

## Kebutuhan backend (belum dibangun)
- Entitas work order dengan event bertimestamp: lapor, respons, mulai, selesai, verifikasi. Entitas tertaut ke aset/ruang (`/api/groupasset/*`, `/spa-blocktime-room`) dan, bila ada, ke case.
- Penulisan catatan Maintenance dilakukan oleh backend saat work order selesai, dengan aturan dedup per `work_order_id`.
