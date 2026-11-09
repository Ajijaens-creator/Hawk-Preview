# WORKFLOW MAP — dari Budget 7P sampai AI Insight

Semua angka DEMO. Setiap langkah memetakan ke layar NV, operasi adapter (lihat `INTEGRATION_CONTRACTS.md`), dan modul HAWK existing yang perlu diverifikasi.

## 1. Alur utama end-to-end (MP-HAWK-03 §5)

| # | Langkah | Layar | Operasi | Status / efek data | Akuntansi |
|---|---|---|---|---|---|
| 1 | Budget 7P tahunan (plan line unit × 7P × item, qty × harga, jenis dana, Operasional/Inovasi) | NV-15, 16, 17, 19 | `budget.upsertPlanLine` | Budget DRAFT | — |
| 2 | Distribusi bulanan/kuartal (bobot = 100%) | NV-20 | `budget.setWeights` | — | — |
| 3 | Ajukan → Head Review (Head of Division / BU Manager) → Finance Review → Owner Review → Locked | NV-21 | `budget.submit`, `budget.approve` | DRAFT → SUBMITTED → … → LOCKED; Original dikunci | — |
| 4 | Staff membuat MRF (unit, gudang, cost center otomatis dari scope) | NV-24–26 | `mrf.create` | SUBMITTED; rantai approval dari matriks NV-09 | — |
| 5 | Validasi budget item bulanan (qty & nilai) | NV-26, 30 | `budget.checkItem` | OK / WARN (proyeksi ≥ 90%) / OVER (> 100% atau tanpa budget) / EXCEPTION (non-rutin) → OVER & EXCEPTION menambah rantai AR-05 | — |
| 6 | Supervisor (dan approver lanjutan) memutus | NV-29, 30 | `mrf.decide` | APPROVE / REJECT / REVISION / ESCALATE; catatan wajib untuk tolak/revisi | Komitmen budget = qty disetujui yang belum diserahkan |
| 7 | Cek stok & jalur pemenuhan otomatis | NV-28 | `mrf.planFulfillment` | Alokasi: LOCAL → TRANSFER (gudang lain) → PURCHASE; jumlah alokasi selalu = qty diminta; stok lokal & sumber transfer di-reserve | — |
| 8a | Lokal: serahkan | NV-28, 45 | `mrf.issue` | issuedQty naik; MRF FULFILLED bila 10/10 | Dr 61xx Beban 7P / Cr 1140 Persediaan |
| 8b | Transfer antar cabang | NV-44, 28 | `transfer.create/dispatch/receive` | SUBMITTED → IN_TRANSIT → RECEIVED; stok berpindah, bukan pendapatan/biaya | — |
| 8c | Pembelian: konsolidasi MRF → draft PO | NV-32, 34, 35 | `po.createFromMrf`, `po.update`, `po.submit` | PO DRAFT → PENDING_APPROVAL; baris PO menyimpan `mrfRefs` | Tidak ada jurnal (komitmen) |
| 9 | Otorisasi PO sesuai matriks (≤10 jt Purchasing; >10 jt + BU Manager) lalu kirim | NV-36 | `po.decide`, `po.send` | APPROVED → SENT | — |
| 10 | Penerimaan: checklist qty diterima/rusak, foto surat jalan (simulasi) | NV-41, 42 | `grn.receive` | GRN RECEIVED (fisik, belum memengaruhi stok) | — |
| 11 | Posting penerimaan (dapat parsial) | NV-42 | `grn.post` | GRN POSTED; PO PARTIAL / RECEIVED; stok naik | Dr 1140 Persediaan / Cr 2120 GRNI |
| 12 | Put-away scan QR bin | NV-43 | `grn.putaway` | GRN STORED; alokasi PURCHASE menjadi siap diserahkan | — |
| 13 | Ledger & saldo | NV-40 | `stock.query` | Setiap mutasi = satu baris ledger (ISSUE, TRANSFER_OUT/IN, RECEIPT, RETURN, ADJUST) | — |
| 14 | AI invoice capture (simulasi OCR; draft) | NV-48 | `doc.capture` | DC… EXTRACTED; deteksi nomor faktur ganda | — |
| 15 | Three-way match PO–GRN–faktur | NV-49 | `doc.match` | MATCHED / MISMATCH (qty faktur ≤ diterima; harga = PO; supplier; PO/GRN ada) | — |
| 16 | Verifikasi manusia → AP draft | NV-49 | `doc.verify` | Dokumen VERIFIED; tagihan BL… SUBMITTED | — |
| 17 | Persetujuan tagihan (SoD: verifikator ≠ penyetuju) | NV-50 | `bill.approve` | APPROVED | Dr 2120 GRNI + Dr 1150 PPN Masukan (+ Dr 5190 selisih) / Cr 2110 Utang |
| 18 | Pembayaran (konfirmasi eksplisit; AI tidak pernah membayar) | NV-50 | `bill.pay` | PAID; PY-… | Dr 2110 Utang / Cr 1110 Bank |
| 19 | Review & posting GL lewat engine HAWK | NV-51 | `gl.post` | Jurnal PENDING_REVIEW → POSTED | Tidak ada buku besar kedua |
| 20 | Budget actual & produktivitas 7P | NV-23, 59 | selector | Actual = penyerahan (ISSUE) + WO selesai; Commitment = MRF disetujui belum diserahkan; Forecast = maks(actual+commitment, actual + run-rate × sisa bulan) | — |
| 21 | AI insight & dashboard | NV-57–60 | `ai.insights`, `insight.act` | Insight 6 langkah; tindakan manusia dicatat di audit | — |

**Tanpa double counting.** Satu peristiwa ekonomi hanya dicatat di satu tempat: PO tidak dihitung sebagai actual, GRN tidak dihitung sebagai beban, dan beban 7P baru diakui saat barang diserahkan. Tagihan mengosongkan GRNI, bukan membuat beban baru. Tes `e2e-walkthrough.js` memeriksa bahwa perubahan stok sama dengan jumlah mutasi ledger.

## 2. Contoh wajib — Spa Ubud, Minyak Pijat Lavender 1L × 10

| Sumber | Qty | Referensi | Hasil |
|---|---|---|---|
| Stok lokal WH-UBD | 4 | PR…  | Diserahkan langsung |
| Transfer dari WH-SHN | 3 | TR… | Dikirim → diterima → diserahkan |
| Pembelian | 3 | PO… → GR… → DC… → BL… | Diterima, disimpan di bin, diserahkan |
| **Total** | **10** | | MRF FULFILLED 10/10; jejak dapat ditelusuri dua arah (NV-28 ↔ NV-50) |

## 3. Status per dokumen

| Dokumen | Status |
|---|---|
| Budget | DRAFT → SUBMITTED (Head → Finance → Owner) → LOCKED; revisi: requested → APPROVED / REJECTED (Original tetap) |
| MRF (PR) | DRAFT → SUBMITTED → (ESCALATED) → APPROVED → IN_FULFILLMENT → FULFILLED; REJECTED / REVISION / CANCELLED |
| Transfer (TR) | SUBMITTED → IN_TRANSIT → RECEIVED |
| PO | DRAFT → PENDING_APPROVAL → APPROVED → SENT → PARTIAL → RECEIVED; darurat: SENT + approval susulan |
| GRN (GR) | RECEIVED (fisik) → POSTED → STORED |
| Dokumen faktur (DC) | EXTRACTED → MATCHED / MISMATCH → VERIFIED / REJECTED |
| Tagihan (BL) | SUBMITTED → APPROVED → PAID |
| Jurnal (JV) | PENDING_REVIEW → POSTED |
| Opname | COUNTING → SUBMITTED → APPROVED (penyesuaian ADJUST ke ledger) |
| Maintenance (MT) / WO | SUBMITTED → APPROVED → IN_PROGRESS; WO OPEN → WAITING_PARTS → COMPLETED |
| Aset | ACTIVE → PENDING_DISPOSAL → DISPOSED |
| Aturan approval | ACTIVE v(n) + draft revisi → diterbitkan Owner → ACTIVE v(n+1) |
| Insight AI | OPEN → ACKNOWLEDGE → ASSIGN → DONE / DISMISS (alasan wajib) |

## 4. Alur pendukung

| Alur | Layar | Catatan |
|---|---|---|
| Non-rutin / exceptional budget | NV-18 | Diajukan terpisah dari BHP rutin; pemutus ≠ pengaju (SoD) |
| Revisi & reforecast kuartalan | NV-22 | Revisi per plan line atau realokasi 7P; realokasi harus net nol kecuali diizinkan; Original tidak berubah |
| Pembelian darurat | NV-37 | Supervisor, maks Rp3 jt (DEMO); approval susulan BU Manager ≤ 24 jam; limit final menunggu Owner |
| Opname & penyesuaian | NV-46 | Selisih butuh persetujuan sebelum menyesuaikan ledger |
| Maintenance → suku cadang | NV-55 → NV-26 | WO dapat meminta part lewat MRF non-rutin; jejak WO ↔ MRF |
| Kapitalisasi, depresiasi, disposal | NV-56 | Disposal: diajukan Asset PIC, disetujui Finance/Owner |
| Investasi strategis | NV-13, 14 | Proposal → keputusan Owner → milestone; tidak masuk budget operasional sampai disetujui |
