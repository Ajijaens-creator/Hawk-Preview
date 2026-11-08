# KNOWN LIMITATIONS — apa yang belum selesai atau belum terbukti

## A. Batas prototipe (disengaja)

1. **Tidak ada backend.** Semua data adalah state DEMO di browser (`localStorage`). Mode "HAWK API" mengembalikan `NOT_CONNECTED` untuk setiap operasi. Tidak ada endpoint yang dikarang.
2. **Permission hanya simulasi.** Pengecekan role/scope di UI dan adapter mock bukan keamanan. RBAC wajib ditegakkan di server HAWK.
3. **AI dan OCR disimulasikan.** Insight berasal dari aturan deterministik, dan ekstraksi faktur memakai faktur contoh. Tidak ada model yang membaca dokumen sungguhan.
4. **Operasi sinkron.** Adapter mock menjawab seketika. State loading ditunjukkan lewat selector "Kondisi → Lambat". Implementasi produksi harus asinkron (lihat DEVELOPER_HANDOFF §2).
5. **Jam demo deterministik.** Waktu mulai 8 Nov 2026 dan maju 7 menit per aksi, agar jejak audit berurutan dan tes dapat diulang. Periode budget item = November 2026, plan = FY2027.
6. **Upload file nyata tidak didukung.** Scan surat jalan, QR bin, dan barcode disimulasikan dengan tombol.
7. **Tanpa ekspor.** CSV/PDF untuk laporan belum dibuat; dokumen developer dibuat dengan `tools/gen-docs.js`.
8. **Satu bahasa.** UI berbahasa Indonesia. Nama layar resmi NB tetap dalam bahasa Inggris sesuai matriks.

## B. Menunggu keputusan Owner

| Topik | Kondisi di prototipe | Yang dibutuhkan |
|---|---|---|
| Limit pembelian darurat | Rp3 jt/transaksi (DEMO); usulan prototipe B Rp1 jt/transaksi + Rp3 jt/minggu | Angka resmi & periode |
| Ambang tingkat approval MRF & PO | ≤1 jt / 1–5 jt / 5–25 jt / >25 jt; PO ≤10 jt | Konfirmasi |
| Basis alokasi shared office | Rasio contoh per pool | Basis & rasio resmi |
| Toleransi three-way match | Harga harus sama persis, qty faktur ≤ qty diterima | Toleransi % / nominal |
| Batas kapitalisasi aset & metode depresiasi | Garis lurus, umur per kategori contoh | Kebijakan akuntansi |
| Ruang lingkup inter-company Spa ↔ Essence | Transfer stok tidak membuat pendapatan | Konfirmasi legal/akuntansi |

## C. Perlu verifikasi dengan engine HAWK (TO VERIFY)

- Pemetaan MRF → Purchase Request HAWK (Request/Source Location, Job, Approve Status/Approved By).
- Field PO HAWK untuk Deliver To, termin, PPN, ongkos kirim, dan persetujuan.
- Stok in-transit transfer, penerimaan parsial, dan saldo awal di ledger HAWK.
- COA, akun GRNI/PPN, dan posting jurnal via tab JOURNAL HAWK.
- Modul Asset Management HAWK: depresiasi dan disposal.
- Sumber data revenue/treatment (POS) untuk produktivitas 7P dan rasio BHP per treatment.

## D. Belum dibangun di prototipe

- Notifikasi eksternal (email/WhatsApp) dan eskalasi SLA otomatis berbasis waktu nyata.
- Multi-mata uang dan multi-periode akuntansi (closing).
- Riwayat versi untuk setiap master data selain aturan approval dan budget.
- Lampiran file sungguhan pada MRF/MT.

## E. Deployment & domain

- **Domain `preview-furchasing.jaens.id` belum aktif.** Belum ada deployment Vercel, record DNS, atau sertifikat SSL. Status ini baru boleh berubah setelah checklist di DEPLOY_VERCEL.md §5 lulus.
- **Ejaan subdomain** (`furchasing` vs `purchasing`) belum dikonfirmasi.
- **Login Vercel** (middleware.js) sudah diuji lewat `vercel build` lokal (CLI 65.12.1) dan menjalankan fungsi hasil kompilasi: 503 tanpa password, 401 tanpa login, lanjut bila login benar. Belum diuji di server Vercel sungguhan.
- **Upload drag-and-drop ("Vercel Drop")**: belum dapat dipastikan menjalankan middleware. Jalur yang terdokumentasi dan diuji adalah Vercel CLI dari folder. Bila Drop dipakai, wajib cek bahwa dialog login muncul.
- Basic Auth adalah kontrol akses preview, bukan sistem login aplikasi. Role switcher di dalam aplikasi tetap simulasi.

## F. Cakupan uji (jujur)

- **Semua 60 NV** memiliki view interaktif, dibuka oleh 12 pengguna demo tanpa error, dan diuji pada 1440/834/390 px.
- **17 NV** dioperasikan dengan klik UI nyata (walkthrough Owner 14 langkah).
- **24 NV** lain memiliki operasi tulis yang semuanya diuji di engine (`tests/workflow.test.js`), tetapi tidak setiap tombolnya diklik otomatis di browser. Tes browser hanya memastikan tombol punya handler.
- **19 NV** adalah layar baca/dashboard/laporan; diuji render dan akses.
- Rincian per layar: SCREEN_MATRIX_60NV.md.
- Belum ada uji di Safari iPad/iPhone asli; uji tablet & mobile memakai Chromium dengan ukuran layar tersebut.

## G. Smart Spend Money & AI Receipt Capture (MP-HAWK-05/06)

- **AI SIMULATION.** Pembacaan nota deterministik dari 9 nota contoh sintetis. Foto asli pengguna tidak dibaca. Field-nya diisi manual. OCR sungguhan membutuhkan layanan di server dengan kunci API di server (NEW INTEGRATION REQUIRED); belum ada yang terhubung.
- **Penyimpanan bukti lokal.** Gambar & data tersimpan di `localStorage` browser (DEMO): tidak permanen, tidak aman sebagai arsip perusahaan, tidak terbagi antar perangkat, dan dibatasi kapasitas browser (foto diperkecil ke 900 px JPEG). Produksi butuh object storage privat + retensi + audit.
- **Akun GL & budget bulanan DEMO.** Nomor akun (6100–6210, 1140, 1590, 2110, 2140, 2155, 1110, 1120, 1150) dan alokasi budget cabang (budget tahunan × porsi cabang ÷ 12) adalah contoh, TO VERIFY terhadap COA & budget HAWK.
- **Limit darurat AR-08 (Rp3 jt)** dan ambang "budget hampir habis" (90%) masih DEMO, menunggu keputusan Owner.
- **Kamera:** `capture="environment"` membuka kamera di HP. Di desktop yang terbuka pemilih file. Belum diuji di Safari iPhone/iPad asli.
- **PDF** diterima sebagai lampiran hanya di produksi. Pratinjau hanya menampilkan gambar.
- **Font tulisan tangan** di nota contoh memakai font sistem (tanpa unduhan font), jadi tampilannya sedikit berbeda antar perangkat.
