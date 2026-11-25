/* End-to-end UI test NP-HAWK-FIN-NV33-001 — NV-33 Supplier Master & Directory: filter kategori supplier.
   TC01–TC17 dari brief + demo test case + regresi kolom/Kinerja + EN + keyboard + responsif.
   Usage: node tests/e2e-nv33-supplier-filter.js [screenshotDir]   (tanpa argumen: screenshot tidak disimpan) */
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const shotDir = process.argv[2] || null;
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

(async () => {
  const b = await chromium.launch();
  const ctxB = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctxB.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text()));
  const results = [];
  const ok = (name, cond, info) => {
    results.push({ name, ok: !!cond, info: cond ? '' : info || '' });
    console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || !info ? '' : ' — ' + info));
  };
  const wait = (ms = 150) => p.waitForTimeout(ms);
  const S = (fn, arg) => p.evaluate(fn, arg);
  const go = async (nv) => { await S((n) => { location.hash = '#/nv/' + n; HAWK.render(); }, nv); await wait(250); };
  const as = async (uid) => { await S((id) => { HAWK.setUser(id, { tour: false }); HAWK.render(); }, uid); await wait(200); };
  const shot = async (name) => {
    if (!shotDir) return;
    const h = await p.addStyleTag({ content: '.toasts,.tour,.tour-collapsed{visibility:hidden!important}' });
    await (await p.$('#view')).screenshot({ path: path.join(shotDir, name + '.png') });
    await h.evaluate((e) => e.remove());
  };
  const visible = () => p.$$eval('#sup-list tr[data-row]', (r) => r.filter((x) => x.style.display !== 'none').map((x) => x.querySelector('td').innerText.trim()));
  const count = () => p.innerText('#sup-count');
  const emptyShown = () => S(() => { const e = document.getElementById('sup-empty'); return !!e && e.style.display !== 'none' && e.offsetParent !== null; });
  const pick = async (label) => { await p.selectOption('#sup-cat', label === 'Semua kategori' ? '' : { label }); await wait(); };
  const search = async (t) => { await p.fill('[data-in="flt"]', t); await wait(); };
  const reset = async () => { await p.click('#sup-reset'); await wait(250); };
  const tab = async (v) => { await p.click(`[data-tab="t"][data-v="${v}"]`); await wait(250); };

  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await S(() => localStorage.clear());
  await p.reload();
  await wait(400);
  await as('U-GAS'); // Meli — General Accounting Supervisor (FINANCE)
  await go(33);

  const data = await S(() => HAWK.store.state.suppliers.map((x) => ({ id: x.id, cat: x.cat, name: x.name })));
  const total = data.length;
  const expCats = [...new Set(data.map((x) => x.cat.trim()))].sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' }));
  const by = (cat, q = '') => data.filter((x) => (!cat || x.cat === cat) && (x.name + ' ' + x.cat).toLowerCase().includes(q.toLowerCase())).length;
  await shot('01-default');

  /* ---------- tata letak ---------- */
  const order = await S(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); const a = r('[data-in="flt"]'), b = r('#sup-cat'), c = r('#sup-reset'); return { ab: a.right <= b.left, bc: b.right <= c.left, row: Math.abs(a.top - b.top) < 6 && Math.abs(b.top - c.top) < 12 }; });
  ok('Layout: Search → Dropdown Kategori → Reset (kiri ke kanan, satu baris di desktop)', order.ab && order.bc && order.row, JSON.stringify(order));

  /* ---------- TC01–TC04 ---------- */
  ok(`TC01: default Semua kategori menampilkan seluruh supplier (${total})`, (await p.inputValue('#sup-cat')) === '' && (await visible()).length === total);
  const opts = await p.$$eval('#sup-cat option', (o) => o.map((x) => x.textContent));
  ok('TC02: pilihan kategori dinamis dari master supplier (sama dengan data store, tidak hardcode)', JSON.stringify(opts.slice(1).slice().sort()) === JSON.stringify(expCats.slice().sort()), opts.join('|'));
  ok('TC03: "Semua kategori" pertama, sisanya urut A–Z', opts[0] === 'Semua kategori' && JSON.stringify(opts.slice(1)) === JSON.stringify(expCats), opts.join('|'));
  ok('TC04: single select (bukan multiple)', !(await S(() => document.getElementById('sup-cat').multiple)));

  /* ---------- TC05–TC07 + demo case ---------- */
  await pick('BHP Treatment');
  ok(`TC05: memilih kategori langsung memfilter tanpa tombol Terapkan (BHP Treatment = ${by('BHP Treatment')})`, (await visible()).length === by('BHP Treatment'));
  ok('Demo: BHP Treatment = 2 supplier', (await visible()).length === 2, (await visible()).join());
  await pick('Linen');
  ok('Demo: Linen = 1 supplier', (await visible()).length === 1);
  await pick('Bahan Baku');
  ok('Demo: Bahan Baku = 1 supplier', (await visible()).length === 1);
  await pick('Semua kategori');
  await search('Aroma');
  ok(`TC06: Search existing tetap berfungsi ("Aroma" = ${by('', 'Aroma')})`, (await visible()).length === by('', 'Aroma'));
  await search('bhp');
  ok('TC06: Search existing tetap mencocokkan teks kategori (aturan lama)', (await visible()).length === by('', 'bhp'));
  await search('Aroma');
  await pick('BHP Treatment');
  ok('TC07 / Demo: BHP Treatment + Search "Aroma" = 1 supplier (AND)', (await visible()).length === 1 && (await visible())[0].includes('SUP-001'), (await visible()).join());
  await shot('02-bhp-aroma');
  await pick('Linen');
  ok('TC07 / Demo: Linen + Search "Aroma" = 0 supplier', (await visible()).length === 0);

  /* ---------- TC11 empty state ---------- */
  ok('TC11: empty state "Supplier tidak ditemukan" tampil, header tabel & filter tetap ada', (await emptyShown()) && /Supplier tidak ditemukan/.test(await p.innerText('#sup-list')) && !!(await p.$('#sup-list thead')) && !!(await p.$('#sup-cat')) && !!(await p.$('[data-in="flt"]')));
  ok('TC10: jumlah hasil = 0 saat kosong', (await count()) === `Menampilkan 0 dari ${total} supplier`, await count());
  await shot('03-empty');

  /* ---------- TC08–TC10 ---------- */
  const prefsBefore = await S(() => localStorage.getItem('hawk-ui-prefs'));
  await reset();
  ok('TC08 / Demo: Reset mengosongkan Search, kategori kembali Semua kategori, tampil semua supplier', (await p.inputValue('[data-in="flt"]')) === '' && (await p.inputValue('#sup-cat')) === '' && (await visible()).length === total);
  ok('TC17: Reset tidak mengubah filter global unit bisnis / cabang', (await S(() => localStorage.getItem('hawk-ui-prefs'))) === prefsBefore);
  ok('TC09: label tab tetap total supplier', /Daftar supplier\s*\(7\)/.test(await p.innerText('.tabs')) && total === 7, await p.innerText('.tabs'));
  ok('TC10: jumlah hasil terpisah, dari data aktual', (await count()) === `Menampilkan ${total} dari ${total} supplier`, await count());
  await pick('BHP Treatment');
  ok('TC10: jumlah hasil ikut berubah ("Menampilkan 2 dari 7 supplier")', (await count()) === `Menampilkan ${by('BHP Treatment')} dari ${total} supplier`, await count());
  ok('Empty state tersembunyi saat ada hasil', !(await emptyShown()));

  /* ---------- fokus saat mengetik ---------- */
  await reset();
  await p.click('[data-in="flt"]');
  await p.keyboard.type('nusa', { delay: 20 });
  await wait();
  ok('Mengetik di Search tidak kehilangan fokus input', (await S(() => document.activeElement && document.activeElement.dataset.in)) === 'flt' && (await p.inputValue('[data-in="flt"]')) === 'nusa');

  /* ---------- TC12–TC13 ---------- */
  await reset();
  await tab('perf');
  const perfClean = await p.innerText('#view');
  await tab('list');
  await search('Aroma');
  await pick('BHP Treatment');
  await tab('perf');
  const perfFiltered = await p.innerText('#view');
  ok('TC13: tab Kinerja Supplier tidak terpengaruh filter (isi identik, semua supplier)', perfClean === perfFiltered && data.every((x) => perfFiltered.includes(x.name)));
  await tab('list');
  ok('TC12: kembali ke Daftar supplier, Search & kategori dipertahankan', (await p.inputValue('[data-in="flt"]')) === 'Aroma' && (await p.$eval('#sup-cat', (e) => e.options[e.selectedIndex].text)) === 'BHP Treatment' && (await visible()).length === 1 && (await count()) === `Menampilkan 1 dari ${total} supplier`);
  await p.reload();
  await wait(400);
  await go(33);
  ok('Tidak ada penyimpanan permanen: setelah reload filter kembali default', (await p.inputValue('[data-in="flt"]')) === '' && (await p.inputValue('#sup-cat')) === '' && (await visible()).length === total);

  /* ---------- TC14 ---------- */
  ok('TC14: tidak ada pagination — semua supplier ada di tabel sehingga filter mencakup seluruh dataset', (await p.$$('#sup-list tr[data-row]')).length === total && !(await p.$('#sup-list .pager, #sup-list [data-page]')));

  /* ---------- regresi kolom ---------- */
  const heads = await p.$$eval('#sup-list thead th', (t) => t.map((x) => x.innerText.trim()));
  ok('Regresi: kolom existing utuh & urutan sama', heads.join('|') === 'Kode|Nama|Kategori|Trading term|Lead time|Rating|PO|Status', heads.join('|'));
  const r1 = await p.$$eval('#sup-list tr[data-row="' + (data[0].name + ' ' + data[0].cat).toLowerCase() + '"] td', (t) => t.map((x) => x.innerText.trim()));
  ok('Regresi: isi baris SUP-001 (term, lead time, rating, PO, status) tetap', /SUP-001/.test(r1[0]) && r1[3] === 'Net 30' && r1[4] === '3 hari' && /4\.6/.test(r1[5]) && /^\d+$/.test(r1[6]) && r1[7].length > 0, r1.join('|'));

  /* ---------- TC15: kategori kosong, duplikat, tidak valid ---------- */
  await S(() => {
    const s = HAWK.store.state;
    s.suppliers.push({ id: 'SUP-T1', name: 'Tes Kosong', cat: '', term: 'COD', leadDays: 1, rating: 4, onTime: 0.9, status: 'ACTIVE', city: 'X' });
    s.suppliers.push({ id: 'SUP-T2', name: 'Tes Linen Spasi', cat: ' linen ', term: 'COD', leadDays: 1, rating: 4, onTime: 0.9, status: 'ACTIVE', city: 'X' });
    s.suppliers.push({ id: 'SUP-T3', name: 'Tes Linen Kapital', cat: 'LINEN', term: 'COD', leadDays: 1, rating: 4, onTime: 0.9, status: 'ACTIVE', city: 'X' });
    s.suppliers.push({ id: 'SUP-T4', name: 'Tes Null', cat: null, term: 'COD', leadDays: 1, rating: 4, onTime: 0.9, status: 'ACTIVE', city: 'X' });
    HAWK.render();
  });
  await wait(250);
  const opts2 = await p.$$eval('#sup-cat option', (o) => o.map((x) => x.textContent));
  ok('TC15: kategori kosong / null tidak muncul sebagai pilihan', !opts2.some((o) => !o.trim() || o === 'null'), opts2.join('|'));
  ok('TC15: duplikat beda spasi/kapital digabung jadi satu pilihan "Linen"', opts2.filter((o) => o.trim().toLowerCase() === 'linen').length === 1 && opts2.includes('Linen'), opts2.join('|'));
  await pick('Linen');
  ok('TC15: memilih Linen menampilkan semua varian (3 supplier)', (await visible()).length === 3, (await visible()).join());
  await pick('Semua kategori');
  ok('TC15: supplier tanpa kategori tetap tampil di Semua kategori', (await visible()).length === total + 4);
  await p.reload();
  await wait(400);
  await S(() => localStorage.clear());
  await p.reload();
  await wait(400);
  await as('U-GAS');
  await go(33);
  ok('TC15: data uji dibersihkan, kembali 7 supplier', (await visible()).length === total);

  /* ---------- TC16: RBAC ---------- */
  for (const uid of ['U-PUR', 'U-FIN', 'U-OWN']) {
    await as(uid);
    await go(33);
    ok(`TC16: ${uid} melihat NV-33 dengan ${total} supplier & filter`, (await visible()).length === total && !!(await p.$('#sup-cat')));
  }
  await as('U-STF');
  await go(33);
  ok('TC16: role di luar PUR/FIN/BUM/OWN tetap "Akses dibatasi" (RBAC tidak berubah)', /Akses dibatasi/.test(await p.innerText('#view')) && !(await p.$('#sup-cat')));
  await as('U-GAS');
  await go(33);

  /* ---------- keyboard ---------- */
  await p.focus('[data-in="flt"]');
  await p.keyboard.press('Tab');
  ok('Keyboard: Tab dari Search pindah ke dropdown Kategori', (await S(() => document.activeElement.id)) === 'sup-cat');
  await p.keyboard.press('Tab');
  ok('Keyboard: Tab dari dropdown pindah ke tombol Reset', (await S(() => document.activeElement.id)) === 'sup-reset');
  await pick('Linen');
  await p.focus('#sup-reset');
  await p.keyboard.press('Enter');
  await wait(250);
  ok('Keyboard: Enter pada Reset mengembalikan filter', (await p.inputValue('#sup-cat')) === '' && (await visible()).length === total);
  ok('Aksesibilitas: dropdown & Search punya aria-label, jumlah hasil aria-live', !!(await p.$('#sup-cat[aria-label]')) && !!(await p.$('[data-in="flt"][aria-label]')) && !!(await p.$('#sup-count[aria-live]')));

  /* ---------- EN ---------- */
  const en = await S(() => !!window.HAWK_I18N);
  if (en) {
    await S(() => HAWK_I18N.set('en'));
    await wait(300);
    ok('EN: jumlah hasil diterjemahkan', /Showing 7 of 7 suppliers/.test(await p.innerText('#sup-count')), await p.innerText('#sup-count'));
    await search('zzz');
    await wait(300);
    ok('EN: jumlah & empty state ikut diterjemahkan setelah filter berubah', /Showing 0 of 7 suppliers/.test(await p.innerText('#sup-count')) && /Supplier not found/.test(await p.innerText('#sup-list')), (await p.innerText('#sup-count')) + ' / ' + (await p.innerText('#sup-empty')));
    ok('EN: "All categories" pada dropdown', (await p.$eval('#sup-cat option', (o) => o.textContent)) === 'All categories');
    await S(() => HAWK_I18N.set('id'));
    await wait(300);
    await reset();
    ok('ID: kembali ke Bahasa Indonesia', (await count()) === `Menampilkan ${total} dari ${total} supplier`, await count());
  } else ok('EN: modul i18n tersedia', false, 'HAWK_I18N tidak ditemukan');

  /* ---------- responsif ---------- */
  for (const [label, w, h] of [['iPad', 820, 1180], ['mobile', 390, 844]]) {
    await p.setViewportSize({ width: w, height: h });
    await go(33);
    const fit = await S(() => { const vw = document.documentElement.clientWidth; return ['[data-in="flt"]', '#sup-cat', '#sup-reset', '#sup-count'].every((s) => { const r = document.querySelector(s).getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.right <= vw + 1; }) && document.documentElement.scrollWidth <= vw + 1; });
    ok(`Responsif ${label} ${w}px: kontrol filter terlihat penuh, tanpa scroll horizontal halaman`, fit);
    await pick('BHP Treatment');
    ok(`Responsif ${label}: filter tetap berfungsi`, (await visible()).length === 2);
    await reset();
    if (label === 'mobile') await shot('04-mobile');
  }

  ok('Tidak ada error JavaScript / console selama tes', errs.length === 0, errs.join(' | '));
  await b.close();
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass} lulus, ${results.length - pass} gagal`);
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
