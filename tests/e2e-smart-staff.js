/* End-to-end UI test of MP-HAWK-14 — Smart Staff Mobile (#/m/NN, MS-01…MS-12) and the "Pandu Saya" tutor.
   All five tutor scenarios are driven by real clicks: Tunjukkan → do the action on the highlighted control → Lanjut.
   Then: Reset Demo Data, role/price visibility, no horizontal overflow, mobile 390 px + tablet 834 px screenshots.
   Usage: node tests/e2e-smart-staff.js [screenshotDir] */
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const shotDir = process.argv[2] || path.join(__dirname, '..', 'docs', 'screenshots', 'smart-staff');
fs.mkdirSync(shotDir, { recursive: true });
const URL = 'file://' + path.join(__dirname, '..', 'index.html');

(async () => {
  const b = await chromium.launch();
  const results = [];
  const ok = (name, cond, info) => {
    results.push({ name, ok: !!cond, info: cond ? '' : info || '' });
    console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || !info ? '' : ' — ' + info));
  };
  const errs = [];
  const ctxB = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctxB.newPage();
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text()));
  const wait = (ms = 180) => p.waitForTimeout(ms);
  const E = (fn, arg) => p.evaluate(fn, arg);
  const click = async (sel) => { await p.locator(sel).first().scrollIntoViewIfNeeded(); await p.locator(sel).first().click(); await wait(); };
  const ms = () => E(() => (location.hash.match(/^#\/m\/(\d\d)/) || [])[1] || '');
  const uid = () => E(() => HAWK.store.state.session ? '' : document.querySelector('.ms-accts .on') && document.querySelector('.ms-accts .on').dataset.u);
  const shot = async (name) => {
    const h = await p.addStyleTag({ content: '.toasts{visibility:hidden!important}' });
    await p.screenshot({ path: path.join(shotDir, name + '.png') });
    await h.evaluate((e) => e.remove());
  };
  const over = () => E(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

  await p.goto(URL);
  await wait(500);
  await E(() => { HAWK.setUser('U-STF', { tour: false }); location.hash = '#/m'; HAWK.render(); });
  await wait(300);
  ok('Rute #/m terbuka sebagai MS-01 untuk staf (Indah)', (await E(() => document.querySelector('.ms-shell').dataset.ms)) === '01' && (await p.locator('.ms-hello h2').innerText()).includes('Indah'));
  ok('Menu sidebar "Smart Staff Mobile" ada', (await p.locator('#nav a[href="#/m"]').count()) === 1);

  /* ---------- tutor driver ---------- */
  const guideOpen = async () => { if (await p.locator('.ms-guide-mini').count()) await click('.ms-guide-mini'); };
  const startScenario = async (id) => {
    await E(() => { HAWK.dxClear && HAWK.dxClear(); });
    if (!(await p.locator('.ms-guide.list').count())) {
      if (await p.locator('.ms-guide [data-k="quit"]').count()) await click('.ms-guide [data-k="quit"]');
      await click('[data-ms-t="guide"]');
    }
    await click(`[data-ms-sc="${id}"]`);
  };
  const runStep = async (label, action, opts = {}) => {
    await guideOpen();
    const step = await p.locator('.ms-guide').getAttribute('data-ms-step');
    await click('[data-ms-t="guide-show"]'); // Tunjukkan: switches account, navigates, highlights, collapses guide
    const hl = await p.locator('.dx-hl').count();
    if (!opts.noHighlight) ok(`${step} Tunjukkan menyorot kontrol — ${label}`, hl === 1, 'highlight ' + hl);
    await action();
    await guideOpen();
    const okNow = await p.locator('.ms-guide .ms-ok').count();
    ok(`${step} ${label}`, okNow === 1, 'step check did not pass; ms=' + (await ms()) + ' err=' + (await E(() => (document.getElementById('ms-err') || {}).textContent || '')));
    await click('[data-ms-t="guide-next"]');
  };

  /* ---------- R1 routine oil + towel request ---------- */
  console.log('R1 Minta minyak pijat & handuk');
  await startScenario('R1');
  await runStep('Indah buka katalog', () => click('[data-ms-t="hero-request"]'));
  await shot('ms02-catalog-mobile');
  await runStep('tambah 2 Minyak Pijat', async () => { await click('[data-ms-add="BHP-001"]'); await click('[data-ms-add="BHP-001"]'); });
  ok('Staf tidak melihat harga di katalog', !(await p.locator('.ms-list').innerText()).includes('Rp'));
  ok('Stok dan Jatah tampil terpisah', (await p.locator('[data-ms-item="BHP-001"]').innerText()).match(/Stok terbatas|Tersedia|Kosong/) && (await p.locator('[data-ms-item="BHP-001"]').innerText()).includes('Jatah'));
  await runStep('tambah 4 Handuk', async () => { for (let i = 0; i < 4; i++) await click('[data-ms-add="BHP-003"]'); });
  await shot('ms02-catalog-basket-mobile');
  // MS-03 quick detail sheet (outside tutor)
  await click('[data-a="mssel"][data-it="BHP-001"]');
  ok('MS-03 bottom sheet terbuka', (await p.locator('.ms-sheet').count()) === 1);
  await shot('ms03-quick-detail-mobile');
  await click('.ms-sheet [data-a="msclose"]');
  await runStep('ke keranjang', () => click('[data-ms-t="to-basket"]'));
  await shot('ms04-basket-mobile');
  await runStep('lanjut ke ringkasan', () => click('[data-ms-t="to-confirm"]'));
  ok('MS-05 menampilkan penyetuju Mila (Supervisor)', (await p.locator('.ms-kv').innerText()).includes('Mila'));
  await shot('ms05-confirm-mobile');
  await runStep('kirim permintaan (mrf.create)', () => click('[data-ms-t="submit"]'));
  const r1 = await E(() => { const s = HAWK.store.state; const m = s.mrfs.find((x) => x.id === HAWK.ui.local._msTutor.v.mrf); return m && { status: m.status, branch: m.branch, requester: m.requester, lines: m.lines.map((l) => l.item + ':' + l.qty).join(','), next: HAWK.selectors.mrfNextApprover(s, m) }; });
  ok('MRF dari keranjang: SUBMITTED, Ubud, Indah, 2 minyak + 4 handuk, menunggu Supervisor', r1 && r1.status === 'SUBMITTED' && r1.branch === 'BR-UBD' && r1.requester === 'U-STF' && r1.lines === 'BHP-001:2,BHP-003:4' && r1.next === 'SUPERVISOR', JSON.stringify(r1));
  await shot('ms05-success-mobile');
  await runStep('lihat status di Permintaan Saya', () => click('[data-ms-tab="06"]'), { noHighlight: true });
  await shot('ms06-my-requests-mobile');
  ok('R1 selesai', (await p.locator('.ms-guide').innerText()).includes('Skenario selesai'));

  /* ---------- R2 track MRF via Supervisor and Purchasing ---------- */
  console.log('R2 Lacak MRF Supervisor → Purchasing');
  await startScenario('R2');
  const r2 = await E(() => HAWK.ui.local._msTutor.v.mrf);
  await runStep('Indah buka perjalanan', () => click(`[data-ms-req="${r2}"]`));
  await shot('ms07-journey-waiting-mobile');
  await runStep('Mila setujui dari Tugas', () => click(`[data-ms-approve="${r2}"]`));
  const st2 = await E((id) => { const m = HAWK.store.state.mrfs.find((x) => x.id === id); return m.lines[0].alloc.map((a) => a.path + ':' + a.qty).join(','); }, r2);
  ok('Setelah disetujui: sebagian dari stok outlet, sisanya PURCHASE', /LOCAL:\d+/.test(st2) && /PURCHASE:\d+/.test(st2), st2);
  await guideOpen();
  ok('Langkah Etya menampilkan "Lakukan untuk saya"', (await p.locator('[data-ms-t="guide-auto"]').count()) === 1);
  await click('[data-ms-t="guide-show"]');
  await guideOpen();
  await click('[data-ms-t="guide-auto"]');
  ok('R2-2 PO dibuat & dikirim lewat alur PO HAWK', (await p.locator('.ms-guide .ms-ok').count()) === 1);
  await click('[data-ms-t="guide-next"]');
  await runStep('Indah lihat Dalam pengiriman', async () => {}, { noHighlight: false });
  ok('Perjalanan menampilkan "Dalam pengiriman"', (await p.locator('.ms-card').first().innerText()).includes('Dalam pengiriman'));
  await shot('ms07-journey-shipping-mobile');

  /* ---------- R3 confirm receipt from warehouse ---------- */
  console.log('R3 Terima barang dari gudang');
  await startScenario('R3');
  const r3 = await E(() => HAWK.ui.local._msTutor.v.mrf);
  const before = await E(() => JSON.stringify({ l: HAWK.store.state.ledger.length, j: HAWK.store.state.journals.length }));
  await runStep('Supri serahkan barang (mrf.issue)', () => click(`[data-ms-issue="${r3}"]`));
  const mid = await E(() => JSON.stringify({ l: HAWK.store.state.ledger.length, j: HAWK.store.state.journals.length }));
  await runStep('Indah pilih kondisi Sesuai', () => click('[data-ms-t="cond-OK"]'));
  await shot('ms08-receiving-mobile');
  await runStep('Indah konfirmasi penerimaan (mrf.confirmHandover)', () => click('[data-ms-t="confirm-receive"]'));
  const after = await E(() => JSON.stringify({ l: HAWK.store.state.ledger.length, j: HAWK.store.state.journals.length }));
  const ho = await E((id) => { const m = HAWK.store.state.mrfs.find((x) => x.id === id); return { h: (m.handovers || []).length, by: m.handovers && m.handovers[0].by.user, kind: m.handovers && m.handovers[0].kind, grn: HAWK.store.state.grns.filter((g) => g.mrf === id).length }; }, r3);
  ok('Serah terima dicatat atas nama Indah, jenis HANDOVER, tanpa GRN', ho.h === 1 && ho.by === 'U-STF' && ho.kind === 'HANDOVER' && ho.grn === 0, JSON.stringify(ho));
  ok('Issue mengubah ledger/jurnal; konfirmasi serah terima tidak', before !== mid && mid === after, before + ' ' + mid + ' ' + after);
  await shot('ms08-received-mobile');

  /* ---------- R4 handwritten receipt ---------- */
  console.log('R4 Scan nota tulisan tangan');
  await startScenario('R4');
  await shot('ms09-camera-mobile');
  await runStep('jepret nota (spend.capture)', () => click('[data-ms-t="shutter"]'));
  ok('MS-10 berlabel AI SIMULASI', (await p.locator('.ms-app').innerText()).includes('AI SIMULASI'));
  await shot('ms10-review-mobile');
  await runStep('koreksi harga Pasir 350000', async () => { await p.fill('[data-ms-price="1"]', '350000'); await p.locator('[data-ms-price="1"]').dispatchEvent('change'); await wait(); });
  await runStep('konfirmasi total & pilih Tunai', async () => {
    if (await p.locator('[data-ms-t="sp-confirm-total"]').count()) await click('[data-ms-t="sp-confirm-total"]');
    await p.selectOption('[data-ms-t="sp-pay"]', 'CASH');
    await wait();
  });
  const pre = await E(() => ({ j: HAWK.store.state.journals.length }));
  await runStep('ajukan nota (spend.submit)', () => click('[data-ms-t="sp-submit"]'));
  const sp = await E(() => { const s = HAWK.store.state; const x = HAWK.selectors.spend(s, HAWK.ui.local._msTutor.v.sp); const ev = HAWK.selectors.evidence(s, x.evidence); return { status: x.status, j: s.journals.length, orig: !!(ev && (ev.image || ev.original || ev.hash)) }; });
  ok('Nota diajukan, tidak ada jurnal baru, bukti asli tersimpan', !['DRAFT', 'RETURNED'].includes(sp.status) && sp.j === pre.j && sp.orig, JSON.stringify(sp));
  await shot('ms10-submitted-mobile');

  /* ---------- R5 damaged facility ---------- */
  console.log('R5 Lapor fasilitas rusak');
  await startScenario('R5');
  await runStep('Dewa pilih Kerusakan', () => click('[data-ms-t="fr-kind-DAMAGE"]'));
  await runStep('tambah foto contoh', () => click('[data-ms-t="photo-sample-fr"]'));
  await runStep('pilih area & uraian', async () => {
    await p.selectOption('[data-ms-t="fr-area"]', 'Ruang Treatment 2');
    await wait();
    await p.fill('[data-ms-t="fr-issue"]', 'Kran wastafel bocor, air terus menetes.');
    await p.locator('[data-ms-t="fr-issue"]').dispatchEvent('change');
    await wait();
  });
  await shot('ms11-facility-mobile');
  await runStep('prioritas Mendesak & kirim (mt.create)', async () => { await click('[data-ms-t="fr-prio-HIGH"]'); await click('[data-ms-t="fr-send"]'); });
  const mt = await E(() => { const s = HAWK.store.state; const m = s.maintenance.find((x) => x.id === HAWK.ui.local._msTutor.v.mt); return { area: m.area, pr: m.priority, ph: (m.photos || []).length, br: m.branch, by: m.reporter, kind: m.kind }; });
  ok('Laporan: area Ruang Treatment 2, HIGH, 1 foto, Ubud, oleh Dewa', mt.area === 'Ruang Treatment 2' && mt.pr === 'HIGH' && mt.ph === 1 && mt.br === 'BR-UBD' && mt.by === 'U-ATD' && mt.kind === 'DAMAGE', JSON.stringify(mt));
  await shot('ms11-sent-mobile');
  const mtId = await E(() => HAWK.ui.local._msTutor.v.mt);
  await runStep('Mila setujui laporan (mt.review)', () => click(`[data-ms-mt="${mtId}"]`));
  ok('R5 selesai', (await p.locator('.ms-guide').innerText()).includes('Skenario selesai'));

  /* ---------- MS-12 per role, screenshots ---------- */
  for (const [u, n] of [['U-STF', 'indah'], ['U-SPV', 'mila'], ['U-WHS', 'supri'], ['U-PUR', 'etya'], ['U-FIN', 'asri']]) {
    await E(() => { HAWK.ui.local._msTutor = { sc: null, i: 0, v: {}, open: false }; HAWK.dxClear(); });
    await click(`.ms-accts [data-u="${u}"]`);
    await E(() => { location.hash = '#/m/12'; });
    await wait(250);
    ok(`MS-12 tampil untuk ${n} tanpa error`, (await p.locator('.ms-shell[data-ms="12"]').count()) === 1 && !(await p.locator('.ms-app .ms-warn:not([hidden])').count()));
    if (n === 'mila' || n === 'indah') await shot('ms12-tasks-' + n + '-mobile');
  }
  await click('.ms-accts [data-u="U-SPV"]');
  await E(() => { location.hash = '#/m/01'; });
  await wait(250);
  await shot('ms01-home-supervisor-mobile');

  /* ---------- no overflow on every MS screen, staff ---------- */
  await click('.ms-accts [data-u="U-STF"]');
  let bad = [];
  for (const c of ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']) {
    await E((c) => { location.hash = '#/m/' + c; }, c);
    await wait(200);
    if (await over()) bad.push(c);
    if (c === '01') await shot('ms01-home-mobile');
  }
  ok('Mobile 390 px: 12 layar tanpa overflow horizontal', !bad.length, bad.join(','));

  /* ---------- reset demo ---------- */
  await E(() => { location.hash = '#/m/01'; });
  await wait();
  await click('[data-ms-t="guide"]');
  await click('[data-ms-t="reset"]');
  await click('#reset-ok');
  await wait(300);
  const rs = await E(() => ({ mrfs: HAWK.store.state.mrfs.length, mt: HAWK.store.state.maintenance.filter((m) => m.reporter === 'U-ATD').length }));
  ok('Reset data demo mengembalikan data awal', rs.mt === 0, JSON.stringify(rs));

  /* ---------- tablet 834 ---------- */
  const t = await b.newContext({ viewport: { width: 834, height: 1112 }, deviceScaleFactor: 2, hasTouch: true });
  const tp = await t.newPage();
  tp.on('pageerror', (e) => errs.push('tablet pageerror: ' + e.message));
  await tp.goto(URL);
  await tp.waitForTimeout(400);
  await tp.evaluate(() => { HAWK.setUser('U-STF', { tour: false }); });
  bad = [];
  for (const c of ['01', '02', '07', '12']) {
    await tp.evaluate((c) => { location.hash = '#/m/' + c; HAWK.render(); }, c);
    await tp.waitForTimeout(250);
    if (await tp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) bad.push(c);
    await tp.screenshot({ path: path.join(shotDir, 'ms' + c + '-tablet.png') });
  }
  ok('Tablet 834 px: tanpa overflow', !bad.length, bad.join(','));

  ok('Tanpa error JavaScript', !errs.length, errs.join(' | '));
  await b.close();
  const pass = results.filter((r) => r.ok).length;
  const fail = results.length - pass;
  fs.writeFileSync(path.join(__dirname, 'e2e-smart-staff-results.json'), JSON.stringify({ pass, fail, results }, null, 1));
  console.log(`\n${pass} lulus, ${fail} gagal`);
  process.exit(fail ? 1 : 0);
})();
