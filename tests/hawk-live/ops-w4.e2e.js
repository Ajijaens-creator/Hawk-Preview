/* HAWK Operational · acceptance Gelombang 4 (F-OP11 Demo Experience Center, Owner walkthrough, UAT akses per role).
   Frontend + fixture lokal saja; hasil ini bukan uji backend atau izin release.
   python3 -m http.server 8811 dari root repo, lalu: node tests/hawk-live/ops-w4.e2e.js  (SHOTS=dir untuk screenshot) */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
const HELPERS = () => {
  window.T = {
    as(id) { OPX.actions['account-select']({ dataset: { id } }); },
    act(n, d, extra) { return OPX.actions[n](Object.assign({ dataset: d || {} }, extra || {})); },
    form(n, o) { const fd = new FormData(); Object.entries(o).forEach(([k, v]) => fd.append(k, v)); return OPX.forms[n](fd); },
    d() { return OPX.state.data; },
    dx() { return OPX.state.demoExperience; },
    run() { return OPX.demo.getRun(); },
    dock() { return document.getElementById('opx-overlay')?.innerText || ''; },
    downloads: [],
  };
  const hook = () => { if (window.OPX && !OPX.__dl) { OPX.__dl = true; OPX.download = (name, data) => T.downloads.push({ name, data: JSON.stringify(data) }); } else if (!window.OPX) setTimeout(hook, 20); };
  document.addEventListener('DOMContentLoaded', hook);
};
/* matriks akses per role (prototype v1.1): halaman yang harus terlihat / tidak terlihat di sidebar */
const UAT = {
  'mgr-eni': { see: ['#op-dashboard', '#op-budget', '#op-settings', '#op-reports'], hide: [] },
  'asm-tika': { see: ['#op-dashboard', '#op-budget', '#op-reports'], hide: [] },
  'spv-CTR': { see: ['#op-daily', '#op-tasks', '#op-budget', '#op-inventory', '#op-settings'], hide: [] },
  'head-attendant-CTR': { see: ['#op-daily', '#op-tasks', '#op-inventory'], hide: ['#op-budget', '#op-settings'] },
  'reception-CTR': { see: ['#op-daily', '#op-tasks', '#op-rooms', '#op-inventory'], hide: ['#op-budget', '#op-settings'] },
  'therapist-CTR': { see: ['#op-tasks', '#op-therapist', '#op-inventory'], hide: ['#op-budget', '#op-settings', '#op-daily'] },
  'attendant-CTR': { see: ['#op-daily', '#op-tasks', '#op-inventory'], hide: ['#op-budget', '#op-settings'] },
  'security-CTR': { see: ['#op-daily', '#op-tasks', '#op-inventory'], hide: ['#op-budget', '#op-settings', '#op-rooms'] },
};
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(HELPERS);
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const shot = async (n, full = false) => { if (SHOTS) { await p.waitForTimeout(300); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: full }); } };
  const go = async (r) => { await p.goto(BASE + 'operational.html#' + r); await p.waitForTimeout(350); };
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const visibleNav = () => p.$$eval('#nav a', as => as.filter(a => !a.hidden && !a.closest('[hidden]')).map(a => a.getAttribute('href')));
  await p.goto(BASE + 'operational.html'); await ev(() => localStorage.clear()); await p.reload(); await go('ops-dx');

  /* ---------------- struktur Demo Center ---------------- */
  const meta = await ev(() => ({ n: OPX.demo.scenarios.length, steps: OPX.demo.scenarios.reduce((a, s) => a + s.steps.length, 0), owner: OPX.demo.ownerTour.steps.length, ownerSep: !OPX.demo.scenarios.some(s => s.id === OPX.demo.ownerTour.id) }));
  ok('F-OP11 tujuh skenario / 33 langkah', meta.n === 7 && meta.steps === 33, `${meta.n} skenario · ${meta.steps} langkah`);
  ok('F-OP11 Owner tour sembilan langkah, terpisah dari skenario', meta.owner === 9 && meta.ownerSep);
  ok('F-OP11 halaman Demo Center berlabel per portal Operational', /OPERATIONAL/i.test(await p.textContent('#opx-root .dx-hero')));
  await shot('G4-V01-demo-center', true);

  /* ---------------- skenario Opening penuh lewat Pandu Saya ---------------- */
  await ev(() => OPX.demo.start('opening', 'CTR')); await p.waitForTimeout(300);
  ok('F-OP11 mulai skenario memindahkan akun demo ke role langkah pertama', await ev(() => OPX.state.accountId === 'attendant-CTR' && location.hash === '#op-daily'));
  ok('F-OP11 dock Pandu Saya menampilkan langkah 1/4', /Langkah 1\/4/.test(await ev(() => T.dock())));
  await shot('G4-V02-pandu-saya-langkah-1');
  await ev(() => OPX.demo.advance());
  ok('F-OP11 klik Next saja tidak meluluskan langkah mutasi', await ev(() => T.run().stepIndex === 0));
  await ev(() => T.act('daily-check', { outlet: 'CTR', kind: 'opening', id: 'pantry' }, { checked: true })); await ev(() => OPX.demo.advance()); await p.waitForTimeout(250);
  ok('F-OP11 langkah lulus setelah state sumber berubah', await ev(() => T.run().stepIndex === 1 && OPX.state.accountId === 'head-attendant-CTR'));
  await ev(() => T.act('dx-pause'));
  ok('F-OP11 pause tersimpan', await ev(() => T.run().status === 'paused'));
  await p.reload(); await p.waitForTimeout(500);
  ok('F-OP11 reload mempertahankan progres (langkah 2, paused)', await ev(() => { const r = OPX.demo.getRun(); return r && r.stepIndex === 1 && r.status === 'paused'; }));
  await ev(() => T.act('dx-resume', { id: T.run().id })); await p.waitForTimeout(250);
  ok('F-OP11 resume melanjutkan di langkah yang sama', await ev(() => T.run().stepIndex === 1 && T.run().status !== 'paused'));
  await ev(() => { T.act('daily-head-review', { outlet: 'CTR', kind: 'opening' }); OPX.demo.advance(); }); await p.waitForTimeout(250);
  ok('F-OP11 langkah Head → Supervisor', await ev(() => T.run().stepIndex === 2 && OPX.state.accountId === 'spv-CTR'));
  await ev(() => { T.form('daily-signoff', { outlet: 'CTR', kind: 'opening', note: 'Opening Ubud siap', ack: 'on' }); OPX.demo.advance(); }); await p.waitForTimeout(250);
  ok('F-OP11 sign-off Supervisor meluluskan langkah 3', await ev(() => T.run().stepIndex === 3));
  await ev(() => { T.act('dx-manual'); OPX.demo.advance(); }); await p.waitForTimeout(250);
  ok('F-OP11 langkah review manual + skenario selesai', await ev(() => { const r = OPX.state.demoExperience.runs; return Object.values(r).some(x => x.scenarioId === 'opening' && x.status === 'complete'); }));
  await go('ops-dx'); await shot('G4-V03-skenario-selesai', true);
  await ev(() => T.act('dx-export'));
  const ex = await ev(() => T.downloads.at(-1));
  ok('F-OP11 export sesi demo (JSON, berlabel demo)', !!ex && /Demo-Session/.test(ex.name) && /"demo":true/.test(ex.data));
  await ev(() => OPX.demo.resetProgress('opening', 'CTR'));
  ok('F-OP11 reset progres tidak menghapus pekerjaan', await ev(() => !Object.values(OPX.state.demoExperience.runs).some(x => x.scenarioId === 'opening' && x.outlet === 'CTR') && T.d().checklists.CTR.openingSigned === true && T.d().checklists.CTR.opening.find(i => i.id === 'pantry').done));

  /* ---------------- Owner walkthrough ---------------- */
  await go('ops-dx'); await ev(() => T.act('dx-owner')); await p.waitForTimeout(200);
  const ownerModal = await ev(() => document.querySelector('#modal-root')?.innerText || '');
  if (/Mulai/.test(ownerModal)) { await p.click('#modal-root [data-act="dx-start-confirm"]'); await p.waitForTimeout(300); }
  ok('F-OP11 Owner tour berjalan 9 langkah', /Langkah 1\/9/.test(await ev(() => T.dock())));
  await shot('G4-V04-owner-tour');
  await ev(() => { const r = T.run(); if (r) r.closed = true; OPX.state.demoExperience.active = null; OPX.save(); });

  /* ---------------- loading / error / retry, simulator ---------------- */
  await ev(() => T.as('mgr-eni')); await go('ops-dx');
  await ev(() => T.act('dx-condition', {}, { value: 'error' })); await ev(() => { if (T.dx().condition !== 'error') { T.dx().condition = 'error'; OPX.save(); OPX.render(); } });
  ok('F-OP11 kondisi error tampil dengan tombol retry', await ev(() => !!document.querySelector('#opx-root [data-act="dx-retry"]')));
  await shot('G4-V05-error-retry');
  await ev(() => T.act('dx-start', { id: 'turnover' }));
  ok('F-OP11 panduan tidak dimulai saat kondisi error', await ev(() => !/Mulai Treatment/.test(document.querySelector('#modal-root')?.innerText || '')));
  await ev(() => T.act('dx-retry'));
  ok('F-OP11 retry memulihkan kondisi normal', await ev(() => T.dx().condition === 'normal'));
  await ev(() => { T.dx().condition = 'slow'; OPX.save(); OPX.render(); });
  ok('F-OP11 kondisi loading tampil', /loading/i.test(await ev(() => document.getElementById('opx-root').innerText)));
  await ev(() => { T.dx().condition = 'normal'; OPX.save(); T.act('dx-mode', { id: 'simulator' }); });
  const panels = await ev(() => document.querySelectorAll('#opx-root .dx-role-panel').length);
  ok('F-OP11 Simulator 5 role dari satu fixture', panels === 5, panels + ' panel');
  ok('F-OP11 simulator tidak memuat aplikasi remote (tanpa iframe)', await ev(() => !document.querySelector('#opx-root iframe')));
  await shot('G4-V06-simulator-5-role', true);
  await ev(() => T.act('dx-mode', { id: 'lab' }));

  /* ---------------- tujuh skenario dapat dimulai ---------------- */
  const startable = await ev(() => OPX.demo.scenarios.map(s => [s.id, OPX.demo.availability(s.id, 'SHT').ok]));
  ok('F-OP11 ketujuh skenario siap dimulai di Shanti (fixture belum dipakai)', startable.every(x => x[1]), startable.filter(x => !x[1]).map(x => x[0]).join(',') || 'semua');

  ok('F-OP11 skenario yang sudah dijalankan meminta persiapan fixture, bukan reset diam-diam', await ev(() => !OPX.demo.availability('opening', 'CTR').ok));
  await ev(() => T.as('spv-CTR')); await go('op-settings');
  ok('UAT spv-CTR: Team & Access hanya baca (tanpa ubah izin)', await ev(() => !OPX.has('settings.manage') && !document.querySelector('#opx-root form[data-form="govPermissions"] button[type=submit]:not([disabled])')));
  /* ---------------- UAT akses per role ---------------- */
  for (const [id, m] of Object.entries(UAT)) {
    await ev(a => T.as(a), id); await p.waitForTimeout(250);
    const nav = await visibleNav();
    const miss = m.see.filter(h => !nav.includes(h)), leak = m.hide.filter(h => nav.includes(h));
    ok(`UAT ${id}: menu sesuai matriks akses`, !miss.length && !leak.length, (miss.length ? 'kurang ' + miss.join(',') : '') + (leak.length ? ' bocor ' + leak.join(',') : '') || nav.length + ' menu');
    for (const h of m.hide) { await go(h.slice(1)); ok(`UAT ${id}: ${h} lewat URL → Tidak berwenang`, /Tidak berwenang/.test(await p.textContent('#opx-root'))); }
    const outletLocked = await ev(() => { const s = document.getElementById('outlet-select'); return !s || s.disabled; });
    if (!['mgr-eni', 'asm-tika'].includes(id)) ok(`UAT ${id}: outlet terkunci`, outletLocked);
  }

  /* ---------------- responsif ---------------- */
  await ev(() => T.as('mgr-eni'));
  for (const [w, h, n] of [[834, 1112, 'tablet'], [390, 844, 'mobile']]) {
    await p.setViewportSize({ width: w, height: h });
    for (const r of ['ops-dx', 'op-validation', 'op-roadmap']) {
      await go(r);
      const over = await ev(() => document.documentElement.scrollWidth - window.innerWidth);
      ok(`Responsif ${n} ${w}px ${r} tanpa scroll horizontal`, over <= 1, `+${over}px`);
    }
    if (n === 'mobile') { await go('ops-dx'); await shot('G4-mobile-demo-center'); await ev(() => OPX.demo.start('turnover', 'CTR')); await p.waitForTimeout(300); await shot('G4-mobile-pandu-saya'); }
  }
  ok('Tanpa error konsol', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? `GAGAL · ${fail} gagal` : 'LULUS · 0 gagal');
  process.exit(fail ? 1 : 0);
})();
