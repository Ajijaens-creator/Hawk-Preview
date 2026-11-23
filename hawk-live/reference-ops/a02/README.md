# HAWK Operational · 14 Dashboard Demo

**Versi 1.2 / Addendum A02 · 19 November 2026, WITA**

Prototipe frontend untuk melengkapi Operational Portal dengan 14 dashboard dari referensi Looker, data entry, verifikasi, insight simulasi, serta Hospitality Manager **Jro Okta**. Susunan laporan, kartu, grafik, dan tabel mengikuti pola baca tim. Shell HAWK dan workspace operasional sebelumnya dipertahankan.

## Buka dan coba

1. Unduh atau ekstrak paket.
2. Buka **HAWK-Operational-14-Dashboards-Demo.html** pada browser komputer. Tidak perlu instalasi, server, akun, atau password.
3. Halaman awal **Dashboard Kinerja**, dengan akun **Eni Restini**. Pilih laporan dari daftar 14 halaman.
4. Klik kartu, grafik, legenda atau detail tabel; coba tanggal, preset Oktober/Jan–Okt, dan outlet di header.
5. Gunakan menu profil untuk beralih ke **Jro Okta**, **Tika**, **Supervisor Ubud/Shanti/Triloka/Bisma**, atau tim lapangan.

Jika aplikasi chat menampilkan kode HTML, unduh dahulu lalu buka dengan browser. State demo disimpan pada browser yang sama jika penyimpanan lokal tersedia; tidak tersinkron antarperangkat.

**Preview Vercel yang ditunjuk Owner belum berubah.** File ini adalah koreksi lokal dan bahan integrasi untuk Claude. Semua angka dan transaksi demo sintetis. API ERP, login production, model AI, dan keamanan backend belum dihubungkan.

## Tiga alur percobaan

### Satu feedback menjadi dua laporan

Buka **Demo Experience Center → DX-OP08 · 14 dashboard → data → keputusan**. Panduan berpindah role dan workspace sesuai langkah.

- Reception membuka Customer Review → Data & verifikasi → Input data operasional.
- Gunakan Visit ID baru, isi kanal, rating dan referensi bukti, lalu kirim.
- Head Reception pada outlet yang sama memeriksa dan memverifikasi catatan.
- Jro Okta melihat Customer Review dan Customer Satisfaction pada outlet/tanggal yang sama. Kedua laporan memakai satu record feedback.
- Buka insight dan buat tindak lanjut dengan PIC. Catatan yang belum verified belum masuk hasil laporan.

### Standar dan konteks

Sebagai Eni/Tika, buka **Standar** suatu metrik. Pilih arah higher/lower/range/neutral, isi batas demo, minimal catatan, serta dasar SOP/target. Insight membaca versi standar pada outlet dan periode yang sama. Standar belum tersedia berarti **Standar belum ditetapkan**; data atau definisi belum cukup diberi alasan yang spesifik. Tidak ada benchmark industri yang diarang. Semua insight berlabel **simulasi, belum terhubung AI**.

### Batas peran

Manager/Assistant memfokuskan empat outlet. Jro Okta memakai model 14 dashboard yang sama; demo menugaskannya ke empat outlet, berfokus pada kualitas layanan. Supervisor tetap satu outlet, termasuk detail dan CSV. Staff hanya membuka sumber relevan dan tidak mengakses P&L. Pembuat tidak memverifikasi catatan sendiri; data kritis mengikuti review awal dan final assurance.

## Cakupan

| Bagian | Isi |
|---|---|
| Dashboard Kinerja | 14 halaman Revenue sampai Bisnis Proses |
| Sumber bersama | 13 kelompok; feedback dipakai Review dan Satisfaction |
| Data entry | 9 kelompok manual, draft/submitted/verified/rejected, koreksi dan referensi bukti |
| Sumber existing | Revenue, Finance, Capacity, Customer/Retention hanya dibaca; adapter POS/Finance/HRD/CRM belum terhubung |
| Insight | Per diagram, arah penilaian, standar demo berversi, hipotesis dan tindak lanjut |
| RACE | 23 Vegen; 4 siklus/77 pengukuran Beacon; 17 dimensi/209 butir RSF |
| Demo Center | 8 skenario, 6 peran, 39 langkah; Walkthrough Owner terpisah |
| Tahapan | Tetap 12 fase F-OP00–F-OP11 |

Histori sintetis Januari–Oktober tersedia untuk Revenue, Finance, Capacity, Waste, Maintenance dan Grooming. Kelompok lain memiliki contoh Oktober. Input bukti berupa teks/referensi; tidak ada upload ke server.

## Isi paket

| File / folder | Fungsi |
|---|---|
| HAWK-Operational-14-Dashboards-Demo.html | Demo mandiri |
| docs/CLAUDE-START-A02.md | Instruksi lanjutan untuk codebase Claude |
| docs/NP-OP01-ADDENDUM-A02-DASHBOARD-PARITY.md | Keputusan, tanggung jawab, standar dan acceptance |
| docs/DASHBOARD-PARITY-MATRIX.csv | Pemetaan Looker, view demo, sumber dan PIC |
| docs/SER-Operational-Source-Audit.md | Hasil audit empat sheet dan masalah formula |
| docs/SER-Operational-Source-Inventory.json | Label, formula teks dan binding sel; tanpa nominal finansial sumber |
| docs/looker-page-inventory.json | URL dan label 14 halaman yang diamati |
| docs/feature-manifest.json | Fase, cakupan frontend dan status backend terpisah |
| docs/reference-register.md | Bukti dan batas pemeriksaan |
| docs/QA-A02.md | Hasil dan batas validasi A02 |
| docs/POS-Existing-Parity-Checklist.md | Acuan perlindungan POS existing |
| docs/baseline-v1.1/ | Brief sebelumnya; perubahan terbaru mengikuti A02 |
| src/ dan build.py | Source modular dan perakit HTML |
| qa/dashboard-contract-test.cjs | Pengujian logika/render offline |
| qa/dashboard-contract-results.json | Hasil dan SHA-256 bundle yang diuji |

## Build untuk developer

Jalankan dari folder paket:

```bash
python3 build.py
node qa/dashboard-contract-test.cjs
```

Build memakai fasilitas bawaan Python/Node, tanpa instalasi paket. `analytics-data.js` berisi definisi, schema, fixture, agregasi dan guard demo. `analytics-interactions.js` berisi entry, review, drilldown, insight, standar dan tindak lanjut. `analytics.js` dan CSS membentuk tampilan. `ser-source-catalog.js` adalah katalog sumber, bukan engine formula resmi.

Adaptasikan komponen, route, state dan kontrak ke repo HAWK yang nyata. HTML adalah media demo; bukan instruksi menyalinnya utuh sebagai arsitektur production. Endpoint/tabel existing hanya boleh dinyatakan tersedia setelah diperiksa di repo.

## Validasi dan batas

Gate offline memeriksa 56 kombinasi tampilan (14 laporan × 2 periode × 2 tab), registry action/form, entry-review, agregasi bersama, scope, CSV, rekonsiliasi fixture dan katalog SER. Hasil final pada QA-A02 dan JSON pengujian.

**Visual browser A02 belum diperiksa.** Browser sesi audit menolak file lokal. Claude perlu memeriksa desktop/mobile pada environment dev yang tersedia. Render string dan CSS responsive bukan bukti pixel-perfect atau keamanan produksi.

Calculated field Looker, formula/normalisasi X-Score, konektor data, refund/void, ledger, server auth, concurrency dan AI live masih memerlukan integrasi/verifikasi. Nilai ambigu tetap pending. P&L demo direkonsiliasi dengan angka sintetis; definisi keuangan resmi mengikuti Finance.

Menu **POS & Reception** tetap menuju https://preview.jaens.id/rnd-demo, termasuk Dashboard POS dan Appointment Book. Demo tidak mengubah transaksi atau akun situs tersebut. Untuk mengulang latihan, gunakan **Panduan demo → Reset data demo** pada browser yang sama.
