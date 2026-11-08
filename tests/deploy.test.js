/* Deployment-readiness tests (no network): build output, access control of BOTH middlewares
   (Cloudflare Pages + Vercel), header parity, and the protected build running under the strict CSP.
   Usage: node tests/deploy.test.js      (browser part runs when Playwright is installed) */
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync, spawn } = require('child_process');
const root = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ok = (n, c, info) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || !info ? '' : ' — ' + info)); };
const b64 = (s) => Buffer.from(s).toString('base64');
// Kredensial DUMMY khusus tes lokal — bukan password nyata, tidak dipakai di deployment.
const CRED = 'aji:Preview-Demo-2026!,devhawk:Another-Strong-Pass';

(async () => {
  console.log('Build');
  execFileSync('node', [path.join(root, 'tools/build.js')], { stdio: 'pipe' });
  const dist = path.join(root, 'dist');
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  ok('dist/index.html tanpa inline script (CSP script-src self)', !/<script>(?!<\/script>)/.test(html) && html.includes('assets/js/boot.js?v='));
  const refs = [...html.matchAll(/(?:src|href)="(assets\/[^"?]+)\?v=/g)].map((m) => m[1]);
  ok('Semua 28 aset (CSS + 27 JS) direferensikan & ada di dist', refs.length === 28 && refs.every((r) => fs.existsSync(path.join(dist, r))), refs.length);
  ok('noindex meta + robots.txt', html.includes('noindex') && fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8').includes('Disallow: /'));
  ok('Tidak ada URL eksternal di build', !/https?:\/\//.test(html + fs.readFileSync(path.join(dist, 'assets/css/hawk.css'), 'utf8')));
  ok('Tidak ada kredensial di source/build', !/PREVIEW_CREDENTIALS\s*=\s*"[^"<]/.test(fs.readFileSync(path.join(root, 'wrangler.toml'), 'utf8')) && !fs.readFileSync(path.join(root, 'vercel.json'), 'utf8').includes('PREVIEW_CREDENTIALS'));
  const { CSP } = require(path.join(root, 'tools/build.js'));
  const vj = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  ok('CSP Vercel = CSP Cloudflare _headers', vj.headers[0].headers.find((h) => h.key === 'Content-Security-Policy').value === CSP && fs.readFileSync(path.join(dist, '_headers'), 'utf8').includes(CSP));
  ok('vercel.json: build → dist', vj.buildCommand === 'node tools/build.js' && vj.outputDirectory === 'dist');

  console.log('Paket Vercel tanpa GitHub (release/HAWK_JAENS_60NV_VERCEL_READY)');
  execFileSync('node', [path.join(root, 'tools/build-vercel.js')], { stdio: 'pipe' });
  const rel = path.join(root, 'release/HAWK_JAENS_60NV_VERCEL_READY');
  const rvj = JSON.parse(fs.readFileSync(path.join(rel, 'vercel.json'), 'utf8'));
  const rpk = JSON.parse(fs.readFileSync(path.join(rel, 'package.json'), 'utf8'));
  ok('Vercel-ready: output = public, tanpa build command, tanpa script build', rvj.outputDirectory === 'public' && !rvj.buildCommand && !(rpk.scripts && rpk.scripts.build));
  { const rc = ['blurry', 'duplicate', 'emergency', 'handwritten', 'overbudget', 'po-invoice', 'printed', 'reimburse', 'unpaid'].map((k) => 'assets/img/receipts/' + k + '.svg');
    ok('9 nota contoh DEMO ikut di dist & paket Vercel', rc.every((r) => fs.existsSync(path.join(dist, r)) && fs.existsSync(path.join(rel, 'public', r)))); }
  ok('Vercel-ready: public/ = build dist (index + 28 aset)', fs.readFileSync(path.join(rel, 'public/index.html'), 'utf8') === fs.readFileSync(path.join(dist, 'index.html'), 'utf8') && refs.every((r) => fs.existsSync(path.join(rel, 'public', r))));
  ok('Vercel-ready: middleware sama dengan source, runtime nodejs, CSP sama', fs.readFileSync(path.join(rel, 'middleware.js'), 'utf8') === fs.readFileSync(path.join(root, 'middleware.js'), 'utf8') && /runtime: 'nodejs'/.test(fs.readFileSync(path.join(rel, 'middleware.js'), 'utf8')) && rvj.headers[0].headers.find((h) => h.key === 'Content-Security-Policy').value === CSP);
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const leak = walk(rel).filter((f) => /\.(js|json|html|css|md)$/.test(f)).filter((f) => /(api[_-]?key|secret[_-]?key|sk-[A-Za-z0-9]{16}|password\s*[:=]\s*["'][^"'<]{6,}|@gmail\.com|supabase\.co)/i.test(fs.readFileSync(f, 'utf8')));
  ok('Vercel-ready: tidak ada API key / password / email / URL database', !leak.length, leak.join());

  console.log('Access control — Cloudflare Pages middleware');
  const cf = await import(path.join(root, 'functions/_middleware.js'));
  const nextOk = async () => new Response('APP', { status: 200 });
  const run = (env, auth, p = '/') => cf.onRequest({ request: new Request('https://preview.hawk.jaens.id' + p, { headers: auth ? { authorization: auth } : {} }), env, next: nextOk });
  ok('Tanpa konfigurasi → 503 (fail closed)', (await run({}, 'Basic ' + b64('aji:Preview-Demo-2026!'))).status === 503);
  ok('Password < 12 karakter diabaikan → 503', (await run({ PREVIEW_CREDENTIALS: 'aji:pendek' }, 'Basic ' + b64('aji:pendek'))).status === 503);
  const r401 = await run({ PREVIEW_CREDENTIALS: CRED });
  ok('Tanpa login → 401 + WWW-Authenticate', r401.status === 401 && /Basic realm=/.test(r401.headers.get('www-authenticate')));
  ok('Password salah → 401', (await run({ PREVIEW_CREDENTIALS: CRED }, 'Basic ' + b64('aji:salah-password-nya'))).status === 401);
  ok('Header rusak → 401', (await run({ PREVIEW_CREDENTIALS: CRED }, 'Basic %%%')).status === 401);
  const r200 = await run({ PREVIEW_CREDENTIALS: CRED }, 'Basic ' + b64('devhawk:Another-Strong-Pass'));
  ok('Login benar (user ke-2) → 200 + no-store + noindex', r200.status === 200 && r200.headers.get('cache-control') === 'private, no-store' && r200.headers.get('x-robots-tag').includes('noindex'));
  ok('Aset juga dilindungi', (await run({ PREVIEW_CREDENTIALS: CRED }, null, '/assets/js/core/seed.js')).status === 401);
  ok('Password dengan ":" didukung', (await run({ PREVIEW_CREDENTIALS: 'aji:a:b:c-strong-pw' }, 'Basic ' + b64('aji:a:b:c-strong-pw'))).status === 200);

  console.log('Access control — Vercel middleware');
  let vm = null;
  try {
    vm = await import(path.join(root, 'middleware.js'));
  } catch (e) {
    console.log('  (lewati: @vercel/functions belum ter-install — jalankan npm install) ' + e.message.split('\n')[0]);
  }
  if (vm) {
    const vrun = (cred, auth) => { process.env.PREVIEW_CREDENTIALS = cred || ''; return vm.default(new Request('https://preview.hawk.jaens.id/', { headers: auth ? { authorization: auth } : {} })); };
    ok('Vercel: tanpa konfigurasi → 503', vrun('', 'Basic ' + b64('aji:Preview-Demo-2026!')).status === 503);
    ok('Vercel: tanpa login → 401', vrun(CRED).status === 401);
    const v = vrun(CRED, 'Basic ' + b64('aji:Preview-Demo-2026!'));
    ok('Vercel: login benar → lanjut (x-middleware-next)', v.headers.get('x-middleware-next') === '1');
    ok('Vercel & Cloudflare memakai logika auth yang sama', vm.parseCredentials(CRED).length === cf.parseCredentials(CRED).length && vm.checkAuth('Basic ' + b64('aji:x'), vm.parseCredentials(CRED)) === false);
    process.env.PREVIEW_PUBLIC = 'true';
    ok('Vercel: PREVIEW_PUBLIC=true → terbuka tanpa login, tetap noindex', (() => { const r = vrun('', null); return r.headers.get('x-middleware-next') === '1' && JSON.stringify([...r.headers]).includes('noindex'); })());
    process.env.PREVIEW_PUBLIC = '1';
    ok('Vercel: PREVIEW_PUBLIC selain "true" → tetap terkunci', vrun(CRED, null).status === 401);
    delete process.env.PREVIEW_PUBLIC;
    delete process.env.PREVIEW_CREDENTIALS;
  }

  console.log('Build terlindungi di browser (server lokal + CSP + login)');
  let pw = null;
  try { pw = require('playwright'); } catch (e) { console.log('  (lewati: Playwright tidak tersedia)'); }
  if (pw) {
    const port = 8799;
    const srv = spawn('node', [path.join(root, 'tools/serve-local.js'), String(port)], { env: { ...process.env, PREVIEW_CREDENTIALS: CRED }, stdio: 'pipe' });
    await new Promise((r) => setTimeout(r, 800));
    const b = await pw.chromium.launch();
    try {
      const anon = await (await b.newContext()).newPage();
      const resp = await anon.goto(`http://localhost:${port}/`);
      ok('Browser tanpa login → 401', resp.status() === 401);
      for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['iPad', { width: 820, height: 1180 }], ['mobile', { width: 390, height: 844 }]]) {
        const ctx = await b.newContext({ viewport: vp, httpCredentials: { username: 'aji', password: 'Preview-Demo-2026!' } });
        const p = await ctx.newPage();
        const errs = [];
        p.on('pageerror', (e) => errs.push(e.message));
        p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
        const r = await p.goto(`http://localhost:${port}/`);
        await p.waitForTimeout(500);
        const st = await p.evaluate(() => ({ screens: (window.HAWK && HAWK.SCREENS || []).length, view: !!document.querySelector('#view .page-head'), csp: document.querySelector('meta[name="robots"]') && 1, over: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }));
        await p.evaluate(() => { location.hash = '#/nv/23'; });
        await p.waitForTimeout(250);
        const nv23 = await p.$eval('#view', (v) => /Budget vs Actual/.test(v.innerText));
        const bad = [];
        p.on('response', (x) => x.status() >= 400 && bad.push(x.status() + ' ' + x.url()));
        await p.reload();
        await p.waitForTimeout(400);
        const afterReload = await p.evaluate(() => location.hash === '#/nv/23' && /Budget vs Actual/.test(document.querySelector('#view').innerText));
        ok(`${name}: refresh di #/nv/23 tetap di layar yang sama, 0 aset gagal dimuat`, afterReload && !bad.length, bad.join(' | '));
        ok(`${name} ${vp.width}px: login → app 62 NV jalan, tanpa error CSP/JS, tanpa overflow`, r.status() === 200 && st.screens === 62 && st.view && nv23 && !st.over && !errs.length, JSON.stringify(st) + errs.join(' | '));
        await ctx.close();
      }
    } finally {
      await b.close();
      srv.kill();
    }
  }
  console.log(`\n${pass} lulus, ${fail} gagal`);
  fs.writeFileSync(path.join(__dirname, 'deploy-results.json'), JSON.stringify({ pass, fail }, null, 1));
  process.exit(fail ? 1 : 0);
})();
