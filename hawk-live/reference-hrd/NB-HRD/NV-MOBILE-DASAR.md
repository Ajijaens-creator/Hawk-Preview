# NV Dasar · JAENS Mobile · Glass Edition V02

14 November 2026 · Model UX/UI interaktif · R&D / data dummy

[Buka preview satu file](../hrd-rnd/mobile/preview.html) · [Panduan penggunaan](../hrd-rnd/mobile/README.md) · [Brief mobile lengkap](ADDENDUM-MOBILE-APP-DAN-PRESENSI.md)

## Arah visual

Lima navigasi tetap: **Beranda, Pekerjaan, Presensi, Inbox, Saya**. Ikon garis disertai nama, tombol check-in menjadi aksi utama, dan setiap layar memiliki informasi serta tindakan yang ringkas. Charcoal, ivory dan gold mengikuti brand JAENS. Hijau menandai berhasil/terverifikasi dengan teks pendamping.

Pada HP, aplikasi mengisi layar dan navigasi tetap di bawah. Pada desktop, preview ditampilkan dalam bingkai ponsel dengan indeks layar. Pilihan peran tersedia di panel desktop lebar dan pada **Saya → Ganti peran demo**.

## Penyempurnaan V02

Background interior Jaens Spa dipadukan dengan lapisan kaca transparan, gradasi gold dan forest, serta foto profil. Nama JAENS dan mark J digunakan pada header, profil, dialog portal dan judul tab. Tampilan tetap mengutamakan tombol presensi serta label yang mudah dibaca.

Lima layar ditinjau pada 390 × 844, disertai tampilan desktop. Pada 320 × 740 lebar halaman tetap 320 piksel dan kelima tombol navigasi 58 × 58 piksel. Alur check-in Receptionist sampai bukti presensi berhasil dicoba, foto kedua peran sesuai pilihan pengguna, dan empat peran dapat diganti. Sintaks JavaScript lulus. Catatan V01 di bawah merupakan verifikasi sebelumnya; V02 tidak menambahkan layanan biometrik/GPS nyata.

## Lima layar utama

| ID | Fokus | Detail yang bisa dibuka |
| --- | --- | --- |
| M-NV01 · Beranda | Apa yang perlu diketahui dan dilakukan sekarang | Shift, status masuk, check-in/out, layanan berikutnya, jadwal, cuti, HRD Care dan materi belajar |
| M-NV02 · Pekerjaan | Tugas yang jelas, PIC dan batas waktu | Checklist, perubahan status, diskusi, bukti demo, histori dan agenda |
| M-NV03 · Presensi | Catat hadir dan lihat hasilnya | Lokasi simulasi, verifikasi wajah ilustrasi, bukti, jeda, riwayat dan koreksi |
| M-NV04 · Inbox | Komunikasi dan tindak lanjut dalam satu tempat | Chat tim/pribadi/HRD, pencarian, notifikasi, pengajuan dan approval sesuai peran |
| M-NV05 · Saya | Kebutuhan pribadi terkait pekerjaan | Profil samaran, penempatan, dokumen contoh, cuti, pelatihan, bantuan dan kontrol demo |

Subhalaman/dialog mengikuti lima NV induk. Jumlah ini tidak mengubah 77 NV desktop F1–F8.

## Pemeriksaan model dasar V01

- Tampilan diperiksa di browser pada ukuran HP 390 × 844. Pada 320 × 740 tidak ada overflow horizontal halaman dan lima area navigasi berukuran 60 × 60 piksel.
- Check-in sampai bukti dan check-out berhasil dijalankan dengan data simulasi.
- Checklist, perubahan Priority → Dikerjakan → Review serta nama pelaku muncul pada histori tugas.
- Pesan demo muncul di percakapan setelah dikirim, dan tetap tersedia setelah halaman dibuka ulang.
- Pengajuan cuti masuk ke daftar Pengajuan dengan status Menunggu.
- Persona Supervisor dapat memutuskan approval contoh dengan catatan keputusan.
- Persona staf Marketing menampilkan pekerjaan kantor serta materi komunikasi brand.
- Versi satu file dimuat di browser dan alur check-out dijalankan darinya. Pemeriksaan sintaks JavaScript lulus. Tidak ditemukan error JavaScript pada sesi browser yang diperiksa.

Pengujian ini memvalidasi model browser. Belum memvalidasi instalasi Android/iOS, biometrik nyata, GPS, jaringan offline, keamanan server atau sinkronisasi dengan portal HRD lama.

## Tampilan yang tersimpan

- [M-NV01 Beranda](../hrd-rnd/mobile/screenshots/M-NV01-beranda.jpg)
- [M-NV02 Pekerjaan](../hrd-rnd/mobile/screenshots/M-NV02-pekerjaan.jpg)
- [M-NV03 Presensi](../hrd-rnd/mobile/screenshots/M-NV03-presensi.jpg)
- [M-NV04 Inbox](../hrd-rnd/mobile/screenshots/M-NV04-inbox.jpg)
- [M-NV05 Saya](../hrd-rnd/mobile/screenshots/M-NV05-saya.jpg)
- [Receptionist Spa Ubud](../hrd-rnd/mobile/screenshots/M-NV01-reception.jpg)
- [Preview desktop Glass V02](../hrd-rnd/mobile/screenshots/JAENS-Mobile-Glass-desktop.jpg)

Nama, penempatan dan catatan kerja adalah data dummy. Foto Therapist dan Receptionist dipilih langsung oleh pengguna; foto dua persona lain sintetis. Lihat [sumber gambar](../hrd-rnd/mobile/ASSET-SOURCES.md).
