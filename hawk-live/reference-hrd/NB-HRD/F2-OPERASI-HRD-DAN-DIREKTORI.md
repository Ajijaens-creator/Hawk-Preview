# NB F2 · Operasi HRD & Direktori

Portal kelima HAWK ERP · HRD Operations · R&D · Data dummy

[NB induk](README.md) · [NB F1](F1-FONDASI-DAN-BERANDA.md) · [F1–F8](FASE.md) · [Preview](../hrd-rnd/index.html) · [Inventaris GajiHub](../hrd-rnd/REFERENSI.md) · [Panduan brand](../HAWK-BRAND-GUIDELINES.md)

## Tujuan dan dependensi

Gunakan identitas, organisasi, cakupan akses, penempatan efektif, audit dan fixture 158 orang dari F1. Dari Roster F1, klik orang untuk membuka Detail Karyawan F2 dengan Employee ID yang sama. F2 menjadi sumber jadwal, presensi dan riwayat penempatan untuk Planner F3, onboarding F4, Manpower F5, Kinerja F6 dan rekonsiliasi F7. Status tugas dari F3 tidak mengubah keputusan resmi pengajuan.

Pertahankan shell HAWK dan urutan GajiHub. Direktori, Detail dan Impor berada di Karyawan. Approval Presensi, Jadwal Kerja, Presensi, Izin & Cuti dan Kunjungan Klien berada di Kehadiran. Approval, Pelacakan Lokasi, Klien dan Timeline memakai entri yang sudah ada.

## Dua belas layar dan kriteria penerimaan

| ID | Layar | Isi dan interaksi | Kriteria penerimaan |
| --- | --- | --- | --- |
| F2-NV01 | Direktori Karyawan | Cari nama/ID, filter outlet, divisi, posisi dan status. Tab Informasi Pribadi, Kontak, Kepegawaian dan Login ESS. Aksi tambah, impor dan ekspor sesuai izin. | Roster awal 158 orang. Spa Bhisma + Receptionist menampilkan lima orang. Buka detail dengan ID yang sama dari F1. Ekspor memakai cakupan yang diizinkan. |
| F2-NV02 | Detail Karyawan | Profil, kontak, kepegawaian, dokumen dummy, akun ESS, kontrak dan penempatan historis. Form perubahan dengan tanggal efektif dan audit. | Penempatan baru berlaku pada tanggal yang dipilih. Histori tetap dapat ditelusuri. Status ESS tersedia tanpa menampilkan kredensial. Informasi payroll mengikuti izin dan fase F7. |
| F2-NV03 | Jadwal Kerja | Jadwal tetap dan shift, penugasan per orang/outlet, tanggal efektif, pratinjau konflik dan riwayat. | Ubah shift besok, cek tanggal efektif di Presensi, pertahankan jadwal tanggal sebelumnya, dan tolak penugasan yang tumpang tindih. |
| F2-NV04 | Presensi | Harian dan Ringkasan. Tanggal, outlet, shift, status, masuk/keluar, istirahat, lembur, keterlambatan dan bukti. Aksi ajukan koreksi. | Data kosong tampil sebagai Belum Ada Status. Koreksi menunggu review dan nilai presensi berubah setelah disetujui. Ringkasan memakai hasil persetujuan yang sama. |
| F2-NV05 | Approval Presensi | Antrean koreksi, bukti, nilai sebelum/sesudah, PIC, keputusan dan histori. | Tolak dengan alasan dan verifikasi nilai awal tetap. Setujui koreksi lain dan verifikasi pembaruan presensi serta audit tercatat sekali. |
| F2-NV06 | Izin & Cuti | Saldo, kalender, periode, pengajuan dan histori. Kategori tahunan, khusus, sakit, izin, tidak dibayar dan libur nasional. | Pengajuan masuk ke Approval. Persetujuan memperbarui saldo sesuai kategori. Penolakan mempertahankan saldo. Uji permintaan yang bertabrakan. |
| F2-NV07 | Approval | Antrean lintas pengajuan, filter jenis dan status, PIC, tahapan, keputusan dan alasan. | Buka pengajuan yang sama dari modul asal dan Approval. Hanya reviewer berwenang yang dapat memutuskan. Keputusan tahap antara tidak memfinalkan pengajuan bertingkat. |
| F2-NV08 | Kunjungan Klien | Filter tanggal, lokasi, klien, petugas dan organisasi. Ringkasan, waktu masuk/keluar, bukti dan tautan Klien/Pelacakan Lokasi. | Buka satu kunjungan dari daftar dan dari profil klien. Kedua jalur menunjukkan Visit ID, waktu dan bukti yang sama. |
| F2-NV09 | Pelacakan Lokasi | Peta atau riwayat titik dummy, waktu WITA, konteks presensi/kunjungan dan status validasi. | Pengguna yang berwenang dapat membuka sumber titik. Pengguna di luar cakupan menerima state akses ditolak. Data kosong atau GPS tidak tersedia tampil jelas. |
| F2-NV10 | Klien | Direktori klien dummy, wilayah, status, kontak sesuai izin dan histori kunjungan. | Buka klien dan telusuri riwayat kunjungannya ke NV08. Klien tanpa kunjungan memiliki state kosong. |
| F2-NV11 | Timeline | Pengumuman, agenda dan aktivitas HRD yang boleh dilihat, dengan waktu dan tautan ke objek asal. | Aktivitas yang sudah tercatat dapat ditelusuri. Judul dan detail sensitif tetap mengikuti cakupan objek asal. |
| F2-NV12 | Impor Karyawan | Pilih file dummy, petakan kolom, pratinjau, validasi ID dan referensi organisasi, konfirmasi serta hasil per baris. | Baris invalid menunjukkan alasan sebelum commit. Impor ulang batch yang sama tidak menggandakan profil. Hasil menampilkan jumlah berhasil, dilewati dan gagal. |

## Data dan aturan lintas layar

Presensi karyawan melalui aplikasi Android/iPhone mengikuti [addendum mobile](ADDENDUM-MOBILE-APP-DAN-PRESENSI.md): verifikasi wajah 1:1 dan liveness, lokasi saat aksi, waktu server, shift yang berlaku, sinkronisasi serta koreksi. F2 tetap menjadi sumber catatan resmi dan antrean pemeriksaan. Kamera, wajah dan lokasi pada prototype memakai simulasi berlabel.

- **Identitas dan histori.** Gunakan Employee ID, Assignment ID, Shift ID, Attendance ID, Request ID, Visit ID, Client ID dan Import Batch ID yang stabil. Simpan tanggal efektif dan tanggal pencatatan. Filter dan tautan memakai ID.
- **Jadwal dan presensi.** Kaitkan log ke penempatan serta jadwal yang berlaku saat pekerjaan berlangsung. Simpan waktu dengan zona yang konsisten dan tampilkan WITA. Log awal dan hasil koreksi dapat ditelusuri melalui audit. Jam kerja yang belum diverifikasi tampil sebagai data sementara pada downstream.
- **Approval dan saldo.** Satu Request ID dibaca dari modul asal dan inbox. Keputusan menyimpan aktor, tahap, alasan, waktu dan bukti. Pembaruan status, audit serta ledger cuti dijalankan secara konsisten dan tahan retry.
- **Izin dan dokumen.** Staf HRD melihat cakupan yang diberikan. Supervisor melihat tim yang berwenang ditinjau. Dokumen, lokasi, ekspor dan audit mengikuti izin objek. Nominal gaji dan slip khusus Manager HRD. Pada cloud, aturan yang sama berlaku pada server.
- **R&D.** Pakai file, koordinat, dokumen dan bukti sintetis. Tandai simulasi. Demo impor memberi pratinjau dan hasil lokal dengan konfirmasi. Perubahan demo mengikuti mekanisme penghapusan dataset F1.

## Urutan visual dan review

1. **NV01 → NV02 → NV03 → NV04 → NV05.** Filter Spa Ubud, buka therapist, ubah shift efektif, ajukan koreksi presensi dan verifikasi hasil di Ringkasan.
2. **NV06 → NV07 → NV11.** Ajukan cuti, cek keputusan, saldo dan aktivitas yang diizinkan.
3. **NV10 → NV08 → NV09.** Buka satu klien, telusuri kunjungan dan periksa bukti lokasi dengan dua cakupan akses.
4. **NV12 → NV01 → NV02.** Uji batch dummy dengan baris valid, duplikat dan outlet tidak dikenal. Cek hasil impor dan histori.
5. Uji desktop, mobile, keyboard, data kosong, konflik, akses ditolak dan penyimpanan gagal. Tab serta dialog mengikuti NV induknya.

## Bahan master prompt Cloud Developer

Berikan dokumen ini bersama NB F1, preview, inventaris sidebar dan panduan brand. Minta pemetaan rute ke 12 ID NV, fixture bersama, model izin server, kontrak data, dan bukti uji empat jalur di atas. Sertakan state yang masih simulasi dan titik integrasi F3–F7. Fase ini menggunakan data dummy dan jalur R&D yang sama.
