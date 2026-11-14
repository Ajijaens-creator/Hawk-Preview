# NB F5 · Manpower Planning & POS

Portal kelima JAENS ERP · HRD Operations dan Spa Operations · R&D · Data dummy

[NB induk](README.md) · [F2 Operasi HRD](F2-OPERASI-HRD-DAN-DIREKTORI.md) · [F3 Planner](F3-PLANNER-DAN-WORKPLACE.md) · [F4 Rekrutmen](F4-REKRUTMEN-DAN-PENEMPATAN.md) · [Preview](../hrd-rnd/index.html) · [Panduan brand](../HAWK-BRAND-GUIDELINES.md)

## Tujuan dan dependensi

Manpower Planning membantu HRD menelusuri kebutuhan tenaga per outlet, posisi, skill dan shift, serta membandingkan alternatif sebelum membuka formasi. Gunakan organisasi dan scope F1, penempatan dan jadwal F2, kartu tindak lanjut F3, serta permintaan tenaga F4. F6 memakai hasil produktivitas terverifikasi. F7 memakai transaksi yang memenuhi aturan komisi dan simulasi kebutuhan tenaga untuk anggaran.

## Delapan layar dan kriteria penerimaan

| ID | Layar | Isi dan interaksi | Kriteria penerimaan |
| --- | --- | --- | --- |
| F5-NV01 | Dashboard Manpower | Bandingkan empat outlet Spa dan divisi Office. Filter periode, outlet, divisi dan posisi. Kartu membuka detail sesuai filter. | Empat outlet masing-masing menunjukkan 25 Therapist dan 5 Receptionist pada fixture awal. Office menunjukkan 38 orang. PC dan Commercial tampil dengan headcount belum ditetapkan. |
| F5-NV02 | Kapasitas Outlet & Shift | Roster yang berlaku, jumlah orang, jam reguler tersedia, lembur, gap, kebutuhan skill dan formasi terbuka. Klik shift untuk melihat jadwal dan anggota. | Jam dan orang yang membantu outlet lain dapat ditelusuri ke tempat kerja aktual dan outlet induk. Angka outlet dapat direkonsiliasi dengan rincian shift. |
| F5-NV03 | Therapist Utility & Produktivitas | Utility, tamu atau treatment selesai terhadap target, lembur, pembatalan dan booking gagal karena kapasitas. Klik angka untuk melihat pembilang, penyebut dan transaksi. | Ubud menampilkan contoh >100% dan Santi <70%. Nilai tepat 70% dan 100% masuk status Pantau. Penyebut nol atau data belum cukup tampil sebagai belum tersedia atau perlu verifikasi. |
| F5-NV04 | Beban Spa Reception | Reservasi, check-in, waktu tunggu dan cakupan front desk per shift. Buka periode ramai untuk melihat bukti dan kebutuhan coverage. | Kekurangan shift dapat ditelusuri walau agregat outlet terlihat cukup. Status mengikuti definisi beban dan target Reception. |
| F5-NV05 | Kapasitas Divisi | Beban, output, backlog, SLA dan cakupan. Contoh rekonsiliasi Finance, campaign Marketing, permintaan HRD, output Production dan cakupan Office Operations. | Setiap indikator menampilkan satuan, periode dan sumber. Divisi dengan data belum lengkap mendapat status perlu verifikasi. |
| F5-NV06 | Detail Sumber POS & Jadwal | ID transaksi dan baris layanan, therapist, outlet aktual, waktu, durasi, status selesai, pembatalan/refund, jadwal, verifikasi dan histori koreksi. | Retry tidak menggandakan layanan. Refund dan koreksi menaut ke transaksi asal. Ringkasan terverifikasi dapat ditelusuri ke catatan yang membentuknya. |
| F5-NV07 | Rekomendasi & Simulasi Formasi | Bandingkan bantuan lintas outlet, penyesuaian shift dan tambah formasi. Tampilkan alasan, dampak jam, asumsi, data pendukung dan tindakan Ide, Issue atau Workplan. | Simulasi memperlihatkan gap sebelum dan sesudah. Tandai ulang temuan yang sama untuk membuka kartu F3 yang sudah ada. Persetujuan manusia diperlukan sebelum handoff. |
| F5-NV08 | Handoff Permintaan Tenaga | Kirim kebutuhan yang disetujui ke Rekrutmen F4 dengan outlet, posisi, shift, skill, formasi dan tanggal kebutuhan. Buka status permintaan sampai penempatan aktif. | Permintaan memuat sumber rekomendasi dan Workplan. Pengiriman ulang tidak membuat formasi ganda. Jumlah posisi terbuka berkurang setelah penempatan efektif. |

## Definisi dan aturan operasional

- **Utility Therapist** = jam treatment selesai ÷ jam kapasitas reguler tersedia untuk booking. Tampilkan keduanya dalam jam. Lembur, jam cuti dan jam tidak tersedia ditelusuri sebagai komponen terpisah. Angka di atas 100% dapat terjadi saat treatment memakai kapasitas di luar jam reguler. Tampilkan bukti lembur atau tandai selisih yang belum terverifikasi.
- **Produktivitas Therapist** = hasil aktual ÷ target pada periode, posisi dan cakupan yang sama. KPI Library F6 menyimpan definisi apakah hasil dihitung sebagai tamu unik atau treatment selesai. Tampilkan satuan pada setiap layar.
- **Agregasi** menghitung rasio dari total pembilang dan penyebut. Pisahkan angka nol yang terverifikasi, data kosong dan sumber yang belum lengkap. Koreksi yang memengaruhi bulan tertutup harus terlihat dalam histori.
- **POS dan jadwal** memakai ID layanan, penempatan dan shift efektif. Jika satu layanan melibatkan beberapa therapist, gunakan alokasi durasi yang dapat ditelusuri agar total outlet tetap konsisten. Pisahkan status layanan selesai dari status pembayaran/refund. F7 menentukan kelayakan serta koreksi komisi berdasarkan aturan yang berlaku.
- **Rekomendasi AI demo** menunjukkan faktor yang dapat diperiksa, seperti booking gagal, lembur, pembatalan, jam ramai atau skill yang kurang. Utility rendah membuka investigasi permintaan dan jadwal. Untuk data belum lengkap, tampilkan kebutuhan verifikasi. Hasil outlet menjadi bahan staffing. Penilaian individu berada di F6.
- **Akses** mengikuti outlet dan divisi yang ditugaskan. HRD melihat rincian sesuai scope, supervisor membuka bukti outletnya, dan pemohon melihat status kebutuhan terkait. Nilai komisi per orang dan rincian payroll tetap mengikuti akses Manager HRD di F7.

## Kontrak data minimum

| Objek | Field dan relasi |
| --- | --- |
| Kapasitas shift | Outlet aktual, Position ID, Shift ID, Assignment ID, periode, kapasitas reguler, lembur, jam absen dan status verifikasi. |
| Layanan POS | Transaction ID dan Service Line ID, outlet aktual, therapist, durasi, waktu, status layanan, serta referensi pembatalan, refund atau koreksi. |
| Beban kerja | Outlet/divisi, posisi, periode, unit, pembilang, penyebut, target, sumber, waktu pembaruan dan status kelengkapan. |
| Temuan dan skenario | Finding ID, scope, alasan, bukti, baseline, asumsi, perubahan kapasitas, hasil simulasi, approver dan Task ID F3. |
| Permintaan tenaga | Requisition ID F4, Finding ID, outlet/divisi, posisi, skill, shift, jumlah formasi, tanggal kebutuhan dan status penempatan. |

## Urutan visual dan review

1. **NV01 → NV02 → NV03 → NV06.** Buka Spa Ubud. Gunakan contoh shift dummy 216 jam treatment terhadap 200 jam reguler, atau 108%. Telusuri 16 jam selisih ke POS dan jadwal sebelum membandingkan opsi penambahan kapasitas.
2. **NV07 → NV08 → F4.** Tandai Workplan, bandingkan tambahan shift dengan formasi baru, lalu kirim kebutuhan yang disetujui. Buka progres permintaan dan verifikasi tidak ada duplikasi saat retry.
3. **NV01 → NV03 → NV07.** Buka Spa Santi di bawah 70%. Periksa permintaan, pembatalan dan distribusi shift, lalu buat Issue investigasi.
4. **NV04 → NV05.** Tinjau gap Reception per shift dan backlog Office dengan satuan yang sesuai. Uji filter, akses ditolak, data kosong, sumber terlambat, refund, retry dan tampilan mobile.

## Bahan master prompt Cloud Developer

Lampirkan NB ini, F1–F4, preview, inventaris sidebar dan panduan brand. Minta pemetaan delapan ID NV, data dummy bersama, jejak perhitungan sampai transaksi, cakupan akses server, serta bukti uji handoff dan retry. Gunakan POS, jadwal dan rekomendasi simulasi di R&D. Konfirmasi definisi kapasitas, ambang Reception/divisi, dan aturan alokasi layanan sebelum mengaktifkan integrasi live.
