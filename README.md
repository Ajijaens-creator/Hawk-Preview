# HAWK × JAENS — Prototipe Interaktif Terintegrasi (60 NV)

**Status: PROTOTIPE — semua data DEMO / SIMULASI.** Prototipe ini adalah spesifikasi fungsional dan referensi serah-terima developer untuk **engine HAWK ERP yang sudah ada**. Ia bukan ERP baru, bukan buku besar kedua, dan tidak terhubung ke API produksi.

Isinya satu aplikasi HTML yang dapat dinavigasi penuh: 60 layar NV-01 sampai NV-60 (NB-HAWK-01, modul A–J) berjalan di atas satu mesin state. Aplikasi memakai design token Black & Deep Gold, role switcher 10 role (12 pengguna demo), dan adapter integrasi Mock / HAWK API.

## Menjalankan

| Cara | Langkah |
|---|---|
| Langsung | Buka `index.html` di Chrome/Edge/Safari/Firefox. Tidak perlu build, server, atau internet. |
| Server statis | `npx serve .` atau `python3 -m http.server 8080`, lalu buka `http://localhost:8080`. |
| Deploy | Salin seluruh folder (`index.html` + `assets/`) ke hosting statis apa pun (Nginx, S3, Netlify, intranet). Tidak ada variabel lingkungan atau rahasia. |

Data demo disimpan di `localStorage` browser. Tombol **↺ Reset Demo Data** di sidebar mengembalikan semuanya ke data awal.

## Mencoba alur Owner (14 langkah)

1. Klik **▶ Walkthrough Owner** (kiri bawah). Setiap langkah mengganti role, membuka layar yang tepat, dan baru centang hijau setelah aksinya benar-benar dilakukan.
2. Alur yang diuji: **MRF Spa Shanti (Minyak Pijat Lavender 1L × 10)** → cek budget item → Supervisor setuju → split otomatis **4 lokal + 3 transfer dari Ubud + 3 beli** → PO → penerimaan & checklist → put-away scan bin → penyerahan 10/10 → ekstraksi faktur AI (simulasi) → three-way match → AP (SoD: BU Manager menyetujui) → jejak AP ke MRF → Budget vs Actual vs Commitment vs Forecast → AI Insight + bukti.
3. Ganti role kapan saja lewat avatar di kanan atas. Staff, Gudang, dan Supervisor mendapat menu yang lebih sederhana dan tampilan mobile-first.
4. Selector **Kondisi** di sidebar menampilkan state *loading* (Lambat) dan *error* (Gagal koneksi). Selector **Adapter** mengganti ke HAWK API, yang sengaja mengembalikan `NOT_CONNECTED`.
5. Toggle **Kontrak developer** menampilkan kontrak layar dan operasi di bawah setiap layar.

## Mencoba Smart Spend Money (foto nota)

Ganti role ke **Nyoman Dewi (Staff Spa Shanti)**, lalu Beranda › **Scan Nota** (NV-48). Pilih nota contoh "Nota tulisan tangan", tekan *Baca dengan AI (simulasi)*, perbaiki harga Pasir menjadi 350.000, konfirmasi field kuning, pilih metode bayar, lanjutkan klasifikasi, dan kirim. Lalu sebagai **Putu Sukma (Supervisor)** setujui, dan sebagai **Luh Ratna (Finance)** buka bukti, verifikasi, dan catat pembayaran. Ekstraksi adalah **AI SIMULATION**.

## Struktur

```
index.html                 shell + urutan script (tanpa build, tanpa ES module → jalan dari file://)
assets/css/hawk.css        design token & komponen (Black #0B0B0B, Gold #C99A2E, Canvas #F7F7F5, warna 7P)
assets/js/core/
  util.js                  format Rupiah/tanggal, ID HAWK (PR/PO/TR/GR/BL/JV/MT/WO/DC + YYYYMM + 5 digit)
  seed.js                  data DEMO (org dinamis, 7P, budget FY2026 & plan FY2027, item, stok, MRF, PO, aset)
  contracts.js             SATU sumber kebenaran operasi adapter + status integrasi
  store.js                 handler mock per operasi (validasi, transisi, jurnal, audit, rollback) + selector
  adapter.js               HAWK.api.call(op, payload, user) → MockAdapter | HawkApiAdapter (NOT_CONNECTED)
  ai.js                    AI deterministik (fakta/metrik/forecast/hipotesis/rekomendasi) + skenario
  registry.js              60 NV: nama resmi NB, role, kontrak layar
assets/js/ui/              ui.js (komponen), shell.js (navigasi, role switcher, tugas, notifikasi, walkthrough)
assets/js/screens/         a-nav … j-ai: satu file per modul, view = { render(ctx), actions }
tests/                     workflow.test.js (engine), e2e-walkthrough.js (klik UI), e2e-smart-spend.js (Smart Spend 390px), browser-all.js (12 user × 60 NV), responsive.js
tools/gen-docs.js          membuat SCREEN_MATRIX(.csv/_60NV.md), ROLE_PERMISSION_MATRIX(.csv/.md), INTEGRATION_CONTRACTS.md, HAWK_INTEGRATION_HOOKS.md, SCREEN_CONTRACTS.md
tools/build.js, build-vercel.js   production build dist/ dan paket Vercel siap upload
docs/                      dokumen serah-terima (lihat daftar di bawah)
```

## Dokumen

| Dokumen | Isi |
|---|---|
| [docs/MP-HAWK-03_AUDIT.md](docs/MP-HAWK-03_AUDIT.md) | Audit kedua ZIP paket Owner (A–E, F–J) dan apa yang diadopsi |
| [docs/SCREEN_MATRIX_60NV.md](docs/SCREEN_MATRIX_60NV.md) | 60 NV + status implementasi & cakupan uji per layar (E2E / Engine / Render) |
| [docs/ROLE_PERMISSION_MATRIX.md](docs/ROLE_PERMISSION_MATRIX.md) | Akses layar & izin operasi per role |
| [docs/HAWK_INTEGRATION_HOOKS.md](docs/HAWK_INTEGRATION_HOOKS.md) | Titik sambung ke HAWK, 77 operasi, status integrasi (belum ada yang terhubung) |
| [docs/SMART_SPEND_WORKFLOW.md](docs/SMART_SPEND_WORKFLOW.md) | Smart Spend Money & AI Receipt (NV-48, subview NV-M1..M6): 4 alur, kontrol, jurnal, skenario, kontrak |
| [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md) | Deploy ke Vercel tanpa GitHub, domain, SSL, checklist verifikasi |
| [docs/SCREEN_MATRIX.csv](docs/SCREEN_MATRIX.csv) | 60 NV: role, field, aksi, validasi, status, operasi, status integrasi |
| [docs/SCREEN_CONTRACTS.md](docs/SCREEN_CONTRACTS.md) | Kontrak developer per layar |
| [docs/WORKFLOW_MAP.md](docs/WORKFLOW_MAP.md) | Alur end-to-end, transisi status, jurnal akuntansi |
| [docs/ROLE_PERMISSION_MATRIX.csv](docs/ROLE_PERMISSION_MATRIX.csv) | Layar (lihat) dan operasi (eksekusi) per role |
| [docs/DATA_DICTIONARY.md](docs/DATA_DICTIONARY.md) | Entitas, field, format ID, aturan anti double-counting |
| [docs/INTEGRATION_CONTRACTS.md](docs/INTEGRATION_CONTRACTS.md) | 77 operasi adapter + status (TO VERIFY / NEW / UI-ONLY) + pemetaan hook paket Owner |
| [docs/AI_INTELLIGENCE_SPEC.md](docs/AI_INTELLIGENCE_SPEC.md) | 10 kemampuan AI, struktur insight 6 langkah, governance |
| [docs/DEVELOPER_HANDOFF.md](docs/DEVELOPER_HANDOFF.md) | Arsitektur, cara mengganti mock adapter, checklist integrasi |
| [docs/DESIGN_CONFLICTS.md](docs/DESIGN_CONFLICTS.md) | Konflik antar referensi dan keputusan yang diambil |
| [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) | Keterbatasan & keputusan yang masih menunggu Owner |
| [docs/VALIDATION_REPORT.md](docs/VALIDATION_REPORT.md) | Hasil tes: navigasi, tombol, role, konsistensi data, responsif, runtime |

Buat ulang dokumen yang otomatis dengan `node tools/gen-docs.js`.

## Deploy ke domain sendiri (Vercel / Cloudflare Pages)

**Paling sederhana (Vercel, tanpa GitHub):** `node tools/build-vercel.js` membuat `release/HAWK_JAENS_60NV_VERCEL_READY/` (sama dengan isi ZIP VERCEL_READY). Dari folder itu jalankan `npx vercel --prod` setelah mengisi `PREVIEW_CREDENTIALS`. Langkahnya ada di [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md).

`node tools/build.js` membuat **production build** di `dist/` (aset ber-hash, CSP ketat, noindex). Konfigurasi siap pakai sudah tersedia: `vercel.json` + `middleware.js` untuk Vercel, `wrangler.toml` + `functions/_middleware.js` untuk Cloudflare Pages. Preview dilindungi login lewat secret `PREVIEW_CREDENTIALS` dan menolak akses (503) bila secret belum diisi.

Langkah lengkap, record DNS CNAME, SSL, dan checklist verifikasi domain ada di **[deploy/DEPLOYMENT_GUIDE.md](deploy/DEPLOYMENT_GUIDE.md)**.

## Menjalankan tes

```
node tests/workflow.test.js          # engine: journey, budget, receiving, aset, org (Node saja)
node tests/e2e-walkthrough.js        # 14 langkah lewat klik UI di Chromium (butuh Playwright)
node tests/e2e-smart-spend.js        # Smart Spend 15 langkah di 390 px + screenshot M1–M6
node tests/browser-all.js            # 12 pengguna × 60 layar: render, akses, error runtime
node tests/responsive.js             # 60 layar × 1440 / 834 / 390 px: overflow & screenshot
node tests/deploy.test.js            # build, login Cloudflare & Vercel, CSP, desktop/iPad/mobile
```

## Aturan yang dijaga

- Foto nota: AI hanya membantu membaca (SIMULASI). Pengguna mengonfirmasi, approver menyetujui, Finance memverifikasi & membayar. Angka yang tidak terbaca tidak pernah diisi otomatis.
- AI tidak pernah menyetujui pembayaran, mengubah budget terkunci, atau memposting transaksi.
- PO adalah komitmen, bukan beban atau tagihan. Jurnal baru muncul saat GRN diposting (Dr Persediaan / Cr GRNI).
- Profit (P7) adalah hasil finansial, bukan pos belanja.
- Target grup Rp125 miliar tidak termasuk dalam budget operasional Spa–Essence.
- Cabang, divisi, cost center, dan aturan approval dapat ditambah, diubah, dinonaktifkan, dan diarsipkan tanpa mengubah kode.
- Permission di prototipe hanya simulasi tampilan. Backend HAWK wajib menegakkannya sendiri.
- Tidak ada password, kredensial, atau data keuangan JAENS asli di dalam prototipe.
