# Claude · Lanjutkan Operational Frontend dengan Addendum A02

**19 November 2026 · Mandat lanjutan frontend yang sudah diotorisasi Owner**

## Hasil yang diminta

Lengkapi Operational Portal existing dengan 14 dashboard dari Looker/screenshot Owner, interaksi sampai sumber data, entry, review, insight per diagram, serta **Hospitality Manager — Jro Okta**. Pertahankan pola baca tim dan shell HAWK. Adaptasikan source modular paket ke struktur repo yang sedang dikerjakan.

Manager, Assistant, Supervisor dan Hospitality Manager memakai model laporan yang sama; data/tindakan dibatasi peran. Supervisor tepat satu outlet. Contoh assignment Jro ke empat outlet tidak menetapkan reporting line baru atau hak sensitif tambahan.

## Baca terlebih dahulu

1. README dan `NP-OP01-ADDENDUM-A02-DASHBOARD-PARITY.md`.
2. `DASHBOARD-PARITY-MATRIX.csv`, `looker-page-inventory.json`, screenshot Owner.
3. `SER-Operational-Source-Audit.md` dan `SER-Operational-Source-Inventory.json`.
4. Prototype HTML, source modular, feature manifest dan `QA-A02.md`.
5. NP-OP01 / NP-FE-OP01 / A01 sebelumnya untuk aturan yang tidak diubah A02.

Bagian baseline yang menyebut workbook belum diterima, 10 indikator contoh, 3 Beacon, 7 skenario atau 5 peran digantikan A02. Inventaris sumber tidak berarti kontrak KPI resmi telah disahkan.

## Referensi

- Preview: https://hawk-jaens-preview-git-claude-proj-90a77f-jaens-enterprises-pro.vercel.app/hawk-live/operational
- Looker: https://datastudio.google.com/reporting/82810819-9efc-4576-bcc5-91be28c8e414
- Workbook: https://docs.google.com/spreadsheets/d/1TqR4c8TzVNawN2W7xtBvAoHgey4JDuV2/edit?gid=419957531#gid=419957531
- Shell: https://preview.hawk.jaens.id/#/nv/47
- POS: https://preview.jaens.id/rnd-demo
- HRD RACE untuk fase perbandingan workflow: https://preview.hawk.jaens.id/hawk-live/portal#hrd-race
- AJI Creator Performance untuk fase perbandingan: https://aji-creator.jaens.id/performance

HRD/AJI Creator tidak boleh dinyatakan identik atau selesai diaudit hanya karena tautannya ada. Gunakan akses yang memang diotorisasi Owner.

## Urutan kerja

### 1. Cocokkan repo

Identifikasi branch, route, shell, komponen POS, adapter, role dan state yang benar-benar dipakai preview. Isi matriks halaman/widget: MATCH / PARTIAL / MISSING / BLOCKED, path komponen dan alasannya. Nama menu saja belum membuktikan dashboard lengkap.

### 2. Integrasikan laporan

Tambahkan Dashboard Kinerja dengan urutan 14 laporan. Pertahankan Command Center, Demo Center, POS, RACE, Budget, Communication Hub dan Team & Access. Gunakan komponen bersama untuk filter, kartu, diagram, tabel, sumber dan entry.

Pertahankan alias Capacity & Capability/Productivity serta Team Competency & Readyness Bisma. Template kompetensi dapat dipakai outlet lain tanpa menyalin data Bisma sebagai data outlet tersebut.

### 3. Gunakan satu record sumber

Revenue, Finance, Capacity dan Customer/Retention membaca pemilik existing. Jangan membuat form total revenue/profit/guest untuk diketik ulang. Input manual mencakup waste/opname fisik, feedback, case complaint, snapshot Tripadvisor, maintenance, grading, competency, grooming dan dokumen proses.

Feedback mengisi Review dan Satisfaction dari ID sama. Kasus komplain menautkan feedback bila ada, tanpa membuat review kedua. Simpan bukti, timestamp, pembuat, reviewer, outlet dan revisi. Larang self-approval; gunakan hybrid Head review/assurance. Inventory dan Finance tetap pemilik posting resmi.

### 4. Role dan insight

Tambahkan Jro Okta. Batasi data, detail, ekspor, tugas, bukti dan bahan insight dengan scope yang sama. People nominal tidak tersedia dalam demo Operational.

Per diagram: arah higher/lower/range/neutral, basis SOP/kontrak, satuan, periode, scope, versi, sampel, hipotesis dan tindak lanjut. AI tidak menetapkan benchmark sendiri. Tidak ada acuan/definisi jelas → alasan pending. Hubungkan AI asli kemudian melalui service yang membaca data berizin.

### 5. Rekonsiliasi SER

Pakai 23 Vegen, 4 siklus/77 pengukuran Beacon, 17 dimensi/209 butir RSF sebagai inventaris. Empat siklus bukan empat outlet; 77 bukan KPI unik. Tampilkan source binding/status. Jangan mengeksekusi formula spreadsheet mentah.

Tindak lanjuti #REF! Beacon, rentang agregasi Vegen, arah absensi, unit rank Tripadvisor, bobot per siklus, assignment PIC/outlet dan aktivasi kontrak. X-Score menunggu formula/normalisasi sah. Formula pending tidak menghalangi pembangunan layout dan input yang sudah jelas.

### 6. Uji dan laporkan

Jalankan lint/build dan gate repo. Uji visual desktop/mobile pada environment dev Anda; visual browser A02 belum bisa diperiksa dalam sesi pembuat paket. Periksa 14 view, drilldown, entry-review, shared feedback, Supervisor satu outlet, Jro, CSV, denominator nol, empty/loading/error dan standar per outlet/periode.

Gunakan POS-Existing-Parity-Checklist untuk Dashboard POS, Appointment Book dan seluruh perilaku existing. Laporkan file/komponen berubah, screenshot, hasil QA, gap dan kontrak API berdasarkan endpoint nyata.

## Batas pelaksanaan

Selesaikan frontend dalam mandat yang sudah ada tanpa meminta persetujuan ulang untuk detail rutin. Backend, schema/rumus production, merge dan deploy mengikuti otorisasi proyek. Paket A02 belum mengubah preview Vercel atau database. Jangan mengklaim AI/ERP live, production-ready atau paritas formula tanpa bukti.

Hasil akhir: frontend yang dapat dicoba tim, matriks paritas, role/scope konsisten di demo, kontrak integrasi berdasarkan repo, serta daftar keputusan formula yang masih perlu diselesaikan.
