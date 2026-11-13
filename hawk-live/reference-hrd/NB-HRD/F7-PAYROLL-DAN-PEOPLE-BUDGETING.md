# NB F7 · Payroll & People Budgeting

Portal kelima HAWK ERP · Manager HRD dan Finance & Accounting sesuai kewenangan · R&D · Data dummy

[NB induk](README.md) · [F1 Fondasi](F1-FONDASI-DAN-BERANDA.md) · [F2 Operasi HRD](F2-OPERASI-HRD-DAN-DIREKTORI.md) · [F3 Planner](F3-PLANNER-DAN-WORKPLACE.md) · [F4 Rekrutmen](F4-REKRUTMEN-DAN-PENEMPATAN.md) · [F5 Manpower & POS](F5-MANPOWER-PLANNING-DAN-POS.md) · [F6 Kinerja](F6-HUMAN-GROWTH-DAN-KINERJA.md) · [Preview](../hrd-rnd/index.html) · [Inventaris GajiHub](../hrd-rnd/REFERENSI.md) · [Panduan brand](../HAWK-BRAND-GUIDELINES.md)

## Tujuan dan dependensi

Hubungkan layanan POS, komisi, komponen penggajian, slip, rekonsiliasi Finance dan rencana biaya tenaga kerja. Gunakan identitas serta scope F1, kontrak/penempatan dan presensi terverifikasi F2, Task ID F3, tanggal mulai kerja F4, serta transaksi dan kebutuhan kapasitas F5. Definisi metrik berizin mengacu ke KPI Library F6. F8 membaca agregat dan snapshot yang sama untuk Monthly Reflection serta e-Deck.

Navigasi memakai Payroll, Keuangan, Laporan, Pengaturan dan People Budgeting yang sudah tercatat. Kasbon/Reimburse menjadi submenu sementara Keuangan berdasarkan kartu pengaturan pada referensi GajiHub. Semua layar mengikuti shell charcoal, ivory dan gold HAWK. Nominal diberi unit rupiah, grafik disertai legenda serta tabel nilai, dan filter tetap terbawa ketika membuka rincian.

## Dua belas layar dan kriteria penerimaan

| ID | Layar | Isi dan interaksi | Kriteria penerimaan |
| --- | --- | --- | --- |
| F7-NV01 | Dashboard Payroll | Periode, grup slip, cakupan outlet/divisi, jumlah karyawan, total komponen, kelengkapan sumber dan status proses. Klik angka membuka batch atau rincian terkait. | Jumlah orang sesuai roster dan tanggal efektif pada periode. Total dashboard merekonsiliasi detail batch dengan filter yang sama. Data sumber yang belum selesai terlihat. |
| F7-NV02 | Komponen & Aturan Payroll | Gaji pokok, tunjangan, komisi, lembur, THR, potongan dan prorata. Versi aturan, tanggal efektif, contoh perhitungan dan template slip. | Perubahan aturan berlaku pada periode efektif. Slip yang sudah dikunci tetap merujuk versi awal. Pengali dan penyesuaian dapat ditelusuri. |
| F7-NV03 | Rekonsiliasi Komisi POS | Layanan selesai, therapist, outlet aktual, aturan komisi, pembagian, pembatalan/refund, selisih dan penyesuaian. Klik total untuk membuka baris POS. | Retry tidak menambah komisi yang sama. Pembagian layanan merekonsiliasi total. Koreksi merujuk transaksi asal dan versi aturan yang berlaku. |
| F7-NV04 | Proses Payroll Periode | Generate draf, tarik sumber terverifikasi, validasi anomali, review, persetujuan dan penguncian. Impor, reset draf dan koreksi disertai pratinjau perubahan serta audit. | Regenerasi draf memperbarui batch yang sama. Periode terkunci memiliki snapshot. Koreksi berikutnya tercatat sebagai penyesuaian dengan referensi asal. |
| F7-NV05 | Slip Gaji & Status Pembayaran | Rincian pendapatan, potongan, take-home pay, bukti perhitungan, kesiapan dan status rekonsiliasi pembayaran. Tersedia slip per orang, slip tidak tetap dan unduhan massal sesuai izin. | Pendapatan dikurangi potongan merekonsiliasi take-home pay. Status Siap Bayar tidak otomatis menjadi Sudah Bayar. Status pembayaran memerlukan referensi bukti yang tercatat. |
| F7-NV06 | Kasbon & Reimburse | Pengajuan, bukti, persetujuan, pencairan, cicilan, saldo dan penyelesaian. Komponen yang diteruskan ke payroll mempunyai referensi sumber. | Cicilan terpakai tepat sekali pada periode terkait. Reimburse yang sudah diselesaikan lewat kanal lain tidak masuk pembayaran kedua. Saldo bisa ditelusuri ke ledger. |
| F7-NV07 | Laporan Payroll, Pajak & BPJS | Katalog Payroll, PPh 21/26, BPJS dan Coretax. Filter periode/cakupan, detail laporan, status kelengkapan serta ekspor berizin. | Seluruh 19 entri referensi tersedia. Nilai payroll merekonsiliasi batch terkait. Laporan pajak dan BPJS demo menampilkan versi aturan simulasi. |
| F7-NV08 | Handoff Finance & Accounting | Pemetaan COA, agregat biaya per entitas/outlet/divisi, batch jurnal, penerimaan dan selisih rekonsiliasi. | Total handoff merekonsiliasi snapshot HRD. Batch jurnal seimbang. Retry memakai kunci yang sama dan status penerimaan dapat ditelusuri. Finance melihat agregat yang disetujui. |
| F7-NV09 | Dashboard People Budgeting | Salary Ratio, Total People Cost Ratio, Revenue per Employee/FTE, Salary per Employee, budget, aktual, forecast dan ruang anggaran. Filter tahun, periode, unit, outlet, divisi dan posisi. | Setiap metrik menjelaskan pembilang, penyebut dan cakupan. Klik kartu membuka sumber yang diizinkan. Revenue nol atau belum tersedia menghasilkan status yang jelas. |
| F7-NV10 | Rencana Anggaran & Alokasi Divisi | Anggaran tahunan ke kuartal/bulan mengikuti musim bisnis. Formasi, biaya tetap/variabel, komitmen dan alokasi divisi pendukung. | Jumlah bulan merekonsiliasi tahun. Alokasi lintas outlet berjumlah 100% dari biaya yang dialokasikan dan konsolidasi menghitung biaya tersebut sekali. |
| F7-NV11 | Simulasi Rekrutmen & Outlet Baru | Bandingkan tambah orang, shift dan bantuan outlet. Tanggal mulai, onboarding, komisi, pra-pembukaan dan ramp-up memengaruhi forecast. | Skenario menampilkan asumsi dan selisih terhadap baseline. Kebutuhan yang disetujui tertaut ke Requisition ID F4. Tahun berjalan dan biaya setahun penuh dapat dibaca masing-masing. |
| F7-NV12 | Tren Bulanan & Kurva S | Garis rasio bulanan, rencana, forecast, pembanding tahun lalu, serta biaya kumulatif. Drill-down bulan ke outlet/divisi dan komponen berizin. | Aktual berhenti pada periode data tersedia. Forecast memakai aktual yang sudah ditutup dan estimasi sisa periode. Titik kumulatif akhir merekonsiliasi total tahun. |

Tab, dialog, pratinjau impor dan ekspor menjadi bagian dari NV terkait. Katalog NV07 mencakup enam laporan Payroll, enam PPh 21/26, dua BPJS dan lima Coretax sesuai inventaris. Template pelaporan dan tarif produksi memerlukan verifikasi sesuai periode implementasi. Preview menggunakan perhitungan serta dokumen sintetis.

## Alur komisi, payroll dan handoff

1. **POS → komisi.** Ambil Transaction ID, Service Line ID, therapist, outlet aktual, tanggal dan status layanan. Aturan efektif menentukan komponen yang memenuhi syarat. Simpan pembagian dan koreksi agar satu layanan tidak digandakan saat diterima ulang.
2. **Komponen → draf payroll.** Gabungkan kontrak, tanggal mulai/akhir efektif, lembur/presensi yang disetujui, komisi terverifikasi dan pengajuan terkait. Tampilkan sumber belum lengkap dan selisih sebelum review.
3. **Review → snapshot.** Manager HRD meninjau hasil dan mengunci batch. Simpan komponen, aturan, pembulatan, sumber dan keputusan. Regenerasi draf serta penyesuaian memerlukan jejak perubahan. Gunakan pemeriksaan versi ketika dua perubahan datang bersamaan.
4. **Snapshot → Finance.** Kirim agregat dan jurnal sesuai COA yang dipetakan. Gunakan Batch ID yang stabil untuk retry. Simpan pengakuan penerimaan dan alasan selisih. Status pembayaran diperbarui dari bukti rekonsiliasi, dengan penanganan gagal dan sebagian bila relevan.
5. **Koreksi terlambat.** Refund atau perubahan sumber setelah penguncian menghasilkan adjustment yang merujuk baris asal. Koreksi pada payroll dan jurnal terkait dapat ditelusuri sampai penyelesaiannya.

## Definisi anggaran dan metrik

| Metrik | Kontrak perhitungan |
| --- | --- |
| Salary Ratio | Biaya gaji yang diakui pada periode ÷ revenue bersih pada entitas, outlet dan periode yang sama. Komponen biaya yang masuk disimpan pada versi kebijakan. |
| Total People Cost Ratio | Total biaya tenaga kerja menurut kebijakan ÷ revenue bersih. Tampilkan komponen tambahan seperti biaya pemberi kerja dan benefit sehingga total dapat direkonsiliasi. |
| Salary per Employee | Biaya gaji periode ÷ rata-rata karyawan aktif pada periode dan cakupan yang sama. Nyatakan metode rata-rata headcount. |
| Revenue per Employee/FTE | Revenue bersih periode ÷ rata-rata headcount atau rata-rata FTE. Definisi jam penuh untuk FTE tercatat di kebijakan. |
| Forecast tahunan | Aktual periode tertutup + estimasi sisa tahun. Labeli angka provisional pada bulan berjalan dan tampilkan tanggal data terakhir. |
| Ruang anggaran | Batas biaya periode dikurangi forecast biaya periode, dengan komitmen yang sudah disetujui ikut masuk ke forecast. |

Koridor **25–30%** adalah usulan demo, dengan 25% sebagai titik rencana sesuai SER dan 30% sebagai batas atas untuk review. Rasio di bawah 25% dibaca bersama cakupan shift dan kualitas layanan. Kuartal dan tahun memakai total biaya dibagi total revenue. Alokasi bulanan mengikuti pola musiman serta jadwal pembukaan outlet.

Divisi pendukung memakai pagu rupiah dan porsi biaya grup. Dasar alokasi, entitas sumber dan penerima disimpan agar biaya Office yang dialokasikan ke outlet tidak terhitung ulang pada konsolidasi. Outlet baru menampilkan anggaran pra-pembukaan dan ramp-up. Saat revenue nol, tampilkan biaya rupiah serta rasio belum tersedia.

## Akses dan data demo

- **Manager HRD** membuka payroll, slip, nominal personal, detail komisi, pengaturan komponen dan ekspor terkait. Aturan server berlaku pada URL langsung, API, file, pencarian, audit dan riwayat.
- **Finance & Accounting** memperoleh agregat yang disetujui, pemetaan COA, jurnal dan status rekonsiliasi. Hak melihat nominal atau artefak pembayaran individu perlu ditetapkan pengguna sebelum implementasi yang memerlukannya.
- **Planner dan Reporting** memakai judul tindak lanjut umum serta tautan berizin ketika sumber memuat payroll. Isi kartu, pesan dan notifikasi mengikuti cakupan penerima. F6/F8 membaca agregat atau snapshot yang diizinkan.
- **Fixture bersama** memakai 158 orang dengan empat outlet dan Office sesuai F1. Take-home pay dummy mulai Rp3 juta dan manajer sekitar Rp7 juta. Untuk F7, turunkan komponen pendapatan/potongan yang merekonsiliasi nilai tersebut. Biaya perusahaan memakai komponennya sendiri sesuai kebijakan demo.
- **Status R&D** terlihat pada nominal, slip, jurnal, laporan dan ekspor. Dataset demo mengikuti penghapusan terkontrol F1. Integrasi POS, bank, pajak, BPJS dan Finance pada preview berstatus simulasi.

## Kontrak data minimum

| Objek | Field dan relasi |
| --- | --- |
| Aturan payroll | Rule ID, versi, komponen, tanggal efektif, rumus, pengali, pembulatan, COA dan approver. |
| Komisi dan adjustment | Commission Line ID, Service Line ID F5, Employee ID, outlet aktual, rule version, bagian komisi, nilai dan referensi koreksi asal. |
| Batch dan slip | Payroll Batch ID, periode, Employee ID, input snapshot, komponen, gross, potongan, take-home pay, status, versi dan reviewer. |
| Kasbon/reimburse | Request ID, keputusan, ledger, cicilan/penyelesaian, payroll line terkait dan bukti. |
| Jurnal dan pembayaran | Journal Batch ID, Payroll Batch ID, COA, entitas/cost center, agregat debit/kredit, kunci retry, status penerimaan dan referensi rekonsiliasi. |
| Anggaran dan skenario | Budget Version ID, tahun/bulan, scope, revenue plan, komponen biaya, headcount/FTE, alokasi, komitmen, baseline, scenario ID dan Requisition ID F4. |
| Bukti dan metrik | Source ID, Metric Version ID F6, periode, tanggal pembaruan, status kelengkapan, hak akses dan snapshot ID. |

## Urutan visual dan review

1. **NV03 → NV04 → NV05 → NV08.** Telusuri komisi Therapist Spa Ubud dari layanan dummy ke draf payroll, slip dan jurnal agregat. Uji replay transaksi, refund setelah penguncian dan retry handoff.
2. **NV02 → NV06 → NV04 → NV07.** Ubah aturan efektif pada draf, masukkan satu cicilan kasbon dan reimburse yang disetujui, lalu cek saldo serta hasil laporan tanpa penghitungan ganda.
3. **NV09 → NV10 → NV11 → NV12.** Pilih tahun, outlet dan bulan. Simulasikan tambahan Therapist pada tanggal mulai tertentu, cek forecast serta ruang anggaran, lalu rekonsiliasi kurva S ke total tahunan. Bandingkan periode yang sama tahun sebelumnya.
4. **NV01 → NV05.** Uji data belum lengkap, periode terkunci, pembayaran sebagian/gagal, akses Staf HRD dan akses Finance. Uji pula filter tanpa hasil, penggunaan keyboard, tampilan mobile dan ekspor berizin.

## Bahan master prompt Cloud Developer

Lampirkan NB ini, F1–F6, inventaris GajiHub, preview dan panduan brand. Minta pemetaan rute ke 12 ID NV, fixture nominal yang merekonsiliasi roster, otorisasi server, jejak hitung hingga sumber, serta bukti uji empat jalur di atas. Konfirmasi komponen Salary Ratio/Total People Cost, alokasi divisi, aturan komisi, pemetaan COA dan akses artefak pembayaran sebelum mengunci kebijakan produksi. Catat sumber resmi dan tanggal berlaku aturan pajak/BPJS saat integrasi tersebut dikerjakan. Labeli angka dan koneksi simulasi dalam handoff visual.
