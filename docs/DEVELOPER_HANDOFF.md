# DEVELOPER HANDOFF — HAWK × JAENS (MP-HAWK-02 / MP-HAWK-03)

Dokumen ini ditujukan untuk tim developer HAWK yang akan memindahkan perilaku prototipe ke engine HAWK v2.11.6. Prototipe ini adalah **lapisan interaksi dan spesifikasi**. Prinsipnya: gunakan engine yang sudah ada (PR = engine MRF, PO, inventory, finance, asset). Jangan membangun ulang.

## 1. Arsitektur prototipe

```
UI (screens/*.js) ──ctx.act(op,payload)──▶ HAWK.api.call(op,payload,user)
                                              │
                         ┌────────────────────┴───────────────────┐
                         ▼                                        ▼
                 MockAdapter (DEMO)                       HawkApiAdapter
         cek role kontrak → store.exec(op)            NOT_CONNECTED sampai transport
         handler + rollback snapshot JSON             & mapping per operasi disediakan
                         │
              state DEMO (localStorage) + audit + jurnal PENDING_REVIEW
```

- **Satu pintu tulis.** Layar tidak pernah menulis state langsung. Semua perubahan lewat `HAWK.api.call`, sehingga mengganti adapter otomatis mengganti seluruh aplikasi.
- **Kontrak = sumber kebenaran.** `assets/js/core/contracts.js` berisi 77 operasi: modul HAWK terkait, status integrasi, role, input, output, transisi, validasi, dan event audit. Dokumen `INTEGRATION_CONTRACTS.md` dibuat dari file ini.
- **Atomik.** `store.exec` menyalin state sebelum handler berjalan. Bila validasi gagal, state dikembalikan utuh. Di produksi, ini setara dengan transaksi database + idempotency key.
- **Selector turunan.** Angka seperti budget actual/commitment/forecast, fulfillment MRF, aging AP, dan saldo GRNI dihitung dari transaksi (`HAWK.selectors`), bukan disimpan dua kali.

## 2. Mengganti mock adapter dengan HAWK API

Lakukan per operasi, bukan sekaligus.

1. **Verifikasi kemampuan existing.** Ambil satu operasi dari `INTEGRATION_CONTRACTS.md` berstatus `TO VERIFY` (mis. `mrf.create` ↔ Purchase Request HAWK). Cocokkan field: Request Location, Source Location, Job/Cost Center, Approve Status/Approved By (terlihat di screenshot PR/PO HAWK v2.11.6).
2. **Sediakan transport.** Contoh bentuk (asinkron):
   ```js
   const live = new HAWK.HawkApiAdapter({
     transport: async (opName, body, user) => {/* panggil endpoint HAWK yang SUDAH diverifikasi */},
     mappings: {
       'mrf.create': {
         mapRequest: (p, user) => ({ /* field PR HAWK */ }),
         mapResponse: (r) => ({ id: r.pr_no, status: r.approve_status /* … */ }),
       },
     },
   });
   ```
3. **Jadikan pemanggil async.** Di prototipe `ctx.act` sinkron. Untuk produksi, ubah `ctx.act` di `shell.js` menjadi `await HAWK.api.call(...)` dan tampilkan state loading. Selector "Kondisi → Lambat" menunjukkan tampilannya.
4. **Error terstruktur.** Kembalikan `{ ok:false, error:{ code, message, retryable } }`. UI sudah menampilkan toast dan state error (lihat "Kondisi → Gagal koneksi").
5. **Ubah status kontrak** ke `CONFIRMED EXISTING` hanya dengan link bukti (dokumentasi atau hasil tes). Tes `workflow.test.js` gagal bila ada kontrak CONFIRMED tanpa bukti. Perbarui tes itu saat bukti ditambahkan.
6. **Baca data.** Selector saat ini membaca state lokal. Saat engine siap, ganti per domain dengan operasi baca (`stock.query`, `budget.checkItem`, `audit.list`, `search.global`).

## 3. Kontrol yang wajib ditegakkan di backend

| Kontrol | Di prototipe | Wajib di HAWK |
|---|---|---|
| Role & scope | `contract.roles` + `ctx.inScope` (simulasi tampilan) | RBAC server per operasi dan per unit organisasi |
| Segregation of duties | Verifikator ≠ penyetuju tagihan; pembuat ≠ pemutus non-rutin; pembuat draft aturan approval ≠ penerbit | Sama, di server |
| Budget terkunci | `budget.updateLine` menolak budget LOCKED/plan; perubahan lewat revisi | Original dipertahankan; revisi beraudit |
| PO ≠ beban | PO tidak membuat jurnal; komitmen dihitung dari MRF disetujui yang belum diserahkan | Commitment terpisah dari actual |
| Idempotensi | Rollback snapshot | Idempotency key per operasi tulis (penerimaan parsial, posting GL) |
| Audit | `s.audit` (user, role, op, ref, detail, waktu) | Event audit tak dapat diubah |
| AI | Hanya membaca dan menyarankan; aksi insight = catatan manusia | Sama; tidak ada auto-approve/auto-post |

## 4. Alur dan jurnal

Lihat `WORKFLOW_MAP.md`. Ringkasan jurnal (semua dibuat `PENDING_REVIEW`, diposting Finance lewat engine HAWK di NV-51):

| Peristiwa | Jurnal |
|---|---|
| PO dibuat/disetujui | Tidak ada (komitmen) |
| GRN diposting | Dr 1140 Persediaan / Cr 2120 GRNI |
| Barang diserahkan ke MRF | Dr 61xx Beban 7P (per P) / Cr 1140 Persediaan |
| Tagihan disetujui | Dr 2120 GRNI + Dr 1150 PPN Masukan (+ Dr 5190 selisih harga bila ada) / Cr 2110 Utang Usaha |
| Pembayaran | Dr 2110 Utang Usaha / Cr 1110 Bank |
| WO selesai (ada biaya) | Dr 6210 Beban Pemeliharaan — Facility / Cr 2130 Biaya Masih Harus Dibayar |
| Kapitalisasi aset | Dr 1510 Aset Tetap / Cr 1590 Aset Dalam Penyelesaian / Utang |
| Smart Spend diverifikasi Finance (MP-HAWK-05) | Dr beban 7P / 1140 Persediaan / 1590 AUC (+ Dr 1150 PPN) / Cr 2155 Kas Kecil Menunggu Rekonsiliasi · 2110 Utang Usaha · 2140 Utang Reimburse |
| Smart Spend dibayar / direkonsiliasi | Dr 2155 / 2110 / 2140 / Cr 1120 Kas Kecil atau 1110 Bank (sekali per nota) |

Nomor akun adalah contoh. Petakan ke COA HAWK (TO VERIFY).

## 5. Konfigurasi dinamis

Cabang, divisi, BU, cost center, gudang/bin, aturan approval, dan alokasi shared office ada di state (NV-05 sampai NV-09). Tidak ada daftar cabang di kode layar. Cabang baru (mis. tes "Spa Seminyak") langsung muncul di MRF, budget, dan laporan, lengkap dengan cost center dan gudang otomatis. Arsip tidak menghapus histori (tidak ada hard delete).

## 6. Checklist sign-off developer (dari paket Owner, diperluas)

- [ ] Verifikasi kemampuan PR & PO HAWK terhadap alur MRF dan receiving (field Request/Source Location, Job, Approve Status).
- [ ] Validasi semantik stock ledger, stok in-transit transfer, dan saldo awal.
- [ ] Validasi posting GL/COA, PPN/AP, alokasi cost center, eliminasi antar-BU.
- [ ] Tes pemenuhan multi-gudang & penerimaan parsial tanpa duplikasi stok/komitmen (lihat T1–T3 di `workflow.test.js`).
- [ ] Tes workspace mobile therapist dan gudang (lihat `responsive.js`, 390 px).
- [ ] UAT bersama Supervisor, Purchasing, Receiving, Finance sebelum produksi.
- [ ] Tetapkan kebijakan yang masih DRAFT (lihat `KNOWN_LIMITATIONS.md`): limit pembelian darurat, batas kapitalisasi, toleransi three-way match (prototipe: harga harus sama persis, qty faktur ≤ qty diterima).

## 7. Smart Spend Money & AI Receipt Capture (MP-HAWK-05/06)

Rincian: `SMART_SPEND_WORKFLOW.md`. Yang wajib dibangun di backend HAWK sebelum fitur ini dipakai sungguhan:

1. **Unggah bukti**: object storage privat, file asli immutable + hash SHA-256, URL bertanda tangan berumur pendek, retensi sesuai kebijakan pajak.
2. **OCR/AI di server**: kunci penyedia AI hanya di server; hasil disimpan sebagai `ai` + confidence per field; jangan pernah mengisi angka yang tidak terbaca.
3. **Validasi ulang di server**: aritmetika, duplikat (hash, no. nota + supplier, supplier + tanggal + jumlah, no. faktur AP), batas darurat, scope pengguna, SoD.
4. **Jurnal**: kirim usulan ke GL HAWK yang ada (bukan ledger kedua); nomor jurnal dikembalikan HAWK.
5. **Faktur ber-PO**: teruskan ke three-way match yang ada (`doc.match` / `doc.verify`), bukan alur baru.
6. **Gudang**: penerimaan barang tanpa PO lewat engine inventory HAWK (ledger RECEIPT).

## 8. Order Sederhana (permintaan Owner 8 Nov 2026)

Detail lengkap di `docs/SIMPLE_ORDER.md`. Ringkasan untuk developer:

- Operasi baru: `order.quick`, `order.receive`, `order.pay`, `autoOrder.update`. Ketiganya **memanggil handler yang sudah ada** (`mrf.create`, `mrf.planFulfillment`, `transfer.dispatch/receive`, `po.createFromMrf/submit/send`, `grn.receive/post/putaway`, `mrf.issue`, `bill.pay`), bukan engine kedua.
- Langkah otomatis memakai aktor `SYS-RULE` (role `SYSTEM`, tidak bisa dipilih sebagai login atau role pengguna). Produksi: implementasikan sebagai service account HAWK dengan izin terbatas pada transisi yang diizinkan AR-13, dan audit yang menyebut nomor aturan.
- Aturan `AR-13` (doc `AUTO_ORDER`) disimpan di matriks approval. Field: `active`, `max`, `version`, `changes[]`. Hanya Finance/Admin/Owner yang dapat mengubah (`autoOrder.update`).
- Jurnal baru: `INVOICE_RECOGNITION` otomatis (Dr 2120 + 1150 / Cr 2110), `ADVANCE_PAYMENT` (Dr 1160 / Cr 1110), `ADVANCE_APPLY` (Dr 2110 / Cr 1160). Akun 1160 **DEMO, TO VERIFY**. `bill.pay` kini hanya membayar `total − advanceApplied`.
- Yang wajib diputuskan sebelum produksi: apakah faktur asli supplier tetap lewat three-way match NV-49; apakah transfer antar-outlet boleh dikirim tanpa konfirmasi gudang asal; apakah foto surat jalan wajib saat "Barang diterima".

## 9. Flow Intelligence & Control Tower (MP-HAWK-08, NV-61/62)

Detail di `docs/CONTROL_TOWER.md` (SLA, KPI, PFHI, isu) dan `docs/PROCESS_EVENT_ADAPTER.md` (field event minimum, urutan integrasi).

- **Engine:** `assets/js/core/flow.js` (`HAWK.flow`). Event dibentuk dari `history[]` dokumen yang sudah ada, jadi tidak ada ledger kedua. `F.journey(state, mrf)` mengembalikan events, tracks per jalur (lokal/transfer/PO), SLA per tahap, timeline 12 tahap, perjalanan keuangan, dan kelengkapan data.
- **Hook:** `store.exec` kini memanggil `HAWK.afterExec[]` setelah handler sukses, di dalam transaksi yang sama (rollback bila gagal). flow.js mendaftarkan evaluator SLA (`F.sync`) di sana. Produksi: ganti dengan job terjadwal + outbox event.
- **Data baru di state (schema 6):** `slaPolicies[]` (berversi, `changes[]`), `workCalendar`, `flowConfig.weights` (PFHI), `flowIssues[]` (append history), `flowHistory[]` (36 pesanan riwayat DEMO Agt–Okt untuk tren/P90), `po.eta` + `po.etaHistory[]` (`po.promised` tidak pernah diubah), `meta.offsetMin` (jam demo).
- **Operasi baru (modul K):** `flow.sync`, `flow.review`, `flow.assign`, `flow.requestUpdate`, `flow.escalate`, `flow.recordReason`, `flow.changeEta`, `flow.resolve`, `flow.updateSla`, `flow.setWeights`, `demo.advanceClock` (DEMO saja, jangan dibawa ke produksi).
- **UI:** `assets/js/screens/k-flow.js` (NV-61, NV-62, widget peran yang dibungkus ke NV-01/27/31/38/41/47/57/58). Registry: modul K; NV-62 `navHide: ['STAFF']` (staf membuka lewat widget NV-27).
- **Keputusan Owner yang dibutuhkan:** target SLA per tahap, ambang P0, bobot PFHI final, kalender kerja & libur per unit, siapa boleh mengubah SLA, apakah revisi ETA perlu bukti dari supplier.
