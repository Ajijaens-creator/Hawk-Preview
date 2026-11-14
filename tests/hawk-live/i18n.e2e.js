/* HAWK · uji tombol bahasa ID/EN (pojok kanan atas, standar terkunci Aji 2026-11-14).
   Default ID; EN menerjemahkan shell, sidebar, judul & deskripsi; pilihan tersimpan; kembali ke ID memulihkan teks persis.
   python3 -m http.server 8811 lalu node tests/hawk-live/i18n.e2e.js */
'use strict';
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
const PAGES = [['operational.html', 'Operational'], ['commercial.html', 'Commercial'], ['sales.html', 'Sales'], ['hrd.html', 'HRD'], ['index.html', null], ['portal.html', null]];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  for (const [f] of PAGES) {
    await page.goto(BASE + f); await page.waitForTimeout(500);
    const tog = await page.evaluate(() => { const t = document.querySelector('.topbar .lang-tog'); if (!t) return null; const bar = t.parentElement; const kids = [...bar.children]; return { ids: [...t.querySelectorAll('button')].map(b => b.textContent), right: kids.indexOf(t) > kids.findIndex(k => k.classList.contains('tb-spacer')), on: t.querySelector('.on')?.textContent, lang: document.documentElement.lang }; });
    ok(`${f}: tombol ID/EN di kanan atas topbar, default ID`, tog && tog.ids.join() === 'ID,EN' && tog.right && tog.on === 'ID' && tog.lang === 'id', JSON.stringify(tog));
  }
  await page.goto(BASE + 'hrd.html#hrd-leave'); await page.waitForTimeout(600);
  const idText = await page.evaluate(() => document.querySelector('.app').innerText);
  ok('ID: sidebar & judul tetap Bahasa Indonesia', /Izin & Cuti/.test(idText) && /Karyawan/.test(idText));
  await page.click('.lang-tog [data-lang=en]'); await page.waitForTimeout(250);
  const en = await page.evaluate(() => ({ nav: document.querySelector('#nav').innerText, h1: document.querySelector('.page-head h1').textContent, p: document.querySelector('.page-head p').textContent, banner: document.querySelector('.demo-banner').innerText, lang: document.documentElement.lang, role: document.querySelector('#role').closest('label').firstChild.textContent }));
  ok('EN: sidebar diterjemahkan', /Leave & Permits/.test(en.nav) && /Employees/.test(en.nav) && /Attendance/.test(en.nav) && !/Izin & Cuti|Kehadiran/.test(en.nav), en.nav.slice(0, 80));
  ok('EN: judul & deskripsi halaman', en.h1 === 'Leave & Permits' && /^Leave balance/.test(en.p), en.h1);
  ok('EN: banner demo & html lang', /PROTOTYPE — DEMO \/ SIMULATION/.test(en.banner) && en.lang === 'en');
  ok('EN: kode NV tetap tersembunyi, data-nv tetap ada', await page.evaluate(() => !!document.querySelector('#nav a[data-nv="F2-NV06"]') && getComputedStyle(document.querySelector('#nav .nvc')).display === 'none'));
  await page.evaluate(() => { location.hash = 'hrd-roster'; }); await page.waitForTimeout(300);
  ok('EN: layar yang dirender ulang ikut diterjemahkan', await page.evaluate(() => document.querySelector('.page-head h1').textContent === 'Employee Directory'));
  await page.goto(BASE + 'commercial.html'); await page.waitForTimeout(500);
  ok('EN tersimpan antar halaman/portal', await page.evaluate(() => document.documentElement.lang === 'en' && document.querySelector('.lang-tog .on').textContent === 'EN' && /Team Performance/.test(document.querySelector('#nav').textContent)));
  await page.goto(BASE + 'commercial.html#commercial-dx'); await page.waitForTimeout(1200);
  const dx = await page.evaluate(() => { const f = document.querySelector('iframe'); return { tutor: document.body.textContent, frameLang: f && f.contentDocument ? f.contentDocument.documentElement.lang : 'n/a' }; });
  ok('EN: Demo Experience Center (tutor & iframe) ikut EN', /scenario|STEP 1 OF/i.test(dx.tutor) && dx.frameLang === 'en', dx.frameLang);
  await page.goto(BASE + 'hrd.html#hrd-leave'); await page.waitForTimeout(500);
  await page.click('.lang-tog [data-lang=id]'); await page.waitForTimeout(250);
  const back = await page.evaluate(() => document.querySelector('.app').innerText);
  ok('Kembali ke ID memulihkan teks persis', back === idText);
  await page.reload(); await page.waitForTimeout(400);
  ok('ID tersimpan setelah reload', await page.evaluate(() => document.documentElement.lang === 'id'));
  /* app Finance 60 NV (portal Finance): tombol yang sama, pilihan bersama */
  await page.click('.lang-tog [data-lang=en]'); await page.waitForTimeout(200);
  await page.goto(BASE + 'finance.html'); await page.waitForTimeout(1500);
  const nv = await page.evaluate(() => ({ url: location.href, tog: !!document.querySelector('#topbar .lang-tog'), on: document.querySelector('#topbar .lang-tog .on')?.textContent, side: document.querySelector('aside, .side, nav')?.textContent || '' }));
  ok('Portal Finance (app 60 NV): tombol ID/EN di topbar, ikut EN', nv.tog && nv.on === 'EN' && /Home & Tasks/.test(nv.side) && !/Beranda & Tugas/.test(nv.side), nv.url);
  await page.evaluate(() => { location.hash = '#/nv/48'; }); await page.waitForTimeout(500);
  ok('App 60 NV: tombol tetap ada setelah topbar dirender ulang', await page.evaluate(() => !!document.querySelector('#topbar .lang-tog')));
  await page.click('#topbar .lang-tog [data-lang=id]'); await page.waitForTimeout(200);
  ok('App 60 NV: kembali ke ID', await page.evaluate(() => /Beranda & Tugas/.test(document.querySelector('aside, .side, nav').textContent)));
  /* mobile: tombol tetap terlihat & tidak ada scroll horizontal */
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(BASE + 'sales.html'); await m.waitForTimeout(500);
  ok('Mobile 390px: tombol terlihat, tanpa scroll horizontal', await m.evaluate(() => { const r = document.querySelector('.lang-tog').getBoundingClientRect(); return r.width > 0 && r.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth; }));
  ok('Tanpa error halaman', errs.length === 0, errs.join(' | '));
  await browser.close();
  console.log(`${fail ? 'GAGAL' : 'LULUS'} · ${fail} gagal`);
  process.exit(fail ? 1 : 0);
})();
