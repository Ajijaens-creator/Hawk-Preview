/* HAWK Commercial · NP-COM-SM-001 Date Range Filter di F2-06 Social Media (Playwright, klik nyata)
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/social-date-range.e2e.js
   DATA DEMO / SIMULASI · tanggal acuan demo 2026-08-22 (WITA) */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
const out = []; let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; out.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/net::ERR_/.test(m.text())) errors.push(m.text()); });
  const go = async (r) => { await p.goto(BASE + 'commercial.html#' + r); await p.waitForTimeout(150); };
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true }); };
  const F = '#social-range';
  const hash = () => p.evaluate(() => decodeURIComponent(location.hash));
  const val = (n) => p.inputValue(`${F} [name=${n}]`);
  const active = () => p.locator('.active-filters').innerText();
  const chips = () => p.locator('.chips .status-chip').allInnerTexts();
  const rowsText = () => p.locator('.tbl tbody').first().innerText();
  const apply = async () => { await p.click(`${F} button[type=submit]`); await p.waitForTimeout(200); };
  await go('screens'); await p.click('[data-action=reset]'); await p.waitForTimeout(100);

  /* T01 default Bulan Ini */
  await go('social');
  ok('T01 Default Bulan Ini: preset month, 1–22 Agu 2026', (await val('range')) === 'month' && (await val('start')) === '2026-08-01' && (await val('end')) === '2026-08-22');
  ok('T01 Label periode aktif', /Bulan Ini · 1 Agu 2026 – 22 Agu 2026/.test(await active()), await active());
  ok('T01 Input tanggal dibatasi max = tanggal acuan', (await p.getAttribute(`${F} [name=end]`, 'max')) === '2026-08-22' && (await p.getAttribute(`${F} [name=start]`, 'max')) === '2026-08-22');
  ok('T01 Lima preset + Custom tersedia', JSON.stringify(await p.locator(`${F} [name=range] option`).allInnerTexts()) === JSON.stringify(['Hari Ini', '7 Hari Terakhir', '30 Hari Terakhir', 'Bulan Ini', 'Bulan Lalu', 'Custom']));
  await shot('social-default');

  /* T02 Calendar status split (default) */
  ok('T02 Calendar: Published 1, Scheduled 2, Overdue 0, Draft 0', JSON.stringify(await chips()) === JSON.stringify(['Published · 1', 'Scheduled / Upcoming · 2', 'Overdue · 0', 'Draft · 0']), (await chips()).join(' | '));

  /* T03 preset tidak diterapkan sebelum Terapkan */
  const h0 = await hash();
  await p.selectOption(`${F} [name=range]`, '7d'); await p.waitForTimeout(150);
  ok('T03 Pilih preset mengisi tanggal 16–22 Agu', (await val('start')) === '2026-08-16' && (await val('end')) === '2026-08-22');
  ok('T03 Belum diterapkan: URL & label tidak berubah', (await hash()) === h0 && /Bulan Ini/.test(await active()));
  await p.selectOption(`${F} [name=platform]`, 'Instagram'); await p.waitForTimeout(150);
  ok('T03 Ganti platform juga menunggu Terapkan', (await hash()) === h0);
  await apply();
  ok('T03 Terapkan → URL berisi range=7d & platform', /range=7d/.test(await hash()) && /platform=Instagram/.test(await hash()), await hash());
  ok('T03 Label 7 Hari Terakhir · Instagram', /7 Hari Terakhir · 16 Agu 2026 – 22 Agu 2026 · Instagram/.test(await active()));

  /* T04 Hari Ini: upcoming tetap tampil, Published 0 */
  await p.selectOption(`${F} [name=range]`, 'today'); await p.selectOption(`${F} [name=platform]`, ''); await apply();
  ok('T04 Hari Ini: Published 0, Scheduled/Upcoming 2 tetap tampil', JSON.stringify(await chips()) === JSON.stringify(['Published · 0', 'Scheduled / Upcoming · 2', 'Overdue · 0', 'Draft · 0']), (await chips()).join(' | '));
  ok('T04 PUB-001 (terbit 5 Agu) tidak tampil', !(await rowsText()).includes('IG-DEMO-1001'));

  /* T05 Inbox mengikuti rentang */
  await go('social?view=inbox&range=today');
  let t = await rowsText();
  ok('T05 Inbox Hari Ini: CONV 22 Agu tampil, 21 Agu tidak', t.includes('2026-08-22 09:12') && t.includes('2026-08-22 08:40') && !t.includes('2026-08-21'), t.split('\n').length + ' baris');
  ok('T05 Badge Inbox = percakapan terbuka di rentang (2)', (await p.locator('.tabs a', { hasText: 'Inbox' }).locator('.c').innerText()) === '2');
  await go('social?view=inbox&range=lastmonth');
  ok('T05 Inbox Bulan Lalu kosong + pesan', (await p.locator('.tbl .empty-cell').count()) === 1 && /Tidak ada data untuk filter ini/.test(await rowsText()));

  /* T06 Handoff DM → Sales tetap jalan & tidak ganda */
  await go('social?view=inbox&range=month');
  await p.locator('[data-action="cx:conv-handoff"][data-id="CONV-001"]').click(); await p.waitForTimeout(150);
  await p.evaluate(() => window.HL.apply('cx:conv-handoff', { id: 'CONV-001' })); await p.waitForTimeout(100);
  const lead = await p.evaluate(() => window.HL.state.cx.mk.convs.find(c => c.id === 'CONV-001').lead);
  ok('T06 Alih DM → lead Sales, retry tetap satu lead', /^LEAD-/.test(lead) && await p.evaluate((l) => window.HL.state.leads.filter(x => x.id === l).length === 1, lead), lead);
  ok('T06 Filter tetap setelah aksi', /range=month/.test(await hash()) || /Bulan Ini/.test(await active()));

  /* T07 Analytics: angka bulanan berlabel, ER tidak berubah */
  await go('social?view=analytics&range=month&platform=Instagram');
  let a = await p.locator('#view').innerText();
  ok('T07 Analytics Bulan Ini memakai angka bulanan Agustus berlabel', /Bulanan · Agustus 2026/.test(a) && /bukan angka harian/.test(a));
  ok('T07 ER Instagram Agustus = 23.800 ÷ 298.000 = 7,99%', /298\.000/.test(a) && /7,99%/.test(a));
  await go('social?view=analytics&range=lastmonth');
  a = await p.locator('#view').innerText();
  ok('T07 Bulan Lalu → angka Juli 2026', /Bulanan · Juli 2026/.test(a) && /bukan angka harian/.test(a));
  ok('T07 Publish vs aset Bulan Lalu = 0 terbit + pesan kosong', /Publikasi terbit\s*0/.test(a) && /Tidak ada publikasi terbit/.test(a));
  await go('social?view=analytics&range=30d');
  ok('T07 30 Hari (lintas bulan) → pesan, tidak menjumlah antarbulan', (await p.locator('.empty-state').count()) >= 1 && /melewati lebih dari satu bulan/.test(await p.locator('#view').innerText()));
  await shot('social-analytics-30d');

  /* T08 Unit Growth */
  await go('social?view=units&range=month');
  ok('T08 Unit Growth Agustus dengan pembanding Juli', /Agustus 2026/.test(await p.locator('#view').innerText()) && /Pembanding = Juli 2026/.test(await p.locator('#view').innerText()));
  await go('social?view=units&range=lastmonth');
  ok('T08 Unit Growth Juli: pembanding Juni tidak tersedia', /Juni 2026 \(data tidak tersedia/.test(await p.locator('#view').innerText()));

  /* T09 validasi custom */
  await go('social');
  await p.fill(`${F} [name=start]`, '2026-08-10'); await p.fill(`${F} [name=end]`, '2026-08-30'); await p.waitForTimeout(100);
  ok('T09 Ubah tanggal manual → preset Custom', (await val('range')) === 'custom');
  const h1 = await hash(); await apply();
  ok('T09 Tanggal masa depan ditolak, tidak diterapkan', /masa depan/.test(await p.locator(`${F} .field-error`).innerText()) && (await hash()) === h1);
  await p.fill(`${F} [name=start]`, '2026-08-15'); await p.fill(`${F} [name=end]`, '2026-08-05'); await apply();
  ok('T09 Mulai > selesai ditolak', /tidak boleh setelah/.test(await p.locator(`${F} .field-error`).innerText()) && (await hash()) === h1);
  await p.fill(`${F} [name=start]`, '2026-08-05'); await p.fill(`${F} [name=end]`, '2026-08-05'); await apply();
  ok('T09 Rentang 1 hari inklusif: PUB-001 terbit 5 Agu 18:02 masuk', /range=custom/.test(await hash()) && (await chips())[0] === 'Published · 1');
  await go('social?range=custom&start=2026-08-01&end=2026-09-30');
  ok('T09 URL dengan tanggal masa depan → default + pesan', /masa depan/.test(await p.locator('.field-error').innerText()) && /Bulan Ini/.test(await active()));

  /* T10 refresh & navigasi */
  await go('social?view=calendar&range=custom&start=2026-08-03&end=2026-08-06');
  await p.reload(); await p.waitForTimeout(200);
  ok('T10 Refresh mempertahankan rentang', (await val('start')) === '2026-08-03' && (await val('end')) === '2026-08-06');
  await p.click('.tabs a:has-text("Inbox")'); await p.waitForTimeout(150);
  ok('T10 Pindah tab mempertahankan rentang', /start=2026-08-03/.test(await hash()) && (await val('end')) === '2026-08-06');
  await p.goBack(); await p.waitForTimeout(150);
  ok('T10 Back kembali ke Calendar dengan rentang sama', /view=calendar/.test(await hash()) && (await val('start')) === '2026-08-03');

  /* T11 parameter lama & reset */
  await go('social?view=analytics&period=2026-07');
  ok('T11 Link lama period=2026-07 → Custom 1–31 Jul', (await val('start')) === '2026-07-01' && (await val('end')) === '2026-07-31');
  await p.click(`${F} [data-action=filter-reset]`); await p.waitForTimeout(200);
  ok('T11 Reset → Bulan Ini, view tetap', (await val('range')) === 'month' && /view=analytics/.test(await hash()));

  /* T12 Overdue: jadwal lewat, belum terbit; tidak dihitung Published */
  await p.evaluate(() => { const s = window.HL.state; const pb = s.cx.publications.find(x => x.id === 'PUB-002'); pb.scheduledAt = '2026-08-20 18:00'; });
  await go('social?range=month&v=1');
  ok('T12 Jadwal 20 Agu belum terbit → Overdue, Published tetap 1', JSON.stringify(await chips()) === JSON.stringify(['Published · 1', 'Scheduled / Upcoming · 1', 'Overdue · 1', 'Draft · 0']), (await chips()).join(' | '));
  ok('T12 Data publikasi tidak diubah (status tetap scheduled)', await p.evaluate(() => window.HL.state.cx.publications.find(x => x.id === 'PUB-002').status === 'scheduled'));

  /* T13 layar lain tetap auto-apply (#filters global tidak berubah) */
  await go('commercial');
  await p.selectOption('#filters [name=period]', '2026-07'); await p.waitForTimeout(200);
  ok('T13 Executive Summary tetap auto-apply filter', /period=2026-07/.test(await hash()));

  ok('Tanpa error JavaScript', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'social-date-range-results.json'), JSON.stringify({ at: new Date().toISOString(), pass: out.filter(x => x.ok).length, fail, out }, null, 2));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`);
  process.exit(fail ? 1 : 0);
})();
