/* Visits every NV (1–62) as every demo user; reports JS errors and render failures. Usage: node tests/browser-all.js */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text()));
  const url = 'file://' + process.cwd() + '/index.html';
  await p.goto(url);
  await p.evaluate(() => localStorage.clear());
  const users = await p.evaluate(() => HAWK.store.state.users.map((u) => [u.id, u.role]));
  let visits = 0, denied = 0, controls = 0;
  for (const [uid, role] of users) {
    await p.evaluate((id) => { HAWK.setUser(id, { tour: false }); HAWK.render(); }, uid);
    await p.waitForTimeout(100);
    for (let nv = 1; nv <= 62; nv++) {
      await p.evaluate((n) => (location.hash = '#/nv/' + n), nv);
      await p.waitForTimeout(40);
      const txt = await p.$eval('#view', (e) => e.innerText);
      visits++;
      if (/Akses dibatasi/.test(txt)) denied++;
      // every data-a / data-ch / data-in control must resolve to a handler of the current view (no decorative buttons)
      const miss = await p.evaluate((n) => { const v = HAWK.views[n] || {}; const a = v.actions || {}; const out = []; document.querySelectorAll('#view [data-a],#view [data-ch],#view [data-in]').forEach((e) => { const k = e.dataset.a || e.dataset.ch || e.dataset.in; if (!a[k]) out.push(k); }); return [...new Set(out)]; }, nv);
      if (miss.length) errs.push(`handler hilang NV-${nv} (${uid}): ${miss.join(',')}`);
      controls += await p.$$eval('#view button, #view [data-a], #view select, #view input', (l) => l.length);
      if (/Gagal merender|Gagal menampilkan|belum dirender/.test(txt)) errs.push(`render fail NV-${nv} as ${uid}/${role}: ` + txt.slice(0, 200).replace(/\n/g, ' '));
    }
  }
  console.log(`${visits} kunjungan (${users.length} pengguna × 62 layar), ${denied} akses dibatasi (sesuai role), ${controls} kontrol diperiksa`);
  require('fs').writeFileSync(require('path').join(__dirname, 'browser-all-results.json'), JSON.stringify({ visits, denied, controls, errors: errs }, null, 1));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
