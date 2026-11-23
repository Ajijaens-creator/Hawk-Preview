/* HAWK HRD · NP-HR-F2-NV04-SEARCH-001 Search di Presensi (F2-NV04), uji T01–T15 (Playwright, ketik nyata)
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/hrd-presence-search.e2e.js
   DATA DEMO / SIMULASI */
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
  const go = async (r) => { await p.goto(BASE + 'hrd.html#' + r); await p.waitForTimeout(150); };
  const shot = async (n, full = false) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: full }); };
  const S = '#filters [name=q]';
  const rows = () => p.locator('.tbl tbody tr').count();
  const ids = () => p.locator('.tbl tbody tr td:first-child').allInnerTexts();
  const kpis = () => p.locator('#view .kpi .val').allInnerTexts();
  const hash = () => p.evaluate(() => decodeURIComponent(location.hash));
  const type = async (v) => { await p.fill(S, ''); await p.waitForTimeout(350); await p.locator(S).pressSequentially(v, { delay: 20 }); await p.waitForTimeout(400); };
  await go('hrd-home'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(200);
  await p.selectOption('#role', 'hrd'); await p.waitForTimeout(150);

  const D = '2026-11-12';
  await go(`hrd-presence?date=${D}`);
  const allIds = await ids(), statsAll = await kpis();
  const first = await p.locator('.tbl tbody tr').first().innerText();
  const [attId] = first.split('\t'); const emp = attId.replace(/^ATT-\d{8}-/, '');
  const name = (await p.locator('.tbl tbody tr').first().locator('td').nth(1).innerText()).trim();

  /* T01 tampilan & urutan */
  const order = await p.locator('#filters > label, #filters > button').evaluateAll(els => els.map(e => e.tagName === 'BUTTON' ? e.innerText.trim() : e.childNodes[0].textContent.trim()));
  const ph = await p.getAttribute(S, 'placeholder');
  const hS = (await p.locator(S).boundingBox()).height, hSh = (await p.locator('#filters [name=shift]').boundingBox()).height;
  const wS = (await p.locator(S).boundingBox()).width;
  const icon = await p.locator('.hr-search-box svg').count();
  const btns = await p.locator('#filters button').allInnerTexts();
  ok('T01 Search tampil: urutan Tanggal → Outlet → Shift → Search → Reset, placeholder, ikon kiri, tinggi = Shift, lebar 300–360 px, tanpa tombol cari', order.join(' → ') === 'Tanggal → Outlet → Shift → Search → Reset' && ph === 'Cari nama / ID / Attendance ID' && icon === 1 && Math.abs(hS - hSh) < 1 && wS >= 300 && wS <= 360 && btns.join() === 'Reset', `${order.join(' → ')} · h ${hS}/${hSh} · w ${Math.round(wS)}`);
  await shot('NV04-search-desktop-awal');

  /* T02 nama lengkap */
  await type(name);
  ok('T02 Cari nama lengkap → baris karyawan tsb', (await ids()).includes(attId) && (await p.locator('.tbl tbody').innerText()).includes(name), `${name}: ${await rows()} baris`);
  /* T03 sebagian nama, huruf besar/kecil, spasi */
  const part = name.split(' ')[0].slice(0, 3);
  await type(`  ${part.toUpperCase()}  `);
  const tx = await p.locator('.tbl tbody').innerText();
  ok('T03 Sebagian nama, case-insensitive, spasi di-trim', (await rows()) > 0 && tx.split('\n').every(l => l.toLowerCase().includes(part.toLowerCase())), `"${part.toUpperCase()}" → ${await rows()} baris`);
  /* T04 Employee ID */
  await type(emp.toLowerCase());
  ok('T04 Cari Employee ID → tepat 1 baris', (await ids()).join() === attId, emp);
  /* T05 Attendance ID */
  await type(attId);
  ok('T05 Cari Attendance ID → tepat 1 baris', (await ids()).join() === attId, attId);
  await shot('NV04-search-desktop-hasil');
  /* T10 statistik tidak berubah */
  ok('T10 Kartu Hadir / Terlambat / Cuti-sakit-libur / Belum Ada Status tidak berubah karena Search', JSON.stringify(await kpis()) === JSON.stringify(statsAll), (await kpis()).join(' · '));
  /* T09 tidak ditemukan */
  await type('zzqx-tidak-ada');
  const tv = await p.locator('#view').innerText();
  ok('T09 Tidak ditemukan → "Data presensi tidak ditemukan." + saran', tv.includes('Data presensi tidak ditemukan.') && tv.includes('Coba gunakan nama atau ID lainnya.') && (await rows()) === 0 && JSON.stringify(await kpis()) === JSON.stringify(statsAll));
  await shot('NV04-search-desktop-kosong');

  /* T06 + Outlet */
  await go(`hrd-presence?date=${D}&outlet=OUT-UBD`); const ubd = await ids(), statsUbd = await kpis();
  await type('EMP-');
  ok('T06 Search + Outlet: hanya baris outlet terpilih, kartu = kartu outlet', JSON.stringify(await ids()) === JSON.stringify(ubd.slice(0, 80)) && JSON.stringify(await kpis()) === JSON.stringify(statsUbd) && (await p.inputValue('#filters [name=outlet]')) === 'OUT-UBD');
  /* T07 + Shift */
  await go(`hrd-presence?date=${D}`);
  await p.selectOption('#filters [name=shift]', { index: 1 }); await p.waitForTimeout(200);
  const shiftOpt = await p.inputValue('#filters [name=shift]');
  const shRows = await p.locator('.tbl tbody tr td:nth-child(3)').allInnerTexts(), statsSh = await kpis();
  const partSh = (await p.locator('.tbl tbody tr').first().locator('td').nth(1).innerText()).trim().split(' ')[0];
  await type(partSh);
  const shAfter = await p.locator('.tbl tbody tr td:nth-child(3)').allInnerTexts();
  ok('T07 Search + Shift: hasil tetap di shift terpilih', shAfter.length > 0 && shAfter.every(s => s === shiftOpt) && shAfter.length <= shRows.length && JSON.stringify(await kpis()) === JSON.stringify(statsSh), `${shiftOpt} + "${partSh}": ${shRows.length} → ${shAfter.length}`);
  /* T08 + Tanggal (pilih tanggal lain, Search dipertahankan) */
  await go(`hrd-presence?date=${D}&q=${emp}`);
  await p.selectOption('#filters [name=date]', '2026-11-11'); await p.waitForTimeout(200);
  ok('T08 Search + Tanggal: ganti tanggal, kata kunci tetap, Attendance ID ikut tanggal', (await p.inputValue(S)) === emp && (await ids()).join() === `ATT-20261111-${emp}`);

  /* T11 Reset */
  await go(`hrd-presence?date=2026-11-11&outlet=OUT-UBD&shift=${shiftOpt}&q=${part}`);
  await p.click('#filters [data-action=filter-reset]'); await p.waitForTimeout(200);
  const h11 = await hash();
  ok('T11 Reset mengosongkan Search + Tanggal/Outlet/Shift ke default', (await p.inputValue(S)) === '' && (await p.inputValue('#filters [name=outlet]')) === '' && (await p.inputValue('#filters [name=shift]')) === '' && !/[?&](q|outlet|shift|date)=/.test(h11), h11);

  /* T12 real-time + debounce + fokus */
  await go(`hrd-presence?date=${D}`);
  await p.click(S); await p.keyboard.type(emp, { delay: 10 });
  await p.waitForTimeout(120); const early = await rows();
  await p.waitForTimeout(400); const late = await rows();
  const focus = await p.evaluate(() => document.activeElement?.name === 'q' && document.activeElement.selectionStart === document.activeElement.value.length);
  ok('T12 Real-time dengan debounce (~280 ms), tanpa tombol, fokus & kursor tetap di Search', early > 1 && late === 1 && focus, `${early} baris saat mengetik → ${late} setelah jeda`);
  /* T15 Enter tidak me-reload / submit */
  const urlBefore = p.url(); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  ok('T15a Enter tidak mengirim form / memuat ulang halaman', p.url().startsWith(urlBefore.split('?q')[0]) && !p.url().includes('hrd.html?') && (await rows()) === 1);

  /* T13 seluruh dataset (di luar 80 baris pertama) */
  await go(`hrd-presence?date=${D}`);
  const total = Number((await p.locator('.card h2').filter({ hasText: 'Harian' }).innerText()).match(/· (\d+) orang/)[1]);
  const shownBefore = await rows();
  await type('EMP-01');
  const deepIds = await ids();
  ok('T13 Search mencakup seluruh data dalam cakupan, bukan hanya 80 baris tampil', total > 80 && shownBefore === 80 && deepIds.some(i => !allIds.includes(i)), `${total} orang, 80 tampil; hasil memuat ${deepIds.filter(i => !allIds.includes(i)).length} baris di luar 80 pertama`);

  /* T14 responsif */
  for (const [w, label] of [[1440, 'desktop'], [900, 'tablet'], [390, 'mobile']]) {
    await p.setViewportSize({ width: w, height: w === 390 ? 844 : 950 });
    await go(`hrd-presence?date=${D}&q=${part}`);
    const tops = await p.locator('#filters > label, #filters > button').evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().bottom)));
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    const sb = await p.locator(S).boundingBox();
    const oneRow = new Set(tops).size === 1;
    const cond = label === 'desktop' ? oneRow : label === 'mobile' ? sb.width >= w - 80 : true;
    ok(`T14 ${label} ${w}px: ${label === 'desktop' ? 'satu baris' : label === 'tablet' ? 'membungkus rapi' : 'Search lebar penuh'}, tanpa scroll horizontal`, cond && sw <= w + 2, `scrollWidth ${sw} · baris filter ${new Set(tops).size} · lebar Search ${Math.round(sb.width)}`);
    await shot(`NV04-search-${label}`, label === 'mobile');
  }
  await p.setViewportSize({ width: 1440, height: 950 });

  /* T15b regresi: tautan lama ?q= (Ringkasan & dari Detail Karyawan) tetap bekerja */
  await go(`hrd-presence?tab=summary&q=${emp}`);
  ok('T15b Tab Ringkasan + ?q= lama tetap memfilter (Outlet → Search → Reset)', (await rows()) === 1 && (await p.inputValue(S)) === emp && (await p.locator('#filters > label').count()) === 2);
  await type('zzqx');
  ok('T15c Ringkasan tidak ditemukan → empty state yang sama', (await p.locator('#view').innerText()).includes('Data presensi tidak ditemukan.'));
  await go(`hrd-presence?date=${D}&correct=${attId}`);
  ok('T15d Koreksi presensi (alur lama) tetap tampil', (await p.locator('#view').innerText()).includes(`Ajukan koreksi · ${attId}`));
  ok('T15e Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-presence-search-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
