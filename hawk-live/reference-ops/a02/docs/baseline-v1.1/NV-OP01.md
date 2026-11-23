> **Riwayat baseline v1.1.** Perubahan dashboard, sumber SER, akun Jro Okta dan Demo Center mengikuti Addendum A02. Status lama bukan bukti pengujian A02.

# NV-OP01 — HAWK Operational Visual & UX Specification

Versi 1.1 · 18 November 2026 · Referensi utama: HAWK NV-47  
Status: spesifikasi prototype; keputusan UX dan integrasi production mengikuti review fase terkait.

## 1. Acuan visual yang dipakai

[NV-47 Finance Control Dashboard](https://preview.hawk.jaens.id/#/nv/47) dibaca langsung dalam pekerjaan ini. Halaman tersebut berlabel DEMO dan menampilkan kontrak developer. Pola yang diterapkan ke Operational adalah **shell charcoal, area kerja warm ivory, kartu putih, aksen gold**. Ini lebih spesifik daripada deskripsi umum “dark/gold” pada diskusi sebelumnya.

| Elemen | Observasi NV-47 | Penerapan Operational |
|---|---|---|
| Background kerja | `#F7F7F5` | Kanvas halaman dan ruang antarkartu |
| Teks utama | `#17140F` | Heading, nilai utama, body |
| Sidebar | `#0B0B0B`, sekitar 252 px | Navigasi Operational dan grouping menu |
| Topbar | `#1A1A1A`, sekitar 60 px | Outlet, profil, notifikasi, tanggal |
| Kartu | Putih, radius sekitar 14 px | Dashboard, tabel, form, panel |
| Aksen utama | `#C99A2E` | Active navigation, primary CTA, penekanan |
| Gradien gold | `#E5C66A → #C99A2E → #A67C1F` | Aksen terbatas pada elemen prioritas |
| Tipografi | Inter/system sans, body sekitar 14 px | System fallback untuk HTML offline |
| Developer contract | Panel dapat dibuka di halaman | Kontrak perilaku dan kebutuhan backend |

Token NV-47 saat ini diutamakan daripada nilai gold `#C9A43B` atau gaya cyan yang pernah disebut sebelumnya. Jangan mengubah seluruh portal menjadi gelap atau memakai gradien pelangi yang tidak tampak pada referensi ini.

## 2. Struktur shell

- Logo/wordmark HAWK berada di kiri atas dan membuka popup portal.
- Sidebar hanya berisi menu Operational. Finance, Sales, HRD, Commercial tidak menjadi link divisi dalam sidebar.
- POS & Reception adalah workspace existing yang diakses dari Operational melalui https://preview.jaens.id/rnd-demo. Isi POS tidak disederhanakan atau digambar ulang dari fixture prototype.
- Header menampilkan outlet scope dan akun demo. Manager/Assistant dapat memilih semua outlet; Supervisor hanya outletnya.
- Strip DEMO terlihat konsisten. Tidak memakai label Live untuk data sintetis.
- Footer menyebut referensi NV-47; tautan membuka halaman sumber atas tindakan pengguna.
- Prototype menggunakan tanda HAWK tipografis/monogram sederhana. Developer memakai aset logo resmi existing pada implementasi, tanpa merekonstruksi logo dari screenshot.

## 3. Menu prototype dan route lokal

| Route | Workspace | Fokus visual |
|---|---|---|
| `#demo` | Demo Experience Center | Test Lab, tujuh skenario, lima panel role, progress dan audit bersama |
| `#dashboard` | Command Center | KPI relevan role, pekerjaan prioritas, outlet overview |
| `#pos` | Gateway POS existing | Akses ke https://preview.jaens.id/rnd-demo, penjelasan batas integrasi; bukan mock Dashboard POS/Appointment Book |
| `#daily` | Daily Operations | Opening, briefing, handover, closing |
| `#tasks` | Team & Tasks | Status pekerjaan, PIC, review dan evidence |
| `#therapist` | Therapist Workspace | Tugas pribadi dan konteks treatment |
| `#rooms` | Room & Facility | Papan ruangan, cleaning, readiness, maintenance |
| `#inventory` | Inventory Coordination | Stok, penerimaan fisik, verifikasi |
| `#communication` | Communication Hub | Channel, pesan kontekstual, issue |
| `#race` | Ambidex & RACE | Kontrak, cadence, source task, score status |
| `#budget` | Budget 7P | Alokasi Finance, actual, komitmen, ruang budget |
| `#reports` | Reports & Analytics | Ringkasan, evidence, log dan ekspor sesuai izin |
| `#settings` | Team & Access | Checkbox permission, kebijakan review, tim |
| `#roadmap` | Peta 12 Fase | Jalur implementasi dan dependency |
| `#validation` | Validation Lab | UAT manual dan batas readiness |

Empat belas route tidak berarti empat belas fase: beberapa layar berada dalam fase yang sama. Fase tetap F-OP00 sampai F-OP11.

## 4. Dashboard per role

**Manager Eni Restini dan Assistant Tika:** konsolidasi outlet, perbandingan aktivitas, approval/exception, pengendalian budget, data coverage dan tindak lanjut. Tidak menganggap kedua peran otomatis boleh melihat payroll atau semua transaksi sensitif.

**Supervisor:** satu outlet, kesiapan ruangan dan tim, opening/closing, review kritis, barang yang menunggu verifikasi, issue, tasks dan RACE outlet. Filter “All Outlet” pada gambar Supervisor referensi **tidak disalin**, karena bertentangan dengan keputusan D1.

**Head Departemen:** pekerjaan dan review tim yang ditugaskan, tanpa akses lintas departemen/outlet otomatis.

**Receptionist:** masuk gateway/akses POS existing. **Therapist:** masuk workspace treatment/pribadi. **Attendant dan Security:** masuk tugas yang relevan. Workspace Operational mengikuti kebutuhan role; seluruh isi dan perilaku POS existing tetap dipertahankan.

## 5. Komponen dan perilaku

### Cards, tabel dan forms

Gunakan satu tingkat heading utama, kartu dengan judul jelas, metadata ringkas, angka tabular dan unit eksplisit. Tabel mempertahankan kolom identitas, status, PIC dan action. Form memiliki label tetap, required fields, validasi dan pesan hasil. Di layar sempit tabel berada dalam container scroll; jangan memotong tombol atau membuat seluruh viewport bergeser horizontal.

### Status dan feedback

Status memakai teks serta warna: ready/verified hijau, perhatian emas, critical/error merah, informasi biru, unavailable/pending abu. Warna bukan satu-satunya penanda. “Selesai dikerjakan” dan “terverifikasi” dibedakan; belum ada data tidak tampil sebagai 0 yang seolah aktual.

### Buttons dan dialogs

Satu primary action utama per konteks. Aksi yang tidak diizinkan disembunyikan atau disabled dengan alasan. Dialog menampilkan konteks objek, outlet dan konsekuensi, bukan hanya tombol Ya/Tidak. Fokus keyboard masuk dialog, Escape menutup ketika aman, dan fokus kembali ke pemicu.

### Data continuity

Task ID yang sama muncul di Team & Tasks, Daily RACE, review dan laporan. Appointment ID yang sama muncul pada POS dan konteks pelayanan. Receiving physical dan posting Inventory dipisahkan secara visual. Link lintas konteks tidak membuka data di luar scope.

## 6. State yang harus tampak

| State | Perilaku UX |
|---|---|
| Demo | Label konsisten, sumber simulasi jelas, tidak memakai istilah production live |
| Empty | Menjelaskan belum ada data dalam scope dan action yang diizinkan |
| Unauthorized | Data tidak ditampilkan; tetap pertahankan jalur kembali ke workspace yang sah |
| Pending integration | Sumber/backend belum tersedia dijelaskan pada kontrak developer |
| Pending formula | X-Score/Health Score resmi tidak dihitung; tampilkan keterangan verifikasi |
| Review required | PIC, reviewer, evidence dan status tahap review terlihat |
| Conflict/error | Tidak memaksa update diam-diam; pada integrasi nanti reload/retry sesuai kontrak |
| Stale | Tampilkan as-of time/sumber; indikator freshness bukan jam digital semata |

## 7. RACE dan budgeting

Nama RACE Vegen/Beacons mengikuti sumber, dengan alias hanya jika dibutuhkan pencarian. Daily RACE memakai Task ID yang sama; verified time terpisah dari completed/submitted time sesuai observasi HRD demo. Weekly/R2Re, Reflection dan STRACON adalah alur usulan sampai detail referensi AJI Creator diperiksa.

P1 People, P2 Product, P3 Promotion, P4 Process, P5 Place, P6 Facility mengikuti label NV-16. P7 Profit tampil sebagai hasil, bukan alokasi belanja. Dalam Operational, nominal yang terlihat dibatasi pada kategori serta scope yang berizin. P1 People hanya persen; nominal tidak tersedia tersembunyi dalam dialog atau ekspor.

Chart alokasi bulanan menampilkan angka simulasi dan bobot; klik periode tidak membuat budget baru. Nilai actual, commitment, remaining harus menjaga arti yang sama di kartu, tabel, detail dan export.

## 8. Mobile

Sidebar menjadi drawer. Navigasi cepat mengutamakan Beranda, Tugas, Tim, RACE dan akun demo sesuai permission. Form satu kolom, CTA mudah dijangkau dan semua label terbaca. Workspace Therapist bukan hasil menyalin Customer App.

File Owner bernama `Therapist View.jpg` dan `Therapist View2.jpg`, setelah inspeksi visual, menampilkan panel **Customer App**. Nama berkas tidak menjadi bukti isi spesifikasi Therapist. Referensi tersebut disimpan untuk Customer Portal/Sales; Therapist di paket ini didasarkan pada kebutuhan Operational yang telah disepakati.

## 9. Fidelity dan acceptance

Fidelity yang dituju: konsisten dengan sistem visual NV-47 serta pola navigasi existing, bukan menyalin screenshot menjadi gambar statis. Foto dan screenshot referensi tidak ditempel di produk sebagai dekorasi. Ikon memakai outline konsisten; grafik/diagram yang membutuhkan ketepatan dibuat dengan kode.

Validasi akhir harus mencakup desktop/mobile, satu Supervisor, Head, staff, dialog, tabel, focus, status demo, nominal People dan warna kontras. Hasil uji nyata dicatat di `QA-checklist.md`; spesifikasi ini tidak menyatakan semuanya telah lulus.

## 10. Demo Experience Center — tambahan v1.1

Entry point berupa kartu menonjol di bagian atas sidebar, di bawah identitas HAWK dan sebelum kelompok menu kerja. Gunakan outline/accent gold, ikon play, judul **Demo Experience Center**, serta subjudul ringkas yang menyatakan tujuh skenario dan lima peran. Entry point ini tetap berada dalam portal Operational.

Halaman memakai hierarki: tujuan demo → pilihan mode → konteks peran/outlet → katalog atau panel simulator → panduan langkah → feed perubahan. Mode Test Lab mengutamakan satu skenario aktif. Mode simulator menyajikan lima sudut pandang dari fixture bersama dengan tindakan membuka workspace terkait.

Panduan yang tetap muncul pada halaman kerja menyebut langkah, akun/peran, outlet, tindakan, dan hasil yang ditunggu. Pengguna dapat menjeda atau menutupnya. Pada mobile, panel tidak boleh menutup primary action, form, atau navigasi. Warna status tetap semantik: belum dilakukan, sedang berjalan, kondisi terpenuhi, atau perlu perhatian.

Pemeriksaan otomatis harus menggunakan label yang berbeda dari **Ditinjau manual**. Label loading/error menyebut simulasi UI. Kontrol ukuran layar adalah alat preview, bukan klaim perangkat fisik atau bukti kompatibilitas seluruh browser.

Detail behavior dan kriteria DX-01–DX-10 ada pada `Demo-Experience-Center.md`. Referensi tambahan yang diperiksa: [Finance Demo Experience Center](https://preview.hawk.jaens.id/#/dx).

## 11. Fidelity POS existing

Instruksi Owner untuk POS adalah exact parity terhadap aplikasi existing. Penambahan tombol atau gateway pada shell Operational tidak menjadi izin mengganti layout, menu/submenu, Dashboard POS, Appointment Book, filter, ikon/status, popup atau action existing. Baca `POS-Existing-Parity-Checklist.md` sebelum mengubah wiring. Branding Operational di halaman baru tetap mengikuti NV-47; POS existing dipertahankan sesuai baseline yang diverifikasi tim developer.
