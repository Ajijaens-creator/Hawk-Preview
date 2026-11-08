/* End-to-end UI test of MP-HAWK-09 Demo Experience Center (#/dx).
   Covers: Option 2 Live Multi-Device Simulator (5 real role dashboards in same-origin frames on ONE shared sandbox),
   a REAL button click inside one role frame being detected by the tutor and visible in the other frames,
   Option 1 Scenario Test Lab (role login, device switch), all 6 scenarios driven through the tutor with every
   step's stable target ID found in the real screen, maximize, demo reset, BLOCKED, PASS/FAIL/BLOCKED verdict,
   JSON export, and phone / iPad / desktop viewports.
   Needs http (frames must share an origin), so this script serves the repo itself on a free port.
   Usage: node tests/e2e-demo-center.js [screenshotDir] */
'use strict';
const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..');
const shotDir = process.argv[2] || path.join(root, 'docs', 'screenshots', 'demo-center');
fs.mkdirSync(shotDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(root, u === '/' ? 'index.html' : u);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/index.html`;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text()));
  const results = [];
  const ok = (name, cond, info) => {
    results.push({ name, ok: !!cond, info: cond ? '' : info || '' });
    console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || !info ? '' : ' — ' + info));
  };
  const wait = (ms = 200) => p.waitForTimeout(ms);
  const S = (fn, arg) => p.evaluate(fn, arg);
  const shot = (name) => p.screenshot({ path: path.join(shotDir, name + '.png'), fullPage: false });
  const frameOf = async (cell) => {
    const h = await p.$(`.dx-cell[data-cell="${cell}"] iframe`);
    return h && h.contentFrame();
  };

  await p.goto(base + '#/dx');
  await S(() => localStorage.clear());
  await p.reload();
  await wait(1200);

  console.log('A. Halaman Demo Center');
  ok('Route #/dx tampil dengan hero, tab mode, dan panel tutor', await S(() => !!document.querySelector('[data-dx-root]') && document.querySelectorAll('[data-dx="mode"]').length === 2 && !!document.querySelector('.dx-tutor')));
  ok('Menu samping punya tautan Demo Center', await S(() => !!document.querySelector('.nav-dx[href="#/dx"]')));

  console.log('B. Option 2 — Simulator 5 layar');
  await p.click('[data-dx="mode"][data-mode="sim"]');
  await wait(2500);
  const want = { FINANCE: ['U-FIN', 'desktop'], PURCHASING: ['U-PUR', 'desktop'], BU_MANAGER: ['U-BUM', 'desktop'], SUPERVISOR: ['U-SPV', 'ipad'], STAFF: ['U-STF', 'mobile'] };
  for (const [key, [uid, dev]] of Object.entries(want)) {
    const f = await frameOf(key);
    const info = f && (await f.evaluate(() => ({ user: HAWK.currentUser().id, embed: document.documentElement.classList.contains('embed'), view: (document.querySelector('#view') || {}).innerText || '' })).catch((e) => ({ err: e.message })));
    const cellDev = await S((k) => document.querySelector(`.dx-cell[data-cell="${k}"]`).dataset.device, key);
    ok(`${key}: layar asli tampil sebagai ${uid} di ${dev}`, info && info.user === uid && info.embed && info.view.length > 50 && cellDev === dev, JSON.stringify(info && { u: info.user, e: info.embed, err: info.err, dev: cellDev }));
  }
  ok('Kartu pintasan role muncul di dashboard Staff (ikon besar, tanpa jargon keuangan)', await (await frameOf('STAFF')).evaluate(() => { const r = document.querySelector('[data-role-shortcuts="STAFF"]'); return !!r && !/\bjurnal\b|\bAP\b|ledger|hutang usaha/i.test(r.innerText); }));
  await shot('01-simulator-5-layar');

  console.log('C. Skenario MRF — klik tombol ASLI di layar role, terlihat di semua layar');
  await p.selectOption('#dx-sc', 'MRF'); // choosing a scenario starts it (same as the Mulai button)
  await wait(2500);
  ok('Skenario dimulai pada sandbox yang di-reset (langkah 1 = Staff)', await S(() => { const c = HAWK.dx.current(HAWK.store.state); return c && c.sc.id === 'MRF' && c.step.id === 'MRF-01' && c.step.as === 'U-STF'; }));
  await p.click('#dx-run'); // MRF-01 through the tutor (same op as the form)
  await wait(1500);
  const mrf = await S(() => HAWK.store.state.dx.vars.mrf);
  ok('MRF-01 selesai, nomor MRF terikat ke skenario', !!mrf && (await S(() => HAWK.store.state.dx.steps['MRF-01'].result)) === 'DONE', mrf);
  // MRF-02: Supervisor approves with the REAL button in the iPad frame
  const spv = await frameOf('SUPERVISOR');
  await spv.evaluate((m) => { HAWK.go(29, { mrf: m }); HAWK.render(); }, mrf);
  await wait(500);
  const sel = `[data-a="decide"][data-d="APPROVE"][data-m="${mrf}"]`;
  ok('Tooltip menyorot kontrol asli (target ID stabil) di layar Supervisor', await S(() => HAWK.dxCenter.focusStep(HAWK.dx.current(HAWK.store.state).step, true)) && (await (await frameOf('SUPERVISOR')).evaluate(() => !!document.querySelector('.dx-hl[data-dx-target="dx-mrf-approve"]') && !!document.querySelector('.dx-tip'))));
  const spv2 = await frameOf('SUPERVISOR');
  await spv2.click(sel);
  await wait(400);
  if (await spv2.$('.modal [data-ok], .modal .btn.gold, .modal .btn.ok')) await spv2.click('.modal [data-ok], .modal .btn.gold, .modal .btn.ok');
  await wait(1500);
  const det = await S(() => HAWK.store.state.dx.steps['MRF-02']);
  ok('Klik asli di layar Supervisor terdeteksi tutor (via UI) dan langkah maju', det && det.result === 'DONE' && det.via === 'UI', JSON.stringify(det));
  const status = await S((m) => HAWK.store.state.mrfs.find((x) => x.id === m).status, mrf);
  const seen = {};
  for (const key of Object.keys(want)) {
    const f = await frameOf(key);
    seen[key] = await f.evaluate((m) => HAWK.store.state.mrfs.find((x) => x.id === m).status, mrf);
  }
  ok('Satu aksi → state yang sama di kelima layar (Finance, Purchasing, BU Manager, Supervisor, Staff)', Object.values(seen).every((v) => v === status && v !== 'SUBMITTED'), JSON.stringify(seen));
  ok('Feed aktivitas bersama mencatat aksi tersebut', await S((m) => (document.querySelector('.dx-feed') || {}).innerText.includes(m), mrf));
  ok('Staff mobile melihat status MRF-nya (NV-27) tanpa reload', await (await frameOf('STAFF')).evaluate(async (m) => { location.hash = '#/nv/27'; HAWK.render(); await new Promise((r) => setTimeout(r, 300)); return document.querySelector('#view').innerText.includes(m); }, mrf));
  await shot('02-klik-asli-terlihat-di-semua-layar');

  console.log('D. Maksimalkan, BLOCKED, verdict, export');
  await p.click('[data-dx="max"][data-cell="SUPERVISOR"]');
  await wait(300);
  ok('Tombol maksimalkan memperbesar satu layar', await S(() => document.querySelector('.dx-cell[data-cell="SUPERVISOR"]').classList.contains('max')));
  await shot('03-maksimal-supervisor');
  await p.click('[data-dx="max"][data-cell="SUPERVISOR"]');
  await wait(200);
  ok('BLOCKED tanpa catatan ditolak oleh kontrak', await S(() => !HAWK.api.call('dx.step', { step: HAWK.dx.current(HAWK.store.state).step.id, result: 'BLOCKED' }, HAWK.store.state.users.find((u) => u.id === 'U-OWN')).ok));
  await p.click('[data-dx="verdict"][data-v="PASS"]');
  await wait(300);
  ok('Hasil uji PASS tercatat', await S(() => HAWK.store.state.dx.verdict && HAWK.store.state.dx.verdict.verdict === 'PASS'));
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.click('[data-dx="export"]')]);
  let rep = null;
  if (dl) { const fp = path.join(shotDir, 'uat-report.json'); await dl.saveAs(fp); rep = JSON.parse(fs.readFileSync(fp, 'utf8')); fs.unlinkSync(fp); }
  ok('Export laporan UAT JSON (langkah, role, layar, target, hasil, bukti)', rep && rep.scenario === 'MRF' && rep.steps.length === 16 && rep.steps[1].via === 'UI' && rep.steps[1].target === 'dx-mrf-approve', rep ? JSON.stringify(rep.steps[1]) : 'no download');

  console.log('E. Enam skenario lewat tutor — setiap target ditemukan di layar asli role-nya');
  const summary = {};
  for (const sc of ['MRF', 'NOTA', 'SLA', 'BUDGET', 'ASSET', 'OFFICE']) {
    await S((id) => HAWK.dxCenter.startScenario(id), sc);
    await wait(1500);
    const missing = [];
    let n = 0;
    for (let k = 0; k < 20; k++) {
      const st = await S(async () => {
        const c = HAWK.dx.current(HAWK.store.state);
        if (!c || c.done) return null;
        const found = await HAWK.dxCenter.focusStep(c.step, true);
        return { id: c.step.id, found };
      });
      if (!st) break;
      if (!st.found) missing.push(st.id);
      const r = await S(async () => { const id = HAWK.dx.current(HAWK.store.state).step.id; await HAWK.dxCenter.runCurrent(); const x = HAWK.store.state.dx.steps[id]; return !!x && ['DONE', 'REVIEWED'].includes(x.result); });
      await wait(400);
      n++;
      if (!r) { missing.push(st.id + '(run)'); break; }
    }
    const end = await S(() => { const c = HAWK.dx.current(HAWK.store.state); const steps = Object.values(HAWK.store.state.dx.steps); return { done: c && c.done, total: c && c.sc.steps.length, ok: steps.filter((x) => ['DONE', 'REVIEWED'].includes(x.result)).length }; });
    const bal = await S(() => HAWK.store.state.journals.every((j) => Math.abs(j.lines.reduce((a, l) => a + l.dr - l.cr, 0)) < 1));
    summary[sc] = end;
    ok(`${sc}: ${end.ok}/${end.total} langkah selesai, semua target ditemukan, jurnal seimbang`, end.done && end.ok === end.total && !missing.length && bal, 'missing=' + missing.join() + ' ' + JSON.stringify(end));
  }
  await shot('04-office-terkunci');

  console.log('F. Option 1 — Scenario Test Lab, login role & ganti device');
  await p.click('[data-dx="mode"][data-mode="lab"]');
  await wait(800);
  await p.click('[data-dx="as"][data-u="U-FIN"]');
  await wait(1500);
  const lab = await frameOf('lab');
  ok('Login role DEMO satu klik: Finance membuka workspace lengkap', (await lab.evaluate(() => HAWK.currentUser().id)) === 'U-FIN');
  const finNav = await lab.evaluate(() => document.querySelectorAll('#nav a[href^="#/nv/"]').length);
  await p.click('[data-dx="as"][data-u="U-STF"]');
  await wait(1500);
  const stfNav = await (await frameOf('lab')).evaluate(() => document.querySelectorAll('#nav a[href^="#/nv/"]').length);
  ok('Navigasi sesuai porsi role: Staff jauh lebih ringkas dari Finance', finNav > stfNav, `fin=${finNav} stf=${stfNav}`);
  for (const d of ['mobile', 'ipad', 'desktop']) {
    await p.click(`[data-dx="labdev"][data-d="${d}"]`);
    await wait(400);
    const w = await S(() => parseInt(document.querySelector('.dx-cell[data-cell="lab"] iframe').style.width, 10));
    ok(`Ganti device lab → ${d} (${w}px)`, w === { mobile: 390, ipad: 834, desktop: 1280 }[d]);
  }
  await shot('05-test-lab');

  console.log('G. Reset demo');
  await S(() => HAWK.dxCenter.startScenario('MRF'));
  await wait(1500);
  ok('Mulai ulang = reset sandbox: langkah kembali ke 1 dan data skenario lama hilang', await S(() => { const c = HAWK.dx.current(HAWK.store.state); return c.step.id === 'MRF-01' && Object.keys(HAWK.store.state.dx.steps).length === 0; }));

  console.log('H. Responsif — HP / iPad / desktop');
  for (const [name, vp] of [['mobile', { width: 390, height: 844 }], ['ipad', { width: 834, height: 1112 }], ['desktop', { width: 1440, height: 900 }]]) {
    await p.setViewportSize(vp);
    await wait(600);
    const ov = await S(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(`${name}: tidak ada scroll horizontal halaman (${ov}px)`, ov <= 1);
    await shot('06-responsif-' + name);
  }

  ok('0 error halaman / console', !errs.length, errs.slice(0, 5).join(' | '));
  const pass = results.filter((r) => r.ok).length;
  fs.writeFileSync(path.join(__dirname, 'e2e-demo-center-results.json'), JSON.stringify({ at: new Date().toISOString(), pass, fail: results.length - pass, summary, results }, null, 2));
  console.log(`\n${pass} lulus, ${results.length - pass} gagal`);
  await b.close();
  server.close();
  process.exit(results.length - pass ? 1 : 0);
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
