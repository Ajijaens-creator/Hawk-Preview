/* HAWK HRD · uji Demo Experience Center (#hrd-dx): persona, 5 skenario lintas divisi dijalankan lewat tombol, audit atas nama persona,
   panel kinerja tim per divisi, mobile. python3 -m http.server 8811 lalu node tests/hawk-live/hrd-dx.e2e.js */
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
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const go = async (r) => { await p.goto(BASE + 'hrd.html#' + r); await p.waitForTimeout(160); };
  const text = () => p.locator('#view').innerText();
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true }); };
  const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('hawk-integrated-demo-v1') || '{}').hr || {});
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  await go('hrd-home'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(250);

  await go('hrd-dx'); await shot('DX-01-center');
  let t = await text();
  ok('Persona tampil: Made Gunarsa, Harja, Ayu, Asri, Eni Restini, Mila', ['Made Gunarsa', 'Harja', 'Ayu', 'Asri', 'Eni Restini', 'Mila'].every(n => t.includes(n)));
  ok('5 skenario lintas divisi', (await p.locator('#view a:has-text("Mulai")').count()) === 5);
  ok('Kinerja tim: Operational 4 outlet, Finance, Marketing, Commercial, HRD, Production Essence', /Spa Ubud/.test(t) && /Finance & Accounting/.test(t) && /Marketing/.test(t) && /Commercial/.test(t) && /HRD & Human Growth/.test(t) && /Production · JAENS Essence/.test(t));

  const runAll = async (sc, n) => {
    await go('hrd-dx?sc=' + sc);
    for (let i = 0; i < n; i++) {
      const b = p.locator(`[data-dx-run="${sc}:${i}"]`);
      if (!(await b.count())) return `langkah ${i + 1} tidak bisa dijalankan`;
      await b.click(); await p.waitForTimeout(200);
      const st = await p.locator('#view .status').innerText().catch(() => '');
      if (/gagal/i.test(st)) return `langkah ${i + 1}: ${st}`;
    }
    return null;
  };
  for (const [sc, n] of [['rekrut', 13], ['reception', 5], ['kinerja', 5], ['payroll', 6], ['reflection', 5]]) {
    const err = await runAll(sc, n);
    const r = (await S()).dx?.runs?.[sc];
    ok(`Skenario ${sc}: semua ${n} langkah selesai`, !err && r && r.done.length === n, err || '');
    await shot(`DX-${sc}`);
  }
  const h = await S(), c = h.dx.runs.rekrut.ctx;
  ok('Rekrutmen: karyawan baru, penempatan Spa Ubud terjadwal', h.placements.some(pl => pl.emp === c.emp && pl.location === 'OUT-UBD'));
  ok('Audit mencatat persona (Harja, Ayu, Mila, Eni Restini)', ['Harja (Koordinator Rekrutmen)', 'Ayu (Admin HRD)', 'Mila (Supervisor Spa Ubud)', 'Eni Restini (Operational Manager)'].every(n => h.audit.some(a => a.by === n)));
  ok('Payroll: Finance Manager menerima jurnal November', h.f7.batches.find(b => b.period === '2611').handoff.status === 'Diterima Finance');
  ok('Reflection: keputusan STRACON + Workplan', !!h.dx.runs.reflection.ctx.dec && !!h.dx.runs.reflection.ctx.wp);

  await go('hrd-dx?sc=rekrut'); await p.locator('[data-dx-open="rekrut:6"]').click(); await p.waitForTimeout(250);
  ok('Buka layar sebagai Harja → kandidat, role Staf HRD', p.url().includes('hrd-rec-candidates') && (await p.locator('#role').inputValue()) === 'hrd-ops');
  await go('hrd-dx'); await p.locator('[data-dx-persona="asri"]').click(); await p.waitForTimeout(250);
  ok('Masuk sebagai Asri → Handoff Finance (agregat)', p.url().includes('hrd-pay-handoff') && (await p.locator('#role').inputValue()) === 'finance-manager');
  await go('hrd-dx');
  ok('Persona aktif ditampilkan', /Persona aktif: Asri \(Finance Manager\)/.test(await text()));
  await go('hrd-dx?sc=payroll');
  ok('Tombol jalankan tidak muncul lagi untuk skenario selesai', (await p.locator('[data-dx-run^="payroll:"]').count()) === 0);
  await p.setViewportSize({ width: 390, height: 844 });
  for (const r of ['hrd-dx', 'hrd-dx?sc=rekrut']) { await go(r); const w = await p.evaluate(() => document.documentElement.scrollWidth); ok(`Mobile 390 px: ${r}`, w <= 392, String(w)); await shot('DX-mobile-' + r.replace(/\W+/g, '-')); }
  ok('Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-dx-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
