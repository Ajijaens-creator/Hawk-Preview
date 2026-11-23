/* JAENS HRD · Direktori Karyawan memakai ringkasan data asli (Aji 14 Nov 2026): kartu 214 / 85 / 29 / 214,
   dummy 158 = arsip demo tersembunyi secara default, tanpa nama/identitas karyawan asli di website publik.
   python3 -m http.server 8811 lalu node tests/hawk-live/hrd-real.e2e.js */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
const out = []; let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; out.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.goto(BASE + 'hrd.html#hrd-roster'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800);
  if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, 'REAL-01-direktori.png') }); }
  const kpis = await p.locator('[data-real-summary] .kpi').evaluateAll(es => es.map(e => [e.querySelector('.lbl').innerText.trim(), e.querySelector('.val').innerText.trim()]));
  ok('Empat kartu: Karyawan asli 214, Therapist 85, Receptionist 29, Menunggu penetapan 214', JSON.stringify(kpis) === JSON.stringify([['Karyawan asli', '214'], ['Therapist', '85'], ['Receptionist', '29'], ['Menunggu penetapan', '214']]), JSON.stringify(kpis));
  const total = await p.locator('[data-real-summary] table tr:last-child td:last-child').innerText();
  ok('Usulan fungsi berjumlah 214', total.trim() === '214', total);
  ok('Arsip demo tersembunyi secara default (tidak ada tabel 158 dummy)', !(await p.locator('.hr-arsip').count()) && !(await p.locator('a[href*="hrd-roster?emp=EMP-0001"]').count()));
  ok('Tombol Tampilkan arsip demo tersedia', await p.locator('[data-arsip-show]').isVisible());
  ok('Tidak ada nama/email karyawan asli di halaman (hanya angka)', !/@/.test(await p.locator('[data-real-summary]').innerText()));
  await p.click('[data-arsip-show]'); await p.waitForTimeout(300);
  ok('Arsip demo tampil setelah ditekan, berlabel 158 orang sintetis', await p.locator('.hr-arsip').isVisible() && /158 orang sintetis/.test(await p.locator('.hr-arsip').innerText()));
  await p.reload(); await p.waitForTimeout(500);
  ok('Pilihan arsip diingat setelah muat ulang', await p.locator('.hr-arsip').count() === 1);
  await p.click('[data-arsip-hide]'); await p.waitForTimeout(300);
  ok('Sembunyikan arsip · kembali ke data asli', !(await p.locator('.hr-arsip').count()) && await p.locator('[data-arsip-show]').isVisible());
  ok('Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-real-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
