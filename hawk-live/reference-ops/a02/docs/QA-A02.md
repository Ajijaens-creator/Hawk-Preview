# QA A02 · Dashboard Operational

**19 November 2026, WITA · Node VM offline atas HTML bundle mandiri**

Bukti: `qa/dashboard-contract-results.json`. SHA-256 di file itu mengacu pada bundle yang benar-benar diuji. DOM minimum dipakai untuk memeriksa hasil render dan handler, bukan tata letak browser.

## Gate revisi ini

1. 14 definisi dashboard dan 13 kelompok sumber.
2. Jro Okta mempunyai role sendiri, 14 laporan, tanpa hak sensitif otomatis.
3. **56 kombinasi**: 14 laporan × 2 periode × 2 tab. Judul benar, tanpa NaN/undefined, handler action/form terdaftar.
4. Katalog 23 indikator, 77 pengukuran Beacon, 17 dimensi/209 butir, serta binding sel.
5. Revenue dan Finance sintetis konsisten; laba direkonsiliasi; YTD kronologis.
6. Empat Supervisor membaca/menulis outlet masing-masing.
7. Staff tidak mengakses P&L atau mengubah total sumber existing.
8. Reception → Head review → dua dashboard feedback berubah dari satu record; self-approval ditolak.
9. Data kritis memerlukan final assurance sesudah review awal.
10. Metrik belum terverifikasi tetap pending; X-Score tidak diberi angka resmi.
11. CSV mengikuti scope; ekspor P&L staff ditolak.
12. Demo Center memuat alur dashboard dan Hospitality Manager.
13. ID sumber unik dan koneksi bundle tetap offline.

Jumlah final pemeriksaan mengikuti JSON hasil. Gate mencakup validasi simulator 8 skenario/6 peran/39 langkah, panel Jro dan tombol workspace setelah koreksi akhir.

## Pemeriksaan tambahan modul

Saat pembangunan, diperiksa: dua baris bertanggal sama membuka detail yang tepat; standar khusus outlet/periode; input di luar filter dapat difokuskan ke tanggal catatan; tindak lanjut Jro memiliki sumber dan pencegahan duplikasi aktif. Seluruhnya pemeriksaan lokal, bukan server.

## Batas

- **Visual browser A02 belum diverifikasi.** Browser sesi audit menolak file URL. Tidak digunakan jalur lain untuk melewati batas itu. Claude perlu memeriksa desktop/mobile pada environment dev yang tersedia.
- Render string dan CSS responsive tidak membuktikan posisi visual, ukuran sentuh, fokus keyboard atau seluruh klik pointer di browser.
- RBAC server, auth, IDOR, concurrent edits, constraint database, ERP dan data production belum diuji.
- Tidak ada model AI terhubung; insight adalah simulasi dengan aturan dan penjelasan.
- Formula demo bukan bukti paritas calculated fields Looker atau kontrak resmi KPI/keuangan.
- Hasil/screenshot v1.0–v1.1 adalah riwayat dan tidak dijadikan bukti visual A02.
- Bundle yang berubah setelah pengujian harus dibangun dan diuji ulang.

## Penerimaan berikutnya

Gunakan matriks paritas per halaman/widget dan acceptance A02. Periksa visual 14 laporan, sumber–review, simulator Jro, filter, navigasi sumber, CSV, empty/loading/error dan POS existing. Label demo tetap terlihat. Backend/live integration mempunyai gate tersendiri.
