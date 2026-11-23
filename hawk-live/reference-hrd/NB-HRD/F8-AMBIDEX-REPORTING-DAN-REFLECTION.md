# NB F8 · AmbideX, Reporting & Reflection

Portal kelima JAENS ERP · HRD Operations dan Human Growth · R&D · Data dummy

[NB induk](README.md) · [F3 Planner](F3-PLANNER-DAN-WORKPLACE.md) · [F4 Rekrutmen](F4-REKRUTMEN-DAN-PENEMPATAN.md) · [F5 Manpower & POS](F5-MANPOWER-PLANNING-DAN-POS.md) · [F6 Kinerja](F6-HUMAN-GROWTH-DAN-KINERJA.md) · [F7 Payroll & Budgeting](F7-PAYROLL-DAN-PEOPLE-BUDGETING.md) · [Preview](../hrd-rnd/index.html) · [Referensi SER dan Race](../hrd-rnd/KINERJA-REFERENSI.md) · [Panduan brand](../HAWK-BRAND-GUIDELINES.md)

## Tujuan dan dependensi

Hubungkan komitmen harian, hasil terverifikasi, ekspektasi perusahaan, keputusan strategis dan laporan presentasi. Identitas, organisasi, cakupan dan audit memakai F1. Jadwal dan pengajuan berasal dari F2, tugas dari F3, rekrutmen dari F4, kapasitas/POS dari F5, definisi KPI dan kompetensi dari F6, serta biaya berizin dari F7.

Menu AmbideX & Race membuka siklus kerja dan review. Pusat laporan memberi jalur ke sumber dengan cakupan yang sama. Ringkasan pada Beranda dan Kinerja menaut ke layar F8 yang relevan. Pertahankan shell serta palet JAENS, tampilkan periode dan scope pada setiap layar, dan gunakan waktu WITA untuk sesi serta histori.

## Delapan layar dan kriteria penerimaan

| ID | Layar | Isi dan interaksi | Kriteria penerimaan |
| --- | --- | --- | --- |
| F8-NV01 | Race Vegen | Objective, enam indikator, Race Goal, Key Metrics, satuan, target, aktual, bukti dan bobot. Tambah/edit dalam draf, review dan aktivasi versi. | Bobot awal 20/10/20/20/20/10% berjumlah 100%. Total yang berbeda tetap draf. Versi aktif serta laporan historis menyimpan definisi yang digunakan. |
| F8-NV02 | Race Beacon & Success Factors | Turunkan sasaran menjadi unit/tim kecil, tahap, inisiatif, PIC, tenggat dan bukti. Tab Success Factors memuat rubric review objective, keselarasan bisnis, kerja tim, proses dan hasil. | Beacon menaut ke sasaran induk dan Task ID. Bobot Beacon memiliki kontraknya sendiri. Review mencatat bukti, penilai, alasan dan waktu. |
| F8-NV03 | Daily Race | Komitmen My Day, rencana, pekerjaan selesai, bukti terverifikasi, terlambat, terblokir dan pekerjaan tambahan. Buka kartu, catat blocker atau eskalasi. | Kartu yang sama terbuka dari My Day dan Daily Race. Perubahan status terlihat di Planner. Jadwal shift dan scope pengguna menentukan konteks hari. |
| F8-NV04 | Weekly Race | Komitmen mingguan, kapasitas, pekerjaan terbawa, hambatan lintas divisi, review hasil dan tindakan berikutnya. | Pekerjaan terbawa mempertahankan Task ID serta tenggat asal dalam histori. Keputusan baru menaut ke sumber dan memiliki PIC serta tenggat. |
| F8-NV05 | Monthly Reflection | Target/hasil SER, KPI, kapasitas, talenta dan biaya berizin. Catat penyebab selisih, bukti, pembelajaran, tindakan dan evaluasi berikutnya. | Nilai merekonsiliasi F5–F7 pada periode dan scope yang sama. Tandai temuan sebagai Ide, Issue atau Workplan untuk membuka kartu F3. Penandaan ulang mempertahankan tautan ke kartu yang sama. |
| F8-NV06 | STRACON | Keputusan strategis, alternatif, alasan, pemilik keputusan, tenggat, kriteria evaluasi dan hasil. Buat Workplan dari keputusan. | Decision ID menaut ke Reflection, bukti dan tindak lanjut. Evaluasi periode berikutnya membandingkan hasil dengan kriteria yang dicatat saat keputusan. |
| F8-NV07 | e-Deck Reflection HRD | Delapan halaman presentasi, filter periode/scope, navigasi slide, drill-down, catatan dan snapshot sesi. Ekspor mengikuti hak akses. | Semua halaman memakai periode dan snapshot yang konsisten. Angka membuka bukti yang sama. Pergantian peran atau perubahan hak akses memeriksa ulang data sensitif. |
| F8-NV08 | Pusat Laporan & Jejak Bukti | Telusuri laporan, metrik, versi formula, perhitungan, bukti, tanggal pembaruan dan tindak lanjut. Filter periode, unit, outlet dan divisi. | Hasil laporan dapat ditelusuri sampai sumber. Bukti kosong, kedaluwarsa, koreksi dan akses ditolak memiliki status jelas. Retry pembaruan laporan tidak menggandakan data atau kartu. |

Tab, dialog dan delapan halaman e-Deck berada dalam NV masing-masing. Pengujian lintas fase menjadi kriteria penerimaan F8.

## Race Vegen, Beacon dan skor

| Indikator Vegen | Bobot awal |
| --- | --- |
| Financial Efficiency & Value Creation | 20% |
| Collaboration Group | 10% |
| Stability & Risk Governance | 20% |
| Talent Flow, Talent Engine, Pipeline | 20% |
| Growth, Learning and Capability | 20% |
| Implementasi Ambidex | 10% |

Race Beacon dari workbook memiliki lima kelompok dengan bobot awal 15/25/25/20/15%, yang juga berjumlah 100%. Simpan bobot sebagai kontrak versi tersendiri dan jelaskan hubungan metrik Beacon dengan indikator Vegen. Jika satu metrik mendukung lebih dari satu inisiatif, relasinya tetap dapat ditelusuri dan perhitungannya mengikuti kontrak yang disetujui.

Gunakan Metric Version ID dan Evidence ID F6 untuk realisasi. Definisi arah target, cap/floor, kelengkapan bukti serta aturan agregasi ditampilkan bersama capaian. Nilai nol terverifikasi memiliki bukti. Data belum tersedia ditandai sebagai gap. Tampilkan bobot terukur dan status provisional ketika hasil belum lengkap. Rasio outlet atau divisi memakai total pembilang dan penyebut. Rumus XScore resmi AJi Creator OS dan definisi Absenteeism masih perlu dikunci sesuai NB F6. Rubric Success Factors menyimpan hasil review kualitatif dan sumber buktinya.

## Delapan halaman e-Deck

| Halaman | Sumber dan jalur rincian |
| --- | --- |
| Dashboard HR Performance | SER F6, roster F2, dan agregat biaya F7 sesuai izin. Buka target, realisasi dan cakupan. |
| Therapist Utility | F5. Telusuri jam treatment, kapasitas reguler, lembur dan gap per outlet/shift. |
| Therapist Productivity | F5/F6. Buka hasil layanan, target dan konteks kualitas sesuai definisi KPI. |
| Manpower | F5. Lihat kebutuhan posisi, bantuan antaroutlet dan formasi yang sedang dipenuhi. |
| Recruitment | F4. Konversi tahap, sumber kandidat, formasi terbuka dan progres penempatan. |
| Absen | F2/F6. Presensi terverifikasi, coverage shift dan metrik yang sudah memiliki definisi. |
| Therapist Training | F6. Program, cohort, kelengkapan bukti, praktik dan kesiapan. |
| Tata Kelola | F1–F3/F6. Status dokumen, proses, approval, audit dan tindak lanjut yang boleh dilihat. |

Mode data terkini menampilkan tanggal pembaruan tiap sumber. Saat review disimpan, buat snapshot dengan versi metrik, scope, periode, status kelengkapan, catatan dan referensi bukti. Koreksi setelah review menghasilkan versi laporan berikutnya dengan referensi ke versi terdahulu. Izin akses tetap diperiksa saat membuka snapshot atau mengekspor. Snapshot dengan data biaya personal hanya dapat diakses Manager HRD.

## Alur tindakan dan integrasi

- **Temuan ke Planner.** Dari angka atau catatan, pilih Ide, Issue atau Workplan. Simpan Finding ID, sumber, cakupan, PIC jika tersedia dan Task ID. Penandaan ulang membuka tugas terkait. Penugasan, diskusi, bukti dan histori memakai F3.
- **Komitmen ke hasil.** Daily dan Weekly Race membaca komitmen serta peristiwa kartu. Tampilkan waktu selesai dan waktu verifikasi sebagai field berbeda. KPI membaca hasil yang memenuhi definisi metrik dan bukti sumbernya.
- **Reflection ke STRACON.** Tautkan keputusan ke temuan, alternatif dan alasan. Workplan menyimpan PIC, tenggat dan kriteria hasil. Review berikutnya membuka keputusan yang sama dan catatan evaluasinya.
- **Akses.** Anggota melihat pekerjaan dan data dalam cakupannya. Reviewer membuka tim yang ditugaskan. Payroll dan detail nominal personal tetap khusus Manager HRD. Kartu umum menggunakan konteks yang boleh dilihat penerima dan tautan berizin ke detail sensitif. API, notifikasi, pencarian, snapshot dan ekspor mengikuti aturan sumber.
- **R&D.** Gunakan 158 profil dummy bersama, empat outlet dan skenario Office. Labeli simulasi serta asumsi formula. Penghapusan dataset F1 mencakup snapshot, catatan review dan tindak lanjut demo dengan relasinya.

## Kontrak data minimum

| Objek | Field dan relasi |
| --- | --- |
| Race | Race ID, scope, periode, objective, versi kontrak, indikator, goal, Metric Version ID, target, bobot dan status. |
| Beacon dan rubric | Beacon ID, parent Race ID, sasaran, tahap, Task ID, rubric version, reviewer, bukti dan hasil review. |
| Sesi kerja | Session ID, jenis Daily/Weekly/Monthly, waktu WITA, scope, komitmen Task ID, status saat review, blocker dan catatan. |
| Temuan dan keputusan | Finding ID, sumber, Decision ID, alasan, alternatif, pemilik, tenggat, kriteria evaluasi dan Task ID tindak lanjut. |
| Laporan dan snapshot | Report ID, versi, periode, scope, snapshot ID, definisi/hasil metrik, Evidence ID, tanggal pembaruan dan status kelengkapan. |
| Audit | Event ID, aktor, waktu, versi objek, perubahan, izin sumber dan dataset demo. |

## Urutan visual dan review

1. **NV01 → NV02.** Buka Race Vegen Human Growth, telusuri satu goal ke Beacon. Uji bobot 99%, 100% dan 101%, penambahan indikator, perubahan versi serta bukti kosong.
2. **NV03 → NV04 → NV05.** Pilih komitmen My Day dari F3, catat blocker, review mingguan dan baca hasil bulanan. Cocokkan Task ID dari seluruh jalur.
3. **F5 → NV05 → F3 → NV06.** Gunakan utility Spa Ubud di atas 100%. Buat Issue, telusuri bukti, catat keputusan kapasitas dan buat Workplan. Periode berikutnya mengevaluasi keputusan tersebut.
4. **NV07 → NV08.** Presentasikan delapan halaman pada periode yang sama. Klik angka sampai sumber, simpan snapshot, lakukan koreksi dummy dan periksa perbedaan versi.
5. **Uji lintas F1–F8.** Jalankan kebutuhan outlet → lowongan → kandidat dummy → onboarding → penempatan → jadwal/POS → KPI/komisi → budget → Reflection → tindak lanjut. Gunakan ID bersama dan verifikasi retry, koreksi serta perubahan penempatan.
6. Uji desktop/mobile, keyboard, filter kosong, sumber gagal, data provisional, akses ditolak, pergantian peran, ekspor berizin dan penghapusan dataset demo. Verifikasi ulang akses snapshot setelah hak pengguna berubah.

## Bahan master prompt Cloud Developer

Lampirkan NB ini, F1–F7, preview, inventaris sidebar, referensi SER/Race dan panduan brand. Minta pemetaan rute ke delapan ID NV, contoh sesi yang saling tertaut, kontrak data, aturan akses server, serta bukti uji jalur klik dan rekonsiliasi. Gunakan sumber dummy yang sama di semua modul. Catat formula, integrasi dan keputusan yang masih berupa simulasi pada handoff hasil build. Total rancangan F1–F8 adalah **77 NV utama**. Jumlah ini mengacu ke layar dalam NB, sementara cakupan yang sudah dibangun dan teruji dilaporkan per fase.
