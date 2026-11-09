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

- **Domain `preview.hawk.jaens.id`** (diganti Owner dari preview-furchasing pada 8 Nov 2026). Proyek Vercel `hawk-jaens-preview` sudah terdeploy dan domain terverifikasi lewat TXT; status live baru boleh diklaim setelah CNAME, SSL, dan login diuji dari luar (DEPLOY_VERCEL.md §5).
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

## H. Order Sederhana (permintaan Owner 8 Nov 2026)

- **Aturan, bukan AI.** Persetujuan, PO, kirim ke supplier, posting stok, put-away, dan tagihan dijalankan aktor `SYS-RULE` berdasarkan aturan AR-13. Aturan ini **NEW INTEGRATION REQUIRED**: engine HAWK belum diketahui punya mekanisme auto-approve.
- **Batas Rp5 jt** dipilih Owner (8 Nov 2026) dan ditandai DEMO. Finance, Super Admin, dan Owner dapat mengubahnya langsung (dengan alasan & jejak audit). Ini **tidak** memakai pola draft → terbit Owner seperti aturan NV-09 lain, atas permintaan Owner.
- **Kirim PO "otomatis"** hanya mengubah status menjadi SENT. Tidak ada email/WA ke supplier di prototipe.
- **Tagihan otomatis** = harga PO × qty diterima (2-way match). Faktur asli supplier tetap harus dilampirkan; selisih harga faktur vs PO belum dicek di jalur otomatis (TO VERIFY: apakah faktur tetap lewat NV-49).
- **Pemesan = penerima.** Di jalur sederhana staf yang memesan juga mengonfirmasi barang datang. Kontrol pengganti: harga & supplier ditetapkan sistem, nilai dibatasi, budget dicek, Finance terpisah sebagai pembayar. Pertimbangkan foto surat jalan sebagai syarat bila risiko dianggap tinggi.
- **Transfer antar-gudang** dari outlet lain dikirim otomatis tanpa konfirmasi gudang asal (penyederhanaan). Di produksi, gudang asal sebaiknya tetap menekan "Kirim".
- **Uang muka** (bayar sebelum barang datang) memakai akun 1160 Uang Muka Pembelian (DEMO, TO VERIFY terhadap COA HAWK). Bila backorder dibatalkan setelah dibayar penuh, sisa uang muka perlu diselesaikan manual (belum ada alur retur dana).

## I. Flow Intelligence Control Tower (MP-HAWK-08)

- **Event diturunkan dari riwayat dokumen prototipe.** Belum diverifikasi bahwa HAWK v2.11.6 menyimpan jam (bukan hanya tanggal) dan user per perubahan status. Bila tidak, dibutuhkan outbox event baru (NEW INTEGRATION REQUIRED).
- **Target SLA, ambang P0, kalender kerja, dan hari libur adalah DEMO.** Perlu keputusan Owner. Kalender sama untuk semua unit (belum per outlet / shift spa).
- **PFHI provisional.** Bobot 40/25/20/15 dari brief, belum divalidasi terhadap data historis nyata. Riwayat Agt–Okt (36 pesanan) sintetis/DEMO.
- **Jam demo** ("Simulasi +24 jam") memajukan waktu seluruh demo, termasuk tanggal dokumen baru. Fitur ini hanya untuk demo.
- **Evaluasi SLA** berjalan setelah setiap aksi di browser. Produksi butuh job terjadwal di server (mis. tiap 15 menit) dan notifikasi nyata. "Minta update" dan "Eskalasi" di prototipe hanya mencatat, tidak mengirim pesan.
- **Satu isu per tahap per dokumen.** Penerimaan parsial berulang pada PO yang sama tetap satu isu supplier. Pembatalan backorder belum punya alur khusus.
- **AI** = aturan deterministik. Perkiraan ETA AI hanya hipotesis (keyakinan rendah).
- **Skor supplier** (70/20/10) DEMO, belum disahkan Purchasing/Owner.

## J. Demo Experience Center (MP-HAWK-09)

- **Login role demo hanya di frontend** (pergantian user di browser, data sintetis). Ini bukan keamanan. Untuk staging dibutuhkan sesi demo sementara di server yang terikat ke sandbox sintetis (NEW INTEGRATION REQUIRED, kontrak usulan di `docs/DEMO_EXPERIENCE_CENTER.md` §7). Belum dibangun.
- **Sandbox bersama = localStorage satu browser.** Lima layar berbagi state karena satu origin di satu browser. Dua orang di dua perangkat tidak melihat sandbox yang sama. Bukan penyimpanan permanen.
- **Review & kunci alokasi Shared Office** (NV-07) adalah fitur baru prototipe (NEW INTEGRATION REQUIRED); belum ada di HAWK v2.11.6 menurut bukti yang ada.
- **Butuh http(s).** Lewat `file://` layar role tidak dapat dikendalikan.
- **Layar penuh** tergantung browser (tidak tersedia untuk elemen di Safari iPhone; pakai ⤢).
- **Header** `frame-ancestors 'self'` / `X-Frame-Options: SAMEORIGIN` (sebelumnya `'none'` / `DENY`) agar aplikasi dapat membingkai dirinya sendiri.
- **Belum diuji di Safari/iPad fisik**; diuji di Chromium (Playwright) dengan ukuran 390/834/1440 px. NOT VERIFIED di perangkat nyata.
- **Penerimaan di outlet** (keputusan Owner 8 Nov): diterima akun outlet dengan satu tombol; posting stok & simpan dilakukan sistem. Belum ada foto surat jalan wajib saat terima (pertanyaan terbuka di Order Sederhana).
- **Akun demo memakai nama tim JAENS** (permintaan Owner 8 Nov 2026), tetapi seluruh data tetap DEMO/sintetis. Preview saat ini publik tanpa login, jadi nama-nama ini terlihat oleh siapa pun yang membuka tautan.
- JAENS Spa Center = outlet Ubud (dikonfirmasi Owner 9 Nov 2026). Data skenario demo (stok, nota, aset AC) dipindah ke Ubud; angka-angkanya tetap sintetis.
