# POS Existing — Preservation & Parity Checklist

18 November 2026 · Tambahan keputusan Owner pada prototype Operational v1.1

## 1. Keputusan yang harus diikuti

**POS & Receptionist membuka POS existing pada https://preview.jaens.id/rnd-demo.** Dashboard POS, Appointment Book, seluruh menu, submenu, dialog, interaksi dan integrasinya dipertahankan. Prototype Operational tidak menggantikan POS existing dengan daftar booking atau kasir yang disederhanakan.

Source POS berada dalam pekerjaan tim Claude/developer HAWK. Dokumen ini menetapkan kewajiban pemeriksaan; ia tidak menyatakan source, seluruh isi aplikasi, atau parity terhadap deployment tersebut telah diaudit.

Pada HTML v1.1, menu POS & Reception menjadi pembuka aplikasi existing. Route lokal `#pos` berfungsi sebagai gateway/informasi integrasi bila diperlukan. Data booking/treatment sintetis yang dipakai latihan Therapist dan room turnover tetap diberi label fixture Operational dan tidak diklaim tersinkron dengan POS yang dibuka.

## 2. Batas perubahan

Yang ditambahkan adalah akses dari Operational Portal dan penjelasan hubungan datanya. Perlakuan yang harus dipertahankan:

- Tidak menulis ulang Dashboard POS, Appointment Book, kasir atau retail dari model HTML yang lebih sederhana.
- Tidak menghapus, menyembunyikan, menggabungkan atau mengganti menu/submenu POS tanpa instruksi perubahan terpisah dari Owner.
- Tidak mengubah perhitungan, tax/service, discount, commission, settlement, refund, journal atau stock posting.
- Tidak membuat booking, invoice, payment atau ledger kedua untuk memperlihatkan integrasi.
- Tidak memaksakan role switch demo Operational ke akun/session POS existing.
- Tidak menganggap halaman yang terbuka sebagai bukti bahwa autentikasi bersama atau API integration sudah selesai.

Jika integrasi shell memerlukan adapter atau perubahan route internal, tunjukkan diff dan hasil parity. Sampai kontraknya terbukti, tautan ke aplikasi existing menjadi akses yang jelas; jangan menyamarkan fixture lokal sebagai isi POS existing.

## 3. Matriks pemeriksaan wajib

Semua item berstatus **PENDING SOURCE / UI COMPARISON** sampai bukti dicatat oleh Claude/developer pada lingkungan yang diotorisasi.

| ID | Area | Wajib dibandingkan dengan existing | Bukti minimum |
|---|---|---|---|
| POS-P01 | Versi dan lingkungan | Repository, branch/commit, build/version, route, environment dan API host | Identitas source serta versi deployment yang dibandingkan |
| POS-P02 | Seluruh navigasi | Daftar menu/submenu, urutan, label, role visibility, default landing, deep link dan back navigation | Inventaris sebelum/sesudah; tidak ada item hilang |
| POS-P03 | Dashboard POS | Semua kartu, tabel, chart, angka, rumus, target, periode, filter outlet, formatting, status mock/live dan refresh behavior | Respons sumber dan hasil tampilan dengan input yang sama |
| POS-P04 | Appointment Book | Tampilan kalender/Gantt/list yang tersedia, slot, jam operasional, grouping room/therapist/resource, kapasitas dan availability | Screenshot acuan, daftar control, urutan tindakan, expected result |
| POS-P05 | Filter dan pencarian | Default/filter tanggal, today/custom, outlet, staff, status, treatment, search, sort dan persistensi pilihan | Kombinasi filter representatif dan hasil sebelum/sesudah |
| POS-P06 | Informasi tamu dan resource | Guest labels/icons/badges, repeat/member/VIP/request flags yang memang ada, room/therapist tags, legends dan tooltip | Field mapping dan tampilan yang setara; jangan menambahkan asumsi ikon |
| POS-P07 | Booking actions | Create/detail/edit/reschedule/cancel/no-show, assignment room/therapist, blocking, conflict dan status history sesuai yang tersedia | Aksi positif/negatif; ID dan perubahan status tetap sama |
| POS-P08 | Popup dan interaksi | Semua dialog, context menu, keyboard/drag interaction yang tersedia, validation, loading/error/empty states dan confirmation | Daftar dialog/actions dan hasil action parity |
| POS-P09 | Status pelayanan | Check-in/start/progress/complete/paid/cancel dan pemetaan enum yang sebenarnya, actor/timestamp, journey/history | Source enum dan bukti transisi; tidak menebak dari label demo |
| POS-P10 | Kasir dan retail | Item/price/discount/tax/service/tip, invoice, payment method, split/partial payment, refund/void bila tersedia | Golden cases approved dan server computation yang identik |
| POS-P11 | Role dan permission | Menu/action/field visibility, object/outlet scope, permission denial, approval untuk refund/override/exception | Matriks efektif serta uji request/aksi yang relevan |
| POS-P12 | API dan data contract | Endpoint/method, request/response, IDs, pagination, enum, timezone, error, concurrency/idempotency | Mapping terverifikasi dengan path/fungsi/commit; tidak membuat endpoint fiktif |
| POS-P13 | Integrasi lintas domain | HRD shift/presence, therapist assignment, Inventory, Finance/Accounting dan Sales yang memang sudah terhubung | Bukti source of truth dan efek transaksi tanpa duplikasi |
| POS-P14 | Inventory existing | Seluruh fungsi, master, request/receiving/stock/ledger yang telah ada; hubungan POS/retail/BHP | Regression relevan; pemeriksaan Operational tidak melakukan posting tandingan |
| POS-P15 | Keandalan UI | Resize/device behavior, modal/focus, browser refresh/back, state saat error, double-click/retry | Hasil uji pada ukuran/role yang disepakati |
| POS-P16 | Akses dari Operational | Tautan membuka URL canonical, kembali ke Operational jelas, session tetap mengikuti aplikasi existing | Hasil navigasi; tidak menandai integrasi backend selesai hanya dari klik link |

“Sama” berarti fungsi dan hasil yang sama pada input serta konteks izin yang sama. Perbedaan yang memang sudah ada antar lingkungan harus dicatat sebagai gap baseline; jangan diam-diam memperbaiki rumus atau menghapus perilaku sambil mengerjakan integrasi antarmuka.

## 4. Format bukti untuk Claude

Untuk setiap item, isi:

| Field | Isi |
|---|---|
| Parity ID | POS-P01–POS-P16 |
| Existing location | Route, menu, file/fungsi, commit yang benar-benar diperiksa |
| Existing behavior | Input, role, outlet, expected display/action dan sumber data |
| Proposed connection | Tautan, wrapper, route atau adapter yang diusulkan |
| Difference | Tidak ada / perbedaan yang terukur |
| Verification | Test/observasi yang benar-benar dijalankan |
| Status | MATCH / GAP / BLOCKED / NOT VERIFIED |
| Owner decision needed | Hanya perubahan substantif yang belum diotorisasi |

Jangan memakai status MATCH hanya karena source terlihat ada atau halaman berhasil dibuka. Cantumkan bukti yang sesuai dengan kedalaman klaim.

## 5. Instruksi untuk handoff

> Gunakan POS existing pada https://preview.jaens.id/rnd-demo sebagai acuan canonical. Pertahankan seluruh isi dan perilaku Dashboard POS, Appointment Book, menu/submenu, dialog, filter, icon/status, action, permission, API, formula dan integrasi existing. Jangan menggantinya dengan mock POS sederhana dari prototype Operational. Audit source yang Anda miliki, isi POS-P01–POS-P16, lalu hubungkan entry point Operational melalui mekanisme yang paling sedikit mengubah existing. Tandai seluruh bagian yang belum dapat diverifikasi. Simulasi Demo Experience Center memakai fixture lokal dan tidak membuktikan integrasi ke POS existing.

Perubahan berikutnya pada POS, Inventory, engine atau deployment memerlukan scope yang sesuai dengan keputusan Owner yang berlaku. Pekerjaan prototype dan review read-only yang sudah diotorisasi dapat dilanjutkan tanpa meminta persetujuan ulang.
