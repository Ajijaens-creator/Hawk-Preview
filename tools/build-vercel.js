/* Assembles the upload-ready Vercel package (no GitHub, no build step on Vercel).
   Usage: node tools/build-vercel.js   → release/HAWK_JAENS_60NV_VERCEL_READY/
     public/          the production build (= dist/ from tools/build.js): index.html + assets, hashed, noindex
     middleware.js    login (HTTP Basic Auth from env PREVIEW_CREDENTIALS), fails closed with 503
     package.json     only the middleware helper @vercel/functions (pinned); no build script
     vercel.json      output = public, security headers (same CSP as the build)
     DEPLOY_VERCEL.md short deploy guide */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const name = 'HAWK_JAENS_60NV_VERCEL_READY';
const out = path.join(root, 'release', name);

execFileSync('node', [path.join(root, 'tools/build.js')], { stdio: 'inherit' });
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(root, 'dist'), path.join(out, 'public'), { recursive: true });
['_headers', '_redirects'].forEach((f) => fs.rmSync(path.join(out, 'public', f), { force: true })); // Cloudflare-only files
fs.copyFileSync(path.join(root, 'middleware.js'), path.join(out, 'middleware.js'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
fs.writeFileSync(path.join(out, 'package.json'), JSON.stringify({ name: 'hawk-jaens-60nv-preview', version: pkg.version, private: true, type: 'module', description: 'HAWK × JAENS 60 NV prototype — static build (DEMO data, Mock adapter) + login middleware', license: 'UNLICENSED', dependencies: pkg.dependencies }, null, 2) + '\n');
const vj = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
delete vj.buildCommand;
delete vj.installCommand;
vj.outputDirectory = 'public';
fs.writeFileSync(path.join(out, 'vercel.json'), JSON.stringify(vj, null, 2) + '\n');
fs.copyFileSync(path.join(root, 'docs/DEPLOY_VERCEL.md'), path.join(out, 'DEPLOY_VERCEL.md'));
fs.writeFileSync(path.join(out, '.vercelignore'), 'DEPLOY_VERCEL.md\n');
console.log('Paket Vercel siap: release/' + name);
