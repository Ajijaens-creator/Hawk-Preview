/* HAWK HRD · uji susunan sidebar (Aji 14 Nov 2026): kartu Demo Experience Center paling atas, kategori Dashboard
   (Dashboard HRD, Manpower Planning, 9-Box Talent, People Budgeting, Kinerja & KPI, AmbideX & Race), menu Workspace (dulu Tugas),
   FAQ paling bawah. python3 -m http.server 8811 lalu node tests/hawk-live/hrd-nav.e2e.js */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const out = []; let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; out.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.goto(BASE + 'hrd.html#hrd-home'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800);
  const first = await p.locator('#nav > *').first().getAttribute('class');
  ok('Kartu Demo Experience Center paling atas', /nav-dx/.test(first || ''));
  const sec = p.locator('#nav .nav-sec').first();
  ok('Kategori pertama: Dashboard', /^Dashboard$/i.test((await sec.locator('.nav-sec-btn').innerText()).trim()));
  const tops = await sec.locator(':scope > .nav-grp-kids > a, :scope > .nav-grp-kids > .nav-grp > .nav-grp-row > a').evaluateAll(as => as.map(a => a.innerText.trim()));
  ok('Isi Dashboard: Dashboard HRD, Manpower, 9-Box, People Budgeting, Kinerja & KPI, AmbideX & Race', JSON.stringify(tops) === JSON.stringify(['Dashboard HRD', 'Manpower Planning', '9-Box Talent', 'People Budgeting', 'Kinerja & KPI', 'AmbideX & Race']), tops.join(' | '));
  ok('Kategori Dashboard terbuka di Dashboard HRD', /open/.test(await sec.getAttribute('class')));
  ok('Halaman berjudul Dashboard HRD', /Dashboard HRD/.test(await p.locator('#view h1').innerText()));
  const all = await p.locator('#nav .nav-flat a').evaluateAll(as => as.map(a => a.innerText.trim()));
  ok('Tidak ada menu "Beranda" / "Tugas"', !all.includes('Beranda') && !all.includes('Tugas'));
  ok('Menu Workspace ada', all.includes('Workspace'));
  ok('FAQ paling bawah', all[all.length - 1] === 'FAQ', all[all.length - 1]);
  ok('Karyawan kembali ke tingkat atas (di luar Dashboard)', !(await sec.locator('a[href="#hrd-roster"]').count()) && (await p.locator('#nav a[href="#hrd-roster"]').count()) === 1);
  await p.click('#nav a[href="#hrd-tasks"]'); await p.waitForTimeout(300);
  ok('Workspace membuka halaman Workspace', /Workspace/.test(await p.locator('#view h1').innerText()));
  await p.evaluate(() => { location.hash = 'hrd-home'; }); await p.waitForTimeout(300);
  await p.click('#nav .nav-sec-btn'); await p.waitForTimeout(150);
  ok('Kategori Dashboard bisa ditutup', !/open/.test(await p.locator('#nav .nav-sec').first().getAttribute('class')) && !(await p.locator('#nav a[href="#hrd-home"]').isVisible()));
  ok('Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-nav-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
