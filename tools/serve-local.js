/* Local production preview: serves dist/ with the SAME Basic Auth middleware and security headers
   used on Cloudflare Pages, so the protected build can be checked before deploying.
   Usage:  PREVIEW_CREDENTIALS="demo:ganti-password-ini" node tools/serve-local.js [port]
   Without PREVIEW_CREDENTIALS the server answers 503 (fails closed), exactly like production. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const port = +(process.argv[2] || process.env.PORT || 8788);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

function parseHeadersFile() {
  // minimal parser for Cloudflare _headers (path pattern + indented "Key: value")
  const rules = [];
  let cur = null;
  for (const line of fs.readFileSync(path.join(dist, '_headers'), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) rules.push((cur = { pat: line.trim(), h: {} }));
    else if (cur) { const i = line.indexOf(':'); cur.h[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  }
  return rules;
}

(async () => {
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    console.error('dist/ belum ada — jalankan: node tools/build.js');
    process.exit(1);
  }
  const mw = await import(path.join(__dirname, '..', 'functions', '_middleware.js'));
  const rules = parseHeadersFile();
  http
    .createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
      const request = new Request(url, { headers: req.headers });
      const nextFn = async () => {
        let rel = decodeURIComponent(url.pathname);
        if (rel === '/' || rel === '') rel = '/index.html';
        const file = path.normalize(path.join(dist, rel));
        if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory() || path.basename(file).startsWith('_')) return new Response('Not found', { status: 404 });
        const h = { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' };
        rules.forEach((r) => { if (r.pat === '/*' || (r.pat.endsWith('/*') && url.pathname.startsWith(r.pat.slice(0, -1)))) Object.assign(h, r.h); });
        return new Response(fs.readFileSync(file), { status: 200, headers: h });
      };
      const out = await mw.onRequest({ request, env: process.env, next: nextFn });
      res.writeHead(out.status, Object.fromEntries(out.headers.entries()));
      res.end(Buffer.from(await out.arrayBuffer()));
    })
    .listen(port, () => console.log(`Preview terlindungi: http://localhost:${port}  (${process.env.PREVIEW_CREDENTIALS ? 'login aktif' : 'PREVIEW_CREDENTIALS kosong → 503'})`));
})();
