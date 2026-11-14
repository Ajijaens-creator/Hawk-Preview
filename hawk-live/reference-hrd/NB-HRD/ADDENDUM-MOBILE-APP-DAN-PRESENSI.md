# NB Addendum · HAWK Mobile, POS Spa & Presensi

Tanggal 14 November 2026 · Spesifikasi pengembangan · R&D dan data dummy

[NB induk](README.md) · [F1 fondasi](F1-FONDASI-DAN-BERANDA.md) · [F2 presensi](F2-OPERASI-HRD-DAN-DIREKTORI.md) · [F3 pekerjaan](F3-PLANNER-DAN-WORKPLACE.md) · [F5 POS](F5-MANPOWER-PLANNING-DAN-POS.md) · [Panduan brand](../HAWK-BRAND-GUIDELINES.md)

## 1. Keputusan produk

HAWK memiliki satu aplikasi yang dipasang pada Android dan iPhone untuk pekerjaan harian seluruh tim. Isi mengikuti peran, business unit, divisi, outlet, penugasan dan tanggal efektif. Mobile POS menjadi bagian Pekerjaan untuk staf operasional yang memiliki izin. Nama kerja aplikasi adalah **HAWK Mobile**.

Fokus mobile adalah Beranda/My Day, presensi, jadwal, tugas, chat, pengajuan dan operasional spa. Marketing, Finance & Accounting, HRD dan manajer memakai desktop untuk penyusunan pekerjaan kompleks, olah data, konfigurasi dan laporan mendalam. Mereka tetap memakai mobile untuk pekerjaan pribadi, komunikasi, pengingat serta approval sesuai kewenangan.

Mobile dan desktop menggunakan identitas, data dan aturan bisnis yang sama. Addendum ini memperluas F1–F8 tanpa mengganti nomor atau jumlah 77 NV utama. Detail NV mobile disusun sebagai paket tersendiri. Spesifikasi ini belum merupakan aplikasi Android/iOS yang dapat dipasang.

Target hasil adalah aplikasi terpasang dengan kamera, lokasi, notifikasi dan penyimpanan aman perangkat. Preview HTML tetap menjadi sarana review awal. Menambahkan ikon situs ke layar utama atau membungkus seluruh preview HTML dalam WebView belum memenuhi target aplikasi ini.

## 2. Navigasi utama

| Menu | Isi | Aksi utama |
| --- | --- | --- |
| Beranda | Nama samaran, peran, outlet aktif, shift hari ini, status hadir, My Day, pengumuman, ringkasan pekerjaan | Check-in/check-out, buka tugas berikutnya, lihat pengajuan dan pengingat |
| Pekerjaan | My Tasks, kalender kerja, tugas per peran, SOP dan ruang operasional spa | Kerjakan tugas, checklist, unggah bukti, pindah status, buka booking/treatment/ruangan sesuai izin |
| Presensi | Masuk/keluar, istirahat, lembur, shift, ringkasan dan histori pribadi | Verifikasi wajah dan lokasi, lihat bukti presensi, ajukan koreksi |
| Inbox | Tab Chat, Notifikasi dan Approval | Chat pribadi/grup kerja, diskusi task, buka sumber notifikasi, putuskan pengajuan sesuai izin |
| Saya | Profil sendiri, penempatan, dokumen yang diizinkan, izin/cuti, pengajuan, pelatihan, bantuan, pengaturan perangkat | Ajukan layanan HRD, lihat saldo cuti, kelola sesi dan preferensi notifikasi |

Kalender, Perusahaan, Timeline dan direktori tim dapat dibuka melalui pintasan Beranda/Saya. Tab Approval berisi antrean reviewer bagi approver dan status pengajuan sendiri bagi staf. Ulang tahun hanya menampilkan informasi yang diizinkan. Direktori umum memuat nama, jabatan, outlet/divisi dan kanal kontak kerja yang boleh dibagikan.

Presensi dibuat menonjol pada Beranda dan navigasi bawah. Terapkan identitas HAWK charcoal, ivory dan gold. Gunakan tombol besar, teks terbaca, status dengan label, dukungan pembaca layar dan satu aksi utama per langkah. Halaman tidak bergantung pada hover atau drag. Tugas dapat dipindahkan dengan tombol **Pindahkan ke**.

## 3. Pekerjaan menurut peran

Semua peran menerima lima menu utama. Tabel berikut mengatur isi tambahan Pekerjaan, bukan aplikasi terpisah.

| Peran | Fokus mobile | Cakupan |
| --- | --- | --- |
| Spa Therapist | Treatment saya, urutan tamu yang ditugaskan, persiapan, mulai/selesai layanan, catatan layanan yang diperlukan, checklist, SOP, coaching dan hasil kerja pribadi | Diri sendiri dan layanan yang ditugaskan |
| Spa Reception | Reservasi hari ini, kedatangan/keberangkatan tamu, ketersediaan therapist/ruangan, koordinasi penugasan, transaksi POS sesuai izin dan serah terima | Outlet/shift yang ditugaskan |
| Spa Attendant | Kesiapan ruangan, kebersihan, linen, perlengkapan, permintaan stok, laporan kerusakan dan checklist pergantian tamu | Area/ruangan yang ditugaskan |
| Spa Supervisor | Kontrol shift, roster hadir, antrean layanan, kesiapan ruangan, pembagian tugas, pemeriksaan mutu dan pengajuan tim | Tim dan outlet yang menjadi tanggung jawab |
| Assistant Spa Manager | Handover, pengecualian operasi, rencana shift, koordinasi kapasitas, coaching dan approval yang didelegasikan | Outlet dan wewenang delegasi dengan masa berlaku |
| Spa Manager | Ringkasan outlet, service quality, utility, produktivitas, kebutuhan tenaga, permintaan rekrutmen dan review tim | Outlet yang ditugaskan |
| Business Unit Manager | Ringkasan beberapa outlet, perbandingan kapasitas, eskalasi, approval dan tindak lanjut | Business unit/outlet yang ditugaskan |
| Marketing dan Production | My Tasks, agenda, brief, preview aset ringan, komentar, unggah bukti dan review | Tugas/proyek yang diberikan. Penyuntingan kompleks berada di desktop |
| Finance & Accounting | My Tasks, tenggat closing, permintaan dokumen, konfirmasi, eskalasi dan approval sesuai izin | Tugas dan data keuangan yang diizinkan. Rekonsiliasi besar berada di desktop |
| HRD Operations dan Human Growth | Antrean layanan, tindak lanjut kandidat, agenda interview, onboarding, koreksi presensi, coaching/pelatihan dan approval | Cakupan kerja HRD/HG dan izin masing-masing |
| Manajer divisi | Ringkasan tim, tugas terlambat, beban kerja, pengajuan, approval dan coaching | Divisi yang menjadi tanggung jawab |

Menu dan data divalidasi di server. Mengganti outlet di layar atau membuka tautan langsung tidak memperluas hak akses. Akun nonaktif dan delegasi berakhir tidak dapat melakukan aksi baru.

**Payroll tetap khusus Manager HRD**, termasuk slip, gaji personal dan nominal komisi. Therapist dapat melihat jumlah layanan, jam treatment dan hasil kerja pribadi. Finance memakai agregat yang telah diizinkan. Menu Gaji pada screenshot referensi tidak otomatis menjadi hak akses staf dalam HAWK.

## 4. Presensi wajah, lokasi dan jam kerja

### Pendaftaran awal

1. Akun berasal dari onboarding dan penempatan yang disetujui. Karyawan mengaktifkan akun lewat undangan yang dibatasi masa berlakunya.
2. Jelaskan pemakaian kamera, lokasi, bukti wajah, masa simpan dan jalur alternatif sebelum pengambilan data. Izin kamera/lokasi diminta ketika fitur digunakan.
3. Pada implementasi produksi, pendaftaran wajah dikaitkan dengan Employee ID yang identitasnya telah diverifikasi petugas berwenang. Simpan referensi biometrik dalam penyimpanan khusus dengan akses terbatas. Penggantian referensi memerlukan verifikasi ulang dan audit.
4. Dalam R&D, pendaftaran dan hasil pemeriksaan memakai simulasi berlabel. Foto dan identitas nyata dari screenshot tidak dipakai sebagai profil atau template wajah.

### Alur masuk dan keluar

1. Karyawan membuka Beranda. Sistem menampilkan outlet penugasan, tanggal kerja, jam mulai/selesai shift dan aksi yang tersedia.
2. Karyawan menekan **Check-in kerja** atau **Check-out kerja**. Sistem membuat sesi presensi dengan identitas permintaan unik.
3. Ambil lokasi baru saat aksi dilakukan, termasuk waktu pengambilan dan perkiraan akurasi. Cocokkan dengan lokasi yang diizinkan untuk penugasan aktif.
4. Kamera depan mengambil wajah langsung. Periksa kualitas, keberadaan satu wajah, liveness dan kecocokan **1:1** dengan profil karyawan yang sedang masuk. Bukti diikat ke sesi presensi ini. Foto dari galeri dan hasil sesi lama tidak menjadi bukti baru.
5. Server menilai sesi, lokasi, jadwal dan bukti. Catat waktu server, waktu pengambilan bukti serta waktu perangkat secara terpisah. Waktu HP tidak menjadi satu-satunya acuan.
6. Tampilkan bukti hasil: jenis aksi, tanggal/jam WITA, outlet, shift, status verifikasi dan ID presensi. Status harus membedakan **Terverifikasi**, **Menunggu sinkronisasi**, dan **Perlu pemeriksaan**.
7. Presensi terverifikasi memperbarui tampilan karyawan dan dashboard supervisor/HRD dari catatan yang sama. Downstream menggunakan status persetujuan yang sama.

**Face ID/biometrik perangkat** boleh dipakai untuk membuka sesi aplikasi. Apple memberikan hasil autentikasi berhasil/gagal tanpa memberikan data biometrik dasarnya. Karena itu verifikasi presensi terhadap Employee ID memerlukan mekanisme tersendiri. [Apple Local Authentication](https://developer.apple.com/documentation/localauthentication)

**Face detection** hanya mendeteksi wajah. ML Kit secara eksplisit tidak mengenali identitas orang. Developer harus menyediakan face matching dan liveness yang benar sebelum menyebut presensi wajah sebagai fitur produksi. [Google ML Kit](https://developers.google.com/ml-kit/vision/face-detection)

Liveness membantu menilai bahwa seseorang hadir di depan kamera, dengan hasil probabilistik. Vendor, ambang dan dukungan perangkat harus diuji. Tidak ada klaim bahwa semua pemalsuan pasti terdeteksi. [Contoh dokumentasi liveness](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html)

### Lokasi dan pengecualian

- Radius per outlet, usia maksimum titik lokasi dan batas akurasi ditentukan dalam pengaturan berversi. Nilainya diuji di lokasi nyata sebelum digunakan. Radius tidak boleh diperbesar otomatis ketika GPS buruk.
- Perpindahan Ubud ke Santi mengikuti penugasan efektif atau izin tugas sementara. Kehadiran di cabang yang berbeda tanpa izin masuk antrean pemeriksaan.
- Lokasi diambil untuk kejadian presensi/kunjungan yang diperlukan. Pelacakan terus-menerus di luar aksi tersebut tidak menjadi scope awal. Android membedakan izin lokasi foreground/background serta precise/approximate. [Dokumentasi izin lokasi](https://developer.android.com/develop/sensors-and-location/location/permissions)
- GPS tidak akurat, izin ditolak, kamera rusak, wajah tidak terbaca atau kebutuhan aksesibilitas harus memiliki tombol bantuan dan **Ajukan presensi dengan pemeriksaan**. Sertakan alasan serta verifikasi supervisor/HRD berwenang.
- Sinyal lokasi/perangkat yang tidak wajar menjadi alasan pemeriksaan. Sistem tidak menyimpulkan kecurangan hanya dari satu sinyal, kegagalan pencocokan atau GPS.
- Saat offline, simpan pengajuan minimal secara aman dengan ID yang tetap. Jika liveness tidak dapat dijalankan, catat **belum diverifikasi**. Saat tersambung, waktu unggah tidak dianggap sebagai waktu kedatangan. Waktu kejadian yang belum dapat dipercaya memerlukan pemeriksaan. Retry tidak membuat presensi ganda.
- Tidak ada keputusan absen, sanksi atau potongan gaji otomatis hanya karena pemeriksaan teknis gagal. Koreksi mengikuti F2, dengan nilai sebelum/sesudah, reviewer dan alasan.

### Waktu dan status kerja

- Siklus kerja: **Belum masuk → Bekerja ↔ Istirahat → Selesai kerja**. Pengajuan yang belum diverifikasi tidak boleh menampilkan keberhasilan final.
- Check-out wajib merujuk check-in/shift yang benar. Check-out tanpa check-in diarahkan ke koreksi. Menekan tombol dua kali atau mengulang setelah koneksi putus tetap menghasilkan satu kejadian resmi.
- Shift melewati tengah malam mengikuti tanggal kerja shift asal. Simpan waktu standar dan zona outlet, lalu tampilkan WITA untuk empat cabang demo.
- Toleransi terlambat, keluar awal, jeda, split shift dan perubahan jadwal memiliki aturan dan tanggal efektif. Tampilkan jam aktual terpisah dari jam yang disetujui.
- Durasi kerja dihitung dari interval yang valid dan jeda sesuai kebijakan. Presensi belum lengkap ditandai sementara. Waktu lembur aktual terpisah dari persetujuan lembur dan komponen pembayaran.
- Bedakan label **Check-in kerja**, **Check-in tamu**, dan **Mulai treatment**. Ketiganya mempunyai objek, status dan ID berbeda.

## 5. Tugas dan chat seluruh tim

Gunakan Task ID F3 yang sama di mobile dan desktop. Status tetap **Ide → Issue → Workplan → Priority → Dikerjakan → Review → Selesai**. Perubahan mencatat pelaku, waktu, nilai sebelum/sesudah dan PIC yang terpisah dari pelaku. Kartu memiliki Preview, Files & Assets, Discussion, Tasks & Checklist serta Activity & History.

Chat menyediakan percakapan pribadi, grup outlet, grup divisi, grup proyek dan pengumuman perusahaan sesuai keanggotaan. Tersedia balasan, mention, lampiran, pencarian dan penanda belum dibaca. Diskusi yang dibuat dari task menjadi thread tertaut ke task yang sama. Pesan umum baru menjadi task setelah aksi **Jadikan tugas**, dengan tautan sumber dan pencegahan duplikasi.

Notifikasi mengarah ke objek asal setelah login dan pemeriksaan hak akses. Tampilan layar terkunci memakai ringkasan netral untuk informasi sensitif. Status pesan membedakan mengantre, terkirim dan gagal. Perubahan keanggotaan mengikuti penempatan/izin, dan cache akses terbatas dibersihkan ketika akun keluar atau izin dicabut. Persetujuan resmi dilakukan lewat objek Approval dan dicatat, bukan sekadar balasan “setuju” dalam chat.

## 6. Integrasi POS spa dan desktop

**Reservasi → penugasan therapist → persiapan ruang → layanan → penutupan transaksi POS → catatan produktivitas → KPI/komisi sesuai aturan.**

- Kehadiran membantu menunjukkan orang yang tersedia. Menjadi hadir tidak otomatis membuat booking, memulai treatment atau mencatat pendapatan.
- Therapist, Reception dan Attendant berbagi referensi booking, Service ID, Room ID, Employee ID dan outlet aktual. Tugas tetap punya Task ID sendiri.
- Penyelesaian treatment bukan bukti pembayaran. Status pembayaran bersumber dari POS. Rekonsiliasi dan aturan komisi mengikuti F5/F7, termasuk refund, pembagian layanan dan koreksi.
- Mobile Reception hanya dapat melakukan aksi POS yang diizinkan. Refund, diskon dan perubahan transaksi mengikuti izin serta approval yang sudah berlaku. Semua pembayaran dalam prototype adalah simulasi.
- Dashboard HRD menerima data terverifikasi dengan status kualitas data. Chat dan kelengkapan checklist tidak otomatis meningkatkan KPI tanpa definisi serta bukti yang disetujui.
- Rekrutmen publik tetap dapat dibuka melalui landing page/link/QR tanpa calon pelamar memasang aplikasi karyawan. Aktivasi aplikasi mengikuti penerimaan dan onboarding.

## 7. Bentuk aplikasi dan pemasangan

**Rekomendasi awal: Flutter untuk klien Android/iOS**, dengan layanan server HAWK bersama. Flutter mendukung kedua platform. Pilihan akhir dikonfirmasi developer setelah memeriksa kode yang sudah ada dan kompatibilitas SDK kamera/liveness. Penggunaan Flutter tidak berarti preview HTML langsung menjadi aplikasi siap pasang. [Platform Flutter](https://docs.flutter.dev/reference/supported-platforms)

Komponen yang diperlukan adalah aplikasi mobile, autentikasi dan izin server, layanan presensi, layanan chat/notifikasi, koneksi POS, penyimpanan bukti terbatas, serta portal desktop untuk konfigurasi dan pemeriksaan. SDK khusus Android/iOS dapat dibutuhkan untuk liveness. Rahasia layanan tetap di server, kredensial sesi disimpan aman di perangkat, dan R&D memiliki lingkungan serta identitas aplikasi terpisah dari produksi.

| Tahap | Android | iPhone |
| --- | --- | --- |
| Uji perangkat | Build uji bertanda tangan untuk perangkat tester, lalu track internal/closed Google Play | Build yang ditandatangani melalui TestFlight |
| Pilot lebih luas | Gunakan closed testing bila kelompok melewati batas internal testing | Undangan tester sesuai pengaturan TestFlight dan proses review |
| Pemakaian tetap | Distribusi Google Play dengan akun karyawan, atau managed Google Play untuk organisasi yang memenuhi pengaturan | Pilih Custom Apps untuk organisasi yang terdaftar, atau App Store/unlisted sesuai kondisi perangkat dan persetujuan Apple |

Internal testing Google Play dibatasi 100 tester, sehingga 158 profil dummy tidak berarti 158 orang dapat masuk satu kelompok internal test. Jumlah tester nyata ditentukan terpisah. [Google Play testing](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en)

Build TestFlight dapat diuji sampai 90 hari. TestFlight adalah jalur pengujian, kemudian perlu jalur distribusi tetap. [Apple TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)

Custom Apps dapat diberikan ke organisasi tertentu. Unlisted memakai tautan langsung dan tetap memerlukan review. Siapa pun yang mendapat tautan unlisted dapat mengunduh, sehingga login dan izin HAWK tetap wajib. [Apple Custom Apps](https://developer.apple.com/support/volume-purchase-and-custom-apps/) · [Apple Unlisted](https://developer.apple.com/support/unlisted-app-distribution/)

Setelah build tersedia, staf menerima undangan/tautan instalasi atau QR menuju halaman instalasi resmi, memasang aplikasi, mengaktifkan akun dan menyelesaikan onboarding. QR hanya membantu membuka jalur instalasi. Akun developer perusahaan, penandatanganan aplikasi, undangan tester dan publikasi belum dijalankan oleh addendum ini.

## 8. Prioritas dan urutan pengembangan

| Tahap | Hasil yang harus dapat direview | Dependensi |
| --- | --- | --- |
| M1 · Alur mobile R&D | Lima navigasi, peran, Beranda, My Tasks, chat dummy, presensi wajah/lokasi/jam simulasi dan jalur pengecualian | F1–F3, brand, fixture 158 |
| M2 · Build perangkat | Aplikasi uji Android/iOS, kamera/lokasi/perizinan, login, notifikasi, penyimpanan aman dan sinkronisasi ke server R&D | Toolchain, akun/signing dan kontrak layanan |
| M3 · Verifikasi dan spa | Enrollment terkontrol pada pilot terpisah, liveness/matching teruji, koreksi presensi dan perjalanan POS spa | Pilihan penyedia, tata kelola biometrik, F2/F4/F5, pengujian HP nyata |
| M4 · Pilot dan distribusi | Uji lintas peran/outlet, perbaikan, panduan instalasi, dukungan dan rilis bertahap | Bukti penerimaan, jalur distribusi yang tersedia |

**P0** adalah login/role, lima navigasi, presensi beserta pengecualian, tugas, chat, layanan HRD dasar dan pekerjaan inti spa yang telah disepakati. Pada M1 seluruh efek memakai dummy. **P1** mencakup pencarian chat lanjutan, pengelompokan notifikasi dan pengingat yang dapat dipersonalisasi. Fitur keuangan berat, penyuntingan kampanye penuh dan analisis desktop mendalam tetap pada portal desktop. Pelacakan lokasi sepanjang hari dan pembayaran baru di luar POS yang ada tidak masuk scope ini.

## 9. Data minimum dan pengamanan

| Catatan | Isi minimum |
| --- | --- |
| Presensi | Attendance ID, Employee ID, Assignment ID, Shift ID, jenis aksi, tanggal kerja, waktu pengambilan/penerimaan, zona, status dan versi aturan |
| Bukti verifikasi | Session ID, referensi enrollment berversi, hasil liveness/matching, referensi lokasi, akurasi/usia lokasi, hasil evaluasi dan referensi bukti yang dibatasi |
| Pengecualian | Request ID, kejadian asal, alasan, bukti, reviewer, keputusan, waktu dan nilai sebelum/sesudah |
| Sinkronisasi | Event ID tetap, waktu perangkat yang belum dipercaya, status antrean, jumlah percobaan dan hasil server |
| Chat/tugas | Conversation ID, Message ID, Task ID tertaut, keanggotaan/cakupan, pengirim, waktu dan status kirim |

Jangan menyimpan template wajah dalam profil publik, berkas tugas, chat, notifikasi atau log umum. Batasi akses bukti presensi menurut tugas pemeriksa. Tetapkan enkripsi, masa simpan, penghapusan, pemulihan akun dan audit sebelum pilot biometrik nyata. Hasil verifikasi digunakan untuk identitas presensi, tanpa menyimpulkan kepribadian, emosi atau kinerja dari wajah.

Fixture tetap **158 orang dummy** sesuai NB induk. Empat outlet masing-masing 25 therapist dan 5 receptionist. Office tetap 38 orang. Untuk mendemokan Attendant, Supervisor dan Manager, pakai skenario role/penugasan berlabel pada persona demo yang tersedia, tanpa mengklaim jumlah jabatan tersebut sudah disetujui atau menambah headcount diam-diam.

## 10. Uji penerimaan dan ukuran keberhasilan

1. Therapist dummy Ubud membuka aplikasi, melihat shift yang benar dan menyelesaikan check-in simulasi. Catatan sama terlihat pada F2 dan supervisor.
2. Check-out menyambung shift yang sama. Uji shift melewati tengah malam, jeda dan lembur belum disetujui tanpa mengubahnya menjadi pembayaran otomatis.
3. Ulangi permintaan setelah koneksi putus dan setelah tombol ditekan dua kali. Hasil resmi, audit dan efek downstream tidak berlipat.
4. Uji wajah tidak cocok, gambar layar/foto, bukti sesi lama dan perubahan jam HP. Tidak ada keberhasilan otomatis yang melewati pemeriksaan. Dalam R&D ini merupakan skenario simulasi, bukan bukti kemampuan model nyata.
5. Uji lokasi di luar radius, lokasi lama, lokasi approximate, GPS buruk dan penempatan lintas outlet. Setiap kondisi memberi alasan dan jalur penyelesaian.
6. Uji izin kamera/lokasi ditolak, layanan verifikasi gagal dan kondisi offline. Pengajuan dapat dilacak tanpa ditandai hadir terverifikasi atau absen final secara keliru.
7. Koreksi yang disetujui memperbarui catatan dan ringkasan satu kali. Penolakan mempertahankan nilai sebelumnya dan alasan dapat dilihat pemohon.
8. Staf mengubah status task dari mobile. Desktop, My Day dan histori menampilkan Task ID serta pelaku yang sama. Diskusi dan lampiran mengikuti izin task.
9. Notifikasi membuka objek yang tepat. Akun di luar cakupan, akun nonaktif, URL langsung dan unduhan tidak membocorkan data. Payroll tetap khusus Manager HRD.
10. Jalankan Reception → Therapist → Attendant → Supervisor → POS → HRD. Presensi kerja, kunjungan tamu, layanan, pembayaran dan KPI tetap mempunyai status masing-masing.
11. Uji instalasi, pembaruan aplikasi, pencabutan sesi, cache setelah logout dan perangkat nyata Android/iPhone. Laporkan build yang benar-benar diuji dan fitur yang masih mock.
12. Hapus dataset demo di lingkungan R&D tanpa menyentuh data lain. Tidak ada wajah, kontak atau dokumen nyata dari referensi yang masuk fixture.

Target awal untuk review adalah seluruh skenario akses dan duplikasi di atas lulus, seluruh kejadian terverifikasi mempunyai identitas/shift/waktu/sumber yang dapat ditelusuri, dan status sementara terlihat konsisten. Untuk pilot perangkat nyata, usulkan minimal 95% presensi normal selesai dalam 20 detik sejak aksi dimulai pada kondisi jaringan/lokasi yang telah ditentukan. Angka ini target pengujian yang perlu dikalibrasi, bukan hasil yang sudah dicapai. Ukur juga kegagalan teknis, kebutuhan koreksi, latensi sinkronisasi dan hasil pengujian liveness/matching pada variasi perangkat serta kondisi penggunaan.

## 11. Keputusan lanjutan dan bahan master prompt

| Keputusan | Penanggung jawab | Kapan diperlukan |
| --- | --- | --- |
| Daftar HP/OS tester dan kebutuhan perangkat bersama | IT dan Operations | Sebelum M2 dan penetapan versi minimum |
| Lokasi resmi, radius, shift, toleransi dan alur pengecualian | HRD dan Operations | Sebelum pilot presensi nyata |
| SDK liveness/matching, integrasi Flutter, biaya dan lokasi pemrosesan | Engineering dan pemilik data | Sebelum M3 |
| Pemberitahuan/persetujuan yang sesuai, akses, retensi dan alternatif biometrik | HRD dan penanggung jawab privasi/legal | Sebelum data biometrik nyata dikumpulkan |
| Akun developer, signing dan jalur distribusi perusahaan | IT dan pemilik akun | Sebelum distribusi build |
| Batas aksi POS per role serta kebutuhan printer/terminal | Operations dan tim POS | Sebelum aktivasi transaksi nyata |

Dokumen ini cukup untuk melanjutkan rancangan M1 dengan simulasi. Keputusan yang belum tersedia ditulis sebagai asumsi atau dependency, bukan diisi dengan data produksi.

Instruksi handoff: baca NB F1–F8 dan addendum ini, pertahankan 77 NV desktop yang sudah disepakati, lalu petakan layar mobile dan layanan bersama. Kerjakan lima navigasi dan presensi terlebih dahulu. Sertakan state berhasil, menunggu, gagal dan perlu pemeriksaan. Untuk setiap hasil, laporkan apakah berupa visual HTML, aplikasi native terpasang, layanan server, simulasi atau fitur teruji perangkat. Jangan menyebut verifikasi wajah aktif hanya karena kamera terbuka atau wajah terdeteksi. Sertakan bukti uji, langkah menjalankan build dan checkpoint pekerjaan berikutnya. Seluruh prototype memakai R&D dan data dummy.
