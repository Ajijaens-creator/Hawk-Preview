# Inventaris referensi HAWK HRD

[Sumber Drive Modul HRD](https://drive.google.com/drive/folders/1U4RaIF_9y6Y9eK10SNiOK9FcyGTdneha). Ditinjau 29 tangkapan layar pada 13 November 2026. Inventaris mencatat label dan fungsi yang terlihat. Data personal dan nilai payroll dari gambar dikecualikan dari prototipe.

## Sidebar GajiHub

1. Beranda
2. Karyawan
3. Kehadiran
   - Approval Presensi
   - Jadwal Kerja
   - Presensi
   - Izin & Cuti
   - Kunjungan Klien
4. Pelacakan Lokasi
5. Rekrutmen
   - Profil
   - Manajemen Rekrutmen
   - Lowongan Pekerjaan
   - Kandidat
6. Payroll
7. Keuangan
   - Kasbon dan Reimburse adalah asumsi prototipe berdasarkan kartu Pengaturan Payroll. Submenu Keuangan terlihat tertutup.
8. Approval
9. Timeline
10. Klien
11. Laporan
12. Tugas
13. Pengaturan
14. FAQ

## Fitur yang terlihat dalam referensi

| Folder | Jumlah | Inventaris |
| --- | ---: | --- |
| Beranda | 4 | Cetak, filter widget, usia, agama, pendidikan, jenis kelamin, status perkawinan, masa kerja, jumlah karyawan per bulan dan organisasi, status kerja, kehadiran hari ini, daftar keterlambatan dan izin/cuti, statistik kehadiran, total dan rata-rata gaji, distribusi gaji, gaji per organisasi dan komponen. |
| Karyawan | 5 | Informasi Pribadi, Kontak, Kepegawaian, Payroll, Login ESS. Kuota, tambah karyawan, impor, ekspor, aksi lainnya, filter, cari, urutkan, seleksi baris, buka profil. |
| Kehadiran | 6 | Harian dan Ringkasan, navigasi tanggal, shift, status, masuk/keluar, istirahat, lembur, tracking, keterlambatan, kebijakan presensi, filter, impor dan ekspor. Izin & Cuti mencakup enam kategori, saldo, periode, daftar pengajuan dan kebijakan. Kunjungan Klien mencakup filter tanggal/lokasi/organisasi/jabatan, KPI kunjungan, rincian karyawan/lokasi/klien, tren bulanan dan kebijakan. |
| Pelacakan Lokasi | 0 | Menu dan tautan tracking terlihat pada tangkapan layar Presensi. Detail layar merupakan rancangan demo. |
| Rekrutment | 1 | Empat submenu tampak terbuka dalam tangkapan layar yang sedang menampilkan detail Payroll. Isi halaman rekrutmen merupakan rancangan demo. |
| Payroll | 3 | Navigasi bulan, grup slip, periode, jumlah karyawan, siap bayar dan sudah bayar, slip tidak tetap, generate payroll, pengaturan slip, detail per karyawan, bank, nominal, status, unduhan massal slip dan perhitungan pajak, reset pengali dan nominal, filter, impor dan ekspor. |
| Approval | 1 | Menunggu Persetujuan, Disetujui, Ditolak, filter jenis, kebijakan approval, nama, tipe, keterangan, progres, tanggal pengajuan dan tanggal kegiatan. |
| Laporan | 1 | Payroll, PPH 21/26, BPJS dan Coretax. Semua 19 entri dari layar tersedia pada katalog prototipe. |
| Pengaturan | 8 | Perusahaan, Payroll, Kehadiran, Cuti, Akun & Pengguna, Layout & Template, Integrasi, Tugas. Kartu yang terlihat tersedia dalam katalog, termasuk alur bisnis, approval, audit, kalender, COA, lembur, validasi presensi, lokasi, pengguna, peran, Time Tracker, notifikasi dan template. Isi Integrasi merupakan asumsi demo. |

## Cakupan prototipe

Buka `index.html` dari folder ini. Pilih peran di bagian atas untuk mencoba Staf HRD dan Manager HRD. Menu, kartu dan nama baris membuka tampilan atau detail. Pencarian dan filter bekerja pada tabel. Tambah karyawan, pengajuan, keputusan approval, status siap bayar dan perubahan pengaturan menggunakan data sesi. Muat ulang untuk kembali ke kondisi awal.

Payroll, data payroll di profil dan Beranda, katalog laporan dalam referensi, pengaturan Payroll, layout slip dan template ekspor dibatasi oleh peran demo. Pergantian peran menutup dialog dan mengembalikan pengguna ke Beranda apabila halaman saat ini dibatasi. Pembatasan ini mendemonstrasikan pengalaman UI. Implementasi produksi memerlukan penegakan otorisasi di server.

Layar pengaturan dan laporan menggunakan pratinjau. Impor/ekspor massal, reset payroll, perhitungan pajak, pembayaran, GPS, pengiriman notifikasi dan integrasi ERP tercatat dalam inventaris sebagai referensi. Prototipe berjalan lokal dan berdiri sendiri dengan data buatan serta perubahan dalam memori.
