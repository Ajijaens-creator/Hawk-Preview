/* End-to-end UI test of the Owner walkthrough (MP-HAWK-02 §14 / MP-HAWK-03 flow), driven by real clicks in Chromium.
   Every write goes through the visible buttons; role changes use the demo role switcher in the top bar.
   Usage: node tests/e2e-walkthrough.js [screenshotDir]
   Pass: all 14 walkthrough steps report done, quantities/accounting match, no page errors. */
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const shotDir = process.argv[2] || path.join(__dirname, 'screenshots');
fs.mkdirSync(shotDir, { recursive: true });

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text()));
  const results = [];
  const ok = (name, cond, info) => {
    results.push({ name, ok: !!cond, info: cond ? '' : info || '' });
    console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || !info ? '' : ' — ' + info));
  };
  const wait = (ms = 150) => p.waitForTimeout(ms);
  const go = async (nv, q) => { await p.evaluate(([n, qq]) => (location.hash = '#/nv/' + n + (qq ? '?' + Object.entries(qq).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&') : '')), [nv, q]); await wait(200); };
  const as = async (uid) => { await p.click('#btn-role'); await wait(100); await p.click(`#pop [data-user="${uid}"]`); await wait(200); };
  const st = (fn, arg) => p.evaluate(fn, arg);
  const lastToast = () => p.evaluate(() => { const t = [...document.querySelectorAll('.toast')].pop(); return t ? t.innerText.replace(/\n/g, ' ') : ''; });
  // click a data-a button inside the first row/card containing `text`
  const clickIn = async (sel, text) => {
    const h = await p.evaluateHandle(([s, t]) => [...document.querySelectorAll('#view ' + s)].find((e) => !t || (e.closest('tr,.card,.row,.itemcard') || e).innerText.includes(t)), [sel, text]);
    const el = h.asElement();
    if (!el) throw new Error(`Tidak menemukan ${sel} untuk "${text}"`);
    await el.click();
    await wait(180);
  };
  const tourDone = () => p.evaluate(() => HAWK.TOUR.map((t) => !!t.done(HAWK.store.state)));

  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.reload();
  await wait(400);

  try {
    // 1–2 Staff creates MRF at Spa Ubud: Minyak Pijat Lavender 1L × 10
    await as('U-STF');
    await go(24);
    ok('1 Staff melihat menu sederhana (≤5 modul: Beranda, MRF, cek stok, Smart Spend, lapor kerusakan)', (await p.$$eval('#nav .nav-mod', (m) => m.length)) <= 5, String(await p.$$eval('#nav .nav-mod', (m) => m.length)));
    await go(26);
    await p.selectOption('#f-purpose', 'Operasional harian');
    await clickIn('[data-a="next0"]');
    await p.selectOption('#add-item', 'BHP-001');
    await p.fill('#add-qty', '10');
    await clickIn('[data-a="addLine"]');
    await clickIn('[data-a="next1"]');
    await clickIn('[data-a="submit"]:not([data-draft])');
    const mrf = await st(() => HAWK.store.state.mrfs.find((m) => m.requester === 'U-STF' && m.lines.some((l) => l.item === 'BHP-001' && l.qty === 10) && m.status === 'SUBMITTED'));
    ok('2 MRF terkirim ke Supervisor', mrf && mrf.branch === 'BR-UBD' && mrf.chain[0] === 'SUPERVISOR', await lastToast());
    await p.screenshot({ path: path.join(shotDir, '02-mrf-terkirim.png') });

    // 3–4 Supervisor reviews budget impact then approves
    await as('U-SPV');
    await go(30, { id: mrf.id });
    const bi = await p.$eval('#view', (v) => v.innerText);
    ok('3 Dampak budget item tampil (budget 40, 90%)', /40/.test(bi) && /90\s?%/.test(bi), bi.slice(0, 200));
    await go(29);
    await clickIn('[data-a="sel"]', mrf.id);
    await clickIn(`[data-a="decide"][data-d="APPROVE"][data-m="${mrf.id}"]`);
    const m2 = await st(() => HAWK.store.state.mrfs.find((m) => m.requester === 'U-STF' && m.lines.some((l) => l.qty === 10 && l.item === 'BHP-001')));
    const alloc = m2.lines[0].alloc.reduce((a, x) => ((a[x.path] = (a[x.path] || 0) + x.qty), a), {});
    ok('4 Disetujui → split 4 lokal / 3 transfer / 3 beli', m2.status === 'IN_FULFILLMENT' && alloc.LOCAL === 4 && alloc.TRANSFER === 3 && alloc.PURCHASE === 3, JSON.stringify(alloc) + ' ' + m2.status);

    // 5 Warehouse: issue local, dispatch + receive transfer
    await as('U-WHS');
    await go(28, { id: mrf.id });
    await p.screenshot({ path: path.join(shotDir, '05-fulfillment.png') });
    await clickIn('[data-a="dispatch"]');
    await clickIn('[data-a="receiveTr"]');
    await clickIn('[data-a="issue"]');
    const f5 = await st(() => { const s = HAWK.store.state; const m = HAWK.TOUR && s.mrfs.find((x) => x.requester === 'U-STF' && x.lines.some((l) => l.qty === 10 && l.item === 'BHP-001')); return HAWK.selectors.mrfFulfillment(s, m); });
    ok('5 Lokal 4 + transfer 3 diserahkan', f5.LOCAL.issued === 4 && f5.TRANSFER.issued === 3, JSON.stringify(f5));

    // 6 Purchasing: consolidate → PO → submit → approve → send
    await as('U-PUR');
    await go(32);
    await p.evaluate((id) => { const cb = [...document.querySelectorAll('#view input[data-ch="tog"]')].find((c) => c.closest('tr').innerText.includes(id)); cb.click(); }, mrf.id);
    await wait(200);
    await clickIn('[data-a="create"]');
    await wait(150);
    if ((await p.$eval('#view', (v) => v.dataset.nv)) !== '35') await go(35);
    await clickIn('[data-a="submit"]');
    let po = await st(() => { const s = HAWK.store.state; const m = s.mrfs.find((x) => x.requester === 'U-STF' && x.lines.some((l) => l.qty === 10 && l.item === 'BHP-001')); const a = m.lines[0].alloc.find((x) => x.path === 'PURCHASE'); return s.pos.find((x) => x.id === a.ref); });
    ok('6a Draft PO dibuat dari MRF & diajukan', po && ['PENDING_APPROVAL', 'APPROVED'].includes(po.status), po && po.status);
    await go(36, { id: po.id });
    if (po.status === 'PENDING_APPROVAL') { await clickIn(`[data-a="approve"][data-p="${po.id}"]`); }
    await clickIn(`[data-a="send"][data-p="${po.id}"]`);
    po = await st((id) => HAWK.store.state.pos.find((x) => x.id === id), po.id);
    if (po.status !== 'SENT') console.log('   debug PO', po.id, po.status, JSON.stringify(po.approvals), await lastToast());
    ok('6b PO disetujui & dikirim; PO = komitmen, tanpa jurnal', po && po.status === 'SENT' && !(await st(() => HAWK.store.state.journals.some((j) => j.source === 'PO'))), po && po.status);
    ok('6c PO bukan expense/invoice', await st((id) => !HAWK.store.state.bills.some((b) => b.po === id), po.id));

    // 7 Receiving checklist + post
    await as('U-WHS');
    await go(42, { po: po.id });
    if (await p.$('#rc-po')) { await p.selectOption('#rc-po', po.id).catch(() => {}); await wait(150); }
    await clickIn('[data-a="scan"]');
    await clickIn('[data-a="receive"]');
    await clickIn('[data-a="post"]');
    const grn = await st((id) => HAWK.store.state.grns.find((g) => g.po === id), po.id);
    ok('7 GRN fisik → diposting (Dr Persediaan / Cr GRNI)', grn && grn.status !== 'RECEIVED' && (await st((j) => { const x = HAWK.store.state.journals.find((y) => y.id === j); return x && x.lines.some((l) => /1\d{3}/.test(l.acc) && l.dr > 0) && x.lines.some((l) => /2120/.test(l.acc) && l.cr > 0); }, grn.journal)), grn && grn.status);

    // 8 Put-away by scanning bin
    if ((await p.$eval('#view', (v) => v.dataset.nv)) !== '43') await go(43);
    await clickIn(`[data-a="sel"][data-p="${grn.id}"]`).catch(() => {});
    await clickIn('[data-a="scan"]');
    await clickIn(`[data-a="confirm"][data-p="${grn.id}"]`);
    ok('8 Put-away bin terkonfirmasi', await st((id) => HAWK.store.state.grns.find((g) => g.id === id).status === 'STORED', grn.id));

    // 9 Issue purchased 3 units → MRF fulfilled 10/10
    await go(45);
    await clickIn(`[data-a="issue"][data-p="${mrf.id}"]`);
    const m9 = await st((id) => HAWK.store.state.mrfs.find((m) => m.id === id), mrf.id);
    ok('9 MRF terpenuhi 10/10', m9.status === 'FULFILLED', m9.status);

    // 10 Finance AI invoice capture (sample A)
    await as('U-FIN');
    await go(48);
    await clickIn('[data-a="cap"][data-k="A"]');
    const doc = await st((id) => HAWK.store.state.docs.find((d) => d.fields.poText === id), po.id);
    ok('10 Ekstraksi faktur AI (draft, manusia verifikasi)', doc && doc.status !== 'APPROVED', doc && doc.status);
    await clickIn('[data-a="match"]');

    // 11 3-way match → verify → BU Manager approves (SoD)
    if ((await p.$eval('#view', (v) => v.dataset.nv)) !== '49') await go(49, { id: doc.id });
    await clickIn(`[data-a="run"][data-p="${doc.id}"]`);
    if (await p.$('#vf-note')) await p.fill('#vf-note', 'Cocok dengan PO & GRN');
    await clickIn(`[data-a="ver"][data-p="${doc.id}"]`);
    const bill = await st((id) => HAWK.store.state.bills.find((b) => b.po === id), po.id);
    ok('11a AP draft dibuat setelah verifikasi manusia', bill && bill.status !== 'APPROVED', bill && bill.status);
    await go(50, { id: bill.id });
    await clickIn(`[data-a="sel"][data-p="${bill.id}"]`).catch(() => {});
    const sod = await p.$(`[data-a="appr"][data-p="${bill.id}"]`);
    if (sod) { await sod.click(); await wait(180); }
    const stillPending = await st((id) => HAWK.store.state.bills.find((b) => b.id === id).status !== 'APPROVED', bill.id);
    ok('11b Finance yang memverifikasi tidak dapat menyetujui sendiri (SoD)', stillPending);
    await as('U-BUM');
    await go(50, { id: bill.id });
    await clickIn(`[data-a="sel"][data-p="${bill.id}"]`).catch(() => {});
    await clickIn(`[data-a="appr"][data-p="${bill.id}"]`);
    const b11 = await st((id) => HAWK.store.state.bills.find((b) => b.id === id), bill.id);
    ok('11c BU Manager menyetujui tagihan → Dr GRNI + PPN / Cr Utang', b11.status === 'APPROVED' && (await st((jid) => { const j = HAWK.store.state.journals.find((x) => x.id === jid); return !!j && j.lines.some((l) => /2120/.test(l.acc) && l.dr > 0) && j.lines.some((l) => /^21/.test(l.acc) && !/2120/.test(l.acc) && l.cr > 0); }, b11.journal)), b11.status);

    // 12 Finance traces back to MRF from AP
    await as('U-FIN');
    await go(50, { id: bill.id });
    await clickIn(`[data-a="sel"][data-p="${bill.id}"]`).catch(() => {});
    await p.evaluate((id) => { const e = [...document.querySelectorAll('[data-id]')].find((x) => x.dataset.id === id); e.click(); }, mrf.id);
    await wait(200);
    ok('12 Jejak AP → MRF asal terbuka', /MRF|Pemohon/.test(await p.$eval('#drawer', (d) => d.innerText).catch(() => '')));
    await p.screenshot({ path: path.join(shotDir, '12-jejak-ap-mrf.png') });
    await p.keyboard.press('Escape');

    // 13 Owner budget 7P BvA
    await as('U-OWN');
    await go(23);
    const bva = await p.$eval('#view', (v) => v.innerText);
    ok('13 Budget vs Actual vs Commitment vs Forecast (Owner)', /Commit|Komitmen/i.test(bva) && /Forecast/i.test(bva));
    await p.screenshot({ path: path.join(shotDir, '13-budget-bva.png') });

    // 14 AI insight with evidence chain
    await go(57);
    await clickIn('.ai-card [data-ins-open]');
    ok('14 AI insight: Temuan → Bukti → Dampak → Rekomendasi → Peran → Keputusan manusia', (await p.$$eval('.ichain > li', (l) => l.length)) === 6);
    await p.screenshot({ path: path.join(shotDir, '14-ai-insight.png') });
    await p.keyboard.press('Escape');

    const done = await tourDone();
    ok('Walkthrough: 14/14 langkah selesai', done.every(Boolean), done.map((d, i) => (d ? '' : i + 1)).filter(Boolean).join(','));
    // no double counting: change in on-hand since seed = sum of ledger movements recorded during this session
    const cons = await st(() => { const s = HAWK.store.state; const S = HAWK.selectors; const s0 = HAWK.seed(); const ids0 = new Set(s0.ledger.map((l) => l.id)); const d = (S.stock(s, 'WH-UBD', 'BHP-001').onHand) - (S.stock(s0, 'WH-UBD', 'BHP-001').onHand); const led = s.ledger.filter((l) => !ids0.has(l.id) && l.wh === 'WH-UBD' && l.item === 'BHP-001').reduce((a, l) => a + l.qty, 0); return { delta: d, led }; });
    ok('Perubahan stok = jumlah mutasi ledger (tanpa double counting)', cons.delta === cons.led, JSON.stringify(cons));
  } catch (e) {
    ok('Eksekusi tanpa exception', false, e.message);
    await p.screenshot({ path: path.join(shotDir, 'fail.png') });
  }
  ok('Tidak ada error runtime di browser', !errs.length, errs.join(' | '));
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass} lulus, ${results.length - pass} gagal`);
  fs.writeFileSync(path.join(__dirname, 'e2e-results.json'), JSON.stringify({ pass, fail: results.length - pass, results }, null, 1));
  await b.close();
  process.exit(results.length - pass ? 1 : 0);
})();
