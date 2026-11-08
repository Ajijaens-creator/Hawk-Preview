/* Responsive check: visits all 60 NV at desktop (1440), tablet (834) and mobile (390) as Owner,
   plus role home screens for Staff / Warehouse / Supervisor on mobile. Reports page-level horizontal
   overflow (tables may scroll inside .tbl-wrap) and render failures, and saves screenshots.
   Usage: node tests/responsive.js [screenshotDir] */
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const dir = process.argv[2] || path.join(__dirname, 'screenshots');
fs.mkdirSync(dir, { recursive: true });
const SIZES = [['desktop', 1440, 900], ['tablet', 834, 1112], ['mobile', 390, 844]];
const SHOTS = { 1: 'beranda', 23: 'budget-bva', 26: 'buat-mrf', 29: 'approval-supervisor', 42: 'receiving', 57: 'ai-dashboard' };

(async () => {
  const b = await chromium.launch();
  const out = [];
  let problems = 0;
  for (const [name, w, h] of SIZES) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.reload();
    await p.waitForTimeout(300);
    const over = [];
    for (let nv = 1; nv <= 60; nv++) {
      await p.evaluate((n) => { HAWK.setUser('U-OWN', { tour: false }); location.hash = '#/nv/' + n; HAWK.render(); }, nv);
      await p.waitForTimeout(40);
      const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, fail: /Gagal merender|Gagal menampilkan/.test(document.querySelector('#view').innerText) }));
      if (r.sw > r.cw + 1) over.push(nv + '(' + (r.sw - r.cw) + 'px)');
      if (r.fail) over.push(nv + '(render)');
      if (SHOTS[nv]) await p.screenshot({ path: path.join(dir, `${name}-nv${String(nv).padStart(2, '0')}-${SHOTS[nv]}.png`) });
    }
    if (name === 'mobile') {
      for (const [uid, nv, label] of [['U-STF', 24, 'staff'], ['U-WHS', 38, 'gudang'], ['U-SPV', 29, 'supervisor']]) {
        await p.evaluate(([u, n]) => { HAWK.setUser(u, { tour: false }); location.hash = '#/nv/' + n; HAWK.render(); }, [uid, nv]);
        await p.waitForTimeout(80);
        await p.screenshot({ path: path.join(dir, `mobile-${label}-nv${nv}.png`) });
      }
    }
    problems += over.length + errs.length;
    out.push({ size: name, width: w, overflow: over, errors: errs });
    console.log(`${name} ${w}px: ${over.length ? 'overflow/render ' + over.join(', ') : 'OK 60/60'}${errs.length ? ' errors: ' + errs.join(' | ') : ''}`);
    await p.close();
  }
  fs.writeFileSync(path.join(__dirname, 'responsive-results.json'), JSON.stringify(out, null, 1));
  await b.close();
  process.exit(problems ? 1 : 0);
})();
