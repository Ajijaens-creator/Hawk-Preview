/* HAWK Operational · Gudang & Stok BHP outlet (permintaan Owner 2026-11-19). Frontend + fixture lokal saja.
   python3 -m http.server 8811 dari root repo, lalu: node tests/hawk-live/ops-warehouse.e2e.js  (SHOTS=dir untuk screenshot) */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const ROOT = BASE.replace(/hawk-live\/?$/, '');
const SHOTS = process.env.SHOTS;
let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const shot = async (n, full = false) => { if (SHOTS) { await p.waitForTimeout(250); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: full }); } };
  const go = async (r) => { await p.goto(BASE + 'operational.html#' + r); await p.waitForTimeout(350); };
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const as = (id) => ev(a => OPX.actions['account-select']({ dataset: { id: a } }), id);
  const visibleNav = () => p.$$eval('#nav a', as => as.filter(a => !a.hidden && !a.closest('[hidden]')).map(a => a.getAttribute('href')));
  const row = (sku) => ev(s => { const r = document.querySelector(`#opx-root tr[data-sku="${s}"]`); return r && { qty: r.querySelector('.wh-qty').textContent.trim(), need: r.querySelector('.wh-need').textContent.trim() }; }, sku);
  await p.goto(BASE + 'operational.html'); await ev(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);

  for (const id of ['therapist-CTR', 'attendant-CTR', 'reception-CTR', 'security-CTR', 'spv-CTR', 'mgr-eni']) {
    await as(id); await p.waitForTimeout(150);
    ok(`Menu Gudang & Stok BHP terlihat untuk ${id}`, (await visibleNav()).includes('#op-warehouse'));
  }
  await as('therapist-CTR'); await go('op-warehouse');
  const head = await ev(() => [...document.querySelectorAll('#opx-root .wh-table th')].map(t => t.textContent.trim()).join('|'));
  ok('Tabel menampilkan sisa, minimum, harus order dan tombol Order', /Sisa/.test(head) && /Minimum/.test(head) && /Harus order/.test(head) && (await p.locator('#opx-root [data-act="wh-order"]').count()) > 0, head);
  ok('Default filter BHP (tanpa suku cadang)', !(await ev(() => /SP-00/.test(document.querySelector('#opx-root .wh-table').innerText))));
  ok('Therapist hanya melihat stok outlet sendiri', await ev(() => [...document.querySelectorAll('#opx-root tr[data-outlet]')].every(r => r.dataset.outlet === 'CTR')));
  const r0 = await row('BHP-001');
  ok('Harus order = maksimum − sisa saat sisa ≤ minimum', r0 && r0.qty.startsWith('3 ') && r0.need.startsWith('17'), JSON.stringify(r0));
  await shot('GW-01-gudang-therapist');
  const stock0 = await ev(() => JSON.stringify(OPX.state.data.warehouse.stock));
  await p.click('#opx-root tr[data-sku="BHP-001"] [data-act="wh-order"]'); await p.waitForTimeout(250);
  ok('Modal order terisi otomatis dengan jumlah harus order', (await p.inputValue('#modal-root input[name="qty"]')) === '17');
  await shot('GW-02-modal-order');
  await p.fill('#modal-root input[name="qty"]', '10'); await p.click('#modal-root button[type="submit"]'); await p.waitForTimeout(300);
  const o1 = await ev(() => OPX.state.data.warehouse.orders.at(-1));
  ok('Order therapist menunggu Supervisor (jalur PO untuk BHP)', o1 && o1.status === 'menunggu_supervisor' && o1.route === 'PO' && o1.qty === 10 && o1.by === 'therapist-CTR' && o1.outlet === 'CTR');
  ok('Order tidak mengubah stok gudang', (await ev(() => JSON.stringify(OPX.state.data.warehouse.stock))) === stock0);
  await ev(() => { OPX.ui.whTab = 'stock'; OPX.render(); });
  const r1 = await row('BHP-001');
  ok('Harus order berkurang oleh jumlah yang sudah dipesan', r1.need.startsWith('7'), r1.need);
  const n1 = await ev(() => OPX.state.data.warehouse.orders.length);
  await ev(() => { const fd = new FormData(); fd.append('id', 'WHS-CTR-BHP-001'); fd.append('qty', '2'); fd.append('route', 'PO'); OPX.forms['wh-order'](fd); });
  ok('Order ganda untuk item yang sama ditahan sampai Supervisor memutuskan', (await ev(() => OPX.state.data.warehouse.orders.length)) === n1);
  await ev(() => { const fd = new FormData(); fd.append('id', 'WHS-SHT-BHP-001'); fd.append('qty', '2'); fd.append('route', 'PO'); OPX.forms['wh-order'](fd); });
  ok('Staff tidak dapat order untuk outlet lain', (await ev(() => OPX.state.data.warehouse.orders.length)) === n1);
  await ev(() => OPX.actions['wh-approve']({ dataset: { id: OPX.state.data.warehouse.orders.at(-1).id } }));
  ok('Therapist tidak dapat menyetujui order', (await ev(() => OPX.state.data.warehouse.orders.at(-1).status)) === 'menunggu_supervisor');
  await as('attendant-CTR'); await go('op-warehouse');
  await ev(() => OPX.actions['wh-order-all']()); await p.waitForTimeout(200);
  ok('Attendant: Order semua BHP yang perlu menampilkan konfirmasi', /Order semua BHP/.test(await ev(() => document.querySelector('#modal-root')?.innerText || '')));
  await ev(() => OPX.actions['wh-order-all-confirm']()); await p.waitForTimeout(200);
  const bulk = await ev(() => OPX.state.data.warehouse.orders.filter(o => o.by === 'attendant-CTR'));
  ok('Order massal dibuat untuk BHP di bawah minimum tanpa menggandakan BHP-001', bulk.length >= 3 && !bulk.some(o => o.item === 'BHP-001') && bulk.every(o => o.status === 'menunggu_supervisor'), bulk.map(o => o.item).join(','));
  await as('spv-CTR'); await go('op-warehouse'); await ev(() => { OPX.ui.whTab = 'orders'; OPX.render(); });
  ok('Supervisor melihat antrean order staf dengan tombol Setujui', (await p.locator('#opx-root [data-act="wh-approve"]').count()) === bulk.length + 1);
  await shot('GW-03-supervisor-setujui', true);
  await ev(() => OPX.actions['wh-approve']({ dataset: { id: OPX.state.data.warehouse.orders[0].id } }));
  await ev(() => OPX.actions['wh-reject']({ dataset: { id: OPX.state.data.warehouse.orders[1].id } }));
  ok('Supervisor menyetujui dan menolak order', await ev(() => OPX.state.data.warehouse.orders[0].status === 'diajukan' && OPX.state.data.warehouse.orders[0].approvedBy === 'spv-CTR' && OPX.state.data.warehouse.orders[1].status === 'ditolak'));
  await ev(() => { const fd = new FormData(); fd.append('id', 'WHS-CTR-SP-001'); fd.append('qty', '1'); fd.append('route', 'MRF'); OPX.forms['wh-order'](fd); });
  ok('Order Supervisor (MRF suku cadang) langsung diajukan', await ev(() => { const o = OPX.state.data.warehouse.orders.at(-1); return o.item === 'SP-001' && o.route === 'MRF' && o.status === 'diajukan' && /^MRF-OPS-/.test(o.id); }));
  ok('Stok tetap tidak berubah setelah persetujuan', (await ev(() => JSON.stringify(OPX.state.data.warehouse.stock))) === stock0);
  await p.reload(); await p.waitForTimeout(500);
  ok('Order tersimpan setelah reload', (await ev(() => OPX.state.data.warehouse.orders.length)) === bulk.length + 2);
  await as('mgr-eni'); await go('op-warehouse');
  ok('Manager melihat semua outlet', await ev(() => new Set([...document.querySelectorAll('#opx-root tr[data-outlet]')].map(r => r.dataset.outlet)).size === 4));
  await shot('GW-04-manager-semua-outlet');
  /* tautan ke Gudang HAWK 60-NV memakai akun setara */
  await as('therapist-CTR'); await go('op-warehouse');
  const links = await ev(() => [...document.querySelectorAll('#opx-root .wh-links a')].map(a => a.getAttribute('href')));
  ok('Tautan Gudang HAWK (NV-40, NV-24) sebagai Therapist (U-STF)', links.includes('/?as=U-STF#/nv/40') && links.includes('/?as=U-STF#/nv/24'), links.join(' '));
  const nv = await browser.newPage(); const nvErr = []; nv.on('pageerror', e => nvErr.push(e.message));
  for (const h of ['?as=U-STF#/nv/40', '?as=U-STF#/nv/24', '?as=U-SPV#/nv/38']) {
    await nv.goto(ROOT + h); await nv.waitForTimeout(700);
    ok(`Gudang HAWK ${h} terbuka`, (await nv.evaluate(() => document.body.innerText.length)) > 300 && !/tidak (memiliki akses|berwenang)/i.test(await nv.evaluate(() => document.body.innerText.slice(0, 2000))));
  }
  ok('Gudang HAWK tanpa error', nvErr.length === 0, nvErr.slice(0, 2).join(' | '));
  for (const [w, h, n] of [[834, 1112, 'tablet'], [390, 844, 'mobile']]) {
    await p.setViewportSize({ width: w, height: h }); await go('op-warehouse');
    const over = await ev(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(`Responsif ${n} ${w}px tanpa scroll horizontal`, over <= 1, `+${over}px`);
    if (n === 'mobile') await shot('GW-05-mobile-gudang');
  }
  ok('Tanpa error konsol', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? `GAGAL · ${fail} gagal` : 'LULUS · 0 gagal');
  process.exit(fail ? 1 : 0);
})();
