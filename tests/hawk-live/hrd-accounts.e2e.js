/* HAWK HRD · uji akun bernama: pemilih akun di portal HRD berisi Made Gunarsa, Harja, Ayu, Putu Dewi D (+ peserta alur),
   masuk otomatis sesuai role & izin, chip profil menampilkan nama, audit atas nama orangnya, dan payroll/gaji/slip/nominal
   hanya terlihat oleh Manager HRD (Made Gunarsa).
   python3 -m http.server 8811 lalu node tests/hawk-live/hrd-accounts.e2e.js */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const out = []; let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; out.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
const PAY = ['hrd-payroll', 'hrd-pay-process', 'hrd-pay-slip', 'hrd-pay-rules', 'hrd-pay-commission', 'hrd-budget', 'hrd-bud-plan', 'hrd-bud-sim', 'hrd-bud-trend', 'hrd-cash'];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  await ctx.route(/basemaps\.cartocdn\.com|arcgisonline\.com/, r => r.abort());
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/net::/.test(m.text())) errors.push(m.text()); });
  await p.goto(BASE + 'hrd.html#hrd-home'); await p.evaluate(() => localStorage.clear());
  await p.goto(BASE + 'hrd.html#hrd-home'); await p.reload(); await p.waitForTimeout(700);
  const opts = await p.locator('#role option').allInnerTexts();
  const team = await p.locator('#role optgroup[label="Tim HRD"] option').allInnerTexts();
  ok('Pemilih akun: tim HRD bernama Made Gunarsa, Harja, Ayu, Putu Dewi D', team.length === 4 && ['Made Gunarsa · Manager HRD', 'Harja · Koordinator Rekrutmen', 'Ayu · Admin HRD', 'Putu Dewi D'].every((n, i) => team[i].startsWith(n)), team.join(' | '));
  ok('Tanpa opsi generik "Manager HRD"/"Staf HRD"', !opts.includes('Manager HRD') && !opts.includes('Staf HRD'));
  ok('Default masuk sebagai Made Gunarsa (chip profil)', (await p.locator('#role-name').innerText()) === 'Made Gunarsa' && /Manager HRD/.test(await p.locator('.role-chip small').innerText()));

  const VAL = { made: 'hrd', ayu: 'hrd-ops', hg: 'hg-lead' };
  const as = async (id) => { await p.selectOption('#role', VAL[id] || 'acct:' + id); await p.waitForTimeout(300); };
  const view = async (route) => { await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(250); return p.locator('#view').innerText(); };
  const rpRe = /Rp\s?\d/;

  /* Manager HRD: payroll terbuka */
  await as('made');
  const madePay = await view('hrd-payroll');
  ok('Made Gunarsa (Manager HRD) membuka payroll dengan nominal', !/tidak membuka/.test(madePay) && rpRe.test(madePay));
  const madeSlip = await view('hrd-pay-slip');
  ok('Made Gunarsa membuka slip gaji', !/tidak membuka/.test(madeSlip));
  const madeHome = await view('hrd-home');
  ok('Beranda Manager HRD: ringkasan payroll dengan take-home pay', /Total take-home pay/.test(madeHome));
  ok('Direktori Manager HRD: kolom THP contoh', /THP contoh/.test(await view('hrd-roster?view=kepegawaian')));

  for (const [id, name, role, title] of [['harja', 'Harja', 'hrd-ops', 'Koordinator Rekrutmen'], ['ayu', 'Ayu', 'hrd-ops', 'Admin HRD'], ['hg', 'Putu Dewi D', 'hg-lead', 'Lead Human Growth']]) {
    await as(id);
    const pr = await p.evaluate(() => ({ role: HL.prefs.role, persona: HL.prefs.persona }));
    ok(`${name}: masuk otomatis dengan role ${role}`, pr.role === role && pr.persona === id);
    ok(`${name}: chip profil menampilkan nama & jabatan`, (await p.locator('#role-name').innerText()).startsWith(name) && (await p.locator('.role-chip small').innerText()) === title);
    const leaks = [];
    for (const r of PAY) { const t = await view(r); if (!/tidak membuka|Akses ditolak|tidak punya akses/i.test(t) || rpRe.test(t.replace(/Rp\s?0\b/g, ''))) leaks.push(r); }
    ok(`${name}: semua layar payroll/slip/budget gaji ditolak tanpa nominal`, leaks.length === 0, leaks.join(','));
    const home = await view('hrd-home');
    ok(`${name}: Beranda tanpa nominal gaji (khusus Manager HRD)`, /Khusus Manager HRD/.test(home) && !/Total take-home pay/.test(home));
    const emp = await view('hrd-roster?emp=EMP-0007&dtab=kepegawaian');
    ok(`${name}: profil karyawan tanpa take-home pay`, !/Take-home pay contoh/.test(emp) && !rpRe.test(emp));
    const dir = await view('hrd-roster?view=kepegawaian');
    ok(`${name}: direktori tanpa kolom THP`, !/THP contoh/.test(dir) && !rpRe.test(dir));
  }

  /* Harja tetap bisa kerja rekrutmen; ekspektasi gaji kandidat dibatasi */
  await as('harja');
  const rec = await view('hrd-rec-candidates');
  ok('Harja tetap membuka kandidat rekrutmen', !/tidak punya akses/.test(rec) && /Kandidat|kandidat/.test(rec));
  const appId = await p.evaluate(() => (HL.state.hr.f4 && HL.state.hr.f4.apps || [])[0]?.id);
  if (appId) { const t = await view('hrd-rec-candidates?id=' + appId); ok('Harja: ekspektasi gaji kandidat dibatasi (khusus Manager HRD)', !/Ekspektasi gaji/.test(t) || /Dibatasi · khusus Manager HRD/.test(t)); }

  /* audit atas nama orang */
  await as('ayu');
  const actor = await p.evaluate(() => HL.HOOKS.actor());
  ok('Audit atas nama Ayu (Admin HRD)', actor === 'Ayu (Admin HRD)', actor);
  await as('harja');
  ok('Audit atas nama Harja (Koordinator Rekrutmen)', (await p.evaluate(() => HL.HOOKS.actor())) === 'Harja (Koordinator Rekrutmen)');

  /* akun tersimpan setelah reload */
  await p.reload(); await p.waitForTimeout(600);
  ok('Akun tetap Harja setelah muat ulang', (await p.locator('#role-name').innerText()) === 'Harja' && (await p.inputValue('#role')) === 'acct:harja');

  /* portal lain memakai pemilih role biasa */
  await p.goto(BASE + 'commercial.html'); await p.waitForTimeout(600);
  ok('Portal Commercial tetap pemilih role biasa', !(await p.locator('#role option[value^="acct:"]').count()));
  ok('Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-accounts-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
