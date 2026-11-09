/* DX-HAWK-01 Demo Experience Center — scenario catalog & runner (MP-HAWK-09).
   DOM-free: used by the browser (Test Lab + 5-screen simulator) and by Node tests.

   Rules
   - No second engine: every step runs the SAME domain operations as the real screens (HAWK.api.call →
     contracts role check → store.exec handler). The tutor never writes business data directly.
   - Each step names the real screen (NV), the user that acts, and a stable target ID (tid) that resolves to
     the real button in that screen. A step is DONE when the shared state shows the outcome — whether the
     user clicked the real button or pressed "Jalankan Langkah Ini".
   - Review-only steps (no transaction) are marked REVIEWED explicitly. Missing controls → BLOCKED, never a fake PASS.
   - Role login here is a DEMO role switch on synthetic data, NOT authentication. */
(function (root) {
  'use strict';
  const HAWK = root.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const H = HAWK.handlers;
  const E = HAWK.engine;

  const ROLE5 = [
    { key: 'FINANCE', user: 'U-FIN', label: 'Finance Manager', device: 'desktop', home: 47 },
    { key: 'PURCHASING', user: 'U-PUR', label: 'Purchasing', device: 'desktop', home: 31 },
    { key: 'BU_MANAGER', user: 'U-BUM', label: 'BU Manager', device: 'desktop', home: 1 },
    { key: 'SUPERVISOR', user: 'U-SPV', label: 'Supervisor Outlet', device: 'ipad', home: 29 },
    { key: 'STAFF', user: 'U-STF', label: 'Staff / Therapist', device: 'mobile', home: 24 },
  ];
  // roles that the current app requires for some steps but that are not one of the five demo screens
  const SUPPORT = { 'U-WHS': 'Gudang pusat (peran pendukung)', 'U-RCP': 'Receptionist outlet (peran pendukung)', 'U-ATD': 'Attendant outlet (peran pendukung)', 'U-AOM': 'Asisten Manager Operasional (peran pendukung)', 'U-GAS': 'General Accounting Supervisor (peran pendukung)', 'U-BUE': 'Manager BU JAENS Essence (peran pendukung)', 'U-AST': 'Inventory & Aset (peran pendukung)', 'U-OWN': 'Owner (peran pendukung)' };
  const DEVICES = { desktop: { w: 1280, h: 860, label: 'Desktop' }, ipad: { w: 834, h: 1112, label: 'iPad' }, mobile: { w: 390, h: 844, label: 'Mobile' } };

  /* ---- stable target IDs → selector in the REAL screen (contract for developers; see docs/DEMO_EXPERIENCE_CENTER.md) ---- */
  const TARGETS = {
    'dx-mrf-new': { nv: 26, sel: '[data-a="next0"]', label: 'Wizard Buat MRF › Lanjutkan' },
    'dx-mrf-approve': { nv: 29, sel: '[data-a="decide"][data-d="APPROVE"][data-m="{mrf}"]', label: 'Antrian approval › Setujui' },
    'dx-mrf-issue': { nv: 45, sel: '[data-a="issue"][data-p="{mrf}"]', label: 'Serah terima MRF › Serahkan' },
    'dx-trf-dispatch': { nv: 44, sel: '[data-a="disp"][data-p="{tr}"]', label: 'Transfer › Kirim' },
    'dx-trf-receive': { nv: 44, sel: '[data-a="recv"][data-p="{tr}"]', label: 'Transfer › Terima' },
    'dx-po-create': { nv: 32, sel: '[data-a="create"]', label: 'Konsolidasi › Buat draft PO' },
    'dx-po-approve': { nv: 36, sel: '[data-a="approve"][data-p="{po}"]', label: 'PO › Setujui' },
    'dx-grn-receive': { nv: 42, sel: '[data-a="receive"]', label: 'Penerimaan › Konfirmasi penerimaan fisik' },
    'dx-out-recv': { nv: 24, sel: '[data-a="recv"][data-id2="{mrf}"]', label: 'Pesanan › Barang sudah diterima (akun outlet)' },
    'dx-out-recvpart': { nv: 24, sel: '[data-a="recvPart"][data-id2="{mrf}"]', label: 'Pesanan › Ada yang kurang (terima sebagian)' },
    'dx-clock': { nv: 61, sel: '[data-a="demoClock"][data-h="72"]', label: 'Control Tower › Simulasi waktu (DEMO)' },
    'dx-issue-esc': { nv: 62, sel: '[data-a="isEsc"][data-is="{issue}"]', label: 'Isu › Eskalasi' },
    'dx-issue-update': { nv: 62, sel: '[data-a="isUpdate"][data-is="{issue}"]', label: 'Isu › Minta update' },
    'dx-issue-eta': { nv: 62, sel: '[data-a="isEta"][data-is="{issue}"]', label: 'Isu › Ubah ETA' },
    'dx-doc-capture': { nv: 48, sel: '[data-a="cap"][data-k="A"]', label: 'AI capture › Faktur contoh A' },
    'dx-bill-approve': { nv: 50, sel: '[data-a="appr"][data-p="{bill}"]', label: 'AP › Setujui tagihan' },
    'dx-bill-pay': { nv: 50, sel: '[data-a="pay"][data-p="{bill}"]', label: 'AP › Bayar' },
    'dx-journey': { nv: 62, sel: '.ft-step', label: 'Perjalanan pesanan › timeline 12 tahap' },
    'dx-sp-capture': { nv: 48, sel: '[data-a="ss_scan"]', label: 'Smart Spend › Scan Nota' },
    'dx-sp-fix': { nv: 48, sel: '[data-a="ss_next1"]', label: 'Review AI › koreksi harga baris 2 lalu Periksa & Lanjutkan' },
    'dx-sp-submit': { nv: 48, sel: '[data-a="ss_next1"]', label: 'Review AI › Periksa & Lanjutkan → Ajukan' },
    'dx-sp-approve': { nv: 48, sel: '[data-a="ss_dec"][data-v="APPROVE"][data-p="{sp}"]', label: 'Nota › Setujui' },
    'dx-sp-verify': { nv: 48, sel: '[data-a="ss_fin"][data-v="VERIFY"][data-p="{sp}"]', label: 'Nota › Verifikasi Finance' },
    'dx-sp-settle': { nv: 48, sel: '[data-a="ss_settle"][data-p="{sp}"]', label: 'Nota › Catat pembayaran' },
    'dx-bgt-7p': { nv: 16, sel: '#view .card', label: 'Ringkasan 7P' },
    'dx-bgt-weights': { nv: 20, sel: '[data-a="saveW"][data-b="BGT-2027-SPA"]', label: 'Distribusi bulanan › Simpan distribusi' },
    'dx-bgt-bhp': { nv: 17, sel: '#view table', label: 'Budget BHP rutin' },
    'dx-bgt-rev': { nv: 22, sel: '[data-a="reqP"][data-b="BGT-2026-SPA"]', label: 'Revisi › Ajukan realokasi' },
    'dx-bgt-revok': { nv: 22, sel: '[data-a="rvOk"][data-p="{rev}"]', label: 'Revisi › Setujui' },
    'dx-bgt-ora': { nv: 23, sel: '#view table', label: 'Original / Revised / Actual' },
    'dx-mt-new': { nv: 55, sel: '[data-a="report"]', label: 'Maintenance › Laporkan kerusakan' },
    'dx-mt-review': { nv: 55, sel: '[data-a="mtOk"][data-p="{mt}"]', label: 'Maintenance › Setujui' },
    'dx-wo-create': { nv: 55, sel: '[data-a="wo"][data-p="{mt}"]', label: 'Maintenance › Buat WO' },
    'dx-wo-complete': { nv: 55, sel: '[data-a="done"][data-p="{wo}"]', label: 'WO › Selesaikan WO' },
    'dx-gl-post': { nv: 51, sel: '[data-a="post"][data-p="{jv}"]', label: 'GL › Posting ke HAWK Finance (simulasi)' },
    'dx-alloc-edit': { nv: 7, sel: '[data-a="save"][data-pool="CC-OFC-FIN"]', label: 'Alokasi bersama › isi 60/40 lalu Simpan formula' },
    'dx-alloc-review': { nv: 7, sel: '[data-a="reviewAlloc"][data-pool="CC-OFC-FIN"][data-bu="{bu}"]', label: 'Alokasi bersama › Setuju' },
    'dx-alloc-lock': { nv: 7, sel: '[data-a="lockAlloc"][data-pool="CC-OFC-FIN"]', label: 'Alokasi bersama › Kunci periode' },
  };
  const fill = (tpl, v) => String(tpl).replace(/\{(\w+)\}/g, (m, k) => (v && v[k] !== undefined ? v[k] : m));
  const target = (tid, v) => {
    const t = TARGETS[tid];
    if (!t) return null;
    return { tid, nv: t.nv, sel: fill(t.sel, v), label: t.label, unresolved: /\{\w+\}/.test(fill(t.sel, v)) };
  };

  /* ---- helpers used by scenario steps ---- */
  const mrf = (s, id) => s.mrfs.find((m) => m.id === id);
  const po = (s, id) => s.pos.find((p) => p.id === id);
  const issueOf = (s, mrfId) => (s.flowIssues || []).find((i) => i.mrf === mrfId && i.stage === 'SUPPLIER');
  const allocRef = (s, id, path) => {
    const m = mrf(s, id);
    const a = m && m.lines[0].alloc.find((x) => x.path === path);
    return a ? a.ref : null;
  };
  const poOfMrf = (s, id) => s.pos.find((p) => p.lines.some((l) => (l.src || []).some((x) => x.mrf === id)) || (p.mrfs || []).includes(id)) || po(s, allocRef(s, id, 'PURCHASE'));
  const etaIn = (s, days) => new Date(Date.parse(HAWK.flow.now(s)) + days * 864e5).toISOString().slice(0, 10);
  const newMrf = (s, base, pred) => s.mrfs.find((m) => !base.includes(m.id) && pred(m));

  /* ======================= SCENARIOS ======================= */
  const SCENARIOS = [
    {
      id: 'MRF', name: 'MRF 10 botol → PO → Receiving → Finance', short: 'MRF → PO → Receiving → Finance',
      story: 'JAENS Spa Center butuh 10 botol Massage Oil: 4 stok lokal, 3 transfer dari Shanti, 3 dibeli. Supplier kirim 2, 1 terlambat → ETA revisi → 10/10 → faktur, AP, pembayaran terotorisasi, review BU.',
      steps: [
        { id: 'MRF-01', as: 'U-STF', tid: 'dx-mrf-new', title: 'Buat MRF 10 botol Massage Oil', what: 'Staff Ubud mengisi permintaan 10 botol BHP-001 (Massage Oil) dari layar Buat MRF.',
          run: (c) => c('mrf.create', { branch: 'BR-UBD', memo: 'DEMO DX — Massage oil weekend', lines: [{ item: 'BHP-001', qty: 10, reason: 'Pemakaian rutin' }] }, 'U-STF'),
          check: (s, v) => { const m = newMrf(s, v.base, (x) => x.requester === 'U-STF' && x.lines[0].item === 'BHP-001' && x.lines[0].qty === 10); return m && { mrf: m.id }; } },
        { id: 'MRF-02', as: 'U-SPV', tid: 'dx-mrf-approve', q: (v) => ({ id: v.mrf }), title: 'Supervisor menyetujui (budget item dicek)', what: 'Supervisor Ubud melihat dampak budget lalu menyetujui. Sistem langsung membagi pemenuhan 4 lokal / 3 transfer / 3 beli.',
          run: (c, s, v) => c('mrf.decide', { id: v.mrf, decision: 'APPROVE', note: 'Stok untuk weekend' }, 'U-SPV'),
          check: (s, v) => { const m = mrf(s, v.mrf); return m && m.status !== 'SUBMITTED' && m.lines[0].alloc.length ? { tr: allocRef(s, v.mrf, 'TRANSFER') } : null; } },
        { id: 'MRF-03', as: 'U-SPV', tid: 'dx-mrf-issue', title: 'Serahkan 4 botol dari stok lokal', what: 'Stok gudang Ubud cukup untuk 4 botol — langsung diserahkan ke pemohon (serah terima).',
          run: (c, s, v) => c('mrf.issue', { id: v.mrf }, 'U-SPV'),
          check: (s, v) => S.mrfFulfillment(s, mrf(s, v.mrf)).issued >= 4 && {} },
        { id: 'MRF-04', as: 'U-WHS', tid: 'dx-trf-dispatch', title: 'Gudang Shanti mengirim transfer 3 botol', what: 'Transfer antar-cabang dibuat otomatis saat alokasi. Gudang asal menekan Kirim (stok asal berkurang, status dalam perjalanan).',
          run: (c, s, v) => c('transfer.dispatch', { id: v.tr }, 'U-WHS'),
          check: (s, v) => { const t = s.transfers.find((x) => x.id === v.tr); return t && t.status !== 'REQUESTED' && {}; } },
        { id: 'MRF-05', as: 'U-SPV', tid: 'dx-trf-receive', title: 'Supervisor menerima transfer & menyerahkan', what: 'Barang transfer tiba di Ubud, diterima, lalu diserahkan → 7/10 terpenuhi.',
          run: (c, s, v) => { c('transfer.receive', { id: v.tr }, 'U-SPV'); c('mrf.issue', { id: v.mrf }, 'U-SPV'); },
          check: (s, v) => S.mrfFulfillment(s, mrf(s, v.mrf)).issued >= 7 && {} },
        { id: 'MRF-06', as: 'U-PUR', tid: 'dx-po-create', title: 'Purchasing membuat PO 3 botol', what: 'Kebutuhan beli 3 botol masuk konsolidasi. Purchasing membuat draft PO ke PT Aroma Bali Lestari dan mengajukannya.',
          run: (c, s, v) => { const picks = S.pendingPurchase(s()).filter((p) => p.mrf === v.mrf).map((p) => ({ mrf: p.mrf, li: p.li, ai: p.ai })); const p = c('po.createFromMrf', { picks, supplier: 'SUP-001' }, 'U-PUR'); c('po.submit', { id: p.id }, 'U-PUR'); },
          check: (s, v) => { const p = poOfMrf(s, v.mrf); return p && p.status !== 'DRAFT' && { po: p.id }; } },
        { id: 'MRF-07', as: 'U-PUR', tid: 'dx-po-approve', q: (v) => ({ id: v.po }), title: 'Approval PO & kirim ke vendor', what: 'PO di bawah batas disetujui sesuai matriks approval lalu dikirim ke vendor. Tanggal janji vendor tercatat.',
          run: (c, s, v) => { if (po(s(), v.po).status === 'PENDING_APPROVAL') c('po.decide', { id: v.po, decision: 'APPROVE' }, 'U-PUR'); c('po.send', { id: v.po }, 'U-PUR'); },
          check: (s, v) => po(s, v.po) && ['SENT', 'PARTIAL', 'RECEIVED'].includes(po(s, v.po).status) && {} },
        { id: 'MRF-08', as: 'U-SPV', tid: 'dx-out-recvpart', title: 'Barang tiba sebagian di outlet: 2 dari 3', what: 'Di outlet tidak ada orang gudang standby. Supervisor menekan "Ada yang kurang" dan mengisi 2 botol datang. Nama, outlet, divisi, dan BU terisi otomatis dari akun. Sistem membuat penerimaan, posting stok, simpan, dan serah terima → 9/10. PO PARTIAL (backorder 1).',
          run: (c, s, v) => c('order.receive', { id: v.mrf, lines: [{ item: 'BHP-001', received: 2, damaged: 0 }], note: '2 botol tiba, 1 menyusul' }, 'U-SPV'),
          check: (s, v) => { const g = s.grns.find((x) => x.po === v.po); return po(s, v.po).status !== 'SENT' && S.mrfFulfillment(s, mrf(s, v.mrf)).issued >= 9 && g && g.receivedBy && g.receivedBy.branch === 'BR-UBD' && {}; } },
        { id: 'MRF-09', as: 'U-PUR', tid: 'dx-clock', title: 'Waktu demo berjalan: vendor lewat janji', what: 'Tombol DEMO memajukan jam simulasi. Control Tower mendeteksi 1 botol lewat tanggal janji dan membuka 1 isu untuk Purchasing (alasan otomatis: supplier kirim sebagian).',
          run: (c) => c('demo.advanceClock', { hours: 120 }, 'U-PUR'),
          check: (s, v) => { const i = issueOf(s, v.mrf); return i && { issue: i.id }; } },
        { id: 'MRF-10', as: 'U-SPV', tid: 'dx-issue-esc', q: (v) => ({ mrf: v.mrf, tab: 'delay' }), title: 'Supervisor mengeskalasi ke BU Manager', what: 'Outlet butuh barang untuk weekend. Eskalasi wajib beralasan dan tercatat di riwayat isu.',
          run: (c, s, v) => c('flow.escalate', { id: v.issue, note: 'Outlet butuh untuk weekend' }, 'U-SPV'),
          check: (s, v) => { const i = s.flowIssues.find((x) => x.id === v.issue); return i && i.history.some((h) => /ESCALAT/.test(h.action)) && {}; } },
        { id: 'MRF-11', as: 'U-PUR', tid: 'dx-issue-eta', q: (v) => ({ mrf: v.mrf, tab: 'delay' }), title: 'Purchasing mencatat ETA revisi + alasan', what: 'ETA baru disimpan sebagai riwayat. Tanggal janji asli dan jatuh tempo SLA asli TIDAK ditimpa.',
          run: (c, s, v) => c('flow.changeEta', { po: v.po, eta: etaIn(s(), 2), code: 'SUPPLIER_SHORT', reason: 'Supplier konfirmasi sisa 1 botol dikirim lusa' }, 'U-PUR'),
          check: (s, v) => (po(s, v.po).etaHistory || []).length >= 1 && {} },
        { id: 'MRF-12', as: 'U-STF', tid: 'dx-out-recv', title: 'Botol terakhir tiba → therapist menerima → 10/10', what: 'Therapist yang sedang bertugas menekan "Barang sudah diterima" di HP. Penerima tercatat otomatis (nama, jabatan, outlet, divisi, BU). MRF selesai, isu tertutup otomatis, tahap supplier tercatat TERLAMBAT.',
          run: (c, s, v) => c('order.receive', { id: v.mrf }, 'U-STF'),
          check: (s, v) => mrf(s, v.mrf).status === 'FULFILLED' && {} },
        { id: 'MRF-13', as: 'U-FIN', tid: 'dx-doc-capture', title: 'Finance mencocokkan PO–GRN–faktur', what: 'Faktur supplier (contoh A, ekstraksi AI SIMULASI) dicocokkan 3 arah dengan PO dan penerimaan, lalu diverifikasi menjadi tagihan (AP draft).',
          run: (c) => { const d = c('doc.capture', { sample: 'A' }, 'U-FIN'); c('doc.match', { id: d.id }, 'U-FIN'); c('doc.verify', { id: d.id, decision: 'APPROVE' }, 'U-FIN'); },
          check: (s, v) => { const b = s.bills.find((x) => x.po === v.po && x.status !== 'VOID'); return b && { bill: b.id }; } },
        { id: 'MRF-14', as: 'U-BUM', tid: 'dx-bill-approve', title: 'BU Manager menyetujui tagihan (maker ≠ checker)', what: 'Yang memverifikasi faktur tidak boleh sekaligus menyetujui AP. Persetujuan membentuk jurnal utang (simulasi).',
          run: (c, s, v) => c('bill.approve', { id: v.bill }, 'U-BUM'),
          check: (s, v) => { const b = s.bills.find((x) => x.id === v.bill); return b && ['APPROVED', 'PAID'].includes(b.status) && {}; } },
        { id: 'MRF-15', as: 'U-FIN', tid: 'dx-bill-pay', title: 'Pembayaran terotorisasi (terpisah)', what: 'Pembayaran butuh konfirmasi eksplisit Finance. Ini SIMULASI: tidak ada dana keluar. Penerimaan barang, faktur, AP dan pembayaran adalah 4 status berbeda.',
          run: (c, s, v) => c('bill.pay', { id: v.bill, confirm: true }, 'U-FIN'),
          check: (s, v) => { const b = s.bills.find((x) => x.id === v.bill); return b && b.status === 'PAID' && {}; } },
        { id: 'MRF-16', as: 'U-BUM', tid: 'dx-journey', q: (v) => ({ mrf: v.mrf }), review: true, title: 'BU Manager meninjau siklus & SLA', what: 'Tinjau timeline 12 tahap, waktu siklus total, tahap supplier TERLAMBAT dan jejak bukti. Langkah tinjauan — tanpa transaksi.' },
      ],
    },
    {
      id: 'NOTA', name: 'Foto nota tulisan tangan → Spend Money', short: 'Foto nota → Spend Money',
      story: 'Staff memotret nota tulisan tangan. Ekstraksi AI SIMULASI menandai angka ragu; manusia mengoreksi, cek 7P & budget, Supervisor menyetujui, Finance memverifikasi dan merekonsiliasi dengan bukti digital.',
      steps: [
        { id: 'NOTA-01', as: 'U-STF', tid: 'dx-sp-capture', title: 'Foto nota tulisan tangan (AI SIMULASI)', what: 'Pilih contoh nota tulisan tangan. Hasil ekstraksi adalah simulasi deterministik — tidak ada OCR nyata di preview.',
          run: (c) => c('spend.capture', { scenario: 'HANDWRITTEN', branch: 'BR-UBD' }, 'U-STF'),
          check: (s, v) => { const x = (s.spends || []).find((d) => !v.baseSp.includes(d.id) && d.createdBy === 'U-STF'); return x && { sp: x.id }; } },
        { id: 'NOTA-02', as: 'U-STF', tid: 'dx-sp-fix', q: (v) => ({ tab: 'review', cur: v.sp }), title: 'Koreksi angka yang ragu', what: 'Harga "Pasir" terbaca 35.000 (ragu). Staff mengoreksi menjadi 350.000 sesuai nota, mengonfirmasi total dan metode bayar. Nilai AI asli tetap tersimpan terpisah.',
          run: (c, s, v) => { const sp = S.spend(s(), v.sp); c('spend.update', { id: v.sp, lines: sp.lines.map((l, i) => (i === 1 ? { ...l, price: 350000 } : l)) }, 'U-STF'); c('spend.update', { id: v.sp, confirm: ['total'], fields: { pay: 'CASH', payDate: '2026-11-07' } }, 'U-STF'); },
          check: (s, v) => { const sp = S.spend(s, v.sp); return sp && S.spendMath(sp).ok && !S.spendOpenIssues(sp).length && {}; } },
        { id: 'NOTA-03', as: 'U-STF', tid: 'dx-sp-submit', q: (v) => ({ tab: 'review', cur: v.sp }), title: 'Cek 7P / cost center / budget lalu ajukan', what: 'Rekomendasi 7P = Facility, cost center CC-UBD-OPS, budget bulanan masih cukup. Konfirmasi Staff ≠ persetujuan ≠ pembayaran.',
          run: (c, s, v) => c('spend.submit', { id: v.sp }, 'U-STF'),
          check: (s, v) => S.spend(s, v.sp).status !== 'DRAFT' && {} },
        { id: 'NOTA-04', as: 'U-SPV', tid: 'dx-sp-approve', q: (v) => ({ tab: 'history', sel: v.sp }), title: 'Supervisor menyetujui', what: 'Supervisor unit yang sama menyetujui. Supervisor cabang lain tidak bisa.',
          run: (c, s, v) => c('spend.approve', { id: v.sp, decision: 'APPROVE', note: 'Perbaikan saluran taman' }, 'U-SPV'),
          check: (s, v) => ['APPROVED', 'VERIFIED', 'SETTLED'].includes(S.spend(s, v.sp).status) && {} },
        { id: 'NOTA-05', as: 'U-FIN', tid: 'dx-sp-verify', q: (v) => ({ tab: 'history', sel: v.sp }), title: 'Finance verifikasi klasifikasi', what: 'Finance memverifikasi klasifikasi OPEX Facility → 1 jurnal PENDING_REVIEW seimbang. Komitmen budget pindah ke actual tanpa dobel.',
          run: (c, s, v) => c('spend.verify', { id: v.sp, note: 'Perbaikan kecil, OPEX' }, 'U-FIN'),
          check: (s, v) => ['VERIFIED', 'SETTLED'].includes(S.spend(s, v.sp).status) && {} },
        { id: 'NOTA-06', as: 'U-GAS', tid: 'dx-sp-settle', q: (v) => ({ tab: 'history', sel: v.sp }), title: 'General Accounting merekonsiliasi kas kecil', what: 'Pemisahan tugas: yang memverifikasi (Finance Manager) tidak ikut membayar, jadi General Accounting Supervisor yang merekonsiliasi. Butuh konfirmasi eksplisit. Bukti asli (gambar) tidak diubah; koreksi disimpan terpisah. Penyimpanan lokal browser BUKAN arsip dokumen permanen.',
          run: (c, s, v) => c('spend.settle', { id: v.sp, confirm: true }, 'U-GAS'),
          check: (s, v) => S.spend(s, v.sp).status === 'SETTLED' && {} },
      ],
    },
    {
      id: 'SLA', name: 'Vendor lewat SLA → eskalasi → selesai', short: 'Vendor SLA breach',
      story: 'PO 3 botol untuk Ubud sudah dikirim ke vendor. Vendor belum mengirim saat janji lewat → risiko stok outlet → BU eskalasi → ETA revisi → barang datang, isu selesai otomatis.',
      setup: (c, s) => {
        const m = c('mrf.create', { branch: 'BR-UBD', memo: 'DEMO DX — SLA vendor', lines: [{ item: 'BHP-001', qty: 10, reason: 'Pemakaian rutin' }] }, 'U-STF');
        c('mrf.decide', { id: m.id, decision: 'APPROVE', note: 'OK' }, 'U-SPV');
        const picks = S.pendingPurchase(s()).filter((p) => p.mrf === m.id).map((p) => ({ mrf: p.mrf, li: p.li, ai: p.ai }));
        const p = c('po.createFromMrf', { picks, supplier: 'SUP-001' }, 'U-PUR');
        c('po.submit', { id: p.id }, 'U-PUR');
        if (po(s(), p.id).status === 'PENDING_APPROVAL') c('po.decide', { id: p.id, decision: 'APPROVE' }, 'U-PUR');
        c('po.send', { id: p.id }, 'U-PUR');
        return { mrf: m.id, po: p.id };
      },
      steps: [
        { id: 'SLA-01', as: 'U-PUR', tid: 'dx-clock', title: 'Janji vendor lewat (jam DEMO)', what: 'Jam simulasi maju. Control Tower membuka isu tahap Supplier untuk Purchasing — satu isu per masalah, tanpa duplikat.',
          run: (c) => c('demo.advanceClock', { hours: 120 }, 'U-PUR'),
          check: (s, v) => { const i = issueOf(s, v.mrf); return i && { issue: i.id }; } },
        { id: 'SLA-02', as: 'U-SPV', tid: 'dx-issue-update', q: (v) => ({ mrf: v.mrf, tab: 'delay' }), title: 'Supervisor: risiko stok outlet', what: 'Supervisor melihat isu di unitnya dan meminta update karena stok tinggal untuk 2 hari.',
          run: (c, s, v) => c('flow.requestUpdate', { id: v.issue, note: 'Stok Massage Oil Ubud tinggal untuk 2 hari' }, 'U-SPV'),
          check: (s, v) => s.flowIssues.find((x) => x.id === v.issue).history.some((h) => /UPDATE/.test(h.action)) && {} },
        { id: 'SLA-03', as: 'U-BUM', tid: 'dx-issue-esc', q: (v) => ({ mrf: v.mrf, tab: 'delay' }), title: 'BU Manager mengeskalasi', what: 'BU Manager menaikkan isu sesuai kebijakan eskalasi (dengan alasan).',
          run: (c, s, v) => c('flow.escalate', { id: v.issue, note: 'Risiko layanan weekend — mohon perhatian' }, 'U-BUM'),
          check: (s, v) => s.flowIssues.find((x) => x.id === v.issue).history.some((h) => /ESCALAT/.test(h.action)) && {} },
        { id: 'SLA-04', as: 'U-PUR', tid: 'dx-issue-eta', q: (v) => ({ mrf: v.mrf, tab: 'delay' }), title: 'Purchasing: ETA revisi + alasan', what: 'ETA revisi tercatat; tanggal janji dan jatuh tempo SLA asli tetap. Isu berstatus Dipantau.',
          run: (c, s, v) => c('flow.changeEta', { po: v.po, eta: etaIn(s(), 1), code: 'SUPPLIER_LATE', reason: 'Vendor konfirmasi kirim besok pagi' }, 'U-PUR'),
          check: (s, v) => (po(s, v.po).etaHistory || []).length >= 1 && {} },
        { id: 'SLA-05', as: 'U-STF', tid: 'dx-out-recv', title: 'Barang tiba di outlet → isu selesai otomatis', what: 'Staf outlet yang ada (therapist, receptionist, atau attendant) menekan "Barang sudah diterima". Isu tertutup otomatis karena tahapnya selesai; riwayat tidak dihapus.',
          run: (c, s, v) => c('order.receive', { id: v.mrf }, 'U-STF'),
          check: (s, v) => { const i = s.flowIssues.find((x) => x.id === v.issue); return i && i.status === 'RESOLVED' && {}; } },
      ],
    },
    {
      id: 'BUDGET', name: 'Budget 7P tahunan → reforecast kuartal', short: '7P Budget → Reforecast',
      story: 'Budget 7P FY2027 dibagi bulanan, budget BHP rutin ditinjau, lalu reforecast kuartal FY2026 diajukan BU dan disetujui Owner. Original tidak pernah ditimpa.',
      steps: [
        { id: 'BGT-01', as: 'U-BUM', tid: 'dx-bgt-7p', review: true, title: 'Tinjau budget tahunan 7P', what: 'Ringkasan 7P FY2027 per BU. Profit (P7) adalah hasil, tidak dijumlahkan ke belanja.' },
        { id: 'BGT-02', as: 'U-BUM', tid: 'dx-bgt-weights', title: 'Distribusi bulanan (total 100%)', what: 'BU Manager menebalkan alokasi Desember (musim ramai). Hanya bisa saat Draft dan total harus 100%.',
          run: (c, s) => { const b = s().budgets.find((x) => x.id === 'BGT-2027-SPA'); c('budget.setWeights', { id: b.id, line: b.plan[0].id, weights: [7, 7, 8, 8, 8, 8, 8, 8, 8, 9, 9, 12] }, 'U-BUM'); },
          check: (s) => { const b = s.budgets.find((x) => x.id === 'BGT-2027-SPA'); return b.plan[0].weights && b.plan[0].weights[11] === 12 && {}; } },
        { id: 'BGT-03', as: 'U-SPV', tid: 'dx-bgt-bhp', review: true, title: 'Supervisor meninjau budget BHP rutin', what: 'Supervisor melihat qty × harga standar BHP rutin unitnya. Permintaan non-rutin tidak mengubah baseline rutin.' },
        { id: 'BGT-04', as: 'U-BUM', tid: 'dx-bgt-rev', title: 'Ajukan reforecast Q4 (net nol)', what: 'Realokasi Promotion → Product Rp15 jt pada budget FY2026 yang sudah terkunci. Ini usulan; Original tetap.',
          run: (c) => c('budget.requestRevision', { id: 'BGT-2026-SPA', quarter: 'Q4', reason: 'Reforecast Q4: harga minyak pijat naik', changes: [{ p: 'PROMOTION', delta: -15000000 }, { p: 'PRODUCT', delta: 15000000 }] }, 'U-BUM'),
          check: (s, v) => { const r = s.budgetRevisions.find((x) => !v.baseRev.includes(x.id)); return r && { rev: r.id }; } },
        { id: 'BGT-05', as: 'U-OWN', tid: 'dx-bgt-revok', title: 'Owner menyetujui reforecast', what: 'Owner memutuskan. Revised berubah, Original tetap sebagai baseline.',
          run: (c, s, v) => c('budget.decideRevision', { id: v.rev, decision: 'APPROVE' }, 'U-OWN'),
          check: (s, v) => s.budgetRevisions.find((x) => x.id === v.rev).status === 'APPROVED' && {} },
        { id: 'BGT-06', as: 'U-FIN', tid: 'dx-bgt-ora', review: true, title: 'Bandingkan Original / Revised / Actual', what: 'Finance meninjau Original vs Revised vs Actual vs Komitmen. Langkah tinjauan — tanpa transaksi.' },
      ],
    },
    {
      id: 'ASSET', name: 'Maintenance AC → WO → suku cadang → selesai', short: 'Asset maintenance AC',
      story: 'AC ruang treatment Ubud bocor. Laporan → persetujuan → work order → beli suku cadang → selesai → Finance mengklasifikasi biaya pemeliharaan.',
      steps: [
        { id: 'AST-01', as: 'U-STF', tid: 'dx-mt-new', title: 'Staff melaporkan AC rusak', what: 'Laporan kerusakan aset AC Split Ruang Treatment 3 (prioritas tinggi).',
          run: (c) => c('mt.create', { asset: 'AST-UBD-0001', issue: 'AC ruang treatment 3 bocor dan kurang dingin', priority: 'HIGH' }, 'U-STF'),
          check: (s, v) => { const m = s.maintenance.find((x) => !v.baseMt.includes(x.id) && x.asset === 'AST-UBD-0001'); return m && { mt: m.id }; } },
        { id: 'AST-02', as: 'U-SPV', tid: 'dx-mt-review', title: 'Supervisor menyetujui perbaikan', what: 'Persetujuan supervisor membuka jalan untuk work order.',
          run: (c, s, v) => c('mt.review', { id: v.mt, decision: 'APPROVE', note: 'Tamu komplain, segera' }, 'U-SPV'),
          check: (s, v) => s.maintenance.find((x) => x.id === v.mt).status !== 'SUBMITTED' && {} },
        { id: 'AST-03', as: 'U-AST', tid: 'dx-wo-create', title: 'PIC Aset membuat WO + minta suku cadang', what: 'Work order dibuat; kapasitor AC diminta lewat MRF non-rutin (engine MRF yang sama).',
          run: (c, s, v) => { const w = c('wo.create', { mt: v.mt, assignee: 'Teknisi internal', labor: 150000 }, 'U-AST'); c('wo.requestPart', { id: w.id, item: 'SP-001', qty: 1 }, 'U-AST'); },
          check: (s, v) => { const m = s.maintenance.find((x) => x.id === v.mt); const w = m && m.wo && s.workOrders.find((x) => x.id === m.wo); return w && w.parts.length && { wo: w.id, part: w.parts[0].mrf }; } },
        { id: 'AST-04', as: 'U-SPV', tid: 'dx-mrf-approve', q: (v) => ({ id: v.part }), title: 'Supervisor menyetujui MRF suku cadang', what: 'MRF non-rutin mengikuti rantai approval biasa.',
          vars: (v) => ({ mrf: v.part }),
          run: (c, s, v) => c('mrf.decide', { id: v.part, decision: 'APPROVE', note: 'Untuk WO AC' }, 'U-SPV'),
          check: (s, v) => { const m = mrf(s, v.part); return m && (m.status !== 'SUBMITTED' || S.mrfNextApprover(s, m) !== 'SUPERVISOR') && {}; } },
        { id: 'AST-04A', as: 'U-AOM', tid: 'dx-mrf-approve', q: (v) => ({ id: v.part }), title: 'Asisten Manager Operasional menyetujui', what: 'Di Divisi Operasional Spa, setelah Supervisor outlet, MRF naik ke Asisten Manager Operasional sebelum Manager BU Operasional.',
          vars: (v) => ({ mrf: v.part }),
          run: (c, s, v) => c('mrf.decide', { id: v.part, decision: 'APPROVE', note: 'Suku cadang AC diperlukan' }, 'U-AOM'),
          check: (s, v) => { const m = mrf(s, v.part); return m && (m.approvals || []).some((a) => a.by === 'U-AOM') && {}; } },
        { id: 'AST-04B', as: 'U-BUM', tid: 'dx-mrf-approve', q: (v) => ({ id: v.part }), title: 'BU Manager menyetujui (non-rutin)', what: 'MRF non-rutin butuh persetujuan berjenjang sampai BU Manager sesuai matriks approval.',
          vars: (v) => ({ mrf: v.part }),
          run: (c, s, v) => c('mrf.decide', { id: v.part, decision: 'APPROVE', note: 'Perbaikan aset, disetujui' }, 'U-BUM'),
          check: (s, v) => mrf(s, v.part).status !== 'SUBMITTED' && {} },
        { id: 'AST-05', as: 'U-PUR', tid: 'dx-po-create', title: 'Purchasing memesan suku cadang', what: 'PO suku cadang dibuat, disetujui dan dikirim ke vendor.',
          run: (c, s, v) => { const pend = S.pendingPurchase(s()).filter((p) => p.mrf === v.part); if (!pend.length) return; const p = c('po.createFromMrf', { picks: pend.map((p) => ({ mrf: p.mrf, li: p.li, ai: p.ai })), supplier: pend[0].supplier }, 'U-PUR'); c('po.submit', { id: p.id }, 'U-PUR'); if (po(s(), p.id).status === 'PENDING_APPROVAL') c('po.decide', { id: p.id, decision: 'APPROVE' }, 'U-PUR'); c('po.send', { id: p.id }, 'U-PUR'); },
          check: (s, v) => { const m = mrf(s, v.part); const issued = m && S.mrfFulfillment(s, m).issued > 0; const p = poOfMrf(s, v.part); return (issued || (p && p.status !== 'DRAFT')) && { po: p ? p.id : null }; } },
        { id: 'AST-06', as: 'U-AST', tid: 'dx-wo-complete', q: () => ({ tab: 'WO' }), title: 'Perbaikan selesai', what: 'Teknisi menyelesaikan WO dengan catatan dan biaya. Riwayat aset diperbarui; jurnal beban pemeliharaan menunggu review Finance.',
          run: (c, s, v) => c('wo.complete', { id: v.wo, notes: 'Kapasitor diganti, freon diisi, AC dingin normal', cost: 350000 }, 'U-AST'),
          check: (s, v) => { const w = s.workOrders.find((x) => x.id === v.wo); const j = s.journals.find((x) => x.source === v.wo); return w && w.status === 'COMPLETED' && { jv: j ? j.id : null }; } },
        { id: 'AST-07', as: 'U-FIN', tid: 'dx-gl-post', title: 'Finance mengklasifikasi & memposting', what: 'Finance meninjau klasifikasi beban pemeliharaan (OPEX, bukan kapitalisasi) lalu memposting jurnal (simulasi).',
          run: (c, s, v) => { const j = s().journals.find((x) => x.id === v.jv); if (j && j.status === 'PENDING_REVIEW') c('gl.post', { id: v.jv }, 'U-FIN'); },
          check: (s, v) => { const j = s.journals.find((x) => x.id === v.jv); return j && j.status === 'POSTED' && {}; } },
      ],
    },
    {
      id: 'OFFICE', name: 'Alokasi biaya Shared Office 60/40', short: 'Shared Office allocation',
      story: 'Biaya kantor Finance HQ dibagi 60% Spa / 40% Essence (angka demonstrasi). Tiap BU meninjau, lalu Finance mengunci periode. Tidak ada jurnal yang diposting di langkah ini.',
      steps: [
        { id: 'OFC-01', as: 'U-FIN', tid: 'dx-alloc-edit', title: 'Finance mengatur porsi 60/40', what: 'Pool CC-OFC-FIN: Spa 60% / Essence 40% (DEMO). Total wajib 100%; review BU direset bila porsi berubah.',
          run: (c) => c('cc.updateAllocation', { pool: 'CC-OFC-FIN', basis: 'Demonstrasi 60/40', splits: { 'BU-SPA': 0.6, 'BU-ESS': 0.4 }, note: 'Skenario demo MP-HAWK-09' }, 'U-FIN'),
          check: (s) => { const a = s.sharedAllocations.find((x) => x.pool === 'CC-OFC-FIN'); return a.splits['BU-SPA'] === 0.6 && {}; } },
        { id: 'OFC-02', as: 'U-BUM', tid: 'dx-alloc-review', vars: () => ({ bu: 'BU-SPA' }), title: 'BU Manager Spa meninjau', what: 'BU Manager Spa menyetujui porsi BU-nya (bisa juga keberatan dengan alasan).',
          run: (c) => c('cc.reviewAllocation', { pool: 'CC-OFC-FIN', bu: 'BU-SPA', decision: 'AGREE', note: 'Sesuai proporsi pemakaian' }, 'U-BUM'),
          check: (s) => (s.sharedAllocations.find((x) => x.pool === 'CC-OFC-FIN').reviews || {})['BU-SPA'] && {} },
        { id: 'OFC-03', as: 'U-BUE', tid: 'dx-alloc-review', vars: () => ({ bu: 'BU-ESS' }), title: 'Manager BU JAENS Essence meninjau porsinya', what: 'Manager BU JAENS Essence menyetujui porsi 40% biaya Finance bersama untuk Essence.',
          run: (c) => c('cc.reviewAllocation', { pool: 'CC-OFC-FIN', bu: 'BU-ESS', decision: 'AGREE', note: 'OK untuk Essence' }, 'U-BUE'),
          check: (s) => (s.sharedAllocations.find((x) => x.pool === 'CC-OFC-FIN').reviews || {})['BU-ESS'] && {} },
        { id: 'OFC-04', as: 'U-FIN', tid: 'dx-alloc-lock', title: 'Finance mengunci periode', what: 'Setelah semua BU setuju, Finance mengunci. Porsi tidak bisa diubah lagi periode ini.',
          run: (c) => c('cc.lockAllocation', { pool: 'CC-OFC-FIN' }, 'U-FIN'),
          check: (s) => s.sharedAllocations.find((x) => x.pool === 'CC-OFC-FIN').locked && {} },
      ],
    },
  ];
  SCENARIOS.forEach((sc) => sc.steps.forEach((st, i) => (st.n = i + 1)));

  /* ======================= STATE (inside the shared sandbox) ======================= */
  H['dx.start'] = (s, p, ctx) => {
    const sc = SCENARIOS.find((x) => x.id === p.scenario);
    E.need(sc, 'NOT_FOUND', 'Skenario tidak terdaftar');
    s.dx = { scenario: sc.id, startedAt: ctx.now, by: ctx.user.id, vars: Object.assign({}, p.vars || {}), steps: {}, verdict: null, log: [] };
    s.dx.log.unshift({ ts: ctx.now, by: ctx.user.id, text: 'Mulai skenario ' + sc.name });
    E.log(s, ctx, 'dx.start', sc.id, 'Demo Experience Center (sandbox)');
    return s.dx;
  };
  H['dx.step'] = (s, p, ctx) => {
    E.need(s.dx, 'STATE', 'Belum ada skenario aktif');
    const sc = SCENARIOS.find((x) => x.id === s.dx.scenario);
    const st = sc.steps.find((x) => x.id === p.step);
    E.need(st, 'NOT_FOUND', 'Langkah tidak ada');
    E.need(['DONE', 'REVIEWED', 'BLOCKED', 'FAILED'].includes(p.result), 'VALIDATION', 'Hasil langkah tidak dikenal');
    if (p.result === 'BLOCKED' || p.result === 'FAILED') E.need(p.note && p.note.length >= 3, 'VALIDATION', 'Catatan wajib untuk BLOCKED/FAILED');
    s.dx.steps[st.id] = { result: p.result, at: ctx.now, by: ctx.user.id, note: p.note || '', via: p.via || 'UI', evidence: p.evidence || [] };
    Object.assign(s.dx.vars, p.vars || {});
    s.dx.log.unshift({ ts: ctx.now, by: ctx.user.id, text: `${st.id} ${p.result}${p.note ? ' — ' + p.note : ''}` });
    return s.dx;
  };
  H['dx.verdict'] = (s, p, ctx) => {
    E.need(s.dx, 'STATE', 'Belum ada skenario aktif');
    E.need(['PASS', 'FAIL', 'BLOCKED'].includes(p.verdict), 'VALIDATION', 'PASS / FAIL / BLOCKED');
    if (p.verdict !== 'PASS') E.need(p.note && p.note.length >= 3, 'VALIDATION', 'Catatan wajib untuk FAIL / BLOCKED');
    s.dx.verdict = { verdict: p.verdict, note: p.note || '', by: ctx.user.id, at: ctx.now };
    s.dx.log.unshift({ ts: ctx.now, by: ctx.user.id, text: 'Hasil uji: ' + p.verdict + (p.note ? ' — ' + p.note : '') });
    E.log(s, ctx, 'dx.verdict', s.dx.scenario, p.verdict);
    return s.dx.verdict;
  };

  /* ======================= RUNNER ======================= */
  const userOf = (s, id) => s.users.find((u) => u.id === id);
  // call(op, payload, userId) — goes through api.call (contract role check + transactional handler); throws on error
  const caller = (store, api, trail) => (op, payload, uid) => {
    const r = api.call(op, payload, userOf(store.state, uid));
    if (trail) trail.push({ op, user: uid, ok: r.ok, error: r.ok ? null : r.error });
    if (!r.ok) throw Object.assign(new Error(r.error.message), { code: r.error.code, op });
    return r.data;
  };
  const scenario = (id) => SCENARIOS.find((x) => x.id === id);
  const current = (s) => {
    if (!s.dx) return null;
    const sc = scenario(s.dx.scenario);
    const idx = sc.steps.findIndex((st) => !s.dx.steps[st.id] || s.dx.steps[st.id].result === 'FAILED');
    return { sc, idx, step: idx >= 0 ? sc.steps[idx] : null, done: idx < 0 };
  };
  const varsFor = (s, st) => Object.assign({}, s.dx ? s.dx.vars : {}, st && st.vars ? st.vars(s.dx ? s.dx.vars : {}) : {});

  /* start a scenario on a FRESH sandbox: reset → optional setup through real ops → dx.start */
  function start(store, api, id) {
    const sc = scenario(id);
    if (!sc) throw new Error('Skenario tidak terdaftar: ' + id);
    store.reset();
    const s = () => store.state;
    const base = { base: s().mrfs.map((m) => m.id), baseSp: (s().spends || []).map((x) => x.id), baseRev: s().budgetRevisions.map((x) => x.id), baseMt: s().maintenance.map((x) => x.id) };
    const trail = [];
    const extra = sc.setup ? sc.setup(caller(store, api, trail), s) : {};
    return { dx: api.call('dx.start', { scenario: id, vars: Object.assign(base, extra) }, userOf(s(), 'U-OWN')).data, trail };
  }
  /* auto-detect: a step whose outcome is already visible in the shared state (e.g. the user clicked the real button) */
  function detect(store, api) {
    const s = store.state;
    const c = current(s);
    if (!c || c.done || c.step.review) return null;
    const v = varsFor(s, c.step);
    let patch = null;
    try {
      patch = c.step.check(s, v);
    } catch (e) {
      patch = null;
    }
    if (!patch) return null;
    const res = api.call('dx.step', { step: c.step.id, result: 'DONE', via: 'UI', vars: patch, evidence: evidence(store.state, c.step, Object.assign(v, patch)) }, userOf(s, c.step.as));
    return res.ok ? c.step.id : null;
  }
  /* run the current step through the same contracts as the real button */
  function runStep(store, api) {
    const s0 = store.state;
    const c = current(s0);
    if (!c || c.done) return { ok: false, error: { code: 'STATE', message: 'Tidak ada langkah aktif' } };
    const st = c.step;
    if (st.review) return review(store, api);
    const trail = [];
    const v = varsFor(s0, st);
    try {
      st.run(caller(store, api, trail), () => store.state, v);
    } catch (e) {
      api.call('dx.step', { step: st.id, result: 'FAILED', note: `${e.op || ''}: ${e.message}`, via: 'TUTOR' }, userOf(store.state, st.as));
      return { ok: false, error: { code: e.code || 'ERROR', message: e.message, op: e.op }, trail };
    }
    const patch = st.check(store.state, v);
    if (!patch) {
      api.call('dx.step', { step: st.id, result: 'FAILED', note: 'Hasil yang diharapkan tidak terlihat di state', via: 'TUTOR' }, userOf(store.state, st.as));
      return { ok: false, error: { code: 'EXPECTATION', message: 'Operasi berjalan tetapi hasil yang diharapkan tidak muncul' }, trail };
    }
    const nv = Object.assign(v, patch);
    api.call('dx.step', { step: st.id, result: 'DONE', via: 'TUTOR', vars: patch, evidence: evidence(store.state, st, nv) }, userOf(store.state, st.as));
    return { ok: true, step: st.id, trail };
  }
  function review(store, api) {
    const c = current(store.state);
    if (!c || !c.step || !c.step.review) return { ok: false, error: { code: 'STATE', message: 'Langkah ini bukan langkah tinjauan' } };
    const r = api.call('dx.step', { step: c.step.id, result: 'REVIEWED', via: 'UI' }, userOf(store.state, c.step.as));
    return r.ok ? { ok: true, step: c.step.id } : r;
  }
  function block(store, api, note) {
    const c = current(store.state);
    if (!c || !c.step) return { ok: false };
    return api.call('dx.step', { step: c.step.id, result: 'BLOCKED', note }, userOf(store.state, c.step.as));
  }
  /* evidence: document IDs + latest audit entries of the step's user (timestamp, actor, stage owner) */
  function evidence(s, st, v) {
    const refs = ['mrf', 'tr', 'po', 'issue', 'bill', 'sp', 'rev', 'mt', 'wo', 'part', 'jv'].filter((k) => v[k]).map((k) => v[k]);
    return refs.filter((x, i, a) => a.indexOf(x) === i);
  }
  function report(s) {
    if (!s.dx) return null;
    const sc = scenario(s.dx.scenario);
    return {
      report: 'HAWK Demo Experience Center — UAT (DEMO, synthetic data)',
      scenario: sc.id, name: sc.name, startedAt: s.dx.startedAt, verdict: s.dx.verdict,
      steps: sc.steps.map((st) => {
        const r = s.dx.steps[st.id] || {};
        const t = TARGETS[st.tid] || {};
        return { id: st.id, title: st.title, role: (userOf(s, st.as) || {}).role, user: st.as, screen: 'NV-' + String(t.nv).padStart(2, '0'), target: st.tid, result: r.result || 'PENDING', at: r.at || null, via: r.via || null, note: r.note || '', evidence: r.evidence || [] };
      }),
      vars: s.dx.vars,
      log: s.dx.log,
      disclaimer: 'Hasil uji UI demo pada data sintetis. Bukan bukti kebenaran engine/ledger HAWK produksi. Integrasi API: TO VERIFY.',
    };
  }

  HAWK.dx = { ROLE5, SUPPORT, DEVICES, TARGETS, SCENARIOS, target, scenario, current, varsFor, start, detect, runStep, review, block, report, userOf };
})(typeof window !== 'undefined' ? window : globalThis);
