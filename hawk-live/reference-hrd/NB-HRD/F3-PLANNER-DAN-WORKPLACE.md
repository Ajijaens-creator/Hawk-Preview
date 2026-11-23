# NB F3 · Planner & Workplace

Portal kelima JAENS ERP · HRD Operations dan Human Growth · R&D · Data dummy

[NB induk](README.md) · [NB F1](F1-FONDASI-DAN-BERANDA.md) · [NB F2](F2-OPERASI-HRD-DAN-DIREKTORI.md) · [Preview](../hrd-rnd/index.html) · [Panduan brand](../HAWK-BRAND-GUIDELINES.md)

## Tujuan dan dependensi

Menu **Tugas** menjadi ruang kerja HRD Operations dan Human Growth. F3 memakai identitas, organisasi, roster 158 orang, cakupan dan audit F1, serta Employee ID dan tautan ke catatan operasional F2. F4–F8 memakai kartu yang sama untuk tindak lanjut rekrutmen, kapasitas, coaching, anggaran dan Reflection. Pola Board, Calendar, List, Library dan My Tasks mengikuti referensi AJi Creator OS. Tahap dan isi pekerjaan mengikuti proses HRD dan HG.

## Delapan layar dan kriteria penerimaan

| ID | Layar | Isi dan interaksi | Kriteria penerimaan |
| --- | --- | --- | --- |
| F3-NV01 | Workplace | Pilih HRD Operations atau Human Growth. Ringkasan beban per PIC, kartu tanpa PIC, lewat tenggat, blocker, review dan handoff lintas tim. | Klik ringkasan membuka daftar dengan filter yang sesuai. Pengguna hanya melihat workplace dan kartu dalam cakupannya. |
| F3-NV02 | Board | Tujuh kolom Ide, Issue, Workplan, Priority, Dikerjakan, Review dan Selesai. Drag-and-drop, menu Pindahkan ke, pencarian dan filter outlet, PIC, prioritas serta status. | Drag dan menu memakai validasi yang sama. Perpindahan mencatat aktor, waktu WITA, kolom asal dan tujuan. PIC tetap sampai ada penugasan ulang. |
| F3-NV03 | Calendar | Agenda interview, coaching, training dan tenggat. Bedakan waktu sesi dan batas penyelesaian. Klik untuk membuka kartu atau jadwal asal. | Ubah jadwal pada sumber dan cek kalender mencerminkan acara yang sama. Kartu tanpa tenggat tetap tersedia di List. |
| F3-NV04 | List | Tabel tugas dengan outlet/divisi, jenis, PIC, prioritas, status, tenggat dan blocker. Filter tugas tanpa PIC, terlambat dan menunggu review. | Buka kartu dari hasil filter, ubah status dan verifikasi Board serta List menampilkan hasil yang sama. |
| F3-NV05 | Library | SOP, rubric, checklist dan template versi aktif. Contoh onboarding administratif dan verifikasi kompetensi therapist. Pratinjau langkah, PIC berbasis peran dan tenggat relatif sebelum membuat Workplan. | Penerapan template membuat kartu dan langkah yang tertaut. Perubahan versi template berlaku pada penggunaan berikutnya. |
| F3-NV06 | My Tasks | Tugas milik pengguna dan antrean review dari workplace yang dapat diakses. Aksi tambahkan ke My Day. | Penugasan ulang memperbarui daftar kedua PIC. Subtugas dengan PIC tersendiri muncul pada daftar PIC tersebut. |
| F3-NV07 | My Day | Fokus pribadi, agenda hari ini, hambatan dan pekerjaan terbawa. Buka kartu yang sama dari daftar fokus. | Menambah atau melepas fokus tidak mengubah tenggat, PIC atau status tugas. Daily Race F8 dapat membaca komitmen sesuai tanggal dan izin. |
| F3-NV08 | Detail Kartu | Preview, Files & Assets, Discussion, Tasks & Checklist, Activity & History. Tampilkan konteks sumber, PIC, reviewer, prioritas, bukti, percakapan, subtugas dan histori. | Setiap perubahan dapat ditelusuri. Review bisa mengembalikan kartu dengan catatan. Selesai memerlukan checklist dan persetujuan reviewer ketika diwajibkan. |

## Aturan alur dan integrasi

- **Titik masuk.** Dari Reporting, KPI, Manpower, Rekrutmen atau Reflection, tandai temuan sebagai Ide, Issue atau Workplan. Kartu langsung masuk kolom yang dipilih dengan judul, konteks, tautan sumber dan PIC bila tersedia. Pengulangan untuk sumber dan temuan yang sama membuka kartu yang sudah ada.
- **Tahap kerja.** Ide menangkap usulan. Issue mencatat dampak dan respons awal. Workplan menetapkan hasil, PIC, tenggat dan checklist. Priority menandai komitmen yang didahulukan. Dikerjakan memuat progres dan hambatan. Review memeriksa hasil. Selesai mencatat penerimaan. Blocker dapat dicatat pada kartu aktif dengan alasan, pihak yang ditunggu dan tindakan berikutnya.
- **Status domain.** Tahap kandidat, keputusan cuti, kontrak dan hasil KPI berasal dari modul masing-masing. Memindahkan kartu mengubah status pekerjaan. Tautan kartu membawa pengguna ke tindakan resmi di modul asal.
- **Handoff.** Gunakan satu PIC utama, kontributor, reviewer dan prasyarat bila ada. HRD menyelesaikan administrasi onboarding. HG menangani kompetensi dan latihan. Supervisor outlet memverifikasi praktik. Tim berwenang membuka kartu atau rangkaian subtugas yang sama.
- **Reporting.** Tampilkan status tindak lanjut dari kartu terkait. Daily dan Weekly Race membuka kartu asli. Monthly Reflection membaca bukti terverifikasi. Keputusan STRACON dapat membuat Workplan tertaut. KPI tetap dihitung dari hasil kerja yang memenuhi definisi metrik.

## Kontrak data dan akses

| Objek | Field minimum |
| --- | --- |
| Tugas | Task ID, workplace, cakupan, source type/ID, finding ID, judul, tahap, prioritas, PIC, reviewer, tenggat, blocker, parent ID dan penanda demo. |
| Event tugas | Event ID, Task ID, aktor, waktu, perubahan sebelum/sesudah dan alasan bila diperlukan. Simpan event status bersama perubahan kartu. |
| Bukti dan percakapan | Asset ID atau Message ID, Task ID, penulis, waktu, izin sumber dan referensi checklist. |
| Agenda dan fokus | Event ID sumber, waktu mulai/akhir, zona waktu, serta pilihan fokus berdasarkan User ID, Task ID dan tanggal WITA. |
| Template | Template ID dan versi, langkah, peran PIC, tenggat relatif dan syarat review. |

Cakupan workplace dan izin objek asal berlaku untuk Board, pencarian, notifikasi, tautan dan lampiran. Gunakan identitas server untuk aktor pada cloud. Pergantian PIC dan perpindahan status dicatat sebagai event terpisah. Jika dua orang mengubah kartu yang sama, tampilkan konflik dan muat status terbaru. Nominal, slip dan lampiran payroll tetap mengikuti izin Manager HRD.

## Urutan visual dan review

1. **NV01 → NV02 → NV08 → NV06 → NV07.** Tandai gap utility Spa Ubud sebagai Issue, tetapkan PIC, pindahkan ke Workplan, lalu masukkan ke My Day. Periksa aktor dan PIC pada riwayat.
2. **NV05 → NV04 → NV03.** Terapkan template onboarding dummy. Periksa subtugas HRD dan HG, tenggat serta agenda.
3. **NV08 → NV02.** Tambah diskusi dan bukti, uji penutupan sebelum checklist lengkap, minta revisi, lalu selesaikan setelah review.
4. Uji klik sumber, penandaan ulang, konflik status, filter kosong, akses lintas workplace, dan pemindahan lewat keyboard atau ponsel.

## Bahan master prompt Cloud Developer

Lampirkan NB ini bersama F1, F2, preview dan panduan brand. Minta pemetaan rute ke delapan ID NV, jalur desktop/mobile, fixture HRD dan HG, contoh event audit, serta bukti pengujian. Gunakan simulasi sumber F4–F8 saat modul tersebut belum tersedia dan pertahankan referensi ID agar dapat disambungkan kemudian.
