# NB F6 · Human Growth & Kinerja

Portal kelima JAENS ERP · Human Growth · R&D · Data dummy

[NB induk](README.md) · [F1 Fondasi](F1-FONDASI-DAN-BERANDA.md) · [F3 Planner](F3-PLANNER-DAN-WORKPLACE.md) · [F4 Rekrutmen](F4-REKRUTMEN-DAN-PENEMPATAN.md) · [F5 Manpower & POS](F5-MANPOWER-PLANNING-DAN-POS.md) · [Preview](../hrd-rnd/index.html) · [Referensi KPI](../hrd-rnd/KINERJA-REFERENSI.md) · [Panduan brand](../HAWK-BRAND-GUIDELINES.md)

## Tujuan dan dependensi

Hubungkan ekspektasi perusahaan, hasil kerja tim, bukti performa individu dan tindakan pengembangan. Gunakan roster 158 orang serta scope F1, Employee ID dan penempatan efektif F2, Task ID F3, cohort onboarding F4, dan bukti kapasitas serta POS F5. F7 menyediakan agregat biaya berizin. F8 membaca hasil yang sama untuk Race Vegen, Monthly Reflection dan e-Deck.

## Sembilan layar dan kriteria penerimaan

| ID | Layar | Isi dan interaksi | Kriteria penerimaan |
| --- | --- | --- | --- |
| F6-NV01 | Dashboard Human Growth | Performa tim, rata-rata XScore, cakupan bukti, kesiapan dan efektivitas pelatihan. Filter periode, divisi, outlet dan posisi. | Angka tim dan rata-rata skor individu dapat ditelusuri masing-masing. Klik kartu membuka rincian dengan cakupan yang sama. |
| F6-NV02 | Stakeholder Expectations & SER | Executive Summary, Collaboration Group dan Human Growth Expectations. Tampilkan pernyataan, satuan, target, realisasi, sumber, periode dan tindak lanjut. | Seluruh 15 ekspektasi dari workbook tercatat. Klik metrik membuka bukti atau status data. Rasio biaya tenaga kerja mengikuti izin Manager HRD. |
| F6-NV03 | KPI Library | Definisi, unit, arah target, rumus, cakupan, frekuensi, sumber dan versi. Buka contoh perhitungan dan bukti. | Perubahan definisi membuat versi baru. Kontrak aktif serta snapshot lama tetap merujuk versi awal. |
| F6-NV04 | Kontrak KPI & Review Periode | Kontrak tim dan individu, bobot, target, draf, persetujuan, aktivasi, koreksi bukti dan penutupan. | Kontrak berbobot harus tepat 100% sebelum aktivasi. Penutupan menyimpan versi, nilai, cakupan dan bukti yang dipakai. Koreksi setelah penutupan tercatat dan dapat ditinjau. |
| F6-NV05 | XScore | Scorecard personal berisi target, aktual, bobot, kontribusi, bukti, cakupan dan status provisional/final. | Nol terverifikasi dapat dibedakan dari nilai kosong. Formula demo diberi label simulasi. Bukti belum lengkap terlihat dan memerlukan review sebelum finalisasi. |
| F6-NV06 | People Performance & Profil Kompetensi | Telusuri divisi, outlet atau tim, lalu individu. Buka pengalaman, kompetensi, aspirasi, hasil kerja, coaching dan histori penempatan sesuai izin. | Profil memakai Employee ID F2. Klik bukti membuka catatan asal. Perpindahan outlet tidak menghapus histori kompetensi. |
| F6-NV07 | 9-Box Talent | Matriks performa × potensi, termasuk Stars dan Belum Dinilai. Klik kotak, nama, alasan, bukti, reviewer dan histori. | Supervisor dan HG memvalidasi hasil akhir. Bukti belum cukup masuk Belum Dinilai. Perpindahan kotak mencatat alasan, periode dan reviewer. |
| F6-NV08 | Rencana Pengembangan & Coaching | Gap kompetensi, target, mentor, aktivitas, bukti, PIC dan tanggal review. Buat Workplan F3 dari profil atau 9-Box. | Penandaan ulang atas kebutuhan yang sama membuka kartu terkait. Bukti coaching muncul pada profil sesuai izin. |
| F6-NV09 | Pelatihan, Kesiapan & Talent Pipeline | Onboarding keterampilan, pelatihan rutin, verifikasi praktik, kesiapan peran dan kandidat internal. | Kehadiran pelatihan dan kelulusan praktik dapat dibaca masing-masing. Hasil terverifikasi memperbarui kompetensi serta KPI pelatihan melalui bukti yang sama. |

## Definisi dan aturan

- **KPI per fungsi.** Therapist memakai utility, hasil per shift dan kualitas. Reception memakai konversi, akurasi serta waktu respons. Hospitality memakai kesiapan, audit dan SLA. Commercial/Sales memakai konversi dan revenue teratribusi. Production memakai output diterima, ketepatan waktu dan kualitas review. Finance memakai closing dan rekonsiliasi. HRD/HG memakai turnover, absence, quality of hire, kesiapan dan efektivitas pelatihan.
- **Perhitungan.** Rasio agregat memakai total pembilang dan penyebut dengan cakupan dan periode sama. Tampilkan data kosong, bukti belum diverifikasi dan penyebut nol sebagai status tersendiri. Revenue per Employee memakai rupiah. Definisi, arah dan denominator Absenteeism perlu dikonfirmasi karena target SER dan Race Vegen berbeda.
- **XScore.** Preview memakai bobot dummy Utility 50%, Produktivitas 30% dan Learning 20% untuk therapist. Formula resmi AJi Creator OS belum terverifikasi. Simpan arah target, cap/floor, cakupan bobot terukur dan aturan finalisasi pada kontrak. Pisahkan skor terhadap target tim dari rata-rata skor personal.
- **Pengembangan.** 9-Box memakai hasil kerja dan bukti kesiapan yang ditinjau manusia. Utility outlet adalah konteks staffing. Asesmen kepribadian membantu konteks coaching dengan izin terbatas. Rencana pengembangan menautkan kompetensi target, kegiatan, mentor dan verifikasi.
- **Kesiapan.** Quality of Hire memakai cohort yang sudah jatuh tempo review 90 hari dan telah dinilai, dengan jumlah review tertunda terlihat. Efektivitas pelatihan membaca hasil praktik terverifikasi dan menampilkan cakupan verifikasi.
- **Akses.** Reviewer membuka individu sesuai tim dan penugasan efektif. Ringkasan lintas divisi mengikuti cakupan peran. Detail payroll serta nominal individu tetap khusus Manager HRD. API, ekspor, audit dan tautan bukti memakai izin yang sama.

## Kontrak data minimum

| Objek | Field dan relasi |
| --- | --- |
| SER dan KPI | Expectation ID, kelompok, Metric ID, versi, unit, arah target, formula, sumber dan periode. |
| Kontrak dan hasil | Contract ID, scope, Metric Version ID, target, bobot, aktual, pembilang, penyebut, evidence ID, status dan snapshot. |
| Kompetensi dan 9-Box | Employee ID, Competency ID, level, periode, bukti, performa, potensi, reviewer, alasan dan histori. |
| Pengembangan | Plan ID, gap, target, mentor, tenggat, Task ID F3, bukti, reviewer dan status. |
| Pelatihan dan kesiapan | Program ID, cohort, Employee ID, kehadiran, verifikasi praktik, hasil kesiapan dan tanggal review. |

## Urutan visual dan review

1. **NV01 → NV05 → NV06 → NV07 → NV08.** Buka satu Therapist dummy, telusuri skor ke bukti, tinjau posisi 9-Box dan buat Workplan coaching.
2. **NV09 → NV06 → NV03.** Verifikasi praktik supervisor dan telusuri pembaruan kompetensi serta KPI pelatihan ke bukti yang sama.
3. **NV02 → NV03 → NV04 → NV05.** Buka satu ekspektasi SER, cek versi metrik, aktifkan kontrak dan tutup periode setelah review. Uji bobot di bawah 100%, bukti kosong, aktual nol dan koreksi setelah penutupan.
4. Uji peran dan cakupan outlet, filter periode, Belum Dinilai, akses ditolak, tampilan mobile dan navigasi keyboard.

## Bahan master prompt Cloud Developer

Lampirkan NB ini, NB F1–F5, referensi KPI, preview dan panduan brand. Minta pemetaan rute ke sembilan ID NV, contoh data dummy yang saling tertaut, otorisasi server, jejak hitung skor dan bukti pengujian. Labeli formula serta sumber simulasi. Gunakan ID stabil untuk integrasi F7 dan F8.
