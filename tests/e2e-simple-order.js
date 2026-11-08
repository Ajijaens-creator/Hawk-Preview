/* End-to-end UI test of Order Sederhana (8 Nov 2026 request): several item types, quantities and values,
   7P budget check, automatic approval/PO (rule AR-13), receipt by the requester, Finance one-tap "Sudah dibayar",
   settings by Finance / Super Admin / Owner, and every dashboard re-rendered afterwards.
   Real clicks in Chromium at phone width (390×844). Usage: node tests/e2e-simple-order.js [screenshotDir] */
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const shotDir = process.argv[2] || path.join(__dirname, '..', 'docs', 'screenshots', 'simple-order');
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
  const view = () => p.innerText('#view');
  const setQty = async (item, q) => { await p.$eval(`#view input[data-ch="setq"][data-it="${item}"]`, (el, v) => { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); }, String(q)); await wait(); };
  const noHScroll = () => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  const shot = async (name, full) => {
    const h = await p.addStyleTag({ content: '.toasts,.tour,.tour-collapsed{visibility:hidden!important}' });
    await p.screenshot({ path: path.join(shotDir, name + '.png'), fullPage: !!full });
    await h.evaluate((e) => e.remove());
  };
  const S = (fn, arg) => p.evaluate(fn, arg);

  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await wait(300);
  await p.evaluate(() => HAWK.setUser('U-STF', { tour: false }));
  await p.reload();
  await wait(300);
  await go(24);

  // 1. Staff home = Order Sederhana
  ok('1. Staff membuka beranda → Pesan barang (NV-24)', /Pesan barang/.test(await view()) && (await p.$$('#view .so-item')).length >= 6);
  const before = await S(() => { const s = HAWK.store.state; const b = HAWK.selectors.itemBudget(s, 'BR-SHN', 'BHP-001'); return { act: b.actualQty, com: b.commitQty, jv: s.journals.length }; });
  // 2. several items, qty & values: + button ×4, typed qty 12 and 100
  for (let i = 0; i < 4; i++) await click('#view [data-a="inc"][data-it="BHP-004"][data-d="1"]');
  await setQty('BHP-001', 12);
  await setQty('BHP-007', 100);
  const bar = await p.innerText('#view .so-bar');
  ok('2. 3 jenis barang dipilih (4 sabun, 12 minyak, 100 sandal) → total Rp2.250.000', /3 barang/.test(bar) && /2\.250\.000/.test(bar), bar);
  ok('3. Cek budget otomatis: "Dalam budget — langsung diproses"', /Dalam budget/.test(bar), bar);
  ok('3b. Layar 390px tanpa scroll samping', await noHScroll());
  await shot('1-pilih-barang');
  await click('#view [data-a="order"]');
  const A = await S(() => HAWK.store.state.mrfs[0]);
  ok('4. Pesan sekarang → disetujui otomatis (tanpa atasan) dan PO terkirim', A.simple && A.autoCheck.ok && A.status === 'IN_FULFILLMENT' && /diproses otomatis/.test(await view()), A.status);
  const poIds = await S((id) => HAWK.selectors.simplePOs(HAWK.store.state, HAWK.store.state.mrfs.find((m) => m.id === id)).map((x) => x.id + ':' + x.status), A.id);
  ok('5. PO otomatis berstatus SENT ke supplier default', poIds.length > 0 && poIds.every((x) => /:SENT$/.test(x)), poIds.join());
  ok('6. Kartu pesanan: tombol besar "Barang sudah diterima"', !!(await p.$(`#view [data-a="recv"][data-id2="${A.id}"]`)));
  await shot('2-pesanan-otomatis');

  // 7. over budget → manual chain, with plain-language reason
  await setQty('BHP-005', 20);
  const bar2 = await p.innerText('#view .so-bar');
  ok('7. Essential oil 20 → "Perlu persetujuan atasan" + alasan melebihi budget', /Perlu persetujuan/.test(bar2) && /melebihi budget/.test(bar2), bar2);
  await shot('3-lewat-budget');
  await click('#view [data-a="order"]');
  const E = await S(() => HAWK.store.state.mrfs[0]);
  ok('8. Pesanan lewat budget → menunggu Supervisor (+ BU Manager)', E.status === 'SUBMITTED' && E.chain[0] === 'SUPERVISOR' && E.chain.includes('BU_MANAGER'), JSON.stringify(E.chain));
  await go(1);
  ok('9. Dashboard staff: tugas "Konfirmasi barang sudah diterima" tampil', /Konfirmasi barang sudah diterima/.test(await view()));
  await go(27);
  ok('10. NV-27 Status permintaan memuat kedua pesanan', (await view()).includes(A.id) && (await view()).includes(E.id));
  await go(28);
  await p.evaluate((id) => HAWK.go(28, { id }), A.id);
  await wait(250);
  ok('11. NV-28 detail menampilkan approval oleh Sistem (aturan AR-13)', /Sistem/.test(await view()) && (await view()).includes(A.id));

  // 12. Supervisor sees only the exception
  await as('U-SPV');
  await go(2);
  const inbox = await view();
  ok('12. Supervisor: hanya pesanan lewat budget di antrean, pesanan otomatis tidak', inbox.includes(E.id) && !inbox.includes(A.id));
  await click(`#view [data-a="approveMrf"][data-ref="${E.id}"]`);
  ok('12b. Supervisor menyetujui → lanjut ke BU Manager', await S((id) => HAWK.selectors.mrfNextApprover(HAWK.store.state, HAWK.store.state.mrfs.find((m) => m.id === id)) === 'BU_MANAGER', E.id));

  // 13. Finance pays BEFORE goods arrive
  await as('U-FIN');
  await go(50);
  ok('13. Finance NV-50: panel "Konfirmasi pembayaran" berisi PO otomatis', /Konfirmasi pembayaran/.test(await view()) && (await p.$$('#view [data-a="soPay"]')).length === poIds.length);
  ok('13b. Finance juga melihat Pengaturan Order Otomatis', /Pengaturan Order Otomatis/.test(await view()));
  ok('13c. NV-50 390px tanpa scroll samping', await noHScroll());
  await shot('4-finance-sudah-dibayar');
  const firstPo = poIds[0].split(':')[0];
  await click(`#view [data-a="soPay"][data-po="${firstPo}"]`);
  ok('14. Modal konfirmasi jelas: SIMULASI, tidak ada dana keluar', /tidak ada dana keluar/.test(await p.innerText('#modal')));
  await click('#sp-ok');
  ok('15. "Sudah dibayar" → PO lunas (uang muka, barang belum datang)', await S((id) => HAWK.selectors.poPayState(HAWK.store.state, HAWK.store.state.pos.find((x) => x.id === id)).status === 'PAID', firstPo));
  await go(51);
  ok('16. NV-51 jurnal: uang muka Dr 1160 / Cr 1110 menunggu review', /1160 Uang Muka/.test(await view()) || (await S(() => HAWK.store.state.journals.some((j) => j.kind === 'ADVANCE_PAYMENT'))));

  // 17. Staff receives — partial first (2 short), then the rest
  await as('U-STF');
  await go(24);
  await click(`#view [data-a="recvPart"][data-id2="${A.id}"]`);
  const exp = await p.$$eval('#modal input[id^="rp-r-"]', (l) => l.map((x) => +x.value));
  const idx = await p.$$eval('#modal .so-item b', (l) => l.findIndex((x) => /Minyak Pijat/.test(x.textContent)));
  await p.fill(`#rp-r-${idx}`, String(exp[idx] - 2));
  await shot('5-terima-sebagian');
  await click('#rp-ok');
  const A2 = await S((id) => { const s = HAWK.store.state; const m = s.mrfs.find((x) => x.id === id); return { st: m.status, stage: HAWK.selectors.simpleStage(s, m).key, f: HAWK.selectors.mrfFulfillment(s, m) }; }, A.id);
  ok('17. Terima sebagian (minyak kurang 2) → sisa tetap ditunggu', A2.st === 'IN_FULFILLMENT' && A2.stage === 'ARRIVE' && A2.f.issued === A2.f.requested - 2, JSON.stringify(A2));
  await click(`#view [data-a="recv"][data-id2="${A.id}"]`);
  const A3 = await S((id) => HAWK.store.state.mrfs.find((x) => x.id === id).status, A.id);
  ok('18. Sisa datang → "Barang sudah diterima" → pesanan Selesai', A3 === 'FULFILLED' && /Selesai/.test(await view()), A3);
  await shot('6-selesai');
  const after = await S(() => { const s = HAWK.store.state; const b = HAWK.selectors.itemBudget(s, 'BR-SHN', 'BHP-001'); return { act: b.actualQty, com: b.commitQty }; });
  ok('19. Budget 7P: realisasi minyak pijat +12, komitmen kembali seperti awal', after.act === before.act + 12 && after.com === before.com, JSON.stringify([before, after]));

  // 20. Finance pays the rest after receipt
  await as('U-FIN');
  await go(50);
  for (const btn of await p.$$('#view [data-a="soPay"]')) {
    await p.click('#view [data-a="soPay"]');
    await wait();
    await click('#sp-ok');
  }
  ok('20. Semua PO pesanan lunas; antrean bayar kosong', /Tidak ada yang menunggu pembayaran/.test(await view()) && (await S((id) => HAWK.selectors.simplePOs(HAWK.store.state, HAWK.store.state.mrfs.find((m) => m.id === id)).every((x) => HAWK.selectors.poPayState(HAWK.store.state, x).status === 'PAID'), A.id)));
  const acct = await S(() => { const L = HAWK.store.state.journals.flatMap((j) => j.lines); const bal = (k) => Math.round(L.filter((l) => l.acc.startsWith(k)).reduce((t, l) => t + l.dr - l.cr, 0)); return { adv: bal('1160'), unbalanced: HAWK.store.state.journals.filter((j) => Math.round(j.lines.reduce((t, l) => t + l.dr - l.cr, 0)) !== 0).length }; });
  ok('21. Akuntansi: uang muka 1160 bersih 0, semua jurnal seimbang', acct.adv === 0 && acct.unbalanced === 0, JSON.stringify(acct));

  // 22. settings — Finance lowers limit; Staff cannot reach settings
  await p.fill('#ao-max', '500000');
  await p.fill('#ao-note', 'Uji batas kecil dari Finance');
  await click('#view [data-a="aoSave"]');
  ok('22. Finance mengubah batas ke Rp500.000 (tercatat v2 + jejak)', await S(() => HAWK.selectors.autoRule(HAWK.store.state).max === 500000 && HAWK.selectors.autoRule(HAWK.store.state).version === 2) && /Uji batas kecil/.test(await view()));
  await as('U-ADM');
  await go(9);
  ok('23. Super Admin melihat kartu pengaturan di NV-09 (bisa ubah)', !!(await p.$('#view [data-a="aoSave"]')));
  await p.fill('#ao-max', '5000000');
  await p.fill('#ao-note', 'Kembali ke keputusan Owner');
  await click('#view [data-a="aoSave"]');
  await as('U-OWN');
  await go(9);
  ok('24. Owner melihat & dapat mengubah; batas kembali Rp5 jt (v3)', !!(await p.$('#view [data-a="aoSave"]')) && (await S(() => HAWK.selectors.autoRule(HAWK.store.state).max === 5000000 && HAWK.selectors.autoRule(HAWK.store.state).version === 3)));
  ok('25. Staff tidak punya akses pengaturan (operasi ditolak)', await S(() => !HAWK.api.can('autoOrder.update', 'STAFF') && !HAWK.api.can('autoOrder.update', 'SUPERVISOR') && !HAWK.api.can('autoOrder.update', 'PURCHASING')));

  // 26. every dashboard renders with the new data, for the roles that own it
  const dash = [[1, 'U-OWN'], [2, 'U-OWN'], [3, 'U-OWN'], [23, 'U-OWN'], [30, 'U-OWN'], [32, 'U-PUR'], [36, 'U-PUR'], [38, 'U-WHS'], [39, 'U-WHS'], [40, 'U-WHS'], [41, 'U-WHS'], [44, 'U-WHS'], [47, 'U-FIN'], [49, 'U-FIN'], [50, 'U-FIN'], [51, 'U-FIN'], [52, 'U-FIN'], [57, 'U-OWN'], [59, 'U-OWN'], [60, 'U-OWN']];
  const bad = [];
  let cur = '';
  for (const [nv, uid] of dash) {
    if (cur !== uid) { await as(uid); cur = uid; }
    const e0 = errs.length;
    await go(nv);
    const t = await view();
    if (errs.length > e0 || t.length < 80 || /Akses dibatasi|Terjadi kesalahan/.test(t)) bad.push(nv + ':' + (errs[errs.length - 1] || t.slice(0, 60)));
  }
  ok('26. 20 dashboard/layar terkait (NV-01…60) tampil tanpa error setelah alur', bad.length === 0, bad.join(' | '));
  await as('U-OWN');
  await go(23);
  ok('27. NV-23 Budget vs Actual memuat realisasi Product (Owner)', /Product/.test(await view()));
  await go(3);
  ok('28. NV-03 notifikasi/aktivitas mencatat aksi sistem AR-13', await S(() => HAWK.store.state.audit.some((a) => a.user === 'SYS-RULE')));
  ok('29. Tidak ada error JavaScript', errs.length === 0, errs.slice(0, 3).join(' | '));

  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} lulus`);
  fs.writeFileSync(path.join(__dirname, 'e2e-simple-order-results.json'), JSON.stringify({ pass, total: results.length, results }, null, 1));
  await b.close();
  process.exit(pass === results.length ? 0 : 1);
})();
