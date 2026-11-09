# Process Event Tracking Adapter: spesifikasi (MP-HAWK-08)

Status keseluruhan: **TO VERIFY / NEW INTEGRATION REQUIRED**. Tidak ada endpoint HAWK yang sudah diverifikasi. Prototipe membentuk event dari **riwayat dokumen yang sudah ada** (`history[]` di MRF, PO, Transfer, Penerimaan, Tagihan, Pembayaran) di `assets/js/core/flow.js` → `HAWK.flow.journey()`. Tidak ada ledger kedua: event adalah *proyeksi baca*, bukan sumber kebenaran transaksi.

## 1. Prinsip

1. **Satu sumber kebenaran.** Qty, nilai, dan jurnal tetap di engine HAWK (PR/MRF, PO, inventory, finance). Event hanya mencatat *kapan*, *siapa*, dan *status sebelum/sesudah*.
2. **Append-only.** Event tidak pernah diubah atau dihapus. Koreksi = event baru.
3. **Jatuh tempo asli tidak pernah ditimpa.** Revisi ETA disimpan sebagai event `PO_ETA_REVISED` + `etaHistory`; `promised` dan `dueOriginal` tetap.
4. **Idempoten.** Kunci unik `(source_engine, txn_id, line_id, event_type, timestamp)` mencegah event ganda saat sinkron ulang.
5. **Tidak menilai individu.** Field `actor` dipakai untuk audit dan tanggung jawab tahap, bukan untuk skor karyawan.

## 2. Field minimum per event

| Field | Tipe | Contoh | Sumber di prototipe | Status di HAWK |
|---|---|---|---|---|
| `event_id` | string unik | `EV-PR20261100006-014` | dibentuk adapter | NEW INTEGRATION REQUIRED |
| `txn_id` | string | `PR20261100006` | MRF id | TO VERIFY (ID PR terlihat di v2.11.6) |
| `line_id` | string/null | `PR20261100006#1` | baris MRF/PO | TO VERIFY |
| `related_docs[]` | string[] | `["PO20261100003","GR…"]` | alokasi & referensi | TO VERIFY |
| `org_unit` | string | `BR-UBD` | `mrf.branch` | TO VERIFY (Location) |
| `event_type` | enum | `MRF_SUBMITTED`, `APPROVAL_APPROVE`, `TRANSFER_DISPATCH`, `PO_SEND`, `PO_ETA_REVISED`, `GRN_PHYSICAL_RECEIPT`, `GRN_POST_INVENTORY`, `GRN_PUTAWAY`, `ISSUED`, `FULFILLMENT_COMPLETED`, `BILL_*`, `PAYMENT` | `history[].action` | NEW (penamaan baku) |
| `stage` | enum | `SUBMIT`, `BUDGET`, `APPROVAL`, `ALLOCATION`, `TRANSFER`, `PURCHASING`, `PO_APPROVAL`, `SUPPLIER`, `ARRIVAL`, `RECEIPT`, `PUTAWAY`, `ISSUE`, `DONE`, `FINANCE`, `PAYMENT` | dipetakan adapter | NEW |
| `timestamp` | ISO-8601 + zona | `2026-11-08T08:07:00Z` | `history[].ts` | TO VERIFY: apakah HAWK menyimpan jam, bukan hanya tanggal |
| `actor` | user id / `SYS-RULE` | `U-PUR` | `history[].by` | TO VERIFY (field APPROVED BY terlihat) |
| `assigned_pic` | role / user | `PURCHASING` | kebijakan SLA tahap | NEW |
| `status_before` / `status_after` | enum dokumen | `SENT` → `PARTIAL` | status dokumen | TO VERIFY |
| `sla_policy_id` + `version` | string, int | `SLA-VND` v1 | `slaPolicies` | NEW |
| `sla_due` | timestamp | `2026-11-11T17:00:00` | dihitung | NEW |
| `delay_reason_code` + `text` | enum + teks | `SUPPLIER_SHORT` | isu | NEW |
| `evidence_ref` | string | `PO20261100003`, foto surat jalan | dokumen | TO VERIFY (lampiran HAWK) |
| `source_engine` | string | `HAWK Purchase Order` | konstanta adapter | — |

Prototipe menampilkan event ini di **NV-62 › Dokumen & bukti › Process Event Log**. Tes `tests/workflow.test.js` T10 memeriksa bahwa setiap event memiliki semua field di atas.

## 3. Cara mengisi di produksi (urutan yang disarankan)

1. **Verifikasi** apakah HAWK v2.11.6 menyimpan log status per dokumen dengan jam dan user (ikon riwayat di toolbar). Jika ya, adapter cukup membaca log itu (status → `TO VERIFY` menjadi `CONFIRMED EXISTING` dengan bukti).
2. Jika tidak ada, tambahkan **outbox event** di setiap transisi status engine (satu baris per transisi, ditulis dalam transaksi yang sama).
3. Jalankan **evaluator SLA** terjadwal (mis. tiap 15 menit) yang membaca event + kebijakan SLA, lalu membuka/menutup isu. Di prototipe ini terjadi setelah setiap operasi (`HAWK.afterExec`) dan lewat tombol DEMO "Simulasi +24 jam".
4. Kalender kerja dan hari libur diambil dari master HR/Settings (NEW). Di prototipe: 08:00–17:00, Senin–Sabtu, libur DEMO.
5. Hak akses: isu dan event mengikuti scope unit pengguna. UI tidak menggantikan otorisasi di server.

## 4. Operasi adapter (kontrak di `assets/js/core/contracts.js`, modul K)

| Operasi | Status | Catatan |
|---|---|---|
| `flow.sync` | TO VERIFY | Evaluasi SLA; satu isu per masalah (`MRF|dokumen|tahap`) |
| `flow.review`, `flow.assign`, `flow.requestUpdate`, `flow.escalate`, `flow.recordReason`, `flow.resolve` | NEW INTEGRATION REQUIRED | Semua tercatat di audit + `issue.history[]` |
| `flow.changeEta` | TO VERIFY | Mengisi `po.eta` + `etaHistory`; `po.promised` tidak berubah |
| `flow.updateSla` | NEW INTEGRATION REQUIRED | Kebijakan berversi, before/after |
| `flow.setWeights` | UI-ONLY SIMULATION | Bobot PFHI provisional |
| `demo.advanceClock` | UI-ONLY SIMULATION | Hanya demo. Tidak boleh ada di produksi |
