/* Production build for independent hosting (Vercel / Cloudflare Pages / any static host).
   Usage: node tools/build.js          → dist/
   - Copies index.html + assets/ unchanged in behaviour (same 60 NV app, DEMO data, Mock adapter)
   - Cache-busts every CSS/JS URL with a content hash (?v=xxxxxxxx)
   - Moves the inline boot call to assets/js/boot.js so the CSP needs no 'unsafe-inline' for scripts
   - Adds noindex + build stamp, writes Cloudflare Pages _headers/_redirects and build-manifest.json
   No dependencies; Node ≥ 18. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const DOMAIN = process.env.PREVIEW_DOMAIN || 'preview.hawk.jaens.id';
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
module.exports = { CSP };
if (require.main === module) build();

function build() {

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const copyDir = (src, dst) => {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
};
copyDir(path.join(root, 'assets'), path.join(dist, 'assets'));
fs.writeFileSync(path.join(dist, 'assets/js/boot.js'), "/* boot (moved out of index.html for a strict CSP) */\nwindow.HAWK.boot();\n");

const hash = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(dist, rel))).digest('hex').slice(0, 8);
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const inlineBoot = /<script>\s*HAWK\.boot\(\);\s*<\/script>/;
if (!inlineBoot.test(html)) throw new Error('index.html: inline HAWK.boot() not found — update tools/build.js');
html = html.replace(inlineBoot, '<script src="assets/js/boot.js"></script>');
const files = [];
html = html.replace(/(href|src)="(assets\/[^"?]+)"/g, (m, attr, rel) => {
  if (!fs.existsSync(path.join(dist, rel))) throw new Error('Missing asset referenced by index.html: ' + rel);
  const h = hash(rel);
  files.push({ file: rel, sha256_8: h });
  return `${attr}="${rel}?v=${h}"`;
});
const built = new Date().toISOString();
html = html.replace('<meta name="viewport"', '<meta name="robots" content="noindex, nofollow">\n<meta name="hawk-build" content="' + built + '">\n<meta name="viewport"');
fs.writeFileSync(path.join(dist, 'index.html'), html);
fs.writeFileSync(path.join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

/* Security headers — identical policy is also declared in vercel.json (tests/deploy.test.js checks they match) */
fs.writeFileSync(
  path.join(dist, '_headers'),
  `/*\n  Content-Security-Policy: ${CSP}\n  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n  Strict-Transport-Security: max-age=31536000\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-cache\n/assets/*\n  Cache-Control: private, max-age=31536000, immutable\n`
);
fs.writeFileSync(path.join(dist, '_redirects'), '/index.html / 301\n');

fs.writeFileSync(
  path.join(dist, 'build-manifest.json'),
  JSON.stringify({ app: 'HAWK × JAENS Interactive ERP Prototype', screens: 60, modules: 'A–J', data: 'DEMO / SIMULASI', adapter: 'MOCK (HAWK API = NOT_CONNECTED)', intendedDomain: DOMAIN, builtAt: built, files }, null, 1)
);
const size = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((a, e) => a + (e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`dist/ siap: ${files.length} aset ber-hash, ${(size(dist) / 1024).toFixed(0)} KB, domain tujuan ${DOMAIN}`);
}
