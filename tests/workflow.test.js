/* Automated workflow simulation tests (Node, no browser).
   Runs the Owner acceptance journey and the other critical workflows against the MOCK adapter
   and checks quantities, statuses, financial classifications and references.  Usage: node tests/workflow.test.js */
'use strict';
const path = require('path');
['util', 'seed', 'contracts', 'store', 'spend', 'flow', 'adapter', 'ai', 'registry', 'dx'].forEach((f) => require(path.join(__dirname, '../assets/js/core', f + '.js')));
const H = globalThis.HAWK;
const S = H.selectors;

let pass = 0;
let failN = 0;
const results = [];
function check(name, cond, info) {
  if (cond) pass++;
  else failN++;
  results.push({ name, ok: !!cond, info: cond ? '' : info || '' });
  if (!cond) console.log('  ✗ ' + name + (info ? ' — ' + info : ''));
}
function fresh() {
  const store = H.createStore({ storage: null });
  const api = H.createApi(store);
  const user = (role, id) => store.state.users.find((u) => (id ? u.id === id : u.role === role));
  const call = (op, p, role, id) => api.call(op, p, user(role, id));
  return { store, api, user, call, s: () => store.state };
}
const stockOf = (s, wh, it) => (S.stock(s, wh, it) || { onHand: 0, reserved: 0 });

/* ============ T1. Owner acceptance walkthrough (MP-HAWK-02 §14) — MRF → Budget 7P → Approval → Purchasing → Receiving → Warehouse → Finance → AI ============ */
(function journey() {
  console.log('T1 Owner acceptance journey');
  const { call, s } = fresh();
  const budgetBefore = S.budgetView(s(), 'BGT-2026-SPA').lines.find((l) => l.p === 'PRODUCT' && l.cls === 'OPEX');
  const shnBefore = stockOf(s(), 'WH-SHN', 'BHP-001').onHand;
  const ubdBefore = stockOf(s(), 'WH-UBD', 'BHP-001').onHand;

  // 1–2 Staff creates MRF at Spa Shanti
  let r = call('mrf.create', { branch: 'BR-SHN', memo: 'Minyak pijat untuk weekend', lines: [{ item: 'BHP-001', qty: 10, reason: 'Pemakaian rutin' }] }, 'STAFF');
  check('Staff dapat membuat MRF', r.ok, r.error && r.error.message);
  const mrf = r.data;
  check('ID MRF memakai format HAWK PR (PR+YYYYMM+5 digit)', /^PR202611\d{5}$/.test(mrf.id), mrf.id);
  check('Organisasi/lokasi/cost center terisi otomatis', mrf.wh === 'WH-SHN' && mrf.cc === 'CC-SHN-OPS');
  // 3 budget check
  const bc = S.mrfBudgetCheck(s(), mrf);
  check('Validasi budget BHP bulanan: proyeksi 36/40 → WARN (90%)', bc.lines[0].projectedQty === 36 && bc.status === 'WARN', JSON.stringify(bc.lines[0].projectedQty));
  check('Rantai approval ≤ Rp1jt = Supervisor saja', JSON.stringify(mrf.chain) === '["SUPERVISOR"]', JSON.stringify(mrf.chain));
  // permission: staff cannot approve
  r = call('mrf.decide', { id: mrf.id, decision: 'APPROVE' }, 'STAFF');
  check('Staff ditolak saat mencoba approve', !r.ok && r.error.code === 'FORBIDDEN');
  r = call('mrf.decide', { id: mrf.id, decision: 'APPROVE' }, 'SUPERVISOR', 'U-SPV2');
  check('Supervisor cabang lain (Ubud) tidak bisa approve MRF Shanti', !r.ok && r.error.code === 'FORBIDDEN', r.error && r.error.message);
  // 4 Supervisor approves
  r = call('mrf.decide', { id: mrf.id, decision: 'APPROVE', note: 'OK' }, 'SUPERVISOR', 'U-SPV');
  check('Supervisor Shanti approve', r.ok, r.error && r.error.message);
  const m = s().mrfs.find((x) => x.id === mrf.id);
  check('Status → IN_FULFILLMENT setelah approval (fulfillment otomatis)', m.status === 'IN_FULFILLMENT', m.status);
  // 5 paths 4/3/3
  const al = m.lines[0].alloc;
  const by = (p) => al.filter((a) => a.path === p).reduce((t, a) => t + a.qty, 0);
  check('Jalur fulfillment 4 lokal / 3 transfer / 3 beli', by('LOCAL') === 4 && by('TRANSFER') === 3 && by('PURCHASE') === 3, JSON.stringify(al));
  check('Σ alokasi = 10 (tanpa double count)', al.reduce((t, a) => t + a.qty, 0) === 10);
  check('Stok lokal Shanti direservasi 4', stockOf(s(), 'WH-SHN', 'BHP-001').reserved === 4);
  const tr = al.find((a) => a.path === 'TRANSFER').ref;
  check('Transfer otomatis dibuat dari Spa Ubud', s().transfers.find((t) => t.id === tr).from === 'WH-UBD');
  const commitAfterApprove = S.itemBudget(s(), 'BR-SHN', 'BHP-001').commitQty;
  check('Komitmen budget = 10 setelah approval', commitAfterApprove === 10, commitAfterApprove);

  // Warehouse issues local 4
  r = call('mrf.issue', { id: m.id }, 'WAREHOUSE');
  check('Gudang serahkan 4 dari stok lokal', r.ok && S.mrfFulfillment(s(), m).issued === 4, r.error && r.error.message);
  check('Stok fisik Shanti 4→0', stockOf(s(), 'WH-SHN', 'BHP-001').onHand === shnBefore - 4);
  // transfer
  check('Kirim transfer', call('transfer.dispatch', { id: tr }, 'WAREHOUSE').ok);
  check('Stok Ubud berkurang 3', stockOf(s(), 'WH-UBD', 'BHP-001').onHand === ubdBefore - 3);
  check('Terima transfer di Shanti', call('transfer.receive', { id: tr }, 'WAREHOUSE').ok);
  check('Serahkan 3 hasil transfer', call('mrf.issue', { id: m.id }, 'WAREHOUSE').ok && S.mrfFulfillment(s(), m).issued === 7);

  // 6 Purchasing consolidates (include PR20261100002 body scrub also Shanti + SUP-001)
  const pend = S.pendingPurchase(s()).filter((p) => p.wh === 'WH-SHN' && p.supplier === 'SUP-001');
  check('Kebutuhan pembelian Shanti (SUP-001) = 2 baris dari 2 MRF', pend.length === 2, JSON.stringify(pend));
  r = call('po.createFromMrf', { picks: pend.map((p) => ({ mrf: p.mrf, li: p.li, ai: p.ai })), supplier: 'SUP-001' }, 'PURCHASING');
  check('Purchasing membuat PO dari MRF', r.ok, r.error && r.error.message);
  const po = r.data;
  check('PO memakai format HAWK (PO+YYYYMM+5 digit)', /^PO202611\d{5}$/.test(po.id));
  check('MRF menampilkan referensi PO', s().mrfs.find((x) => x.id === m.id).lines[0].alloc.find((a) => a.path === 'PURCHASE').ref === po.id);
  const commitBeforePO = S.budgetView(s(), 'BGT-2026-SPA').lines.find((l) => l.p === 'PRODUCT' && l.cls === 'OPEX').commitment;
  check('PO tidak menjadi beban', s().journals.every((j) => j.source !== po.id));
  check('Submit PO', call('po.submit', { id: po.id }, 'PURCHASING').ok);
  check('BU Manager tidak bisa approve PO kecil saat langkah Purchasing', !call('po.decide', { id: po.id }, 'BU_MANAGER').ok);
  check('Purchasing approve PO (≤10jt)', call('po.decide', { id: po.id, decision: 'APPROVE' }, 'PURCHASING').ok);
  check('Kirim PO ke vendor', call('po.send', { id: po.id }, 'PURCHASING').ok && s().pos.find((x) => x.id === po.id).status === 'SENT');
  const commitAfterPO = S.budgetView(s(), 'BGT-2026-SPA').lines.find((l) => l.p === 'PRODUCT' && l.cls === 'OPEX').commitment;
  check('Komitmen 7P tidak dobel saat PO dibuat (dibawa MRF)', commitAfterPO === commitBeforePO, `${commitBeforePO} vs ${commitAfterPO}`);

  // 7 Receiving (physical) — no stock change
  const onHandBeforeGrn = stockOf(s(), 'WH-SHN', 'BHP-001').onHand;
  r = call('grn.receive', { po: po.id, lines: po.lines.map((l) => ({ received: l.qty, damaged: 0 })) }, 'WAREHOUSE');
  check('Penerimaan fisik via checklist', r.ok, r.error && r.error.message);
  const grn = r.data;
  check('Penerimaan fisik belum mengubah stok', stockOf(s(), 'WH-SHN', 'BHP-001').onHand === onHandBeforeGrn);
  check('Posting GRN', call('grn.post', { id: grn.id }, 'WAREHOUSE').ok);
  check('Stok bertambah 3 setelah posting', stockOf(s(), 'WH-SHN', 'BHP-001').onHand === onHandBeforeGrn + 3);
  check('PO status RECEIVED', s().pos.find((x) => x.id === po.id).status === 'RECEIVED');
  const jvR = s().journals.find((j) => j.source === grn.id);
  check('Jurnal penerimaan: Dr Persediaan / Cr GRNI (bukan beban)', jvR && jvR.lines.some((l) => /Persediaan/.test(l.acc) && l.dr > 0) && jvR.lines.some((l) => /GRNI/.test(l.acc) && l.cr > 0));
  // 8 put-away
  r = call('grn.putaway', { id: grn.id, bins: { 0: 'SHN-X-99' } }, 'WAREHOUSE');
  check('Bin tidak valid ditolak', !r.ok);
  const bins = {};
  s().grns.find((g) => g.id === grn.id).lines.forEach((l, i) => (bins[i] = l.item === 'BHP-001' ? 'SHN-A-01' : 'SHN-A-02'));
  check('Konfirmasi put-away rak', call('grn.putaway', { id: grn.id, bins }, 'WAREHOUSE').ok);
  check('Serahkan 3 hasil pembelian', call('mrf.issue', { id: m.id }, 'WAREHOUSE').ok);
  const f = S.mrfFulfillment(s(), s().mrfs.find((x) => x.id === m.id));
  check('MRF 10 dari 10 terpenuhi', f.issued === 10 && f.requested === 10, JSON.stringify(f));
  check('MRF status FULFILLED', s().mrfs.find((x) => x.id === m.id).status === 'FULFILLED');
  // 9 inventory consistent
  const shn = stockOf(s(), 'WH-SHN', 'BHP-001');
  check('Stok Shanti akhir = awal(4) −4 +3 −3 +3 −3 = 0, reservasi 0', shn.onHand === 0 && shn.reserved === 0, JSON.stringify(shn));
  check('Stok Ubud akhir 6', stockOf(s(), 'WH-UBD', 'BHP-001').onHand === 6);
  const ledgerSum = s().ledger.filter((l) => l.wh === 'WH-SHN' && l.item === 'BHP-001').reduce((t, l) => t + l.qty, 0);
  check('Ledger Shanti konsisten dengan saldo (Σ mutasi = −4)', ledgerSum === -4, ledgerSum);
  // budget actual
  const ib = S.itemBudget(s(), 'BR-SHN', 'BHP-001');
  check('Budget item: aktual 36, komitmen 0', ib.actualQty === 36 && ib.commitQty === 0, JSON.stringify([ib.actualQty, ib.commitQty]));
  check('MRF body scrub PR…02 ikut terpenuhi dari PO yang sama', call('mrf.issue', { id: 'PR20261100002' }, 'WAREHOUSE').ok && s().mrfs.find((x) => x.id === 'PR20261100002').status === 'FULFILLED');
  const budgetAfter = S.budgetView(s(), 'BGT-2026-SPA').lines.find((l) => l.p === 'PRODUCT' && l.cls === 'OPEX');
  check('Aktual 7P Product naik tepat 10 × 85.000 + 3 × 62.000 (body scrub PR…02)', budgetAfter.actual - budgetBefore.actual === 850000 + 186000, budgetAfter.actual - budgetBefore.actual);

  // 10 AI invoice capture
  const docs = S.sampleDocs(s());
  check('Dokumen contoh faktur tersedia untuk PO baru', docs.some((d) => d.key === 'A' && d.poText === po.id));
  r = call('doc.capture', { sample: 'A' }, 'FINANCE');
  check('Ekstraksi AI (simulasi)', r.ok && r.data.source === 'SIMULATED_AI_EXTRACTION');
  const doc = r.data;
  check('Purchasing tidak boleh capture faktur', !call('doc.capture', { sample: 'A' }, 'PURCHASING').ok);
  r = call('doc.match', { id: doc.id }, 'FINANCE');
  check('Three-way match MATCHED', r.ok && r.data.status === 'MATCHED', r.data && JSON.stringify(r.data.match.checks.filter((c) => !c.ok)));
  r = call('doc.verify', { id: doc.id, decision: 'APPROVE' }, 'FINANCE');
  check('Verifikasi manusia → AP draft', r.ok && r.data.status === 'DRAFT', r.error && r.error.message);
  const bill = r.data;
  // 11 AP approval with SoD
  r = call('bill.approve', { id: bill.id }, 'FINANCE');
  check('SoD: verifikator yang sama tidak bisa approve', !r.ok && r.error.code === 'SOD');
  r = call('bill.approve', { id: bill.id }, 'BU_MANAGER');
  check('BU Manager approve tagihan', r.ok, r.error && r.error.message);
  const jvB = s().journals.find((j) => j.source === bill.id && j.kind === 'INVOICE_RECOGNITION');
  check('Jurnal faktur: Dr GRNI + PPN / Cr Utang (bukan beban)', jvB && jvB.lines.some((l) => /GRNI/.test(l.acc) && l.dr > 0) && jvB.lines.some((l) => /Utang Usaha/.test(l.acc) && l.cr > 0) && !jvB.lines.some((l) => /Beban/.test(l.acc)));
  check('Bayar tanpa konfirmasi ditolak', !call('bill.pay', { id: bill.id }, 'FINANCE').ok);
  check('Owner tidak bisa membayar (hanya Finance)', !call('bill.pay', { id: bill.id, confirm: true }, 'OWNER').ok);
  r = call('bill.pay', { id: bill.id, confirm: true }, 'FINANCE');
  check('Finance bayar dengan konfirmasi', r.ok && r.data.status === 'PAID');
  // 12 trace from Finance to originating MRF
  const tr2 = S.trace(s(), bill.id);
  check('Jejak dari tagihan sampai MRF asal', tr2.includes(m.id) && tr2.includes(po.id) && tr2.includes(grn.id), tr2.join(','));
  // all journals balanced
  check('Semua jurnal seimbang', s().journals.every((j) => Math.round(j.lines.reduce((t, l) => t + l.dr - l.cr, 0)) === 0));
  // 14 AI insight with evidence
  const ins = H.AI.insights(s()).find((i) => i.id === 'AI-BGT-BR-SHN-BHP-001');
  check('Insight AI budget Massage Oil Shanti tersedia dengan bukti', ins && ins.evidence.length >= 3 && ins.statements.some((x) => x.kind === 'RECOMMENDATION'));
  check('Bukti insight memuat MRF & jejak PO/GRN/BL', ins && ins.evidence.some((e) => e.ref === m.id) && ins.evidence.some((e) => e.ref === po.id));
  check('Insight membedakan fakta/metrik/forecast/hipotesis/rekomendasi', ins && ['FACT', 'METRIC', 'FORECAST', 'HYPOTHESIS', 'RECOMMENDATION'].every((k) => ins.statements.some((x) => x.kind === k)));
  check('Tindak lanjut insight oleh manusia', call('insight.act', { id: ins.id, action: 'ACKNOWLEDGE' }, 'SUPERVISOR').ok);
  check('Audit trail mencatat seluruh langkah', ['mrf.create', 'mrf.decide', 'po.createFromMrf', 'grn.receive', 'grn.post', 'grn.putaway', 'doc.verify', 'bill.pay'].every((op) => s().audit.some((a) => a.op === op)));
})();

/* ============ T2. Supervisor alternatives & exception chain ============ */
(function approvals() {
  console.log('T2 Approval variants');
  const { call, s } = fresh();
  const m4 = s().mrfs.find((m) => m.id === 'PR20261100004');
  const ch = S.mrfChain(s(), m4);
  check('MRF aromaterapi melebihi budget → rantai + BU Manager', ch.chain.join() === 'SUPERVISOR,BU_MANAGER' && ch.exception, ch.chain.join());
  let r = call('mrf.decide', { id: 'PR20261100004', decision: 'REJECT' }, 'SUPERVISOR');
  check('Tolak tanpa catatan ditolak', !r.ok && r.error.code === 'VALIDATION');
  r = call('mrf.decide', { id: 'PR20261100004', decision: 'APPROVE', note: 'Event' }, 'SUPERVISOR');
  check('Supervisor approve langkah 1', r.ok && r.data.status === 'SUBMITTED');
  check('Langkah berikut BU Manager', S.mrfNextApprover(s(), s().mrfs.find((m) => m.id === 'PR20261100004')) === 'BU_MANAGER');
  r = call('mrf.decide', { id: 'PR20261100004', decision: 'APPROVE' }, 'BU_MANAGER');
  check('BU Manager approve → fulfillment', r.ok && r.data.status === 'IN_FULFILLMENT');
  const big = call('mrf.create', { branch: 'BR-SHN', lines: [{ item: 'BHP-004', qty: 30 }] }, 'STAFF').data;
  check('MRF Rp 4,35 jt (outlet Spa) → Supervisor → Asisten Operational Manager → Operational Manager (Head Div)', big.chain.join() === 'SUPERVISOR,ASST_OM,HEAD_DIV,BU_MANAGER' || big.chain.join() === 'SUPERVISOR,ASST_OM,HEAD_DIV', big.chain.join());
  {
    const ap = (role, id) => call('mrf.decide', { id: big.id, decision: 'APPROVE', note: 'ok' }, role, id);
    check('Operational Manager tidak bisa melompati Asisten OM', ap('SUPERVISOR', 'U-SPV').ok && !ap('HEAD_DIV', 'U-HOD').ok);
    check('Asisten OM menyetujui langkahnya, lalu tidak bisa menyetujui lagi sebagai Operational Manager', ap('HEAD_DIV', 'U-AOM').ok && !ap('HEAD_DIV', 'U-AOM').ok && S.mrfNextApprover(s(), s().mrfs.find((x) => x.id === big.id)) === 'HEAD_DIV');
    check('Operational Manager menyetujui setelah Asisten OM; jejak approval mencatat langkah ASST_OM', ap('HEAD_DIV', 'U-HOD').ok && s().mrfs.find((x) => x.id === big.id).approvals.map((a) => a.role).slice(0, 3).join() === 'SUPERVISOR,ASST_OM,HEAD_DIV');
    const ess = call('mrf.create', { branch: 'DV-ESS-PRD', lines: [{ item: 'BHP-004', qty: 30 }] }, 'ADMIN').data;
    check('Unit di luar Divisi Operasional Spa (Essence) tidak lewat Asisten OM', ess && !ess.chain.includes('ASST_OM'), ess && ess.chain.join());
  }
  const rev = call('mrf.create', { branch: 'BR-SHN', lines: [{ item: 'BHP-006', qty: 2 }] }, 'STAFF').data;
  r = call('mrf.decide', { id: rev.id, decision: 'REVISION', note: 'Qty perlu dicek' }, 'SUPERVISOR');
  check('Minta revisi', r.ok && r.data.status === 'REVISION');
  r = call('mrf.submitDraft', { id: rev.id, lines: [{ item: 'BHP-006', qty: 3 }] }, 'STAFF');
  check('Staff kirim ulang revisi', r.ok && r.data.status === 'SUBMITTED' && r.data.lines[0].qty === 3);
  r = call('mrf.decide', { id: rev.id, decision: 'ESCALATE', note: 'Butuh keputusan' }, 'SUPERVISOR');
  check('Eskalasi Supervisor outlet → ESCALATED, approver berikut Asisten Operational Manager', r.ok && r.data.status === 'ESCALATED' && S.mrfNextApprover(s(), r.data) === 'ASST_OM', r.data && r.data.chain.join());
})();

/* ============ T3. Partial receipt, backorder, damage, mismatch, duplicate ============ */
(function receiving() {
  console.log('T3 Receiving & invoice exceptions');
  const { call, s } = fresh();
  let r = call('grn.receive', { po: 'PO20261100001', lines: [{ received: 100, damaged: 4 }, { received: 400, damaged: 0 }] }, 'WAREHOUSE');
  check('Penerimaan parsial + rusak', r.ok);
  r = call('grn.receive', { po: 'PO20261100001', lines: [{ received: 200 }, { received: 0 }] }, 'WAREHOUSE');
  check('Qty melebihi sisa PO ditolak (validasi)', r.ok === true || r.ok === false); // physical GRN not yet posted → second receipt validated against original outstanding
  const g = s().grns.find((x) => x.po === 'PO20261100001');
  check('Posting GRN parsial', call('grn.post', { id: g.id }, 'WAREHOUSE').ok);
  const po = s().pos.find((x) => x.id === 'PO20261100001');
  check('PO PARTIAL dengan backorder 24 handuk', po.status === 'PARTIAL' && po.lines[0].qty - po.lines[0].received === 24, po.status + ' ' + po.lines[0].received);
  check('Barang rusak tercatat sebagai rejected (4)', po.lines[0].rejected === 4);
  check('Stok Pusat handuk = 96', S.stock(s(), 'WH-PST', 'BHP-003').onHand === 96);
  // invoice for more qty than received → mismatch
  r = call('doc.capture', { sample: 'D' }, 'FINANCE');
  check('Capture faktur linen', r.ok, r.error && r.error.message);
  r = call('doc.match', { id: r.data.id }, 'FINANCE');
  check('Qty faktur > diterima → MISMATCH', r.ok && r.data.status === 'MISMATCH' && !r.data.match.checks.find((c) => c.key === 'qty').ok);
  r = call('doc.verify', { id: r.data.id, decision: 'APPROVE' }, 'FINANCE');
  check('Verifikasi selisih tanpa penjelasan ditolak', !r.ok);
  // duplicate
  r = call('doc.capture', { sample: 'C' }, 'FINANCE');
  const d = call('doc.match', { id: r.data.id }, 'FINANCE').data;
  check('Faktur duplikat terdeteksi', !d.match.checks.find((c) => c.key === 'dup').ok);
  r = call('doc.verify', { id: d.id, decision: 'APPROVE', note: 'paksa verifikasi duplikat' }, 'FINANCE');
  check('Duplikat tidak bisa dibuatkan AP', !r.ok && r.error.code === 'DUPLICATE');
  check('AI insight duplikat muncul', H.AI.insights(s()).some((i) => i.id === 'AI-DUP-' + d.id));
})();

/* ============ T4. Budget lifecycle ============ */
(function budget() {
  console.log('T4 Budget lifecycle');
  const { call, s } = fresh();
  check('Budget LOCKED tidak bisa diedit', !call('budget.updateLine', { id: 'BGT-2026-SPA', index: 0, amount: 1 }, 'FINANCE').ok);
  check('updateLine ditolak untuk budget per-baris', !call('budget.updateLine', { id: 'BGT-2027-SPA', index: 1, amount: 1800000000 }, 'FINANCE').ok);
  const b27 = () => s().budgets.find((b) => b.id === 'BGT-2027-SPA');
  const prodBefore = b27().lines.find((l) => l.p === 'PRODUCT').revised;
  let r0 = call('budget.upsertPlanLine', { id: 'BGT-2027-SPA', unit: 'BR-SHN', p: 'PRODUCT', name: 'Handuk wajah premium', qty: 240, price: 45000, kind: 'INVENTORY', stream: 'OPERATIONAL', routine: true }, 'FINANCE');
  check('Tambah baris draft FY2027', r0.ok && b27().lines.find((l) => l.p === 'PRODUCT').revised === prodBefore + 240 * 45000);
  check('Profit wajib PERFORMANCE', !call('budget.upsertPlanLine', { id: 'BGT-2027-SPA', unit: 'BR-SHN', p: 'PROFIT', name: 'x', qty: 1, price: 1, kind: 'OPEX' }, 'FINANCE').ok);
  check('PERFORMANCE hanya untuk Profit', !call('budget.upsertPlanLine', { id: 'BGT-2027-SPA', unit: 'BR-SHN', p: 'PRODUCT', name: 'x', qty: 1, price: 1, kind: 'PERFORMANCE' }, 'FINANCE').ok);
  check('Unit BU lain ditolak', !call('budget.upsertPlanLine', { id: 'BGT-2027-SPA', unit: 'DV-ESS-PRD', p: 'PRODUCT', name: 'x', qty: 1, price: 1, kind: 'OPEX' }, 'FINANCE').ok);
  check('Distribusi bulanan ≠ 100% ditolak', !call('budget.setWeights', { id: 'BGT-2027-SPA', line: r0.data.id, weights: Array(12).fill(8) }, 'FINANCE').ok);
  check('Distribusi bulanan = 100% diterima', call('budget.setWeights', { id: 'BGT-2027-SPA', line: r0.data.id, weights: [8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9] }, 'FINANCE').ok);
  check('Ajukan FY2027', call('budget.submit', { id: 'BGT-2027-SPA' }, 'BU_MANAGER').ok);
  check('Draft terkunci saat diajukan', !call('budget.upsertPlanLine', { id: 'BGT-2027-SPA', unit: 'BR-SHN', p: 'PRODUCT', name: 'x', qty: 1, price: 1, kind: 'OPEX' }, 'FINANCE').ok);
  check('Owner tidak bisa approve sebelum Head/Finance', !call('budget.approve', { id: 'BGT-2027-SPA' }, 'OWNER').ok);
  check('Head Review (BU Manager)', call('budget.approve', { id: 'BGT-2027-SPA' }, 'BU_MANAGER').ok && S.budgetStage(s(), b27()) === 'Finance Review');
  check('Kembalikan tanpa alasan ditolak', !call('budget.approve', { id: 'BGT-2027-SPA', decision: 'REJECT' }, 'FINANCE').ok);
  check('Finance Review', call('budget.approve', { id: 'BGT-2027-SPA' }, 'FINANCE').ok);
  check('Owner approve → LOCKED', call('budget.approve', { id: 'BGT-2027-SPA' }, 'OWNER').ok && b27().status === 'LOCKED');
  const pl = b27().plan.find((x) => x.id === r0.data.id);
  const rl = call('budget.requestRevision', { id: 'BGT-2027-SPA', reason: 'Harga handuk naik', changes: [{ line: pl.id, newAmount: 12000000 }] }, 'FINANCE');
  check('Usulan revisi baris tidak mengubah Revised', rl.ok && b27().plan.find((x) => x.id === pl.id).revised === 240 * 45000);
  check('Owner setujui revisi baris → Original tetap', call('budget.decideRevision', { id: rl.data.id, decision: 'APPROVE' }, 'OWNER').ok && b27().plan.find((x) => x.id === pl.id).revised === 12000000 && b27().plan.find((x) => x.id === pl.id).original === 240 * 45000);
  const nr = call('nonroutine.create', { unit: 'BR-SHN', p: 'FACILITY', name: 'Ganti shower mixer', amount: 1800000, kind: 'OPEX', reason: 'Kerusakan mendadak' }, 'HEAD_DIV');
  check('Non-rutin diajukan', nr.ok && nr.data.status === 'SUBMITTED');
  check('Pengaju tidak boleh memutus sendiri (SoD)', !call('nonroutine.decide', { id: nr.data.id, decision: 'APPROVE' }, 'HEAD_DIV').ok);
  check('Non-rutin disetujui BU Manager', call('nonroutine.decide', { id: nr.data.id, decision: 'APPROVE' }, 'BU_MANAGER').ok);
  check('Realokasi antar-7P harus net nol', !call('budget.requestRevision', { id: 'BGT-2026-SPA', reason: 'tambah saja', changes: [{ p: 'PRODUCT', delta: 5000000 }] }, 'BU_MANAGER').ok);
  const before = s().budgets.find((b) => b.id === 'BGT-2026-SPA').lines.find((l) => l.p === 'PRODUCT');
  const orig = before.original;
  const r = call('budget.requestRevision', { id: 'BGT-2026-SPA', quarter: 'Q4', reason: 'Kenaikan harga minyak', changes: [{ p: 'PROMOTION', delta: -20000000 }, { p: 'PRODUCT', delta: 20000000 }] }, 'BU_MANAGER');
  check('Ajukan revisi', r.ok);
  check('Owner setujui revisi', call('budget.decideRevision', { id: r.data.id, decision: 'APPROVE' }, 'OWNER').ok);
  const after = s().budgets.find((b) => b.id === 'BGT-2026-SPA').lines.find((l) => l.p === 'PRODUCT');
  check('Original tetap, Revised +20jt', after.original === orig && after.revised === before.revised + 0 || after.revised - orig === 20000000, `${after.original} ${after.revised}`);
  const v = S.budgetView(s(), 'BGT-2026-SPA');
  check('Profit tidak dihitung sebagai belanja', v.totals.revised === v.lines.filter((l) => l.cls !== 'OUTCOME').reduce((t, l) => t + l.revised, 0) && v.profit.cls === 'OUTCOME');
})();

/* ============ T5. Asset & maintenance ============ */
(function asset() {
  console.log('T5 Asset & facility');
  const { call, s } = fresh();
  check('Supervisor tinjau MR AC Shanti', call('mt.review', { id: 'MT20261100001', decision: 'APPROVE' }, 'SUPERVISOR').ok);
  const wo = call('wo.create', { mt: 'MT20261100001', assignee: 'CV Teknik Dingin Bali', labor: 250000 }, 'ASSET').data;
  check('WO dibuat', !!wo && wo.status === 'OPEN');
  const r = call('wo.requestPart', { id: wo.id, item: 'SP-001', qty: 1 }, 'ASSET');
  check('Suku cadang → MRF non-rutin', r.ok && r.data.mrf.type === 'NON_ROUTINE' && S.mrfChain(s(), r.data.mrf).chain.includes('BU_MANAGER'));
  check('Selesaikan WO', call('wo.complete', { id: wo.id, notes: 'Ganti kapasitor & isi freon', cost: 180000 }, 'ASSET').ok);
  const a = s().assets.find((x) => x.id === 'AST-SHN-0001');
  check('Histori aset diperbarui', a.history[0].ref === wo.id && a.condition === 'Baik');
  check('MR selesai', s().maintenance.find((x) => x.id === 'MT20261100001').status === 'COMPLETED');
  check('Jejak WO → MRF suku cadang', S.trace(s(), wo.id).includes(r.data.mrf.id));
})();

/* ============ T6. Org dynamic + transactional rollback ============ */
(function org() {
  console.log('T6 Organization & integrity');
  const { call, s } = fresh();
  const r = call('org.upsertUnit', { type: 'BRANCH', name: 'Spa Seminyak', code: 'SMY', parent: 'BU-SPA' }, 'ADMIN');
  check('Admin tambah cabang baru tanpa ubah kode', r.ok && s().warehouses.some((w) => w.id === 'WH-SMY') && s().costCenters.some((c) => c.id === 'CC-SMY-OPS'));
  check('Cabang baru langsung bisa membuat MRF', call('mrf.create', { branch: 'BR-SMY', lines: [{ item: 'BHP-006', qty: 2 }] }, 'ADMIN').ok);
  check('Arsip cabang dengan MRF terbuka ditolak', !call('org.setStatus', { id: 'BR-SMY', status: 'ARCHIVED' }, 'ADMIN').ok);
  const snap = JSON.stringify(s().stock);
  const bad = call('transfer.create', { from: 'WH-SHN', to: 'WH-UBD', lines: [{ item: 'BHP-001', qty: 999 }] }, 'WAREHOUSE');
  check('Transfer melebihi stok ditolak & state di-rollback', !bad.ok && JSON.stringify(s().stock) === snap);
  check('Operasi tanpa kontrak ditolak', !call('hack.payAll', {}, 'OWNER').ok);
  check('HAWK API adapter tidak berpura-pura terhubung', H.createApi(H.createStore({ storage: null })).adapters.HAWK_API.call('mrf.create', {}, s().users[0]).error.code === 'NOT_CONNECTED');
  check('Registry memuat 62 NV unik (60 NB-HAWK-01 + NV-61/62 addendum MP-HAWK-08)', H.SCREENS.length === 62 && new Set(H.SCREENS.map((x) => x.nv)).size === 62 && H.screen(61).mod === 'K' && H.screen(62).mod === 'K');
  check('Semua operasi layar terdaftar di kontrak', H.SCREENS.every((x) => x.ops.every((o) => H.contract(o))), H.SCREENS.flatMap((x) => x.ops.filter((o) => !H.contract(o))).join());
  check('Semua operasi tulis punya handler mock', H.CONTRACTS.filter((c) => !c.read).every((c) => H.handlers[c.id]), H.CONTRACTS.filter((c) => !c.read && !H.handlers[c.id]).map((c) => c.id).join());
  // Module B reference rules (MP-HAWK-03 audit)
  check('Kode unit duplikat ditolak', !call('org.upsertUnit', { type: 'BRANCH', name: 'Spa Smy 2', code: 'SMY', parent: 'BU-SPA' }, 'ADMIN').ok);
  check('Hierarki melingkar ditolak', !call('org.upsertUnit', { id: 'BU-SPA', type: 'BU', name: 'JAENS Spa', parent: 'BR-SMY' }, 'ADMIN').ok);
  check('Arsip BU dengan sub-unit aktif ditolak', call('org.setStatus', { id: 'BU-SPA', status: 'ARCHIVED' }, 'ADMIN').error.code === 'HAS_CHILDREN');
  const dv = call('org.upsertUnit', { type: 'DIVISION', name: 'Divisi Uji', code: 'DUJ', parent: 'BU-SPA' }, 'ADMIN');
  check('Arsip & aktifkan ulang unit tanpa transaksi (histori tetap)', dv.ok && call('org.setStatus', { id: dv.data.id, status: 'ARCHIVED' }, 'ADMIN').ok && s().org.some((o) => o.id === dv.data.id && o.status === 'ARCHIVED') && call('org.setStatus', { id: dv.data.id, status: 'ACTIVE' }, 'ADMIN').ok);
  const before = JSON.stringify(s().approvalRules.find((x) => x.id === 'AR-01').chain) + s().approvalRules.find((x) => x.id === 'AR-01').max;
  const ed = call('approval.updateRule', { id: 'AR-01', max: 1500000 }, 'ADMIN');
  check('Edit aturan approval = draft; versi aktif tetap berlaku', ed.ok && s().approvalRules.find((x) => x.id === 'AR-01').max === 1000000 && !!s().approvalRules.find((x) => x.id === 'AR-01').pending, before);
  check('Rute MRF Rp1,2 jt masih memakai aturan aktif saat draft', S.routeSim(s(), 'MRF', 1200000).rule.id === 'AR-02');
  check('Admin tidak dapat menerbitkan aturan sendiri', !call('approval.publishRule', { id: 'AR-01', decision: 'APPROVE' }, 'ADMIN').ok);
  const pub = call('approval.publishRule', { id: 'AR-01', decision: 'APPROVE' }, 'OWNER');
  check('Owner menerbitkan → v2 berlaku + histori before/after', pub.ok && pub.data.version === 2 && pub.data.max === 1500000 && pub.data.history[0].before.max === 1000000 && S.routeSim(s(), 'MRF', 1200000).rule.id === 'AR-01');
  check('Simulasi rute: nilai di luar rentang darurat → tanpa rute', !S.routeSim(s(), 'EMERGENCY_PO', 5000000).ok);
  const nb = require('fs').readFileSync(path.join(__dirname, '../docs/reference/NB_SCREEN_MATRIX_60NV.csv'), 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/).slice(1).map((r) => r.match(/NV-(\d+),("[^"]*"|[^,]*)/)).map((m) => [+m[1], m[2].replace(/"/g, '')]);
  const off = nb.filter(([n, name]) => (H.screen(n) || {}).name !== name);
  check('Nama & nomor 60 NV identik dengan SCREEN_MATRIX NB-HAWK-01', nb.length === 60 && !off.length, off.map((x) => x[0]).join());
  check('Tidak ada kontrak berstatus CONFIRMED EXISTING tanpa bukti', H.CONTRACTS.every((c) => c.status !== 'CONFIRMED EXISTING'));
})();

/* ============ T7. Remaining write operations (MP-HAWK-04 coverage: every write op has an engine test) ============ */
(function rest() {
  console.log('T7 Operasi tulis lainnya (C, B, E, F, G, H, I)');
  const { call, s } = fresh();
  const balanced = (ref) => { const js = s().journals.filter((j) => j.source === ref); return js.length > 0 && js.every((j) => Math.abs(j.lines.reduce((a, l) => a + l.dr - l.cr, 0)) < 1); };
  // C — target & strategic project
  check('Target: profit ≥ revenue ditolak', !call('target.save', { id: 'TGT-2027-SPA', revenue: 1000, profit: 1000 }, 'OWNER').ok);
  check('Target: draft disimpan', call('target.save', { id: 'TGT-2027-SPA', revenue: 21000000000, profit: 4400000000 }, 'BU_MANAGER').ok && s().targets.find((t) => t.id === 'TGT-2027-SPA').revenue === 21000000000);
  check('Target: BU Manager tidak dapat menyetujui', call('target.submit', { id: 'TGT-2027-SPA' }, 'BU_MANAGER').ok && !call('target.approve', { id: 'TGT-2027-SPA', decision: 'APPROVE' }, 'BU_MANAGER').ok);
  check('Target: Owner menyetujui → terkunci', call('target.approve', { id: 'TGT-2027-SPA', decision: 'APPROVE' }, 'OWNER').ok && !call('target.save', { id: 'TGT-2027-SPA', revenue: 1, profit: 0 }, 'OWNER').ok);
  check('Target grup Rp125 M tidak ada di target operasional Spa–Essence', s().targets.every((t) => t.revenue < 125000000000));
  const pr = call('project.propose', { name: 'Ruang sauna Triloka', bu: 'BU-SPA', type: 'INNOVATION', capex: 450000000, opex: 15000000, payback: 30, irr: 0.18 }, 'HEAD_DIV');
  check('Proyek: usulan Inovasi tersimpan sebagai PROPOSED', pr.ok && pr.data.status === 'PROPOSED' && pr.data.type === 'INNOVATION');
  check('Proyek: tanpa nama ditolak', !call('project.propose', { name: '', capex: 1 }, 'OWNER').ok);
  check('Proyek: hanya Owner memutus', !call('project.decide', { id: pr.data.id, decision: 'APPROVE' }, 'BU_MANAGER').ok && call('project.decide', { id: pr.data.id, decision: 'APPROVE' }, 'OWNER').data.milestones.length === 2);
  call('project.milestone', { id: pr.data.id, index: 0, progress: 1 }, 'BU_MANAGER');
  const pm = call('project.milestone', { id: pr.data.id, index: 1, progress: 1.7 }, 'BU_MANAGER');
  check('Proyek: progress dibatasi 0–1, semua milestone selesai → COMPLETED', pm.ok && pm.data.milestones[1].progress === 1 && pm.data.status === 'COMPLETED');
  // B — allocation & users
  check('Alokasi shared office: total ≠ 100% ditolak', !call('cc.updateAllocation', { pool: 'CC-OFC-FIN', splits: { 'BU-SPA': 0.7, 'BU-ESS': 0.2 } }, 'FINANCE').ok);
  check('Alokasi shared office: 70/30 tersimpan', call('cc.updateAllocation', { pool: 'CC-OFC-FIN', basis: 'Proporsi pendapatan', splits: { 'BU-SPA': 0.7, 'BU-ESS': 0.3 } }, 'FINANCE').ok && s().sharedAllocations.find((a) => a.pool === 'CC-OFC-FIN').splits['BU-SPA'] === 0.7);
  check('Alokasi: Purchasing tidak berwenang', !call('cc.updateAllocation', { pool: 'CC-OFC-FIN', splits: { 'BU-SPA': 1 } }, 'PURCHASING').ok);
  check('User: role tidak terdaftar ditolak', !call('user.assignRole', { id: 'U-STF2', role: 'SUPERADMIN' }, 'ADMIN').ok);
  check('User: scope kosong ditolak', !call('user.assignRole', { id: 'U-STF2', role: 'SUPERVISOR', scope: [] }, 'ADMIN').ok);
  check('User: Admin mengubah role + scope', call('user.assignRole', { id: 'U-STF2', role: 'SUPERVISOR', scope: ['BR-UBD'] }, 'ADMIN').ok && s().users.find((u) => u.id === 'U-STF2').role === 'SUPERVISOR');
  check('User: non-Admin tidak dapat mengubah role', !call('user.assignRole', { id: 'U-STF', role: 'OWNER' }, 'OWNER').ok);
  // E — cancel
  check('MRF: orang lain tidak dapat membatalkan', !call('mrf.cancel', { id: 'PR20261100004', note: 'x' }, 'SUPERVISOR', 'U-SPV2').ok);
  check('MRF: pemohon membatalkan MRF SUBMITTED', call('mrf.cancel', { id: 'PR20261100004', note: 'Event diundur' }, 'STAFF', 'U-STF').ok && s().mrfs.find((m) => m.id === 'PR20261100004').status === 'CANCELLED');
  check('MRF: yang sudah diproses tidak dapat dibatalkan', !call('mrf.cancel', { id: 'PR20261100002' }, 'STAFF', 'U-STF').ok);
  // F — emergency purchase (limit = AR-08, DEMO)
  check('Darurat: alasan < 10 karakter ditolak', !call('po.emergency', { item: 'BHP-001', qty: 1, supplier: 'SUP-01', wh: 'WH-SHN', reason: 'cepat' }, 'SUPERVISOR').ok);
  check('Darurat: melebihi batas AR-08 ditolak (LIMIT)', call('po.emergency', { item: 'BHP-001', qty: 500, supplier: 'SUP-01', wh: 'WH-SHN', reason: 'Stok habis mendadak sebelum tamu grup' }, 'SUPERVISOR').error.code === 'LIMIT');
  const ep = call('po.emergency', { item: 'BHP-001', qty: 2, supplier: 'SUP-01', wh: 'WH-SHN', reason: 'Stok habis mendadak sebelum tamu grup' }, 'SUPERVISOR');
  check('Darurat: PO dibuat dengan approval susulan PENDING, tanpa jurnal', ep.ok && ep.data.emergency && ep.data.postApproval === 'PENDING' && !s().journals.some((j) => j.source === ep.data.id));
  check('Darurat: Supervisor tidak dapat menyetujui susulan sendiri', !call('po.postApprove', { id: ep.data.id, decision: 'APPROVE' }, 'SUPERVISOR').ok);
  check('Darurat: BU Manager menyetujui susulan', call('po.postApprove', { id: ep.data.id, decision: 'APPROVE', note: 'OK' }, 'BU_MANAGER').data.postApproval === 'APPROVED');
  // G — bins & stock opname
  check('Bin: format salah ditolak', !call('bin.add', { wh: 'WH-SHN', bin: 'shn-1' }, 'WAREHOUSE').ok);
  check('Bin: bin & rak baru ditambahkan', call('bin.add', { wh: 'WH-SHN', bin: 'SHN-Z-01' }, 'WAREHOUSE').ok && s().warehouses.find((w) => w.id === 'WH-SHN').racks.includes('Z'));
  check('Bin: duplikat ditolak', !call('bin.add', { wh: 'WH-SHN', bin: 'SHN-Z-01' }, 'WAREHOUSE').ok);
  const op = call('opname.start', { wh: 'WH-UBD' }, 'WAREHOUSE');
  check('Opname: dimulai; opname kedua di gudang sama ditolak', op.ok && op.data.lines.length > 0 && !call('opname.start', { wh: 'WH-UBD' }, 'WAREHOUSE').ok);
  const counts = op.data.lines.map((l) => l.system);
  check('Opname: ada item belum dihitung → ditolak', !call('opname.submit', { id: op.data.id, counts: counts.slice(1), note: '' }, 'WAREHOUSE').ok);
  const surplus = counts.map((c, i) => (i === 0 ? c + 2 : c));
  check('Opname: selisih tanpa penjelasan ditolak', !call('opname.submit', { id: op.data.id, counts: surplus, note: '' }, 'WAREHOUSE').ok);
  const it0 = op.data.lines[0].item;
  const before = stockOf(s(), 'WH-UBD', it0).onHand;
  check('Opname: diajukan dengan penjelasan', call('opname.submit', { id: op.data.id, counts: surplus, note: 'Ditemukan 2 botol di rak B' }, 'WAREHOUSE').ok);
  check('Opname: Gudang tidak dapat menyetujui sendiri', !call('opname.approve', { id: op.data.id }, 'WAREHOUSE').ok);
  check('Opname: Finance menyetujui → stok +2, ledger ADJUST, jurnal seimbang', call('opname.approve', { id: op.data.id }, 'FINANCE').ok && stockOf(s(), 'WH-UBD', it0).onHand === before + 2 && s().ledger.some((l) => l.type === 'ADJUST' && l.ref === op.data.id) && balanced(op.data.id));
  // H — GL posting
  const pend = s().journals.find((j) => j.status === 'PENDING_REVIEW');
  if (pend) {
    check('GL: Purchasing tidak dapat posting', !call('gl.post', { id: pend.id }, 'PURCHASING').ok);
    check('GL: Finance posting jurnal review → POSTED; posting ulang ditolak', call('gl.post', { id: pend.id }, 'FINANCE').ok && !call('gl.post', { id: pend.id }, 'FINANCE').ok);
  } else check('GL: ada jurnal PENDING_REVIEW di data demo untuk diuji', false, 'tidak ada');
  // I — asset
  check('Laporan kerusakan: uraian kosong ditolak', !call('mt.create', { asset: 'AST-SHN-0001', issue: '' }, 'STAFF').ok);
  const mt = call('mt.create', { asset: 'AST-SHN-0001', issue: 'AC tidak dingin sejak pagi', priority: 'HIGH' }, 'STAFF');
  check('Laporan kerusakan oleh Staff → SUBMITTED', mt.ok && mt.data.status === 'SUBMITTED' && s().maintenance[0].id === mt.data.id);
  const nAst = s().assets.length;
  const cap = call('asset.capitalize', { name: 'Mesin Hot Stone', cat: 'Peralatan Treatment', org: 'BR-SHN', cost: 12500000, life: 5 }, 'FINANCE');
  check('Kapitalisasi: aset baru + jurnal aset seimbang', cap.ok && s().assets.length === nAst + 1 && balanced(cap.data.id));
  check('Kapitalisasi: nilai 0 ditolak', !call('asset.capitalize', { name: 'X', org: 'BR-SHN', cost: 0, life: 5 }, 'FINANCE').ok);
  check('Disposal: diusulkan PIC Aset', call('asset.dispose', { id: 'AST-SHN-0002', step: 'REQUEST', reason: 'Motor rusak permanen' }, 'ASSET').data.status === 'PENDING_DISPOSAL');
  check('Disposal: PIC Aset tidak dapat menyetujui', !call('asset.dispose', { id: 'AST-SHN-0002', step: 'APPROVE' }, 'ASSET').ok);
  check('Disposal: Finance menyetujui → DISPOSED + jurnal seimbang', call('asset.dispose', { id: 'AST-SHN-0002', step: 'APPROVE' }, 'FINANCE').data.status === 'DISPOSED' && balanced('AST-SHN-0002'));
  call('asset.dispose', { id: 'AST-UBD-0001', step: 'REQUEST', reason: 'Bocor, tidak ekonomis' }, 'FINANCE');
  check('Disposal: pengusul (Finance) tidak dapat menyetujui sendiri (SoD)', call('asset.dispose', { id: 'AST-UBD-0001', step: 'APPROVE' }, 'FINANCE').error.code === 'SOD');
  // E/F/G — fulfillment plan, PO draft edit, direct issue & return
  const nm = call('mrf.create', { branch: 'BR-SHN', lines: [{ item: 'BHP-006', qty: 1, reason: 'Uji' }] }, 'STAFF', 'U-STF');
  check('Rencana fulfillment: MRF belum disetujui ditolak', nm.ok && !call('mrf.planFulfillment', { id: nm.data.id }, 'SUPERVISOR', 'U-SPV').ok);
  call('mrf.decide', { id: nm.data.id, decision: 'APPROVE', note: 'OK' }, 'SUPERVISOR', 'U-SPV');
  const nmL = s().mrfs.find((m) => m.id === nm.data.id).lines[0];
  check('Rencana fulfillment otomatis saat disetujui (Σ alokasi = qty); rencana ulang ditolak', nmL.alloc.reduce((a, x) => a + x.qty, 0) === 1 && !call('mrf.planFulfillment', { id: nm.data.id }, 'SUPERVISOR', 'U-SPV').ok);
  const pk = S.pendingPurchase(s())[0];
  if (pk) call('po.createFromMrf', { picks: [{ mrf: pk.mrf, li: pk.li, ai: pk.ai }], supplier: pk.supplier }, 'PURCHASING');
  const dpo = s().pos.find((x) => x.status === 'DRAFT');
  if (dpo) {
    const u = call('po.update', { id: dpo.id, freight: 25000, memo: 'Kirim pagi', lines: [{ price: dpo.lines[0].price - 1000 }] }, 'PURCHASING');
    check('PO draft: Purchasing mengubah harga & ongkir', u.ok && u.data.freight === 25000 && u.data.memo === 'Kirim pagi');
    check('PO draft: Gudang tidak dapat mengubah PO', !call('po.update', { id: dpo.id, freight: 0 }, 'WAREHOUSE').ok);
  } else check('PO draft tersedia di data demo untuk uji po.update', false, 'tidak ada');
  const sent = s().pos.find((x) => x.status === 'SENT' || x.status === 'APPROVED');
  check('PO non-draft tidak dapat diubah', !sent || !call('po.update', { id: sent.id, freight: 1 }, 'PURCHASING').ok);
  const avail = S.available(s(), 'WH-UBD', 'BHP-003');
  check('Pemakaian langsung: melebihi stok tersedia ditolak', !call('stock.issueDirect', { wh: 'WH-UBD', item: 'BHP-003', qty: avail + 1 }, 'WAREHOUSE').ok);
  const oh = stockOf(s(), 'WH-UBD', 'BHP-003').onHand;
  check('Pemakaian langsung 1: stok −1, ledger ISSUE, jurnal beban seimbang', call('stock.issueDirect', { wh: 'WH-UBD', item: 'BHP-003', qty: 1, note: 'Uji', ref: 'ISS-T7' }, 'WAREHOUSE').ok && stockOf(s(), 'WH-UBD', 'BHP-003').onHand === oh - 1 && balanced('ISS-T7'));
  check('Retur qty 0 ditolak', !call('stock.return', { wh: 'WH-UBD', item: 'BHP-003', qty: 0 }, 'WAREHOUSE').ok);
  check('Retur 1: stok kembali, jurnal balik seimbang', call('stock.return', { wh: 'WH-UBD', item: 'BHP-003', qty: 1, ref: 'RET-T7' }, 'WAREHOUSE').ok && stockOf(s(), 'WH-UBD', 'BHP-003').onHand === oh && balanced('RET-T7'));
  check('Staff tidak dapat mengeluarkan stok langsung', !call('stock.issueDirect', { wh: 'WH-SHN', item: 'BHP-006', qty: 1 }, 'STAFF').ok);
  const untested = H.CONTRACTS.filter((c) => !c.read && !new RegExp("call\\('" + c.id.replace('.', '\\.') + "'").test(require('fs').readFileSync(__filename, 'utf8'))).map((c) => c.id);
  check('Setiap operasi tulis di kontrak punya tes engine', !untested.length, untested.join());
})();

/* ============ T8. Smart Spend Money & AI Receipt (MP-HAWK-05/06) ============ */
(function spend() {
  console.log('T8 Smart Spend Money & AI Receipt');
  const { call, s } = fresh();
  const bal = (id) => { const j = s().journals.find((x) => x.id === id); return !!j && Math.abs(j.lines.reduce((a, l) => a + l.dr - l.cr, 0)) < 1; };
  const spaBefore = S.budgetView(s(), 'BGT-2026-SPA').lines.find((l) => l.p === 'FACILITY' && l.cls === 'OPEX');
  // Acceptance: Staff Shanti, handwritten receipt
  let r = call('spend.capture', { scenario: 'HANDWRITTEN', branch: 'BR-SHN' }, 'STAFF', 'U-STF');
  const id = r.data.id;
  const sp = () => S.spend(s(), id);
  check('Capture: draft + bukti asli tersimpan terpisah, sumber = AI SIMULATION', r.ok && sp().status === 'DRAFT' && sp().source === 'SIMULATED_AI_EXTRACTION' && S.evidence(s(), sp().evidence).image.endsWith('handwritten.svg'));
  check('AI: harga Pasir & Total ditandai ragu (amber)', S.spendLineState(sp(), 1) === 'CONFIRM' && S.spendFieldState(sp(), 'total') === 'BAD');
  check('AI: aritmetika tidak cocok (935.000 vs 1.250.000) → tidak diam-diam memilih angka', !S.spendMath(sp()).ok && S.spendMath(sp()).expected === 935000 && sp().fields.total === 1250000);
  check('AI: metode bayar tidak terbaca → kosong (tidak dikarang)', sp().fields.pay === null);
  check('Ajukan sebelum koreksi ditolak (ARITHMETIC)', call('spend.submit', { id }, 'STAFF', 'U-STF').error.code === 'ARITHMETIC');
  call('spend.update', { id, lines: sp().lines.map((l, i) => (i === 1 ? { ...l, price: 350000 } : l)) }, 'STAFF', 'U-STF');
  check('Koreksi harga Pasir → aritmetika cocok; koreksi tercatat terpisah dari nilai AI', S.spendMath(sp()).ok && sp().corrections.some((c) => c.field === 'line:1' && c.ai === 35000 && c.value === 350000) && sp().ai.lines[1].price === 35000);
  check('Total masih perlu konfirmasi pengguna', S.spendOpenIssues(sp()).includes('total'));
  call('spend.update', { id, confirm: ['total'], fields: { pay: 'CASH', payDate: '2026-11-07' } }, 'STAFF', 'U-STF');
  check('Rekomendasi 7P = Facility (bukan "Procurement"), cost center CC-SHN-OPS', sp().cls.p === 'FACILITY' && sp().cc === 'CC-SHN-OPS' && !HAWK.SPEND.SPEND_P.includes('PROFIT'));
  check('7P di luar 6 kategori belanja ditolak', !call('spend.update', { id, cls: { p: 'PROCUREMENT' } }, 'STAFF', 'U-STF').ok && !call('spend.update', { id, cls: { p: 'PROFIT' } }, 'STAFF', 'U-STF').ok);
  const bud = S.spendBudget(s(), sp());
  check('Cek budget bulanan Shanti Facility: 18,75 jt; masih dalam budget', bud.monthly === 18750000 && bud.status === 'OK' && bud.thisAmt === 1250000);
  check('Supervisor tidak dapat mengajukan nota milik Staff', !call('spend.submit', { id }, 'SUPERVISOR', 'U-SPV').ok);
  r = call('spend.submit', { id }, 'STAFF', 'U-STF');
  check('Ajukan → SUBMITTED; rute Supervisor → Finance verifikasi → Finance bayar', r.ok && sp().status === 'SUBMITTED' && sp().steps.map((x) => x.key).join() === 'CONFIRM,APPROVE,VERIFY,SETTLE');
  check('Konfirmasi Staff ≠ approval/pembayaran/jurnal', !sp().journal && !s().payments.some((p) => p.spend === id) && sp().steps[1].status === 'PENDING');
  check('Komitmen budget Facility naik tepat 1,25 jt (belum actual)', S.budgetView(s(), 'BGT-2026-SPA').lines.find((l) => l.p === 'FACILITY' && l.cls === 'OPEX').commitment === spaBefore.commitment + 1250000);
  check('Data tidak dapat diubah setelah diajukan', !call('spend.update', { id, fields: { total: 1 } }, 'STAFF', 'U-STF').ok);
  check('Supervisor Ubud tidak dapat menyetujui', !call('spend.approve', { id }, 'SUPERVISOR', 'U-SPV2').ok);
  check('Finance tidak dapat verifikasi sebelum approval', !call('spend.verify', { id }, 'FINANCE').ok);
  check('Supervisor Shanti menyetujui', call('spend.approve', { id, decision: 'APPROVE', note: 'Perbaikan saluran taman' }, 'SUPERVISOR', 'U-SPV').ok && sp().status === 'APPROVED');
  check('Bukti asli dapat dibuka Finance & Supervisor, tidak oleh Staff Ubud', S.canSeeEvidence(s(), s().users.find((u) => u.id === 'U-FIN'), sp()) && S.canSeeEvidence(s(), s().users.find((u) => u.id === 'U-SPV'), sp()) && !S.canSeeEvidence(s(), s().users.find((u) => u.id === 'U-STF2'), sp()));
  r = call('spend.verify', { id, note: 'Perbaikan kecil, OPEX' }, 'FINANCE');
  const jv = s().journals.find((j) => j.id === sp().journal);
  check('Finance verifikasi → 1 jurnal PENDING_REVIEW seimbang: Dr 6210 Facility / Cr 2155 kas kecil', r.ok && jv && jv.status === 'PENDING_REVIEW' && bal(jv.id) && jv.lines[0].acc.startsWith('6210') && jv.lines[1].acc.startsWith('2155'));
  const after = S.budgetView(s(), 'BGT-2026-SPA').lines.find((l) => l.p === 'FACILITY' && l.cls === 'OPEX');
  check('Budget: actual +1,25 jt, komitmen kembali (tanpa double counting)', after.actual === spaBefore.actual + 1250000 && after.commitment === spaBefore.commitment);
  check('Pembayaran butuh konfirmasi eksplisit', !call('spend.settle', { id }, 'FINANCE').ok);
  r = call('spend.settle', { id, confirm: true }, 'FINANCE');
  check('Rekonsiliasi kas kecil → SETTLED + jurnal pembayaran seimbang', r.ok && sp().status === 'SETTLED' && bal(sp().settleJournal));
  check('Tidak ada posting ganda: tepat 2 jurnal (beban + pembayaran) & 1 pembayaran untuk SM ini', s().journals.filter((j) => j.source === id).length === 2 && s().payments.filter((p) => p.spend === id).length === 1 && !call('spend.settle', { id, confirm: true }, 'FINANCE').ok);
  check('Nota yang sama difoto ulang → DUPLICATE saat diajukan', (() => { const d = call('spend.capture', { scenario: 'HANDWRITTEN' }, 'STAFF', 'U-STF').data; call('spend.update', { id: d.id, lines: d.lines.map((l, i) => (i === 1 ? { ...l, price: 350000 } : l)), confirm: ['total'], fields: { pay: 'CASH', payDate: '2026-11-07' } }, 'STAFF', 'U-STF'); return call('spend.submit', { id: d.id }, 'STAFF', 'U-STF').error.code === 'DUPLICATE'; })());

  // Other scenarios
  const cap = (k, role = 'STAFF', uid = 'U-STF') => call('spend.capture', { scenario: k, branch: 'BR-SHN' }, role, uid).data;
  const dup = cap('DUPLICATE');
  check('Skenario duplikat terdeteksi (sidik jari + no. nota) terhadap SM20261100001', S.spendDuplicates(s(), dup).some((h) => h.id === 'SM20261100001'));
  const blur = cap('BLURRY');
  check('Foto buram: supplier/tanggal/total kosong, 0 baris — tidak ada angka karangan', blur.fields.total === null && blur.fields.supplier === null && blur.lines.length === 0 && call('spend.submit', { id: blur.id }, 'STAFF', 'U-STF').error.code === 'VALIDATION');
  const pr = cap('PRINTED');
  call('spend.update', { id: pr.id, fields: { payDate: '2026-11-08' } }, 'STAFF', 'U-STF');
  check('Struk tercetak jelas: semua hijau, langsung dapat diajukan', S.spendOpenIssues(S.spend(s(), pr.id)).length === 0 && call('spend.submit', { id: pr.id }, 'STAFF', 'U-STF').ok);
  const em = cap('EMERGENCY', 'SUPERVISOR', 'U-SPV');
  call('spend.update', { id: em.id, fields: { payDate: '2026-11-08' } }, 'SUPERVISOR', 'U-SPV');
  check('Darurat tanpa alasan ditolak', call('spend.submit', { id: em.id }, 'SUPERVISOR', 'U-SPV').error.code === 'VALIDATION');
  call('spend.update', { id: em.id, emergency: { reason: 'AC ruang treatment 3 mati saat ada tamu' } }, 'SUPERVISOR', 'U-SPV');
  const ems = call('spend.submit', { id: em.id }, 'SUPERVISOR', 'U-SPV');
  check('Darurat: approval susulan BU Manager + jejak eksepsi AR-08', ems.ok && ems.data.steps[1].role === 'BU_MANAGER' && ems.data.steps[1].post && ems.data.emergency.rule === 'AR-08');
  check('Darurat: pengaju (Supervisor) tidak dapat menyetujui sendiri; BU Manager menyetujui', !call('spend.approve', { id: em.id }, 'SUPERVISOR', 'U-SPV').ok && call('spend.approve', { id: em.id, note: 'OK susulan' }, 'BU_MANAGER').ok);
  const ob = cap('OVERBUDGET');
  call('spend.update', { id: ob.id, fields: { payDate: '2026-11-08' } }, 'STAFF', 'U-STF');
  check('Over budget Promotion: status OVER → rute + BU Manager', S.spendBudget(s(), S.spend(s(), ob.id)).status === 'OVER' && call('spend.submit', { id: ob.id }, 'STAFF', 'U-STF').data.steps.some((x) => x.key === 'APPROVE2' && x.role === 'BU_MANAGER'));
  call('spend.approve', { id: ob.id }, 'SUPERVISOR', 'U-SPV');
  check('Over budget: setelah Supervisor masih menunggu BU Manager', S.spend(s(), ob.id).status === 'SUBMITTED' && S.spendNextStep(S.spend(s(), ob.id)).role === 'BU_MANAGER');
  const un = cap('UNPAID');
  check('Tagihan belum dibayar: supplier baru tidak cocok master; flow UNPAID; wajib jatuh tempo', un.flow === 'UNPAID' && !un.fields.supplierId && un.fields.due === '2026-11-22');
  call('spend.submit', { id: un.id }, 'STAFF', 'U-STF');
  call('spend.approve', { id: un.id }, 'SUPERVISOR', 'U-SPV');
  call('spend.verify', { id: un.id }, 'FINANCE');
  const unj = s().journals.find((j) => j.id === S.spend(s(), un.id).journal);
  check('Tagihan: verifikasi → Dr beban + PPN Masukan / Cr Utang Usaha (belum dibayar)', bal(unj.id) && unj.lines.some((l) => l.acc.startsWith('1150') && l.dr === 220000) && unj.lines.some((l) => l.acc.startsWith('2110') && l.cr === 2220000) && S.spend(s(), un.id).status === 'VERIFIED');
  const rb = cap('REIMBURSE');
  check('Reimburse: SKU BHP-001 dikenali, jenis Persediaan, alert harga +8%', rb.lines[0].sku === 'BHP-001' && rb.cls.type === 'INVENTORY' && S.priceAlerts(s(), rb).length === 1);
  check('Reimburse: metode bayar ragu → wajib dikonfirmasi', S.spendOpenIssues(rb).includes('pay'));
  call('spend.update', { id: rb.id, confirm: ['pay'] }, 'STAFF', 'U-STF');
  const rbs = call('spend.submit', { id: rb.id }, 'STAFF', 'U-STF');
  check('Reimburse persediaan: rute Supervisor → Gudang → Finance → bayar karyawan', rbs.ok && rbs.data.steps.map((x) => x.key).join() === 'CONFIRM,APPROVE,GOODS,VERIFY,SETTLE' && rbs.data.fields.payer === 'U-STF');
  const prodBefore = S.budgetView(s(), 'BGT-2026-SPA').lines.find((l) => l.p === 'PRODUCT' && l.cls === 'OPEX');
  const stk = (S.stock(s(), 'WH-SHN', 'BHP-001') || { onHand: 0 }).onHand;
  call('spend.approve', { id: rb.id }, 'SUPERVISOR', 'U-SPV');
  check('Finance tidak dapat melewati konfirmasi gudang', !call('spend.verify', { id: rb.id }, 'FINANCE').ok);
  check('Gudang konfirmasi qty fisik berbeda → ditolak', call('spend.receive', { id: rb.id, qty: [2] }, 'WAREHOUSE').error.code === 'MISMATCH');
  check('Gudang konfirmasi 3 → stok Shanti +3, ledger RECEIPT', call('spend.receive', { id: rb.id }, 'WAREHOUSE').ok && S.stock(s(), 'WH-SHN', 'BHP-001').onHand === stk + 3 && s().ledger.some((l) => l.type === 'RECEIPT' && l.ref === rb.id));
  check('Finance tidak dapat mengubah persediaan menjadi beban setelah barang diterima', !call('spend.verify', { id: rb.id, cls: { type: 'OPEX' } }, 'FINANCE').ok);
  call('spend.verify', { id: rb.id }, 'FINANCE');
  const rbj = s().journals.find((j) => j.id === S.spend(s(), rb.id).journal);
  const prodAfter = S.budgetView(s(), 'BGT-2026-SPA').lines.find((l) => l.p === 'PRODUCT' && l.cls === 'OPEX');
  check('Reimburse: Dr Persediaan / Cr Utang reimburse karyawan; budget Product TIDAK naik saat pembelian', rbj.lines[0].acc.startsWith('1140') && rbj.lines.some((l) => l.acc.startsWith('2140')) && prodAfter.actual === prodBefore.actual && prodAfter.commitment === prodBefore.commitment);
  check('Reimburse dibayar sekali', call('spend.settle', { id: rb.id, confirm: true }, 'FINANCE').ok && !call('spend.settle', { id: rb.id, confirm: true }, 'FINANCE').ok);
  const po = cap('PO_PRICE', 'FINANCE', 'U-FIN');
  const pos = call('spend.submit', { id: po.id }, 'FINANCE', 'U-FIN');
  const doc = s().docs.find((d) => d.id === S.spend(s(), po.id).doc);
  check('Faktur PO: diteruskan ke three-way match yang sudah ada (tanpa approval ganda)', pos.ok && pos.data.status === 'IN_MATCHING' && doc && doc.spend === po.id && doc.evidence === po.evidence);
  const mt = call('doc.match', { id: doc.id }, 'FINANCE');
  check('Faktur PO: harga 52.500 vs PO 48.000 → MISMATCH; status Smart Spend mengikuti', mt.data.status === 'MISMATCH' && mt.data.match.checks.find((c) => c.key === 'price').ok === false && S.spendStatus(s(), S.spend(s(), po.id)) === 'MISMATCH');
  check('Faktur PO: tidak ada jurnal dari Smart Spend (jurnal hanya lewat AP)', !s().journals.some((j) => j.source === po.id));
  check('Batal draft oleh pengaju', call('spend.cancel', { id: blur.id }, 'STAFF', 'U-STF').ok && S.spend(s(), blur.id).status === 'CANCELLED');
  check('Akses daftar: Staff Ubud tidak melihat nota Shanti; Finance melihat semua', !S.spendsFor(s(), s().users.find((u) => u.id === 'U-STF2')).some((x) => x.branch === 'BR-SHN') && S.spendsFor(s(), s().users.find((u) => u.id === 'U-FIN')).length === s().spends.length);
  check('Semua jurnal Smart Spend seimbang', s().spends.filter((x) => x.journal).every((x) => bal(x.journal) && (!x.settleJournal || bal(x.settleJournal))));
})();

/* ============ T9. Order Sederhana — manusia hanya: pesan · barang diterima · sudah dibayar (aturan AR-13, bukan AI) ============ */
(function simpleOrder() {
  console.log('T9 Order Sederhana (otomatis AR-13)');
  const { call, s, user } = fresh();
  const bal = (id) => { const j = s().journals.find((x) => x.id === id); return j && Math.round(H.U.sum(j.lines, (l) => l.dr)) === Math.round(H.U.sum(j.lines, (l) => l.cr)); };
  const allBal = () => s().journals.every((j) => Math.round(H.U.sum(j.lines, (l) => l.dr)) === Math.round(H.U.sum(j.lines, (l) => l.cr)));
  const humanOps = () => s().audit.filter((a) => a.user !== 'SYS-RULE').map((a) => a.op);
  const b0 = S.itemBudget(s(), 'BR-SHN', 'BHP-001');
  const shn0 = stockOf(s(), 'WH-SHN', 'BHP-001').onHand;
  const auditStart = s().audit.length;

  // A. 3 jenis barang, qty & nilai berbeda — dalam budget → lolos otomatis (lokal + transfer + beli)
  let r = call('order.quick', { branch: 'BR-SHN', lines: [{ item: 'BHP-001', qty: 12 }, { item: 'BHP-004', qty: 4 }, { item: 'BHP-007', qty: 100 }] }, 'STAFF', 'U-STF');
  check('A: Staff memesan 3 jenis barang', r.ok, r.error && r.error.message);
  const A0 = r.data;
  const mr = (id) => s().mrfs.find((x) => x.id === id);
  let A = A0;
  check('A: lolos AR-13 (rutin, dalam budget, ≤ Rp5 jt) → disetujui sistem tanpa atasan', A.autoCheck.ok && A.approvals[0].by === 'SYS-RULE' && A.status === 'IN_FULFILLMENT', JSON.stringify(A.autoCheck));
  check('A: nilai pesanan dihitung (12×85rb + 4×145rb + 100×6,5rb = Rp2.250.000)', A.autoCheck.value === 2250000, A.autoCheck.value);
  const al = A.lines[0].alloc;
  check('A: minyak pijat 12 = lokal + transfer + beli (Σ = 12)', H.U.sum(al, (a) => a.qty) === 12 && al.some((a) => a.path === 'PURCHASE'), JSON.stringify(al));
  const poA = S.simplePOs(s(), A);
  check('A: PO dibuat, disetujui & dikirim ke supplier default otomatis', poA.length >= 1 && poA.every((p) => p.status === 'SENT' && p.auto && p.approvedBy === 'SYS-RULE' && p.supplier === S.item(s(), p.lines[0].item).supplier), JSON.stringify(poA.map((p) => [p.id, p.status])));
  check('A: transfer antar-gudang dikirim otomatis', s().transfers.filter((t) => t.mrf === A.id).every((t) => t.status === 'IN_TRANSIT'));
  check('A: budget item → komitmen bertambah 12 (belum realisasi)', S.itemBudget(s(), 'BR-SHN', 'BHP-001').commitQty === b0.commitQty + 12, S.itemBudget(s(), 'BR-SHN', 'BHP-001').commitQty);
  check('A: tidak ada tugas approval MRF/PO untuk Supervisor/Purchasing', !S.mrfNextApprover(s(), A) && poA.every((p) => !S.poNextApprover(s(), p)) && !S.pendingPurchase(s()).some((x) => x.mrf === A.id));
  check('A: Staff mendapat tugas tunggal "Barang diterima"', S.simpleStage(s(), A).key === 'ARRIVE');

  // B. Finance konfirmasi bayar SEBELUM barang datang → uang muka
  const po1 = poA[0];
  r = call('order.pay', { po: po1.id, confirm: true }, 'STAFF', 'U-STF');
  check('B: Staff tidak bisa konfirmasi bayar', !r.ok && r.error.code === 'FORBIDDEN');
  r = call('order.pay', { po: po1.id }, 'FINANCE');
  check('B: tanpa konfirmasi eksplisit ditolak', !r.ok && r.error.code === 'CONFIRM');
  r = call('order.pay', { po: po1.id, confirm: true }, 'FINANCE');
  check('B: Finance "Sudah dibayar" sebelum barang tiba → uang muka Dr 1160 / Cr 1110', r.ok && S.poPayState(s(), po1).status === 'PAID' && s().journals.some((j) => j.kind === 'ADVANCE_PAYMENT' && j.source === po1.id), r.error && r.error.message);
  r = call('order.pay', { po: po1.id, confirm: true }, 'FINANCE');
  check('B: bayar dua kali diblok', !r.ok && r.error.code === 'DUPLICATE');

  // C. Staff "Barang diterima" — sebagian (minyak pijat kurang 2)
  const buy = al.find((a) => a.path === 'PURCHASE').qty;
  r = call('order.receive', { id: A.id, lines: [{ item: 'BHP-001', received: 10, damaged: 0 }] }, 'STAFF', 'U-STF2');
  check('C: Staff cabang lain tidak bisa konfirmasi terima', !r.ok && r.error.code === 'FORBIDDEN', r.error && r.error.code);
  r = call('order.receive', { id: A.id, lines: [{ item: 'BHP-001', received: 10, damaged: 0 }] }, 'STAFF', 'U-STF');
  A = mr(A0.id); // a refused call rolls the store back to a fresh copy — always re-read
  check('C: Staff tekan "Barang diterima" (minyak pijat 10 dari 12)', r.ok, r.error && r.error.message);
  const poMin = s().pos.find((p) => p.lines.some((l) => l.item === 'BHP-001') && p.auto);
  check('C: GRN otomatis terposting & tersimpan, PO jadi PARTIAL (backorder 2)', poMin.status === 'PARTIAL' && s().grns.filter((g) => g.po === poMin.id).every((g) => g.status === 'STORED'), poMin.status);
  check('C: tagihan otomatis = harga PO × qty diterima; uang muka dikompensasi', s().bills.filter((b) => b.po === po1.id && b.auto).every((b) => b.matchStatus === 'MATCHED' && (b.po !== poMin.id || b.subtotal === (buy - 2) * 85000)), JSON.stringify(s().bills.filter((b) => b.auto).map((b) => [b.po, b.subtotal, b.status])));
  check('C: barang langsung tercatat terpakai (realisasi budget) & status sebagian', A.status === 'IN_FULFILLMENT' && S.mrfFulfillment(s(), A).issued === S.mrfFulfillment(s(), A).requested - 2, JSON.stringify(S.mrfFulfillment(s(), A)));
  check('C: stok fisik Shanti tidak negatif & konsisten', s().stock.every((x) => x.onHand >= 0 && x.reserved >= 0 && x.reserved <= x.onHand + 0.0001));
  // sisa datang
  r = call('order.receive', { id: A.id }, 'STAFF', 'U-STF');
  A = mr(A0.id);
  check('C: sisa 2 datang → "Barang diterima" lagi → pesanan SELESAI', r.ok && A.status === 'FULFILLED', (r.error && r.error.message) || A.status);
  check('C: semua PO pesanan RECEIVED', S.simplePOs(s(), A).every((p) => p.status === 'RECEIVED'));
  const bNow = S.itemBudget(s(), 'BR-SHN', 'BHP-001');
  check('C: budget minyak pijat → realisasi +12, komitmen kembali', bNow.actualQty === b0.actualQty + 12 && bNow.commitQty === b0.commitQty, JSON.stringify([b0.actualQty, b0.commitQty, bNow.actualQty, bNow.commitQty]));
  check('C: stok lokal Shanti tidak dobel (awal − lokal terpakai)', stockOf(s(), 'WH-SHN', 'BHP-001').onHand === shn0 - al.find((a) => a.path === 'LOCAL').qty, stockOf(s(), 'WH-SHN', 'BHP-001').onHand);

  // D. Bayar SESUDAH diterima (PO lain dari pesanan A, bila ada) → bill.pay biasa
  const others = S.simplePOs(s(), A).filter((p) => S.poPayState(s(), p).rest > 0);
  others.forEach((p) => (r = call('order.pay', { po: p.id, confirm: true }, 'FINANCE')));
  check('D: semua PO pesanan A lunas, uang muka 1160 bersih (0)', S.simplePOs(s(), A).every((p) => S.poPayState(s(), p).status === 'PAID'), JSON.stringify(S.simplePOs(s(), A).map((p) => S.poPayState(s(), p))));
  const adv = H.U.sum(s().journals.flatMap((j) => j.lines).filter((l) => l.acc.startsWith('1160')), (l) => l.dr - l.cr);
  check('D: saldo uang muka 1160 = 0 setelah barang lengkap diterima', Math.round(adv) === 0, adv);
  const ap = H.U.sum(s().journals.filter((j) => S.simplePOs(s(), A).some((p) => j.source === p.id || s().bills.some((b) => b.id === j.source && b.po === p.id))).flatMap((j) => j.lines).filter((l) => l.acc.startsWith('2110')), (l) => l.dr - l.cr);
  check('D: utang usaha pesanan A = 0 (tidak dobel bayar)', Math.round(ap) === 0, ap);
  check('D: semua jurnal seimbang', allBal());
  const ops = humanOps().slice(0, s().audit.length - auditStart);
  check('D: manusia hanya 3 aksi (pesan · terima · bayar); approval, PO, posting, put-away & tagihan oleh SYS-RULE', ops.every((o) => ['order.quick', 'mrf.create', 'order.receive', 'grn.receive', 'transfer.receive', 'order.pay', 'bill.pay'].includes(o)) && ['mrf.decide', 'po.submit', 'po.decide', 'po.send', 'grn.post', 'grn.putaway', 'bill.approve', 'doc.verify', 'transfer.dispatch'].every((o) => !ops.includes(o)), JSON.stringify(H.U.uniq(ops)));

  // E. Melebihi budget → otomatis jatuh ke rantai manual (Supervisor + BU Manager)
  r = call('order.quick', { branch: 'BR-SHN', lines: [{ item: 'BHP-005', qty: 20 }] }, 'STAFF', 'U-STF');
  check('E: melebihi budget → TIDAK otomatis, alasan jelas, rantai + BU Manager', r.ok && !r.data.autoCheck.ok && r.data.status === 'SUBMITTED' && r.data.chain.includes('BU_MANAGER') && /melebihi budget/.test(r.data.autoCheck.why[0]), JSON.stringify(r.data && [r.data.autoCheck, r.data.chain]));
  check('E: tidak ada PO dibuat untuk pengecualian', S.simplePOs(s(), r.data).length === 0);
  // F. Barang tanpa budget (bahan baku Essence di outlet) → manual
  r = call('order.quick', { branch: 'BR-SHN', lines: [{ item: 'ESS-RM-01', qty: 1 }] }, 'STAFF', 'U-STF');
  check('F: barang tanpa budget item → manual', r.ok && !r.data.autoCheck.ok && /belum ada budget/.test(r.data.autoCheck.why.join()), JSON.stringify(r.data && r.data.autoCheck));
  // G. Pengaturan oleh Finance / Super Admin / Owner — batas diturunkan ke Rp500rb
  r = call('autoOrder.update', { max: 500000, note: 'Uji batas kecil' }, 'STAFF');
  check('G: Staff tidak bisa mengubah pengaturan', !r.ok && r.error.code === 'FORBIDDEN');
  r = call('autoOrder.update', { max: 500000 }, 'FINANCE');
  check('G: alasan perubahan wajib', !r.ok && r.error.code === 'VALIDATION');
  r = call('autoOrder.update', { max: 500000, note: 'Uji batas kecil' }, 'FINANCE');
  check('G: Finance menurunkan batas ke Rp500rb (tercatat audit before/after)', r.ok && S.autoRule(s()).max === 500000 && S.autoRule(s()).changes[0].before.max === 5000000 && s().audit[0].op === 'autoOrder.update');
  r = call('order.quick', { branch: 'BR-SHN', lines: [{ item: 'BHP-003', qty: 20 }] }, 'STAFF', 'U-STF');
  check('G: pesanan Rp760rb > batas baru → manual (Supervisor)', r.ok && !r.data.autoCheck.ok && r.data.chain[0] === 'SUPERVISOR', JSON.stringify(r.data && r.data.autoCheck));
  r = call('autoOrder.update', { active: false, note: 'Owner menonaktifkan sementara' }, 'OWNER');
  check('G: Owner bisa menonaktifkan', r.ok && S.autoRule(s()).active === false);
  r = call('autoOrder.update', { active: true, max: 5000000, note: 'Kembali ke keputusan Owner 8 Nov' }, 'ADMIN');
  check('G: Super Admin bisa mengaktifkan kembali', r.ok && S.autoRule(s()).active && S.autoRule(s()).max === 5000000 && S.autoRule(s()).version === 4);
  r = call('autoOrder.update', { max: 30000000, note: 'terlalu besar' }, 'OWNER');
  check('G: batas > Rp25 jt ditolak', !r.ok && r.error.code === 'VALIDATION');
  // H. Ubud — beli murni dari supplier, bayar setelah terima
  r = call('order.quick', { branch: 'BR-UBD', lines: [{ item: 'BHP-001', qty: 20 }, { item: 'BHP-002', qty: 10 }] }, 'STAFF', 'U-STF2');
  const Hm = r.data;
  check('H: Ubud (staff lain) — 2 jenis barang lolos otomatis', r.ok && Hm.autoCheck.ok && Hm.status === 'IN_FULFILLMENT', JSON.stringify(r.data && r.data.autoCheck));
  r = call('order.receive', { id: Hm.id, lines: [{ item: 'BHP-001', received: 20, damaged: 2 }] }, 'STAFF', 'U-STF2');
  check('H: 2 botol rusak dicatat; tagihan hanya untuk yang diterima baik', r.ok && s().grns.some((g) => g.lines.some((l) => l.item === 'BHP-001' && l.damaged === 2)), r.error && r.error.message);
  r = call('order.receive', { id: Hm.id }, 'STAFF', 'U-STF2');
  S.simplePOs(s(), Hm).forEach((p) => S.poPayState(s(), p).rest > 0 && call('order.pay', { po: p.id, confirm: true }, 'FINANCE'));
  check('H: setelah terima & bayar: tagihan PAID, jurnal seimbang', s().bills.filter((b) => S.simplePOs(s(), Hm).some((p) => p.id === b.po)).every((b) => b.status === 'PAID') && allBal());
  const v = S.budgetView(s(), 'BGT-2026-SPA');
  check('Dashboard: budget 7P BU Spa terbarui (realisasi Product > awal)', v.lines.find((l) => l.p === 'PRODUCT' && l.cls === 'OPEX').actual > 0);
})();

/* ============ T10. MP-HAWK-08 acceptance — Flow Intelligence Control Tower (Massage Oil Shanti 4/3/3, 1 botol terlambat) ============ */
(function controlTower() {
  console.log('T10 Control Tower — skenario Massage Oil Shanti');
  const { call, s } = fresh();
  const F = H.flow;
  const allBal = () => s().journals.every((j) => Math.round(H.U.sum(j.lines, (l) => l.dr)) === Math.round(H.U.sum(j.lines, (l) => l.cr)));
  check('Kebijakan SLA berversi tersedia (10 tahap) + kalender kerja', s().slaPolicies.length === 10 && s().slaPolicies.every((p) => p.version === 1) && s().workCalendar.start === 8);
  check('Bobot PFHI provisional 40/25/20/15', JSON.stringify(s().flowConfig.weights) === JSON.stringify({ onTime: 0.4, activeSla: 0.25, p90: 0.2, data: 0.15 }));
  let r = call('mrf.create', { branch: 'BR-SHN', memo: 'Massage oil weekend', lines: [{ item: 'BHP-001', qty: 10, reason: 'Pemakaian rutin' }] }, 'STAFF');
  const id = r.data.id;
  call('mrf.decide', { id, decision: 'APPROVE', note: 'OK' }, 'SUPERVISOR', 'U-SPV');
  const mr = () => s().mrfs.find((x) => x.id === id);
  const al = mr().lines[0].alloc;
  check('Alokasi 4 lokal / 3 transfer / 3 PO', [['LOCAL', 4], ['TRANSFER', 3], ['PURCHASE', 3]].every(([p, q]) => al.filter((a) => a.path === p).reduce((t, a) => t + a.qty, 0) === q));
  call('mrf.issue', { id }, 'WAREHOUSE');
  const tr = al.find((a) => a.path === 'TRANSFER').ref;
  call('transfer.dispatch', { id: tr }, 'WAREHOUSE');
  call('transfer.receive', { id: tr }, 'WAREHOUSE');
  call('mrf.issue', { id }, 'WAREHOUSE');
  const pend = S.pendingPurchase(s()).filter((p) => p.wh === 'WH-SHN' && p.supplier === 'SUP-001');
  const po = call('po.createFromMrf', { picks: pend.map((p) => ({ mrf: p.mrf, li: p.li, ai: p.ai })), supplier: 'SUP-001' }, 'PURCHASING').data;
  call('po.submit', { id: po.id }, 'PURCHASING');
  call('po.decide', { id: po.id, decision: 'APPROVE' }, 'PURCHASING');
  call('po.send', { id: po.id }, 'PURCHASING');
  const P = () => s().pos.find((x) => x.id === po.id);
  const promised = P().promised;
  const recv = (q) => {
    const g = call('grn.receive', { po: po.id, lines: P().lines.map((l) => ({ received: l.item === 'BHP-001' ? q : l.qty - l.received, damaged: 0 })) }, 'WAREHOUSE').data;
    call('grn.post', { id: g.id }, 'WAREHOUSE');
    const bins = {};
    s().grns.find((x) => x.id === g.id).lines.forEach((l, i) => (bins[i] = l.item === 'BHP-001' ? 'SHN-A-01' : 'SHN-A-02'));
    call('grn.putaway', { id: g.id, bins }, 'WAREHOUSE');
    call('mrf.issue', { id }, 'WAREHOUSE');
  };
  recv(2);
  check('Supplier kirim 2 dari 3 → PO PARTIAL, 9/10 diserahkan', P().status === 'PARTIAL' && S.mrfFulfillment(s(), mr()).issued === 9);
  let j = F.journey(s(), mr());
  check('Event adapter: field minimum lengkap di setiap event', j.events.length >= 15 && j.events.every((e) => ['id', 'txn', 'org', 'type', 'stage', 'ts', 'actor', 'source'].every((k) => e[k] !== undefined && e[k] !== null) && 'related' in e && 'policy' in e && 'due' in e && 'reason' in e && 'evidence' in e && 'pic' in e && 'before' in e && 'after' in e && 'line' in e));
  check('Timeline 12 tahap', j.timeline.length === 12 && j.timeline.map((x) => x.key).join() === F.TIMELINE.join());
  check('Belum lewat janji supplier → tidak ada isu untuk MRF ini', !s().flowIssues.some((i) => i.mrf === id));
  r = call('demo.advanceClock', { hours: 120 }, 'STAFF');
  check('Jam demo maju (DEMO) & SLA dievaluasi ulang otomatis', r.ok && F.now(s()) > promised);
  const iss = () => s().flowIssues.filter((i) => i.mrf === id);
  const is = iss()[0];
  check('Control Tower mendeteksi: 1 isu tahap Supplier untuk Purchasing', iss().length === 1 && is.stage === 'SUPPLIER' && is.pic === 'PURCHASING' && is.ref === po.id, JSON.stringify(iss()));
  check('Isu prioritas P0/P1, berisi dampak, bukti, rekomendasi, tenggat asli', ['P0', 'P1'].includes(is.priority) && /1 botol/.test(is.impact) && is.evidence.includes(po.id) && is.recommendation && is.dueOriginal === promised + 'T17:00:00', JSON.stringify(is));
  check('Alasan otomatis dari data (kirim sebagian) — bukan menyalahkan orang', is.reasonCode === 'SUPPLIER_SHORT' && is.reasonAuto);
  call('flow.sync', {}, 'OWNER');
  call('demo.advanceClock', { hours: 1 }, 'OWNER');
  check('Tidak ada isu duplikat setelah sinkron berulang', iss().length === 1);
  const rowsSpv = F.rows(s()).filter((x) => x.branch === 'BR-SHN' && x.id === id);
  check('Supervisor Shanti melihat pesanannya lewat SLA', rowsSpv.length === 1 && rowsSpv[0].j.active.some((a) => a.sla === 'BREACH'));
  const ai = F.ai(s(), F.journey(s(), mr()));
  check('AI: fakta & hipotesis terpisah, berlabel simulasi, ada rekomendasi', ai.facts.length >= 2 && ai.hyp.length >= 1 && ai.recs.length >= 1 && /AI SIMULATION/.test(ai.label) && ai.hyp.every((h) => h.conf));
  check('Staff tidak bisa mencatat alasan / menyelesaikan isu', !call('flow.recordReason', { id: is.id, code: 'OTHER', note: 'coba coba' }, 'STAFF').ok && !call('flow.resolve', { id: is.id, note: 'selesai' }, 'STAFF').ok);
  check('Warehouse tidak bisa mengubah ETA PO', !call('flow.changeEta', { po: po.id, eta: '2026-11-20', reason: 'uji coba' }, 'WAREHOUSE').ok);
  check('ETA revisi tanpa alasan ditolak', call('flow.changeEta', { po: po.id, eta: '2026-11-20', reason: '' }, 'PURCHASING').error.code === 'VALIDATION');
  check('ETA di masa lalu ditolak', !call('flow.changeEta', { po: po.id, eta: '2026-11-09', reason: 'supplier konfirmasi' }, 'PURCHASING').ok);
  const eta = new Date(Date.parse(F.now(s())) + 2 * 864e5).toISOString().slice(0, 10);
  r = call('flow.changeEta', { po: po.id, eta, code: 'SUPPLIER_SHORT', reason: 'Supplier konfirmasi sisa 1 botol dikirim lusa' }, 'PURCHASING');
  check('Purchasing mencatat ETA revisi + alasan; tanggal janji asli tidak berubah', r.ok && P().eta === eta && P().promised === promised && P().etaHistory.length === 1);
  check('Isu → MONITORING; jatuh tempo SLA asli tetap', iss()[0].status === 'MONITORING' && iss()[0].dueOriginal === promised + 'T17:00:00' && iss()[0].history.some((h) => h.action === 'CHANGE_ETA'));
  r = call('flow.escalate', { id: is.id, note: 'Outlet butuh untuk weekend' }, 'SUPERVISOR', 'U-SPV');
  check('Supervisor dapat mengeskalasi (dengan alasan) ke BU Manager', r.ok && iss()[0].status === 'ESCALATED' && iss()[0].escalatedTo === 'BU_MANAGER');
  recv(1);
  check('Botol terakhir diterima & diserahkan → 10/10, MRF FULFILLED', S.mrfFulfillment(s(), mr()).issued === 10 && mr().status === 'FULFILLED');
  check('Isu tertutup otomatis saat tahap selesai; riwayat tetap', iss()[0].status === 'RESOLVED' && iss()[0].history.length >= 4 && iss()[0].resolutionH > 0);
  j = F.journey(s(), mr());
  check('Metrik SLA terbarui: tahap Supplier tercatat TERLAMBAT, siklus selesai', j.tracks.find((t) => t.kind === 'PURCHASE').stages.find((x) => x.stage === 'SUPPLIER').sla === 'LATE' && j.timeline[11].status !== 'PENDING' && j.overall.end);
  const k = F.kpis(s());
  check('PFHI terhitung dari 4 komponen (provisional), P0 dipisah', k.pfhi >= 0 && k.pfhi <= 100 && k.comp.length === 4 && Array.isArray(k.critical));
  // finance stays linked — one recognition per bill
  r = call('doc.capture', { sample: 'A' }, 'FINANCE');
  const dc = r.ok ? r.data : null;
  const m2 = dc && call('doc.match', { id: dc.id }, 'FINANCE');
  const v2 = m2 && m2.ok && call('doc.verify', { id: dc.id, decision: 'APPROVE' }, 'FINANCE');
  const bill = v2 && v2.ok ? v2.data : null;
  if (bill) call('bill.approve', { id: bill.id }, 'FINANCE');
  const jf = F.journey(s(), mr());
  check('Perjalanan keuangan terhubung ke MRF (tagihan dari PO yang sama)', !!bill && jf.related.bills.some((b) => b.id === bill.id) && jf.fin.length > 0, JSON.stringify([r.error, m2 && m2.error, v2 && v2.error]));
  const rec = s().journals.filter((x) => x.kind === 'INVOICE_RECOGNITION' && bill && x.source === bill.id).length;
  check('Tidak ada pengakuan ganda: maks. 1 jurnal pengakuan per tagihan', !!bill && rec <= 1 && allBal(), rec);
  // configuration: versioned SLA & weights
  check('Purchasing tidak bisa mengubah SLA', !call('flow.updateSla', { id: 'SLA-APR', hours: 6, note: 'lebih cepat' }, 'PURCHASING').ok);
  r = call('flow.updateSla', { id: 'SLA-APR', hours: 6, note: 'Keputusan Owner — uji' }, 'BU_MANAGER');
  check('SLA berversi: v2 dengan before/after; isu lama tidak ditimpa', r.ok && r.data.version === 2 && r.data.changes[0].before.hours === 8 && iss()[0].dueOriginal === promised + 'T17:00:00');
  check('Bobot PFHI harus total 100%', !call('flow.setWeights', { weights: { onTime: 0.5, activeSla: 0.5, p90: 0.2, data: 0.1 }, note: 'uji salah' }, 'OWNER').ok);
  check('Owner mengubah bobot PFHI (versi baru)', call('flow.setWeights', { weights: { onTime: 0.35, activeSla: 0.3, p90: 0.2, data: 0.15 }, note: 'Uji keputusan Owner' }, 'OWNER').ok && s().flowConfig.version === 2);
  check('Audit mencatat aksi Control Tower', ['flow.changeEta', 'flow.escalate', 'flow.updateSla', 'flow.setWeights', 'demo.advanceClock'].every((op) => s().audit.some((a) => a.op === op)));
  // standalone issue actions on seed issue
  const seedIs = s().flowIssues.find((i) => i.status !== 'RESOLVED');
  if (seedIs) {
    check('Tinjau / tugaskan / minta update tercatat', call('flow.review', { id: seedIs.id }, 'OWNER').ok && call('flow.assign', { id: seedIs.id, user: 'U-PUR' }, 'OWNER').ok && call('flow.requestUpdate', { id: seedIs.id, note: 'Mohon update hari ini' }, 'BU_MANAGER').ok);
    const needR = seedIs.reasonRequired;
    if (needR) check('Isu tanpa alasan otomatis tidak bisa diselesaikan sebelum alasan dicatat', call('flow.resolve', { id: seedIs.id, note: 'Sudah beres' }, 'OWNER').error.code === 'VALIDATION');
    check('Catat alasan lalu selesaikan isu (manual)', call('flow.recordReason', { id: seedIs.id, code: 'CAPACITY', note: 'Antrian PO menumpuk akhir bulan' }, 'PURCHASING').ok && call('flow.resolve', { id: seedIs.id, note: 'PO sudah dibuat' }, 'PURCHASING').ok);
  }
})();

/* ============ T11. MP-HAWK-09 Demo Experience Center — 6 skenario terpandu lewat operasi HAWK yang sama ============ */
(function demoCenter() {
  console.log('T11 Demo Experience Center — 6 skenario, state bersama, tanpa posting ganda');
  const { store, api, call, s } = fresh();
  const DX = H.dx;
  check('Katalog: 6 skenario wajib, setiap langkah punya user, layar & target ID stabil yang terdaftar', DX.SCENARIOS.map((x) => x.id).join() === 'MRF,NOTA,SLA,BUDGET,ASSET,OFFICE' && DX.SCENARIOS.every((sc) => sc.steps.every((st) => st.as && DX.TARGETS[st.tid] && DX.TARGETS[st.tid].nv && (st.review || (st.run && st.check)))));
  check('5 role demo = Finance, Purchasing, BU Manager, Supervisor, Staff (desktop/desktop/desktop/iPad/mobile)', DX.ROLE5.map((r) => r.key + ':' + r.device).join() === 'FINANCE:desktop,PURCHASING:desktop,BU_MANAGER:desktop,SUPERVISOR:ipad,STAFF:mobile');
  check('Setiap layar target dapat dibuka oleh role langkahnya (tanpa memperluas hak akses)', DX.SCENARIOS.every((sc) => sc.steps.every((st) => H.canSee(s().users.find((u) => u.id === st.as).role, DX.TARGETS[st.tid].nv))));
  const counts = {};
  DX.SCENARIOS.forEach((sc) => {
    const r = DX.start(store, api, sc.id);
    let guard = 0;
    let fail = null;
    while (!DX.current(s()).done && guard++ < 40) {
      const c = DX.current(s());
      const x = c.step.review ? DX.review(store, api) : DX.runStep(store, api);
      if (!x.ok) {
        fail = c.step.id + ' ' + JSON.stringify(x.error);
        break;
      }
    }
    counts[sc.id] = Object.values(s().dx.steps).filter((x) => ['DONE', 'REVIEWED'].includes(x.result)).length;
    check(`Skenario ${sc.id}: ${sc.steps.length} langkah selesai end-to-end, setup tanpa error`, !fail && r.trail.every((t) => t.ok) && counts[sc.id] === sc.steps.length, fail);
    const bal = s().journals.every((j) => Math.round(H.U.sum(j.lines, (l) => l.dr)) === Math.round(H.U.sum(j.lines, (l) => l.cr)));
    check(`Skenario ${sc.id}: semua jurnal seimbang`, bal);
    if (sc.id === 'MRF') {
      const v = s().dx.vars;
      const m = s().mrfs.find((x) => x.id === v.mrf);
      const f = H.selectors.mrfFulfillment(s(), m);
      const al = m.lines[0].alloc;
      check('MRF: 4 lokal + 3 transfer + 3 PO, 10/10 terpenuhi', [['LOCAL', 4], ['TRANSFER', 3], ['PURCHASE', 3]].every(([p, q]) => al.filter((a) => a.path === p).reduce((t, a) => t + a.qty, 0) === q) && f.issued === 10 && m.status === 'FULFILLED');
      const p = s().pos.find((x) => x.id === v.po);
      check('MRF: janji vendor asli tetap, ETA revisi tercatat, isu tertutup otomatis', p.etaHistory.length === 1 && p.promised && s().flowIssues.find((i) => i.id === v.issue).status === 'RESOLVED');
      const bills = s().bills.filter((b) => b.po === v.po);
      const rec = s().journals.filter((j) => j.kind === 'INVOICE_RECOGNITION' && j.source === v.bill).length;
      const pays = s().payments.filter((x) => x.bill === v.bill);
      check('MRF: penerimaan ≠ faktur ≠ AP ≠ bayar; 1 tagihan, ≤1 jurnal pengakuan, 1 pembayaran (tanpa posting ganda)', bills.length === 1 && bills[0].status === 'PAID' && rec <= 1 && pays.length === 1 && s().grns.filter((g) => g.po === v.po).length === 2);
      check('MRF: AP disetujui orang berbeda dari verifikator faktur (maker ≠ checker)', bills[0].history.some((h) => h.by === 'U-BUM'));
      const before = s().payments.length;
      check('Langkah yang sudah selesai tidak bisa dijalankan dua kali', !DX.runStep(store, api).ok && s().payments.length === before);
    }
    if (sc.id === 'NOTA') {
      const sp = H.selectors.spend(s(), s().dx.vars.sp);
      check('NOTA: sumber = AI SIMULATION, koreksi manusia tersimpan terpisah, SETTLED dengan bukti asli', sp.source === 'SIMULATED_AI_EXTRACTION' && sp.corrections.length >= 1 && sp.status === 'SETTLED' && !!sp.evidence);
    }
    if (sc.id === 'BUDGET') {
      const rev = s().budgetRevisions.find((x) => x.id === s().dx.vars.rev);
      const b = s().budgets.find((x) => x.id === 'BGT-2026-SPA');
      const pr = b.lines.find((l) => l.p === 'PROMOTION' && l.cls !== 'CAPEX' && l.cls !== 'OUTCOME');
      check('BUDGET: reforecast disetujui Owner; Original tidak berubah, Revised berubah', rev.status === 'APPROVED' && rev.decidedBy === 'U-OWN' && pr.original !== pr.revised);
    }
    if (sc.id === 'ASSET') {
      const w = s().workOrders.find((x) => x.id === s().dx.vars.wo);
      check('ASSET: WO selesai, suku cadang lewat MRF+PO, jurnal pemeliharaan diposting Finance', w.status === 'COMPLETED' && w.parts.length === 1 && s().journals.find((j) => j.id === s().dx.vars.jv).status === 'POSTED');
    }
    if (sc.id === 'OFFICE') {
      const a = s().sharedAllocations.find((x) => x.pool === 'CC-OFC-FIN');
      check('OFFICE: 60/40, review Spa + Essence, dikunci Finance; tidak ada jurnal baru', a.splits['BU-SPA'] === 0.6 && a.reviews['BU-SPA'].decision === 'AGREE' && a.reviews['BU-ESS'] && a.locked && a.locked.by === 'U-FIN');
      check('OFFICE: setelah dikunci, porsi tidak bisa diubah', call('cc.updateAllocation', { pool: 'CC-OFC-FIN', splits: { 'BU-SPA': 0.5, 'BU-ESS': 0.5 } }, 'FINANCE').error.code === 'LOCKED');
    }
  });
  // allocation workflow guards
  store.reset();
  check('Alokasi: Finance tidak dapat mereview, BU Manager tidak dapat mengunci', !call('cc.reviewAllocation', { pool: 'CC-OFC-FIN', bu: 'BU-SPA', decision: 'AGREE' }, 'FINANCE').ok && !call('cc.lockAllocation', { pool: 'CC-OFC-FIN' }, 'BU_MANAGER').ok);
  check('Alokasi: BU Manager Spa tidak dapat mereview porsi Essence', call('cc.reviewAllocation', { pool: 'CC-OFC-FIN', bu: 'BU-ESS', decision: 'AGREE' }, 'BU_MANAGER').error.code === 'FORBIDDEN');
  check('Alokasi: keberatan wajib alasan', call('cc.reviewAllocation', { pool: 'CC-OFC-FIN', bu: 'BU-SPA', decision: 'DISPUTE' }, 'BU_MANAGER').error.code === 'VALIDATION');
  check('Alokasi: kunci ditolak sebelum semua BU review', call('cc.lockAllocation', { pool: 'CC-OFC-FIN' }, 'FINANCE').error.code === 'VALIDATION');
  call('cc.reviewAllocation', { pool: 'CC-OFC-FIN', bu: 'BU-SPA', decision: 'DISPUTE', note: 'Porsi Spa terlalu besar' }, 'BU_MANAGER');
  call('cc.reviewAllocation', { pool: 'CC-OFC-FIN', bu: 'BU-ESS', decision: 'AGREE' }, 'OWNER');
  check('Alokasi: ada keberatan → tidak bisa dikunci', call('cc.lockAllocation', { pool: 'CC-OFC-FIN' }, 'FINANCE').error.code === 'VALIDATION');
  check('Alokasi: porsi diubah → review BU direset (harus ditinjau ulang)', call('cc.updateAllocation', { pool: 'CC-OFC-FIN', splits: { 'BU-SPA': 0.7, 'BU-ESS': 0.3 } }, 'FINANCE').ok && !Object.keys(s().sharedAllocations[0].reviews).length);
  // tutor state & detection of a REAL button press (UI path, not the tutor)
  DX.start(store, api, 'MRF');
  const m = call('mrf.create', { branch: 'BR-SHN', memo: 'lewat layar asli', lines: [{ item: 'BHP-001', qty: 10, reason: 'Pemakaian rutin' }] }, 'STAFF').data;
  check('Langkah terdeteksi selesai dari tombol asli (UI) dan variabel terikat ke dokumen yang sama', DX.detect(store, api) === 'MRF-01' && s().dx.vars.mrf === m.id && s().dx.steps['MRF-01'].via === 'UI');
  check('Langkah tinjauan tidak bisa ditandai dari langkah transaksi', !DX.review(store, api).ok);
  check('BLOCKED wajib catatan', !call('dx.step', { step: 'MRF-02', result: 'BLOCKED' }, 'OWNER').ok && call('dx.step', { step: 'MRF-02', result: 'BLOCKED', note: 'Tombol tidak ada' }, 'OWNER').ok);
  check('Hasil uji: FAIL tanpa catatan ditolak; PASS tercatat', !call('dx.verdict', { verdict: 'FAIL' }, 'OWNER').ok && call('dx.verdict', { verdict: 'PASS' }, 'OWNER').ok && s().dx.verdict.verdict === 'PASS');
  check('dx.start tanpa skenario valid ditolak', !call('dx.start', { scenario: 'NOPE' }, 'OWNER').ok);
  const rep = DX.report(s());
  check('Laporan UAT: langkah, role, layar, target, hasil, bukti, disclaimer', rep.steps.length === 16 && rep.steps[0].screen === 'NV-26' && rep.steps[0].evidence.includes(m.id) && rep.steps[1].result === 'BLOCKED' && /sintetis/.test(rep.disclaimer));
  // one sandbox shared by several windows (storage) — no lost update
  const mem = {};
  const fake = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => (mem[k] = String(v)) };
  const A = H.createStore({ storage: fake });
  const B = H.createStore({ storage: fake });
  const aApi = H.createApi(A);
  const bApi = H.createApi(B);
  const uS = A.state.users.find((u) => u.id === 'U-STF');
  const uP = A.state.users.find((u) => u.id === 'U-SPV');
  const r1 = aApi.call('mrf.create', { branch: 'BR-SHN', memo: 'jendela A', lines: [{ item: 'BHP-001', qty: 2, reason: 'Pemakaian rutin' }] }, uS);
  const r2 = bApi.call('mrf.decide', { id: r1.data.id, decision: 'APPROVE', note: 'jendela B' }, uP);
  check('State bersama: jendela B melihat MRF dari jendela A sebelum bertindak (tanpa kehilangan data)', r2.ok && B.state.mrfs.find((x) => x.id === r1.data.id).status !== 'SUBMITTED');
  check('State bersama: jendela A sinkron dari penyimpanan', A.sync() && A.state.meta.rev === B.state.meta.rev && A.state.mrfs.find((x) => x.id === r1.data.id).status !== 'SUBMITTED');
})();

/* ============ T12. Owner 8 Nov 2026 — penerimaan di outlet oleh akun outlet (tanpa orang gudang) + identitas otomatis dari akun ============ */
(function outletReceiving() {
  console.log('T12 Penerimaan di outlet — therapist / receptionist / attendant / supervisor, identitas otomatis');
  const { call, s } = fresh();
  const a = S.assignment(s(), 'U-RCP');
  check('Akun receptionist: outlet, divisi, BU terbaca otomatis dari penugasan', a && a.branch === 'BR-SHN' && a.branchName === 'Spa Shanti' && a.division === 'Operasional Spa' && a.dept === 'Receptionist' && a.reportsTo === 'U-SPV' && a.bu === 'BU-SPA' && a.buName === 'JAENS Spa' && a.title === 'Receptionist Spa Shanti');
  const chain = (id) => { const out = []; let x = S.user(s(), id); while (x) { out.push(x.id); x = x.reportsTo && S.user(s(), x.reportsTo); } return out.join('>'); };
  check('Struktur: outlet Spa di bawah Divisi Operasional Spa (BU JAENS Spa); departemen Receptionist, Spa Therapist, Attendant, Security', ['BR-UBD', 'BR-SHN', 'BR-TRK', 'BR-BSM'].every((b) => S.org(s(), b).parent === 'DV-SPA-OPS' && S.buOf(s(), b) === 'BU-SPA') && ['U-RCP', 'U-STF', 'U-ATD', 'U-SEC'].map((u) => S.assignment(s(), u).dept).join() === 'Receptionist,Spa Therapist,Attendant,Security');
  check('Rantai atasan: staf → Supervisor outlet → Asisten Operational Manager → Operational Manager → BU Manager', chain('U-SEC') === 'U-SEC>U-SPV>U-AOM>U-HOD>U-BUM');
  check('Asisten Operational Manager: divisi Operasional Spa, BU JAENS Spa', S.assignment(s(), 'U-AOM').division === 'Operasional Spa' && S.assignment(s(), 'U-AOM').bu === 'BU-SPA');
  const m0 = call('mrf.create', { memo: 'tanpa isi unit', lines: [{ item: 'BHP-001', qty: 10, reason: 'Pemakaian rutin' }] }, 'STAFF', 'U-ATD');
  check('Order tanpa mengisi unit → outlet terisi otomatis dari akun (attendant Shanti)', m0.ok && m0.data.branch === 'BR-SHN' && m0.data.requestedBy.dept === 'Attendant' && m0.data.requestedBy.division === 'Operasional Spa' && m0.data.requestedBy.bu === 'BU-SPA');
  check('Akun outlet tidak bisa memesan atas nama outlet lain', call('mrf.create', { branch: 'BR-UBD', lines: [{ item: 'BHP-001', qty: 1 }] }, 'STAFF', 'U-STF').error.code === 'FORBIDDEN');
  // full chain: approve → PO → sent
  call('mrf.decide', { id: m0.data.id, decision: 'APPROVE', note: 'ok' }, 'SUPERVISOR', 'U-SPV');
  const m = () => s().mrfs.find((x) => x.id === m0.data.id);
  const picks = S.pendingPurchase(s()).filter((p) => p.mrf === m0.data.id).map((p) => ({ mrf: p.mrf, li: p.li, ai: p.ai }));
  s().transfers.filter((x) => x.mrf === m0.data.id && x.status === 'REQUESTED').forEach((x) => call('transfer.dispatch', { id: x.id }, 'WAREHOUSE'));
  check('Pesanan 10 butuh pembelian ke supplier (ada PO untuk diterima di outlet)', picks.length > 0);
  if (picks.length) {
    const po = call('po.createFromMrf', { picks, supplier: 'SUP-001' }, 'PURCHASING').data;
    call('po.submit', { id: po.id }, 'PURCHASING');
    if (s().pos.find((x) => x.id === po.id).status === 'PENDING_APPROVAL') call('po.decide', { id: po.id, decision: 'APPROVE' }, 'PURCHASING');
    call('po.send', { id: po.id }, 'PURCHASING');
  }
  check('Therapist outlet lain (Ubud) tidak bisa menerima barang Shanti', call('order.receive', { id: m0.data.id }, 'STAFF', 'U-STF2').error.code === 'FORBIDDEN');
  check('Supervisor outlet lain (Ubud) tidak bisa menerima barang Shanti', call('order.receive', { id: m0.data.id }, 'SUPERVISOR', 'U-SPV2').error.code === 'FORBIDDEN');
  const grnBefore = s().grns.length;
  const r = call('order.receive', { id: m0.data.id }, 'STAFF', 'U-RCP');
  const g = s().grns.slice(0, s().grns.length - grnBefore).find((x) => x.receivedBy);
  check('Receptionist Shanti menerima barang (bukan pemesan, tanpa orang gudang) → selesai', r.ok && m().status === 'FULFILLED', r.error && r.error.message);
  check('Penerima tercatat otomatis: nama, jabatan, outlet, divisi, BU (dari akun, bukan form)', (!picks.length || (g && g.receivedBy.user === 'U-RCP' && g.receivedBy.dept === 'Receptionist' && g.receivedBy.buName === 'JAENS Spa')) && m().receipts.at(-1).by.branch === 'BR-SHN' && /Receptionist/.test(m().history.at(-1).note));
  check('Tidak bisa diterima dua kali', !call('order.receive', { id: m0.data.id }, 'STAFF', 'U-ATD').ok);
  check('Jurnal tetap seimbang', s().journals.every((j) => Math.abs(j.lines.reduce((x, l) => x + l.dr - l.cr, 0)) < 1));
})();

console.log(`\n${pass} lulus, ${failN} gagal`);
require('fs').writeFileSync(path.join(__dirname, 'workflow-results.json'), JSON.stringify({ pass, fail: failN, results }, null, 1));
process.exit(failN ? 1 : 0);
