> **Riwayat baseline v1.1.** Perubahan dashboard, sumber SER, akun Jro Okta dan Demo Center mengikuti Addendum A02. Status lama bukan bukti pengujian A02.

# Brand Analysis — HAWK NV-47

18 November 2026 · Read-only reference review

## Kesimpulan desain

Referensi terbaru yang dipilih Owner adalah **NV-47 Finance Control Dashboard — HAWK × JAENS (DEMO)**. Identitas yang terlihat berupa shell hitam/charcoal, kanvas ivory, kartu putih, tipografi sans, aksen gold dan status semantik. Karena itu, prototype Operational memakai kontras gelap pada navigasi dan terang pada isi, bukan seluruh halaman gelap.

Sumber utama: [HAWK NV-47](https://preview.hawk.jaens.id/#/nv/47).

## Bukti langsung pada pekerjaan ini

| Yang diperiksa | Observasi | Implikasi |
|---|---|---|
| Judul dan label | NV-47 Finance Control Dashboard; DEMO | UI referensi, tidak membuktikan engine finance aktif |
| Background | `#F7F7F5` | Area baca terang dan tenang |
| Text | `#17140F` | Kontras hangat dengan kanvas |
| Sidebar | `#0B0B0B`, sekitar 252 px | Orientasi navigasi yang stabil |
| Topbar | `#1A1A1A`, sekitar 60 px | Identitas, scope dan akun |
| Cards | White; radius sekitar 14 px | Sistem komponen konsisten |
| Gold | `#C99A2E` | Action dan emphasis |
| Gradient | `#E5C66A → #C99A2E → #A67C1F` | Penggunaan terbatas untuk prioritas |
| Type | Inter/system sans, body sekitar 14 px | Offline memakai system fallback |
| Detail developer | Kontrak developer terlihat | Menjembatani UI dan pekerjaan backend |

Token hasil observasi ini didahulukan daripada variasi cyan/teal atau gold lama `#C9A43B` dalam riwayat. Mengikuti guideline tidak berarti mengubah brand semua portal; implementasi final harus mengambil token reusable dari repository existing.

## Referensi terkait yang dibaca

- [Operational #pos](https://preview.hawk.jaens.id/hawk-live/portal#pos): F4-07 sandbox booking → treatment → transaksi; sidebar Demo Experience Center, Operational & POS dan Inventory. Menjadi lokasi perluasan, bukan bukti backend connected.
- [Finance NV-16](https://preview.hawk.jaens.id/#/nv/16): label P1–P6, P7 Profit sebagai hasil; budgeting developer contract `budget.getPerformanceCube` ditandai NEW INTEGRATION REQUIRED.
- [HRD RACE](https://preview.hawk.jaens.id/hawk-live/portal#hrd-race): demo Manager HRD, Race Vegen enam indikator, bobot 100%, kontrak v1, provisional score dan X-Score belum locked.
- [HRD Daily RACE](https://preview.hawk.jaens.id/hawk-live/portal#hrd-race-daily): Task ID sama dengan My Day, selesai dan terverifikasi dibedakan, blocked/late/extra tasks.

Tidak ada form disubmit. Observasi ini tidak memeriksa network, source repository, authentication backend, database atau perhitungan production. AJI Creator Performance dan Looker Studio belum dibaca langsung dalam pekerjaan ini.

## Cara menggunakan gambar Owner

| Referensi gambar | Penggunaan yang tepat | Pembatasan |
|---|---|---|
| Supervisor Dashboard.jpg | Peta kebutuhan room, therapist, quality, issue, checklist | “All Outlet” tidak berlaku untuk Supervisor; angka di gambar tetap contoh |
| Screenshot Operational existing | Konteks shell dan menu historis | Status latest mengikuti pemeriksaan aktual; screenshot tidak membuktikan API |
| Therapist View.jpg / Therapist View2.jpg | Setelah inspeksi, isi adalah Customer App; referensi Sales/Customer Portal | Tidak dianggap spesifikasi Therapist meskipun nama berkas demikian |
| Gambar arsitektur/roadmap yang pernah dihasilkan | Inspirasi komunikasi konsep | Peta sumber kebenaran dan diagram teknis mengikuti keputusan serta audit, bukan teks generatif pada gambar |

Screenshot digunakan untuk analisis internal. Prototype menggunakan komponen HTML/CSS dan ikon, bukan menempelkan screenshot menjadi antarmuka. Gambar tidak dimasukkan otomatis sebagai aset produk.

## Keputusan visual untuk prototype

1. Shell tetap gelap, isi utama terang dan grid rapi.
2. Primary button dan active nav menggunakan gold; status memakai warna semantik secukupnya.
3. Content hierarchy mengutamakan prioritas shift, readiness, review, status sumber dan tindakan berikutnya.
4. Kontrak developer tersedia sebagai disclosure agar tidak mengganggu petugas.
5. Outlet scope serta role selalu jelas. Tidak ada filter lintas outlet pada Supervisor.
6. Data demo, pending formula, dan pending integration terlihat berbeda.
7. Developer mengganti monogram/wordmark sederhana dengan aset HAWK resmi existing saat integrasi.

## Batas analisis

Analisis ini mencocokkan beberapa layar referensi yang relevan. Ini bukan audit lengkap seluruh preview HAWK, semua 7P accounting rules, atau seluruh workbook SER. Klaim tersebut memerlukan source/API dan pemeriksaan tambahan pada fase terkait.
