# Reference & Evidence Register

HAWK Operational Prototype · Revisi A02 · 19 November 2026 (WITA)  
Status bukti sumber, cakupan frontend demo, dan kesiapan backend dipisahkan. A02 melanjutkan 12 fase existing; tidak menambah fase ke-13.

Spesifikasi perubahan: [NP-OP01-ADDENDUM-A02-DASHBOARD-PARITY.md](NP-OP01-ADDENDUM-A02-DASHBOARD-PARITY.md). Cakupan pengujian revisi ini: [QA-A02.md](QA-A02.md). Hasil QA v1.0/v1.1 adalah bukti historis dan tidak otomatis dijalankan ulang untuk A02.

## Klasifikasi

- **Owner decision**: kebutuhan/keputusan eksplisit Owner dalam percakapan.
- **Reported code finding**: temuan audit Claude yang disampaikan Owner; belum diverifikasi ulang oleh pembuat prototype.
- **Conversation excerpt**: cuplikan pembacaan data yang tersedia dalam percakapan, bukan jaminan inventaris lengkap.
- **Directly inspected**: materi dibaca langsung dalam pekerjaan ini dengan hasil inspeksi yang dicatat.
- **Pending verification**: belum ada bukti yang cukup.
- **Demo**: data/flow simulasi, tidak membuktikan backend bekerja.

## Register sumber

| ID | Sumber | Evidence / batas |
|---|---|---|
| REF-001 | NP-OP00 Report 01, teks Owner | Reported code finding; PARTIAL; release/range audit November 2026, bukan runtime production |
| REF-002 | Ringkasan NP-OP00 Report 05 v1.1 pada laporan yang dibagikan Owner | 17 kapabilitas Supervisor (1 tersedia, 3 integrasi, 4 parsial, 9 baru); reported finding, bukan audit source ulang |
| REF-003 | NP-OP00 Report 10, teks Owner | D1–D6/K1–K14/P1–P7 dan missing evidence; sebagian keputusan kemudian diselesaikan Owner |
| REF-004 | Owner decisions dalam percakapan | D1–D6, OP-ADR-07–11, role demo, hybrid review, one outlet per Supervisor |
| REF-005 | https://preview.hawk.jaens.id/#/nv/47 | Directly inspected UI: NV-47 Finance Control Dashboard, label DEMO; brand dan developer contract terlihat. Tidak memverifikasi API/backend. |
| REF-006 | https://preview.hawk.jaens.id/hawk-live/portal#pos | Directly inspected UI: F4-07 sandbox booking/treatment/transaksi, sidebar Demo Experience Center, Operational & POS, Inventory. Tidak memeriksa network/backend. |
| REF-007 | https://preview.hawk.jaens.id/hawk-live/portal#hrd-race | Directly inspected UI: Manager HRD demo; Race Vegen 6 indikator, bobot 100%, kontrak v1, provisional score; X-Score resmi belum terkunci. Bukan audit formula backend. |
| REF-008 | https://aji-creator.jaens.id/performance | Pending verification. Referensi Daily/Weekly/R2Re/Reflection/STRACON belum diinspeksi langsung dalam pekerjaan ini. Tidak menjadi bukti seluruh flow sudah berfungsi. |
| REF-009 | https://preview.hawk.jaens.id/ | Portal preview keseluruhan; tidak boleh menyatakan semua portal sudah diaudit |
| REF-010 | URL production HAWK SPA (sengaja tidak dicantumkan di bundle preview) | Production context; tidak diakses untuk transaksi dalam paket |
| REF-011 | https://docs.google.com/spreadsheets/d/1TqR4c8TzVNawN2W7xtBvAoHgey4JDuV2/edit?gid=419957531 | Directly inspected pada 19 Nov 2026. File sumber asli `10. Oktober 2026.xlsx` dibaca read-only sebagai XLSX, bukan native Google Sheet. Empat tab, label, binding sel, formula dan cached results diinventarisasi tanpa edit/recalculate. 23 indikator Vegen / 7 domain; Beacon 19+19+19+20 pengukuran; RSF 17 dimensi / 209 butir. Inspeksi tidak berarti formula atau kontrak aktif telah disahkan. |
| REF-012 | https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414 | Directly inspected viewer UI pada 19 Nov 2026: report `Operational Report New`, 14 halaman; nama halaman, blok utama dan filter yang terlihat dicatat. Tidak mengakses editor calculated fields, konfigurasi data-source atau API backend. Jumlah 14 adalah halaman, bukan jumlah widget/backend baru. |
| REF-013 | Supervisor Dashboard.jpg, Therapist View.jpg, Therapist View2.jpg | Gambar Owner adalah referensi UI, bukan data live. Inspeksi menunjukkan dua file bernama Therapist View sebenarnya panel Customer App; jangan dipakai sebagai spesifikasi Therapist. |
| REF-014 | Screenshot portal 18 Nov 2026 23.02.30 / 23.02.39 dan sebelumnya | Bukti tampilan historis; tidak membuktikan integrasi backend |
| REF-015 | https://preview.hawk.jaens.id/#/nv/16 | Directly inspected UI Finance: P1 People, P2 Product, P3 Promotion, P4 Process, P5 Place, P6 Facility, P7 Profit sebagai hasil; referensi budgeting. `budget.getPerformanceCube` diberi label NEW INTEGRATION REQUIRED. |
| REF-016 | https://preview.hawk.jaens.id/hawk-live/portal#hrd-race-daily | Directly inspected UI: Task ID sama dengan My Day, selesai dan terverifikasi dibedakan, blocked/late/extra tasks terlihat. Tidak ada formulir disubmit. |

## Catatan observasi UI pekerjaan ini

Tanggal inspeksi 18 November 2026 (WITA). Browser cloud dibaca tanpa submit form. NV-47 menunjukkan body `#f7f7f5`, text `#17140f`, sidebar `#0b0b0b` sekitar 252 px, topbar `#1a1a1a` sekitar 60 px, white cards radius 14 px, gold `#c99a2e`, gradient `#e5c66a → #c99a2e → #a67c1f`, Inter/system sans 14 px. Detail ini menjadi acuan skin prototype; bukan janji pixel-identical terhadap semua ukuran layar.

Label dan keadaan yang terlihat hanya memberi status **UI_OBSERVED**. Tidak ada klaim live API, persistensi server, isolasi backend, kalkulasi akuntansi atau X-Score dari observasi layar tersebut. **Koreksi A02:** Looker kini telah diinspeksi melalui viewer pada 19 November; AJI Creator tetap belum diinspeksi. Bukti viewer berbeda dari validasi rumus atau konfigurasi koneksi.

## Temuan yang boleh dikutip dengan atribusi

1. Laporan Claude menyebut FastAPI/PostgreSQL, sekitar 245 router dan 2.020 endpoint, frontend React.
2. Laporan menyebut engine appointment, Gantt, payment/journal, HRD shift/attendance, GL/petty cash, PR/PO/bill dan stok tersedia di kode. ACTIVE pada audit berarti ditemukan implementasi dan bukti R&D terbatas, bukan pengujian transaksi production terbaru.
3. Laporan menyebut mock pada beberapa KPI SPA seperti gross margin/profit/BEP. Jangan menyatakan semua metric finance mock; general ledger dan data transaksi merupakan domain berbeda.
4. Laporan menyebut outlet isolation backend belum memadai dan hierarki reporting belum ada di model yang diaudit.
5. Di antara 17 kapabilitas Supervisor: tersedia 1, integrasi 3, parsial 4, baru 9. Ini bukan hitungan keseluruhan scope prototype.
6. RACE/SER framework belum ditemukan pada ERP dalam cakupan audit yang dilaporkan Claude. Pernyataan “workbook belum diterima” adalah keadaan historis NP-OP00. A02 sudah menambah inventaris XLSX dengan binding sel; ini tidak membuktikan framework SER telah tersedia di backend ERP.

## Koreksi penting terhadap percakapan sebelumnya

- Klaim penelusuran personal context atau semua fitur AJI Creator yang tidak mempunyai hasil retrieval tidak digunakan sebagai bukti teknis.
- Daftar kategori 7P yang pernah diusulkan asisten tidak dipakai sebagai bukti. Label P1–P6 dan P7 hasil kini dicocokkan dengan NV-16; master backend dan formula masih belum terverifikasi.
- Persetujuan arsitektur bukan persetujuan perubahan production.
- Role demo, angka dashboard dan workflow simulasi bukan akun/data nyata.
- Situs berbasis hash route dapat memuat tampilan berbeda tanpa URL server berbeda; audit harus menyebut route yang diperiksa.

## Ketelitian indikator RACE — koreksi A02

HRD preview menampilkan enam indikator demo. Baseline Operational sebelumnya memakai sepuluh contoh mapping; daftar contoh tersebut belum memenuhi workbook sumber. A02 mengganti referensi register dengan katalog sumber yang dibaca langsung:

| Tab sumber persis | Inventaris terverifikasi |
|---|---|
| `1.1. SER` | 12 ekspektasi; 14 kategori / 22 fitur |
| `1-2. Race Vegen` | 7 domain / 23 indikator bulanan |
| `3-5 Race Beacon UnitSmall Team` | Empat siklus, 19 / 19 / 19 / 20 baris pengukuran |
| `1-99a. Race Success Factors (RF` | 17 dimensi / 209 butir bank instrumen |

**77 adalah baris pengukuran berulang lintas siklus, bukan 77 KPI unik. RACE 1–4 bukan empat outlet.** RSF 209 butir adalah bank instrumen, bukan 209 KPI harian. Ringkasan Vegen memakai 21 butir; Beacon memakai enam aspek per siklus.

Nama sumber adalah **Race Vegen (Venture Genesis)**. Istilah “Wagon” dari percakapan dapat disimpan sebagai alias pencarian; jangan mengubah nama sumber atau menjadikan empat siklus sebagai outlet.

Workbook sendiri mengacu dashboard Looker di `'1.1. SER'!C17`; `'1.1. SER'!AO65` menghubungkan ekspektasi stakeholder dengan pelaporan Looker. Dengan demikian, dashboard Looker merupakan bagian dari kebutuhan awal yang sempat belum tercakup baseline prototype.

Katalog sumber yang lebih lengkap tidak mengesahkan angka:

- SER/Vegen berstatus `1. Inactived`; keempat blok Beacon berstatus `5. Active` dalam file historis.
- Goal/objective pada tabel utama, PIC individual, ID outlet/departemen dan rentang tanggal tiap siklus belum terstruktur lengkap.
- Beacon `BB345` mengandung `#REF!` pada cabang formula yang sedang tidak aktif.
- Vegen `BB55` merata-ratakan `BB56:BC59`, sedangkan domain memiliki dua indikator tambahan sampai baris 61.
- Arah scoring absensi, TripAdvisor dan penyelesaian komplain membutuhkan konsolidasi definisi.
- Race Goal, Key Metrics dan RSF mempunyai konstruksi berbeda. Formula akhir X-Score empat tingkat tidak ditemukan dalam workbook.

Rumus yang bermasalah tidak disalin diam-diam menjadi standar production. Data dashboard HTML adalah fixture sintetis, terpisah dari target/actual asli workbook. Detail tindakan koreksi dan batas validasi berada pada addendum A02.

## Hal yang harus dipastikan sebelum integrasi

Release/commit production; master HRD/location; otorisasi endpoint; Finance budget contracts; full SER formula register; taxonomy 7P; period/scoring rules; policy approval; inventory posting/idempotency; budget privacy; browser authentication boundary; dan hasil runtime test non-production.

Daftar ini melengkapi review per fase. Tidak diperlukan pengumpulan data pribadi atau rahasia untuk melengkapi blueprint.

## Lampiran gambar dalam paket

`reference/Supervisor-Dashboard.jpg` berasal dari Supervisor Dashboard.jpg milik Owner. `reference/Customer-App-Reference-01.jpg` dan `Customer-App-Reference-02.jpg` adalah salinan berlabel jelas dari file Therapist View.jpg / Therapist View2.jpg; isi yang terlihat adalah referensi Customer App. Ketiganya hanya acuan visual, bukan fixture transaksi.

## Tambahan referensi v1.1 — Demo Experience Center

| ID | Sumber | Evidence / batas |
|---|---|---|
| REF-017 | https://preview.hawk.jaens.id/#/dx | Directly inspected UI pada 18 November 2026: mode Scenario Test Lab / Simulator 5 Layar, pilihan role dan Desktop/iPad/Mobile, daftar tujuh skenario, panduan langkah, serta feed perubahan bersama. Mode simulator dibuka untuk melihat struktur; tidak ada skenario Finance yang dimulai. Observasi ini tidak membuktikan seluruh frame, workflow atau backend berfungsi. |
| REF-019 | Tangkapan Layar 2026-11-18 pukul 23.46.15.png, lampiran Owner | Screenshot menunjukkan kartu Demo Experience Center pada bagian atas sidebar Finance. Menjadi referensi penempatan entry point, label dan penekanan visual; bukan bukti transaksi atau API. |

Pada baseline v1.1, Demo Experience Center Operational mengadaptasi pola tersebut ke tujuh workflow dan lima panel peran. **Revisi A02 memperluasnya menjadi delapan skenario dan enam tampilan peran, termasuk Hospitality Manager Jro Okta.** Panel membaca fixture bersama dan membuka workspace terkait; bukan enam sesi remote independen atau bukti akun production.

## Referensi canonical POS — keputusan Owner v1.1

| ID | Sumber | Evidence / batas |
|---|---|---|
| REF-018 | https://preview.jaens.id/rnd-demo → https://preview.jaens.id/rnd-demo/login | Owner menetapkan sebagai POS existing yang harus dibuka melalui menu POS & Receptionist. Inspeksi UI hanya mencapai halaman login; tidak dilakukan autentikasi atau audit Dashboard POS/Appointment Book. Seluruh isi existing harus tetap sama. Claude melakukan parity review menggunakan source yang dimiliki. |

Route shell `https://preview.hawk.jaens.id/hawk-live/portal#pos` tetap menjadi referensi historis shell/adapters; tidak menggantikan canonical POS di atas. Pengujian workflow fixture v1.0 tidak boleh digunakan untuk mengklaim parity atau integrasi API pada URL canonical.

## Bukti tambahan A02 — kebutuhan asli dan koreksi cakupan

| ID | Sumber | Evidence / batas |
|---|---|---|
| REF-020 | https://hawk-jaens-preview-git-claude-proj-90a77f-jaens-enterprises-pro.vercel.app/hawk-live/operational | Directly inspected pada 19 Nov 2026: Command Center harian, RACE berisi sepuluh contoh mapping, X-Score menunggu kontrak, Reports berisi ringkasan/evidence/log. Preview yang diperiksa belum mewakili 14 dashboard Looker. Inspeksi ini read-only; paket A02 lokal tidak berarti deployment URL tersebut sudah diperbarui. |
| REF-021 | Empat belas screenshot dashboard yang dikirim Owner pada 19 Nov 2026 dan instruksi sesudahnya | Owner menetapkan semua dashboard dapat diklik, mempunyai data entry sesuai pemilik sumber, mempertahankan pola keputusan tim, mempunyai panel insight per diagram, serta menambah Hospitality Manager Jro Okta. Screenshot menjadi baseline blok/layout, bukan fixture angka finansial atau HR untuk disalin ke demo. |

### Empat belas halaman referensi

| No. | Halaman Looker | Model frontend A02 |
|---|---|---|
| 1 | Revenue Overview | `revenue` |
| 2 | Profit and Loss | `pnl` |
| 3 | Capacity & Capability; judul isi Capacity & Productivity | `capacity` |
| 4 | Waste and Accuracy | `waste` |
| 5 | Customer Review & Satisfaction | `reviews` |
| 6 | Customer Satisfaction & Complaints | `satisfaction` |
| 7 | Rebooking & Customer Retention | `retention` |
| 8 | Complain Handling Performance | `complaints` |
| 9 | Tripadvisor Performance | `tripadvisor` |
| 10 | Maintenance Performance | `maintenance` |
| 11 | Grading FO | `grading` |
| 12 | Team Competency & Readyness Bisma | `competency` |
| 13 | Tracking Grooming | `grooming` |
| 14 | Bisnis Proses | `process` |

Halaman sumber kompetensi secara khusus bernama Bisma. A02 menyediakan model yang dapat digunakan empat outlet dengan fixture sintetis; ini bukan klaim bahwa seluruh empat outlet telah memiliki source assessment production yang sama.

### Batas implementasi dan pengujian

- Empat belas dashboard dibangun sebagai frontend lokal dengan record sumber bersama, filter periode/outlet, detail sumber, data entry dan verifikasi demo. Finance/POS/HRD tetap pemilik data transaksi; tidak ada input ulang total finansial melalui form Operational.
- Insight diberi label **simulasi berbasis aturan**. Standar rendah/baik/tinggi mempunyai arah metrik dan versi demo; tidak diklaim berasal dari AI live atau standar industri yang telah disahkan.
- Kartu **Complaint rate** tetap dipertahankan, namun formula/satuannya belum terverifikasi dan nilainya ditahan. Nilai kosong dibedakan dari nol.
- Uji A02 mengikuti `QA-A02.md`. Hasil pada `QA-results.md`, `qa/integration-results.json` dan output v1.0/v1.1 lain adalah historis; jangan menyatakan semuanya telah dijalankan ulang.
- `feature-manifest.json` tetap mempunyai 67 item pada 12 fase. Ekstensi `dashboard_inventory` memetakan 14 halaman ke cakupan existing F-OP02, F-OP08 dan F-OP10; tidak menghitung ulang setiap kartu sebagai fitur backend baru.
- Audit produksi, API, keamanan server, formula resmi, migrasi data dan koneksi AI tetap belum lengkap. Tidak ada deploy, merge, perubahan database production atau autentikasi production yang dilakukan dalam paket A02 ini.
