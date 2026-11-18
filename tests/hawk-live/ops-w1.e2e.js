/* HAWK Operational · acceptance Gelombang 1 (F-OP00 Foundation, F-OP01 akun & scope outlet, F-OP02 Command Center,
   F-OP03 POS & Receptionist ke POS existing). Frontend + fixture lokal saja; bukan uji backend.
   python3 -m http.server 8811 dari root repo, lalu: node tests/hawk-live/ops-w1.e2e.js  (SHOTS=dir untuk screenshot) */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
const POS = 'https://preview.jaens.id/rnd-demo';
let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
const ROUTES = ['op-dashboard', 'op-pos', 'op-daily', 'op-tasks', 'op-therapist', 'op-rooms', 'op-inventory', 'op-communication', 'op-race', 'op-budget', 'op-reports', 'op-settings', 'op-roadmap', 'op-validation', 'ops-dx'];
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const shot = async (n, full = false) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: full }); };
  const go = async (r) => { await p.goto(BASE + 'operational.html#' + r); await p.waitForTimeout(350); };
  const visibleNav = () => p.$$eval('#nav a', as => as.filter(a => !a.hidden && !a.closest('[hidden]')).map(a => a.getAttribute('href')));
  const pickAccount = async (id) => { await p.click('#opx-root [data-act="accounts"]'); await p.waitForTimeout(120); await p.click(`#modal-root [data-act="account-select"][data-id="${id}"]`); await p.waitForTimeout(400); };

  await p.goto(BASE + 'operational.html'); await p.evaluate(() => localStorage.clear()); await p.goto(BASE + 'operational.html'); await p.waitForTimeout(600);

  /* ---------------- F-OP00 Foundation ---------------- */
  ok('F-OP00 portal Operational dibuka di Command Center', (await p.evaluate(() => location.hash)) === '#op-dashboard');
  const hrefs = await visibleNav();
  ok('F-OP00 kartu Demo Experience Center paling atas sidebar', await p.evaluate(() => { const a = document.querySelector('#nav > *'); return a && a.classList.contains('nav-dx') && a.getAttribute('href') === '#ops-dx'; }));
  ok('F-OP00 sidebar hanya menu Operational (tanpa menu portal lain)', hrefs.every(h => /^#op-|^#ops-dx$/.test(h) || h === POS), hrefs.length + ' tautan');
  const posLink = await p.$(`#nav a[href="${POS}"]`);
  ok('F-OP03 menu POS & Receptionist → POS existing di tab baru', !!posLink && (await posLink.getAttribute('target')) === '_blank' && /noopener/.test(await posLink.getAttribute('rel')));
  for (const r of ROUTES) {
    await go(r);
    const st = await p.evaluate(() => ({ h1: document.querySelector('.page-head h1')?.textContent || '', ok: !!document.querySelector('#opx-root .page-top'), n: document.getElementById('opx-root')?.innerText.length || 0, tag: document.querySelector('.nv-tag')?.textContent || '' }));
    ok(`F-OP00 ${r} dirender di shell hawk-live tanpa halaman buntu`, st.ok && st.n > 300 && st.h1.length > 3 && /F-OP|DX/.test(st.tag), `${st.h1} · ${st.tag}`);
  }
  ok('F-OP00 portal switch tetap lewat logo HAWK', await p.evaluate(() => !!document.querySelector('#portal[data-open-picker]')));
  ok('F-OP00 banner DATA DEMO / SIMULASI terlihat', (await p.textContent('.demo-banner')).includes('DEMO'));
  ok('F-OP00 toggle ID/EN tersedia', await p.locator('.lang-toggle, [data-lang]').count() > 0);

  /* ---------------- F-OP01 akun & scope ---------------- */
  await go('op-dashboard');
  ok('F-OP01 akun awal Eni Restini (Operational Manager) lintas outlet', (await p.textContent('#opx-root .profile-chip')).includes('Eni Restini') && (await p.$eval('#outlet-select', s => [...s.options].map(o => o.value).join(','))) === 'all,CTR,SHT,TRL,BSM');
  ok('F-OP01 role chip topbar mengikuti akun Operational', (await p.textContent('#role-name')) === 'Eni Restini');
  const names = await p.evaluate(() => OPX.accounts.filter(a => ['manager', 'assistant', 'supervisor'].includes(a.role)).map(a => `${a.name}:${a.outlet || 'all'}`).join(','));
  ok('F-OP01 nama dari master HRD (Eni, Tika, Mila, Tina, Dewik, Wahyudi)', names === 'Eni Restini:all,Tika:all,Mila:CTR,Tina:SHT,Dewik:TRL,Wahyudi:BSM', names);
  await pickAccount('spv-SHT');
  ok('F-OP01 Supervisor Tina terkunci satu outlet (Shanti)', await p.$eval('#outlet-select', s => s.disabled && s.options.length === 1 && s.value === 'SHT'));
  ok('F-OP01 data Supervisor hanya outlet sendiri', await p.evaluate(() => { const rows = OPX.scope(OPX.state.data.bookings); return rows.length > 0 && rows.every(b => b.outlet === 'SHT'); }));
  await shot('w1-01-supervisor-tina');
  await pickAccount('therapist-CTR');
  const thNav = await visibleNav();
  ok('F-OP01 menu sidebar Therapist menyusut sesuai matriks akses', !thNav.includes('#op-budget') && !thNav.includes('#op-settings') && !thNav.includes(POS) && thNav.includes('#op-tasks'), thNav.length + ' menu');
  await go('op-budget');
  ok('F-OP01 Therapist membuka Budget lewat URL → status Tidak berwenang', (await p.textContent('#opx-root')).includes('Tidak berwenang'));
  await shot('w1-02-ditolak');
  await go('op-settings'); await pickAccount('mgr-eni');
  ok('F-OP01 kembali ke Manager memulihkan menu', (await visibleNav()).includes('#op-settings'));
  await p.reload(); await p.waitForTimeout(500);
  ok('F-OP00 data demo bertahan setelah reload (akun aktif tersimpan)', (await p.textContent('#opx-root .profile-chip')).includes('Eni Restini'));

  /* ---------------- F-OP02 Command Center ---------------- */
  await go('op-dashboard');
  const tile = async () => p.evaluate(() => [...document.querySelectorAll('#opx-root .stat')].find(s => /Menunggu verifikasi/.test(s.textContent))?.querySelector('.stat-value')?.textContent.trim());
  const before = await tile();
  await p.evaluate(() => { const t = OPX.state.data.tasks.find(x => x.status === 'todo' && x.outlet === 'CTR'); t.status = 'head_review'; t.evidence = 'Foto demo'; OPX.save(); OPX.render(); });
  const after = await tile();
  ok('F-OP02 perubahan tugas langsung terlihat di dashboard tanpa input ulang', Number(after) === Number(before) + 1, `${before} → ${after}`);
  ok('F-OP02 X-Score/Health Score tampil pending, bukan angka resmi', /belum menjadi skor kesehatan resmi/.test(await p.textContent('#opx-root')));
  ok('F-OP02 angka demo berlabel simulasi', /simulasi|demo/i.test(await p.textContent('#opx-root .kpi-grid, #opx-root .stat')));
  await p.selectOption('#outlet-select', 'TRL'); await p.waitForTimeout(250);
  ok('F-OP02 filter outlet Manager konsisten (Triloka)', (await p.textContent('#opx-root .eyebrow')).includes('TRILOKA'));
  await p.selectOption('#outlet-select', 'all'); await p.waitForTimeout(250);
  await shot('w1-03-command-center', true);

  /* ---------------- F-OP03 POS gateway & parity ---------------- */
  await go('op-pos');
  const posText = await p.textContent('#opx-root');
  ok('F-OP03 gateway menautkan POS existing', (await p.locator(`#opx-root a[href="${POS}"][target="_blank"]`).count()) > 0);
  ok('F-OP03 tiga status parity dipisahkan (tautan / parity / integrasi)', /Tautan tersedia/.test(posText) && /Parity isi terverifikasi/.test(posText) && /BLOCKED/.test(posText) && /Integrasi data terbukti/.test(posText));
  await shot('w1-04-pos-gateway', true);

  /* ---------------- regresi lintas portal ---------------- */
  await p.goto(BASE + 'sales.html#pos'); await p.waitForTimeout(300);
  ok('Regresi: POS sandbox lintas portal (#pos) tetap berjalan untuk Sales/Commercial', (await p.locator('#view table').count()) > 0);
  await p.goto(BASE + 'finance.html#bridge'); await p.waitForTimeout(300);
  ok('Regresi: portal Finance tetap menautkan NV-47', await p.evaluate(() => HL.HOME.Finance === '/?as=U-FIN#/nv/47' && HL.PORTALS.Finance.items[0][0] === '/?as=U-FIN#/nv/47'));

  /* ---------------- responsif ---------------- */
  for (const [w, h, n] of [[834, 1112, 'tablet'], [390, 844, 'mobile']]) {
    await p.setViewportSize({ width: w, height: h });
    for (const r of ['op-dashboard', 'op-pos', 'ops-dx']) {
      await go(r);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      ok(`Responsif ${n} ${w}px ${r} tanpa scroll horizontal`, over <= 1, `+${over}px`);
      if (r === 'op-dashboard') await shot(`w1-05-${n}-dashboard`);
    }
  }
  ok('Tanpa error konsol', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? `GAGAL · ${fail} gagal` : 'LULUS · 0 gagal');
  process.exit(fail ? 1 : 0);
})();
