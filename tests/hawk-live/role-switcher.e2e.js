/* HAWK 5 Portal · "Ganti role DEMO" dari chip akun kanan atas (Operational, Commercial, Sales, HRD). Frontend saja.
   python3 -m http.server 8811 dari hawk-erp-preview/, lalu node tests/hawk-live/role-switcher.e2e.js (SHOTS=dir untuk screenshot) */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const shot = async (n) => { if (SHOTS) { await p.waitForTimeout(200); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } };
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const go = async (page, hash = '') => { await p.goto(BASE + page + (hash ? '#' + hash : '')); await p.waitForTimeout(450); };
  const chipName = () => p.textContent('.topbar #role-name');
  const openPop = async () => { await p.click('.topbar .role-chip'); await p.waitForTimeout(150); };
  const names = () => p.$$eval('#hl-role-pop [data-rs] b', bs => bs.map(b => b.textContent));
  const pick = async (name) => { await p.click(`#hl-role-pop [data-rs]:has(b:text-is("${name}"))`); await p.waitForTimeout(400); };

  await go('operational.html', 'op-dashboard'); await ev(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);

  /* Operational */
  ok('Chip akun menjadi tombol menu', await ev(() => { const c = document.querySelector('.topbar .role-chip'); return c.getAttribute('role') === 'button' && c.getAttribute('aria-haspopup') === 'menu' && c.tabIndex === 0; }));
  await openPop();
  const opsNames = await names();
  ok('Operational: popover "Ganti role DEMO · bukan login"', await ev(() => { const h = document.querySelector('#hl-role-pop.on .pop-head'); return !!h && /Ganti role DEMO/.test(h.textContent) && /bukan login/.test(h.textContent); }));
  ok('Operational: semua akun demo tersedia, dikelompokkan per outlet', opsNames.length === (await ev(() => OPX.accounts.length)) && (await p.$$('#hl-role-pop .rs-grp')).length === 5, `${opsNames.length} akun`);
  ok('Operational: akun aktif ditandai', await ev(() => document.querySelector('#hl-role-pop .pop-item.cur b')?.textContent === OPX.user().name));
  await shot('RS-01-operational-menu');
  await pick('Mila');
  ok('Operational: satu klik → masuk sebagai Mila (Supervisor Ubud)', (await ev(() => OPX.user().id)) === 'spv-CTR' && (await chipName()) === 'Mila');
  ok('Operational: popover tertutup setelah memilih', !(await ev(() => document.getElementById('hl-role-pop').classList.contains('on'))));
  await openPop(); await pick('Reception Ubud');
  ok('Operational: ganti lagi ke Reception, menu sidebar mengikuti akses', (await ev(() => OPX.user().role)) === 'reception' && (await chipName()) === 'Reception Ubud' && (await ev(() => [...document.querySelectorAll('#nav a[href^="#op-strategic"]')].every(a => a.hidden || a.closest('[hidden]')))));
  await openPop(); await pick('Eni Restini');
  ok('Operational: kembali ke Eni Restini', (await ev(() => OPX.user().id)) === 'mgr-eni');
  await openPop(); await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  ok('Escape menutup popover dan fokus kembali ke chip', await ev(() => !document.getElementById('hl-role-pop').classList.contains('on') && document.activeElement.classList.contains('role-chip')));
  await p.keyboard.press('Enter'); await p.waitForTimeout(150); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  ok('Keyboard: Enter → panah → Enter memilih akun berikutnya', (await ev(() => OPX.user().id)) === 'asm-tika', await ev(() => OPX.user().id));

  /* Commercial */
  await go('commercial.html'); await openPop();
  const comNames = await names();
  ok('Commercial: tim Commercial + Owner, tanpa divisi lain', ['Commercial Manager', 'Rani', 'Bayu', 'Wulan', 'Owner'].every(n => comNames.includes(n)) && !comNames.includes('Asri') && !comNames.includes('Mila'), comNames.join(', '));
  await shot('RS-02-commercial-menu');
  await pick('Bayu');
  ok('Commercial: satu klik → Bayu (role + persona + member)', (await chipName()) === 'Bayu' && await ev(() => HL.prefs.persona === 'bayu' && HL.prefs.role === 'commercial-manager' && HL.prefs.member === 'MBR-C02'));
  await p.reload(); await p.waitForTimeout(450);
  ok('Commercial: akun tetap setelah reload', (await chipName()) === 'Bayu');
  await openPop(); await pick('Owner');
  ok('Commercial: ganti ke Owner', (await chipName()) === 'Owner' && await ev(() => HL.prefs.role === 'owner'));

  /* Sales */
  await go('sales.html'); await openPop();
  const salNames = await names();
  ok('Sales: tim Sales + Owner', ['Sales Manager', 'Dewa', 'Sales B2B', 'Owner'].every(n => salNames.includes(n)) && !salNames.includes('Mila'), salNames.join(', '));
  await pick('Dewa');
  ok('Sales: satu klik → Dewa (Staf Reservasi B2C)', (await chipName()) === 'Dewa' && await ev(() => HL.prefs.role === 'reservation-staff'));
  await shot('RS-03-sales-dewa');

  /* HRD */
  await go('hrd.html'); await openPop();
  const hrdNames = await names();
  ok('HRD: akun bernama tim HRD dari pilihan Role demo', hrdNames.length >= 4 && await ev(() => [...document.querySelectorAll('#hl-role-pop .rs-grp')].some(g => /Tim HRD/.test(g.textContent))), hrdNames.join(', '));
  await shot('RS-04-hrd-menu');
  const harja = hrdNames.find(n => /Harja/.test(n));
  await pick(harja);
  ok('HRD: satu klik → Harja (Koordinator Rekrutmen)', /Harja/.test(await chipName()) && await ev(() => HL.prefs.role === 'hrd-ops'));

  /* mobile */
  await p.setViewportSize({ width: 390, height: 844 });
  await go('operational.html', 'op-dashboard'); await openPop();
  ok('Mobile 390px: popover di dalam layar, tanpa scroll horizontal', await ev(() => { const r = document.getElementById('hl-role-pop').getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth && document.documentElement.scrollWidth - window.innerWidth <= 1; }));
  await shot('RS-05-mobile-operational');
  ok('Tanpa error konsol', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? `GAGAL · ${fail} gagal` : 'LULUS · 0 gagal');
  process.exit(fail ? 1 : 0);
})();
