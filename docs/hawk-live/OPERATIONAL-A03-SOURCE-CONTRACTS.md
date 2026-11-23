# Operational · D. Kontrak sumber dan minimum entry

Status: draft konsolidasi, 22 November 2026 WITA. Ini kontrak konseptual. Bentuk endpoint final mengikuti bukti repository, lihat [peta existing](OPERATIONAL-A03-EXISTING-MAP.md). Kolom "Endpoint bukti" hanya menyebut kode yang sudah ada; yang lain ditulis "BUILD".

## Aturan yang berlaku untuk semua baris

**Konteks dari sesi atau record.** Nilai berikut tidak diketik pengguna:
- outlet (`location`), actor dan role;
- waktu sistem (WITA) dan tanggal bisnis;
- shift, appointment/visit, ruang, item;
- versi template atau instrumen.

Pengguna memilih record yang ada, bukan mengetik ID bebas.

**Status kualitas** di setiap metrik:
- terverifikasi, sementara (provisional);
- belum dilaporkan (missing), tidak berlaku (N/A);
- konflik, ditolak;
- legacy aggregate, simulasi.

Nol hanya berarti nol bila periode sudah dilaporkan dengan hasil nol. Penyebut nol menghasilkan N/A, bukan 100% atau NaN.

**Agregasi:**
- Jumlah dan count boleh dijumlahkan bila grain tidak tumpang tindih.
- Persentase dihitung dari total pembilang ÷ total penyebut. Rata-rata berbobot dipakai sesuai unit.
- Ranking, snapshot terakhir dan saldo stok bukan SUM.

**Koreksi:** nilai sebelum dan sesudah, alasan, actor dan waktu disimpan. Bukti yang sudah dipakai evaluasi atau posting tidak dihapus.

**Retry:** setiap penulisan membawa ID kejadian asal sebagai kunci idempotency.

**Versi rumus:** `metric_id` + `formula_version` + tanggal efektif. Target dan bobot berasal dari kontrak yang disahkan. Yang belum disahkan tampil "belum ditetapkan".

## Kontrak per workflow / metrik

| # | Workflow / metrik | Pemilik sumber | Grain kejadian | ID bersama | Periode & waktu | Actor | Field manual (fakta baru saja) | Otomatis / ditautkan | Formula (draft, versi v0) | Verifier | Koreksi | Dedup / retry | Bukti | Endpoint bukti |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Revenue service/retail | POS (Finance untuk pengakuan) | Baris invoice | `invoice_id`, `invoice_detail_id`, `spa_appointment_id` | Tanggal transaksi WITA; harian → bulan | Reception (POS) | — | Nominal, kategori, outlet, terapis | Revenue net = Σ baris lunas − refund/void (basis disahkan Finance); avg bill = revenue ÷ invoice | Engine POS; pengecualian oleh Finance | Lewat refund/void POS | ID invoice | Invoice | `/spa-appointment/progress/invoice/*`, `/spa-home/dashboard/revenue-*` |
| 2 | Target & budget | Finance | Target per outlet/periode | `spa_target_id`, baris budget | Tahun → musiman → bulan → minggu | Finance | Usulan revisi dari Operational | Distribusi musiman | Capaian = actual ÷ target periode yang sama | Finance | Versi target baru | — | Dokumen persetujuan | `/spa-finance/parameter-target`, `/target-setting`, `/api/budgetmanager/*` |
| 3 | Profit & Loss | Finance GL | Jurnal / akun per lokasi | akun COA, `location_id` | Periode tutup buku | Finance | — | Seluruhnya | Laba = Σ pendapatan − Σ beban sesuai laporan resmi; bridge ke workbook lama | Finance close | Restatement berversi | Jurnal ID | Laporan P&L | `/api/profitandlost/by-location` |
| 4 | Room occupancy | Engine appointment | Interval treatment per ruang | `spa_room_id`, `spa_appointment_build_detail_id` | Menit; hari → periode | Sistem | Blocktime ruang bila belum tercatat | Menit terpakai, kapasitas | Jam ruang terpakai ÷ (hari × ruang × jam kerja × faktor) — faktor 0,75 di kode **perlu disahkan** | — | Koreksi status appointment | ID detail appointment | Log appointment | `/spa-home/dashboard/occupancy`, `/spa-work-hour`, `/spa-blocktime-room` |
| 5 | Room revenue (terpisah dari occupancy) | POS | Baris invoice dengan kategori ruang | `invoice_detail_id`, `spa_roomtype` | Harian | Sistem | — | Kategori ruang | Σ revenue per kategori ruang; **bukan** occupancy | — | Lewat POS | ID invoice | Invoice | Rincian invoice (peta A #2) |
| 6 | Therapist utilization | Engine appointment + HRD | Interval treatment per terapis | `employee_id`, detail appointment | Menit; shift → periode | Sistem | Konfirmasi tahap layanan yang belum tercatat | Menit, terapis aktif, target jam | Menit treatment (status selesai) ÷ (terapis aktif × target jam) | Head Therapist untuk pengecualian | Koreksi status | ID detail | Log | `/spa-home/dashboard/therapist-util`, `/spa-target-hour` |
| 7 | Treatment per shift | POS + HRD | Treatment selesai per terapis per shift | `employee_id`, `shift_schedule_detail_id` | Shift | Sistem | — | Count | Treatment selesai ÷ shift hadir. **Tanpa** estimasi 60 menit | — | — | ID detail | — | Appointment + `/api/employee/data_attendance` |
| 8 | Absensi | HRD | Hari-orang terjadwal | `employee_id`, jadwal | Tanggal bisnis | Pegawai, atasan | Alasan ketidakhadiran dan koreksi beralasan | Jadwal, presensi | Hari tidak hadir (sakit + ijin di luar cuti) ÷ hari-orang terjadwal; batas sesuai kontrak (sheet: 3%) | Atasan / HRD | Koreksi presensi berversi | ID jadwal | Surat/keterangan | `/api/employee/data_schedule`, `/save_attendance` |
| 9 | Feedback kunjungan | Shared feedback (`hom_spa_feedback`) | Satu respons per appointment+customer | `spa_feedback_id`, `spa_appointment_id` | Waktu respons | Tamu (QR, EXTEND) atau staf | Skor, komentar, permintaan kontak | Outlet, treatment, terapis, ruang | Kepuasan = respons skor ≥ ambang ÷ respons; coverage = respons ÷ kunjungan eligible; mean bintang terpisah | — | Respons terbaru menggantikan (sudah di kode: soft delete sibling) | Unique appointment+customer | Respons | `/spa-feedback/{spa_appointment_id}` |
| 10 | Review online & Tripadvisor | Reputation snapshot (BUILD) | Snapshot per listing per tanggal | `listing_id`, `snapshot_id` | Tanggal snapshot | PIC reputasi | Rank, rating, jumlah review, URL bukti (sampai konektor ada) | Outlet | Rating terakhir per outlet; rata-rata bulanan dari snapshot sebanding | Hospitality | Snapshot baru, bukan edit | listing + tanggal | Tangkapan/URL | BUILD |
| 11 | Returning share, rebooking, retention | POS + CRM | Kunjungan per customer | `customer_id`, `spa_appointment_id` | Tanggal kunjungan; window evaluasi | Sistem | — | Kunjungan pertama, berikutnya | Returning share = tamu kembali ÷ tamu unik; rebooking = kunjungan dengan booking berikutnya dalam window ÷ kunjungan; cohort terpisah | — | Merge customer ganda | `customer_id` | — | `/spa-customer/customer-summary`, `/{id}/treatment-history` |
| 12 | Case Hospitality | Case (BUILD) | Satu case | `case_id` → `spa_feedback_id`/appointment | Event bertimestamp | Jro, PIC, Supervisor | Klasifikasi 7P (daftar sumber Hospitality), dampak, tindakan, bukti, keputusan | Outlet, tamu, kunjungan, waktu event | SLA respons = respons pertama − diterima; SLA selesai = selesai − diterima; backlog/aging untuk yang terbuka | Supervisor / Jro | Reopen pada case yang sama | `case_id` | Catatan tindakan | BUILD (`/spa-reason` untuk master alasan) |
| 13 | Maintenance work order | Work order (BUILD), aset existing | Satu work order | `work_order_id` → aset/ruang, `case_id` opsional | Event: lapor, respons, mulai, selesai, verifikasi | Pelapor, teknisi/vendor, Supervisor | Kerusakan, kategori, urgensi, tindakan, hasil, bukti | Ruang/aset, outlet, waktu | Respons = respons − lapor; downtime sesudah definisi disahkan | Supervisor | Event baru | ID work order | Foto/nota | Aset `/api/assetdepre/update_asset_maintenance`, `/spa-blocktime-room` |
| 14 | Readiness & cleaning | Readiness (BUILD) | Event per ruang | `spa_room_id`, `readiness_event_id` | Mulai/selesai | Attendant, Head, Supervisor | Hasil, masalah | Ruang, treatment sebelum/sesudah | Durasi cleaning; % ruang siap pada jam buka | Head → Supervisor (hybrid) | Event baru | ID event | Opsional | BUILD + `/spa-blocktime-room` |
| 15 | Penerimaan barang | Inventory | Baris penerimaan | `received_id`, PO/transfer | Waktu terima | Attendant → Supervisor | Qty diterima/ditolak/rusak, batch/expiry, bukti selisih | Item, satuan, qty kirim | Selisih = kirim − terima | Supervisor; posting oleh Inventory | Retur/refund | `received_id` | Foto/nota | `/api/received/add`, `/approve/{id}` |
| 16 | Stock opname & akurasi | Inventory | Baris count per item per sesi | `invcount_id`, item | Cutoff sesi | Counter, verifier | Qty fisik, recount, alasan | Saldo sistem snapshot | Akurasi item = item cocok ÷ item dihitung; akurasi nilai = 1 − Σ\|selisih Rp\| ÷ Σ nilai sistem (**pilih satu, keputusan Owner**) | Supervisor/Inventory | Lewat adjustment berapprove | ID count | Sheet hitung | `/api/invcount/*`, `/api/invadjustment/*` |
| 17 | Pemakaian BHP & waste | Inventory + Finance | Baris consumption / bahan per invoice | `inventory_consumption_id`, `build_service_detail_id` | Tanggal | Pelaksana, Attendant, Head | Qty waste/deviasi, alasan, bukti | Item, satuan, nilai valuasi | % waste = nilai waste ÷ revenue yang sesuai (BHP ÷ service, retail ÷ retail); batas sesuai kontrak (sheet: 1%) | Supervisor | Lewat approve/adjustment | ID baris | Foto | `/api/inventory-consumption/*`, `/progress/invoice/{id}/ingredients` |
| 18 | Checklist opening/closing/5S/grooming | Checklist (BUILD) | Hasil item per template per shift | `checklist_run_id`, template versi | Shift | Staf, Head, Supervisor | Hasil per item (lulus/gagal/N/A), catatan, bukti bila diwajibkan | Ekspektasi dari roster | Coverage = run selesai ÷ run terjadwal; pass rate = item lulus ÷ item berlaku | Head → Supervisor | Run koreksi | ID run | Foto opsional | BUILD |
| 19 | Kompetensi | HRD assessment (BUILD) | Item per pegawai per instrumen | `employee_id`, `instrument_version` | Tanggal assessment | Assessor | Hasil item yang berlaku | Peran, skill matrix | Skor = item tercapai ÷ item berlaku (N/A tidak masuk penyebut) | HRD | Assessment ulang | ID assessment | Lembar penilaian | `/spa-employee-treatment/matrix`, `/spa-grade` |
| 20 | Program Grading FO | Program (evaluasi `/api/project`) | Tahap program | `program_id`, `stage_id` | Tanggal status | PIC program | Status tahap, bukti | Bobot dari template | Progress = Σ bobot × nilai status ÷ Σ bobot; nilai "proses" (½?) **keputusan Owner**. Terpisah dari kompetensi pegawai. | Hospitality Manager | Versi template | ID tahap | Dokumen | `/api/project/*` (perlu evaluasi) |
| 21 | Dokumen SOP | Register SOP (BUILD) | Versi dokumen | `document_id`, `version` | Tanggal approval | Pemilik proses, approver | Isi/perubahan | Departemen | % approved = dokumen approved ÷ dokumen aktif. **Bukan** kepatuhan eksekusi. | Manager | Versi baru | ID versi | Dokumen | `/api/documenttype` (master) |
| 22 | Kontrak KPI & RACE | STRACON (BUILD) | Indikator per scope per periode | `contract_id`, `version_id`, `action_id` | Periode kontrak | Eni, Tika, Supervisor, Head | Prioritas, target yang diputuskan, hambatan, komitmen, keputusan review | Actual dan bukti dari baris 1–21 | Achievement, normalized score dan weighted score terpisah; roll-up per kontrak; missing ≠ 0 | Race Leader / Manager / Owner | Versi + effective date; periode tutup tidak berubah | `action_id` | Bukti dari sumber | BUILD |

## Yang belum bisa ditetapkan dari dokumen ini

- Bentuk payload dan response final setiap endpoint BUILD.
- Interval polling. Polling terukur tetap arah awal (D6), dan dashboard menampilkan waktu data terakhir.
- Perilaku offline dan konflik sinkronisasi.
