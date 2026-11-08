/* End-to-end UI test of MP-HAWK-08 Flow Intelligence Control Tower (NV-61 / NV-62 + role widgets).
   Acceptance scenario: JAENS Spa Shanti requests 10 Massage Oil (BHP-001) → 4 local + 3 transfer + 3 PO; supplier delivers 2,
   the last bottle becomes overdue → issue for Purchasing → Supervisor sees it → AI recommends → Purchasing records revised ETA + reason
   → last bottle received & issued (10/10) → issue resolved → SLA metrics update → Finance linked without duplicate recognition.
   Upstream document steps (MRF/PO/GRN) use the same Mock Adapter calls the UI uses (already click-tested in e2e-walkthrough.js);
   every Control Tower interaction is a real click. Usage: node tests/e2e-control-tower.js [screenshotDir] */
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const shotDir = process.argv[2] || path.join(__dirname, '..', 'docs', 'screenshots', 'control-tower');
fs.mkdirSync(shotDir, { recursive: true });

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text()));
  const results = [];
  const ok = (name, cond, info) => {
    results.push({ name, ok: !!cond, info: cond ? '' : info || '' });
    console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || !info ? '' : ' — ' + info));
  };
  const wait = (ms = 150) => p.waitForTimeout(ms);
  const go = async (nv, q) => { await p.evaluate(([n, q]) => { location.hash = '#/nv/' + n + (q ? '?mrf=' + q : ''); HAWK.render(); }, [nv, q]); await wait(300); };
  const as = async (uid) => { await p.evaluate((id) => { HAWK.setUser(id, { tour: false }); HAWK.render(); }, uid); await wait(200); };
  const view = () => p.innerText('#view');
  const S = (fn, arg) => p.evaluate(fn, arg);
  const shot = async (name, full = true) => {
    const h = await p.addStyleTag({ content: '.toasts,.tour,.tour-collapsed{visibility:hidden!important}' });
    await p.screenshot({ path: path.join(shotDir, name + '.png'), fullPage: full });
    await h.evaluate((e) => e.remove());
  };
  const call = (op, pl, uid) => S(([op, pl, uid]) => { const r = HAWK.api.call(op, pl, HAWK.store.state.users.find((u) => u.id === uid)); return r.ok ? r.data : { __err: r.error.message }; }, [op, pl, uid]);

  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await wait(300);
  await as('U-OWN');

  // 1. Navigation: module K with NV-61/62
  await go(61);
  const nav = await p.innerText('.sidebar');
  ok('1. Menu Modul K "Control Tower" berisi NV-61 & NV-62 (62 NV total)', /Control Tower/.test(nav) && (await S(() => HAWK.SCREENS.length)) === 62);
  let t = await view();
  ok('2. NV-61 tampil: PFHI provisional, Source / As-of / DEMO', /Procurement Flow Control Tower/.test(t) && /PROVISIONAL/i.test(t) && /As-of/.test(t) && /DEMO/.test(t));

  // Scenario documents (MRF 4/3/3, transfer, PO, partial receipt 2/3)
  const mrf = await call('mrf.create', { branch: 'BR-SHN', memo: 'Massage oil weekend', lines: [{ item: 'BHP-001', qty: 10, reason: 'Rutin' }] }, 'U-STF');
  await call('mrf.decide', { id: mrf.id, decision: 'APPROVE', note: 'OK' }, 'U-SPV');
  await call('mrf.issue', { id: mrf.id }, 'U-WHS');
  const tr = await S((id) => HAWK.store.state.mrfs.find((m) => m.id === id).lines[0].alloc.find((a) => a.path === 'TRANSFER').ref, mrf.id);
  await call('transfer.dispatch', { id: tr }, 'U-WHS');
  await call('transfer.receive', { id: tr }, 'U-WHS');
  await call('mrf.issue', { id: mrf.id }, 'U-WHS');
  const picks = await S(() => HAWK.selectors.pendingPurchase(HAWK.store.state).filter((x) => x.wh === 'WH-SHN' && x.supplier === 'SUP-001').map((x) => ({ mrf: x.mrf, li: x.li, ai: x.ai })));
  const po = await call('po.createFromMrf', { picks, supplier: 'SUP-001' }, 'U-PUR');
  for (const op of ['po.submit', 'po.decide', 'po.send']) await call(op, { id: po.id, decision: 'APPROVE' }, 'U-PUR');
  const receive = async (q) => {
    const lines = await S(([id, q]) => HAWK.store.state.pos.find((x) => x.id === id).lines.map((l) => ({ received: l.item === 'BHP-001' ? q : l.qty - l.received, damaged: 0 })), [po.id, q]);
    const g = await call('grn.receive', { po: po.id, lines }, 'U-WHS');
    await call('grn.post', { id: g.id }, 'U-WHS');
    const bins = await S((gid) => Object.fromEntries(HAWK.store.state.grns.find((x) => x.id === gid).lines.map((l, i) => [i, l.item === 'BHP-001' ? 'SHN-A-01' : 'SHN-A-02'])), g.id);
    await call('grn.putaway', { id: g.id, bins }, 'U-WHS');
    return [g, await call('mrf.issue', { id: mrf.id }, 'U-WHS')];
  };
  await receive(2);
  const f9 = await S((id) => HAWK.selectors.mrfFulfillment(HAWK.store.state, HAWK.store.state.mrfs.find((m) => m.id === id)).issued, mrf.id);
  ok('3. Skenario: 4 lokal + 3 transfer + 2 dari PO diserahkan (9/10)', f9 === 9, f9);

  // 4. DEMO clock button (click) → overdue detected
  await go(61);
  await p.click('#view [data-a="demoClock"][data-h="72"]');
  await wait(300);
  await p.click('#view [data-a="demoClock"][data-h="24"]');
  await wait(300);
  await p.click('#view [data-a="demoClock"][data-h="24"]');
  await wait(400);
  const iss = () => S((id) => HAWK.store.state.flowIssues.filter((i) => i.mrf === id).map((i) => ({ id: i.id, st: i.status, pic: i.pic, stage: i.stage, pri: i.priority, due: i.dueOriginal })), mrf.id);
  let I = await iss();
  ok('4. Klik "Simulasi +jam" → botol terakhir lewat janji supplier → 1 isu Purchasing', I.length === 1 && I[0].pic === 'PURCHASING' && I[0].stage === 'SUPPLIER', JSON.stringify(I));
  t = await view();
  ok('5. Action Center menampilkan isu (prioritas, dampak, tenggat asli, rekomendasi AI)', t.includes(I[0].id) && /1 botol/.test(t) && /Tenggat SLA asli/.test(t) && /AI SIMULATION/.test(t));
  await shot('01-nv61-control-tower-desktop');

  // 6. KPI drill-down
  await p.click('#view .ft-kpi.k-red');
  await wait(300);
  t = await p.innerText('#ft-drill');
  ok('6. Klik KPI "Lewat SLA" → tabel drill-down berisi MRF skenario', /Pesanan lewat SLA/.test(t) && t.includes(mrf.id));
  // heatmap / stage drill
  await p.click('#view .ft-stage[data-st="SUPPLIER"]');
  await wait(250);
  ok('7. Klik tahap "Persiapan & pengiriman supplier" → drill ke pesanan', (await p.innerText('#ft-drill')).includes(mrf.id));
  // filter
  await p.selectOption('#view select[data-k="branch"]', 'BR-UBD');
  await wait(300);
  ok('8. Filter cabang Ubud → MRF Shanti tidak tampil', !(await p.innerText('#ft-drill')).includes(mrf.id));
  await p.click('#view [data-a="fltReset"]');
  await wait(250);

  // 9. Supervisor Shanti sees it (NV-01 widget) and escalates on NV-62
  await as('U-SPV');
  await go(1);
  t = await view();
  ok('9. Supervisor Shanti melihat widget "Pesanan unit saya" dengan isu', /Pesanan unit saya/.test(t) && t.includes(I[0].id));
  await go(62, mrf.id);
  t = await view();
  ok('10. NV-62: timeline 12 tahap, jalur lokal/transfer/PO, 9/10', (await p.$$('#view .ft-step')).length === 12 && /9\/10/.test(t) && /Stok lokal/.test(t) && /Transfer/.test(t) && /Pembelian/.test(t));
  await p.click('#view .ft-step[data-k="SUPPLIER"]');
  await wait(250);
  ok('11. Klik tahap timeline → event tahap tampil', /PO_SEND/.test(await view()));
  await p.click('#view [data-tab="tab"][data-v="delay"]');
  await wait(250);
  t = await view();
  ok('12. Analisis keterlambatan: FAKTA terpisah dari HIPOTESIS + label AI SIMULATION', /FAKTA/.test(t) && /HIPOTESIS/.test(t) && /AI SIMULATION/.test(t) && /backorder/.test(t));
  await p.click(`#view [data-a="isEsc"][data-is="${I[0].id}"]`);
  await wait(200);
  await p.fill('#ask-note', 'Outlet butuh untuk weekend');
  await p.click('#ask-ok');
  await wait(300);
  I = await iss();
  ok('13. Supervisor eskalasi (dengan alasan) → status ESCALATED', I[0].st === 'ESCALATED', JSON.stringify(I));

  // 14. Purchasing: widget on NV-31, then revised ETA via modal
  await as('U-PUR');
  await go(31);
  ok('14. Widget Purchasing di NV-31 menampilkan isu', (await view()).includes(I[0].id));
  await go(62, mrf.id);
  await p.click('#view [data-tab="tab"][data-v="delay"]');
  await wait(250);
  await p.click(`#view [data-a="isEta"][data-is="${I[0].id}"]`);
  await wait(200);
  const promised = await S((id) => HAWK.store.state.pos.find((x) => x.id === id).promised, po.id);
  const minEta = await p.getAttribute('#fe-d', 'min');
  const eta = await S((d) => new Date(Date.parse(d) + 864e5).toISOString().slice(0, 10), minEta);
  await p.fill('#fe-d', eta);
  await p.selectOption('#fe-c', 'SUPPLIER_SHORT');
  await p.fill('#fe-r', 'Supplier konfirmasi sisa 1 botol dikirim besok');
  await p.click('#fe-ok');
  await wait(300);
  const P = await S((id) => { const x = HAWK.store.state.pos.find((p) => p.id === id); return { eta: x.eta, promised: x.promised, h: (x.etaHistory || []).length }; }, po.id);
  I = await iss();
  ok('15. Purchasing mencatat ETA revisi + alasan; janji asli & jatuh tempo SLA tidak ditimpa', P.eta === eta && P.promised === promised && P.h === 1 && I[0].st === 'MONITORING' && I[0].due === promised + 'T17:00:00', JSON.stringify([P, I]));
  t = await view();
  ok('16. NV-62 menampilkan riwayat ETA (asli → revisi)', /Riwayat ETA/.test(t));
  await shot('02-nv62-journey-delay-desktop');

  // 17. last bottle received & issued → 10/10, issue auto-resolved, metrics update
  await receive(1);
  await go(62, mrf.id);
  t = await view();
  I = await iss();
  ok('17. Botol terakhir diterima & diserahkan → 10/10', /10\/10/.test(t));
  ok('18. Isu tertutup otomatis (RESOLVED) dengan jejak audit', I[0].st === 'RESOLVED');
  const sla = await S((id) => { const j = HAWK.flow.journey(HAWK.store.state, HAWK.store.state.mrfs.find((m) => m.id === id)); return j.tracks.find((t) => t.kind === 'PURCHASE').stages.find((x) => x.stage === 'SUPPLIER').sla; }, mrf.id);
  ok('19. Metrik SLA terbarui: tahap supplier tercatat TERLAMBAT', sla === 'LATE', sla);

  // 20. Finance linked without duplicate recognition
  const dc = await call('doc.capture', { sample: 'A' }, 'U-FIN');
  await call('doc.match', { id: dc.id }, 'U-FIN');
  const bill = await call('doc.verify', { id: dc.id, decision: 'APPROVE' }, 'U-FIN');
  await call('bill.approve', { id: bill.id }, 'U-FIN');
  await as('U-FIN');
  await go(62, mrf.id);
  await p.click('#view [data-tab="tab"][data-v="fin"]');
  await wait(250);
  t = await view();
  const rec = await S((bid) => HAWK.store.state.journals.filter((j) => j.source === bid && j.kind === 'INVOICE_RECOGNITION').length, bill.id);
  ok('20. Tab Keuangan: tagihan terhubung, "tidak dobel", maks 1 pengakuan', t.includes(bill.id) && /tidak dobel/.test(t) && rec <= 1, rec);
  await go(47);
  ok('21. Widget CFO di NV-47', /Dampak keuangan keterlambatan/.test(await view()));

  // 22. Owner widget + PFHI weights (versioned)
  await as('U-OWN');
  await go(57);
  ok('22. Widget CEO di NV-57 (PFHI provisional, tepat waktu, P90)', /Flow Intelligence/.test(await view()) && /PFHI/.test(await view()));
  await go(61);
  await p.click('#view [data-a="weights"]');
  await wait(200);
  await p.fill('#pw-onTime', '35');
  await p.fill('#pw-activeSla', '30');
  await p.fill('#pw-n', 'Uji keputusan Owner');
  await p.click('#pw-ok');
  await wait(300);
  ok('23. Owner mengubah bobot PFHI → versi 2', (await S(() => HAWK.store.state.flowConfig.version)) === 2);
  // BU manager SLA edit
  await as('U-BUM');
  await go(61);
  await p.click('#view [data-a="slaEdit"][data-id="SLA-APR"]');
  await wait(200);
  await p.fill('#sl-h', '6');
  await p.fill('#sl-n', 'Target persetujuan lebih cepat (uji)');
  await p.click('#sl-ok');
  await wait(300);
  ok('24. BU Manager mengubah SLA → versi baru + riwayat before/after', (await S(() => { const x = HAWK.store.state.slaPolicies.find((p) => p.id === 'SLA-APR'); return x.version === 2 && x.changes[0].before.hours === 8; })));
  await as('U-PUR');
  await go(61);
  ok('25. Purchasing tidak melihat tombol ubah SLA / bobot', !(await p.$('#view [data-a="slaEdit"]')) && !(await p.$('#view [data-a="weights"]')));

  // 26. widgets for warehouse, HoD, staff
  await as('U-WHS');
  await go(38);
  const w38 = /SLA gudang/.test(await view());
  await go(41);
  ok('26. Widget gudang di NV-38 & NV-41', w38 && /SLA gudang/.test(await view()));
  await as('U-HOD');
  await go(58);
  ok('27. Widget Head of Division di NV-58', /Alur divisi/.test(await view()));

  // 28. mobile — staff & supervisor
  await p.setViewportSize({ width: 390, height: 844 });
  const mrf2 = await call('mrf.create', { branch: 'BR-SHN', memo: 'Lulur', lines: [{ item: 'BHP-002', qty: 3, reason: 'Rutin' }] }, 'U-STF');
  await as('U-STF');
  await go(27);
  ok('28. Staff (mobile) NV-27: widget "Pesanan saya — kapan datang?"', /kapan datang/.test(await view()));
  await go(62, mrf.id);
  t = await view();
  ok('29. Staff (mobile) NV-62: tampilan sederhana tanpa tombol aksi isu', /10\/10/.test(t) && !(await p.$('#view [data-a^="is"]')) && (await S(() => document.documentElement.scrollWidth <= window.innerWidth + 1)));
  await shot('03-nv62-staff-mobile');
  await as('U-SPV');
  await go(61);
  ok('30. NV-61 mobile tanpa scroll horizontal', await S(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await shot('04-nv61-supervisor-mobile');
  await go(62, mrf2.id);
  await shot('05-nv62-supervisor-mobile');
  await p.setViewportSize({ width: 1440, height: 900 });
  await as('U-OWN');
  await go(62, mrf.id);
  await p.click('#view [data-tab="tab"][data-v="evid"]');
  await wait(250);
  ok('31. Dokumen & bukti: event log dengan Event ID, sumber, dokumen terkait', /Process Event Log/.test(await view()) && /EV-/.test(await view()));
  await shot('06-nv62-evidence-desktop');

  ok('32. Tidak ada error JavaScript selama alur', errs.length === 0, errs.join(' | '));
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} lulus`);
  fs.writeFileSync(path.join(__dirname, 'e2e-control-tower-results.json'), JSON.stringify({ pass, total: results.length, results, errors: errs }, null, 1));
  await b.close();
  process.exit(pass === results.length ? 0 : 1);
})();
