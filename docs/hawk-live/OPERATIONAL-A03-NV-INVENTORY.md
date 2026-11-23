# Operational · C. Inventaris NV (layar, tab, drawer, modal)

Status: draft konsolidasi, 22 November 2026 WITA. Satu baris per layar, tab, drawer atau modal yang diperlukan.

## Aturan penulisan

**Kolom ID:**
- **Route existing** (`#op-…`) = sudah ada di preview hawk-live sebagai UI demo.
- **U-xx** = usulan sementara. Nomor NV final mengikuti register Owner dan belum dibuat di sini.

**Kolom Status:**
- **Ada (demo)** = layar ada dengan data fixture.
- **Ubah** = layar ada, tetapi perlu diperluas atau dikoreksi.
- **Usulan** = belum ada.

**Scope:**
- Supervisor selalu tepat satu outlet.
- Manager (Eni), Assistant (Tika) dan Hospitality (Jro) melihat outlet sesuai penugasan.

Keempat belas laporan adalah **pilihan di dalam satu halaman** Dashboard Kinerja, bukan 14 route. Tujuh kelompok strategi adalah **opsi tampilan tersimpan**, bukan tujuh layar final.

## Halaman utama

| ID | Nama | Status | Pengguna | Scope outlet | Keputusan yang didukung | Aksi | State | Sumber | Drilldown | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|
| `#op-dashboard` | Command Center | Ubah | Eni, Tika, Jro, Supervisor | Penugasan / 1 outlet | Apa yang perlu ditangani hari ini | Buka exception, buat tindak lanjut | normal, kosong, data belum masuk | Case, tugas, readiness, stok, appointment | Ke record asal | Jumlah issue sama dengan Communication Hub (sekarang 4 vs 0) |
| `#op-analytics` | Dashboard Library → Dashboard Kinerja | Ubah | Semua manajemen; staf hanya entri miliknya | Sama dengan header | Membaca 14 laporan, membandingkan periode | Pilih laporan, filter, drilldown, insight, ekspor | live, legacy aggregate, simulasi, provisional, N/A, missing | Adapter per laporan (peta A #2–#18) | Kartu → rincian → record → bukti | Filter dan izin bertahan di chart, detail, ekspor dan AI |
| `POS ↗` / `#op-pos` | POS & Receptionist (gateway) | Ada (demo) | Reception, Supervisor | 1 outlet | Melayani tamu | Buka POS existing | — | Engine appointment (peta A #1) | — | Tidak ada engine booking kedua. Paritas isi POS dicek setelah login Owner. |
| `#op-daily` | Daily Operations | Ubah | Staf, Head, Supervisor | 1 outlet | Outlet siap buka, tutup dan patuh 5S | Isi checklist, review Head, sign-off Supervisor | terjadwal, sebagian, lulus, gagal, N/A, terlambat | Template checklist berversi (BUILD) | Item → bukti | Coverage berbeda dari pass rate. Satu centang tidak berarti semua lulus. |
| `#op-tasks` | Team & Tasks | Ubah | Head, Supervisor, staf | 1 outlet | Siapa mengerjakan apa | Buat, tugaskan, kirim bukti, verifikasi | draft, diajukan, perlu perbaikan, terverifikasi, batal | `task_action` (evaluasi) | Tugas → bukti → RACE | Pelaksana tidak memverifikasi tugasnya sendiri |
| `#op-therapist` | Therapist Workspace | Ubah | Terapis, Head Therapist | Diri sendiri / 1 outlet | Jadwal dan hasil kerja hari ini | Lihat jadwal, konfirmasi tahap layanan | — | Appointment, jadwal, skill matrix | Ke appointment | Tidak menampilkan nominal komisi orang lain |
| `#op-rooms` | Room & Facility | Ubah | Attendant, Head, Supervisor; Jro hanya lihat | 1 outlet | Ruang siap atau tidak, dan hambatannya | Mulai/selesai cleaning, laporkan kerusakan | Ready, Occupied, Cleaning, Maintenance, Closed | Readiness (BUILD), blocktime, work order | Ruang → event → work order | Readiness tidak mengubah availability tanpa engine appointment |
| `#op-inventory` | Inventory Coordination | Ubah | Attendant, Supervisor | 1 outlet | Barang masuk sudah dicek | Terima fisik, verifikasi | dikirim, diterima, selisih, terverifikasi, diposting | `/api/received` | Ke PO/transfer | Verifikasi ≠ posting stok |
| `#op-warehouse` | Gudang & Stok BHP | Ubah | Semua staf outlet; order disetujui Supervisor | 1 outlet | Apa yang harus dipesan | Order, setujui/tolak | normal, ≤ minimum, dalam pesanan | `/api/inventory-summary-stock`, `/api/request-inventory` | Item → kartu stok | Stok tidak berubah saat order |
| `#op-communication` | Communication Hub | Ubah | Semua | Penugasan | Koordinasi dan eskalasi | Percakapan tertaut, buat action | terbuka, ditugaskan, selesai | Case, tugas (BUILD) | Ke record tertaut | Satu case, satu penghitung |
| `U-01` (`#op-cases`) | Hospitality Case Workbench | Ada (demo, PR case workbench) | Jro Okta, PIC, Supervisor | Penugasan Jro / 1 outlet | Tamu mana yang harus dipulihkan sekarang | Triage, tetapkan PIC, catat tindakan, verifikasi, reopen | baru, triase, ditangani, menunggu tamu, selesai, diverifikasi, reopen | Case (BUILD) + `spa_feedback` | Case → feedback → appointment | SLA respons dan SLA selesai terpisah. Kasus terbuka tampil sebagai aging, bukan durasi nol. |
| `#op-race` | Ambidex & RACE | Ubah | Eni (Race Leader), Tika, Supervisor, Head, anggota | Sesuai kontrak | Kontrak dan ritme evaluasi | Lihat tab di bawah | — | Kontrak KPI (BUILD) | Skor → komponen → bukti | Tidak ada katalog KPI kedua |
| `#op-budget` | Budget 7P | Ubah | Eni, Tika, Supervisor (terbatas) | Penugasan | Ruang belanja dan pacing | Lihat, usulkan revisi | approved, commitment, actual, forecast | `/api/budgetmanager`, target-setting | Ke transaksi Finance | People hanya % di bawah top management |
| `#op-reports` | Reports & Analytics | Ubah (gabung/evaluasi) | Manajemen | Penugasan | Laporan periodik | Ekspor | — | Read model yang sama | — | Tidak menjadi sumber angka kedua di luar Dashboard Library |
| `#op-settings` | Team & Access | Ubah | Eni, Tika | Penugasan | Delegasi tim dalam batas HRD | Atur Head reviewer, delegasi berversi | aktif, berakhir | `/spa-role-fitur`, `/spa-employee-access` | — | Tidak bisa membuka payroll lewat centang menu lokal |
| `#ops-dx` | Demo Experience Center | Ubah | Semua (simulasi) | Simulasi | Memahami alur | Jalankan skenario | — | Fixture | — | Empat perjalanan A03 (dokumen NB bagian F) |
| `#op-roadmap`, `#op-validation` | Developer handoff | Ada (demo) | Developer | — | — | — | — | — | — | Tetap tersembunyi dari peran operasional |

## Tab di dalam halaman

| ID | Induk | Nama tab | Status | Isi dan aksi | Acceptance |
|---|---|---|---|---|---|
| T-AN-1 | Dashboard Kinerja | Dashboard (pemilih 14 laporan) | Ada (demo) | Kartu, diagram, tabel per laporan | Satuan, penyebut dan versi rumus terlihat |
| T-AN-2 | Dashboard Kinerja | Data & verifikasi | Ada (demo) | Antrean catatan sumber | Hanya shortcut ke workflow asal; form total tidak ada |
| T-AN-3 | Dashboard Kinerja | Tampilan strategis tersimpan (opsi) | Usulan | Executive Brief, X-score tim, Capacity & Staffing, Guest Priority, Facility/BHP risk, Financial Health/HPP, Skenario | Memakai komponen dan sumber yang sama. Actual, estimasi dan skenario dibedakan. |
| T-RC-1 | Ambidex & RACE | Ringkasan Ambidex | Ada (demo) | Gap, prioritas, pemilik | — |
| T-RC-2 | Ambidex & RACE | STRACON & kontrak KPI | Usulan | Kontrak outlet/departemen/tim/individu, versi, effective date | Revisi tidak mengubah periode yang sudah ditutup |
| T-RC-3 | Ambidex & RACE | Daily RACE | Ubah | Komitmen hari ini, blocker, bukti tertarik dari pekerjaan | Aktual tidak diketik ulang |
| T-RC-4 | Ambidex & RACE | Weekly RACE | Usulan | Fokus dan pace minggu sesuai kalender outlet | Pace tidak memakai pembagian rata 7 hari tanpa kontrak |
| T-RC-5 | Ambidex & RACE | R2RE | Usulan | Review KPI, penyebab, recovery, PIC, keputusan | Usulan koreksi fakta tercatat dengan alasan |
| T-RC-6 | Ambidex & RACE | Monthly Reflection | Usulan | Konsolidasi, pelajaran, persiapan STRACON berikutnya, approval | Bobot dinormalisasi 100%, bukan dijumlah |
| T-RC-7 | Ambidex & RACE | X-score & keterlacakan | Usulan | Operational → outlet → departemen/tim → individu → indikator → bukti | Missing ≠ 0; N/A tidak masuk penyebut; status provisional |
| T-RM-1 | Room & Facility | Work order maintenance | Ubah | Lapor, respons, mulai, selesai, verifikasi, biaya tertaut | Respons dan downtime dihitung dari transisi |
| T-WH-1 | Gudang & Stok BHP | Stock opname | Usulan (tautan ke Inventory) | Sesi hitung dengan cutoff, recount, alasan | Penyesuaian lewat `/api/invadjustment` |
| T-WH-2 | Gudang & Stok BHP | Waste & deviasi pemakaian | Ubah | Item dari master, qty, alasan, bukti | Nilai dari valuasi, tidak diketik |

## Drawer dan modal

| ID | Induk | Nama | Status | Fungsi | Acceptance |
|---|---|---|---|---|---|
| M-01 | Dashboard Kinerja | Sumber data | Ada (demo) | Pemilik, periode, freshness, coverage, versi rumus | Menampilkan watermark data terakhir |
| M-02 | Dashboard Kinerja | Detail catatan sumber | Ada (demo) | Record, pencatat, verifier, bukti | ID record asal, bukan ID demo |
| M-03 | Dashboard Kinerja | Input / perbaiki sumber (shortcut) | Ubah | Membuka form workflow asal dengan konteks terisi | Tidak meminta harga satuan, qty sistem, ID karyawan atau kunjungan diketik bebas |
| M-04 | Dashboard Kinerja | Verifikasi sumber | Ada (demo) | Terima/kembalikan dengan alasan | Pengirim tidak memverifikasi catatannya sendiri |
| M-05 | Dashboard Kinerja | Insight | Ada (demo) | Fakta, baseline, coverage, hipotesis, tindakan | "Standar belum ditetapkan" bila belum disahkan |
| M-06 | Dashboard Kinerja | Standar indikator | Ada (demo) | Arah, batas, sampel minimum | Standar resmi berasal dari kontrak berversi, bukan setelan jendela |
| M-07 | Dashboard Kinerja | Satu sumber entri | Ubah (dikoreksi di build ini) | Peta sumber dengan tingkat bukti K/P/D/X | Tidak mengklaim integrasi live |
| M-08 | Dashboard Kinerja | Tindak lanjut dari dashboard | Ada (demo) | Buat action dengan PIC dan tenggat | Action ID dipakai RACE dan Communication Hub |
| M-09 | Hospitality Case | Drawer case | Usulan | Timeline event, 7P, dampak, PIC, SLA | Reopen tidak membuat case baru |
| M-10 | Room & Facility | Drawer ruang | Ubah | Status fisik, bukti, kondisi | Hospitality hanya baca |
| M-11 | Inventory Coordination | Penerimaan | Ada (demo) | Qty kirim vs terima, kondisi | Verifikasi Supervisor sebelum posting Inventory |
| M-12 | Gudang & Stok BHP | Order barang | Ada (demo) | Order Sederhana / MRF | Order staf menunggu Supervisor |
| M-13 | Team & Tasks | Kirim hasil & bukti / Kembalikan untuk perbaikan | Ada (demo) | Bukti tugas dan review | Alasan penolakan terbaca pelaksana |
| M-14 | Ambidex & RACE | Kontrak indikator | Ada (demo) | Definisi, target, bobot, sumber | Bobot yang belum disahkan tampil "belum ditetapkan" |
| M-15 | Daily Operations | Serah terima shift / Sahkan EOD | Ada (demo) | Handover dan EOD | Terhubung ke tugas dan case yang sama |
| M-16 | POS gateway | Izin khusus diperlukan | Ada (demo) | Refund atau price override | Tetap lewat engine POS/Finance |

## Hitungan

| Jenis | Ada (demo) / Ubah | Usulan | Total |
|---|---|---|---|
| Halaman utama (route) | 17 (termasuk 2 halaman developer) | 1 (Hospitality Case Workbench) | 18 |
| Tab | 6 | 7 | 13 |
| Drawer / modal yang relevan keputusan | 15 | 1 | 16 |

Modal teknis seperti pilih akun demo, reset demo dan panduan tidak dihitung. Laporan di dalam Dashboard Kinerja tetap 14 pilihan internal, bukan route tersendiri.
