/* HAWK HRD · NP-HAWK-HRD-F7-001 Search di Slip Gaji & Status Pembayaran (F7-NV05), uji TC-01–TC-17 + RBAC + responsif
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/hrd-payroll-search.e2e.js
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
  const names = () => p.locator('.tbl tbody tr td:first-child').allInnerTexts();
  const head = () => p.locator('.card h2').filter({ hasText: /^Slip · / }).first().innerText();
  const type = async (v) => { await p.fill(S, ''); await p.waitForTimeout(350); if (v) await p.locator(S).pressSequentially(v, { delay: 15 }); await p.waitForTimeout(420); };
  const setRole = async (r) => { await p.selectOption('#role', r); await p.waitForTimeout(150); };
  await go('hrd-home'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(200);
  await setRole('hrd');

  const R = 'hrd-pay-slip?period=2610';
  await go(R);
  const base = await names(), head0 = await head();
  const [nm, emp] = base[0].split(' · ');

  /* TC-01 posisi */
  const order = await p.locator('#filters > label, #filters > button').evaluateAll(els => els.map(e => e.tagName === 'BUTTON' ? e.innerText.trim() : e.childNodes[0].textContent.trim()));
  const ph = await p.getAttribute(S, 'placeholder');
  const hS = (await p.locator(S).boundingBox()).height, hP = (await p.locator('#filters [name=pay]').boundingBox()).height;
  ok('TC-01 Search setelah filter terakhir (Status bayar) dan sebelum Reset, label & placeholder sesuai NV, ikon kiri, tinggi = dropdown', order.join(' → ') === 'Cakupan → Status bayar → Search → Reset' && ph === 'Cari nama / ID...' && (await p.locator('.hr-pay-search svg').count()) === 1 && Math.abs(hS - hP) < 1, `${order.join(' → ')} · h ${hS}/${hP}`);
  await shot('F7-NV05-search-awal');

  await type(nm);
  ok('TC-02 Nama lengkap', (await names()).some(t => t.startsWith(nm + ' · ')), `${nm}: ${(await names()).length} baris`);
  const part = nm.split(' ')[0].slice(0, 3);
  await type(part);
  const r3 = await names();
  ok('TC-03 Sebagian nama', r3.length > 0 && r3.every(t => t.toLowerCase().includes(part.toLowerCase())), `"${part}" → ${r3.length}`);
  await type(emp);
  ok('TC-04 Employee ID lengkap', (await names()).length === 1 && (await names())[0].endsWith(emp), emp);
  await type('0001');
  const r5 = await names();
  ok('TC-05 Sebagian Employee ID', r5.length >= 1 && r5.every(t => t.includes('0001')), `"0001" → ${r5.length}`);
  await type(part.toUpperCase()); const up = await names(); await type(part.toLowerCase()); const lo = await names();
  ok('TC-06 Huruf besar/kecil sama', JSON.stringify(up) === JSON.stringify(lo) && up.length > 0, `${up.length} = ${lo.length}`);

  /* TC-07 otomatis + debounce + fokus */
  await go(R); await p.click(S); await p.keyboard.type(emp, { delay: 10 });
  await p.waitForTimeout(100); const early = (await names()).length; await p.waitForTimeout(420); const late = (await names()).length;
  const focus = await p.evaluate(() => document.activeElement?.name === 'q');
  ok('TC-07 Hasil diperbarui otomatis saat mengetik, tanpa klik/Enter, fokus tetap', early > 1 && late === 1 && focus, `${early} → ${late}`);
  await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  ok('TC-07b Enter tidak mengirim form / memuat ulang', !p.url().includes('hrd.html?') && (await names()).length === 1);

  /* TC-08/09/10 kombinasi filter */
  await go(R + '&scope=OUT-UBD'); const ubd = await names(); await type(part);
  const r8 = await names();
  ok('TC-08 Search mengikuti Cakupan', r8.length > 0 && r8.every(t => ubd.includes(t)) && (await p.inputValue('#filters [name=scope]')) === 'OUT-UBD', `Spa Ubud: ${ubd.length} → ${r8.length}`);
  await go(R + '&pay=Sudah Bayar'); const sb = await names(); const sbPart = sb[0].split(' · ')[0].split(' ')[0];
  await type(sbPart); const r9 = await names(); const st9 = await p.locator('.tbl tbody tr td:last-child').allInnerTexts();
  ok('TC-09 Search mengikuti Status bayar', r9.length > 0 && st9.every(s => s.trim() === 'Sudah Bayar'), `Sudah Bayar + "${sbPart}": ${sb.length} → ${r9.length}`);
  await go(R + '&scope=OUT-UBD&pay=Sudah Bayar'); const both = await names(); const bPart = both[0].split(' · ')[0].split(' ')[0];
  await type(bPart); const r10 = await names();
  ok('TC-10 Search dengan kedua filter aktif', r10.length > 0 && r10.every(t => both.includes(t)) && (await p.inputValue('#filters [name=scope]')) === 'OUT-UBD' && (await p.inputValue('#filters [name=pay]')) === 'Sudah Bayar', `${both.length} → ${r10.length}`);
  await shot('F7-NV05-search-hasil');

  /* TC-11 tombol X */
  const xVisible = await p.locator('[data-search-clear]').isVisible();
  await p.click('[data-search-clear]'); await p.waitForTimeout(200);
  ok('TC-11 Tombol X hanya menghapus Search; Cakupan & Status bayar tetap', xVisible && (await p.inputValue(S)) === '' && (await p.inputValue('#filters [name=scope]')) === 'OUT-UBD' && (await p.inputValue('#filters [name=pay]')) === 'Sudah Bayar' && (await p.locator('[data-search-clear]').count()) === 0);
  /* TC-15 hapus Search → daftar kembali sesuai filter aktif */
  ok('TC-15 Setelah Search dihapus, daftar kembali sesuai filter aktif', JSON.stringify(await names()) === JSON.stringify(both), `${(await names()).length} = ${both.length}`);

  /* TC-12 Reset */
  await go(R + '&scope=OUT-UBD&pay=Sudah Bayar&q=' + part);
  await p.click('#filters [data-action=filter-reset]'); await p.waitForTimeout(200);
  const h12 = await p.evaluate(() => decodeURIComponent(location.hash));
  ok('TC-12 Reset mengembalikan semua filter termasuk Search', (await p.inputValue(S)) === '' && (await p.inputValue('#filters [name=scope]')) === '' && (await p.inputValue('#filters [name=pay]')) === '' && !/[?&](q|scope|pay)=/.test(h12), h12);

  /* TC-13 empty state + TC-14 ringkasan */
  await go(R); await type('zzqx-tidak-ada');
  const tx = await p.locator('#view').innerText();
  ok('TC-13 Hasil kosong → "Data karyawan tidak ditemukan"', tx.includes('Data karyawan tidak ditemukan') && (await p.locator('.tbl tbody tr').count()) === 0);
  await go(R); await type(emp); const head14 = await head();
  ok('TC-14 Ringkasan (jumlah orang & total THP) tidak berubah karena Search', head14.startsWith(head0) && /1 hasil pencarian$/.test(head14), head14);
  await shot('F7-NV05-search-kosong');

  /* TC-16 spasi & karakter khusus */
  await type(`  ${emp}  `); const r16a = await names();
  let bad = false; for (const s of ['(', '[', '.*', '\\', '%', '"<b>x</b>', '?']) { await type(s); if (errors.length) bad = true; }
  const htmlOk = await p.locator('#view b:text("x")').count() === 0;
  ok('TC-16 Spasi di-trim; karakter khusus ( [ .* \\ % ? dan HTML tidak menimbulkan error/eksekusi', r16a.length === 1 && !bad && htmlOk && errors.length === 0, errors.slice(0, 2).join(' | '));

  /* TC-17 batas 60 baris berlaku atas hasil pencarian */
  await go(R); const total = Number((await head()).match(/· (\d+) orang/)[1]);
  ok('TC-17a Tanpa Search: batas tampil 60 baris tetap seperti semula', total > 60 && (await names()).length === 60 && /Menampilkan 60 dari/.test(await p.locator('#view').innerText()), `${total} orang, 60 tampil`);
  await type('EMP-01'); const deep = await names();
  ok('TC-17b Search menjangkau seluruh baris (termasuk di luar 60 pertama)', deep.some(t => !base.includes(t)), `${deep.length} hasil, ${deep.filter(t => !base.includes(t)).length} di luar 60 pertama`);

  /* Regresi NV01 & alur slip */
  await go('hrd-payroll?period=2610'); const kp = await p.locator('#view .kpi .val').allInnerTexts();
  ok('REG NV01 Dashboard Payroll tanpa Search dan kartu tetap', (await p.locator('#filters [name=q]').count()) === 0 && kp.length === 4, kp.join(' · '));
  await go(R + '&q=' + emp); await p.locator('.tbl tbody tr td a').first().click(); await p.waitForTimeout(200);
  ok('REG Klik hasil membuka slip per orang', /Slip .* · /.test(await p.locator('#view').innerText()) && p.url().includes('emp=' + emp));

  /* RBAC */
  for (const r of ['finance-manager', 'owner', 'hrd-ops']) {
    await setRole(r); await go(R + '&q=' + emp);
    ok(`RBAC ${r}: Slip Gaji tetap ditolak, Search tidak membuka data`, (await p.locator('.hr-denied').count()) === 1 && (await p.locator('#filters [name=q]').count()) === 0);
  }
  await setRole('hrd');

  /* Responsif */
  for (const [w, label] of [[1440, 'desktop'], [900, 'tablet'], [390, 'mobile']]) {
    await p.setViewportSize({ width: w, height: w === 390 ? 844 : 950 });
    await go(R + '&q=' + part);
    const bottoms = await p.locator('#filters > label, #filters > button').evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().bottom)));
    const sw = await p.evaluate(() => document.documentElement.scrollWidth), sb = await p.locator(S).boundingBox();
    const cond = label === 'desktop' ? new Set(bottoms).size === 1 : label === 'mobile' ? sb.width >= w - 80 : true;
    ok(`RESP ${label} ${w}px tanpa scroll horizontal`, cond && sw <= w + 2, `scrollWidth ${sw} · baris filter ${new Set(bottoms).size} · lebar Search ${Math.round(sb.width)}`);
    await shot(`F7-NV05-search-${label}`, label === 'mobile');
  }
  ok('Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-payroll-search-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
