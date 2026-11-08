# AI INTELLIGENCE SPEC — HAWK × JAENS

**Status di prototipe: UI-ONLY SIMULATION.** Tidak ada model AI, OCR, atau LLM yang aktif. Insight dihasilkan oleh aturan deterministik (`assets/js/core/ai.js`) dari data DEMO, sehingga hasilnya dapat diuji ulang. Tidak ada temuan yang boleh disajikan sebagai fakta bisnis JAENS.

## 1. Struktur wajib setiap insight (MP-HAWK-03)

Setiap insight tampil di drawer sebagai rantai enam langkah (`.ichain`, `shell.js → HAWK.openInsight`):

| # | Langkah | Field | Aturan |
|---|---|---|---|
| 1 | Temuan (Finding) | `finding` + pernyataan FACT/METRIC | Hanya dari data sumber yang disebut |
| 2 | Bukti (Evidence) | `evidence[]` dengan ID yang dapat diklik (MRF, PO, GRN, tagihan) atau tautan ke layar NV | Wajib ≥ 1; drill-down ke sumber |
| 3 | Dampak bisnis | `impact` + pernyataan FORECAST/HYPOTHESIS | Selalu berlabel *estimasi* |
| 4 | Rekomendasi | pernyataan RECOMMENDATION | Berlabel "perlu persetujuan manusia" |
| 5 | Peran penanggung jawab | `owner` (role) + `workflow` | Dikirim ke pemilik area |
| 6 | Keputusan manusia | `insightState` via `insight.act` | ACKNOWLEDGE / ASSIGN / DONE / DISMISS (alasan wajib); tercatat di audit |

Lima jenis pernyataan selalu dibedakan secara visual: **Fakta terverifikasi**, **Metrik terhitung**, **Estimasi/forecast**, **Hipotesis**, **Rekomendasi**. Setiap insight juga menyebut sumber data dan tanggal *as-of*.

## 2. Sepuluh kemampuan yang diminta

| # | Kemampuan | Implementasi prototipe | Layar | Data sumber | Status untuk produksi |
|---|---|---|---|---|---|
| 1 | Ekstraksi faktur | `doc.capture`: faktur contoh (A–D) menghasilkan field + confidence; deteksi nomor faktur ganda (`AI-DUP`) | NV-48 | Dokumen upload | NEW INTEGRATION REQUIRED (OCR/LLM + review manusia) |
| 2 | Varians budget | `AI-VAR`: forecast 7P vs revised; `AI-BGT`: laju budget item bulanan | NV-23, 30, 57 | Budget, ledger ISSUE, MRF | Aturan dapat dipindah ke HAWK Analytics |
| 3 | Anomali pemakaian BHP | `AI-BGT` (proyeksi pemakaian item > laju budget) + hipotesis per treatment | NV-30, 58 | Ledger ISSUE, budget item | Butuh data treatment POS untuk rasio per treatment (TO VERIFY) |
| 4 | Prediksi stok | `AI-STK`: stok < minimum, perkiraan hari habis | NV-38, 40 | Saldo stok, pemakaian | |
| 5 | Perbandingan supplier | Tabel quotation + `AI-PRC` (tren harga 6 bulan) | NV-34 | Quotation, riwayat harga PO | |
| 6 | Optimasi pembelian | `AI-CON`: konsolidasi kebutuhan beberapa MRF ke satu PO per supplier/gudang | NV-32 | MRF disetujui jalur PURCHASE | |
| 7 | Review eksepsi Finance | `AI-MIS` (selisih three-way match), `AI-GRNI` (diterima belum ditagih), `AI-DUP` | NV-47, 49, 51 | Dokumen, GRN, tagihan | |
| 8 | Maintenance aset | `AI-AST`: servis preventif jatuh tempo dari interval | NV-53, 55 | Register aset | |
| 9 | Produktivitas 7P | `AI-PRD` + NV-59 (revenue/biaya per P, efisiensi, efektivitas) | NV-59 | Revenue DEMO, actual 7P | Butuh data revenue/treatment terverifikasi |
| 10 | Skenario forecast | `HAWK.AI.scenario(s, drivers)`: tamu, harga, biaya, cabang baru → revenue, profit, margin, capex 12 bulan | NV-60 | Target & actual DEMO | Hasil = ESTIMASI, bukan target |

## 3. Governance (tidak dapat ditawar)

- AI **tidak pernah** menyetujui pembayaran, memposting jurnal, mengubah budget terkunci, membuat PO, atau menyetujui MRF. Semua tombol aksi insight hanya mencatat keputusan manusia.
- Hasil ekstraksi selalu draft. Finance harus menjalankan three-way match dan memverifikasi sebelum AP dibuat.
- Insight dibatasi oleh scope role pengguna. Supervisor hanya melihat cabangnya.
- Abaikan (DISMISS) wajib disertai alasan dan dicatat di audit.
- Angka yang ditampilkan berlabel DEMO/SIMULASI sampai sumber data HAWK terverifikasi.

## 4. Kontrak integrasi

| Operasi | Hook paket Owner | Status |
|---|---|---|
| `ai.insights` | `intelligence.getSourceLinkedInsights` | UI-ONLY SIMULATION |
| `ai.scenario` | — | UI-ONLY SIMULATION |
| `doc.capture` | `invoice.extractDraft` | UI-ONLY SIMULATION |
| `insight.act` | — | NEW INTEGRATION REQUIRED |

Untuk produksi, setiap insight wajib menyimpan: versi aturan/model, parameter, snapshot ID bukti, dan waktu evaluasi. Dengan begitu, rekomendasi dapat diaudit ulang.
