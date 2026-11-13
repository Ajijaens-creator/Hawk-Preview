# NB F4 · Rekrutmen sampai Penempatan

Portal kelima HAWK ERP · HRD Operations dan Human Growth · R&D · Data dummy

[NB induk](README.md) · [F1](F1-FONDASI-DAN-BERANDA.md) · [F2](F2-OPERASI-HRD-DAN-DIREKTORI.md) · [F3](F3-PLANNER-DAN-WORKPLACE.md) · [Preview](../hrd-rnd/index.html) · [Panduan brand](../HAWK-BRAND-GUIDELINES.md)

## Tujuan dan dependensi

Hubungkan kebutuhan tenaga per outlet, posisi dan shift dengan lowongan, screening, interview, kontrak, onboarding dan penempatan. Gunakan organisasi dan cakupan F1, Employee ID dan histori efektif F2, serta Task ID dan workflow Planner F3. Kebutuhan dapat dibuat manual pada F4 dan kemudian diterima dari Manpower F5. Kandidat membuka tiga layar publik. Aksi internal tersedia melalui Rekrutmen dan tautan ke Karyawan atau Tugas sesuai cakupan.

## Dua belas layar dan kriteria penerimaan

| ID | Layar | Isi dan interaksi | Kriteria penerimaan |
| --- | --- | --- | --- |
| F4-NV01 | Landing Karier | Lowongan aktif, filter divisi, posisi dan outlet, kartu lowongan dan state kosong. | Kandidat dapat menemukan posisi Therapist di Spa Ubud tanpa login internal. Lowongan ditutup tampil sebagai tidak menerima lamaran bila dibuka dari tautan lama. |
| F4-NV02 | Detail Lowongan | Tanggung jawab, kualifikasi, outlet, shift dan tombol Lamar. Tautan website, media sosial dan QR membawa ID lowongan dan kode kanal jika tersedia. | Link dan QR membuka lowongan yang sama. Kode kanal tampil pada jejak lamaran dan sumber yang dijawab kandidat tersimpan tersendiri. |
| F4-NV03 | Formulir Lamaran | Motivasi, sumber, pengalaman, respons situasional, kesiapan shift, lokasi, ekspektasi gaji, siap mulai, pilihan interview WITA, CV, sertifikat dan portofolio. Jawaban tulis tangan memiliki alternatif ketik. | Therapist dan Receptionist menampilkan pertanyaan berbeda. Kandidat meninjau sebelum kirim dan menerima konfirmasi. Retry tidak membuat lamaran tambahan. |
| F4-NV04 | Permintaan Tenaga & Kelola Lowongan | Permintaan per outlet/divisi, formasi, shift, skill, PIC, persetujuan, versi kriteria, publikasi dan tautan/QR. Tautkan Workplan dan sumber kebutuhan. | Lowongan yang dipublikasikan memakai formasi dan outlet yang disetujui. Draft dan lowongan internal tidak muncul di landing publik. |
| F4-NV05 | Pipeline Kandidat | Filter posisi, outlet, kanal, status dan kebutuhan klarifikasi. Tampilkan jumlah lamaran, selesai screening, shortlist dan undangan. | Kandidat yang melamar dua posisi memiliki dua Application ID pada satu profil setelah identitas dikonfirmasi. Rincian dibuka dari tahap yang sama. |
| F4-NV06 | Detail Kandidat & AI Screening | Bukti per kriteria, status Terpenuhi, Perlu Klarifikasi atau Tidak Sesuai, versi kriteria dan catatan reviewer. Buat kartu klarifikasi bila diperlukan. | Informasi yang belum tersedia menghasilkan klarifikasi. Reviewer memilih shortlist sesuai kapasitas interview. Klik bukti membuka jawaban atau CV yang sesuai izin. |
| F4-NV07 | Jadwal Interview | Kandidat, pewawancara, slot WITA, status konfirmasi, riwayat jadwal, Google Calendar dan Meet. | Penjadwalan ulang memakai Event ID yang sama. Kegagalan sinkron ditampilkan dan dapat dicoba kembali tanpa membuat undangan ganda. |
| F4-NV08 | Interview & Uji Praktik | Rubric, penilaian per kompetensi, bukti, reviewer dan catatan. | Therapist memakai demonstrasi treatment dan kebersihan. Receptionist memakai simulasi reservasi, penanganan tamu dan pencatatan transaksi. |
| F4-NV09 | Keputusan & Penawaran | Bukti penilaian, alasan keputusan, pihak yang menyetujui, status penawaran, respons dan tanggal mulai. | Perubahan keputusan tercatat. Penawaran yang diterima membuka tahap kontrak. Jalur ditolak, batal dan kandidat mengundurkan diri memiliki status sendiri. |
| F4-NV10 | Kontrak & Verifikasi Dokumen | Versi kontrak, KTP/foto pada tahap yang memerlukan, status tanda tangan, tanggal efektif dan dokumen final berizin. | Reviewer berwenang melihat versi dan jejak verifikasi. Setelah konversi profil, kontrak terhubung ke Employee ID. Pengguna di luar cakupan mendapat akses ditolak. |
| F4-NV11 | Onboarding HRD & Human Growth | Checklist administratif, pelatihan, mentor, target kompetensi, bukti dan verifikasi supervisor. | Tugas tiap tim muncul di Planner F3 dengan PIC dan tenggat. Mengulang pembuatan paket onboarding membuka tugas yang sama. |
| F4-NV12 | Penempatan, Akun & Role | Outlet, posisi, shift, atasan, tanggal efektif, akun, workplace dan cakupan yang diminta. | Setelah persetujuan dan tanggal efektif, satu profil serta penempatan muncul di roster F2. Akun memperoleh role yang disetujui. Perubahan dapat diaudit. |

## Template formulir dan screening

- **Spa Therapist.** Teknik treatment, durasi pengalaman per teknik, sertifikasi, kapasitas sesi per shift, bahasa, preferensi outlet, dan respons ketika tekanan membuat tamu tidak nyaman.
- **Spa Receptionist.** Pengalaman front desk, volume reservasi, booking/POS, bahasa, penanganan tamu serta respons ketika dua tamu memesan slot yang sama.
- **Posisi lain.** Spa Manager, Spa Supervisor, Spa Attendant, Housekeeping, Security, Content Creator, Admin Marketing, Fotografer, Videografer, Social Media Admin, Sales, Admin General Accounting dan Finance. Template membedakan bukti kerja sesuai peran.
- **Pencocokan.** Saat lamaran masuk, antrekan screening dengan snapshot kriteria. Gunakan hanya bukti yang relevan dengan pekerjaan. Foto, KTP, ciri tulisan tangan dan asesmen kepribadian dikecualikan dari penilaian AI. Reviewer menentukan undangan dan keputusan. Status proses mencakup menunggu, selesai dan gagal dengan retry.
- **Dokumen.** Simpan lampiran dengan izin per objek dan jejak akses. Preview memakai dokumen sintetis. Untuk cloud, validasi jenis dan ukuran file serta periksa file sebelum akses internal.

## Kontrak data dan integrasi

| Objek | Field dan relasi minimum |
| --- | --- |
| Permintaan dan lowongan | Requisition ID, Vacancy ID, outlet/divisi, shift, posisi, formasi, template form, versi kriteria, status dan Task ID sumber. |
| Kandidat dan lamaran | Candidate ID, Application ID, Vacancy ID, kanal, jawaban, dokumen, waktu kirim dan histori tahap. |
| Screening dan interview | Application ID, versi kriteria, bukti per kriteria, status run, reviewer, rubric, Interview ID, Calendar Event ID dan waktu WITA. |
| Penawaran dan kontrak | Offer ID, Contract ID, Application ID, versi, status, waktu persetujuan dan tanggal efektif. |
| Onboarding dan penempatan | Employee ID, checklist dan Task ID F3, Assignment ID F2, tanggal efektif, approver dan scope akun F1. |

**Pipeline.** Lamaran Masuk → Screening/Klarifikasi → Shortlist → Interview → Uji Praktik → Keputusan → Penawaran & Kontrak → Onboarding → Penempatan Aktif. Simpan aktor dan alasan untuk transisi keputusan. Tahap pipeline dan status kartu Planner tercatat pada objek masing-masing. F5 membaca formasi yang masih terbuka dan penempatan aktif. F6 membaca cohort onboarding dan kesiapan untuk Quality of Hire.

**Akses.** Halaman publik membaca lowongan yang dipublikasikan dan menerima lamaran. Recruiter, reviewer, HG dan supervisor melihat data sesuai penugasan. Akses kontrak, identitas dan dokumen personal mengikuti izin khusus. Akun produksi dibuat berdasarkan persetujuan scope dan tanggal efektif. Payroll tetap khusus Manager HRD.

## Urutan visual dan review

1. **NV04 → NV02 → NV03 → NV05 → NV06.** Buat kebutuhan Therapist Spa Ubud, buka tautan lowongan, kirim lamaran dummy, telusuri kecocokan dan buat satu kartu klarifikasi.
2. **NV07 → NV08 → NV09.** Jadwalkan dan ubah slot, isi rubric, catat keputusan serta respons penawaran.
3. **NV10 → NV11 → NV12.** Simulasikan tanda tangan dan verifikasi, cek tugas HRD/HG serta verifikasi supervisor, lalu periksa satu profil di roster.
4. Ulangi formulir dan rubric untuk Receptionist. Uji lowongan ditutup, retry, akses ditolak, lampiran invalid dan tampilan mobile.

## Bahan master prompt Cloud Developer

Lampirkan NB ini, F1–F3, preview, inventaris sidebar dan panduan brand. Minta pemetaan rute ke 12 ID NV, kontrak data, aturan akses server, fixture bersama dan bukti jalur publik hingga roster. Tetapkan domain karier, endpoint Google Calendar/Meet, penyimpanan dokumen dan metode tanda tangan saat integrasi disetujui. Pada R&D, labeli screening, undangan, penandatanganan dan provisioning sebagai simulasi. Tautan lokal pada preview menjadi acuan navigasi, sementara QR publik membutuhkan URL deployment yang dapat diakses kandidat.
