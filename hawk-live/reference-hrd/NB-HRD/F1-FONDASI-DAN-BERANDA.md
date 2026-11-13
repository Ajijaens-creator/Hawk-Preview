# NB F1 · Fondasi dan Beranda HAWK HRD

Portal kelima HAWK ERP · HRD & Human Growth · R&D · Data dummy

[Acuan induk](README.md) · [Brief F1–F8](FASE.md) · [Preview](../hrd-rnd/index.html) · [Inventaris GajiHub](../hrd-rnd/REFERENSI.md) · [Panduan brand HAWK](../HAWK-BRAND-GUIDELINES.md)

## Tujuan dan cakupan

F1 menyediakan pintu masuk HRD, organisasi, roster dan penempatan ringkas, akun dan cakupan akses, konfigurasi dasar, audit, serta pengelolaan dataset demo. F2 menangani direktori operasional lengkap, dokumen personal, perubahan shift, presensi dan cuti. Payroll dan laporan keuangan dikembangkan di F7. Pada F1, tujuan navigasi fase berikutnya menampilkan status fase dan akses yang relevan.

Shell memakai charcoal, ivory dan gold HAWK. Logo HAWK membuka pemilih portal. Tambahkan HRD sebagai portal kelima dengan mempertahankan empat entri yang sudah ada. Gunakan rute deployment yang sudah terverifikasi. Urutan sidebar mengikuti inventaris GajiHub dan penambahan HAWK yang tercatat di NB induk. Submenu Keuangan masih bersifat sementara.

## Delapan layar dan kriteria penerimaan

| ID | Layar | Isi, interaksi dan state | Kriteria penerimaan |
| --- | --- | --- | --- |
| F1-NV01 | Beranda HRD | Shell, pemilih portal, cakupan organisasi, peran, ringkasan roster, empat outlet, kehadiran dan antrean dummy. Klik jumlah orang membuka roster pada cakupan aktif. | Total 158 muncul pada cakupan perusahaan. Filter Spa Ubud menunjukkan 30 orang dan kartu membuka roster yang sama. Sidebar tersedia di ponsel. |
| F1-NV02 | Struktur Organisasi | Telusuri perusahaan, unit, outlet atau divisi, lalu posisi. Node menampilkan jumlah orang dan tautan roster. PC dan Commercial menampilkan headcount belum ditetapkan. | Empat outlet dan Office dapat dibuka. Setiap outlet merekonsiliasi 25 Therapist dan 5 Receptionist. PC dan Commercial tidak menambah total. |
| F1-NV03 | Roster dan Penempatan | Tabel dengan pencarian nama/ID dan filter outlet, divisi, posisi serta shift. Detail menampilkan profil ringkas, outlet induk, jabatan, atasan dan tanggal efektif. | Filter Spa Bhisma dan Receptionist menghasilkan lima orang. Klik nama membuka penempatan dengan ID yang sama. Kombinasi tanpa hasil menawarkan reset filter. |
| F1-NV04 | Akun, Role dan Akses | Daftar akun demo, role, cakupan, status dan matriks izin. Pemilih peran demo tersedia untuk verifikasi Staf HRD dan Manager HRD. | Pergantian peran menutup detail terbatas. Uji navigasi langsung, API dan ekspor pada implementasi cloud. Data gaji serta field terbatas hanya tersedia bagi Manager HRD. |
| F1-NV05 | Pengaturan Perusahaan | Identitas, kalender, kebijakan approval, penomoran dan template. Detail menunjukkan konfigurasi, status dan riwayat penyimpanan. | Simpan satu perubahan demo, periksa hasil dan cari jejaknya di NV07. Pembatalan meninggalkan data awal. |
| F1-NV06 | Pengaturan Sistem | Notifikasi, integrasi, aturan Tugas dan FAQ. Kartu integrasi memperlihatkan status, cakupan dan sumber simulasi. | Integrasi dummy dapat dibuka dan statusnya terbaca. Tampilkan state belum dikonfigurasi dan gagal tanpa menjalankan koneksi produksi. |
| F1-NV07 | Audit Aktivitas | Daftar aktivitas dengan filter waktu, pelaku, jenis aksi dan objek. Detail menampilkan perubahan sebelum/sesudah, tanggal efektif dan waktu pencatatan dalam WITA. | Perubahan pengaturan dan akses demo muncul dengan aktor dan ID objek. Field sensitif mengikuti izin objek. |
| F1-NV08 | Kelola Data Demo R&D | Ringkasan dataset, konfirmasi hapus, state kosong dan opsi memulai kembali dari fixture. | Batal mempertahankan data. Konfirmasi mengosongkan dataset dummy dan Beranda ikut menampilkan state kosong. Uji dengan satu record non-demo yang tetap utuh pada implementasi cloud. |

## Kontrak data bersama

| Objek | Field minimum dan hubungan |
| --- | --- |
| Organisasi | ID entitas, unit bisnis, outlet, divisi dan posisi. Gunakan ID stabil sebagai kunci filter dan relasi. |
| Karyawan | Employee ID, nama samaran, status kerja, penempatan induk dan penanda dataset demo. |
| Penempatan | Employee ID, outlet/divisi, posisi, atasan, shift ringkas, tanggal mulai dan akhir efektif. Histori tetap dapat dibaca sesuai izin. |
| Akun dan cakupan | User ID, role, entitas/outlet/divisi yang diizinkan, status dan tanggal efektif. |
| Audit | Event ID, objek dan ID, pelaku, aksi, waktu pencatatan, tanggal efektif, serta perubahan yang boleh dilihat. |
| Dataset | Dataset ID, penanda demo, status dan jumlah record. Penghapusan memverifikasi cakupan dataset sebelum perubahan. |

**Fixture 158 orang.** Spa Ubud, Spa Santi, Spa Triloka dan Spa Bhisma masing-masing berisi 25 Therapist dan 5 Receptionist. Office berisi 12 Finance & Accounting, 9 Marketing, 4 HRD, 5 Production dan 8 Operations. PC dan Commercial belum memiliki alokasi headcount. Gunakan nama samaran unik dan profil sintetis dari preview. Total dihitung dari roster, sehingga Beranda, organisasi dan daftar orang tetap selaras.

**Izin.** Staf HRD melihat roster dan informasi operasional sesuai cakupan. Manager HRD memperoleh akses yang diizinkan untuk pengaturan dan permukaan payroll. Pemilih peran pada visual merupakan simulasi. Cloud mengambil identitas dan scope dari autentikasi server. Ringkasan umum, payload daftar, audit dan ekspor menerapkan aturan akses yang sama.

## Urutan review visual

1. **NV01 → NV02 → NV03.** Buka Beranda, telusuri Spa Ubud, cocokkan 30 orang, lalu buka salah satu penempatan.
2. **NV04 → NV07.** Ganti peran, cek tampilan akses ditolak dan jejak perubahan demo.
3. **NV05 → NV06 → NV07.** Tinjau konfigurasi perusahaan dan status integrasi, lalu verifikasi satu perubahan tercatat.
4. **NV08 → NV01.** Batalkan satu percobaan hapus, konfirmasi pada percobaan berikutnya, lalu periksa state kosong.
5. Periksa navigasi keyboard, fokus dialog, layout mobile, pencarian tanpa hasil, akses ditolak dan state gagal untuk aksi penyimpanan.

## Bahan master prompt Cloud Developer

Gunakan NB ini sebagai indeks layar dan penerimaan. Sertakan referensi preview, panduan brand, inventaris sidebar, daftar rute yang telah diverifikasi, fixture bersama, aturan role/scope dan kontrak data. Untuk review, minta pemetaan rute ke ID NV, jalur klik desktop/mobile serta bukti uji roster, pembatasan akses, audit dan penghapusan dummy. Konfirmasi urutan portal yang sudah ada dan submenu Keuangan sebelum mengunci navigasi produksi.
