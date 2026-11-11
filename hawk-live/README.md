# HAWK ERP · Preview empat portal (Finance → Operational → Commercial → Sales)

**DATA DEMO / SIMULASI.** Sandbox lokal: tanpa PHP, akun pengguna, API, pesan, pembayaran, atau deployment sungguhan.
Paket brief asal dari Aji (11 Nov 2026) disimpan apa adanya di `reference/`.

## Membuka

| Cara | Langkah |
|---|---|
| Offline, satu file | Buka `preview.html` (semua portal) atau `preview-commercial.html`, `preview-sales.html`, `preview-finance.html`, `preview-operational.html` langsung dari disk. |
| Source | `index.html` (semua portal) atau entry per portal `commercial.html`, `sales.html`, `finance.html`, `operational.html`. Butuh server statis: `python3 -m http.server 8811`, lalu buka `http://localhost:8811/hawk-live/`. |
| Hosted | `https://<domain preview>/hawk-live/portal` (alias dari `/hawk-live`; `portal.html` = salinan `index.html` agar path relatif benar di bawah cleanUrls) (disalin ke `dist/hawk-live/` oleh `node tools/build.js`). |

Bangun ulang file mandiri: `node tools/build-hawk-live.js`.

**Reset Demo**: Peta alur HAWK (`#bridge`) atau Peta Preview (`#screens`). Filter, role demo, dan state sandbox tersimpan di `localStorage` browser.

## File

| File | Isi |
|---|---|
| `model.js` | Model sandbox lintas portal dari paket asal (budget, MRF, lead, booking, POS, referral, komisi, tugas). Hanya ditambah ekspor Node untuk uji. |
| `ser-data.js` | Fixture SER tingkat transaksi (deterministik) + agregasi + definisi metrik. Tersambung ke `model.js`. |
| `app.js` | Shell, router hash, F1-01, F1-02, F1-03, F1-04, F7-01, dan layar sandbox asal. |
| `style.css` | Token dari HAWK-BRAND-GUIDELINES.md. |

## Uji

- `node tests/hawk-live/model.test.js`: 8 uji terima sandbox dari brief + rekonsiliasi SER + koneksi sandbox→SER.
- `python3 -m http.server 8811 & node tests/hawk-live/browser.e2e.js`: Playwright, klik nyata, 1440 px dan 390 px.

Laporan fase: `docs/hawk-live/FASE-1-LAPORAN.md`.
