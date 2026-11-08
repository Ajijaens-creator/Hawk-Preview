/* End-to-end UI test of Smart Spend Money (MP-HAWK-05/06 acceptance, 15 steps), driven by real clicks in Chromium
   at phone width (390×844). Role changes use the demo role switcher in the top bar.
   Usage: node tests/e2e-smart-spend.js [screenshotDir]
   Screenshots of the six mobile subviews (NV-M1..M6) are written at deviceScaleFactor 2. */
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const shotDir = process.argv[2] || path.join(__dirname, '..', 'docs', 'screenshots', 'smart-spend');
fs.mkdirSync(shotDir, { recursive: true });

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text()));
  const results = [];
  const ok = (name, cond, info) => {
    results.push({ name, ok: !!cond, info: cond ? '' : info || '' });
    console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || !info ? '' : ' — ' + info));
  };
  const wait = (ms = 150) => p.waitForTimeout(ms);
  const st = (fn, arg) => p.evaluate(fn, arg);
  const go = async (nv) => { await p.evaluate((n) => (location.hash = '#/nv/' + n), nv); await wait(250); };
  const as = async (uid) => { await p.click('#btn-role'); await wait(120); await p.click(`#pop [data-user="${uid}"]`); await wait(250); };
  const click = async (sel) => { await p.click(sel); await wait(); };
  const mview = () => p.evaluate(() => (document.querySelector('.ss-phone .ss-screen') || {}).dataset?.m || '');
  const shot = async (name) => {
    // hide page chrome that floats over the phone frame (sticky topbar, toasts, walkthrough pill) — screenshot only
    const h = await p.addStyleTag({ content: '.topbar,.toasts,.tour,.tour-collapsed{visibility:hidden!important}' });
    await (await p.$('.ss-phone')).screenshot({ path: path.join(shotDir, name + '.png') });
    await h.evaluate((e) => e.remove());
  };
  const toast = () => p.evaluate(() => { const t = [...document.querySelectorAll('.toast')].pop(); return t ? t.innerText.replace(/\n/g, ' ') : ''; });

  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await wait(300);
  await p.evaluate(() => { HAWK.setUser('U-STF', { tour: false }); });
  await go(48);

  // 1. Staff at Spa Shanti opens Smart Spend
  ok('1. Staff Spa Shanti membuka Smart Spend (NV-M1)', (await mview()) === 'M1' && /Spa Shanti/.test(await p.innerText('.ss-phone')));
  await shot('M1-beranda');

  // 2. Scan Nota → camera view
  await click('.ss-phone [data-a="ss_scan"]');
  ok('2. Pilih Scan Nota → kamera (NV-M2)', (await mview()) === 'M2');
  // 3. handwritten receipt (demo sample) → AI SIMULATION read
  await click('.ss-phone [data-a="ss_pick"][data-k="HANDWRITTEN"]');
  await click('.ss-phone [data-a="ss_crop"]');
  await shot('M2-kamera');
  await p.click('.ss-phone [data-a="ss_read"]');
  await wait(700);
  await shot('M2b-ai-membaca');
  await p.waitForFunction(() => document.querySelector('.ss-phone [data-m="M3"]'), null, { timeout: 5000 });
  const spId = await st(() => HAWK.store.state.spends.filter((x) => x.createdBy === 'U-STF' && x.status === 'DRAFT').pop().id);
  ok('3. Nota tulisan tangan dibaca (AI SIMULATION) → draft', /^SM/.test(spId), spId);

  // 4. extracted details shown
  const m3 = await p.innerText('.ss-phone');
  ok('4. Detail hasil ekstraksi tampil (supplier, item, total)', /Sumber Jaya/.test(await p.inputValue('.ss-phone [data-in="ss_f"][data-k="supplier"]')) && /Semen/.test(await p.inputValue('.ss-phone [data-in="ss_l"][data-i="0"][data-k="desc"]')) && /Lihat nota asli/.test(m3));
  // 5. uncertain fields identified
  const unsure = await p.$$eval('.ss-phone .st-CONFIRM, .ss-phone .st-BAD', (l) => l.length);
  ok('5. Field yang ragu ditandai (kuning/merah)', unsure >= 2, 'jumlah=' + unsure);
  await shot('M3-review-ai');
  // 5b. cannot continue while issues are open
  await click('.ss-phone [data-a="ss_next1"]');
  ok('5b. Tidak bisa lanjut sebelum field ragu dikonfirmasi', (await mview()) === 'M3' && /Periksa dulu/.test(await toast()));

  // 6. correct the doubtful Pasir price (line 2) to the figure on the receipt
  const priceSel = '.ss-phone [data-in="ss_l"][data-i="1"][data-k="price"]';
  await p.fill(priceSel, '350000');
  await p.dispatchEvent(priceSel, 'change');
  await wait();
  ok('6. Harga Pasir dikoreksi pengguna (350.000)', (await p.inputValue(priceSel)).replace(/\D/g, '') === '350000');
  // 7. total checked (arithmetic matches) and confirmed
  ok('7a. Aritmetika rincian = total cocok', await p.$eval('#ss-arith', (e) => e.classList.contains('ok')), await p.innerText('#ss-arith'));
  await p.selectOption('.ss-phone select[data-k="pay"]', 'CASH');
  await p.dispatchEvent('.ss-phone select[data-k="pay"]', 'change');
  await wait();
  await p.fill('.ss-phone [data-k="payDate"]', '2026-11-07');
  await p.dispatchEvent('.ss-phone [data-k="payDate"]', 'change');
  await wait();
  for (let i = 0; i < 8; i++) {
    const b2 = await p.$('.ss-phone [data-a="ss_conf"]');
    if (!b2) break;
    await b2.click();
    await wait(100);
  }
  ok('7b. Semua field ragu dikonfirmasi pengguna', (await p.$$('.ss-phone .st-CONFIRM, .ss-phone .st-BAD')).length === 0);
  await click('.ss-phone [data-a="ss_next1"]');
  ok('7c. Lanjut ke klasifikasi (NV-M4)', (await mview()) === 'M4', await toast());
  const corr = await st((id) => HAWK.store.state.spends.find((x) => x.id === id), spId);
  ok('7d. Koreksi disimpan terpisah dari nilai AI', corr.corrections.some((c) => c.field === "line:1" && c.ai === 35000 && c.value === 350000) && corr.lines[1].price === 350000, JSON.stringify(corr.corrections));

  // 8. 7P and cost center reviewed
  await click('.ss-phone [data-a="ss_cls"][data-k="p"][data-v="FACILITY"]');
  await click('.ss-phone [data-a="ss_cls"][data-k="type"][data-v="OPEX"]');
  const c8 = await st((id) => HAWK.store.state.spends.find((x) => x.id === id).cls, spId);
  ok('8. 7P Facility + OPEX + cost center terisi', c8.p === 'FACILITY' && c8.type === 'OPEX' && /cost center/i.test(await p.innerText('.ss-phone')), JSON.stringify(c8));
  // 9. budget impact shown
  ok('9. Dampak budget ditampilkan', /Dampak ke budget/.test(await p.innerText('.ss-phone')) && /Sisa setelah pengeluaran ini/.test(await p.innerText('.ss-phone')));
  await shot('M4-klasifikasi-budget');
  await click('.ss-phone [data-a="ss_next2"]');
  ok('9b. Konfirmasi & rute approval (NV-M5)', (await mview()) === 'M5');
  await shot('M5-konfirmasi');

  // 10. submit
  await click('.ss-phone [data-a="ss_submit"]');
  const s10 = await st((id) => HAWK.store.state.spends.find((x) => x.id === id), spId);
  ok('10. Diajukan → menunggu Supervisor', s10.status === 'SUBMITTED' && (await mview()) === 'M6', s10.status);
  ok('10b. Belum ada jurnal sebelum verifikasi Finance', !s10.journal && !/JV2026/.test(await p.innerText('.ss-phone')));
  await shot('M6-detail');
  await click('.ss-phone [data-a="ss_dtab"][data-v="ev"]');
  await shot('M6b-bukti-nota');
  await click('.ss-phone [data-a="ss_dtab"][data-v="audit"]');
  await shot('M6c-audit-trail');
  // submitter cannot approve own spend
  ok('10c. Pengaju tidak punya tombol approve', !(await p.$('.ss-phone [data-a="ss_dec"]')));

  // 11. supervisor reviews and approves
  await as('U-SPV');
  await go(48);
  await click('.ss-phone [data-a="ss_nav"][data-v="approvals"]');
  await click(`.ss-phone [data-a="ss_open"][data-p="${spId}"]`);
  await shot('M6d-supervisor');
  await click(`.ss-phone [data-a="ss_dec"][data-v="APPROVE"][data-p="${spId}"]`);
  const s11 = await st((id) => HAWK.store.state.spends.find((x) => x.id === id), spId);
  ok('11. Supervisor menyetujui', s11.status === 'APPROVED' && s11.steps.some((a) => a.key === 'APPROVE' && a.by === 'U-SPV'), s11.status + ' ' + (await toast()));

  // 12. Finance inspects
  await as('U-FIN');
  await go(48);
  await click('.ss-phone [data-a="ss_nav"][data-v="approvals"]');
  await click(`.ss-phone [data-a="ss_open"][data-p="${spId}"]`);
  ok('12. Finance membuka transaksi (antrean verifikasi)', !!(await p.$(`.ss-phone [data-a="ss_fin"][data-v="VERIFY"]`)));
  // 13. original evidence opened
  await click('.ss-phone [data-a="ss_dtab"][data-v="ev"]');
  await click('.ss-phone [data-ev]');
  const modal = await p.innerText('#modal').catch(() => '');
  ok('13. Bukti nota asli dibuka (tidak diubah)', /EV2026/.test(modal) && (await p.$('#modal img')) !== null, modal.slice(0, 120));
  await p.screenshot({ path: path.join(shotDir, 'M6e-bukti-modal.png') });
  await p.keyboard.press('Escape');
  await wait();
  if (await p.$('#modal [data-close-modal]')) await p.click('#modal [data-close-modal]').catch(() => {});
  await wait();
  await click('.ss-phone [data-a="ss_dtab"][data-v="detail"]');
  await click(`.ss-phone [data-a="ss_fin"][data-v="VERIFY"]`);
  const s13 = await st((id) => { const s = HAWK.store.state; const x = s.spends.find((y) => y.id === id); return { x, j: s.journals.find((j) => j.id === x.journal) }; }, spId);
  ok('13b. Finance verifikasi → jurnal PENDING_REVIEW dibuat', s13.x.status === 'VERIFIED' && s13.j && s13.j.status === 'PENDING_REVIEW', JSON.stringify(s13.x.status) + ' ' + (await toast()));
  await p.click(`.ss-phone [data-a="ss_settle"][data-p="${spId}"]`);
  await wait();
  await p.click('#ss-pay-ok');
  await wait(250);
  // 14. statuses verified
  const s14 = await st((id) => { const s = HAWK.store.state; const x = s.spends.find((y) => y.id === id); return { status: x.status, journal: x.journal, payment: x.payment, acc: HAWK.selectors.spendAccounting(s, x), js: s.journals.filter((j) => (j.ref || '') === id || (j.source || '') === id || (j.memo || '').includes(id)).length }; }, spId);
  ok('14. Status transaksi SETTLED + status akuntansi tercatat', s14.status === 'SETTLED' && !!s14.payment && !!s14.journal, JSON.stringify(s14));
  await shot('M6f-finance-lunas');
  // 15. no duplicate posting: second payment refused; same receipt cannot be submitted again
  const again = await st((id) => HAWK.api.call('spend.settle', { id, confirm: true }, HAWK.store.state.users.find((u) => u.id === 'U-FIN')), spId);
  ok('15a. Pembayaran kedua ditolak', !again.ok, JSON.stringify(again).slice(0, 160));
  await as('U-STF');
  await go(48);
  await click('.ss-phone [data-a="ss_scan"]');
  await click('.ss-phone [data-a="ss_pick"][data-k="HANDWRITTEN"]');
  await p.click('.ss-phone [data-a="ss_read"]');
  await p.waitForFunction(() => document.querySelector('.ss-phone [data-m="M3"]'), null, { timeout: 5000 });
  ok('15b. Nota yang sama terdeteksi duplikat', /Kemungkinan duplikat/.test(await p.innerText('.ss-phone')));
  const dupId = await st(() => HAWK.store.state.spends.filter((x) => x.createdBy === 'U-STF' && x.status === 'DRAFT').pop().id);
  const sub = await st((id) => HAWK.api.call('spend.submit', { id }, HAWK.store.state.users.find((u) => u.id === 'U-STF')), dupId);
  ok('15c. Pengajuan duplikat diblok', !sub.ok, JSON.stringify(sub).slice(0, 160));

  ok('Tidak ada error JavaScript', errs.length === 0, errs.join(' | '));
  fs.writeFileSync(path.join(__dirname, 'e2e-smart-spend-results.json'), JSON.stringify({ results, errors: errs }, null, 1));
  const fail = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - fail}/${results.length} cek lulus`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();
